import { Router } from 'express';
import { prisma } from '../config/database.js';
import { scraperQueue, autobookQueue } from '../config/bullmq.js';
import { analyticsService } from '../services/analytics.service.js';
import { websocketService } from '../services/websocket.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { getCategoryUrl } from '../config/prefecture-categories.config.js';
import logger from '../utils/logger.util.js';

const router = Router();

// All boss panel routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * Boss Panel API Routes
 * Private endpoints for the high-tech monitoring dashboard
 */

// Get all prefectures with live status
router.get('/prefectures', async (_req, res) => {
  try {
    const prefectures = await prisma.prefecture.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        department: true,
        region: true,
        tier: true,
        bookingUrl: true,
        lastScrapedAt: true,
        lastSlotFoundAt: true,
      },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });

    // Get latest detection for each prefecture
    const latestDetections = await prisma.detection.findMany({
      where: {
        prefectureId: { in: prefectures.map(p => p.id) },
      },
      orderBy: { detectedAt: 'desc' },
      distinct: ['prefectureId'],
      select: {
        prefectureId: true,
        slotDate: true,
        slotTime: true,
        slotsAvailable: true,
        detectedAt: true,
      },
    });

    const detectionMap = new Map(latestDetections.map(d => [d.prefectureId, d]));

    const enrichedPrefectures = prefectures.map(p => {
      const detection = detectionMap.get(p.id);
      return {
        ...p,
        latestSlot: detection || null,
        status: detection 
          ? (Date.now() - detection.detectedAt.getTime() < 3600000 ? 'hot' : 'warm')
          : 'cold',
      };
    });

    res.json(enrichedPrefectures);
  } catch (error) {
    logger.error('Error fetching prefectures:', error);
    res.status(500).json({ error: 'Failed to fetch prefectures' });
  }
});

// Get heat map data
router.get('/heatmap', async (_req, res) => {
  try {
    const heatmapData = await analyticsService.getHeatMapData();
    res.json(heatmapData);
  } catch (error) {
    logger.error('Error fetching heatmap:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
});

// Get live slot stream
router.get('/slot-stream', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const stream = await analyticsService.getSlotStream(limit);
    res.json(stream);
  } catch (error) {
    logger.error('Error fetching slot stream:', error);
    res.status(500).json({ error: 'Failed to fetch slot stream' });
  }
});

