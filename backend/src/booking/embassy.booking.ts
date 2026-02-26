import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { Client } from '@prisma/client';
import * as bookingService from '../services/booking.service.js';
import logger from '../utils/logger.util.js';
import path from 'path';
import fs from 'fs';

/**
 * Indian Embassy Auto-Booking Worker
 * 
 * Flow:
 * 1. Slot detected by consulate scraper
 * 2. Find matching client
 * 3. Open embassy appointment page
 * 4. Fill client details (name, passport, DOB, etc.)
 * 5. Select date/time
 * 6. Submit → No CAPTCHA, No Payment
 * 7. Capture confirmation
 * 
 * This is the simplest booking system - fully automatic, no blockers.
 */

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './screenshots/bookings';
const PAGE_TIMEOUT = 30000;

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
      '--single-process',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
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
    locale: 'en-US',
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
  });

  return { context, page };
}

/**
 * Main booking function for Indian Embassy
 */
export async function bookEmbassyAppointment(
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

  const clientDir = path.join(SCREENSHOT_DIR, 'embassy', client.id);
  fs.mkdirSync(clientDir, { recursive: true });

  try {
    await bookingService.updateBookingStatus(client.id, 'BOOKING', 'Opening embassy website');
    await bookingService.logBookingAction(client.id, 'EMBASSY_BOOKING_STARTED', `Service: ${client.embassyServiceType}`);

    // Step 1: Navigate to embassy appointment page
    const bookingUrl = (client as any).consulate?.baseUrl;
    if (!bookingUrl) {
      throw new Error('No booking URL for embassy/consulate');
    }

    logger.info(`[Embassy Booking] Opening ${bookingUrl} for ${client.firstName} ${client.lastName}`);
    await page.goto(bookingUrl, { waitUntil: 'networkidle', timeout: PAGE_TIMEOUT });

    await page.screenshot({ path: path.join(clientDir, '01_landing.png') });
    await bookingService.logBookingAction(client.id, 'PAGE_LOADED', bookingUrl);

    // Step 2: Select service type
    if (client.embassyServiceType) {
      const serviceSelect = await page.$('select[name*="service"], select[id*="service"], select[name*="category"]');
      if (serviceSelect) {
        const options = await serviceSelect.$$('option');
        for (const option of options) {
          const text = await option.textContent();
          if (text && matchesEmbassyService(text, client.embassyServiceType)) {
            const value = await option.getAttribute('value');
            if (value) {
              await serviceSelect.selectOption(value);
              await page.waitForTimeout(1000);
              break;
            }
          }
        }
      }
    }

    await page.screenshot({ path: path.join(clientDir, '02_service_selected.png') });
    await bookingService.logBookingAction(client.id, 'SERVICE_SELECTED', client.embassyServiceType || '');

    // Step 3: Fill personal details
    // Full name (sometimes single field)
    const fullName = `${client.firstName} ${client.lastName}`;
    const nameField = await page.$('input[name*="name" i]:not([name*="first"]):not([name*="last"])');
    if (nameField && await nameField.isVisible()) {
      await nameField.fill(fullName);
    } else {
      // Separate first/last name fields
      await fillEmbassyField(page, ['first_name', 'firstName', 'given_name', 'prenom'], client.firstName);
      await fillEmbassyField(page, ['last_name', 'lastName', 'family_name', 'surname', 'nom'], client.lastName);
    }

    // Passport number
    if (client.passportNumber) {
      await fillEmbassyField(page, ['passport', 'passport_number', 'passportNumber', 'document'], client.passportNumber);
    }

    // Passport file number
    if (client.passportFileNumber) {
      await fillEmbassyField(page, ['file_number', 'fileNumber', 'file_no'], client.passportFileNumber);
    }

    // Date of birth
    if (client.dateOfBirth) {
      const dob = client.dateOfBirth;
      const dobStr = `${dob.getDate().toString().padStart(2, '0')}/${(dob.getMonth() + 1).toString().padStart(2, '0')}/${dob.getFullYear()}`;
      await fillEmbassyField(page, ['birth', 'dob', 'date_of_birth', 'dateOfBirth', 'naissance'], dobStr);
    }

    // Email
    if (client.email) {
      await fillEmbassyField(page, ['email', 'mail', 'e-mail'], client.email);
    }

    // Phone
    await fillEmbassyField(page, ['phone', 'mobile', 'telephone', 'tel', 'contact'], client.phone);

    await page.screenshot({ path: path.join(clientDir, '03_form_filled.png') });
    await bookingService.logBookingAction(client.id, 'FORM_FILLED', 'Personal details entered', path.join(clientDir, '03_form_filled.png'));

    // Step 4: Select date
    const dateInput = await page.$('input[type="date"], input[name*="date"], input[name*="appointment"]');
    if (dateInput) {
      await dateInput.fill(slotDate);
      await page.waitForTimeout(500);
    } else {
      // Try calendar click
      const dateCell = await page.$(`td[data-date="${slotDate}"], a[data-date="${slotDate}"], .available[data-date="${slotDate}"]`);
      if (dateCell) {
        await dateCell.click();
        await page.waitForTimeout(500);
      }
    }

    // Select time if available
    if (slotTime) {
      const timeSelect = await page.$('select[name*="time"], select[name*="slot"]');
      if (timeSelect) {
        const options = await timeSelect.$$('option');
        for (const option of options) {
          const text = await option.textContent();
          if (text && text.includes(slotTime)) {
            const value = await option.getAttribute('value');
            if (value) {
              await timeSelect.selectOption(value);
              break;
            }
          }
        }
      } else {
        // Try clicking time button
        const timeBtn = await page.$(`button:has-text("${slotTime}"), label:has-text("${slotTime}")`);
        if (timeBtn) await timeBtn.click();
      }
    }

    await page.screenshot({ path: path.join(clientDir, '04_date_selected.png') });
    await bookingService.logBookingAction(client.id, 'DATE_SELECTED', `${slotDate} ${slotTime || ''}`);

    // Step 5: Accept terms if present
    const checkbox = await page.$('input[type="checkbox"][name*="agree"], input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="consent"]');
    if (checkbox) {
      await checkbox.check();
    }

    // Step 6: Submit
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Book"), button:has-text("Confirm"), button:has-text("Submit")');
    if (submitBtn) {
      await submitBtn.click();
    }

    // Wait for confirmation
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(clientDir, '05_confirmation.png'), fullPage: true });

    // Extract reference
    const pageContent = await page.content();
    const bookingRef = extractEmbassyRef(pageContent);

    await bookingService.logBookingAction(
      client.id,
      'SUBMITTED',
      `Ref: ${bookingRef || 'checking...'}`,
      path.join(clientDir, '05_confirmation.png')
    );

    // Mark as booked
    await bookingService.markAsBooked(client.id, {
      bookingDate: new Date(slotDate),
      bookingTime: slotTime,
      bookingRef: bookingRef || undefined,
      bookingUrl: page.url(),
      bookingScreenshot: path.join(clientDir, '05_confirmation.png'),
    });

    logger.info(`[Embassy Booking] SUCCESS for ${client.firstName} ${client.lastName}: ${slotDate} ${slotTime || ''}`);

    return {
      success: true,
      bookingRef: bookingRef || undefined,
      bookingDate: new Date(slotDate),
      bookingTime: slotTime,
      screenshotPath: path.join(clientDir, '05_confirmation.png'),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[Embassy Booking] Failed for ${client.firstName} ${client.lastName}: ${errorMsg}`);

    try {
      await page.screenshot({ path: path.join(clientDir, 'error.png'), fullPage: true });
      await bookingService.logBookingAction(client.id, 'EMBASSY_ERROR', errorMsg, path.join(clientDir, 'error.png'));
    } catch { /* ignore */ }

    await bookingService.markBookingFailed(client.id, errorMsg);

    return { success: false, error: errorMsg };
  } finally {
    await context.close();
  }
}

// ─── Helpers ─────────────────────────────────────────────

async function fillEmbassyField(page: Page, namePatterns: string[], value: string): Promise<boolean> {
  for (const pattern of namePatterns) {
    const selectors = [
      `input[name*="${pattern}" i]`,
      `input[id*="${pattern}" i]`,
      `input[placeholder*="${pattern}" i]`,
    ];
    for (const selector of selectors) {
      const field = await page.$(selector);
      if (field && await field.isVisible()) {
        await field.fill(value);
        return true;
      }
    }
  }
  return false;
}

function matchesEmbassyService(optionText: string, serviceType: string): boolean {
  const text = optionText.toLowerCase();
  const mappings: Record<string, string[]> = {
    'PASSPORT_RENEWAL': ['passport renewal', 'renouvellement passeport', 'passport renew'],
    'PASSPORT_REISSUE': ['passport reissue', 're-issue', 'reissue'],
    'PASSPORT_NEW': ['new passport', 'fresh passport', 'nouveau passeport'],
    'PASSPORT_TATKAL': ['tatkal', 'urgent passport', 'tatkaal'],
    'OCI_REGISTRATION': ['oci registration', 'oci new', 'overseas citizen'],
    'OCI_RENEWAL': ['oci renewal', 'oci renew'],
    'OCI_MISC': ['oci misc', 'oci other'],
    'VISA_CONSULAR': ['visa', 'consular visa'],
    'BIRTH_REGISTRATION': ['birth', 'naissance'],
    'CONSULAR_OTHER': ['other', 'autre', 'miscellaneous'],
  };

  const keywords = mappings[serviceType] || [];
  return keywords.some(keyword => text.includes(keyword));
}

function extractEmbassyRef(html: string): string | null {
  const patterns = [
    /reference\s*[:：#]\s*([A-Z0-9/-]+)/i,
    /appointment\s*(?:no|number|id)\s*[:：#]\s*([A-Z0-9/-]+)/i,
    /booking\s*(?:no|number|id|ref)\s*[:：#]\s*([A-Z0-9/-]+)/i,
    /confirmation\s*[:：#]\s*([A-Z0-9/-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
