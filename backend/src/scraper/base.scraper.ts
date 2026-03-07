import type { PrefectureConfig, ScrapeResult } from '../types/prefecture.types.js';
import { getBrowserPool, type PageSession } from './browser.pool.js';
import { proxyService } from './proxy.service.js';
import { captchaService } from './captcha.service.js';
import { solveImageCaptcha } from '../services/captcha.service.js';
import { generateScreenshotPath, saveScreenshot } from '../utils/screenshot.util.js';
import { randomDelay } from '../utils/retry.util.js';
import { humanScroll, humanReadPage, humanClick } from '../utils/human.util.js';
import { handleUrlChange } from '../services/url-discovery.service.js';
import logger from '../utils/logger.util.js';

/**
 * Category info for category-level scraping
 */
export interface CategoryInfo {
  code: string;
  name: string;
  url: string;
}

// ════════════════════════════════════════════════════════════════════════
// RDV-Prefecture DIRECT API Scraper — NO CAPTCHA, NO BROWSER
// ════════════════════════════════════════════════════════════════════════
//
// How it works:
//   The RDV-Prefecture website is a Vue.js SPA. The CAPTCHA only guards the
//   initial page render. Once the page loads, the frontend calls these JSON
//   APIs internally to display slots:
//
//   1. GET  /rdvpref/reservation/demarche/{code}/  → Sets JSESSIONID cookie
//   2. POST /api/nextSlot                          → Checks if any slot exists
//   3. GET  /api/lieu/{demarcheId}                 → Lists available locations
//   4. GET  /api/creneau/{lieuId}/{demarcheId}     → Lists available time slots
//
//   By calling these APIs directly with fetch(), we completely bypass the
//   CAPTCHA. This is ~100x faster and costs $0.
// ════════════════════════════════════════════════════════════════════════

const RDV_PREF_BASE = 'https://www.rdv-prefecture.interieur.gouv.fr';

interface RdvLieu {
  id: number;
  nom: string;
  adresse?: string;
}

interface RdvCreneau {
  date: string;
  heure: string;
  lieuId?: number;
}

/**
 * Extract the demarche code from a full RDV-Prefecture URL.
 * Examples:
 *   .../rdvpref/reservation/demarche/16040/  → "16040"
 *   .../rdvpref/reservation/demarche/1922/   → "1922"
 */
function extractDemarcheCode(url: string): string | null {
  const match = url.match(/\/demarche\/(\d+)\/?/);
  return match ? match[1] : null;
}

/**
 * Scrape an RDV-Prefecture site using direct API calls.
 * No browser. No CAPTCHA. Pure HTTP.
 */
