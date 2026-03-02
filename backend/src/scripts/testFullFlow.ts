/**
 * COMPLETE Prefecture Slot Check Test
 * 
 * Handles the FULL two-layer CAPTCHA flow:
 * 1. Solve Image CAPTCHA
 * 2. Solve Cloudflare Turnstile
 * 3. Check for available slots
 * 
 * Run: npx tsx src/scripts/testFullFlow.ts
 */

import { firefox, type Page, type BrowserContext } from 'playwright';

const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || 'd026d41a1ee066251d44318052ac07a8';
const TWO_CAPTCHA_BASE = 'http://2captcha.com';

const TEST_URL = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/';

function log(level: string, message: string) {
  const colors: Record<string, string> = {
    INFO: '\x1b[36m', SUCCESS: '\x1b[32m', ERROR: '\x1b[31m',
    WARN: '\x1b[33m', STEP: '\x1b[35m', CAPTCHA: '\x1b[34m',
    TURNSTILE: '\x1b[96m',
  };
  const reset = '\x1b[0m';
  const time = new Date().toLocaleTimeString('fr-FR');
  console.log(`${colors[level] || ''}[${time}][${level}]${reset} ${message}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════
// IMAGE CAPTCHA SOLVER
// ═══════════════════════════════════════

async function solveImageCaptcha(base64Image: string): Promise<string | null> {
  log('CAPTCHA', 'Sending image CAPTCHA to 2Captcha...');
  
  try {
    const submitRes = await fetch(`${TWO_CAPTCHA_BASE}/in.php`, {
      method: 'POST',
      body: new URLSearchParams({
        key: TWOCAPTCHA_API_KEY, method: 'base64', body: base64Image, json: '1',
      }),
    });
    const submitData = await submitRes.json() as { status: number; request: string };

    if (submitData.status !== 1) {
      log('ERROR', `Submit failed: ${submitData.request}`);
      return null;
    }

    const captchaId = submitData.request;
    log('CAPTCHA', `Task ID: ${captchaId}`);

    await sleep(8000);
    
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${TWO_CAPTCHA_BASE}/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`);
      const data = await res.json() as { status: number; request: string };

      if (data.status === 1) {
        log('SUCCESS', `Image CAPTCHA solved: "${data.request}"`);
        return data.request;
      }
      if (data.request !== 'CAPCHA_NOT_READY') return null;
      await sleep(3000);
    }
    return null;
  } catch (error) {
    log('ERROR', `${error}`);
    return null;
  }
}

// ═══════════════════════════════════════
// TURNSTILE SOLVER (with challenge metadata)
// ═══════════════════════════════════════

interface TurnstileMetadata {
  action?: string;
  cData?: string;
  chlPageData?: string;
  userAgent?: string;
}

