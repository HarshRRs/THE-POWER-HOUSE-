/**
 * Test Script: Validate Turnstile Solving & Prefecture Scraping
 * 
 * This script tests the core booking engine capabilities:
 * 1. 2Captcha API connectivity and balance
 * 2. Turnstile detection on RDV-Préfecture
 * 3. Turnstile solving via 2Captcha
 * 4. Category-level scraping
 * 
 * Run: npx tsx src/scripts/testTurnstile.ts
 */

import { chromium, type Browser, type Page } from 'playwright';

// Environment
const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || 'd026d41a1ee066251d44318052ac07a8';
const TWO_CAPTCHA_BASE = 'http://2captcha.com';

// Test URLs - RDV-Préfecture sites known to have Turnstile
const TEST_URLS = [
  {
    name: 'Créteil (94)',
    url: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/',
    demarche: '16040',
  },
  {
    name: 'Nanterre (92)',
    url: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1922/cgu/',
    demarche: '1922',
  },
];

// ═══════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════

function log(level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN', message: string) {
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    SUCCESS: '\x1b[32m', // Green
    ERROR: '\x1b[31m',   // Red
    WARN: '\x1b[33m',    // Yellow
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${level}]${reset} ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════
// TEST 1: 2Captcha API Balance
// ═══════════════════════════════════════

async function test2CaptchaBalance(): Promise<boolean> {
  log('INFO', '=== TEST 1: 2Captcha API Balance ===');
  
  try {
    const response = await fetch(
      `${TWO_CAPTCHA_BASE}/res.php?key=${TWOCAPTCHA_API_KEY}&action=getbalance&json=1`
    );
    const data = await response.json() as { status: number; request: string };
    
    if (data.status === 1) {
      const balance = parseFloat(data.request);
      log('SUCCESS', `2Captcha Balance: $${balance.toFixed(2)}`);
      
      if (balance < 1) {
        log('WARN', 'Low balance! Consider adding funds.');
      }
      
      return balance > 0;
    } else {
      log('ERROR', `2Captcha error: ${data.request}`);
      return false;
    }
  } catch (error) {
    log('ERROR', `Failed to check balance: ${error}`);
    return false;
  }
}

// ═══════════════════════════════════════
// TEST 2: Detect Turnstile on Page
// ═══════════════════════════════════════

async function detectTurnstile(page: Page): Promise<{ detected: boolean; siteKey: string | null }> {
  const turnstileSelectors = [
    '#cf-wrapper',
    '.cf-challenge',
    '.cf-browser-verification',
    'input[name="cf-turnstile-response"]',
    'iframe[src*="challenges.cloudflare.com"]',
    '[data-sitekey]',
    '.cf-turnstile',
  ];

  for (const selector of turnstileSelectors) {
    const element = await page.$(selector);
    if (element) {
      // Try to extract sitekey
      let siteKey: string | null = null;
      try {
        siteKey = await page.$eval('[data-sitekey]', (el) => el.getAttribute('data-sitekey'));
      } catch { /* ignore */ }
      
      return { detected: true, siteKey };
    }
  }

  // Also check for Cloudflare challenge page
  const title = await page.title();
  if (title.includes('Just a moment') || title.includes('Cloudflare')) {
    return { detected: true, siteKey: null };
  }

  return { detected: false, siteKey: null };
}

// ═══════════════════════════════════════
// TEST 3: Solve Turnstile via 2Captcha
// ═══════════════════════════════════════