async function scrapeRdvPrefectureApi(
  config: PrefectureConfig,
  categoryCode?: string,
  categoryName?: string,
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const demarcheCode = categoryCode || extractDemarcheCode(config.bookingUrl);

  if (!demarcheCode) {
    logger.error(`Cannot extract demarche code from ${config.bookingUrl}`);
    return {
      status: 'error',
      slotsAvailable: 0,
      bookingUrl: config.bookingUrl,
      errorMessage: 'Cannot extract demarche code from URL',
      responseTimeMs: Date.now() - startTime,
      categoryCode,
      categoryName,
    };
  }

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    'Referer': `${RDV_PREF_BASE}/rdvpref/reservation/demarche/${demarcheCode}/`,
    'Origin': RDV_PREF_BASE,
  };

  try {
    // ── Step 1: Get session cookie ──────────────────────────────
    logger.info(`RDV-API: Getting session for demarche ${demarcheCode} (${config.id})`);
    const sessionResp = await fetch(
      `${RDV_PREF_BASE}/rdvpref/reservation/demarche/${demarcheCode}/`,
      {
        method: 'GET',
        headers: {
          ...headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      },
    );

    if (!sessionResp.ok) {
      logger.warn(`RDV-API: Session request failed with HTTP ${sessionResp.status} for ${config.id}`);
      return {
        status: sessionResp.status === 403 ? 'blocked' : 'error',
        slotsAvailable: 0,
        bookingUrl: config.bookingUrl,
        errorMessage: `Session request failed: HTTP ${sessionResp.status}`,
        responseTimeMs: Date.now() - startTime,
        categoryCode,
        categoryName,
      };
    }

    // Extract cookies from Set-Cookie headers
    const setCookieHeaders = sessionResp.headers.getSetCookie?.() || [];
    const cookies = setCookieHeaders
      .map((c: string) => c.split(';')[0])
      .join('; ');

    if (!cookies) {
      logger.warn(`RDV-API: No session cookies received for ${config.id}`);
    }

    // Add human-like delay between requests
    await randomDelay(500, 1500);

    // ── Step 2: Check next available slot (quick check) ─────────
    logger.info(`RDV-API: Checking nextSlot for demarche ${demarcheCode}`);
    const nextSlotResp = await fetch(`${RDV_PREF_BASE}/api/nextSlot`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify({ demarcheId: parseInt(demarcheCode, 10) }),
    });

    if (nextSlotResp.ok) {
      const nextSlotData = await nextSlotResp.json().catch(() => null) as Record<string, unknown> | null;
      // If the API says no next slot exists, we can short-circuit
      if (nextSlotData && (nextSlotData as Record<string, unknown>).noSlot === true) {
        logger.info(`RDV-API: No slots confirmed via nextSlot API for ${config.id} demarche ${demarcheCode}`);
        return {
          status: 'no_slots',
          slotsAvailable: 0,
          bookingUrl: config.bookingUrl,
          responseTimeMs: Date.now() - startTime,
          categoryCode,
          categoryName,
        };
      }
    }

    await randomDelay(300, 800);

    // ── Step 3: Get available locations (lieux) ─────────────────
    logger.info(`RDV-API: Fetching lieux for demarche ${demarcheCode}`);
    const lieuxResp = await fetch(`${RDV_PREF_BASE}/api/lieu/${demarcheCode}`, {
      method: 'GET',
      headers: { ...headers, 'Cookie': cookies },
    });

    if (!lieuxResp.ok) {
      // Check if we got blocked silently
      const status = lieuxResp.status;
      logger.warn(`RDV-API: Lieux request failed HTTP ${status} for ${config.id}`);

      if (status === 403 || status === 429) {
        return {
          status: 'blocked',
          slotsAvailable: 0,
          bookingUrl: config.bookingUrl,
          errorMessage: `Lieux API blocked: HTTP ${status}`,
          responseTimeMs: Date.now() - startTime,
          categoryCode,
          categoryName,
        };
      }

      return {
        status: 'error',
        slotsAvailable: 0,
        bookingUrl: config.bookingUrl,
        errorMessage: `Lieux API failed: HTTP ${status}`,
        responseTimeMs: Date.now() - startTime,
        categoryCode,
        categoryName,
      };
    }

    let lieux: RdvLieu[] = [];
    try {
      const lieuxData = await lieuxResp.json();
      // Response can be an array directly or { data: [...] }
      lieux = Array.isArray(lieuxData) ? lieuxData : (lieuxData?.data || lieuxData?.lieux || []);
    } catch {
      logger.warn(`RDV-API: Failed to parse lieux JSON for ${config.id}`);
    }

    if (lieux.length === 0) {
      logger.info(`RDV-API: No lieux available for ${config.id} demarche ${demarcheCode}`);
      return {
        status: 'no_slots',
        slotsAvailable: 0,
        bookingUrl: config.bookingUrl,
        responseTimeMs: Date.now() - startTime,
        categoryCode,
        categoryName,
      };
    }

    logger.info(`RDV-API: Found ${lieux.length} lieu(x) for demarche ${demarcheCode}`);

    // ── Step 4: Check créneaux for each lieu ────────────────────
    let totalSlots = 0;
    let firstSlotDate: string | undefined;
    let firstSlotTime: string | undefined;

    for (const lieu of lieux) {
      await randomDelay(300, 600);

      const creneauResp = await fetch(
        `${RDV_PREF_BASE}/api/creneau/${lieu.id}/${demarcheCode}`,
        {
          method: 'GET',
          headers: { ...headers, 'Cookie': cookies },
        },
      );

      if (!creneauResp.ok) {
        logger.warn(`RDV-API: Creneau request failed for lieu ${lieu.id}: HTTP ${creneauResp.status}`);
        continue;
      }

      let creneaux: RdvCreneau[] = [];
      try {
        const creneauData = await creneauResp.json();
        creneaux = Array.isArray(creneauData) ? creneauData : (creneauData?.data || creneauData?.creneaux || []);
      } catch {
        logger.warn(`RDV-API: Failed to parse creneau JSON for lieu ${lieu.id}`);
        continue;
      }

      if (creneaux.length > 0) {
        totalSlots += creneaux.length;
        if (!firstSlotDate && creneaux[0]) {
          firstSlotDate = creneaux[0].date;
          firstSlotTime = creneaux[0].heure;
        }
        logger.info(
          `RDV-API: SLOTS FOUND at ${lieu.nom || lieu.id}: ${creneaux.length} créneau(x) ` +
          `for ${config.id} demarche ${demarcheCode}`,
        );
      }
    }

    if (totalSlots > 0) {
      return {
        status: 'slots_found',
        slotsAvailable: totalSlots,
        slotDate: firstSlotDate,
        slotTime: firstSlotTime,
        bookingUrl: `${RDV_PREF_BASE}/rdvpref/reservation/demarche/${demarcheCode}/`,
        responseTimeMs: Date.now() - startTime,
        categoryCode,
        categoryName,
      };
    }

    return {
      status: 'no_slots',
      slotsAvailable: 0,
      bookingUrl: config.bookingUrl,
      responseTimeMs: Date.now() - startTime,
      categoryCode,
      categoryName,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`RDV-API: Error for ${config.id} demarche ${demarcheCode}: ${errorMessage}`);
    return {
      status: errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') ? 'timeout' : 'error',
      slotsAvailable: 0,
      bookingUrl: config.bookingUrl,
      errorMessage: `RDV-API error: ${errorMessage}`,
      responseTimeMs: Date.now() - startTime,
      categoryCode,
      categoryName,
    };
  }
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

