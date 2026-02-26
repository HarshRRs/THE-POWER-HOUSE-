import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { Client } from '@prisma/client';
import * as bookingService from '../services/booking.service.js';
import logger from '../utils/logger.util.js';
import path from 'path';
import fs from 'fs';

/**
 * VFS Auto-Booking Worker
 * 
 * Flow:
 * 1. Slot detected by VFS scraper
 * 2. Find matching client (with VFS login credentials)
 * 3. Login to VFS with client's account
 * 4. Navigate to booking page
 * 5. Fill details + select date
 * 6. PAUSE at payment step → notify admin
 * 7. Admin completes payment on phone
 * 8. Capture confirmation
 */

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || './screenshots/bookings';
const PAGE_TIMEOUT = 60000;
const CLOUDFLARE_WAIT = 30000;

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
    timezoneId: 'Asia/Kolkata',
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).chrome = { runtime: {} };
  });

  return { context, page };
}

/**
 * Wait for Cloudflare challenge to resolve
 */
async function waitForCloudflare(page: Page): Promise<void> {
  const cfTexts = ['Just a moment', 'Checking your browser', 'Attention Required'];
  const pageText = await page.textContent('body') || '';

  if (cfTexts.some(t => pageText.includes(t))) {
    logger.info('[VFS Booking] Waiting for Cloudflare challenge...');
    try {
      await page.waitForFunction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => !(globalThis as any).document.body.textContent?.includes('Just a moment'),
        { timeout: CLOUDFLARE_WAIT }
      );
      await page.waitForTimeout(2000);
    } catch {
      logger.warn('[VFS Booking] Cloudflare wait timed out');
    }
  }
}

/**
 * Main booking function for VFS
 */
