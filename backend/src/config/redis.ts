import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisInstance: any = null;

function createRedisClient() {
  if (process.env.SKIP_REDIS === 'true') {
    console.log('Redis: Skipped (SKIP_REDIS=true)');
    return null;
  }
  
  try {
    // @ts-expect-error - ioredis ESM compatibility
    const client = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn('Redis: Max retries reached, running without Redis');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });

    client.on('connect', () => {
      console.log('Redis connected successfully');
    });

    client.on('error', (error: Error) => {
      if (error.message.includes('ECONNREFUSED')) {
        console.warn('Redis: Connection refused, running without Redis');
      } else {
        console.error('Redis connection error:', error.message);
      }
    });

    return client;
  } catch {
    console.warn('Redis: Failed to create client, running without Redis');
    return null;
  }
}

redisInstance = createRedisClient();

export const redis = redisInstance;

export async function connectRedis(): Promise<void> {
  if (!redis) {
    console.log('Redis: Not configured, skipping connection');
    return;
  }
  
  try {
    await redis.connect();
  } catch {
    console.warn('Redis: Connection failed, continuing without Redis');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
  }
}

export function isRedisAvailable(): boolean {
  return redis !== null && redis.status === 'ready';
}