async function solveTurnstile(
  siteKey: string,
  pageUrl: string,
  metadata?: TurnstileMetadata,
): Promise<string | null> {
  log('TURNSTILE', 'Sending Turnstile to 2Captcha...');
  log('TURNSTILE', `Sitekey: ${siteKey}`);
  log('TURNSTILE', `Page URL: ${pageUrl}`);
  if (metadata?.action) log('TURNSTILE', `Action: ${metadata.action}`);
  if (metadata?.cData) log('TURNSTILE', `cData: ${metadata.cData.substring(0, 30)}...`);
  if (metadata?.chlPageData) log('TURNSTILE', `pagedata: ${metadata.chlPageData.substring(0, 30)}...`);
  
  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    log('TURNSTILE', `Attempt ${attempt}/${MAX_RETRIES}...`);
    
    try {
      // Build task object - include challenge metadata when available
      const task: Record<string, unknown> = {
        type: 'TurnstileTaskProxyless',
        websiteURL: pageUrl,
        websiteKey: siteKey,
      };

      // Add Cloudflare challenge page metadata if available
      if (metadata?.action) task.action = metadata.action;
      if (metadata?.cData) task.data = metadata.cData;
      if (metadata?.chlPageData) task.pagedata = metadata.chlPageData;
      // Include userAgent - required for Cloudflare challenge pages
      if (metadata?.userAgent) task.userAgent = metadata.userAgent;

      if (attempt === 1) {
        log('TURNSTILE', `Task payload: ${JSON.stringify(task, null, 2)}`);
      }

      const submitRes = await fetch('https://api.2captcha.com/createTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: TWOCAPTCHA_API_KEY,
          task,
        }),
      });
      const submitData = await submitRes.json() as { errorId: number; errorCode?: string; taskId?: number };

      if (submitData.errorId !== 0) {
        log('ERROR', `createTask failed: ${submitData.errorCode}`);
        if (attempt === MAX_RETRIES) {
          log('INFO', 'Trying legacy API format as final fallback...');
          return await solveTurnstileLegacy(siteKey, pageUrl, metadata);
        }
        await sleep(2000);
        continue;
      }

      const taskId = submitData.taskId;
      log('TURNSTILE', `Task ID: ${taskId}, solving (takes 15-45 seconds)...`);

      // Poll for result using new API
      await sleep(10000);
      
      let unsolvable = false;
      for (let i = 0; i < 24; i++) {
        const resultRes = await fetch('https://api.2captcha.com/getTaskResult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientKey: TWOCAPTCHA_API_KEY,
            taskId: taskId,
          }),
        });
        const resultData = await resultRes.json() as { 
          errorId: number; 
          status: string; 
          solution?: { token: string }; 
          errorCode?: string;
        };

        if (resultData.status === 'ready' && resultData.solution?.token) {
          log('SUCCESS', `Turnstile solved on attempt ${attempt}! Token length: ${resultData.solution.token.length}`);
          return resultData.solution.token;
        }
        
        if (resultData.errorId !== 0 && resultData.errorCode !== 'CAPCHA_NOT_READY') {
          log('ERROR', `Poll error: ${resultData.errorCode}`);
          if (resultData.errorCode === 'ERROR_CAPTCHA_UNSOLVABLE') {
            unsolvable = true;
            break; // Break poll loop, retry with new task
          }
          return null; // Non-retryable error
        }

        log('INFO', `Waiting... (${i + 1}/24)`);
        await sleep(5000);
      }

      if (unsolvable) {
        log('WARN', `Attempt ${attempt} returned UNSOLVABLE, retrying...`);
        await sleep(3000);
        continue;
      }
      
      return null; // Timed out
    } catch (error) {
      log('ERROR', `Attempt ${attempt} error: ${error}`);
      if (attempt === MAX_RETRIES) return null;
      await sleep(2000);
    }
  }
  
  return null;
}

