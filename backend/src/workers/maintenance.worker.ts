import { createWorker, maintenanceQueue } from '../config/bullmq.js';
import { prisma } from '../config/database.js';
import { expirePlans } from '../services/plan.service.js';
import { rescheduleScraperJobs } from './scraper.worker.js';
import { cleanupOldScreenshots } from '../utils/screenshot.util.js';
import logger from '../utils/logger.util.js';

interface MaintenanceJobData {
  task: 'expire_plans' | 'cleanup_logs' | 'reschedule_jobs' | 'cleanup_screenshots' | 'reset_paused';
}

export async function startMaintenanceWorker() {
  logger.info('Starting maintenance worker');

  const worker = createWorker<MaintenanceJobData>(
    'maintenance',
    async (job) => {
      const { task } = job.data;

      switch (task) {
        case 'expire_plans': {
          const expired = await expirePlans();
          if (expired > 0) {
            logger.info(`Expired ${expired} plans`);
            // Reschedule scraper jobs after expiring plans
            await rescheduleScraperJobs();
          }
          break;
        }

        case 'cleanup_logs': {
          // Delete scraper logs older than 7 days
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const deleted = await prisma.scraperLog.deleteMany({
            where: { createdAt: { lt: sevenDaysAgo } },
          });
          if (deleted.count > 0) {
            logger.info(`Cleaned up ${deleted.count} old scraper logs`);
          }
          break;
        }

        case 'reschedule_jobs': {
          await rescheduleScraperJobs();
          break;
        }

        case 'cleanup_screenshots': {
          const deleted = await cleanupOldScreenshots();
          if (deleted > 0) {
            logger.info(`Cleaned up ${deleted} old screenshots`);
          }
          break;
        }

        case 'reset_paused': {
          // Reset CAPTCHA/ERROR prefectures after pause duration
          const resetTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
          const reset = await prisma.prefecture.updateMany({
            where: {
              status: { in: ['CAPTCHA', 'ERROR'] },
              updatedAt: { lt: resetTime },
            },
            data: {
              status: 'ACTIVE',
              consecutiveErrors: 0,
            },
          });
          if (reset.count > 0) {
            logger.info(`Reset ${reset.count} paused prefectures`);
          }
          break;
        }
      }
    },
    1 // Single concurrency for maintenance tasks
  );

  if (worker) {
    worker.on('completed', (job) => {
      logger.debug(`Maintenance job ${job.data.task} completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Maintenance job ${job?.data.task} failed:`, error);
    });
  }

  return worker;
}

// Schedule maintenance jobs
export async function scheduleMaintenanceJobs() {
  logger.info('Scheduling maintenance jobs...');

  // Expire plans - every 60 seconds
  await maintenanceQueue.add(
    'expire-plans',
    { task: 'expire_plans' },
    { repeat: { every: 60 * 1000 }, jobId: 'repeat:expire-plans' }
  );

  // Reschedule scraper jobs - every 5 minutes
  await maintenanceQueue.add(
    'reschedule-jobs',
    { task: 'reschedule_jobs' },
    { repeat: { every: 5 * 60 * 1000 }, jobId: 'repeat:reschedule-jobs' }
  );

  // Cleanup logs - every hour
  await maintenanceQueue.add(
    'cleanup-logs',
    { task: 'cleanup_logs' },
    { repeat: { every: 60 * 60 * 1000 }, jobId: 'repeat:cleanup-logs' }
  );

  // Cleanup screenshots - every 6 hours
  await maintenanceQueue.add(
    'cleanup-screenshots',
    { task: 'cleanup_screenshots' },
    { repeat: { every: 6 * 60 * 60 * 1000 }, jobId: 'repeat:cleanup-screenshots' }
  );

  // Reset paused prefectures - every 30 minutes
  await maintenanceQueue.add(
    'reset-paused',
    { task: 'reset_paused' },
    { repeat: { every: 30 * 60 * 1000 }, jobId: 'repeat:reset-paused' }
  );

  logger.info('Maintenance jobs scheduled');
}