// Get predictive analytics for a prefecture
router.get('/predict/:prefectureId', async (req, res): Promise<void> => {
  try {
    const { prefectureId } = req.params;
    const prediction = await analyticsService.predictNextSlot(prefectureId);
    
    if (!prediction) {
      res.json({ 
        prediction: null,
        message: 'Not enough data for prediction' 
      });
      return;
    }

    res.json({
      prediction: {
        ...prediction,
        predictedTime: prediction.predictedTime.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching prediction:', error);
    res.status(500).json({ error: 'Failed to fetch prediction' });
  }
});

// Get dashboard statistics
router.get('/stats', async (_req, res) => {
  try {
    const stats = await analyticsService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ═══════════════════════════════════════
// POWER STATS - Comprehensive Dashboard Metrics
// ═══════════════════════════════════════

/**
 * Get comprehensive power stats for the dashboard
 * Includes booking pipeline, revenue, CAPTCHA costs, system health
 */
router.get('/power-stats', async (_req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel for speed
    const [
      // Detection stats
      totalDetections24h,
      totalDetections7d,
      detectionsByPrefecture,
      
      // Client pipeline stats
      clientsWaiting,
      clientsBooking,
      clientsBooked,
      clientsFailed,
      totalClients,
      
      // Revenue stats
      revenueData,
      
      // Prefecture stats
      activePrefectures,
      prefectureCategories,
      
      // Booking logs (recent activity)
      recentBookingLogs,
      
      // Queue stats
      scraperJobCounts,
      autobookJobCounts,
    ] = await Promise.all([
      // Detection counts
      prisma.detection.count({ where: { detectedAt: { gte: last24h } } }),
      prisma.detection.count({ where: { detectedAt: { gte: last7d } } }),
      prisma.detection.groupBy({
        by: ['prefectureId'],
        where: { detectedAt: { gte: last24h }, prefectureId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      
      // Client counts by status
      prisma.client.count({ where: { bookingStatus: 'WAITING_SLOT' } }),
      prisma.client.count({ where: { bookingStatus: 'BOOKING' } }),
      prisma.client.count({ where: { bookingStatus: 'BOOKED' } }),
      prisma.client.count({ where: { bookingStatus: 'FAILED' } }),
      prisma.client.count(),
      
      // Revenue aggregation
      prisma.client.aggregate({
        _sum: { priceAgreed: true, amountPaid: true },
      }),
      
      // Active prefectures
      prisma.prefecture.count({ where: { status: 'ACTIVE' } }),
      prisma.prefectureCategory.count({ where: { status: 'ACTIVE' } }),
      
      // Recent booking activity
      prisma.bookingLog.findMany({
        where: { createdAt: { gte: last24h } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
      }),
      
      // Queue stats (BullMQ)
      scraperQueue.getJobCounts(),
      autobookQueue.getJobCounts(),
    ]);

    // Calculate booking success rate
    const totalBookingAttempts = clientsBooked + clientsFailed;
    const successRate = totalBookingAttempts > 0 
      ? Math.round((clientsBooked / totalBookingAttempts) * 100) 
      : 0;

    // Get top prefectures by name
    const topPrefectureIds = detectionsByPrefecture.map(d => d.prefectureId).filter(Boolean) as string[];
    const topPrefecturesData = await prisma.prefecture.findMany({
      where: { id: { in: topPrefectureIds } },
      select: { id: true, name: true, department: true },
    });
    const prefectureMap = new Map(topPrefecturesData.map(p => [p.id, p]));

    // CAPTCHA cost estimation (based on detection count * solve rate)
    const estimatedCaptchaSolves24h = Math.round(totalDetections24h * 0.3); // ~30% need CAPTCHA
    const estimatedCaptchaCost24h = estimatedCaptchaSolves24h * 0.003; // $0.003 per solve

    res.json({
      // Overview
      overview: {
        activePrefectures,
        activeCategories: prefectureCategories,
        totalClients,
        systemOnline: true,
      },
      
      // Detection metrics
      detections: {
        last24h: totalDetections24h,
        last7d: totalDetections7d,
        topPrefectures: detectionsByPrefecture.map(d => ({
          prefectureId: d.prefectureId,
          name: prefectureMap.get(d.prefectureId!)?.name || 'Unknown',
          department: prefectureMap.get(d.prefectureId!)?.department || '',
          count: d._count.id,
        })),
      },
      
      // Booking pipeline
      pipeline: {
        waiting: clientsWaiting,
        booking: clientsBooking,
        booked: clientsBooked,
        failed: clientsFailed,
        successRate,
      },
      
      // Revenue
      revenue: {
        totalAgreed: revenueData._sum.priceAgreed || 0,
        totalCollected: revenueData._sum.amountPaid || 0,
        totalPending: (revenueData._sum.priceAgreed || 0) - (revenueData._sum.amountPaid || 0),
      },
      
      // Costs
      costs: {
        captchaSolves24h: estimatedCaptchaSolves24h,
        captchaCost24h: estimatedCaptchaCost24h,
        estimatedMonthlyCost: estimatedCaptchaCost24h * 30,
      },
      
      // Queue health
      queues: {
        scraper: scraperJobCounts,
        autobook: autobookJobCounts,
      },
      
      // Recent activity
      recentActivity: recentBookingLogs.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        clientName: log.client ? `${log.client.firstName} ${log.client.lastName}` : null,
        createdAt: log.createdAt.toISOString(),
      })),
      
      // Timestamp
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching power stats:', error);
    res.status(500).json({ error: 'Failed to fetch power stats' });
  }
});

// Get prefecture details with history
router.get('/prefecture/:id/details', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    
    const [prefecture, detections, prediction] = await Promise.all([
      prisma.prefecture.findUnique({
        where: { id },
      }),
      prisma.detection.findMany({
        where: { prefectureId: id },
        orderBy: { detectedAt: 'desc' },
        take: 20,
      }),
      analyticsService.predictNextSlot(id),
    ]);

    if (!prefecture) {
      res.status(404).json({ error: 'Prefecture not found' });
      return;
    }

    res.json({
      prefecture,
      recentDetections: detections,
      prediction: prediction ? {
        ...prediction,
        predictedTime: prediction.predictedTime.toISOString(),
      } : null,
    });
  } catch (error) {
    logger.error('Error fetching prefecture details:', error);
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// Trigger manual check (for testing)
router.post('/prefecture/:id/check', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the prefecture exists
    const prefecture = await prisma.prefecture.findUnique({ where: { id } });
    if (!prefecture) {
      res.status(404).json({ error: 'Prefecture not found' });
      return;
    }

    // Queue an immediate scraper job for this prefecture
    const job = await scraperQueue.add(
      `manual-check:${id}`,
      { prefectureId: id, tier: prefecture.tier, manual: true },
      { priority: 1 } // High priority for manual checks
    );

    logger.info(`Manual scraper check triggered for prefecture ${id} (job: ${job?.id})`);
    res.json({ message: 'Check triggered', prefectureId: id, jobId: job?.id || null });
  } catch (error) {
    logger.error('Error triggering check:', error);
    res.status(500).json({ error: 'Failed to trigger check' });
  }
});

// Get active WebSocket connections (monitoring)
router.get('/connections', (_req, res) => {
  res.json({
    activeConnections: websocketService.getActiveConnections(),
  });
});

// Get top prefectures by slots found in last 24h
router.get('/top-prefectures', async (_req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get detection counts per prefecture in last 24h
    const detectionCounts = await prisma.detection.groupBy({
      by: ['prefectureId'],
      where: {
        detectedAt: { gte: last24h },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get prefecture details for the top ones
    const prefectureIds = detectionCounts.map(d => d.prefectureId).filter((id): id is string => id !== null);
    const prefectures = await prisma.prefecture.findMany({
      where: { id: { in: prefectureIds } },
      select: {
        id: true,
        name: true,
        department: true,
        bookingUrl: true,
      },
    });

    const prefectureMap = new Map(prefectures.map(p => [p.id, p]));

    const topPrefectures = detectionCounts.map(d => ({
      ...prefectureMap.get(d.prefectureId!),
      slotsFound24h: d._count.id,
    })).filter(p => p.id); // Filter out any missing prefectures

    res.json(topPrefectures);
  } catch (error) {
    logger.error('Error fetching top prefectures:', error);
    res.status(500).json({ error: 'Failed to fetch top prefectures' });
  }
});

// ═══════════════════════════════════════
// SLOT MATRIX - Category-Level Live Status
// ═══════════════════════════════════════

/**
 * Get live slot matrix data
 * Returns prefecture × category grid with real-time status
 */
router.get('/slot-matrix', async (_req, res) => {
  try {
    // Get all active prefectures
    const prefectures = await prisma.prefecture.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        department: true,
        tier: true,
        bookingUrl: true,
      },
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
    });

    // Get all categories for these prefectures
    const categories = await prisma.prefectureCategory.findMany({
      where: {
        prefectureId: { in: prefectures.map(p => p.id) },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        prefectureId: true,
        code: true,
        name: true,
        procedure: true,
        lastScrapedAt: true,
        lastSlotFoundAt: true,
        status: true,
        consecutiveErrors: true,
      },
    });

    // Get latest detections for each category (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDetections = await prisma.detection.findMany({
      where: {
        prefectureId: { in: prefectures.map(p => p.id) },
        categoryCode: { not: null },
        detectedAt: { gte: last24h },
      },
      orderBy: { detectedAt: 'desc' },
      select: {
        prefectureId: true,
        categoryCode: true,
        slotsAvailable: true,
        slotDate: true,
        slotTime: true,
        detectedAt: true,
      },
    });

    // Build detection map: prefectureId:categoryCode -> latest detection
    const detectionMap = new Map<string, typeof recentDetections[0]>();
    for (const detection of recentDetections) {
      const key = `${detection.prefectureId}:${detection.categoryCode}`;
      if (!detectionMap.has(key)) {
        detectionMap.set(key, detection);
      }
    }

    // Build matrix data
    const matrixData = prefectures.map(prefecture => {
      const prefectureCategories = categories.filter(c => c.prefectureId === prefecture.id);
      
      const categoryCells = prefectureCategories.map(category => {
        const key = `${prefecture.id}:${category.code}`;
        const detection = detectionMap.get(key);
        
        // Determine cell status
        let status: 'available' | 'recent' | 'no_slots' | 'not_checked' | 'error' | 'captcha' = 'not_checked';
        
        if (category.status === 'ERROR' || category.consecutiveErrors > 3) {
          status = 'error';
        } else if (category.status === 'CAPTCHA') {
          status = 'captcha';
        } else if (detection) {
          const timeSinceDetection = Date.now() - detection.detectedAt.getTime();
          if (timeSinceDetection < 10 * 60 * 1000) {
            // Within 10 minutes - slots available NOW
            status = 'available';
          } else if (timeSinceDetection < 60 * 60 * 1000) {
            // Within 1 hour - slots found recently
            status = 'recent';
          } else {
            status = 'no_slots';
          }
        } else if (category.lastScrapedAt) {
          const timeSinceScrape = Date.now() - category.lastScrapedAt.getTime();
          if (timeSinceScrape < 24 * 60 * 60 * 1000) {
            status = 'no_slots';
          }
        }

        return {
          code: category.code,
          name: category.name,
          procedure: category.procedure,
          status,
          slotsCount: detection?.slotsAvailable || 0,
          slotDate: detection?.slotDate || null,
          slotTime: detection?.slotTime || null,
          lastChecked: category.lastScrapedAt?.toISOString() || null,
          lastSlotFound: category.lastSlotFoundAt?.toISOString() || null,
        };
      });

      return {
        id: prefecture.id,
        name: prefecture.name,
        department: prefecture.department,
        tier: prefecture.tier,
        categories: categoryCells,
      };
    });

    // Get Indian Embassy data
    const consulate = await prisma.consulate.findUnique({
      where: { id: 'indian-embassy-paris' },
      select: {
        id: true,
        name: true,
        lastScrapedAt: true,
      },
    });

    // Get embassy detections
    const embassyDetections = await prisma.detection.findMany({
      where: {
        consulateId: 'indian-embassy-paris',
        detectedAt: { gte: last24h },
      },
      orderBy: { detectedAt: 'desc' },
      take: 10,
    });

    const embassyCategories = [
      { code: 'PASSPORT', name: 'Passport Services', id: 3 },
      { code: 'OCI', name: 'OCI Services', id: 1 },
      { code: 'VISA', name: 'Visa Services', id: 2 },
      { code: 'BIRTH', name: 'Birth Registration', id: 27 },
    ].map(cat => ({
      code: cat.code,
      name: cat.name,
      procedure: cat.code,
      status: embassyDetections.length > 0 ? 'no_slots' as const : 'not_checked' as const,
      slotsCount: 0,
      slotDate: null,
      slotTime: null,
      lastChecked: consulate?.lastScrapedAt?.toISOString() || null,
      lastSlotFound: null,
    }));

    res.json({
      prefectures: matrixData,
      embassy: consulate ? {
        id: consulate.id,
        name: consulate.name,
        categories: embassyCategories,
      } : null,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching slot matrix:', error);
    res.status(500).json({ error: 'Failed to fetch slot matrix' });
  }
});

/**
 * Trigger manual check for a specific category
 */
router.post('/category/:prefectureId/:categoryCode/check', async (req, res) => {
  try {
    const { prefectureId, categoryCode } = req.params;

    // Verify the category exists
    const category = await prisma.prefectureCategory.findUnique({
      where: {
        prefectureId_code: { prefectureId, code: categoryCode },
      },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Queue an immediate scraper job for this category
    const job = await scraperQueue.add(
      `manual-check:${prefectureId}:${categoryCode}`,
      { prefectureId, categoryCode, manual: true },
      { priority: 1 }
    );

    logger.info(`Manual category check triggered for ${prefectureId}:${categoryCode} (job: ${job?.id})`);
    res.json({ 
      message: 'Check triggered', 
      prefectureId, 
      categoryCode,
      jobId: job?.id || null 
    });
  } catch (error) {
    logger.error('Error triggering category check:', error);
    res.status(500).json({ error: 'Failed to trigger check' });
  }
});

// ═══════════════════════════════════════
// MANUAL BOOKING - Boss Panel Intervention
// ═══════════════════════════════════════

/**
 * Get list of clients available for booking
 * Returns clients with WAITING_SLOT status
 */
router.get('/clients/available', async (_req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: {
        bookingStatus: 'WAITING_SLOT',
        status: 'WAITING',
        autoBook: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        bookingSystem: true,
        procedureType: true,
        categoryCode: true,
        prefectureId: true,
        prefecture: {
          select: { name: true, department: true },
        },
        consulateId: true,
        consulate: {
          select: { name: true },
        },
        datePreference: true,
        preferredAfter: true,
        preferredBefore: true,
        priority: true,
        createdAt: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    res.json(clients);
  } catch (error) {
    logger.error('Error fetching available clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

/**
 * Trigger manual booking for a client
 * Used when Boss wants to manually book a specific slot for a client
 */
router.post('/manual-book', async (req, res) => {
  try {
    const { 
      clientId,
      categoryCode,
      slotDate,
      slotTime,
      bookingUrl,
      skipAutoSubmit,  // If true, just fill form but don't submit
    } = req.body;

    // Validate required fields
    if (!clientId || !categoryCode || !slotDate) {
      res.status(400).json({ 
        error: 'Missing required fields: clientId, categoryCode, slotDate' 
      });
      return;
    }

    // Get the client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { prefecture: true, consulate: true },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    // Determine booking URL
    let finalBookingUrl = bookingUrl;
    
    if (!finalBookingUrl && client.prefectureId) {
      // Try to get from category config
      finalBookingUrl = getCategoryUrl(categoryCode);
      
      if (!finalBookingUrl) {
        // Fallback to prefecture URL
        finalBookingUrl = client.prefecture?.bookingUrl;
      }
    }

    if (!finalBookingUrl) {
      res.status(400).json({ error: 'Could not determine booking URL' });
      return;
    }

    // Update client status
    await prisma.client.update({
      where: { id: clientId },
      data: { 
        bookingStatus: 'BOOKING',
        categoryCode: categoryCode,  // Update category code if changed
      },
    });

    // Queue the booking job with high priority
    const job = await autobookQueue.add(
      `manual-book:${clientId}-${Date.now()}`,
      {
        clientId,
        prefectureId: client.prefectureId || '',
        categoryCode,
        bookingUrl: finalBookingUrl,
        slotDate,
        slotTime,
        manual: true,
        skipAutoSubmit: skipAutoSubmit || false,
      },
      { priority: 1 }  // Highest priority for manual bookings
    );

    logger.info(`Manual booking triggered for client ${clientId} (job: ${job?.id})`);

    res.json({
      message: 'Manual booking triggered',
      clientId,
      categoryCode,
      slotDate,
      slotTime,
      bookingUrl: finalBookingUrl,
      jobId: job?.id || null,
    });
  } catch (error) {
    logger.error('Error triggering manual booking:', error);
    res.status(500).json({ error: 'Failed to trigger manual booking' });
  }
});

/**
 * Get booking history for monitoring
 */
router.get('/booking-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const bookings = await prisma.bookingLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            bookingSystem: true,
            prefecture: { select: { name: true } },
          },
        },
      },
    });

    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching booking history:', error);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
});

/**
 * Get detailed client info for booking form
 */
router.get('/client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        prefecture: true,
        consulate: true,
        bookingLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json(client);
  } catch (error) {
    logger.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

export default router;
