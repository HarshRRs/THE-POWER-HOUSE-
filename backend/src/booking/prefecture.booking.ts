import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { Client } from '@prisma/client';
import * as bookingService from '../services/booking.service.js';
import * as captchaService from '../services/captcha.service.js';
import logger from '../utils/logger.util.js';
import path from 'path';
import fs from 'fs';

/**
 * Prefecture Auto-Booking Worker
 * 
 * Flow:
 * 1. Slot detected by scraper
 * 2. Find matching clients
 * 3. Open prefecture booking page
 * 4. Fill client details
 * 5. Select date/time
 * 6. Solve CAPTCHA via 2Captcha
 * 7. Submit and capture confirmation
 */

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './screenshots/bookings';
const PAGE_TIMEOUT = 30000;

// Browser management
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--single-process',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-blink-features=AutomationControlled',
      '--js-flags=--max-old-space-size=128',
    ],
  });

  return browserInstance;
}

async function createPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });

  const page = await context.newPage();

  // Block heavy resources
  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'font', 'media'].includes(type)) {
      return route.abort();
    }
    return route.continue();
  });

  // Stealth
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en'] });
  });

  return { context, page };
}

/**
 * Main booking function for prefectures
 */
export async function bookPrefectureAppointment(
  client: Client,
  slotDate: string,
  slotTime?: string,
): Promise<{
  success: boolean;
  bookingRef?: string;
  bookingDate?: Date;
  bookingTime?: string;
  screenshotPath?: string;
  error?: string;
}> {
  const browser = await getBrowser();
  const { context, page } = await createPage(browser);

  // Ensure screenshot dir
  const clientDir = path.join(SCREENSHOT_DIR, 'prefecture', client.id);
  fs.mkdirSync(clientDir, { recursive: true });

  try {
    await bookingService.updateBookingStatus(client.id, 'BOOKING', 'Opening prefecture website');
    await bookingService.logBookingAction(client.id, 'BOOKING_STARTED', `Slot: ${slotDate} ${slotTime || ''}`);

    // Step 1: Navigate to booking URL
    const bookingUrl = (client as any).prefecture?.bookingUrl;
    if (!bookingUrl) {
      throw new Error('No booking URL for prefecture');
    }

    logger.info(`[Booking] Opening ${bookingUrl} for ${client.firstName} ${client.lastName}`);
    await page.goto(bookingUrl, { waitUntil: 'networkidle', timeout: PAGE_TIMEOUT });
    
    await page.screenshot({ path: path.join(clientDir, '01_landing.png') });
    await bookingService.logBookingAction(client.id, 'PAGE_LOADED', bookingUrl, path.join(clientDir, '01_landing.png'));

    // Step 2: Select procedure if there's a dropdown
    const procedureSelect = await page.$('select[name*="procedure"], select[name*="motif"], select[id*="planning_motif"]');
    if (procedureSelect) {
      // Try to find and select matching procedure option
      const options = await procedureSelect.$$('option');
      for (const option of options) {
        const text = await option.textContent();
        if (text && matchesProcedure(text, client.procedureType)) {
          const value = await option.getAttribute('value');
          if (value) {
            await procedureSelect.selectOption(value);
            await page.waitForTimeout(1000);
            break;
          }
        }
      }
      
      await page.screenshot({ path: path.join(clientDir, '02_procedure_selected.png') });
      await bookingService.logBookingAction(client.id, 'PROCEDURE_SELECTED', client.procedureType);
    }

    // Step 3: Fill personal information
    await fillField(page, ['nom', 'lastname', 'family_name', 'name'], client.lastName);
    await fillField(page, ['prenom', 'firstname', 'given_name'], client.firstName);
    
    if (client.email) {
      await fillField(page, ['email', 'mail', 'courriel'], client.email);
    }
    
    await fillField(page, ['telephone', 'phone', 'tel'], client.phone);

    if (client.dateOfBirth) {
      const dob = client.dateOfBirth;
      const dobStr = `${dob.getDate().toString().padStart(2, '0')}/${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getFullYear()}`;
      await fillField(page, ['naissance', 'birth', 'date_naissance', 'dob'], dobStr);
    }

    if (client.foreignerNumber) {
      await fillField(page, ['etranger', 'agdref', 'numero_etranger', 'foreign'], client.foreignerNumber);
    }

    if (client.nationality) {
      await fillField(page, ['nationalite', 'nationality'], client.nationality);
    }

    await page.screenshot({ path: path.join(clientDir, '03_form_filled.png') });
    await bookingService.logBookingAction(client.id, 'FORM_FILLED', 'Personal details entered', path.join(clientDir, '03_form_filled.png'));

    // Step 4: Select available date
    // Look for calendar or date selector
    const dateInput = await page.$('input[type="date"], input[name*="date"], .date-picker input');
    if (dateInput) {
      await dateInput.fill(slotDate);
      await page.waitForTimeout(500);
    } else {
      // Try clicking on calendar date
      const dateCell = await page.$(`td[data-date="${slotDate}"], a[data-date="${slotDate}"], .available-date[data-date="${slotDate}"]`);
      if (dateCell) {
        await dateCell.click();
        await page.waitForTimeout(500);
      }
    }

    // Select time if available
    if (slotTime) {
      const timeInput = await page.$('select[name*="time"], select[name*="heure"], select[name*="creneau"]');
      if (timeInput) {
        const options = await timeInput.$$('option');
        for (const option of options) {
          const text = await option.textContent();
          if (text && text.includes(slotTime)) {
            const value = await option.getAttribute('value');
            if (value) {
              await timeInput.selectOption(value);
              break;
            }
          }
        }
      }
    }

    await page.screenshot({ path: path.join(clientDir, '04_date_selected.png') });
    await bookingService.logBookingAction(client.id, 'DATE_SELECTED', `${slotDate} ${slotTime || ''}`);

    // Step 5: Handle CAPTCHA
    const captchaResult = await handleCaptcha(page, client.id, clientDir);
    if (!captchaResult.success) {
      throw new Error(`CAPTCHA failed: ${captchaResult.error}`);
    }

    await page.screenshot({ path: path.join(clientDir, '05_captcha_solved.png') });
    await bookingService.logBookingAction(client.id, 'CAPTCHA_SOLVED', `Time: ${captchaResult.solveTimeMs}ms`);

    // Step 6: Accept conditions & Submit
    const conditionsCheckbox = await page.$('input[type="checkbox"][name*="condition"], input[type="checkbox"][name*="accept"], input[type="checkbox"][id*="consent"]');
    if (conditionsCheckbox) {
      await conditionsCheckbox.check();
    }

    const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Confirmer"), button:has-text("Valider"), button:has-text("Réserver")');
    if (submitButton) {
      await submitButton.click();
    }

    // Wait for confirmation page
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(clientDir, '06_confirmation.png'), fullPage: true });

    // Step 7: Extract confirmation details
    const pageContent = await page.content();
    const bookingRef = extractBookingRef(pageContent);
    
    await bookingService.logBookingAction(
      client.id, 
      'SUBMITTED', 
      `Ref: ${bookingRef || 'extracting...'}`,
      path.join(clientDir, '06_confirmation.png')
    );

    // Mark as booked
    await bookingService.markAsBooked(client.id, {
      bookingDate: new Date(slotDate),
      bookingTime: slotTime,
      bookingRef: bookingRef || undefined,
      bookingUrl: page.url(),
      bookingScreenshot: path.join(clientDir, '06_confirmation.png'),
    });

    return {
      success: true,
      bookingRef: bookingRef || undefined,
      bookingDate: new Date(slotDate),
      bookingTime: slotTime,
      screenshotPath: path.join(clientDir, '06_confirmation.png'),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[Booking] Failed for ${client.firstName} ${client.lastName}: ${errorMsg}`);

    // Screenshot on failure
    try {
      await page.screenshot({ path: path.join(clientDir, 'error.png'), fullPage: true });
      await bookingService.logBookingAction(client.id, 'ERROR', errorMsg, path.join(clientDir, 'error.png'));
    } catch { /* ignore screenshot errors */ }

    await bookingService.markBookingFailed(client.id, errorMsg);

    return { success: false, error: errorMsg };
  } finally {
    await context.close();
  }
}

// ─── CAPTCHA Handling ────────────────────────────────────

async function handleCaptcha(page: Page, clientId: string, _screenshotDir: string): Promise<{
  success: boolean;
  solveTimeMs?: number;
  error?: string;
}> {
  // Check for reCAPTCHA v2
  const recaptchaFrame = await page.$('iframe[src*="recaptcha"], iframe[title*="reCAPTCHA"]');
  if (recaptchaFrame) {
    await bookingService.updateBookingStatus(clientId, 'CAPTCHA_WAIT', 'Solving reCAPTCHA v2');
    
    const siteKey = await page.$eval(
      '.g-recaptcha, [data-sitekey]',
      (el) => el.getAttribute('data-sitekey')
    ).catch(() => null);

    if (siteKey) {
      const result = await captchaService.solveRecaptchaV2(siteKey, page.url());
      if (result.success) {
        // Inject the token into the page (runs in browser context)
        await page.evaluate(`(function(token) {
          var textarea = document.querySelector('#g-recaptcha-response, textarea[name="g-recaptcha-response"]');
          if (textarea) {
            textarea.value = token;
            textarea.style.display = 'block';
          }
          var cfg = window.___grecaptcha_cfg;
          if (cfg && cfg.clients && cfg.clients[0] && cfg.clients[0].aa && cfg.clients[0].aa.l && cfg.clients[0].aa.l.callback) {
            cfg.clients[0].aa.l.callback(token);
          }
        })("${result.answer.replace(/"/g, '\\"')}")`);
        
        return { success: true, solveTimeMs: result.solveTimeMs };
      }
      return { success: false, error: result.error };
    }
  }

  // Check for hCaptcha
  const hcaptchaFrame = await page.$('iframe[src*="hcaptcha"]');
  if (hcaptchaFrame) {
    await bookingService.updateBookingStatus(clientId, 'CAPTCHA_WAIT', 'Solving hCaptcha');
    
    const siteKey = await page.$eval(
      '.h-captcha, [data-sitekey]',
      (el) => el.getAttribute('data-sitekey')
    ).catch(() => null);

    if (siteKey) {
      const result = await captchaService.solveHCaptcha(siteKey, page.url());
      if (result.success) {
        await page.evaluate(`(function(token) {
          var input = document.querySelector('[name="h-captcha-response"], textarea[name="h-captcha-response"]');
          if (input) input.value = token;
        })("${result.answer.replace(/"/g, '\\"')}")`);
        
        return { success: true, solveTimeMs: result.solveTimeMs };
      }
      return { success: false, error: result.error };
    }
  }

  // Check for image CAPTCHA
  const captchaImg = await page.$('img[src*="captcha"], img[id*="captcha"], img[alt*="captcha"], .captcha img');
  if (captchaImg) {
    await bookingService.updateBookingStatus(clientId, 'CAPTCHA_WAIT', 'Solving image CAPTCHA');
    
    // Screenshot just the captcha
    const captchaScreenshot = await captchaImg.screenshot();
    const base64 = captchaScreenshot.toString('base64');
    
    const result = await captchaService.solveImageCaptcha(base64);
    if (result.success) {
      // Find the captcha input field and type the answer
      const captchaInput = await page.$('input[name*="captcha"], input[id*="captcha"], input[placeholder*="captcha"]');
      if (captchaInput) {
        await captchaInput.fill(result.answer);
        return { success: true, solveTimeMs: result.solveTimeMs };
      }
    }
    return { success: false, error: result.error };
  }

  // No CAPTCHA found - that's fine
  logger.debug(`[Booking] No CAPTCHA detected for client ${clientId}`);
  return { success: true };
}

