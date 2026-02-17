import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// @ts-expect-error - ioredis ESM compatibility
export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error: Error) => {
  console.error('Redis connection error:', error);
});

export async function connectRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redis.status === 'ready') {
      resolve();
      return;
    }
    
    redis.once('ready', () => resolve());
    redis.once('error', (err: Error) => reject(err));
  });
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
