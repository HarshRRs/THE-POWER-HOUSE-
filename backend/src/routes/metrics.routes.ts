/**
 * Prometheus Metrics Routes
 * Exposes application metrics for monitoring and performance analysis
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { scraperQueue, notificationQueue } from '../config/bullmq.js';
import { getCacheStats } from '../services/cache.service.js';
import { getMetrics, getMetricsText } from '../middleware/metrics.middleware.js';

const router = Router();

// ──────────────────────────────────────
// GET /api/metrics - Prometheus format metrics
// ──────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetricsText();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('# Error collecting metrics');
  }
});

// ──────────────────────────────────────
// GET /api/metrics/json - JSON format metrics
// ──────────────────────────────────────
router.get('/json', async (_req: Request, res: Response) => {
  try {
    const [
      httpMetrics,
      dbMetrics,
      cacheMetrics,
      queueMetrics,
    ] = await Promise.all([
      getMetrics(),
      getDatabaseMetrics(),
      getCacheMetrics(),
      getQueueMetrics(),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      http: httpMetrics,
      database: dbMetrics,
      cache: cacheMetrics,
      queues: queueMetrics,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// ──────────────────────────────────────
// GET /api/metrics/health - Detailed health check
// ──────────────────────────────────────
router.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    components: {},
  };

  // Database health
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.components = {
      ...health.components as object,
      database: {
        status: 'healthy',
        latencyMs: Date.now() - dbStart,
      },
    };
  } catch {
    health.status = 'degraded';
    health.components = {
      ...health.components as object,
      database: { status: 'unhealthy' },
    };
  }

  // Queue health
  try {
    const [scraperActive, notifActive] = await Promise.all([
      scraperQueue.getActiveCount(),
      notificationQueue.getActiveCount(),
    ]);
    health.components = {
      ...health.components as object,
      queues: {
        status: 'healthy',
        scraperActive,
        notificationActive: notifActive,
      },
    };
  } catch {
    health.components = {
      ...health.components as object,
      queues: { status: 'unavailable' },
    };
  }

  health.responseTimeMs = Date.now() - startTime;
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Helper: Get database metrics
async function getDatabaseMetrics() {
  try {
    // Get connection pool info (Prisma doesn't expose this directly)
    // Using query count as proxy
    const [userCount, alertCount, detectionCount] = await Promise.all([
      prisma.user.count(),
      prisma.alert.count(),
      prisma.detection.count(),
    ]);

    return {
      status: 'connected',
      tables: {
        users: userCount,
        alerts: alertCount,
        detections: detectionCount,
      },
    };
  } catch {
    return { status: 'error' };
  }
}

// Helper: Get cache metrics
async function getCacheMetrics() {
  try {
    const stats = await getCacheStats();
    return {
      status: 'connected',
      keys: stats,
    };
  } catch {
    return { status: 'unavailable' };
  }
}

// Helper: Get queue metrics
async function getQueueMetrics() {
  try {
    const [
      scraperActive,
      scraperWaiting,
      scraperFailed,
      scraperCompleted,
      notifActive,
      notifWaiting,
      notifFailed,
    ] = await Promise.all([
      scraperQueue.getActiveCount(),
      scraperQueue.getWaitingCount(),
      scraperQueue.getFailedCount(),
      scraperQueue.getCompletedCount(),
      notificationQueue.getActiveCount(),
      notificationQueue.getWaitingCount(),
      notificationQueue.getFailedCount(),
    ]);

    return {
      status: 'connected',
      scraper: {
        active: scraperActive,
        waiting: scraperWaiting,
        failed: scraperFailed,
        completed: scraperCompleted,
      },
      notifications: {
        active: notifActive,
        waiting: notifWaiting,
        failed: notifFailed,
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}

export default router;
