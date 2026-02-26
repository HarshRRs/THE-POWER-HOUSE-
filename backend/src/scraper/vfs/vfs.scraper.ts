import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type { VfsScrapeResult, VfsAvailableDate } from '../../types/vfs.types.js';
import { getVfsConfig } from './vfs.config.js';
import logger from '../../utils/logger.util.js';
import path from 'path';
import fs from 'fs/promises';

// Browser instance management - reuse for efficiency
let browserInstance: Browser | null = null;
let browserLastUsed = 0;
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes (reduced for RAM savings)

// Screenshot directory
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './screenshots/vfs';

// Max concurrent browsers (configurable via env)
const MAX_CONCURRENT_BROWSERS = parseInt(process.env.MAX_CONCURRENT_BROWSERS || '3', 10);
let activeBrowserCount = 0;

// Resource types to block for faster loading
const BLOCKED_RESOURCE_TYPES = ['image', 'stylesheet', 'font', 'media'];

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    browserLastUsed = Date.now();
    return browserInstance;
  }

  // Wait if we're at max concurrent browsers
  while (activeBrowserCount >= MAX_CONCURRENT_BROWSERS) {
    logger.debug(`Waiting for browser slot (${activeBrowserCount}/${MAX_CONCURRENT_BROWSERS} active)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.info('Launching new Playwright browser for VFS scraping (optimized for low RAM)');
  activeBrowserCount++;
  
  browserInstance = await chromium.launch({
    headless: true,
    args: [
      // Basic sandbox settings
      '--no-sandbox',
      '--disable-setuid-sandbox',
      
      // Memory optimizations
      '--disable-dev-shm-usage',           // Use /tmp instead of /dev/shm
      '--disable-gpu',                      // No GPU compositing
      '--disable-accelerated-2d-canvas',    // No hardware acceleration
      '--disable-software-rasterizer',      // Disable software rasterization
      '--single-process',                   // Run in single process (saves ~50MB)
      
      // Disable unnecessary features
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      
      // Disable media & images at browser level
      '--disable-images',
      '--blink-settings=imagesEnabled=false',
      
      // Anti-detection
      '--disable-blink-features=AutomationControlled',
      
      // Memory limits
      '--js-flags=--max-old-space-size=128', // Limit JS heap to 128MB
    ],
  });

  browserLastUsed = Date.now();
  return browserInstance;
}

/**
 * Close browser if idle for too long
 */
export async function cleanupIdleBrowser(): Promise<void> {
  if (browserInstance && (Date.now() - browserLastUsed) > BROWSER_IDLE_TIMEOUT) {
    logger.info('Closing idle VFS browser instance');
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    activeBrowserCount = Math.max(0, activeBrowserCount - 1);
  }
}

/**
 * Force close browser (for shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    activeBrowserCount = 0;
  }
}

/**
 * Get current browser stats
 */
export function getBrowserStats(): { active: number; max: number; idleTimeoutMs: number } {
  return {
    active: activeBrowserCount,
    max: MAX_CONCURRENT_BROWSERS,
    idleTimeoutMs: BROWSER_IDLE_TIMEOUT,
  };
}

/**
 * Create a new page with stealth settings
 */
async function createStealthPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },  // Smaller viewport = less memory
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
    permissions: [],
    javaScriptEnabled: true,
    // Disable unnecessary features
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // Block heavy resources to save bandwidth and memory
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();
    if (BLOCKED_RESOURCE_TYPES.includes(resourceType)) {
      return route.abort();
    }
    return route.continue();
  });

  // Stealth mode: override navigator properties
  await page.addInitScript(() => {
    // Override webdriver property
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'hi'],
    });
    
    // Override platform
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });

    // Chrome runtime mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = { runtime: {} };
  });

  return { context, page };
}

/**
 * Wait for Cloudflare challenge to pass
 */
async function waitForCloudflare(page: Page, timeout = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const content = await page.content();
    
    // Check for Cloudflare challenge indicators
    if (content.includes('Just a moment') || 
        content.includes('Checking your browser') ||
        content.includes('cf-browser-verification')) {
      logger.debug('Waiting for Cloudflare challenge...');
      await page.waitForTimeout(2000);
      continue;
    }
    
    // Challenge passed
    return true;
  }
  
  return false;
}

/**
 * Take a screenshot for debugging
 */
async function takeScreenshot(page: Page, name: string): Promise<string | undefined> {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  } catch (error) {
    logger.warn('Failed to take screenshot:', error);
    return undefined;
  }
}

/**
 * Parse available dates from the VFS calendar page
 */
async function parseAvailableDates(page: Page): Promise<VfsAvailableDate[]> {
  const availableDates: VfsAvailableDate[] = [];
  
  // VFS typically uses a calendar widget - look for available date cells
  const dates = await page.$$eval(
    '.calendar-day:not(.disabled):not(.unavailable), .datepicker-day:not(.disabled), td.day:not(.disabled)',
    (elements) => {
      return elements
        .filter((el) => {
          const classes = el.className;
          return !classes.includes('disabled') && 
                 !classes.includes('unavailable') && 
                 !classes.includes('past');
        })
        .map((el) => ({
          date: el.getAttribute('data-date') || el.textContent?.trim() || '',
          available: true,
        }));
    }
  ).catch(() => []);

  for (const dateInfo of dates) {
    if (dateInfo.date) {
      availableDates.push({
        date: dateInfo.date,
        slots: ['Available'], // VFS doesn't always show specific time slots
      });
    }
  }

  return availableDates;
}

/**
 * Main VFS scraper function
 */
export async function scrapeVfs(
  configId: string,
  centerId: string,
  categoryId: string
): Promise<VfsScrapeResult> {
  const startTime = Date.now();
  const config = getVfsConfig(configId);
  
  if (!config) {
    return {
      status: 'error',
      centerId,
      centerName: 'Unknown',
      categoryId,
      categoryName: 'Unknown',
      slotsAvailable: 0,
      availableDates: [],
      bookingUrl: '',
      errorMessage: `VFS config not found: ${configId}`,
      responseTimeMs: Date.now() - startTime,
    };
  }

  const center = config.centers.find(c => c.id === centerId);
  const category = config.visaCategories.find(c => c.id === categoryId);
  
  if (!center || !category) {
    return {
      status: 'error',
      centerId,
      centerName: center?.name || 'Unknown',
      categoryId,
      categoryName: category?.name || 'Unknown',
      slotsAvailable: 0,
      availableDates: [],
      bookingUrl: config.appointmentUrl,
      errorMessage: `Center or category not found`,
      responseTimeMs: Date.now() - startTime,
    };
  }

  let context: BrowserContext | null = null;
  let page: Page | null = null;
  let screenshotPath: string | undefined;

  try {
    const browser = await getBrowser();
    const pageSetup = await createStealthPage(browser);
    context = pageSetup.context;
    page = pageSetup.page;

    // Set reasonable timeout
    page.setDefaultTimeout(30000);

    logger.info(`Scraping VFS: ${config.name} - ${center.name} - ${category.name}`);

    // Navigate to appointment page
    await page.goto(config.appointmentUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for Cloudflare challenge if present
    const cloudflareResult = await waitForCloudflare(page);
    if (!cloudflareResult) {
      screenshotPath = await takeScreenshot(page, `cloudflare-blocked-${configId}`);
      return {
        status: 'captcha_blocked',
        centerId,
        centerName: center.name,
        categoryId,
        categoryName: category.name,
        slotsAvailable: 0,
        availableDates: [],
        bookingUrl: config.appointmentUrl,
        errorMessage: 'Blocked by Cloudflare challenge',
        responseTimeMs: Date.now() - startTime,
        screenshotPath,
      };
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Check if we're on the appointment booking page
    const pageContent = await page.content();
    
    // VFS appointment pages typically have specific elements
    // Look for "No appointment available" or similar messages
    const noAppointmentMessages = [
      'no appointment',
      'no slots available',
      'appointments not available',
      'currently unavailable',
      'no dates available',
      'fully booked',
    ];

    const lowerContent = pageContent.toLowerCase();
    const isNoAppointment = noAppointmentMessages.some(msg => lowerContent.includes(msg));

    if (isNoAppointment) {
      logger.info(`No slots available: ${config.name} - ${center.name} - ${category.name}`);
      return {
        status: 'no_slots',
        centerId,
        centerName: center.name,
        categoryId,
        categoryName: category.name,
        slotsAvailable: 0,
        availableDates: [],
        bookingUrl: config.appointmentUrl,
        responseTimeMs: Date.now() - startTime,
      };
    }

    // Try to parse available dates from the page
    const availableDates = await parseAvailableDates(page);
    
    // Also check for specific availability indicators
    const hasAvailability = await page.$$eval(
      '.available, .slot-available, .appointment-available, [data-available="true"]',
      (elements) => elements.length > 0
    ).catch(() => false);

    // Check for booking buttons or availability text
    const bookingIndicators = [
      'book appointment',
      'schedule appointment',
      'select date',
      'choose slot',
      'available dates',
    ];
    
    const hasBookingOption = bookingIndicators.some(ind => lowerContent.includes(ind));

    if (availableDates.length > 0 || hasAvailability || hasBookingOption) {
      screenshotPath = await takeScreenshot(page, `slots-found-${configId}-${centerId}`);
      
      const totalSlots = availableDates.length || 1;
      
      logger.info(
        `SLOTS FOUND: ${totalSlots} dates available for ${config.name} - ${center.name} - ${category.name}`
      );

      return {
        status: 'slots_found',
        centerId,
        centerName: center.name,
        categoryId,
        categoryName: category.name,
        slotsAvailable: totalSlots,
        availableDates,
        bookingUrl: config.appointmentUrl,
        responseTimeMs: Date.now() - startTime,
        screenshotPath,
      };
    }

    // Default: no slots found
    return {
      status: 'no_slots',
      centerId,
      centerName: center.name,
      categoryId,
      categoryName: category.name,
      slotsAvailable: 0,
      availableDates: [],
      bookingUrl: config.appointmentUrl,
      responseTimeMs: Date.now() - startTime,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`VFS scrape error for ${configId}/${centerId}/${categoryId}: ${errorMessage}`);

    if (page) {
      screenshotPath = await takeScreenshot(page, `error-${configId}-${centerId}`);
    }

    const isTimeout = errorMessage.toLowerCase().includes('timeout');
    
    return {
      status: isTimeout ? 'timeout' : 'error',
      centerId,
      centerName: center?.name || centerId,
      categoryId,
      categoryName: category?.name || categoryId,
      slotsAvailable: 0,
      availableDates: [],
      bookingUrl: config?.appointmentUrl || '',
      errorMessage,
      responseTimeMs: Date.now() - startTime,
      screenshotPath,
    };
  } finally {
    // Clean up context (but keep browser for reuse)
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

/**
 * Check multiple centers/categories in parallel with rate limiting
 */
export async function scrapeVfsBatch(
  configId: string,
  jobs: Array<{ centerId: string; categoryId: string }>
): Promise<VfsScrapeResult[]> {
  const results: VfsScrapeResult[] = [];
  
  // Process sequentially with delays to avoid rate limiting
  for (const job of jobs) {
    const result = await scrapeVfs(configId, job.centerId, job.categoryId);
    results.push(result);
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return results;
}
