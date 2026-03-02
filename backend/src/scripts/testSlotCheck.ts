/**
 * Full Prefecture Slot Check Test
 * 
 * Tests the complete slot detection flow:
 * 1. Load prefecture page
 * 2. Solve image CAPTCHA via 2Captcha
 * 3. Submit form
 * 4. Check for available slots
 * 
 * Run: npx tsx src/scripts/testSlotCheck.ts
 */

import { chromium, type Page } from 'playwright';

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || 'd026d41a1ee066251d44318052ac07a8';
const TWO_CAPTCHA_BASE = 'http://2captcha.com';

// Test prefecture - Créteil demarche 16040
const TEST_URL = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/';

function log(level: string, message: string) {
  const colors: Record<string, string> = {
    INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m',
    WARN: '\x1b[33m', STEP: '\x1b[35m', CAPTCHA: '\x1b[34m',
  };
  const reset = '\x1b[0m';
  const time = new Date().toLocaleTimeString('fr-FR');
  console.log(`${colors[level] || ''}[${time}][${level}]${reset} ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function solveImageCaptcha(base64Image: string): Promise<string | null> {
  log('CAPTCHA', 'Sending to 2Captcha for solving...');
  
  try {
    // Submit
    const submitRes = await fetch(`${TWO_CAPTCHA_BASE}/in.php`, {
      method: 'POST',
      body: new URLSearchParams({
        key: TWOCAPTCHA_API_KEY,
        method: 'base64',
        body: base64Image,
        json: '1',
      }),
    });
    const submitData = await submitRes.json() as { status: number; request: string };

    if (submitData.status !== 1) {
      log('ERROR', `Submit failed: ${submitData.request}`);
      return null;
    }

    const captchaId = submitData.request;
    log('CAPTCHA', `Task ID: ${captchaId}, waiting for solution...`);

    // Poll
    await sleep(8000);
    
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${TWO_CAPTCHA_BASE}/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`);
      const data = await res.json() as { status: number; request: string };

      if (data.status === 1) {
        log('SUCCESS', `CAPTCHA solved: "${data.request}"`);
        return data.request;
      }

      if (data.request !== 'CAPCHA_NOT_READY') {
        log('ERROR', `Error: ${data.request}`);
        return null;
      }

      log('INFO', `Still solving... (${i + 1}/15)`);
      await sleep(3000);
    }

    return null;
  } catch (error) {
    log('ERROR', `${error}`);
    return null;
  }
}

