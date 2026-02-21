import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis.js';
import { QUEUE_NAMES } from './constants.js';

const connection = redis;

// Create mock queue methods for when Redis is unavailable
function createMockQueue(name: string) {
  return {
    name,
    add: async () => { console.warn(`Queue ${name}: Redis unavailable, job not queued`); return null; },
    getActiveCount: async () => 0,
    getWaitingCount: async () => 0,
    getDelayedCount: async () => 0,
    getFailedCount: async () => 0,
    getCompletedCount: async () => 0,
    getFailed: async () => [],
    getJob: async () => null,
    close: async () => {},
  };
}

function createMockQueueEvents() {
  return {
    close: async () => {},
    on: () => {},
    off: () => {},
  };
}

// Only create real queues if Redis is available
const createQueue = (name: string, options: object) => {
  if (!connection) {
    return createMockQueue(name) as unknown as Queue;
  }
  return new Queue(name, { connection, ...options });
};

const createQueueEvents = (name: string) => {
  if (!connection) {
    return createMockQueueEvents() as unknown as QueueEvents;
  }
  return new QueueEvents(name, { connection });
};

export const scraperQueue = createQueue(QUEUE_NAMES.scraper, {
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

export const notificationQueue = createQueue(QUEUE_NAMES.notifications, {
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

export const maintenanceQueue = createQueue(QUEUE_NAMES.maintenance, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 10,
  },
});

export const scraperQueueEvents = createQueueEvents(QUEUE_NAMES.scraper);
export const notificationQueueEvents = createQueueEvents(QUEUE_NAMES.notifications);

export function createWorker<T>(
  queueName: string,
  processor: (job: { data: T; id?: string }) => Promise<void>,
  concurrency = 1
): Worker<T> | null {
  if (!connection) {
    console.warn(`Worker ${queueName}: Redis unavailable, worker not created`);
    return null;
  }
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
