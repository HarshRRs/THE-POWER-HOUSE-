import { firefox, type Browser, type BrowserContext, type Page } from 'playwright';
import logger from '../utils/logger.util.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import { BOOTSTRAP_CONFIG } from '../config/bootstrap.config.js';
import { proxyService, type ProxyConfig } from './proxy.service.js';

// Firefox user agents only - matching the actual browser engine we use.
// Using Chrome/Safari UAs with Firefox creates detectable mismatches.
const USER_AGENTS = [
  // Firefox on Windows (current + recent versions)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:129.0) Gecko/20100101 Firefox/129.0',
  // Firefox on Linux
  'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0',
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
        // Core anti-detection
        'dom.webdriver.enabled': false,
        'useragentoverride': '',
        'general.platform.override': '',

        // Disable telemetry and crash reporting that leaks automation signals
        'toolkit.telemetry.enabled': false,
        'datareporting.policy.dataSubmissionEnabled': false,
        'browser.crashReports.unsubmittedCheck.autoSubmit2': false,

        // Disable automation-related features
        'marionette.enabled': false,
        'remote.enabled': false,

        // Privacy: resist fingerprinting without breaking sites
        'privacy.trackingprotection.enabled': false,
        'network.cookie.cookieBehavior': 0,
        'privacy.resistFingerprinting': false, // Don't enable - it breaks viewport randomization

        // WebRTC: prevent IP leak through WebRTC
        'media.peerconnection.enabled': false,
        'media.navigator.enabled': false,

        // Performance: prevent timeout issues
        'network.http.connection-timeout': 45,
        'network.http.response.timeout': 60,
        'dom.max_script_run_time': 30,

        // Cache: use fresh sessions
        'browser.cache.disk.enable': false,
        'browser.cache.memory.enable': true,
        'browser.cache.memory.capacity': 65536,

        // Disable safe browsing lookups (slows down page loads)
        'browser.safebrowsing.malware.enabled': false,
        'browser.safebrowsing.phishing.enabled': false,

        // Disable prefetching (reduces noise and proxy load)
        'network.prefetch-next': false,
        'network.dns.disablePrefetch': true,

        // Accept French language headers
        'intl.accept_languages': 'fr-FR,fr,en-US,en',
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

    // Derive platform from user agent consistently
    const isMac = userAgent.includes('Macintosh');
    const isLinux = userAgent.includes('Linux');
    const platform = isMac ? 'MacIntel' : isLinux ? 'Linux x86_64' : 'Win32';

    // Realistic device memory (4, 8, 16, 32 GB)
    const deviceMemory = this.getRandomElement([4, 8, 16, 32]);

    // Realistic hardware concurrency (4, 6, 8, 12, 16 cores)
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

  /**
   * Add a random human-like delay (between min and max ms)
   */
  private randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async getContext(proxy: ProxyConfig | null): Promise<BrowserContext> {
    const browser = this.browsers[Math.floor(Math.random() * this.browsers.length)];
    const fingerprint = this.generateFingerprint();

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      geolocation: fingerprint.location,
      permissions: ['geolocation'],
      colorScheme: this.getRandomElement(['light', 'light', 'light', 'dark'] as const), // 75% light, 25% dark
      deviceScaleFactor: fingerprint.viewport.width > 1920 ? 2 : 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      // Accept-Language header matching Firefox prefs
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
      },
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

    // Inject stealth overrides before any page navigation
    const fingerprint = this.generateFingerprint();
    await context.addInitScript((fp) => {
      // Override navigator.webdriver to false
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      // Override navigator.platform
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform });

      // Override navigator.deviceMemory
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });

      // Override navigator.hardwareConcurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });

      // Override navigator.languages
      Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] });

      // Override WebGL fingerprint
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
        if (parameter === 37445) return fp.webgl.vendor;   // UNMASKED_VENDOR_WEBGL
        if (parameter === 37446) return fp.webgl.renderer;  // UNMASKED_RENDERER_WEBGL
        return getParameter.call(this, parameter);
      };

      // Prevent detection of automation plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const plugins = [
            { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: '' },
            { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: '' },
          ];
          Object.defineProperty(plugins, 'length', { get: () => 3 });
          return plugins;
        },
      });

      // Override permissions API to avoid detection
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = (parameters: PermissionDescriptor) => {
          if (parameters.name === 'notifications') {
            return Promise.resolve({ state: 'denied', onchange: null } as PermissionStatus);
          }
          return originalQuery.call(navigator.permissions, parameters);
        };
      }
    }, fingerprint);

    const page = await context.newPage();

    // Set realistic timeouts
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

    // Add small random delay before returning page (simulates human startup)
    await this.randomDelay(100, 500);

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
