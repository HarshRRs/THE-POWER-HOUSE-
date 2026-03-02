/**
 * Live test: Solve CAPTCHA with 2Captcha, verify session persistence
 * 
 * Flow:
 * 1. Open page → CAPTCHA appears
 * 2. Extract CAPTCHA image
 * 3. Send to 2Captcha for solving
 * 4. Submit solution on page
 * 5. Check if we proceed to Step 3 (slots)
 * 6. Save cookies
 * 7. Reload with saved cookies → verify no CAPTCHA
 */
import { chromium, BrowserContext } from 'playwright';
import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';

const URL = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/';

async function main() {
  console.log('\n==========================================');
  console.log('  2CAPTCHA LIVE SOLVE + SESSION TEST');
  console.log('==========================================\n');

  const solver = new HybridCaptchaSolver();
  const browser = await chromium.launch({ headless: false }); // visible for debugging
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });

  const page = await context.newPage();

  try {
    // Step 1: Load page
    console.log('1. Loading page...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const hasCaptcha = await page.evaluate(() => !!document.querySelector('img[src^="data:image"]'));
    console.log(`   CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);
    
    if (!hasCaptcha) {
      console.log('   No CAPTCHA! Session may already be valid.');
      return;
    }

    // Step 2: Extract CAPTCHA image
    console.log('\n2. Extracting CAPTCHA image...');
    const captchaB64 = await page.evaluate(() => {
      const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
      if (!img) return null;
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    });

    if (!captchaB64) {
      console.log('   Failed to extract CAPTCHA');
      return;
    }

    const imageBuffer = Buffer.from(captchaB64, 'base64');
    console.log(`   Image: ${imageBuffer.length} bytes`);

    // Step 3: Solve with 2Captcha
    console.log('\n3. Sending to 2Captcha...');
    const t1 = Date.now();
    const result = await solver.solve(imageBuffer, 'alphanumeric', { difficulty: 'hard' });
    const elapsed = Date.now() - t1;

    if (!result || !result.text) {
      console.log(`   FAILED to solve (${elapsed}ms)`);
      console.log('   Check: is TWOCAPTCHA_API_KEY set in environment?');
      console.log(`   API Key present: ${!!process.env.TWOCAPTCHA_API_KEY}`);
      return;
    }

    console.log(`   SOLVED: "${result.text}" (${elapsed}ms, $${result.cost})`);

    // Step 4: Submit solution on page
    console.log('\n4. Submitting solution on page...');
    await page.fill('input[type="text"]', result.text);
    await page.waitForTimeout(500);
    
    // Click "Suivant" button
    await page.click('button:has-text("Suivant")');
    console.log('   Clicked Suivant...');
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    const isStep3 = currentUrl.includes('/creneau') || currentUrl.includes('/usager');
    console.log(`   Proceeded to next step: ${isStep3 ? 'YES' : 'NO'}`);

    // Step 5: Save cookies
    console.log('\n5. Saving session cookies...');
    const cookies = await context.cookies();
    console.log(`   Cookies: ${cookies.length}`);
    for (const c of cookies) {
      console.log(`   - ${c.name} (expires: ${c.expires > 0 ? new Date(c.expires * 1000).toISOString() : 'session'})`);
    }

    // Step 6: Test session persistence
    console.log('\n6. Testing session persistence...');
    console.log('   Reloading page with same session...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const hasCaptchaAfter = await page.evaluate(() => !!document.querySelector('img[src^="data:image"]'));
    console.log(`   CAPTCHA present after reload: ${hasCaptchaAfter ? 'YES (session not persistent)' : 'NO (session works!)'}`);

    // Step 7: Test with new page, same context
    console.log('\n7. New page, same context...');
    const page2 = await context.newPage();
    await page2.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    const hasCaptchaNewPage = await page2.evaluate(() => !!document.querySelector('img[src^="data:image"]'));
    console.log(`   CAPTCHA present: ${hasCaptchaNewPage ? 'YES' : 'NO (cookies bypass!)'}`);
    await page2.close();

    // Summary
    console.log('\n==========================================');
    console.log('  SUMMARY');
    console.log('==========================================');
    console.log(`  2Captcha solve: ${result.text} ($${result.cost})`);
    console.log(`  Session valid after solve: ${!hasCaptchaAfter ? 'YES' : 'NO'}`);
    console.log(`  Strategy: Solve ONCE → reuse session`);

    const stats = solver.getStats();
    console.log(`  Total cost: $${stats.totalCost.toFixed(4)}`);

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await solver.terminate();
    // Keep browser open for 5s to inspect
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    console.log('\nDone.');
  }
}

main();