async function testSlotCheck(): Promise<void> {
  console.log('\n' + '═'.repeat(60));
  console.log('   PREFECTURE SLOT CHECK TEST');
  console.log('   Testing: Créteil (94) - Demarche 16040');
  console.log('═'.repeat(60) + '\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ─── STEP 1: Load Page ───
    log('STEP', '1. Loading prefecture page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    
    log('INFO', `Title: ${await page.title()}`);
    await page.screenshot({ path: './screenshots/slot_01_initial.png' });

    // ─── STEP 2: Find and Solve CAPTCHA ───
    log('STEP', '2. Looking for CAPTCHA...');
    
    // The CAPTCHA image selector
    const captchaImg = await page.$('img[src*="captcha"], img#captchaImage, img[alt*="captcha"], .captcha img, img[src*="jcaptcha"]');
    
    if (!captchaImg) {
      log('WARN', 'No CAPTCHA image found, checking page state...');
      const pageContent = await page.content();
      if (pageContent.includes('captcha')) {
        log('INFO', 'Page contains captcha references, trying broader selector...');
        // Try to find any image that might be CAPTCHA
        const allImages = await page.$$('img');
        for (const img of allImages) {
          const src = await img.getAttribute('src');
          if (src && (src.includes('captcha') || src.includes('jcaptcha'))) {
            log('INFO', `Found CAPTCHA image: ${src}`);
          }
        }
      }
    } else {
      log('SUCCESS', 'CAPTCHA image found!');
      
      // Take screenshot of CAPTCHA
      const captchaBuffer = await captchaImg.screenshot();
      const base64 = captchaBuffer.toString('base64');
      
      // Save for inspection
      const fs = await import('fs');
      fs.writeFileSync('./screenshots/slot_captcha.png', captchaBuffer);
      log('INFO', 'CAPTCHA saved to slot_captcha.png');

      // Solve it
      const answer = await solveImageCaptcha(base64);
      
      if (answer) {
        // Find input field
        const inputSelectors = [
          'input[name*="captcha"]',
          'input#captchaForImage',
          'input[id*="captcha"]',
          'input[placeholder*="code"]',
          'input[type="text"]',
        ];
        
        let captchaInput = null;
        for (const sel of inputSelectors) {
          captchaInput = await page.$(sel);
          if (captchaInput) {
            const isVisible = await captchaInput.isVisible();
            if (isVisible) {
              log('INFO', `Found input: ${sel}`);
              break;
            }
          }
        }
        
        if (captchaInput) {
          await captchaInput.fill(answer);
          log('SUCCESS', `Entered CAPTCHA answer: ${answer}`);
          await page.screenshot({ path: './screenshots/slot_02_captcha_filled.png' });
          
          // ─── STEP 3: Submit Form ───
          log('STEP', '3. Submitting form...');
          
          // Find and click submit
          const submitBtn = await page.$('button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled]), button:has-text("Suivant"), button:has-text("Valider")');
          
          if (submitBtn) {
            await submitBtn.click();
            log('INFO', 'Clicked submit button');
            
            // Wait for response
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
            await sleep(2000);
            
            await page.screenshot({ path: './screenshots/slot_03_after_submit.png' });
            log('INFO', `New URL: ${page.url()}`);
            log('INFO', `New title: ${await page.title()}`);
            
            // ─── STEP 4: Check for Slots ───
            log('STEP', '4. Checking for available slots...');
            
            const pageText = await page.textContent('body') || '';
            
            // Check for common messages
            if (pageText.includes('aucun créneau') || pageText.includes('aucune disponibilité') || pageText.includes('pas de créneau')) {
              log('WARN', '❌ NO SLOTS AVAILABLE');
            } else if (pageText.includes('créneau disponible') || pageText.includes('choisir un créneau') || pageText.includes('disponibilités')) {
              log('SUCCESS', '✅ SLOTS MAY BE AVAILABLE!');
            }
            
            // Look for calendar
            const calendar = await page.$('.fc-view, .calendar, table.calendar, [class*="calendar"]');
            if (calendar) {
              log('SUCCESS', '📅 Calendar element found!');
            }
            
            // Look for slot elements
            const slots = await page.$$('[class*="slot"], [class*="dispo"], .available, td.free, .creneau');
            if (slots.length > 0) {
              log('SUCCESS', `Found ${slots.length} potential slot elements`);
            }
            
            // Check for error messages
            if (pageText.includes('captcha') && (pageText.includes('incorrect') || pageText.includes('invalide') || pageText.includes('erreur'))) {
              log('ERROR', 'CAPTCHA was incorrect - 2Captcha may have solved it wrong');
            }
            
          } else {
            log('WARN', 'Submit button not found or disabled');
          }
        } else {
          log('ERROR', 'Could not find CAPTCHA input field');
        }
      } else {
        log('ERROR', 'Failed to solve CAPTCHA');
      }
    }

    // Final screenshot
    await page.screenshot({ path: './screenshots/slot_04_final.png', fullPage: true });
    log('SUCCESS', 'Test complete! Screenshots saved to ./screenshots/');
    
    // ─── Summary ───
    console.log('\n' + '─'.repeat(60));
    console.log('   RESULTS');
    console.log('─'.repeat(60));
    console.log(`   URL: ${page.url()}`);
    console.log(`   Title: ${await page.title()}`);
    console.log('─'.repeat(60) + '\n');

  } catch (error) {
    log('ERROR', `Test failed: ${error}`);
    try {
      await page.screenshot({ path: './screenshots/slot_error.png' });
    } catch { /* ignore */ }
  } finally {
    await context.close();
    await browser.close();
  }
}

testSlotCheck().catch(console.error);
