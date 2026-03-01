import type { PrefectureConfig, ScrapeResult } from '../types/prefecture.types.js';
import { getBrowserPool, type PageSession } from './browser.pool.js';
import { proxyService } from './proxy.service.js';
import { captchaService } from './captcha.service.js';
import { generateScreenshotPath, saveScreenshot } from '../utils/screenshot.util.js';
import { randomDelay } from '../utils/retry.util.js';
import logger from '../utils/logger.util.js';

/**
 * Category info for category-level scraping
 */
export interface CategoryInfo {
  code: string;
  name: string;
  url: string;
}

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

/**
 * Scrape a specific category of a prefecture
 * 
 * This function enables category-level monitoring for RDV-Prefecture sites
 * where each category has a unique demarche code in the URL.
 * 
 * Example URLs:
 * - Créteil remise de titre: https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/
 * - Créteil renouvellement: https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16041/
 * 
 * @param config - Prefecture configuration
 * @param category - Category info with code, name, and URL
 * @returns ScrapeResult with categoryCode and categoryName populated
 */
export async function scrapePrefectureCategory(
  config: PrefectureConfig,
  category: CategoryInfo
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const pool = await getBrowserPool();
  let session: PageSession | null = null;

  // Use category URL instead of base bookingUrl
  const targetUrl = category.url;

  // Extract target domain for proxy tracking
  let targetDomain: string | undefined;
  try {
    targetDomain = new URL(targetUrl).hostname;
  } catch {
    targetDomain = undefined;
  }

  try {
    session = await pool.getPage(targetDomain);
    const { page, proxy } = session;

    // Navigate to category-specific booking page
    logger.debug(`Scraping ${config.name}:${category.name} (${config.id}:${category.code}): ${targetUrl}`);

    // Track redirects during navigation
    const redirectChain: string[] = [targetUrl];
    
    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Capture final URL after all redirects
    const finalUrl = page.url();
    const urlChanged = finalUrl !== targetUrl && 
                       !finalUrl.includes('error') && 
                       !finalUrl.includes('404');
    
    if (finalUrl !== targetUrl) {
      redirectChain.push(finalUrl);
    }

    // Check for HTTP errors
    if (response && response.status() >= 400) {
      logger.warn(`HTTP ${response.status()} for ${config.id}:${category.code}`);
      if (proxy) proxyService.reportFailure(proxy, targetDomain);

      return {
        status: response.status() === 403 ? 'blocked' : 'error',
        slotsAvailable: 0,
        bookingUrl: targetUrl,
        errorMessage: `HTTP ${response.status()}`,
        responseTimeMs: Date.now() - startTime,
        categoryCode: category.code,
        categoryName: category.name,
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
        logger.warn(`Bot detection indicator found for ${config.id}:${category.code}: ${indicator}`);
        if (proxy) proxyService.reportFailure(proxy, targetDomain);

        const screenshotPath = generateScreenshotPath(`${config.id}_${category.code}`, 'blocked');
        const screenshot = await page.screenshot({ fullPage: true });
        await saveScreenshot(screenshot, screenshotPath);

        return {
          status: 'blocked',
          slotsAvailable: 0,
          bookingUrl: pageUrl,
          screenshotPath,
          errorMessage: `Bot detected: ${indicator}`,
          responseTimeMs: Date.now() - startTime,
          categoryCode: category.code,
          categoryName: category.name,
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
      logger.warn(`CAPTCHA detected for ${config.id}:${category.code}, type: ${captchaResult.type || 'unknown'}`);

      const screenshotPath = generateScreenshotPath(`${config.id}_${category.code}`, 'captcha');
      const screenshot = await page.screenshot({ fullPage: true });
      await saveScreenshot(screenshot, screenshotPath);

      // Try to solve if service is enabled and we have the siteKey
      let captchaSolved = false;

      if (captchaService.isEnabled() && captchaResult.siteKey && captchaResult.type) {
        logger.info(`Attempting CAPTCHA solve for ${config.id}:${category.code}`);

        const solution = await captchaService.solveCaptcha(
          captchaResult.type,
          captchaResult.siteKey,
          pageUrl
        );

        if (solution) {
          // Inject solution and retry
          try {
            await page.evaluate(`
              (function(token, type) {
                if (type === 'cloudflare') {
                  var input = document.querySelector('input[name="cf-turnstile-response"]');
                  if (input) input.value = token;
                  var form = document.getElementById('challenge-form') || (input ? input.closest('form') : null);
                  if (form) form.submit();
                } else {
                  var textarea = document.querySelector('textarea[name="g-recaptcha-response"]') || 
                                 document.querySelector('textarea[name="h-captcha-response"]');
                  if (textarea) {
                    textarea.value = token;
                    textarea.style.display = 'block';
                  }
                }
              })('${solution.token.replace(/'/g, "\\'")}', '${solution.type}')
            `);

            await randomDelay(1000, 2000);

            try {
              await page.waitForLoadState('networkidle', { timeout: 10000 });
            } catch {
              // Timeout is acceptable
            }

            const newContent = await page.content();
            const newCaptchaResult = await captchaService.detectCaptcha(newContent, page.url());

            if (!newCaptchaResult.detected) {
              logger.info(`CAPTCHA solved successfully for ${config.id}:${category.code}`);
              if (proxy) proxyService.reportSuccess(proxy, targetDomain);
              captchaSolved = true;
            }
          } catch (solveError) {
            logger.error(`CAPTCHA injection failed for ${config.id}:${category.code}:`, solveError);
          }
        }
      }

      if (!captchaSolved) {
        if (proxy) proxyService.reportFailure(proxy, targetDomain);

        return {
          status: 'captcha',
          slotsAvailable: 0,
          bookingUrl: pageUrl,
          screenshotPath,
          errorMessage: `CAPTCHA type: ${captchaResult.type || 'unknown'}`,
          responseTimeMs: Date.now() - startTime,
          categoryCode: category.code,
          categoryName: category.name,
        };
      }
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
        // Cookie button not found
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

    // Check for "no slots" message
    let noSlotsConfirmed = false;

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
        // Selector failed
      }
    }

    // Fallback heuristic for No Slots
    if (!noSlotsConfirmed) {
      try {
        const bodyText = await page.textContent('body');
        if (bodyText) {
          const lowerText = bodyText.toLowerCase();
          if (
            lowerText.includes('aucun rendez-vous n\'est disponible') ||
            lowerText.includes('il n\'existe plus de plage horaire') ||
            lowerText.includes('aucun créneau disponible') ||
            lowerText.includes('tous les rendez-vous sont complets')
          ) {
            noSlotsConfirmed = true;
          }
        }
      } catch {
        // Fallback failed
      }
    }

    if (noSlotsConfirmed) {
      if (proxy) proxyService.reportSuccess(proxy, targetDomain);
      return {
        status: 'no_slots',
        slotsAvailable: 0,
        bookingUrl: page.url(),
        responseTimeMs: Date.now() - startTime,
        finalUrl,
        redirectCount: redirectChain.length - 1,
        urlChanged,
        categoryCode: category.code,
        categoryName: category.name,
      };
    }

    // Check for available slots
    const slotElements = await page.$$(config.selectors.availableSlot);
    const slotsAvailable = slotElements.length;

    if (slotsAvailable > 0) {
      let slotDate: string | undefined;
      let slotTime: string | undefined;

      if (config.selectors.slotDate) {
        slotDate = await page.textContent(config.selectors.slotDate).catch(() => undefined) || undefined;
      }
      if (config.selectors.slotTime) {
        slotTime = await page.textContent(config.selectors.slotTime).catch(() => undefined) || undefined;
      }

      const screenshotPath = generateScreenshotPath(`${config.id}_${category.code}`, 'detection');
      const screenshot = await page.screenshot({ fullPage: true });
      await saveScreenshot(screenshot, screenshotPath);

      logger.info(`SLOTS FOUND: ${slotsAvailable} at ${config.name}:${category.name} (${config.id}:${category.code})`);
      if (proxy) proxyService.reportSuccess(proxy, targetDomain);

      return {
        status: 'slots_found',
        slotsAvailable,
        slotDate: slotDate?.trim(),
        slotTime: slotTime?.trim(),
        bookingUrl: page.url(),
        screenshotPath,
        responseTimeMs: Date.now() - startTime,
        finalUrl,
        redirectCount: redirectChain.length - 1,
        urlChanged,
        categoryCode: category.code,
        categoryName: category.name,
      };
    }

    // No slots found
    if (proxy) proxyService.reportSuccess(proxy, targetDomain);

    return {
      status: 'no_slots',
      slotsAvailable: 0,
      bookingUrl: page.url(),
      responseTimeMs: Date.now() - startTime,
      finalUrl,
      redirectCount: redirectChain.length - 1,
      urlChanged,
      categoryCode: category.code,
      categoryName: category.name,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Scrape error for ${config.id}:${category.code}: ${errorMessage}`);

    if (session?.proxy) {
      proxyService.reportFailure(session.proxy, targetDomain);
    }

    let screenshotPath: string | undefined;
    try {
      if (session?.page) {
        screenshotPath = generateScreenshotPath(`${config.id}_${category.code}`, 'error');
        const screenshot = await session.page.screenshot({ fullPage: true });
        await saveScreenshot(screenshot, screenshotPath);
      }
    } catch {
      // Screenshot failed
    }

    return {
      status: errorMessage.includes('timeout') ? 'timeout' : 'error',
      slotsAvailable: 0,
      bookingUrl: targetUrl,
      screenshotPath,
      errorMessage,
      responseTimeMs: Date.now() - startTime,
      categoryCode: category.code,
      categoryName: category.name,
    };

  } finally {
    if (session) {
      await pool.releasePage(session.page, session.context);
    }
  }
}