async function solveTurnstileLegacy(
  siteKey: string,
  pageUrl: string,
  metadata?: TurnstileMetadata,
): Promise<string | null> {
  // Legacy API format with optional challenge metadata
  const params = new URLSearchParams({
    key: TWOCAPTCHA_API_KEY,
    method: 'turnstile',
    sitekey: siteKey,
    pageurl: pageUrl,
    json: '1',
  });

  if (metadata?.action) params.set('action', metadata.action);
  if (metadata?.cData) params.set('data', metadata.cData);
  if (metadata?.chlPageData) params.set('pagedata', metadata.chlPageData);

  log('TURNSTILE', `Legacy params: ${params.toString().substring(0, 200)}...`);

  const submitRes = await fetch(`${TWO_CAPTCHA_BASE}/in.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const submitData = await submitRes.json() as { status: number; request: string };

  if (submitData.status !== 1) {
    log('ERROR', `Legacy submit failed: ${submitData.request}`);
    return null;
  }

  const captchaId = submitData.request;
  log('TURNSTILE', `Legacy task ID: ${captchaId}`);
  return await pollForResult(captchaId);
}

async function pollForResult(captchaId: string): Promise<string | null> {
  await sleep(15000);
  
  for (let i = 0; i < 24; i++) {
    const res = await fetch(`${TWO_CAPTCHA_BASE}/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`);
    const data = await res.json() as { status: number; request: string };

    if (data.status === 1) {
      log('SUCCESS', `Turnstile solved! Token length: ${data.request.length}`);
      return data.request;
    }
    if (data.request !== 'CAPCHA_NOT_READY') {
      log('ERROR', `Error: ${data.request}`);
      return null;
    }
    log('INFO', `Waiting... (${i + 1}/24)`);
    await sleep(5000);
  }
  return null;
}

// ═══════════════════════════════════════
// MAIN FLOW
// ═══════════════════════════════════════

async function testFullFlow(): Promise<void> {
  console.log('\n' + '═'.repeat(70));
  console.log('   COMPLETE PREFECTURE SLOT CHECK - TWO-LAYER CAPTCHA TEST');
  console.log('   Prefecture: Créteil (94) | Demarche: 16040');
  console.log('═'.repeat(70) + '\n');

  const browser = await firefox.launch({
    headless: false,      // Headed mode for Cloudflare
    firefoxUserPrefs: {
      'dom.webdriver.enabled': false,
    },
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  });
  // Firefox + Playwright uses its own protocol (NOT CDP) - Cloudflare may not detect it

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ─── STEP 1: Load Page ───
    log('STEP', '1/5 Loading prefecture page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });
    log('INFO', `Page: ${await page.title()}`);

    // ─── STEP 2: Solve Image CAPTCHA ───
    log('STEP', '2/5 Solving image CAPTCHA...');
    
    // Wait for page to fully load
    await sleep(2000);
    
    // Try multiple selectors
    const captchaSelectors = [
      'img[src*="captcha"]',
      'img[src*="jcaptcha"]',
      'img#captchaImage',
      'img[alt*="captcha"]',
      '.captcha img',
      'img[id*="captcha"]',
    ];
    
    let captchaImg = null;
    for (const sel of captchaSelectors) {
      captchaImg = await page.$(sel);
      if (captchaImg) {
        log('INFO', `Found CAPTCHA with selector: ${sel}`);
        break;
      }
    }
    
    if (!captchaImg) {
      // Try finding any image that might be CAPTCHA
      log('WARN', 'Standard selectors failed, searching all images...');
      const allImages = await page.$$('img');
      for (const img of allImages) {
        const src = await img.getAttribute('src');
        if (src && (src.includes('captcha') || src.includes('jcaptcha') || src.includes('simpleCaptcha'))) {
          captchaImg = img;
          log('INFO', `Found CAPTCHA image: ${src.substring(0, 50)}...`);
          break;
        }
      }
    }
    
    if (!captchaImg) {
      log('ERROR', 'No CAPTCHA image found!');
      await page.screenshot({ path: './screenshots/full_no_captcha.png' });
      
      // Check if we're already past CAPTCHA
      const pageText = await page.textContent('body') || '';
      if (pageText.includes('créneau') || pageText.includes('calendar')) {
        log('INFO', 'Page might already be past CAPTCHA stage');
      }
      return;
    }

    const captchaBuffer = await captchaImg.screenshot();
    const base64 = captchaBuffer.toString('base64');
    
    const captchaAnswer = await solveImageCaptcha(base64);
    if (!captchaAnswer) {
      log('ERROR', 'Failed to solve image CAPTCHA');
      return;
    }

    // The form has two CAPTCHA fields:
    // - captchaId (hidden) = challenge identifier (don't touch)
    // - captchaUsercode / captchaFormulaireExtInput (text) = where user types the answer
    
    // Try the specific answer field first
    const answerInput = await page.$('#captchaFormulaireExtInput, input[name="captchaUsercode"]');
    if (answerInput) {
      const isVisible = await answerInput.isVisible().catch(() => false);
      if (isVisible) {
        await answerInput.fill(captchaAnswer);
        log('SUCCESS', `Filled captchaUsercode directly: "${captchaAnswer}"`);
      } else {
        // Force visible and fill
        await page.evaluate((answer) => {
          const el = document.querySelector('#captchaFormulaireExtInput, input[name="captchaUsercode"]') as HTMLInputElement;
          if (el) {
            el.style.display = 'block';
            el.style.visibility = 'visible';
            el.value = answer;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, captchaAnswer);
        log('SUCCESS', `Filled captchaUsercode via JS: "${captchaAnswer}"`);
      }
    } else {
      // Fallback: fill any visible text input in the form
      log('WARN', 'captchaUsercode not found, trying generic fill...');
      await page.evaluate((answer) => {
        const form = document.querySelector('form');
        if (!form) return;
        const textInputs = form.querySelectorAll('input[type="text"]');
        for (const inp of textInputs) {
          const el = inp as HTMLInputElement;
          if (!el.value) {
            el.value = answer;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            break;
          }
        }
      }, captchaAnswer);
    }
    
    // Verify
    const verifyValue = await page.evaluate(() => {
      const el = document.querySelector('#captchaFormulaireExtInput, input[name="captchaUsercode"]') as HTMLInputElement;
      return el ? { name: el.name, value: el.value } : null;
    });
    if (verifyValue?.value) {
      log('SUCCESS', `Verified: ${verifyValue.name} = "${verifyValue.value}"`);
    } else {
      log('ERROR', 'captchaUsercode still empty after fill!');
    }
    
    log('SUCCESS', `Entered CAPTCHA answer: ${captchaAnswer}`);

    // ─── STEP 2.5: Dump form structure and accept CGU ───
    log('STEP', '2.5/5 Analyzing form and accepting CGU...');
    
    const formInfo = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { error: 'No form found' };
      
      const inputs: Array<{ tag: string; type: string; name: string; id: string; value: string; checked?: boolean; visible: boolean }> = [];
      const elements = form.querySelectorAll('input, select, textarea, button');
      for (const el of elements) {
        const htmlEl = el as HTMLInputElement;
        inputs.push({
          tag: el.tagName.toLowerCase(),
          type: htmlEl.type || '',
          name: htmlEl.name || '',
          id: htmlEl.id || '',
          value: htmlEl.value?.substring(0, 50) || '',
          checked: htmlEl.type === 'checkbox' ? htmlEl.checked : undefined,
          visible: htmlEl.offsetParent !== null,
        });
      }
      return { action: form.action, method: form.method, inputs };
    });
    log('INFO', `Form structure: ${JSON.stringify(formInfo, null, 2)}`);
    
    // Accept CGU checkbox if present
    const cguChecked = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      let checked = false;
      for (const cb of checkboxes) {
        const el = cb as HTMLInputElement;
        if (!el.checked) {
          el.checked = true;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('click', { bubbles: true }));
          checked = true;
        } else {
          checked = true;
        }
      }
      return checked;
    });
    log('INFO', `CGU checkbox: ${cguChecked ? 'CHECKED' : 'NOT FOUND'}`);
    
    // Take screenshot before submit
    await page.screenshot({ path: './screenshots/full_02b_before_submit.png' });

    // ─── STEP 3: Submit Form ───
    log('STEP', '3/5 Submitting form...');
    
    // Force-enable and click submit via JS (button may be disabled until form is "valid")
    const submitted = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
      for (const btn of buttons) {
        (btn as HTMLButtonElement).disabled = false;
        (btn as HTMLButtonElement).click();
        return true;
      }
      // Try form.submit() as fallback
      const form = document.querySelector('form');
      if (form) {
        form.submit();
        return true;
      }
      return false;
    });
    
    if (submitted) {
      log('INFO', 'Form submitted via JS');
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await sleep(2000);
    } else {
      log('ERROR', 'Could not find submit button or form');
    }

    log('INFO', `After submit: ${page.url()}`);
    await page.screenshot({ path: './screenshots/full_03_after_submit.png' });

    // ─── STEP 4: Handle Turnstile ───
    log('STEP', '4/5 Checking for Turnstile...');
    
    const pageTitle = await page.title();
    const pageContent = await page.content();
    
    // Check for Turnstile indicators
    const hasTurnstile = pageTitle.includes('instant') || 
                         pageContent.includes('challenges.cloudflare.com') ||
                         pageContent.includes('cf-turnstile') ||
                         pageContent.includes('challenge-platform') ||
                         pageContent.includes('Vérifiez que vous êtes humain');

    if (hasTurnstile) {
      log('TURNSTILE', 'Cloudflare managed challenge page detected!');
      const challengeUrl = page.url();
      
      // Wait 5s for challenge page to fully initialize
      log('TURNSTILE', 'Waiting 5s for challenge to initialize...');
      await sleep(5000);
      
      // ═══ APPROACH 1: Click Turnstile iframe, then wait for redirect ═══
      log('TURNSTILE', 'Clicking Turnstile widget...');
      
      // Simulate realistic mouse movement
      await page.mouse.move(300, 200);
      await sleep(200);
      await page.mouse.move(500, 350);
      await sleep(300);
      
      const frames = page.frames();
      let clicked = false;
      for (const frame of frames) {
        const frameUrl = frame.url();
        if (frameUrl.includes('challenges.cloudflare.com')) {
          log('INFO', `Found Turnstile frame`);
          try {
            const body = await frame.$('body');
            if (body) {
              const box = await body.boundingBox();
              if (box) {
                // Click slightly off-center to look more human
                await page.mouse.click(box.x + box.width * 0.35, box.y + box.height * 0.5);
                clicked = true;
                log('INFO', 'Clicked Turnstile widget');
              }
            }
          } catch (e) {
            log('WARN', `Click failed: ${e}`);
          }
        }
      }
      
      if (!clicked) {
        log('WARN', 'Could not click Turnstile frame');
      }
      
      // Wait for page to navigate away from challenge
      let challengeResolved = false;
      log('TURNSTILE', 'Waiting up to 30s for challenge to resolve...');
      
      for (let wait = 0; wait < 30; wait++) {
        await sleep(1000);
        try {
          const currentUrl = page.url();
          const currentTitle = await page.title();
          
          // Check if we left the challenge page
          if (currentUrl !== challengeUrl) {
            log('SUCCESS', `Page navigated to: ${currentUrl}`);
            challengeResolved = true;
            break;
          }
          if (!currentTitle.includes('instant') && !currentTitle.includes('moment') && !currentTitle.includes('Un instant')) {
            log('SUCCESS', `Title changed to: ${currentTitle}`);
            challengeResolved = true;
            break;
          }
          
          if (wait % 5 === 4) log('INFO', `Waiting... (${wait + 1}s) URL: ${currentUrl.substring(currentUrl.length - 30)}`);
        } catch (e) {
          const errMsg = String(e);
          if (errMsg.includes('Target closed') || errMsg.includes('Session closed')) {
            log('ERROR', 'Browser closed during challenge');
            break;
          }
          // Context destroyed from iframe reload - not main page navigation, keep waiting
          log('INFO', `Frame context change at ${wait + 1}s (iframe reload, continuing...)`);
        }
      }
      
      if (!challengeResolved) {
        // ═══ APPROACH 2: Try clicking again after challenge processes ═══
        log('TURNSTILE', 'First click may have started processing. Trying second click...');
        
        const frames2 = page.frames();
        for (const frame of frames2) {
          const frameUrl = frame.url();
          if (frameUrl.includes('challenges.cloudflare.com')) {
            try {
              const body = await frame.$('body');
              if (body) {
                const box = await body.boundingBox();
                if (box) {
                  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.45);
                  log('INFO', 'Second click on Turnstile');
                }
              }
            } catch { /* ignore */ }
          }
        }
        
        // Wait 15 more seconds
        for (let wait = 0; wait < 15; wait++) {
          await sleep(1000);
          try {
            const currentUrl = page.url();
            if (currentUrl !== challengeUrl) {
              log('SUCCESS', `Page navigated to: ${currentUrl}`);
              challengeResolved = true;
              break;
            }
            const currentTitle = await page.title();
            if (!currentTitle.includes('instant') && !currentTitle.includes('moment') && !currentTitle.includes('Un instant')) {
              log('SUCCESS', `Title changed to: ${currentTitle}`);
              challengeResolved = true;
              break;
            }
          } catch {
            log('INFO', `Frame context change (continuing...)`);
          }
        }
      }

      // Wait for final page load
      if (challengeResolved) {
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      }

      await page.screenshot({ path: './screenshots/full_04_after_turnstile.png' });
      
      try {
        log('INFO', `After Turnstile: URL=${page.url()}`);
        log('INFO', `After Turnstile: Title=${await page.title()}`);
      } catch { /* page may still be navigating */ }
      
      log('INFO', `Challenge resolved: ${challengeResolved}`);
    } else {
      log('INFO', 'No Turnstile challenge detected - page loaded cleanly');
    }

    // ─── STEP 5: Check for Slots ───
    log('STEP', '5/5 Checking for available slots...');
    
    const finalUrl = page.url();
    const finalTitle = await page.title();
    const finalText = await page.textContent('body') || '';
    
    await page.screenshot({ path: './screenshots/full_05_final.png', fullPage: true });
    
    // Analyze results
    console.log('\n' + '─'.repeat(70));
    console.log('   RESULTS');
    console.log('─'.repeat(70));
    console.log(`   Final URL: ${finalUrl}`);
    console.log(`   Title: ${finalTitle}`);
    
    if (finalText.includes('aucun créneau') || finalText.includes('pas de créneau')) {
      console.log('   Status: ❌ NO SLOTS AVAILABLE');
    } else if (finalText.includes('créneau') && finalText.includes('disponible')) {
      console.log('   Status: ✅ SLOTS AVAILABLE!');
    } else if (finalTitle.includes('instant') || finalText.includes('Cloudflare')) {
      console.log('   Status: ⏳ Still blocked by Turnstile');
    } else {
      console.log('   Status: ❓ Unknown - check screenshots');
    }
    
    console.log('─'.repeat(70) + '\n');

  } catch (error) {
    log('ERROR', `Test failed: ${error}`);
    await page.screenshot({ path: './screenshots/full_error.png' }).catch(() => {});
  } finally {
    await context.close();
    await browser.close();
  }
}

testFullFlow().catch(console.error);
