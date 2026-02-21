import type { PrefectureConfig, ScrapeResult } from '../types/prefecture.types.js';
import { getBrowserPool, type PageSession } from './browser.pool.js';
import { proxyService } from './proxy.service.js';
import { captchaService } from './captcha.service.js';
import { generateScreenshotPath, saveScreenshot } from '../utils/screenshot.util.js';
import { randomDelay } from '../utils/retry.util.js';
import logger from '../utils/logger.util.js';

// Enhanced CAPTCHA selectors for common protection systems
const CAPTCHA_SELECTORS = [
  // reCAPTCHA
  '.g-recaptcha',
  '#recaptcha',
  '[data-sitekey]',
  'iframe[src*="recaptcha"]',
  // hCaptcha
  '.h-captcha',
  'iframe[src*="hcaptcha"]',
  // Cloudflare
  '#cf-wrapper',
  '.cf-browser-verification',
  '#challenge-running',
  '#challenge-form',
  // Generic
  '[class*="captcha"]',
  '[id*="captcha"]',
];

// Common bot detection indicators
const BOT_DETECTION_INDICATORS = [
  'access denied',
  'blocked',
  'bot detected',
  'automated access',
  'suspicious activity',
  'rate limit',
  'too many requests',
  '403 forbidden',
  'please verify',
];

