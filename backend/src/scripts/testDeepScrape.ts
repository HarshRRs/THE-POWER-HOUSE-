/**
 * Deep Prefecture Scraping Test
 * 
 * Tests the full flow:
 * 1. Accept CGU
 * 2. Fill form
 * 3. Solve CAPTCHA
 * 4. Check for slots
 * 
 * Run: npx tsx src/scripts/testDeepScrape.ts
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || 'd026d41a1ee066251d44318052ac07a8';
const TWO_CAPTCHA_BASE = 'http://2captcha.com';

// Test prefecture
const TEST_PREFECTURE = {
  name: 'Créteil (94)',
  baseUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/',
  demarche: '16040',
};

function log(level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' | 'STEP', message: string) {
  const colors: Record<string, string> = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARN: '\x1b[33m',
    STEP: '\x1b[35m',
  };
  const reset = '\x1b[0m';
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  console.log(`${colors[level]}[${timestamp}][${level}]${reset} ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════
// CAPTCHA SOLVING
// ═══════════════════════════════════════

async function solveImageCaptcha(base64Image: string): Promise<{ success: boolean; answer?: string }> {
  log('INFO', 'Submitting image CAPTCHA to 2Captcha...');
  
  try {
    const submitBody = new URLSearchParams({
      key: TWOCAPTCHA_API_KEY,
      method: 'base64',
      body: base64Image,
      json: '1',
    });

    const submitRes = await fetch(`${TWO_CAPTCHA_BASE}/in.php`, {
      method: 'POST',
      body: submitBody,
    });
    const submitData = await submitRes.json() as { status: number; request: string };

    if (submitData.status !== 1) {
      log('ERROR', `Submit failed: ${submitData.request}`);
      return { success: false };
    }

    const captchaId = submitData.request;
    log('INFO', `CAPTCHA submitted, ID: ${captchaId}`);

    // Poll for result
    await sleep(10000);
    
    for (let i = 0; i < 12; i++) {
      const resultUrl = `${TWO_CAPTCHA_BASE}/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`;
      const res = await fetch(resultUrl);
      const data = await res.json() as { status: number; request: string };

      if (data.status === 1) {
        log('SUCCESS', `CAPTCHA solved: "${data.request}"`);
        return { success: true, answer: data.request };
      }

      if (data.request !== 'CAPCHA_NOT_READY') {
        log('ERROR', `Solve error: ${data.request}`);
        return { success: false };
      }

      log('INFO', `Waiting for solution... (${i + 1}/12)`);
      await sleep(5000);
    }

    return { success: false };
  } catch (error) {
    log('ERROR', `CAPTCHA error: ${error}`);
    return { success: false };
  }
}

// ═══════════════════════════════════════
// MAIN SCRAPING FLOW
// ═══════════════════════════════════════

async function testDeepScrape(): Promise<void> {
  console.log('\n' + '═'.repeat(60));
  console.log('   DEEP PREFECTURE SCRAPING TEST');
  console.log('   ' + TEST_PREFECTURE.name);
  console.log('═'.repeat(60) + '\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });

  // Stealth
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ─── STEP 1: Load CGU Page ───
    log('STEP', '1. Loading CGU page...');
    await page.goto(TEST_PREFECTURE.baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: './screenshots/deep_01_cgu.png' });
    
    const title = await page.title();
    log('INFO', `Page: ${title}`);

    // ─── STEP 2: Accept CGU ───
    log('STEP', '2. Accepting CGU conditions...');
    
    // Look for CGU checkbox and accept button
    const cguCheckbox = await page.$('input[type="checkbox"][name*="condition"], input[type="checkbox"][id*="condition"], #condition');
    if (cguCheckbox) {
      // Click the checkbox (not just check)
      await cguCheckbox.click();
      log('INFO', 'CGU checkbox clicked');
      await sleep(500);
    }

    // Wait for button to become enabled
    await sleep(1000);

    // Click submit/continue button - wait for it to be enabled
    try {
      await page.waitForSelector('button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled])', { timeout: 5000 });
      const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        log('INFO', 'Clicked continue button');
      }
    } catch {
      // Try clicking any visible button
      log('WARN', 'Button still disabled, trying alternative approach...');
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLButtonElement;
        if (btn) {
          btn.disabled = false;
          btn.click();
        }
      });
      await page.waitForLoadState('networkidle');
    }

    await page.screenshot({ path: './screenshots/deep_02_after_cgu.png' });
    log('INFO', `New page: ${await page.title()}`);

    // ─── STEP 3: Check for CAPTCHA ───
    log('STEP', '3. Checking for CAPTCHA...');
    
    const captchaImg = await page.$('img[src*="captcha"], img[id*="captcha"], #captchaImage, .captcha img');
    
    if (captchaImg) {
      log('WARN', 'CAPTCHA detected! Attempting to solve...');
      
      // Screenshot the CAPTCHA
      const captchaBuffer = await captchaImg.screenshot();
      const base64 = captchaBuffer.toString('base64');
      
      // Save CAPTCHA image for inspection
      const fs = await import('fs');
      fs.writeFileSync('./screenshots/deep_captcha.png', captchaBuffer);
      log('INFO', 'CAPTCHA image saved to deep_captcha.png');

      // Solve it
      const solution = await solveImageCaptcha(base64);
      
      if (solution.success && solution.answer) {
        // Find CAPTCHA input and fill
        const captchaInput = await page.$('input[name*="captcha"], input[id*="captcha"], #captchaForImage');
        if (captchaInput) {
          await captchaInput.fill(solution.answer);
          log('SUCCESS', `Entered CAPTCHA: ${solution.answer}`);
          
          // Submit form
          const formSubmit = await page.$('button[type="submit"], input[type="submit"]');
          if (formSubmit) {
            await formSubmit.click();
            await page.waitForLoadState('networkidle');
          }
          
          await page.screenshot({ path: './screenshots/deep_03_after_captcha.png' });
        }
      } else {
        log('ERROR', 'Failed to solve CAPTCHA');
      }
    } else {
      log('INFO', 'No CAPTCHA on this page');
    }

    // ─── STEP 4: Look for Calendar/Slots ───
    log('STEP', '4. Looking for calendar/slots...');
    
    const currentUrl = page.url();
    log('INFO', `Current URL: ${currentUrl}`);
    
    // Check for common slot/calendar indicators
    const indicators = {
      calendar: await page.$('.calendar, #calendar, [class*="calendar"], table.calendar'),
      slots: await page.$$('[class*="slot"], [class*="disponible"], .available, td.free'),
      noSlots: await page.$('[class*="no-slot"], [class*="indisponible"], .unavailable, :text("aucun créneau")'),
      dateSelect: await page.$('select[name*="date"], input[type="date"]'),
    };

    if (indicators.calendar) {
      log('SUCCESS', 'Calendar found!');
    }
    
    if (indicators.slots.length > 0) {
      log('SUCCESS', `Found ${indicators.slots.length} potential slot elements!`);
    }
    
    if (indicators.noSlots) {
      log('WARN', 'No slots available message detected');
    }

    if (indicators.dateSelect) {
      log('INFO', 'Date selector found');
    }

    // Get page content for analysis
    const pageText = await page.textContent('body');
    
    // Check for slot-related keywords
    const slotKeywords = [
      'créneau', 'disponible', 'réserver', 'rendez-vous',
      'slot', 'available', 'appointment', 'calendar'
    ];
    
    const foundKeywords = slotKeywords.filter(kw => 
      pageText?.toLowerCase().includes(kw.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      log('INFO', `Found keywords: ${foundKeywords.join(', ')}`);
    }

    // Final screenshot
    await page.screenshot({ path: './screenshots/deep_04_final.png', fullPage: true });
    log('SUCCESS', 'Screenshots saved to ./screenshots/');

    // ─── STEP 5: Check for Turnstile (might appear now) ───
    log('STEP', '5. Final Turnstile check...');
    
    const turnstileSelectors = [
      '#cf-wrapper', '.cf-challenge', '.cf-turnstile',
      'iframe[src*="challenges.cloudflare.com"]',
      '[data-sitekey]',
    ];

    for (const sel of turnstileSelectors) {
      const el = await page.$(sel);
      if (el) {
        log('WARN', `Turnstile element found: ${sel}`);
        
        // Try to get sitekey
        try {
          const siteKey = await page.$eval('[data-sitekey]', e => e.getAttribute('data-sitekey'));
          if (siteKey) {
            log('INFO', `Sitekey: ${siteKey.substring(0, 30)}...`);
          }
        } catch { /* ignore */ }
      }
    }

    log('SUCCESS', 'Deep scrape test complete!');

  } catch (error) {
    log('ERROR', `Test failed: ${error}`);
    await page.screenshot({ path: './screenshots/deep_error.png' });
  } finally {
    await context.close();
    await browser.close();
  }
}

// Run
testDeepScrape().catch(console.error);
