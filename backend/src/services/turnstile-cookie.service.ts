import { redis } from '../config/redis.js';
import logger from '../utils/logger.util.js';

/**
 * Turnstile Cookie Service
 * 
 * Manages Cloudflare cf_clearance cookies to avoid solving Turnstile
 * challenges on every scrape. Cookies are typically valid for 24-48 hours.
 * 
 * This dramatically reduces CAPTCHA costs:
 * - Without caching: 60 categories × 24 hours × 2 solves/hour = 2,880 solves/day
 * - With caching: 60 categories × 1 solve/24h = 60 solves/day (98% reduction)
 */

const COOKIE_PREFIX = 'turnstile:cookie:';
const COOKIE_TTL_SECONDS = 24 * 60 * 60; // 24 hours (conservative estimate)

export interface TurnstileCookie {
  name: string;         // cf_clearance
  value: string;        // Cookie value
  domain: string;       // .rdv-prefecture.interieur.gouv.fr
  path: string;         // /
  expires: number;      // Unix timestamp
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

export interface CookieMetadata {
  cookie: TurnstileCookie;
  savedAt: number;      // When we saved this cookie
  prefectureId: string;
  categoryCode: string;
  solveCount: number;   // How many times we've solved for this category
}

class TurnstileCookieService {
  /**
   * Get cached cf_clearance cookie for a prefecture+category
   */
  async getCookie(prefectureId: string, categoryCode: string): Promise<TurnstileCookie | null> {
    try {
      const key = this.getCacheKey(prefectureId, categoryCode);
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      const metadata: CookieMetadata = JSON.parse(data);
      
      // Check if cookie has expired
      if (metadata.cookie.expires && metadata.cookie.expires < Date.now() / 1000) {
        logger.debug(`Turnstile cookie expired for ${prefectureId}:${categoryCode}`);
        await this.invalidateCookie(prefectureId, categoryCode);
        return null;
      }

      logger.debug(`Using cached Turnstile cookie for ${prefectureId}:${categoryCode}`);
      return metadata.cookie;
    } catch (error) {
      logger.error(`Error getting Turnstile cookie: ${error}`);
      return null;
    }
  }

  /**
   * Save cf_clearance cookie after successful Turnstile solve
   */
  async saveCookie(
    prefectureId: string, 
    categoryCode: string, 
    cookie: TurnstileCookie
  ): Promise<void> {
    try {
      const key = this.getCacheKey(prefectureId, categoryCode);
      
      // Get existing metadata to track solve count
      const existingData = await redis.get(key);
      let solveCount = 1;
      
      if (existingData) {
        const existing: CookieMetadata = JSON.parse(existingData);
        solveCount = existing.solveCount + 1;
      }

      const metadata: CookieMetadata = {
        cookie,
        savedAt: Date.now(),
        prefectureId,
        categoryCode,
        solveCount,
      };

      await redis.setex(key, COOKIE_TTL_SECONDS, JSON.stringify(metadata));
      logger.info(`Saved Turnstile cookie for ${prefectureId}:${categoryCode} (solve #${solveCount})`);
    } catch (error) {
      logger.error(`Error saving Turnstile cookie: ${error}`);
    }
  }

  /**
   * Invalidate cookie (e.g., when we get a 403 or Turnstile challenge again)
   */
  async invalidateCookie(prefectureId: string, categoryCode: string): Promise<void> {
    try {
      const key = this.getCacheKey(prefectureId, categoryCode);
      await redis.del(key);
      logger.debug(`Invalidated Turnstile cookie for ${prefectureId}:${categoryCode}`);
    } catch (error) {
      logger.error(`Error invalidating Turnstile cookie: ${error}`);
    }
  }

  /**
   * Check if we have a valid cookie for a prefecture+category
   */
  async hasCookie(prefectureId: string, categoryCode: string): Promise<boolean> {
    const cookie = await this.getCookie(prefectureId, categoryCode);
    return cookie !== null;
  }

  /**
   * Get statistics about cached cookies
   */
  async getStats(): Promise<{
    totalCached: number;
    byPrefecture: Record<string, number>;
  }> {
    try {
      const keys = await redis.keys(`${COOKIE_PREFIX}*`);
      
      const byPrefecture: Record<string, number> = {};
      
      for (const key of keys) {
        const parts = key.replace(COOKIE_PREFIX, '').split(':');
        const prefectureId = parts[0];
        byPrefecture[prefectureId] = (byPrefecture[prefectureId] || 0) + 1;
      }

      return {
        totalCached: keys.length,
        byPrefecture,
      };
    } catch (error) {
      logger.error(`Error getting Turnstile cookie stats: ${error}`);
      return { totalCached: 0, byPrefecture: {} };
    }
  }

  /**
   * Clear all cached cookies (for maintenance/debugging)
   */
  async clearAll(): Promise<number> {
    try {
      const keys = await redis.keys(`${COOKIE_PREFIX}*`);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      
      logger.info(`Cleared ${keys.length} Turnstile cookies`);
      return keys.length;
    } catch (error) {
      logger.error(`Error clearing Turnstile cookies: ${error}`);
      return 0;
    }
  }

  private getCacheKey(prefectureId: string, categoryCode: string): string {
    return `${COOKIE_PREFIX}${prefectureId}:${categoryCode}`;
  }
}

// Export singleton instance
export const turnstileCookieService = new TurnstileCookieService();

/**
 * Helper to extract cf_clearance cookie from Playwright cookie array
 */
export function extractCfClearanceCookie(cookies: Array<{
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}>): TurnstileCookie | null {
  const cfCookie = cookies.find(c => c.name === 'cf_clearance');
  
  if (!cfCookie) {
    return null;
  }

  return {
    name: cfCookie.name,
    value: cfCookie.value,
    domain: cfCookie.domain,
    path: cfCookie.path,
    expires: cfCookie.expires,
    httpOnly: cfCookie.httpOnly,
    secure: cfCookie.secure,
    sameSite: cfCookie.sameSite,
  };
}

/**
 * Detect if page has Cloudflare Turnstile challenge
 */
export async function detectTurnstile(page: { $: (selector: string) => Promise<unknown | null> }): Promise<{
  detected: boolean;
  siteKey: string | null;
}> {
  // Common Turnstile selectors
  const turnstileSelectors = [
    '#cf-wrapper',
    '.cf-challenge',
    '.cf-browser-verification',
    'input[name="cf-turnstile-response"]',
    'iframe[src*="challenges.cloudflare.com"]',
    '[data-sitekey]',
  ];

  for (const selector of turnstileSelectors) {
    const element = await page.$(selector);
    if (element) {
      // Try to extract sitekey
      let siteKey: string | null = null;
      
      try {
        const siteKeyElement = await page.$('[data-sitekey]');
        if (siteKeyElement && 'getAttribute' in (siteKeyElement as object)) {
          siteKey = await (siteKeyElement as { getAttribute: (name: string) => Promise<string | null> }).getAttribute('data-sitekey');
        }
      } catch {
        // Ignore extraction errors
      }

      return { detected: true, siteKey };
    }
  }

  return { detected: false, siteKey: null };
}
