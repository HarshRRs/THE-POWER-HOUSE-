import { redis } from '../config/redis.js';
import logger from '../utils/logger.util.js';

// Cache key prefixes
const CACHE_PREFIX = {
  PREFECTURE: 'cache:pref:',
  PREFECTURE_LIST: 'cache:pref:list',
  PREFECTURE_ACTIVE: 'cache:pref:active',
  USER: 'cache:user:',
  STATS: 'cache:stats:',
  ALERTS: 'cache:alerts:',
} as const;

// Default TTL values (in seconds)
const DEFAULT_TTL = {
  PREFECTURE: 300,      // 5 minutes
  PREFECTURE_LIST: 600, // 10 minutes
  USER: 60,             // 1 minute
  STATS: 30,            // 30 seconds
  ALERTS: 120,          // 2 minutes
} as const;

type TTLValue = number;

interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
}

/**
 * Check if Redis is available
 */
function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Generic cache wrapper for any async function
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, skipCache = false } = options;

  // Skip cache if disabled or Redis unavailable
  if (skipCache || process.env.DISABLE_CACHE === 'true' || !isRedisAvailable()) {
    return fetcher();
  }

  try {
    // Try to get from cache
    const cached = await redis!.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    logger.warn(`Cache read error for ${key}:`, error);
    // Continue to fetch from database
  }

  // Cache miss - fetch from source
  logger.debug(`Cache MISS: ${key}`);
  const data = await fetcher();

  // Store in cache (async, don't wait)
  setCache(key, data, ttl).catch((err) => {
    logger.warn(`Cache write error for ${key}:`, err);
  });

  return data;
}

/**
 * Set cache value
 */
export async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await redis!.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    logger.warn(`Cache set error for ${key}:`, error);
  }
}

/**
 * Delete cache key
 */
export async function deleteCache(key: string): Promise<void> {
  if (!isRedisAvailable()) return;
  try {
    await redis!.del(key);
    logger.debug(`Cache DELETE: ${key}`);
  } catch (error) {
    logger.warn(`Cache delete error for ${key}:`, error);
  }
}

/**
 * Delete cache keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!isRedisAvailable()) return 0;
  try {
    const keys = await redis!.keys(pattern);
    if (keys.length === 0) return 0;
    
    const deleted = await redis!.del(...keys);
    logger.debug(`Cache DELETE pattern ${pattern}: ${deleted} keys`);
    return deleted;
  } catch (error) {
    logger.warn(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
}

// ═══════════════════════════════════════
// PREFECTURE CACHE HELPERS
// ═══════════════════════════════════════

/**
 * Get cached prefecture by ID
 */
export function getPrefectureCache<T>(
  id: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return withCache(`${CACHE_PREFIX.PREFECTURE}${id}`, fetcher, {
    ttl: DEFAULT_TTL.PREFECTURE,
  });
}

/**
 * Get cached list of all prefectures
 */
export function getPrefectureListCache<T>(fetcher: () => Promise<T>): Promise<T> {
  return withCache(CACHE_PREFIX.PREFECTURE_LIST, fetcher, {
    ttl: DEFAULT_TTL.PREFECTURE_LIST,
  });
}

/**
 * Get cached list of active prefectures
 */
export function getActivePrefecturesCache<T>(fetcher: () => Promise<T>): Promise<T> {
  return withCache(CACHE_PREFIX.PREFECTURE_ACTIVE, fetcher, {
    ttl: DEFAULT_TTL.PREFECTURE_LIST,
  });
}

/**
 * Invalidate prefecture cache
 */
export async function invalidatePrefectureCache(id?: string): Promise<void> {
  if (id) {
    await deleteCache(`${CACHE_PREFIX.PREFECTURE}${id}`);
  }
  // Always invalidate list caches
  await deleteCache(CACHE_PREFIX.PREFECTURE_LIST);
  await deleteCache(CACHE_PREFIX.PREFECTURE_ACTIVE);
}

// ═══════════════════════════════════════
// USER CACHE HELPERS
// ═══════════════════════════════════════

/**
 * Get cached user by ID
 */
export function getUserCache<T>(
  userId: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return withCache(`${CACHE_PREFIX.USER}${userId}`, fetcher, {
    ttl: DEFAULT_TTL.USER,
  });
}

/**
 * Invalidate user cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await deleteCache(`${CACHE_PREFIX.USER}${userId}`);
  await deleteCache(`${CACHE_PREFIX.ALERTS}${userId}`);
}

// ═══════════════════════════════════════
// ALERTS CACHE HELPERS
// ═══════════════════════════════════════

/**
 * Get cached user alerts
 */
export function getUserAlertsCache<T>(
  userId: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return withCache(`${CACHE_PREFIX.ALERTS}${userId}`, fetcher, {
    ttl: DEFAULT_TTL.ALERTS,
  });
}

/**
 * Invalidate user alerts cache
 */
export async function invalidateUserAlertsCache(userId: string): Promise<void> {
  await deleteCache(`${CACHE_PREFIX.ALERTS}${userId}`);
}

// ═══════════════════════════════════════
// STATS CACHE HELPERS
// ═══════════════════════════════════════

/**
 * Get cached stats
 */
export function getStatsCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: TTLValue = DEFAULT_TTL.STATS
): Promise<T> {
  return withCache(`${CACHE_PREFIX.STATS}${key}`, fetcher, { ttl });
}

/**
 * Invalidate all stats cache
 */
export async function invalidateStatsCache(): Promise<void> {
  await deleteCachePattern(`${CACHE_PREFIX.STATS}*`);
}

// ═══════════════════════════════════════
// CACHE STATS & MANAGEMENT
// ═══════════════════════════════════════

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  prefectures: number;
  users: number;
  alerts: number;
  stats: number;
  total: number;
}> {
  if (!isRedisAvailable()) {
    return { prefectures: 0, users: 0, alerts: 0, stats: 0, total: 0 };
  }
  try {
    const [prefectures, users, alerts, stats] = await Promise.all([
      redis!.keys(`${CACHE_PREFIX.PREFECTURE}*`).then((keys: string[]) => keys.length),
      redis!.keys(`${CACHE_PREFIX.USER}*`).then((keys: string[]) => keys.length),
      redis!.keys(`${CACHE_PREFIX.ALERTS}*`).then((keys: string[]) => keys.length),
      redis!.keys(`${CACHE_PREFIX.STATS}*`).then((keys: string[]) => keys.length),
    ]);

    return {
      prefectures,
      users,
      alerts,
      stats,
      total: prefectures + users + alerts + stats,
    };
  } catch {
    return { prefectures: 0, users: 0, alerts: 0, stats: 0, total: 0 };
  }
}

/**
 * Clear all application cache
 */
export async function clearAllCache(): Promise<number> {
  let total = 0;
  
  for (const prefix of Object.values(CACHE_PREFIX)) {
    total += await deleteCachePattern(`${prefix}*`);
  }
  
  logger.info(`Cleared ${total} cache entries`);
  return total;
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmupCache(
  prefectureFetcher: () => Promise<unknown>,
  statsFetcher: () => Promise<unknown>
): Promise<void> {
  logger.info('Warming up cache...');
  
  try {
    await Promise.all([
      getPrefectureListCache(prefectureFetcher),
      getStatsCache('dashboard', statsFetcher, 60),
    ]);
    logger.info('Cache warmup complete');
  } catch (error) {
    logger.warn('Cache warmup failed:', error);
  }
}