export async function bookVfsAppointment(
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
  paymentRequired?: boolean;
}> {
  if (!client.vfsLoginEmail || !client.vfsLoginPassword) {
    return { success: false, error: 'VFS login credentials not provided' };
  }

  const browser = await getBrowser();
  const { context, page } = await createPage(browser);

  const clientDir = path.join(SCREENSHOT_DIR, 'vfs', client.id);
  fs.mkdirSync(clientDir, { recursive: true });

  try {
    await bookingService.updateBookingStatus(client.id, 'BOOKING', 'Logging into VFS');
    await bookingService.logBookingAction(client.id, 'VFS_BOOKING_STARTED', `Country: ${client.destinationCountry}, City: ${client.preferredCity}`);

    // Step 1: Navigate to VFS login page
    const countryCode = getVfsCountryCode(client.destinationCountry || '');
    const loginUrl = `https://visa.vfsglobal.com/ind/en/${countryCode}/login`;
    
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
    await waitForCloudflare(page);
    
    await page.screenshot({ path: path.join(clientDir, '01_login_page.png') });

    // Step 2: Login
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15000 });
    await page.fill('input[type="email"], input[name="email"]', client.vfsLoginEmail);
    await page.fill('input[type="password"], input[name="password"]', client.vfsLoginPassword);
    
    const loginBtn = await page.$('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    if (loginBtn) {
      await loginBtn.click();
    }
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(clientDir, '02_logged_in.png') });
    await bookingService.logBookingAction(client.id, 'VFS_LOGGED_IN', 'Successfully logged into VFS');

    // Step 3: Navigate to appointment booking
    const appointmentUrl = `https://visa.vfsglobal.com/ind/en/${countryCode}/book-an-appointment`;
    await page.goto(appointmentUrl, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
    await waitForCloudflare(page);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: path.join(clientDir, '03_booking_page.png') });

    // Step 4: Select center (city)
    if (client.preferredCity) {
      const centerSelect = await page.$('select[name*="center"], select[id*="center"], select[name*="location"]');
      if (centerSelect) {
        const options = await centerSelect.$$('option');
        for (const option of options) {
          const text = await option.textContent();
          if (text && text.toLowerCase().includes(client.preferredCity.toLowerCase())) {
            const value = await option.getAttribute('value');
            if (value) {
              await centerSelect.selectOption(value);
              await page.waitForTimeout(1000);
              break;
            }
          }
        }
      }
    }

    // Step 5: Select visa category
    if (client.visaCategory) {
      const categorySelect = await page.$('select[name*="category"], select[id*="visa"], select[name*="visa"]');
      if (categorySelect) {
        const options = await categorySelect.$$('option');
        for (const option of options) {
          const text = await option.textContent();
          if (text && text.toLowerCase().includes(client.visaCategory.toLowerCase())) {
            const value = await option.getAttribute('value');
            if (value) {
              await categorySelect.selectOption(value);
              await page.waitForTimeout(1000);
              break;
            }
          }
        }
      }
    }

    await page.screenshot({ path: path.join(clientDir, '04_category_selected.png') });
    await bookingService.logBookingAction(client.id, 'VFS_CATEGORY_SELECTED', `${client.preferredCity} - ${client.visaCategory}`);

    // Step 6: Fill applicant details
    await fillVfsField(page, ['first_name', 'firstName', 'given_name'], client.firstName);
    await fillVfsField(page, ['last_name', 'lastName', 'family_name', 'surname'], client.lastName);
    
    if (client.passportNumber) {
      await fillVfsField(page, ['passport', 'document_number', 'passportNumber'], client.passportNumber);
    }
    if (client.dateOfBirth) {
      const dob = client.dateOfBirth;
      const dobStr = `${dob.getFullYear()}-${(dob.getMonth() + 1).toString().padStart(2, '0')}-${dob.getDate().toString().padStart(2, '0')}`;
      await fillVfsField(page, ['birth', 'dob', 'date_of_birth', 'dateOfBirth'], dobStr);
    }
    if (client.phone) {
      await fillVfsField(page, ['phone', 'mobile', 'telephone', 'contact'], client.phone);
    }
    if (client.email) {
      await fillVfsField(page, ['email', 'mail'], client.email);
    }

    await page.screenshot({ path: path.join(clientDir, '05_form_filled.png') });
    await bookingService.logBookingAction(client.id, 'VFS_FORM_FILLED', 'Applicant details entered');

    // Step 7: Select date
    // VFS typically shows a calendar - click on the available date
    const dateCell = await page.$(`td[data-date="${slotDate}"], .available[data-date="${slotDate}"], a:has-text("${slotDate}")`);
    if (dateCell) {
      await dateCell.click();
      await page.waitForTimeout(1000);
    }

    // Select time if available
    if (slotTime) {
      const timeSlot = await page.$(`button:has-text("${slotTime}"), label:has-text("${slotTime}"), div:has-text("${slotTime}")`);
      if (timeSlot) {
        await timeSlot.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: path.join(clientDir, '06_date_selected.png') });
    await bookingService.logBookingAction(client.id, 'VFS_DATE_SELECTED', `${slotDate} ${slotTime || ''}`);

    // Step 8: Check for payment page
    // VFS requires payment - we PAUSE here and notify admin
    await page.screenshot({ path: path.join(clientDir, '07_payment_step.png'), fullPage: true });
    
    await bookingService.updateBookingStatus(client.id, 'PAYMENT_WAIT', 
      `Payment required. Page URL: ${page.url()}`
    );
    await bookingService.logBookingAction(
      client.id, 
      'PAYMENT_REQUIRED', 
      `VFS payment needed. Complete at: ${page.url()}`,
      path.join(clientDir, '07_payment_step.png')
    );

    logger.info(`[VFS Booking] Payment required for ${client.firstName} ${client.lastName} - notifying admin`);

    return {
      success: false,
      paymentRequired: true,
      bookingDate: new Date(slotDate),
      bookingTime: slotTime,
      screenshotPath: path.join(clientDir, '07_payment_step.png'),
      error: 'Payment required - admin notification sent',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[VFS Booking] Failed for ${client.firstName} ${client.lastName}: ${errorMsg}`);

    try {
      await page.screenshot({ path: path.join(clientDir, 'error.png'), fullPage: true });
      await bookingService.logBookingAction(client.id, 'VFS_ERROR', errorMsg, path.join(clientDir, 'error.png'));
    } catch { /* ignore */ }

    await bookingService.markBookingFailed(client.id, errorMsg);

    return { success: false, error: errorMsg };
  } finally {
    await context.close();
  }
}

// ─── Helpers ─────────────────────────────────────────────

async function fillVfsField(page: Page, namePatterns: string[], value: string): Promise<boolean> {
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

function getVfsCountryCode(country: string): string {
  const codes: Record<string, string> = {
    'Italy': 'ita',
    'Germany': 'deu',
    'France': 'fra',
    'Switzerland': 'che',
    'Austria': 'aut',
    'Belgium': 'bel',
    'Netherlands': 'nld',
    'Portugal': 'prt',
    'Spain': 'esp',
    'United Kingdom': 'gbr',
    'UK': 'gbr',
    'Canada': 'can',
    'Greece': 'grc',
    'Czech Republic': 'cze',
    'Sweden': 'swe',
    'Denmark': 'dnk',
    'Norway': 'nor',
    'Finland': 'fin',
    'Poland': 'pol',
    'Ireland': 'irl',
    'Croatia': 'hrv',
    'Hungary': 'hun',
  };
  return codes[country] || country.toLowerCase().substring(0, 3);
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
