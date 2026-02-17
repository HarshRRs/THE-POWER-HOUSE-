import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis.js';
import { QUEUE_NAMES } from './constants.js';

const connection = redis;

export const scraperQueue = new Queue(QUEUE_NAMES.scraper, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const notificationQueue = new Queue(QUEUE_NAMES.notifications, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const maintenanceQueue = new Queue(QUEUE_NAMES.maintenance, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

export const scraperQueueEvents = new QueueEvents(QUEUE_NAMES.scraper, { connection });
export const notificationQueueEvents = new QueueEvents(QUEUE_NAMES.notifications, { connection });

export function createWorker<T>(
  queueName: string,
  processor: (job: { data: T; id?: string }) => Promise<void>,
  concurrency = 1
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection,
    concurrency,
  });
}

export async function closeQueues(): Promise<void> {
  await Promise.all([
    scraperQueue.close(),
    notificationQueue.close(),
    maintenanceQueue.close(),
    scraperQueueEvents.close(),
    notificationQueueEvents.close(),
  ]);
}