const MAX_PROXY_RETRIES = 3;

export async function scrapePrefecture(config: PrefectureConfig): Promise<ScrapeResult> {
  // ── FAST PATH: RDV-Prefecture sites use direct API (no browser) ──
  if (config.bookingSystem === 'rdv-prefecture') {
    logger.info(`Using direct API for ${config.id} (RDV-Prefecture)`);
    return scrapeRdvPrefectureApi(config);
  }

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

  const usedProxies = new Set<string>();

  for (let attempt = 0; attempt < MAX_PROXY_RETRIES; attempt++) {
    try {
      session = await pool.getPage(targetDomain, usedProxies.size > 0 ? usedProxies : undefined);
      const { page, proxy } = session;

      if (attempt > 0) {
        logger.info(`Retry attempt ${attempt + 1}/${MAX_PROXY_RETRIES} for ${config.id} with different proxy`);
      }

      // Navigate to booking page
      logger.debug(`Scraping ${config.name} (${config.id}): ${config.bookingUrl}`);

      // Track redirects during navigation
      const redirectChain: string[] = [config.bookingUrl];

      const response = await page.goto(config.bookingUrl, {
        waitUntil: 'load',
        timeout: 45000,
      });

      // Capture final URL after all redirects
      const finalUrl = page.url();
      const urlChanged = finalUrl !== config.bookingUrl &&
        !finalUrl.includes('error') &&
        !finalUrl.includes('404');

      if (finalUrl !== config.bookingUrl) {
        redirectChain.push(finalUrl);
      }

      // Handle URL change detection (async, uses its own page from pool)
      if (urlChanged) {
        handleUrlChange({
          prefectureId: config.id,
          originalUrl: config.bookingUrl,
          finalUrl,
          redirectChain,
          browserPoolGetter: getBrowserPool,
          config,
        }).catch(err => logger.error('URL change handling error:', err));
      }

      // Check for HTTP errors - retry with different proxy on 403
      if (response && response.status() >= 400) {
        logger.warn(`HTTP ${response.status()} for ${config.id}`);
        if (proxy) {
          proxyService.reportFailure(proxy, targetDomain);
          usedProxies.add(proxy.server);
        }

        // Retry with different proxy on 403/blocked
        if (response.status() === 403 && attempt < MAX_PROXY_RETRIES - 1) {
          logger.info(`HTTP 403 for ${config.id}, retrying with different proxy (attempt ${attempt + 1}/${MAX_PROXY_RETRIES})`);
          await pool.releasePage(session.page, session.context);
          session = null;
          await randomDelay(2000, 5000);
          continue;
        }

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

      // Check for bot detection indicators
      let botDetected = false;
      for (const indicator of BOT_DETECTION_INDICATORS) {
        if (lowerContent.includes(indicator)) {
          logger.warn(`Bot detection indicator found for ${config.id}: ${indicator}`);
          if (proxy) {
            proxyService.reportFailure(proxy, targetDomain);
            usedProxies.add(proxy.server);
          }

          // Retry with different proxy on bot detection
          if (attempt < MAX_PROXY_RETRIES - 1) {
            logger.info(`Bot detected for ${config.id}, retrying with different proxy (attempt ${attempt + 1}/${MAX_PROXY_RETRIES})`);
            await pool.releasePage(session.page, session.context);
            session = null;
            await randomDelay(2000, 5000);
            botDetected = true;
            break;
          }

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

      // If bot was detected and we're retrying, continue to next attempt
      if (botDetected) continue;

      // ── Human-like page reading (Botasaurus-inspired) ──────────
      // Simulate a human reading the page before interacting
      await humanReadPage(page);

      // NOTE: RDV-Prefecture sites are handled by the fast-path at the top
      // of scrapePrefecture() using direct API calls (no browser needed).

      // Enhanced CAPTCHA detection (for non-rdv-prefecture sites)
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
        let captchaSolved = false;

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

              // Wait for page to potentially navigate after CAPTCHA solve
              try {
                await page.waitForLoadState('networkidle', { timeout: 10000 });
              } catch {
                // Timeout is acceptable - page may not navigate
              }

              // Check if CAPTCHA is still present
              const newContent = await page.content();
              const newCaptchaResult = await captchaService.detectCaptcha(newContent, page.url());

              if (!newCaptchaResult.detected) {
                logger.info(`CAPTCHA solved successfully for ${config.id}`);
                if (proxy) proxyService.reportSuccess(proxy, targetDomain);
                captchaSolved = true;
                // Fall through to continue normal scraping flow below
              }
            } catch (solveError) {
              logger.error(`CAPTCHA injection failed for ${config.id}:`, solveError);
            }
          }
        }

        // If CAPTCHA was not solved, return captcha status
        if (!captchaSolved) {
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
      }

      // Handle cookie consent if present (with human-like click)
      if (config.selectors.cookieAccept) {
        try {
          const cookieBtn = page.locator(config.selectors.cookieAccept);
          if (await cookieBtn.isVisible({ timeout: 3000 })) {
            await humanClick(page, config.selectors.cookieAccept);
            await randomDelay(500, 1000);
          }
        } catch {
          // Cookie button not found or already accepted
        }
      }

      // Select procedure if dropdown exists
      if (config.selectors.procedureDropdown) {
        try {
          await humanScroll(page);
          await page.selectOption(config.selectors.procedureDropdown, config.procedures[0].toString());
          await randomDelay(1500, 2500);
        } catch {
          logger.debug(`No procedure dropdown found for ${config.id}`);
        }
      }

      // Click next button if exists (human-like)
      let nextBtnClicked = false;
      if (config.selectors.nextButton) {
        try {
          const nextBtn = page.locator(config.selectors.nextButton);
          if (await nextBtn.isVisible({ timeout: 2000 })) {
            await humanClick(page, config.selectors.nextButton);
            await page.waitForLoadState('networkidle');
            await randomDelay(1000, 2000);
            nextBtnClicked = true;
          }
        } catch {
          // Next button not found via config selector
        }
      }

      // Fallback heuristic for Next button (human-like clicks)
      if (!nextBtnClicked) {
        try {
          const fallbackSelectors = [
            'button:has-text("Suivant")',
            'button:has-text("Valider")',
            'button:has-text("Continuer")',
            'input[type="submit"][value*="Suivant" i]',
            'input[type="submit"][value*="Valider" i]',
            'input[type="submit"][value*="Continuer" i]',
            'a:has-text("Étape suivante")',
          ];

          for (const selector of fallbackSelectors) {
            const locator = page.locator(selector).first();
            if (await locator.isVisible({ timeout: 500 })) {
              await humanClick(page, selector);
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
          finalUrl,
          redirectCount: redirectChain.length - 1,
          urlChanged,
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
          finalUrl,
          redirectCount: redirectChain.length - 1,
          urlChanged,
        };
      }

      // ── Navigation verification ─────────────────────────────
      // Before declaring "no_slots", verify the page actually loaded
      // meaningful content. A blank/error page should be an error, not "no_slots".
      if (!noSlotsConfirmed) {
        try {
          const currentUrl = page.url();
          const bodyText = await page.textContent('body');
          const bodyLength = bodyText?.length ?? 0;

          const isLikelyNavigationFailure =
            bodyLength < 200 ||
            currentUrl.includes('/error') ||
            currentUrl.includes('/404');

          if (isLikelyNavigationFailure) {
            const screenshotPath = generateScreenshotPath(config.id, 'nav_failure');
            const screenshot = await page.screenshot({ fullPage: true });
            await saveScreenshot(screenshot, screenshotPath);

            logger.warn(`Navigation likely failed for ${config.id}: bodyLength=${bodyLength}, url=${currentUrl}`);
            if (proxy) proxyService.reportFailure(proxy, targetDomain);

            return {
              status: 'error',
              slotsAvailable: 0,
              bookingUrl: page.url(),
              screenshotPath,
              errorMessage: `Navigation verification failed: page appears incomplete (${bodyLength} chars)`,
              responseTimeMs: Date.now() - startTime,
              finalUrl,
              redirectCount: redirectChain.length - 1,
              urlChanged,
            };
          }
        } catch {
          // Verification check itself failed — treat as error
          logger.warn(`Navigation verification threw for ${config.id}`);
        }
      }

      // No slots found - successful scrape
      if (proxy) proxyService.reportSuccess(proxy, targetDomain);

      return {
        status: 'no_slots',
        slotsAvailable: 0,
        bookingUrl: page.url(),
        responseTimeMs: Date.now() - startTime,
        finalUrl,
        redirectCount: redirectChain.length - 1,
        urlChanged,
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
  } // end retry loop

  // All retries exhausted (should not reach here, but safety fallback)
  return {
    status: 'blocked',
    slotsAvailable: 0,
    bookingUrl: config.bookingUrl,
    errorMessage: `All ${MAX_PROXY_RETRIES} proxy attempts failed`,
    responseTimeMs: Date.now() - startTime,
  };
}

/**
 * RDV-Prefecture image CAPTCHA solving flow.
 *
 * Steps:
 * 1. Find the CAPTCHA image (base64 PNG) on the page
 * 2. Extract it and send to 2Captcha solveImageCaptcha()
 * 3. Fill captchaUsercode input with the answer
 * 4. Click the submit/next button
 * 5. Wait for the availability page to load
 *
 * Returns a ScrapeResult if we should stop (error/captcha unsolved),
 * or null if CAPTCHA was solved and the caller should continue to slot detection.
 */
async function solveRdvPrefectureCaptcha(
  page: import('playwright').Page,
  config: PrefectureConfig,
  startTime: number,
  proxy: import('./proxy.service.js').ProxyConfig | null,
  targetDomain: string | undefined,
): Promise<ScrapeResult | null> {
  const captchaInput = await page.$('input[name="captchaUsercode"]');
  if (!captchaInput) {
    // No CAPTCHA on this page - continue to slot detection
    logger.debug(`No RDV-Prefecture CAPTCHA found for ${config.id}, continuing`);
    return null;
  }

  logger.info(`RDV-Prefecture CAPTCHA detected for ${config.id}, attempting to solve`);

  // Extract the CAPTCHA image (base64 PNG embedded in <img>)
  // Note: page.evaluate runs in the browser context; we use string-based eval
  // to avoid TypeScript DOM type issues (tsconfig does not include "dom" lib).
  const captchaImageB64 = await page.evaluate(`(() => {
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].src;
      if (src && src.indexOf('data:image/') === 0) {
        var b64 = src.split(',')[1];
        if (b64 && b64.length > 100) return b64;
      }
    }
    return null;
  })()`) as string | null;

  if (!captchaImageB64) {
    logger.warn(`RDV-Prefecture CAPTCHA image not found for ${config.id}`);
    const screenshotPath = generateScreenshotPath(config.id, 'captcha');
    const screenshot = await page.screenshot({ fullPage: true });
    await saveScreenshot(screenshot, screenshotPath);

    return {
      status: 'captcha',
      slotsAvailable: 0,
      bookingUrl: page.url(),
      screenshotPath,
      errorMessage: 'RDV-Prefecture CAPTCHA image not found on page',
      responseTimeMs: Date.now() - startTime,
    };
  }

  // Send to 2Captcha for solving
  const captchaResult = await solveImageCaptcha(captchaImageB64);
  if (!captchaResult.success || !captchaResult.answer) {
    logger.warn(`Failed to solve RDV-Prefecture CAPTCHA for ${config.id}: ${captchaResult.error}`);
    if (proxy) proxyService.reportFailure(proxy, targetDomain);

    const screenshotPath = generateScreenshotPath(config.id, 'captcha');
    const screenshot = await page.screenshot({ fullPage: true });
    await saveScreenshot(screenshot, screenshotPath);

    return {
      status: 'captcha',
      slotsAvailable: 0,
      bookingUrl: page.url(),
      screenshotPath,
      errorMessage: `RDV-Prefecture CAPTCHA solve failed: ${captchaResult.error}`,
      responseTimeMs: Date.now() - startTime,
    };
  }

  logger.info(`RDV-Prefecture CAPTCHA solved for ${config.id}: "${captchaResult.answer}"`);

  // Fill in the CAPTCHA answer
  await captchaInput.fill(captchaResult.answer);
  await randomDelay(300, 600);

  // Click the submit/next button
  const submitClicked = await clickRdvSubmitButton(page, config);
  if (!submitClicked) {
    logger.warn(`Could not find submit button for ${config.id} after CAPTCHA solve`);
  }

  // Wait for navigation after form submit
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    // Timeout is acceptable
  }
  await randomDelay(1000, 2000);

  // Check if we're still on the CAPTCHA page (wrong answer)
  const stillHasCaptcha = await page.$('input[name="captchaUsercode"]');
  if (stillHasCaptcha) {
    logger.warn(`RDV-Prefecture CAPTCHA answer was wrong for ${config.id}, retrying...`);

    // Retry once with a fresh CAPTCHA
    const retryB64 = await page.evaluate(`(() => {
      var imgs = document.querySelectorAll('img');
      for (var i = 0; i < imgs.length; i++) {
        var src = imgs[i].src;
        if (src && src.indexOf('data:image/') === 0) {
          var b64 = src.split(',')[1];
          if (b64 && b64.length > 100) return b64;
        }
      }
      return null;
    })()`) as string | null;

    if (retryB64) {
      const retryResult = await solveImageCaptcha(retryB64);
      if (retryResult.success && retryResult.answer) {
        const retryInput = await page.$('input[name="captchaUsercode"]');
        if (retryInput) {
          await retryInput.fill('');
          await retryInput.fill(retryResult.answer);
          await randomDelay(300, 600);
          await clickRdvSubmitButton(page, config);
          try {
            await page.waitForLoadState('networkidle', { timeout: 15000 });
          } catch { /* timeout ok */ }
          await randomDelay(1000, 2000);
        }
      }
    }

    // Check again
    const stillHasCaptcha2 = await page.$('input[name="captchaUsercode"]');
    if (stillHasCaptcha2) {
      if (proxy) proxyService.reportFailure(proxy, targetDomain);
      const screenshotPath = generateScreenshotPath(config.id, 'captcha');
      const screenshot = await page.screenshot({ fullPage: true });
      await saveScreenshot(screenshot, screenshotPath);
      return {
        status: 'captcha',
        slotsAvailable: 0,
        bookingUrl: page.url(),
        screenshotPath,
        errorMessage: 'RDV-Prefecture CAPTCHA solved but answer was wrong (2 attempts)',
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  // CAPTCHA solved successfully - report proxy success
  logger.info(`RDV-Prefecture CAPTCHA bypassed for ${config.id}, checking slots`);
  if (proxy) proxyService.reportSuccess(proxy, targetDomain);

  // Return null to signal caller to continue with slot detection
  return null;
}

/**
 * Click the submit button on an RDV-Prefecture page.
 * Tries config.selectors.nextButton first, then common fallbacks.
 */
async function clickRdvSubmitButton(
  page: import('playwright').Page,
  config: PrefectureConfig,
): Promise<boolean> {
  // Try config-defined next button first
  if (config.selectors.nextButton) {
    try {
      const btn = page.locator(config.selectors.nextButton);
      if (await btn.isVisible({ timeout: 2000 })) {
        await humanClick(page, config.selectors.nextButton);
        return true;
      }
    } catch { /* not found */ }
  }

  // RDV-Prefecture specific submit buttons
  const rdvSelectors = [
    'button.q-btn.bg-primary',
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Valider")',
    'button:has-text("Vérifier")',
    'button:has-text("Continuer")',
    'button:has-text("Suivant")',
  ];

  for (const selector of rdvSelectors) {
    try {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await humanClick(page, selector);
        return true;
      }
    } catch { /* not found */ }
  }

  return false;
}

export async function testPrefectureScraper(config: PrefectureConfig): Promise<ScrapeResult> {
  logger.info(`Testing scraper for ${config.name} (${config.id})...`);
  const result = await scrapePrefecture(config);
  logger.info(`Test result: ${JSON.stringify(result, null, 2)}`);
  return result;
}

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
  // ── FAST PATH: RDV-Prefecture categories use direct API (no browser) ──
  if (config.bookingSystem === 'rdv-prefecture') {
    const demarcheCode = extractDemarcheCode(category.url);
    logger.info(`Using direct API for ${config.id}:${category.name} demarche ${demarcheCode}`);
    return scrapeRdvPrefectureApi(config, demarcheCode || category.code, category.name);
  }

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
      waitUntil: 'load',
      timeout: 45000,
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

    // ── Human-like page reading (Botasaurus-inspired) ──────────
    await humanReadPage(page);

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

            // Wait for page to potentially navigate after CAPTCHA solve
            try {
              await page.waitForLoadState('networkidle', { timeout: 10000 });
            } catch {
              // Timeout is acceptable - page may not navigate
            }

            // Check if CAPTCHA is still present
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

      // If CAPTCHA was not solved, return captcha status
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

    // Handle cookie consent if present (human-like click)
    if (config.selectors.cookieAccept) {
      try {
        const cookieBtn = page.locator(config.selectors.cookieAccept);
        if (await cookieBtn.isVisible({ timeout: 3000 })) {
          await humanClick(page, config.selectors.cookieAccept);
          await randomDelay(500, 1000);
        }
      } catch {
        // Cookie button not found or already accepted
      }
    }

    // Select procedure if dropdown exists
    if (config.selectors.procedureDropdown) {
      try {
        await humanScroll(page);
        await page.selectOption(config.selectors.procedureDropdown, config.procedures[0].toString());
        await randomDelay(1500, 2500);
      } catch {
        logger.debug(`No procedure dropdown found for ${config.id}:${category.code}`);
      }
    }

    // Click next button if exists (human-like)
    let nextBtnClicked = false;
    if (config.selectors.nextButton) {
      try {
        const nextBtn = page.locator(config.selectors.nextButton);
        if (await nextBtn.isVisible({ timeout: 2000 })) {
          await humanClick(page, config.selectors.nextButton);
          await page.waitForLoadState('networkidle');
          await randomDelay(1000, 2000);
          nextBtnClicked = true;
        }
      } catch {
        // Next button not found via config selector
      }
    }

    // Fallback heuristic for Next button (human-like clicks)
    if (!nextBtnClicked) {
      try {
        const fallbackSelectors = [
          'button:has-text("Suivant")',
          'button:has-text("Valider")',
          'button:has-text("Continuer")',
          'input[type="submit"][value*="Suivant" i]',
          'input[type="submit"][value*="Valider" i]',
          'input[type="submit"][value*="Continuer" i]',
          'a:has-text("Étape suivante")',
        ];

        for (const selector of fallbackSelectors) {
          const locator = page.locator(selector).first();
          if (await locator.isVisible({ timeout: 500 })) {
            await humanClick(page, selector);
            await page.waitForLoadState('networkidle');
            await randomDelay(1000, 2000);
            logger.debug(`Found next button using fallback heuristic for ${config.id}:${category.code}`);
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
            logger.debug(`Confirmed no slots using fallback heuristic for ${config.id}:${category.code}`);
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

    // ── Navigation verification ─────────────────────────────
    // Before declaring "no_slots", verify the page actually loaded
    // meaningful content for the category scrape.
    if (!noSlotsConfirmed) {
      try {
        const currentUrl = page.url();
        const bodyText = await page.textContent('body');
        const bodyLength = bodyText?.length ?? 0;

        const isLikelyNavigationFailure =
          bodyLength < 200 ||
          currentUrl.includes('/error') ||
          currentUrl.includes('/404');

        if (isLikelyNavigationFailure) {
          const screenshotPath = generateScreenshotPath(`${config.id}_${category.code}`, 'nav_failure');
          const screenshot = await page.screenshot({ fullPage: true });
          await saveScreenshot(screenshot, screenshotPath);

          logger.warn(`Navigation likely failed for ${config.id}:${category.code}: bodyLength=${bodyLength}, url=${currentUrl}`);
          if (proxy) proxyService.reportFailure(proxy, targetDomain);

          return {
            status: 'error',
            slotsAvailable: 0,
            bookingUrl: page.url(),
            screenshotPath,
            errorMessage: `Navigation verification failed: page appears incomplete (${bodyLength} chars)`,
            responseTimeMs: Date.now() - startTime,
            categoryCode: category.code,
            categoryName: category.name,
          };
        }
      } catch {
        logger.warn(`Navigation verification threw for ${config.id}:${category.code}`);
      }
    }

    // No slots found - successful scrape
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

    // Report proxy failure on error
    if (session?.proxy) {
      proxyService.reportFailure(session.proxy, targetDomain);
    }

    // Take error screenshot
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
