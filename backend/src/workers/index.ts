import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { closeQueues } from '../config/bullmq.js';
import { startScraperWorker, scheduleScraperJobs } from './scraper.worker.js';
import { startConsulateWorker, scheduleConsulateJobs } from './consulate.worker.js';
import { startVfsWorker, scheduleVfsJobs, shutdownVfsWorker } from './vfs.worker.js';
import { startNotificationWorker } from './notification.worker.js';
import { startMaintenanceWorker, scheduleMaintenanceJobs } from './maintenance.worker.js';
import { startRefundWorker, scheduleRefundJobs } from './refund.worker.js';
import { startAutobookWorker } from './autobook.worker.js';
import { getBrowserPool, shutdownBrowserPool } from '../scraper/browser.pool.js';
import logger from '../utils/logger.util.js';

const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;

type CloseableWorker = { close: () => Promise<void> } | null;

async function startWorkerSafe<T extends CloseableWorker>(
  name: string,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logger.error(`Failed to start ${name} worker:`, error);
    return null;
  }
}

async function scheduleSafe(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.error(`Failed to schedule ${name} jobs:`, error);
  }
}

async function bootstrap() {
  try {
    logger.info(`Starting worker ${WORKER_ID}...`);

    // Connect to databases (required)
    await connectDatabase();
    await connectRedis();

    // Start workers that do NOT need browsers first (most reliable)
    const notificationWorker = await startWorkerSafe('notification', () => startNotificationWorker(20));
    const maintenanceWorker = await startWorkerSafe('maintenance', () => startMaintenanceWorker());
    const refundWorker = await startWorkerSafe('refund', () => startRefundWorker(1));

    // Initialize browser pool for scrapers (may fail on resource-constrained systems)
    let browserPoolReady = false;
    try {
      await getBrowserPool();
      browserPoolReady = true;
      logger.info('Browser pool initialized successfully');
    } catch (error) {
      logger.error('Browser pool initialization failed, scraper workers will not start:', error);
    }

    // Start browser-dependent workers only if pool is ready
    let scraperWorker: CloseableWorker = null;
    let consulateWorker: CloseableWorker = null;
    let vfsWorker: CloseableWorker = null;
    let autobookWorker: CloseableWorker = null;

    if (browserPoolReady) {
      scraperWorker = await startWorkerSafe('scraper', () => startScraperWorker(WORKER_ID, 3));
      consulateWorker = await startWorkerSafe('consulate', () => startConsulateWorker(WORKER_ID, 2));
      vfsWorker = await startWorkerSafe('vfs', () => startVfsWorker(WORKER_ID, 1));
      autobookWorker = await startWorkerSafe('autobook', () => startAutobookWorker(WORKER_ID, 2));
    }

    // Schedule jobs
    await scheduleSafe('scraper', scheduleScraperJobs);
    await scheduleSafe('consulate', scheduleConsulateJobs);
    await scheduleSafe('vfs', scheduleVfsJobs);
    await scheduleSafe('maintenance', scheduleMaintenanceJobs);
    await scheduleSafe('refund', scheduleRefundJobs);

    const activeWorkers = [
      scraperWorker && 'scraper',
      consulateWorker && 'consulate',
      vfsWorker && 'vfs',
      notificationWorker && 'notification',
      autobookWorker && 'autobook',
      maintenanceWorker && 'maintenance',
      refundWorker && 'refund',
    ].filter(Boolean);

    logger.info(`Worker ${WORKER_ID} started successfully`);
    logger.info(`Active workers: ${activeWorkers.join(', ') || 'none'}`);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down workers...');

      const workers = [scraperWorker, consulateWorker, vfsWorker, notificationWorker, maintenanceWorker, refundWorker, autobookWorker];
      for (const worker of workers) {
        if (worker) {
          try { await worker.close(); } catch (e) { logger.debug('Error closing worker:', e); }
        }
      }

      await closeQueues();
      await shutdownBrowserPool();
      await shutdownVfsWorker();
      await disconnectDatabase();
      await disconnectRedis();

      logger.info('Workers shut down gracefully');
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

bootstrap();