// ─── Helper Functions ────────────────────────────────────

/**
 * Try to fill a form field by common name patterns
 */
async function fillField(page: Page, namePatterns: string[], value: string): Promise<boolean> {
  for (const pattern of namePatterns) {
    const selectors = [
      `input[name*="${pattern}" i]`,
      `input[id*="${pattern}" i]`,
      `input[placeholder*="${pattern}" i]`,
      `textarea[name*="${pattern}" i]`,
    ];

    for (const selector of selectors) {
      const field = await page.$(selector);
      if (field) {
        const isVisible = await field.isVisible();
        if (isVisible) {
          await field.fill(value);
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Match procedure type text from dropdown to our ProcedureType
 */
function matchesProcedure(optionText: string, procedureType: string): boolean {
  const text = optionText.toLowerCase();
  const mappings: Record<string, string[]> = {
    'SALARIE_PAYSIPS': ['salarié', 'salarie', 'travail', 'paysips'],
    'ETUDIANT_RENEWAL': ['étudiant', 'etudiant', 'student'],
    'CHANGEMENT_STATUT_ETUDIANT_SALARIE': ['changement', 'statut'],
    'VIE_FAMILIALE_MARIAGE': ['familiale', 'mariage', 'conjoint'],
    'VIE_FAMILIALE_ENFANT': ['familiale', 'enfant'],
    'ENTREPRENEUR': ['entrepreneur', 'auto-entrepreneur', 'commerçant'],
    'DUPLICATA_PERDU': ['duplicata', 'perdu', 'volé'],
    'RENEWAL_ANY': ['renouvellement', 'renewal'],
    'NATURALISATION': ['naturalisation', 'nationalité'],
    'AUTRE': ['autre', 'other'],
  };

  const keywords = mappings[procedureType] || [];
  return keywords.some(keyword => text.includes(keyword));
}

/**
 * Extract booking reference from confirmation page
 */
function extractBookingRef(html: string): string | null {
  // Common patterns for booking references
  const patterns = [
    /référence\s*[:：]\s*([A-Z0-9-]+)/i,
    /numéro\s*[:：]\s*([A-Z0-9-]+)/i,
    /confirmation\s*[:：]\s*([A-Z0-9-]+)/i,
    /ref\s*[:：]\s*([A-Z0-9-]+)/i,
    /n°\s*([A-Z0-9-]+)/i,
    /booking.?ref[^:]*[:：]\s*([A-Z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Cleanup browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
