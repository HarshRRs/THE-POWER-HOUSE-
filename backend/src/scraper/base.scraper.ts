import type { PrefectureConfig, ScrapeResult } from '../types/prefecture.types.js';
import { getBrowserPool } from './browser.pool.js';
import { generateScreenshotPath, saveScreenshot } from '../utils/screenshot.util.js';
import { randomDelay } from '../utils/retry.util.js';
import logger from '../utils/logger.util.js';

export async function scrapePrefecture(config: PrefectureConfig): Promise<ScrapeResult> {
  const startTime = Date.now();
  const pool = await getBrowserPool();
  const { page, context } = await pool.getPage();

  try {
    // Navigate to booking page
    logger.debug(`Scraping ${config.name} (${config.id}): ${config.bookingUrl}`);
    
    await page.goto(config.bookingUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Human-like delay
    await randomDelay(1000, 2000);

    // Handle cookie consent if present
    if (config.selectors.cookieAccept) {
      try {
        const cookieBtn = page.locator(config.selectors.cookieAccept);
        if (await cookieBtn.isVisible({ timeout: 3000 })) {
          await cookieBtn.click();
          await randomDelay(500, 1000);
        }
      } catch {
        // Cookie button not found or already accepted
      }
    }

    // Select procedure if dropdown exists
    if (config.selectors.procedureDropdown) {
      try {
        await page.selectOption(config.selectors.procedureDropdown, config.procedures[0].toString());
        await randomDelay(1500, 2500);
      } catch {
        logger.debug(`No procedure dropdown found for ${config.id}`);
      }
    }

    // Click next button if exists
    if (config.selectors.nextButton) {
      try {
        const nextBtn = page.locator(config.selectors.nextButton);
        if (await nextBtn.isVisible({ timeout: 2000 })) {
          await nextBtn.click();
          await page.waitForLoadState('networkidle');
          await randomDelay(1000, 2000);
        }
      } catch {
        // Next button not found
      }
    }

    // Check for CAPTCHA
    if (config.selectors.captchaDetect) {
      const captcha = await page.$(config.selectors.captchaDetect);
      if (captcha) {
        const screenshotPath = generateScreenshotPath(config.id, 'error');
        const screenshot = await page.screenshot({ fullPage: true });
        await saveScreenshot(screenshot, screenshotPath);

        return {
          status: 'captcha',
          slotsAvailable: 0,
          bookingUrl: page.url(),
          screenshotPath,
          responseTimeMs: Date.now() - startTime,
        };
      }
    }

    // Check for "no slots" message first
    if (config.selectors.noSlotIndicator) {
      const noSlot = await page.$(config.selectors.noSlotIndicator);
      if (noSlot) {
        const noSlotText = await noSlot.textContent();
        if (noSlotText && (
          noSlotText.toLowerCase().includes('aucun') ||
          noSlotText.toLowerCase().includes('indisponible') ||
          noSlotText.toLowerCase().includes('complet')
        )) {
          return {
            status: 'no_slots',
            slotsAvailable: 0,
            bookingUrl: page.url(),
            responseTimeMs: Date.now() - startTime,
          };
        }
      }
    }

    // Check for available slots
    const slotElements = await page.$$(config.selectors.availableSlot);
    const slotsAvailable = slotElements.length;

    if (slotsAvailable > 0) {
      // Extract slot details
      let slotDate: string | undefined;
      let slotTime: string | undefined;

      if (config.selectors.slotDate) {
        slotDate = await page.textContent(config.selectors.slotDate).catch(() => undefined) || undefined;
      }
      if (config.selectors.slotTime) {
        slotTime = await page.textContent(config.selectors.slotTime).catch(() => undefined) || undefined;
      }

      // Take screenshot as proof
      const screenshotPath = generateScreenshotPath(config.id, 'detection');
      const screenshot = await page.screenshot({ fullPage: true });
      await saveScreenshot(screenshot, screenshotPath);

      logger.info(`SLOTS FOUND: ${slotsAvailable} at ${config.name} (${config.id})`);

      return {
        status: 'slots_found',
        slotsAvailable,
        slotDate: slotDate?.trim(),
        slotTime: slotTime?.trim(),
        bookingUrl: page.url(),
        screenshotPath,
        responseTimeMs: Date.now() - startTime,
      };
    }

    // No slots found
    return {
      status: 'no_slots',
      slotsAvailable: 0,
      bookingUrl: page.url(),
      responseTimeMs: Date.now() - startTime,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Scrape error for ${config.id}: ${errorMessage}`);

    // Take error screenshot
    let screenshotPath: string | undefined;
    try {
      screenshotPath = generateScreenshotPath(config.id, 'error');
      const screenshot = await page.screenshot({ fullPage: true });
      await saveScreenshot(screenshot, screenshotPath);
    } catch {
      // Screenshot failed
    }

    return {
      status: errorMessage.includes('timeout') ? 'timeout' : 'error',
      slotsAvailable: 0,
      bookingUrl: config.bookingUrl,
      screenshotPath,
      errorMessage,
      responseTimeMs: Date.now() - startTime,
    };

  } finally {
    await pool.releasePage(page, context);
  }
}

export async function testPrefectureScraper(config: PrefectureConfig): Promise<ScrapeResult> {
  logger.info(`Testing scraper for ${config.name} (${config.id})...`);
  const result = await scrapePrefecture(config);
  logger.info(`Test result: ${JSON.stringify(result, null, 2)}`);
  return result;
}