async function solveTurnstile(siteKey: string, pageUrl: string): Promise<{ success: boolean; token?: string; timeMs?: number }> {
  log('INFO', 'Submitting Turnstile to 2Captcha...');
  const startTime = Date.now();
  
  try {
    // Submit task
    const submitBody = new URLSearchParams({
      key: TWOCAPTCHA_API_KEY,
      method: 'turnstile',
      sitekey: siteKey,
      pageurl: pageUrl,
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
    log('INFO', `Task submitted, ID: ${captchaId}`);

    // Poll for result
    await sleep(15000); // Initial wait
    
    for (let i = 0; i < 24; i++) { // Max 2 minutes
      const resultUrl = `${TWO_CAPTCHA_BASE}/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`;
      const res = await fetch(resultUrl);
      const data = await res.json() as { status: number; request: string };

      if (data.status === 1) {
        const timeMs = Date.now() - startTime;
        log('SUCCESS', `Turnstile solved in ${timeMs}ms`);
        return { success: true, token: data.request, timeMs };
      }

      if (data.request !== 'CAPCHA_NOT_READY') {
        log('ERROR', `Solve error: ${data.request}`);
        return { success: false };
      }

      log('INFO', `Waiting... (attempt ${i + 1}/24)`);
      await sleep(5000);
    }

    log('ERROR', 'Timeout waiting for solution');
    return { success: false };
  } catch (error) {
    log('ERROR', `Solve error: ${error}`);
    return { success: false };
  }
}

// ═══════════════════════════════════════
// TEST 4: Full Prefecture Page Test
// ═══════════════════════════════════════

async function testPrefecturePage(browser: Browser, testCase: typeof TEST_URLS[0]): Promise<boolean> {
  log('INFO', `=== Testing ${testCase.name} ===`);
  log('INFO', `URL: ${testCase.url}`);
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });

  const page = await context.newPage();

  try {
    // Navigate to page
    log('INFO', 'Loading page...');
    await page.goto(testCase.url, { waitUntil: 'networkidle', timeout: 30000 });
    
    const title = await page.title();
    log('INFO', `Page title: ${title}`);

    // Check for Turnstile
    const turnstile = await detectTurnstile(page);
    
    if (turnstile.detected) {
      log('WARN', 'Cloudflare Turnstile DETECTED!');
      
      if (turnstile.siteKey) {
        log('INFO', `Sitekey: ${turnstile.siteKey.substring(0, 30)}...`);
        
        // Attempt to solve
        const solution = await solveTurnstile(turnstile.siteKey, page.url());
        
        if (solution.success) {
          log('SUCCESS', `Turnstile bypassed! Token length: ${solution.token?.length}`);
          
          // Inject token
          await page.evaluate(`(function(token) {
            var input = document.querySelector('[name="cf-turnstile-response"]');
            if (input) input.value = token;
          })("${solution.token}")`);
          
          // Wait and check if we get through
          await sleep(3000);
          const newTitle = await page.title();
          log('INFO', `After injection, title: ${newTitle}`);
          
          return true;
        } else {
          log('ERROR', 'Failed to solve Turnstile');
          return false;
        }
      } else {
        log('WARN', 'Turnstile detected but no sitekey found (full-page challenge)');
        return false;
      }
    } else {
      log('SUCCESS', 'No Turnstile detected - page loaded directly');
      
      // Check for application CAPTCHA
      const appCaptcha = await page.$('img[src*="captcha"], .captcha, input[name*="captcha"]');
      if (appCaptcha) {
        log('INFO', 'Application CAPTCHA detected (this is normal - solvable)');
      }
      
      // Check for slots
      const slotIndicators = await page.$$('.calendar, .available, [class*="slot"], [class*="disponible"]');
      log('INFO', `Found ${slotIndicators.length} potential slot indicators`);
      
      // Take screenshot
      await page.screenshot({ path: `./screenshots/test_${testCase.demarche}.png`, fullPage: true });
      log('SUCCESS', `Screenshot saved: test_${testCase.demarche}.png`);
      
      return true;
    }
  } catch (error) {
    log('ERROR', `Test failed: ${error}`);
    return false;
  } finally {
    await context.close();
  }
}

// ═══════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('   TURNSTILE & PREFECTURE SCRAPING TEST');
  console.log('═'.repeat(60) + '\n');

  const results: { test: string; passed: boolean }[] = [];

  // Test 1: 2Captcha Balance
  const balanceOk = await test2CaptchaBalance();
  results.push({ test: '2Captcha Balance', passed: balanceOk });
  
  if (!balanceOk) {
    log('ERROR', 'Cannot proceed without valid 2Captcha API key/balance');
    process.exit(1);
  }

  console.log('');

  // Test 2-4: Prefecture Pages
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const testCase of TEST_URLS) {
      const passed = await testPrefecturePage(browser, testCase);
      results.push({ test: `Prefecture: ${testCase.name}`, passed });
      console.log('');
    }
  } finally {
    await browser.close();
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('   TEST RESULTS SUMMARY');
  console.log('═'.repeat(60));
  
  for (const result of results) {
    const status = result.passed ? '\x1b[32m✓ PASS\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m';
    console.log(`  ${status}  ${result.test}`);
  }

  const passCount = results.filter(r => r.passed).length;
  console.log('');
  console.log(`  Total: ${passCount}/${results.length} tests passed`);
  console.log('═'.repeat(60) + '\n');

  process.exit(passCount === results.length ? 0 : 1);
}

main().catch(console.error);
