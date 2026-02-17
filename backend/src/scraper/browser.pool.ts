import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, BrowserContext, Page } from 'playwright';
import logger from '../utils/logger.util.js';
import { SCRAPER_CONFIG } from '../config/constants.js';

// Apply stealth plugin
chromium.use(StealthPlugin());

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

class BrowserPool {
  private browsers: Browser[] = [];
  private maxBrowsers: number;
  private isShuttingDown = false;

  constructor(maxBrowsers = SCRAPER_CONFIG.maxBrowsers) {
    this.maxBrowsers = maxBrowsers;
  }

  async initialize(): Promise<void> {
    logger.info(`Initializing browser pool with ${this.maxBrowsers} browsers`);
    
    for (let i = 0; i < this.maxBrowsers; i++) {
      const browser = await this.createBrowser();
      this.browsers.push(browser);
    }

    logger.info(`Browser pool initialized: ${this.browsers.length} browsers ready`);
  }

  private async createBrowser(): Promise<Browser> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
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

  async getContext(): Promise<BrowserContext> {
    const browser = this.browsers[Math.floor(Math.random() * this.browsers.length)];
    
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const context = await browser.newContext({
      userAgent,
      viewport: { width: 1920, height: 1080 },
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      geolocation: { latitude: 48.8566, longitude: 2.3522 }, // Paris
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    return context;
  }

  async getPage(): Promise<{ page: Page; context: BrowserContext }> {
    const context = await this.getContext();
    const page = await context.newPage();

    // Add human-like behavior
    page.setDefaultTimeout(SCRAPER_CONFIG.pageTimeout);

    return { page, context };
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
    browserPool = new BrowserPool();
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
