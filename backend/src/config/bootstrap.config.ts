/**
 * BOOTSTRAP MODE CONFIGURATION
 * =============================
 * Optimized for €15-20/month budget
 * 
 * Enable by setting: BOOTSTRAP_MODE=true in .env
 * 
 * What Bootstrap Mode Does:
 * - Longer scraping intervals (saves proxy bandwidth)
 * - Only monitors TOP 5 high-demand prefectures
 * - Single browser instance (saves RAM)
 * - Manual CAPTCHA solving via Telegram alerts
 * - Aggressive caching to minimize requests
 */

export interface BootstrapConfig {
  enabled: boolean;
  
  // Scraping settings
  scraperIntervalMultiplier: number;  // Multiply normal intervals by this
  maxBrowsers: number;
  pageTimeout: number;
  
  // Prefecture limits
  maxPrefectures: number;
  priorityPrefectureIds: string[];
  
  // Bandwidth optimization
  skipScreenshots: boolean;
  minIntervalSeconds: number;
  
  // Manual CAPTCHA mode
  manualCaptchaMode: boolean;
  captchaAlertTelegramId: string | null;
}

const isBootstrapMode = process.env.BOOTSTRAP_MODE === 'true';

export const BOOTSTRAP_CONFIG: BootstrapConfig = {
  enabled: isBootstrapMode,
  
  // Scraping: 3x slower to save bandwidth
  scraperIntervalMultiplier: isBootstrapMode ? 3 : 1,
  maxBrowsers: isBootstrapMode ? 1 : 3,
  pageTimeout: 45000, // Longer timeout for slow proxies
  
  // Only monitor top 5 prefectures in bootstrap mode
  maxPrefectures: isBootstrapMode ? 5 : 999,
  priorityPrefectureIds: [
    'paris_75',      // Paris - Highest demand
    'bobigny_93',    // Seine-Saint-Denis
    'creteil_94',    // Val-de-Marne
    'lyon_69',       // Lyon
    'marseille_13',  // Marseille
  ],
  
  // Save bandwidth
  skipScreenshots: isBootstrapMode,
  minIntervalSeconds: isBootstrapMode ? 180 : 30, // 3 min minimum in bootstrap
  
  // Manual CAPTCHA - send Telegram alert instead of auto-solving
  manualCaptchaMode: isBootstrapMode || !process.env.TWOCAPTCHA_API_KEY,
  captchaAlertTelegramId: process.env.ADMIN_TELEGRAM_CHAT_ID || null,
};

/**
 * Get effective scraping interval for a prefecture
 */
export function getEffectiveInterval(baseInterval: number): number {
  const effective = baseInterval * BOOTSTRAP_CONFIG.scraperIntervalMultiplier;
  return Math.max(effective, BOOTSTRAP_CONFIG.minIntervalSeconds);
}

/**
 * Check if a prefecture should be scraped in bootstrap mode
 */
export function shouldScrapePrefecture(prefectureId: string): boolean {
  if (!BOOTSTRAP_CONFIG.enabled) return true;
  return BOOTSTRAP_CONFIG.priorityPrefectureIds.includes(prefectureId);
}

/**
 * Log bootstrap mode status
 */
export function logBootstrapStatus(): void {
  if (BOOTSTRAP_CONFIG.enabled) {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 BOOTSTRAP MODE ENABLED - Budget Optimization Active');
    console.log('═══════════════════════════════════════════════════');
    console.log(`• Max Prefectures: ${BOOTSTRAP_CONFIG.maxPrefectures}`);
    console.log(`• Min Interval: ${BOOTSTRAP_CONFIG.minIntervalSeconds}s`);
    console.log(`• Interval Multiplier: ${BOOTSTRAP_CONFIG.scraperIntervalMultiplier}x`);
    console.log(`• Max Browsers: ${BOOTSTRAP_CONFIG.maxBrowsers}`);
    console.log(`• Manual CAPTCHA: ${BOOTSTRAP_CONFIG.manualCaptchaMode}`);
    console.log(`• Screenshots: ${BOOTSTRAP_CONFIG.skipScreenshots ? 'Disabled' : 'Enabled'}`);
    console.log('═══════════════════════════════════════════════════');
  }
}

export default BOOTSTRAP_CONFIG;
