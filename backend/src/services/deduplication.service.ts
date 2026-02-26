import { redis } from '../config/redis.js';
import logger from '../utils/logger.util.js';
import crypto from 'crypto';

const DEDUP_PREFIX = 'dedup:';
const DEFAULT_TTL_SECONDS = 3600; // 1 hour

export interface DeduplicationKey {
  prefectureId?: string;
  consulateId?: string;
  alertId: string;
  slotDate?: string;
  slotTime?: string;
}

/**
 * Deduplication service to prevent duplicate notifications
 * Uses Redis to track sent notifications with configurable TTL
 */
class DeduplicationService {
  private enabled = true;
  private ttlSeconds = DEFAULT_TTL_SECONDS;

  constructor() {
    this.ttlSeconds = parseInt(process.env.DEDUP_TTL_SECONDS || String(DEFAULT_TTL_SECONDS), 10);
    logger.info(`DeduplicationService: Initialized with TTL ${this.ttlSeconds}s`);
  }

  /**
   * Generate a unique hash key for deduplication
   * Key format: dedup:{prefectureId}:{hash} - prefectureId prefix enables per-prefecture operations
   */
  private generateKey(data: DeduplicationKey): string {
    const targetId = data.prefectureId || data.consulateId || 'unknown';
    const keyString = `${targetId}:${data.alertId}:${data.slotDate || ''}:${data.slotTime || ''}`;
    const hash = crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 16);
    return `${DEDUP_PREFIX}${targetId}:${hash}`;
  }

  /**
   * Check if a notification has already been sent (is duplicate)
   * @returns true if duplicate, false if new
   */
  async isDuplicate(key: DeduplicationKey): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const redisKey = this.generateKey(key);
      const exists = await redis.exists(redisKey);
      
      if (exists) {
        logger.debug(`DeduplicationService: Duplicate detected for ${key.prefectureId || key.consulateId}:${key.alertId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('DeduplicationService: Redis error during duplicate check', error);
      // On error, allow notification to proceed (fail open)
      return false;
    }
  }

  /**
   * Mark a notification as sent (store in dedup cache)
   */
  async markAsSent(key: DeduplicationKey): Promise<void> {
    if (!this.enabled) return;

    try {
      const redisKey = this.generateKey(key);
      await redis.set(redisKey, Date.now().toString(), 'EX', this.ttlSeconds);
      logger.debug(`DeduplicationService: Marked ${key.prefectureId || key.consulateId}:${key.alertId} as sent`);
    } catch (error) {
      logger.error('DeduplicationService: Redis error during mark as sent', error);
    }
  }

  /**
   * Check and mark atomically - returns true if new, false if duplicate
   */
  async checkAndMark(key: DeduplicationKey): Promise<boolean> {
    if (!this.enabled) return true;

    try {
      const redisKey = this.generateKey(key);
      
      // Use SETNX for atomic check-and-set
      const result = await redis.set(
        redisKey,
        Date.now().toString(),
        'EX',
        this.ttlSeconds,
        'NX' // Only set if not exists
      );

      if (result === 'OK') {
        logger.debug(`DeduplicationService: New notification for ${key.prefectureId || key.consulateId}:${key.alertId}`);
        return true;
      } else {
        logger.debug(`DeduplicationService: Duplicate blocked for ${key.prefectureId || key.consulateId}:${key.alertId}`);
        return false;
      }
    } catch (error) {
      logger.error('DeduplicationService: Redis error during check-and-mark', error);
      // On error, allow notification to proceed (fail open)
      return true;
    }
  }

  /**
   * Clear dedup entry (useful for testing or manual reset)
   */
  async clear(key: DeduplicationKey): Promise<void> {
    try {
      const redisKey = this.generateKey(key);
      await redis.del(redisKey);
      logger.debug(`DeduplicationService: Cleared ${key.prefectureId || key.consulateId}:${key.alertId}`);
    } catch (error) {
      logger.error('DeduplicationService: Redis error during clear', error);
    }
  }

  /**
   * Clear all dedup entries for a prefecture (useful when testing)
   */
  async clearPrefecture(prefectureId: string): Promise<number> {
    try {
      const pattern = `${DEDUP_PREFIX}${prefectureId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) return 0;

      // Note: This is a simple implementation. In production with many keys,
      // you should use SCAN instead of KEYS
      const deleted = await redis.del(...keys);
      logger.info(`DeduplicationService: Cleared ${deleted} entries for ${prefectureId}`);
      return deleted;
    } catch (error) {
      logger.error('DeduplicationService: Redis error during clearPrefecture', error);
      return 0;
    }
  }

  /**
   * Get stats about dedup cache
   */
  async getStats(): Promise<{ count: number; enabled: boolean; ttlSeconds: number }> {
    try {
      const pattern = `${DEDUP_PREFIX}*`;
      const keys = await redis.keys(pattern);
      
      return {
        count: keys.length,
        enabled: this.enabled,
        ttlSeconds: this.ttlSeconds,
      };
    } catch {
      return {
        count: 0,
        enabled: this.enabled,
        ttlSeconds: this.ttlSeconds,
      };
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`DeduplicationService: ${enabled ? 'Enabled' : 'Disabled'}`);
  }
}

// Singleton instance
export const deduplicationService = new DeduplicationService();
