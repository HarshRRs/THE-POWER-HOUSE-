import { firefox, type Browser, type BrowserContext, type Page } from 'playwright';
import logger from '../utils/logger.util.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import { BOOTSTRAP_CONFIG } from '../config/bootstrap.config.js';
import { proxyService, type ProxyConfig } from './proxy.service.js';

// Firefox + Playwright uses its own protocol (NOT Chrome DevTools Protocol)
// which Cloudflare's managed challenge pages cannot detect.
// This eliminates the need for stealth plugins entirely.

// Extended user agent list with realistic versions (Updated to newer versions)
const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
];

// Realistic screen resolutions
const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
];

// French cities for geolocation randomization
const FRENCH_LOCATIONS = [
  { latitude: 48.8566, longitude: 2.3522, city: 'Paris' },
  { latitude: 43.2965, longitude: 5.3698, city: 'Marseille' },
  { latitude: 45.7640, longitude: 4.8357, city: 'Lyon' },
  { latitude: 43.6047, longitude: 1.4442, city: 'Toulouse' },
  { latitude: 43.7102, longitude: 7.2620, city: 'Nice' },
  { latitude: 44.8378, longitude: -0.5792, city: 'Bordeaux' },
  { latitude: 47.2184, longitude: -1.5536, city: 'Nantes' },
  { latitude: 48.5734, longitude: 7.7521, city: 'Strasbourg' },
  { latitude: 50.6292, longitude: 3.0573, city: 'Lille' },
];

// WebGL vendor/renderer combinations
const WEBGL_CONFIGS = [
  { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0)' },
  { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)' },
  { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0)' },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Pro OpenGL Engine' },
  { vendor: 'Apple Inc.', renderer: 'Apple M1' },
];

interface PageSession {
  page: Page;
  context: BrowserContext;
  proxy: ProxyConfig | null;
}

class BrowserPool {
  private browsers: Browser[] = [];
  private maxBrowsers: number;
  private isShuttingDown = false;

  constructor(maxBrowsers = SCRAPER_CONFIG.maxBrowsers) {
    this.maxBrowsers = maxBrowsers;
  }

  async initialize(): Promise<void> {
    logger.info(`Initializing browser pool with ${this.maxBrowsers} browsers`);
    logger.info(`Proxy service: ${proxyService.isEnabled() ? 'ENABLED' : 'DISABLED'}`);

    for (let i = 0; i < this.maxBrowsers; i++) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
    }

    logger.info(`Browser pool initialized: ${this.browsers.length} browsers ready`);
  }

  private async createBrowser(): Promise<Browser> {
    const browser = await firefox.launch({
      headless: true,
      firefoxUserPrefs: {
        'dom.webdriver.enabled': false,
      },
    });

    browser.on('disconnected', () => {
      if (!this.isShuttingDown) {
        logger.warn('Browser disconnected, attempting to reconnect...');
        this.replaceBrowser(browser);
      }
    });

    return browser;
  }

  private async replaceBrowser(oldBrowser: Browser): Promise<void> {
    const index = this.browsers.indexOf(oldBrowser);
    if (index > -1) {
      try {
        const newBrowser = await this.createBrowser();
        this.browsers[index] = newBrowser;
        logger.info('Browser replaced successfully');
      } catch (error) {
        logger.error('Failed to replace browser:', error);
      }
    }
  }

  private getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private generateFingerprint() {
    const userAgent = this.getRandomElement(USER_AGENTS);
    const resolution = this.getRandomElement(SCREEN_RESOLUTIONS);
    const location = this.getRandomElement(FRENCH_LOCATIONS);
    const webgl = this.getRandomElement(WEBGL_CONFIGS);

    // Determine platform from user agent
    const isMac = userAgent.includes('Macintosh');
    const isWindows = userAgent.includes('Windows');
    const platform = isMac ? 'MacIntel' : isWindows ? 'Win32' : 'Linux x86_64';

    // Generate realistic device memory (4, 8, 16, 32 GB)
    const deviceMemory = this.getRandomElement([4, 8, 16, 32]);

    // Generate realistic hardware concurrency (4, 6, 8, 12, 16 cores)
    const hardwareConcurrency = this.getRandomElement([4, 6, 8, 12, 16]);

    return {
      userAgent,
      viewport: resolution,
      location,
      webgl,
      platform,
      deviceMemory,
      hardwareConcurrency,
    };
  }

  async getContext(proxy: ProxyConfig | null): Promise<BrowserContext> {
    const browser = this.browsers[Math.floor(Math.random() * this.browsers.length)];
    const fingerprint = this.generateFingerprint();

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      viewport: fingerprint.viewport,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      geolocation: fingerprint.location,
      permissions: ['geolocation'],
      colorScheme: 'light',
      deviceScaleFactor: fingerprint.viewport.width > 1920 ? 2 : 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
    };

    // Add proxy if available
    if (proxy) {
      contextOptions.proxy = {
        server: proxy.server,
        username: proxy.username,
        password: proxy.password,
      };
      logger.debug(`Using proxy: ${proxy.server}`);
    }

    const context = await browser.newContext(contextOptions);

    return context;
  }

  async getPage(targetDomain?: string): Promise<PageSession> {
    const proxy = proxyService.getProxy(targetDomain);
    const context = await this.getContext(proxy);
    const page = await context.newPage();

    // Add human-like behavior
    const pageTimeout = BOOTSTRAP_CONFIG.enabled ? BOOTSTRAP_CONFIG.pageTimeout : SCRAPER_CONFIG.pageTimeout;
    page.setDefaultTimeout(pageTimeout);

    // Block unnecessary resources (keep images - needed for CAPTCHA solving)
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['media', 'font'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    return { page, context, proxy };
  }

  async releasePage(page: Page, context: BrowserContext): Promise<void> {
    try {
      await page.close();
      await context.close();
    } catch (error) {
      logger.debug('Error closing page/context:', error);
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    logger.info('Shutting down browser pool...');

    for (const browser of this.browsers) {
      try {
        await browser.close();
      } catch (error) {
        logger.debug('Error closing browser:', error);
      }
    }

    this.browsers = [];
    logger.info('Browser pool shut down');
  }

  getBrowserCount(): number {
    return this.browsers.length;
  }
}

// Singleton instance
let browserPool: BrowserPool | null = null;

export async function getBrowserPool(): Promise<BrowserPool> {
  if (!browserPool) {
    const maxBrowsers = BOOTSTRAP_CONFIG.enabled ? BOOTSTRAP_CONFIG.maxBrowsers : SCRAPER_CONFIG.maxBrowsers;
    browserPool = new BrowserPool(maxBrowsers);
    await browserPool.initialize();
  }
  return browserPool;
}

export async function shutdownBrowserPool(): Promise<void> {
  if (browserPool) {
    await browserPool.shutdown();
    browserPool = null;
  }
}

export { BrowserPool };
export type { PageSession };
