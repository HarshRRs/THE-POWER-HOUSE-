import { firefox, type Browser, type BrowserContext, type Page } from 'playwright';
import logger from '../utils/logger.util.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import { BOOTSTRAP_CONFIG } from '../config/bootstrap.config.js';
import { proxyService, type ProxyConfig } from './proxy.service.js';

// ─── Firefox-only User Agents (matching actual engine) ────────────────────
const USER_AGENTS = [
  // Firefox on Windows
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

// ─── Screen resolutions ───────────────────────────────────────────────────
const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 2560, height: 1440 },
];

// ─── French cities for geolocation ───────────────────────────────────────
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

// ─── Firefox-accurate WebGL configs (no Chrome ANGLE strings) ─────────────
// Platform-specific configs: [windows, mac, linux]
const WEBGL_CONFIGS_WINDOWS = [
  { vendor: 'Mozilla', renderer: 'Mozilla' },
  { vendor: 'NVIDIA Corporation', renderer: 'GeForce GTX 1080/PCIe/SSE2' },
  { vendor: 'Intel', renderer: 'Intel(R) UHD Graphics 630' },
  { vendor: 'ATI Technologies Inc.', renderer: 'AMD Radeon RX 580' },
];
const WEBGL_CONFIGS_MAC = [
  { vendor: 'Mozilla', renderer: 'Mozilla' },
  { vendor: 'Intel Inc.', renderer: 'Intel Iris Pro OpenGL Engine' },
  { vendor: 'Apple', renderer: 'Apple M1' },
];
const WEBGL_CONFIGS_LINUX = [
  { vendor: 'Mozilla', renderer: 'Mozilla' },
  { vendor: 'NVIDIA Corporation', renderer: 'GeForce GTX 1080/PCIe/SSE2' },
  { vendor: 'Intel', renderer: 'Mesa Intel(R) UHD Graphics 630 (CFL GT2)' },
  { vendor: 'X.Org', renderer: 'AMD Radeon RX 580 (polaris10, LLVM 15.0.7, DRM 3.49, 6.1.0-18-amd64)' },
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

        // Disable telemetry and crash reporting
        'toolkit.telemetry.enabled': false,
        'datareporting.policy.dataSubmissionEnabled': false,
        'browser.crashReports.unsubmittedCheck.autoSubmit2': false,

        // Disable automation-related features
        'marionette.enabled': false,
        'remote.enabled': false,

        // Privacy settings
        'privacy.trackingprotection.enabled': false,
        'network.cookie.cookieBehavior': 0,
        'privacy.resistFingerprinting': false,

        // WebRTC: prevent IP leak
        'media.peerconnection.enabled': false,
        'media.navigator.enabled': false,

        // Performance
        'network.http.connection-timeout': 45,
        'network.http.response.timeout': 60,
        'dom.max_script_run_time': 30,

        // Cache: fresh sessions
        'browser.cache.disk.enable': false,
        'browser.cache.memory.enable': true,
        'browser.cache.memory.capacity': 65536,

        // Disable safe browsing (slow)
        'browser.safebrowsing.malware.enabled': false,
        'browser.safebrowsing.phishing.enabled': false,

        // Disable prefetching
        'network.prefetch-next': false,
        'network.dns.disablePrefetch': true,

        // French locale
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

  /**
   * Generate a CONSISTENT fingerprint where all vectors align:
   * - UA platform matches navigator.platform
   * - WebGL vendor/renderer matches the OS in the UA
   * - Hardware specs are realistic for the platform
   */
  private generateConsistentFingerprint() {
    const userAgent = this.getRandomElement(USER_AGENTS);
    const resolution = this.getRandomElement(SCREEN_RESOLUTIONS);
    const location = this.getRandomElement(FRENCH_LOCATIONS);

    // Derive platform from UA and select matching WebGL config
    const isMac = userAgent.includes('Macintosh');
    const isLinux = userAgent.includes('Linux');
    const platform = isMac ? 'MacIntel' : isLinux ? 'Linux x86_64' : 'Win32';

    const webglPool = isMac ? WEBGL_CONFIGS_MAC : isLinux ? WEBGL_CONFIGS_LINUX : WEBGL_CONFIGS_WINDOWS;
    const webgl = this.getRandomElement(webglPool);

    // Platform-appropriate hardware specs
    const deviceMemory = isMac
      ? this.getRandomElement([8, 16, 32])      // Macs have more RAM typically
      : this.getRandomElement([4, 8, 16, 32]);
    const hardwareConcurrency = isMac
      ? this.getRandomElement([8, 10, 12, 16])   // Apple Silicon cores
      : this.getRandomElement([4, 6, 8, 12, 16]);

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

  private randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async getContext(proxy: ProxyConfig | null): Promise<BrowserContext> {
    const browser = this.browsers[Math.floor(Math.random() * this.browsers.length)];
    const fingerprint = this.generateConsistentFingerprint();

    const contextOptions: Parameters<Browser['newContext']>[0] = {
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      geolocation: fingerprint.location,
      permissions: ['geolocation'],
      colorScheme: this.getRandomElement(['light', 'light', 'light', 'dark'] as const),
      deviceScaleFactor: fingerprint.viewport.width > 1920 ? 2 : 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      // Full header set matching real Firefox (Camoufox-style)
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
    };

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

  async getPage(targetDomain?: string, excludedProxies?: Set<string>): Promise<PageSession> {
    const proxy = excludedProxies && excludedProxies.size > 0
      ? proxyService.getProxyExcluding(excludedProxies, targetDomain)
      : proxyService.getProxy(targetDomain);
    const context = await this.getContext(proxy);

    // Generate consistent fingerprint for this context's stealth script
    const fingerprint = this.generateConsistentFingerprint();
    await context.addInitScript(`(function() {
      var fp = ${JSON.stringify({
        platform: fingerprint.platform,
        deviceMemory: fingerprint.deviceMemory,
        hardwareConcurrency: fingerprint.hardwareConcurrency,
        webgl: fingerprint.webgl,
      })};

      // ── Navigator overrides ──────────────────────────────────────
      Object.defineProperty(navigator, 'webdriver', { get: function() { return false; } });
      Object.defineProperty(navigator, 'platform', { get: function() { return fp.platform; } });
      Object.defineProperty(navigator, 'deviceMemory', { get: function() { return fp.deviceMemory; } });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: function() { return fp.hardwareConcurrency; } });
      Object.defineProperty(navigator, 'languages', { get: function() { return ['fr-FR', 'fr', 'en-US', 'en']; } });

      // ── WebGL fingerprint (Firefox-accurate vendors) ─────────────
      try {
        var origGetParam = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(param) {
          if (param === 37445) return fp.webgl.vendor;
          if (param === 37446) return fp.webgl.renderer;
          return origGetParam.call(this, param);
        };
        if (typeof WebGL2RenderingContext !== 'undefined') {
          var origGetParam2 = WebGL2RenderingContext.prototype.getParameter;
          WebGL2RenderingContext.prototype.getParameter = function(param) {
            if (param === 37445) return fp.webgl.vendor;
            if (param === 37446) return fp.webgl.renderer;
            return origGetParam2.call(this, param);
          };
        }
      } catch(e) {}

      // ── Plugins: Firefox returns empty PluginArray in modern versions ──
      Object.defineProperty(navigator, 'plugins', {
        get: function() {
          var arr = [];
          arr.length = 0;
          arr.item = function() { return null; };
          arr.namedItem = function() { return null; };
          arr.refresh = function() {};
          return arr;
        },
      });
      Object.defineProperty(navigator, 'mimeTypes', {
        get: function() {
          var arr = [];
          arr.length = 0;
          arr.item = function() { return null; };
          arr.namedItem = function() { return null; };
          return arr;
        },
      });

      // ── Permissions API override ─────────────────────────────────
      try {
        if (navigator.permissions) {
          var origQuery = navigator.permissions.query;
          navigator.permissions.query = function(params) {
            if (params.name === 'notifications') {
              return Promise.resolve({ state: 'denied', onchange: null });
            }
            return origQuery.call(navigator.permissions, params);
          };
        }
      } catch(e) {}

      // ── Canvas fingerprint noise (Camoufox-inspired) ─────────────
      // Adds imperceptible noise to canvas output to defeat canvas fingerprinting
      try {
        var origToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function() {
          try {
            var ctx = this.getContext('2d');
            if (ctx && this.width > 0 && this.height > 0) {
              var w = Math.min(this.width, 16);
              var h = Math.min(this.height, 16);
              var imageData = ctx.getImageData(0, 0, w, h);
              for (var i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = imageData.data[i] ^ 1;
              }
              ctx.putImageData(imageData, 0, 0);
            }
          } catch(e2) {}
          return origToDataURL.apply(this, arguments);
        };
      } catch(e) {}

      // ── AudioContext fingerprint spoofing ─────────────────────────
      try {
        if (typeof AudioContext !== 'undefined') {
          Object.defineProperty(AudioContext.prototype, 'sampleRate', {
            get: function() { return 44100; }
          });
        }
        if (typeof BaseAudioContext !== 'undefined') {
          Object.defineProperty(BaseAudioContext.prototype, 'sampleRate', {
            get: function() { return 44100; }
          });
        }
      } catch(e) {}

      // ── performance.now() jitter (timing attack mitigation) ──────
      try {
        var origNow = performance.now.bind(performance);
        performance.now = function() {
          return origNow() + (Math.random() * 0.1);
        };
      } catch(e) {}

      // ── Date.now() subtle jitter ─────────────────────────────────
      try {
        var origDateNow = Date.now;
        Date.now = function() {
          return origDateNow.call(Date) + Math.floor(Math.random() * 2);
        };
      } catch(e) {}
    })();`);

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

    // Small random startup delay
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
