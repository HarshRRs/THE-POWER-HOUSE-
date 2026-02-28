/**
 * BOOTSTRAP MODE CONFIGURATION
 * =============================
 * Controls which prefectures are actively monitored.
 * 
 * BOOTSTRAP_MODE=true  -> Monitor TOP 20 high-demand prefectures at full speed
 * BOOTSTRAP_MODE=false -> Monitor ALL prefectures (requires more resources)
 */

export interface BootstrapConfig {
  enabled: boolean;
  
  // Scraping settings
  scraperIntervalMultiplier: number;
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
  
  // Full speed for 20 prefectures, normal speed for all
  scraperIntervalMultiplier: 1,
  maxBrowsers: isBootstrapMode ? 2 : 3,
  pageTimeout: 30000,
  
  // Monitor top 20 high-demand prefectures (Tier 1 + Tier 2)
  maxPrefectures: isBootstrapMode ? 20 : 999,
  priorityPrefectureIds: [
    // TIER 1 - Île-de-France (8 prefectures)
    'paris_75',       // Paris - Highest demand
    'bobigny_93',     // Seine-Saint-Denis
    'creteil_94',     // Val-de-Marne
    'nanterre_92',    // Hauts-de-Seine
    'evry_91',        // Essonne
    'cergy_95',       // Val-d'Oise
    'melun_77',       // Seine-et-Marne
    'versailles_78',  // Yvelines
    // TIER 2 - Major Cities (12 prefectures)
    'lyon_69',        // Lyon
    'marseille_13',   // Marseille
    'toulouse_31',    // Toulouse
    'lille_59',       // Lille
    'nantes_44',      // Nantes
    'bordeaux_33',    // Bordeaux
    'montpellier_34', // Montpellier
    'strasbourg_67',  // Strasbourg
    'nice_06',        // Nice
    'rouen_76',       // Rouen
    'rennes_35',      // Rennes
    'grenoble_38',    // Grenoble
  ],
  
  // Full monitoring: take screenshots, fast intervals
  skipScreenshots: false,
  minIntervalSeconds: 30, // 30s minimum for high monitoring
  
  // Manual CAPTCHA - send Telegram alert instead of auto-solving
  manualCaptchaMode: !process.env.TWOCAPTCHA_API_KEY,
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