export async function scrapePrefecture(config: PrefectureConfig): Promise<ScrapeResult> {
  const startTime = Date.now();
  const pool = await getBrowserPool();
  let session: PageSession | null = null;

  // Extract target domain for proxy tracking
  let targetDomain: string | undefined;
  try {
    targetDomain = new URL(config.bookingUrl).hostname;
  } catch {
    targetDomain = undefined;
  }

  try {
    session = await pool.getPage(targetDomain);
    const { page, proxy } = session;

    // Navigate to booking page
    logger.debug(`Scraping ${config.name} (${config.id}): ${config.bookingUrl}`);

    const response = await page.goto(config.bookingUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Check for HTTP errors
    if (response && response.status() >= 400) {
      logger.warn(`HTTP ${response.status()} for ${config.id}`);
      if (proxy) proxyService.reportFailure(proxy, targetDomain);

      return {
        status: response.status() === 403 ? 'blocked' : 'error',
        slotsAvailable: 0,
        bookingUrl: config.bookingUrl,
        errorMessage: `HTTP ${response.status()}`,
        responseTimeMs: Date.now() - startTime,
      };
    }

    // Human-like delay
    await randomDelay(1000, 2000);

    // Get page content for CAPTCHA detection
    const pageContent = await page.content();
    const pageUrl = page.url();

    // Check for bot detection
    const lowerContent = pageContent.toLowerCase();
    for (const indicator of BOT_DETECTION_INDICATORS) {
      if (lowerContent.includes(indicator)) {
        logger.warn(`Bot detection indicator found for ${config.id}: ${indicator}`);
        if (proxy) proxyService.reportFailure(proxy, targetDomain);

        const screenshotPath = generateScreenshotPath(config.id, 'blocked');
        const screenshot = await page.screenshot({ fullPage: true });
        await saveScreenshot(screenshot, screenshotPath);

        return {
          status: 'blocked',
          slotsAvailable: 0,
          bookingUrl: pageUrl,
          screenshotPath,
          errorMessage: `Bot detected: ${indicator}`,
          responseTimeMs: Date.now() - startTime,
        };
      }
    }

    // Enhanced CAPTCHA detection
    const captchaResult = await captchaService.detectCaptcha(pageContent, pageUrl);

    // Also check DOM for CAPTCHA elements
    let captchaElement = null;
    for (const selector of CAPTCHA_SELECTORS) {
      try {
        captchaElement = await page.$(selector);
        if (captchaElement) break;
      } catch {
        // Selector not found
      }
    }

    // Check config-specific CAPTCHA selector
    if (!captchaElement && config.selectors.captchaDetect) {
      captchaElement = await page.$(config.selectors.captchaDetect);
    }

    if (captchaResult.detected || captchaElement) {
      logger.warn(`CAPTCHA detected for ${config.id}, type: ${captchaResult.type || 'unknown'}`);

      const screenshotPath = generateScreenshotPath(config.id, 'captcha');
      const screenshot = await page.screenshot({ fullPage: true });
      await saveScreenshot(screenshot, screenshotPath);

      // Try to solve if service is enabled and we have the siteKey
      if (captchaService.isEnabled() && captchaResult.siteKey && captchaResult.type) {
        logger.info(`Attempting CAPTCHA solve for ${config.id}`);

        const solution = await captchaService.solveCaptcha(
          captchaResult.type,
          captchaResult.siteKey,
          pageUrl
        );

        if (solution) {
          // Inject solution and retry (runs in browser context)
          try {
            await page.evaluate(`
              (function(token, type) {
                if (type === 'cloudflare') {
                  var input = document.querySelector('input[name="cf-turnstile-response"]');
                  if (input) {
                    input.value = token;
                  }
                  var form = document.getElementById('challenge-form') || (input ? input.closest('form') : null);
                  if (form) form.submit();
                  
                  if (window.turnstile) {
                    try { window.turnstile.render(); } catch(e){}
                  }
                } else {
                  var textarea = document.querySelector('textarea[name="g-recaptcha-response"]') || 
                                 document.querySelector('textarea[name="h-captcha-response"]');
                  if (textarea) {
                    textarea.value = token;
                    textarea.style.display = 'block';
                  }
                  // Try callback
                  if (window.___grecaptcha_cfg) {
                    var clients = window.___grecaptcha_cfg;
                    for (var key in clients) {
                      if (clients[key] && clients[key].callback) {
                        clients[key].callback(token);
                      }
                    }
                  }
                }
              })('${solution.token.replace(/'/g, "\\'")}', '${solution.type}')
            `);

            await randomDelay(1000, 2000);

            // Check if CAPTCHA is still present
            const newContent = await page.content();
            const newCaptchaResult = await captchaService.detectCaptcha(newContent, page.url());

            if (!newCaptchaResult.detected) {
              logger.info(`CAPTCHA solved successfully for ${config.id}`);
              if (proxy) proxyService.reportSuccess(proxy, targetDomain);
              // Continue with scraping...
            }
          } catch (solveError) {
            logger.error(`CAPTCHA injection failed for ${config.id}:`, solveError);
          }
        }
      }

      // Still CAPTCHA blocked
      if (proxy) proxyService.reportFailure(proxy, targetDomain);

      return {
        status: 'captcha',
        slotsAvailable: 0,
        bookingUrl: pageUrl,
        screenshotPath,
        errorMessage: `CAPTCHA type: ${captchaResult.type || 'unknown'}`,
        responseTimeMs: Date.now() - startTime,
      };
    }

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
    let nextBtnClicked = false;
    if (config.selectors.nextButton) {
      try {
        const nextBtn = page.locator(config.selectors.nextButton);
        if (await nextBtn.isVisible({ timeout: 2000 })) {
          await nextBtn.click();
          await page.waitForLoadState('networkidle');
          await randomDelay(1000, 2000);
          nextBtnClicked = true;
        }
      } catch {
        // Next button not found via config selector
      }
    }

    // Fallback heuristic for Next button
    if (!nextBtnClicked) {
      try {
        // Look for buttons or inputs containing common "Next" terminology in French
        const fallbackLocators = [
          page.locator('button:has-text("Suivant")').first(),
          page.locator('button:has-text("Valider")').first(),
          page.locator('button:has-text("Continuer")').first(),
          page.locator('input[type="submit"][value*="Suivant" i]').first(),
          page.locator('input[type="submit"][value*="Valider" i]').first(),
          page.locator('input[type="submit"][value*="Continuer" i]').first(),
          page.locator('a:has-text("Étape suivante")').first()
        ];

        for (const locator of fallbackLocators) {
          if (await locator.isVisible({ timeout: 500 })) {
            await locator.click();
            await page.waitForLoadState('networkidle');
            await randomDelay(1000, 2000);
            logger.debug(`Found next button using fallback heuristic for ${config.id}`);
            nextBtnClicked = true;
            break;
          }
        }
      } catch {
        // No fallback worked
      }
    }

    // Check for "no slots" message
    let noSlotsConfirmed = false;

    // First try the specific config selector
    if (config.selectors.noSlotIndicator) {
      try {
        const noSlot = await page.$(config.selectors.noSlotIndicator);
        if (noSlot) {
          const noSlotText = await noSlot.textContent();
          if (noSlotText && (
            noSlotText.toLowerCase().includes('aucun') ||
            noSlotText.toLowerCase().includes('indisponible') ||
            noSlotText.toLowerCase().includes('complet')
          )) {
            noSlotsConfirmed = true;
          }
        }
      } catch {
        // config selector failed
      }
    }

    // Fallback heuristic for No Slots
    if (!noSlotsConfirmed) {
      try {
        // Look for common "no availability" phrases anywhere on the page text
        const bodyText = await page.textContent('body');
        if (bodyText) {
          const lowerText = bodyText.toLowerCase();
          if (
            lowerText.includes('aucun rendez-vous n\'est disponible') ||
            lowerText.includes('il n\'existe plus de plage horaire') ||
            lowerText.includes('aucun créneau disponible') ||
            lowerText.includes('tous les rendez-vous sont complets') ||
            lowerText.includes('pas de disponibilité')
          ) {
            noSlotsConfirmed = true;
            logger.debug(`Confirmed no slots using fallback heuristic for ${config.id}`);
          }
        }
      } catch {
        // fallback failed
      }
    }

    if (noSlotsConfirmed) {
      if (proxy) proxyService.reportSuccess(proxy, targetDomain);
      return {
        status: 'no_slots',
        slotsAvailable: 0,
        bookingUrl: page.url(),
        responseTimeMs: Date.now() - startTime,
      };
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
      if (proxy) proxyService.reportSuccess(proxy, targetDomain);

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

    // No slots found - successful scrape
    if (proxy) proxyService.reportSuccess(proxy, targetDomain);

    return {
      status: 'no_slots',
      slotsAvailable: 0,
      bookingUrl: page.url(),
      responseTimeMs: Date.now() - startTime,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Scrape error for ${config.id}: ${errorMessage}`);

    // Report proxy failure on error
    if (session?.proxy) {
      proxyService.reportFailure(session.proxy, targetDomain);
    }

    // Take error screenshot
    let screenshotPath: string | undefined;
    try {
      if (session?.page) {
        screenshotPath = generateScreenshotPath(config.id, 'error');
        const screenshot = await session.page.screenshot({ fullPage: true });
        await saveScreenshot(screenshot, screenshotPath);
      }
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
    if (session) {
      await pool.releasePage(session.page, session.context);
    }
  }
}

export async function testPrefectureScraper(config: PrefectureConfig): Promise<ScrapeResult> {
  logger.info(`Testing scraper for ${config.name} (${config.id})...`);
  const result = await scrapePrefecture(config);
  logger.info(`Test result: ${JSON.stringify(result, null, 2)}`);
  return result;
}
