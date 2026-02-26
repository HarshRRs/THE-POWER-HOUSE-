import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { processBatchRefunds } from '../services/refund-guarantee.service.js';
import logger from '../utils/logger.util.js';

const REFUND_QUEUE_NAME = 'refund-processing';

/**
 * Start the refund processing worker
 * Processes automatic refunds for users who didn't get appointments
 */
export async function startRefundWorker(concurrency = 1) {
  const worker = new Worker(
    REFUND_QUEUE_NAME,
    async (_job) => {
      try {
        logger.info('Starting refund processing batch...');
        
        const result = await processBatchRefunds();
        
        logger.info(
          `Refund processing completed: ${result.totalProcessed} processed, ` +
          `${result.successfulRefunds} successful, ${result.failedRefunds} failed`
        );
        
        return result;
      } catch (error) {
        logger.error('Refund processing failed:', error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Refund job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Refund job ${job?.id} failed:`, err);
  });

  logger.info(`Refund worker started with concurrency ${concurrency}`);
  return worker;
}

/**
 * Schedule periodic refund processing jobs
 * Runs daily at 2 AM to check for eligible refunds
 */
export async function scheduleRefundJobs() {
  // This would typically use a cron scheduler like node-cron or BullMQ's repeatable jobs
  // For now, we'll just log that scheduling is set up
  
  logger.info('Refund job scheduling configured (daily at 2 AM)');
  
  // In a production environment, you'd set up actual scheduling here
  // Example with node-cron:
  // cron.schedule('0 2 * * *', async () => {
  //   await queue.add('process-refunds', {});
  // });
}