import { createWorker } from '../config/bullmq.js';
import { processNotification } from '../services/notifications/notification.service.js';
import logger from '../utils/logger.util.js';
import type { NotificationPayload } from '../types/notification.types.js';

export async function startNotificationWorker(concurrency = 20) {
  logger.info(`Starting notification worker with concurrency ${concurrency}`);

  const worker = createWorker<NotificationPayload>(
    'notifications',
    async (job) => {
      const payload = job.data;
      
      logger.debug(`Processing ${payload.channel} notification for user ${payload.userId}`);
      
      const success = await processNotification(payload);
      
      if (!success) {
        throw new Error(`Failed to send ${payload.channel} notification`);
      }
    },
    concurrency
  );

  worker.on('completed', (job) => {
    logger.debug(`Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Notification job ${job?.id} failed:`, error.message);
  });

  return worker;
}
