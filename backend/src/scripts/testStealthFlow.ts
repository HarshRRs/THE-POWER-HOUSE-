/**
 * Full flow with stealth: playwright-extra + stealth plugin
 * Bypasses Cloudflare Turnstile detection
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';

// Apply stealth plugin
chromium.use(StealthPlugin());

const URL = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/';

async function main() {
  console.log('\n=== STEALTH FLOW: CAPTCHA + CLOUDFLARE BYPASS ===\n');

  const solver = new HybridCaptchaSolver();
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Load page with stealth
    console.log('1. Loading page (stealth mode)...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check if Cloudflare challenge first
    const pageContent = await page.content();
    if (pageContent.includes('Vérification de sécurité') || pageContent.includes('cf-challenge')) {
      console.log('   Cloudflare challenge detected, waiting for auto-resolution...');
      // Wait for Cloudflare to auto-resolve (stealth should handle this)
      await page.waitForNavigation({ timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(3000);
      console.log(`   After CF: ${page.url()}`);
    }

    // Check for CAPTCHA
    const hasCaptcha = await page.evaluate(() => !!document.querySelector('img[src^="data:image"]'));
    console.log(`   CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);
    console.log(`   URL: ${page.url()}`);

    if (!hasCaptcha) {
      console.log('   No CAPTCHA - stealth might have bypassed it!');
      await page.screenshot({ path: 'debug_stealth_nocaptcha.png', fullPage: true });
      return;
    }

    // Step 2: Extract and solve
    console.log('\n2. Extracting CAPTCHA...');
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

    if (!captchaB64) { console.log('   Failed!'); return; }
    const imageBuffer = Buffer.from(captchaB64, 'base64');
    console.log(`   Image: ${imageBuffer.length} bytes`);

    console.log('   Solving with 2Captcha...');
    const result = await solver.solve(imageBuffer, 'alphanumeric', { difficulty: 'hard' });
    if (!result) { console.log('   Solve failed!'); return; }
    console.log(`   Solution: "${result.text}" ($${result.cost}, ${result.timeMs}ms)`);

    // Step 3: Submit solution
    console.log('\n3. Submitting solution...');
    await page.fill('input[type="text"]', result.text);
    await page.waitForTimeout(500);

    // Click and wait for navigation
    console.log('   Clicking Suivant...');
    await Promise.all([
      page.waitForURL('**/*', { timeout: 30000 }).catch(() => null),
      page.click('button:has-text("Suivant")'),
    ]);

    // Wait for Cloudflare to resolve
    console.log('   Waiting for Cloudflare verification...');
    let attempts = 0;
    while (attempts < 10) {
      await page.waitForTimeout(2000);
      const currentContent = await page.content();
      const currentUrl = page.url();
      
      if (currentContent.includes('Vérification de sécurité') || currentContent.includes('cf-challenge')) {
        console.log(`   Still verifying... (attempt ${attempts + 1})`);
        attempts++;
        continue;
      }
      
      console.log(`   Verified! URL: ${currentUrl}`);
      break;
    }

    // Step 4: Check result
    console.log('\n4. Result:');
    const finalUrl = page.url();
    const finalTitle = await page.title();
    console.log(`   URL: ${finalUrl}`);
    console.log(`   Title: ${finalTitle}`);
    
    await page.screenshot({ path: 'debug_stealth_result.png', fullPage: true });
    console.log('   Screenshot: debug_stealth_result.png');

    const finalContent = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim() ?? '';
      const h2 = document.querySelector('h2')?.textContent?.trim() ?? '';
      const hasCap = !!document.querySelector('img[src^="data:image"]');
      const hasCal = !!document.querySelector('[class*="creneau"], [class*="slot"], [class*="calendar"], [class*="planning"]');
      const stepText = document.body.textContent?.match(/Étape\s+\d+\s+sur\s+\d+/)?.[0] ?? '';
      const errorEl = document.querySelector('.fr-alert, .fr-message, [class*="error"], [class*="alert"]');
      return { h1, h2, hasCaptcha: hasCap, hasCalendar: hasCal, step: stepText, error: errorEl?.textContent?.trim() ?? '' };
    });
    
    console.log(`   Step: ${finalContent.step}`);
    console.log(`   H1: ${finalContent.h1}`);
    console.log(`   H2: ${finalContent.h2}`);
    console.log(`   Has CAPTCHA: ${finalContent.hasCaptcha}`);
    console.log(`   Has Calendar: ${finalContent.hasCalendar}`);
    console.log(`   Error: ${finalContent.error || 'none'}`);

    // Step 5: If past CAPTCHA, test persistence
    if (!finalContent.hasCaptcha && !finalUrl.includes('cgu')) {
      console.log('\n5. Testing session persistence...');
      
      // Go back to CGU page
      await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
      const hasCapAfter = await page.evaluate(() => !!document.querySelector('img[src^="data:image"]'));
      console.log(`   CAPTCHA on revisit: ${hasCapAfter ? 'YES (session lost)' : 'NO (session persists!)'}`);
      
      // Save cookies
      const cookies = await context.cookies();
      console.log(`   Cookies: ${cookies.length}`);
      for (const c of cookies) {
        const exp = c.expires > 0 ? new Date(c.expires * 1000).toISOString().split('T')[0] : 'session';
        console.log(`   - ${c.name} (exp: ${exp})`);
      }
    }

  } catch (err: any) {
    console.error('Error:', err.message);
    await page.screenshot({ path: 'debug_stealth_error.png', fullPage: true });
  } finally {
    await solver.terminate();
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    console.log('\nDone.');
  }
}

main();
