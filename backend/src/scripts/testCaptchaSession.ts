/**
 * Test CAPTCHA session behavior
 * Verify: does CAPTCHA appear only once per session?
 */
import { chromium } from 'playwright';

async function main() {
  console.log('\n=== CAPTCHA SESSION BEHAVIOR TEST ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale: 'fr-FR',
  });

  const page = await context.newPage();
  const url = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/';

  // VISIT 1: First load
  console.log('--- VISIT 1: First load ---');
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  let hasCaptcha = await page.evaluate(() => {
    return !!document.querySelector('img[src^="data:image"]');
  });
  console.log(`  CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);

  // Check cookies after first visit
  let cookies = await context.cookies();
  console.log(`  Cookies: ${cookies.length}`);
  for (const c of cookies) {
    console.log(`    ${c.name} = ${c.value.substring(0, 30)}... (domain: ${c.domain})`);
  }

  // VISIT 2: Refresh same page (same session)
  console.log('\n--- VISIT 2: Page refresh (same session) ---');
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  
  hasCaptcha = await page.evaluate(() => {
    return !!document.querySelector('img[src^="data:image"]');
  });
  console.log(`  CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);

  cookies = await context.cookies();
  console.log(`  Cookies: ${cookies.length}`);

  // VISIT 3: Navigate away and come back (same session)
  console.log('\n--- VISIT 3: Navigate away and return (same session) ---');
  await page.goto('https://www.rdv-prefecture.interieur.gouv.fr/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  hasCaptcha = await page.evaluate(() => {
    return !!document.querySelector('img[src^="data:image"]');
  });
  console.log(`  CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);

  // VISIT 4: New page but SAME context (cookies shared)
  console.log('\n--- VISIT 4: New page, same context (shared cookies) ---');
  const page2 = await context.newPage();
  await page2.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  hasCaptcha = await page2.evaluate(() => {
    return !!document.querySelector('img[src^="data:image"]');
  });
  console.log(`  CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);
  await page2.close();

  // Save session cookies for later reuse
  const savedCookies = await context.cookies();
  console.log('\n--- Saved session cookies ---');
  for (const c of savedCookies) {
    console.log(`  ${c.name}: expires=${c.expires > 0 ? new Date(c.expires * 1000).toISOString() : 'session'}, httpOnly=${c.httpOnly}`);
  }

  // VISIT 5: NEW context (fresh, no cookies) - should show CAPTCHA again
  console.log('\n--- VISIT 5: Fresh context (no cookies) ---');
  const freshContext = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale: 'fr-FR',
  });
  const page3 = await freshContext.newPage();
  await page3.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  hasCaptcha = await page3.evaluate(() => {
    return !!document.querySelector('img[src^="data:image"]');
  });
  console.log(`  CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);

  // VISIT 6: Fresh context but WITH saved cookies injected
  console.log('\n--- VISIT 6: Fresh context WITH saved cookies ---');
  const restoredContext = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale: 'fr-FR',
  });
  await restoredContext.addCookies(savedCookies);
  const page4 = await restoredContext.newPage();
  await page4.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  hasCaptcha = await page4.evaluate(() => {
    return !!document.querySelector('img[src^="data:image"]');
  });
  console.log(`  CAPTCHA present: ${hasCaptcha ? 'YES' : 'NO'}`);

  // Summary
  console.log('\n=== CONCLUSION ===');
  console.log('If CAPTCHA only appears on Visit 1 & 5 (fresh sessions):');
  console.log('  -> Session cookies bypass CAPTCHA');
  console.log('  -> We only solve ONCE per session');
  console.log('  -> Reuse cookies = nearly FREE CAPTCHA handling');

  await page.close();
  await page3.close();
  await page4.close();
  await browser.close();
  console.log('\nDone.');
}

main();
