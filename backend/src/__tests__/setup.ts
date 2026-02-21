import { jest, afterAll } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-characters';

// Mock Prisma client
jest.mock('../config/database.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    processedStripeEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    alert: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback({
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      processedStripeEvent: {
        create: jest.fn(),
      },
      alert: {
        updateMany: jest.fn(),
      },
    })),
  },
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// Mock Redis
jest.mock('../config/redis.js', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

// Mock BullMQ
jest.mock('../config/bullmq.js', () => ({
  scraperQueue: {
    add: jest.fn(),
    getActiveCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    getWaitingCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    getFailedCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
  },
  notificationQueue: {
    add: jest.fn(),
    getActiveCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    getWaitingCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
    getFailedCount: jest.fn<() => Promise<number>>().mockResolvedValue(0),
  },
}));

// Mock logger
jest.mock('../utils/logger.util.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  jest.clearAllMocks();
});
