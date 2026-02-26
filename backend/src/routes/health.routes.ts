import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { scraperQueue, notificationQueue } from '../config/bullmq.js';
import { sendSuccess } from '../utils/responses.util.js';

const router = Router();

// GET /api/health - Health check
router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, unknown> = {
    api: 'ok',
    database: 'unknown',
    redis: 'unknown',
    queues: 'unknown',
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }
  } else {
    checks.redis = 'not_configured';
  }

  try {
    const [scraperActive, scraperWaiting, scraperFailed] = await Promise.all([
      scraperQueue.getActiveCount(),
      scraperQueue.getWaitingCount(),
      scraperQueue.getFailedCount(),
    ]);
    const [notifActive, notifWaiting, notifFailed] = await Promise.all([
      notificationQueue.getActiveCount(),
      notificationQueue.getWaitingCount(),
      notificationQueue.getFailedCount(),
    ]);
    checks.queues = {
      scraper: { active: scraperActive, waiting: scraperWaiting, failed: scraperFailed },
      notifications: { active: notifActive, waiting: notifWaiting, failed: notifFailed },
    };
  } catch {
    checks.queues = 'error';
  }

  const allOk = checks.database === 'ok' && (checks.redis === 'ok' || checks.redis === 'not_configured');
  const status = allOk ? 200 : 503;

  res.status(status).json({
    success: allOk,
    data: checks,
  });
});

// GET /api/health/ready - Readiness probe
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (redis) {
      await redis.ping();
    }
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

// GET /api/health/stats - Public statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalDetections,
      prefectureCount,
      activeUserCount,
      recentDetections,
    ] = await Promise.all([
      prisma.detection.count(),
      prisma.prefecture.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ 
        where: { 
          plan: { not: 'NONE' },
          planExpiresAt: { gt: new Date() },
        } 
      }),
      prisma.detection.count({
        where: {
          detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    sendSuccess(res, {
      appointmentsDetected: totalDetections,
      prefecturesMonitored: prefectureCount,
      activeUsers: activeUserCount,
      detectionsLast24h: recentDetections,
    });
  } catch {
    // Return zeros if database not ready
    sendSuccess(res, {
      appointmentsDetected: 0,
      prefecturesMonitored: 0,
      activeUsers: 0,
      detectionsLast24h: 0,
    });
  }
});

export default router;
