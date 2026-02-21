import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';
import { closeQueues } from '../config/bullmq.js';
import { startScraperWorker, scheduleScraperJobs } from './scraper.worker.js';
import { startNotificationWorker } from './notification.worker.js';
import { startMaintenanceWorker, scheduleMaintenanceJobs } from './maintenance.worker.js';
import { startRefundWorker, scheduleRefundJobs } from './refund.worker.js';
import { getBrowserPool, shutdownBrowserPool } from '../scraper/browser.pool.js';
import logger from '../utils/logger.util.js';

const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;

async function bootstrap() {
  try {
    logger.info(`Starting worker ${WORKER_ID}...`);

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Initialize browser pool for scrapers
    await getBrowserPool();

    // Start workers
    const scraperWorker = await startScraperWorker(WORKER_ID, 3);
    const notificationWorker = await startNotificationWorker(20);
    const maintenanceWorker = await startMaintenanceWorker();
    const refundWorker = await startRefundWorker(1);

    // Schedule jobs
    await scheduleScraperJobs();
    await scheduleMaintenanceJobs();
    await scheduleRefundJobs();

    logger.info(`Worker ${WORKER_ID} started successfully`);
    logger.info('Workers active: scraper (3), notification (20), maintenance (1), refund (1)');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down workers...');

      if (scraperWorker) await scraperWorker.close();
      if (notificationWorker) await notificationWorker.close();
      if (maintenanceWorker) await maintenanceWorker.close();
      if (refundWorker) await refundWorker.close();

      await closeQueues();
      await shutdownBrowserPool();
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
