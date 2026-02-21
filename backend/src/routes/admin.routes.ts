import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { validateQuery, validateBody, validateParams } from '../middleware/validation.middleware.js';
import {
  userListQuerySchema,
  userUpdateSchema,
  prefectureListQuerySchema,
  prefectureUpdateSchema,
  paymentsQuerySchema,
  logsQuerySchema,
  uuidParamSchema,
} from '../validators/admin.validator.js';
import { scraperQueue, notificationQueue } from '../config/bullmq.js';
import { sendSuccess, sendError } from '../utils/responses.util.js';
import logger from '../utils/logger.util.js';
import { testPrefectureScraper } from '../scraper/base.scraper.js';
import { getPrefectureConfig } from '../scraper/prefectures/index.js';
import { getDashboardStats } from '../services/admin-dashboard.service.js';
import { triggerManualRefund, checkRefundEligibility } from '../services/refund-guarantee.service.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ──────────────────────────────────────
// GET /api/admin/dashboard - Overview stats (optimized)
// Uses 3 raw SQL queries instead of 12 parallel Prisma queries
// ──────────────────────────────────────
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Get optimized dashboard stats (cached for 30s)
    const dashboardData = await getDashboardStats();

    // Get BullMQ queue stats separately (not cached - needs real-time)
    let queueStats = { active: 0, waiting: 0, failed: 0 };
    try {
      const [active, waiting, failed] = await Promise.all([
        scraperQueue.getActiveCount(),
        scraperQueue.getWaitingCount(),
        scraperQueue.getFailedCount(),
      ]);
      queueStats = { active, waiting, failed };
    } catch {
      // Queue may not be available
    }

    // Merge queue stats with dashboard data
    sendSuccess(res, {
      ...dashboardData,
      scraper: {
        ...dashboardData.scraper,
        queueStats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/users - Paginated user list
// ──────────────────────────────────────
router.get('/users', validateQuery(userListQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, plan: planFilter, sortBy, sortOrder } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      plan?: string;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    };

    const where: Record<string, unknown> = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (planFilter && planFilter !== 'ALL') {
      where.plan = planFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          plan: true,
          planExpiresAt: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { alerts: true, payments: true, notifications: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/users/:id - User detail
// ──────────────────────────────────────
router.get('/users/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        email: true,
        phone: true,
        telegramChatId: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        stripeCustomerId: true,
        emailVerified: true,
        notifyEmail: true,
        notifyTelegram: true,
        notifySms: true,
        notifyFcm: true,
        createdAt: true,
        updatedAt: true,
        alerts: {
          select: {
            id: true,
            prefectureId: true,
            procedure: true,
            isActive: true,
            slotsFound: true,
            createdAt: true,
            prefecture: { select: { name: true, department: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        payments: {
          select: {
            id: true,
            plan: true,
            amount: true,
            status: true,
            createdAt: true,
            paidAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { alerts: true, payments: true, notifications: true } },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// PATCH /api/admin/users/:id - Update user
// ──────────────────────────────────────
router.patch('/users/:id', validateParams(uuidParamSchema), validateBody(userUpdateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { plan, planExpiresAt, role } = req.body;
    const data: Record<string, unknown> = {};

    if (plan !== undefined) data.plan = plan;
    if (planExpiresAt !== undefined) data.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
    if (role !== undefined) data.role = role;

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        planExpiresAt: true,
      },
    });

    logger.info(`Admin ${req.user!.email} updated user ${user.email}: ${JSON.stringify(data)}`);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/prefectures - All prefectures with stats
// ──────────────────────────────────────
router.get('/prefectures', validateQuery(prefectureListQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status: statusFilter } = req.query as { status?: string };
    const where: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    const prefectures = await prisma.prefecture.findMany({
      where,
      select: {
        id: true,
        name: true,
        department: true,
        region: true,
        tier: true,
        status: true,
        checkInterval: true,
        lastScrapedAt: true,
        lastSlotFoundAt: true,
        consecutiveErrors: true,
        bookingUrl: true,
        _count: { select: { alerts: true, detections: true } },
      },
      orderBy: [{ tier: 'asc' }, { consecutiveErrors: 'desc' }],
    });

    sendSuccess(res, prefectures);
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// PATCH /api/admin/prefectures/:id - Update prefecture
// ──────────────────────────────────────
router.patch('/prefectures/:id', validateBody(prefectureUpdateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, checkInterval, selectors, consecutiveErrors } = req.body;
    const data: Record<string, unknown> = {};

    if (status !== undefined) data.status = status;
    if (checkInterval !== undefined) data.checkInterval = checkInterval;
    if (selectors !== undefined) data.selectors = selectors;
    if (consecutiveErrors !== undefined) data.consecutiveErrors = consecutiveErrors;

    const prefecture = await prisma.prefecture.update({
      where: { id: req.params.id as string },
      data,
      select: {
        id: true,
        name: true,
        status: true,
        checkInterval: true,
        consecutiveErrors: true,
      },
    });

    logger.info(`Admin ${req.user!.email} updated prefecture ${prefecture.name}: ${JSON.stringify(data)}`);
    sendSuccess(res, prefecture);
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// POST /api/admin/prefectures/:id/test - Test scraper for a prefecture
// ──────────────────────────────────────
router.post('/prefectures/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefectureId = req.params.id as string;
    
    // Get prefecture config
    const config = getPrefectureConfig(prefectureId);
    if (!config) {
      sendError(res, `Prefecture config not found for ID: ${prefectureId}`, 404);
      return;
    }

    logger.info(`Admin ${req.user!.email} triggered test scraper for ${config.name}`);
    
    // Run the scraper test
    const result = await testPrefectureScraper(config);
    
    // Log the result
    await prisma.scraperLog.create({
      data: {
        prefectureId: config.id,
        workerId: 'admin-test',
        status: result.status,
        responseTimeMs: result.responseTimeMs || 0,
        slotsFound: result.slotsAvailable || 0,
        errorMessage: result.errorMessage,
        screenshotPath: result.screenshotPath,
      },
    });
    
    sendSuccess(res, {
      prefectureId: config.id,
      prefectureName: config.name,
      result: {
        status: result.status,
        slotsAvailable: result.slotsAvailable,
        slotDate: result.slotDate,
        slotTime: result.slotTime,
        bookingUrl: result.bookingUrl,
        errorMessage: result.errorMessage,
        responseTimeMs: result.responseTimeMs,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/scraper/status - Queue stats
// ──────────────────────────────────────
router.get('/scraper/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let scraperStats = { active: 0, waiting: 0, delayed: 0, failed: 0, completed: 0 };
    let notifStats = { active: 0, waiting: 0, failed: 0 };

    try {
      const [sActive, sWaiting, sDelayed, sFailed, sCompleted] = await Promise.all([
        scraperQueue.getActiveCount(),
        scraperQueue.getWaitingCount(),
        scraperQueue.getDelayedCount(),
        scraperQueue.getFailedCount(),
        scraperQueue.getCompletedCount(),
      ]);
      scraperStats = { active: sActive, waiting: sWaiting, delayed: sDelayed, failed: sFailed, completed: sCompleted };

      const [nActive, nWaiting, nFailed] = await Promise.all([
        notificationQueue.getActiveCount(),
        notificationQueue.getWaitingCount(),
        notificationQueue.getFailedCount(),
      ]);
      notifStats = { active: nActive, waiting: nWaiting, failed: nFailed };
    } catch {
      // Queue may not be available
    }

    // Recent failed jobs
    let recentFailed: Array<Record<string, unknown>> = [];
    try {
      const failedJobs = await scraperQueue.getFailed(0, 20);
      recentFailed = failedJobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade,
      }));
    } catch {
      // Ignore
    }

    sendSuccess(res, {
      queues: {
        scraper: scraperStats,
        notifications: notifStats,
      },
      recentFailed,
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// POST /api/admin/scraper/retry/:jobId - Retry failed job
// ──────────────────────────────────────
router.post('/scraper/retry/:jobId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await scraperQueue.getJob(req.params.jobId as string);

    if (!job) {
      sendError(res, 'Job not found', 404);
      return;
    }

    await job.retry();
    logger.info(`Admin ${req.user!.email} retried scraper job ${job.id}`);
    sendSuccess(res, { message: 'Job retried', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/payments - Paginated payments
// ──────────────────────────────────────
router.get('/payments', validateQuery(paymentsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status: statusFilter, startDate, endDate } = req.query as unknown as {
      page: number;
      limit: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    const where: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    const [payments, total, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
    ]);

    sendSuccess(res, {
      payments,
      summary: {
        totalRevenue: summary._sum.amount || 0,
        averageOrderValue: Math.round(summary._avg.amount || 0),
        totalPayments: summary._count,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/payments/stats - Revenue charts data
// ──────────────────────────────────────
router.get('/payments/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const revenueByPlan = await prisma.payment.groupBy({
      by: ['plan'],
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    const recentPayments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    sendSuccess(res, {
      revenueByPlan: revenueByPlan.map((r) => ({
        plan: r.plan,
        revenue: r._sum.amount || 0,
        count: r._count,
      })),
      recentPayments,
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/notifications/stats - Delivery stats
// ──────────────────────────────────────
router.get('/notifications/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [byChannel, last24h, recentFailures] = await Promise.all([
      prisma.notification.groupBy({
        by: ['channel', 'status'],
        _count: true,
      }),
      prisma.notification.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.notification.findMany({
        where: { status: 'FAILED' },
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Reshape channel stats
    const channelStats: Record<string, { sent: number; failed: number; pending: number }> = {};
    for (const entry of byChannel) {
      if (!channelStats[entry.channel]) {
        channelStats[entry.channel] = { sent: 0, failed: 0, pending: 0 };
      }
      if (entry.status === 'SENT') channelStats[entry.channel].sent = entry._count;
      if (entry.status === 'FAILED') channelStats[entry.channel].failed = entry._count;
      if (entry.status === 'PENDING') channelStats[entry.channel].pending = entry._count;
    }

    sendSuccess(res, {
      deliveryStats: {
        byChannel: channelStats,
        last24h,
      },
      recentFailures,
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/refunds/check/:userId - Check refund eligibility
// ──────────────────────────────────────
router.get('/refunds/check/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eligibility = await checkRefundEligibility(req.params.id as string);
    sendSuccess(res, eligibility);
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// POST /api/admin/refunds/process/:userId - Process manual refund
// ──────────────────────────────────────
router.post('/refunds/process/:id', validateParams(uuidParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body as { reason?: string };
    
    if (!reason || reason.trim().length === 0) {
      sendError(res, 'Reason is required for manual refund', 400);
      return;
    }
    
    const result = await triggerManualRefund(
      req.params.id as string,
      req.user!.id,
      reason.trim()
    );
    
    if (result.success) {
      sendSuccess(res, { message: result.message });
    } else {
      sendError(res, result.message, 400);
    }
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// POST /api/admin/refunds/batch - Process all eligible refunds
// ──────────────────────────────────────
router.post('/refunds/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Import the function here to avoid circular dependencies
    const { processBatchRefunds } = await import('../services/refund-guarantee.service.js');
    
    const result = await processBatchRefunds();
    
    logger.info(`Admin ${req.user!.email} triggered batch refund processing: ${result.totalProcessed} processed`);
    
    sendSuccess(res, {
      message: `Batch refund processing completed`,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

// ──────────────────────────────────────
// GET /api/admin/logs - Paginated scraper logs
// ──────────────────────────────────────
router.get('/logs', validateQuery(logsQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, prefectureId, status: statusFilter, startDate, endDate } = req.query as unknown as {
      page: number;
      limit: number;
      prefectureId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    const where: Record<string, unknown> = {};
    if (prefectureId) where.prefectureId = prefectureId;
    if (statusFilter) where.status = statusFilter;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      prisma.scraperLog.findMany({
        where,
        include: {
          prefecture: { select: { name: true, department: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.scraperLog.count({ where }),
    ]);

    sendSuccess(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
