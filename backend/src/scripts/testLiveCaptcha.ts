/**
 * End-to-end LIVE CAPTCHA test using Playwright (real browser)
 * Sites block plain HTTP - need real browser to bypass 403
 */
import { chromium } from 'playwright';
import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';

const PREFECTURE_URLS = [
  { name: 'Créteil (94)', url: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/' },
  { name: 'Nanterre (92)', url: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1040/cgu/' },
  { name: 'Versailles (78)', url: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1922/cgu/' },
];

async function main() {
  console.log('\n==========================================');
  console.log('  LIVE CAPTCHA TEST (Playwright + Tesseract)');
  console.log('==========================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  });

  const solver = new HybridCaptchaSolver();
  let tested = 0;
  let solved = 0;

  for (const pref of PREFECTURE_URLS) {
    console.log(`--- ${pref.name} ---`);
    const page = await context.newPage();

    try {
      // Navigate with real browser
      const t0 = Date.now();
      await page.goto(pref.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`  Page loaded: ${Date.now() - t0}ms`);

      // Extract CAPTCHA image via page evaluation
      const captchaData = await page.evaluate(() => {
        const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
        if (!img) return null;

        // Redraw on canvas to get clean PNG
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);

        return {
          base64: canvas.toDataURL('image/png').split(',')[1],
          width: canvas.width,
          height: canvas.height,
        };
      });

      if (!captchaData) {
        console.log('  No CAPTCHA found on page');
        await page.close();
        continue;
      }

      console.log(`  CAPTCHA: ${captchaData.width}x${captchaData.height}px, ${captchaData.base64.length} chars`);

      // Decode and solve
      const imageBuffer = Buffer.from(captchaData.base64, 'base64');
      tested++;

      const t1 = Date.now();
      const result = await solver.solveFree(imageBuffer, 'alphanumeric_upper');
      const solveTime = Date.now() - t1;

      if (result && result.text) {
        solved++;
        console.log(`  SOLVED: "${result.text}" (${(result.confidence * 100).toFixed(0)}% conf, ${solveTime}ms)`);
      } else {
        console.log(`  FAILED to solve (${solveTime}ms)`);
      }

    } catch (err: any) {
      console.log(`  ERROR: ${err.message.split('\n')[0]}`);
    }
    await page.close();
    console.log();
  }

  // Summary
  console.log('==========================================');
  console.log('  RESULTS');
  console.log('==========================================');
  console.log(`  Tested:  ${tested} live CAPTCHAs`);
  console.log(`  Solved:  ${solved}/${tested}`);

  const stats = solver.getStats();
  if (stats.totalAttempts > 0) {
    console.log(`  Avg Conf: ${(stats.averageConfidence * 100).toFixed(1)}%`);
    console.log(`  FREE rate: ${(solver.getSuccessRates().free * 100).toFixed(0)}%`);
  }

  await solver.terminate();
  await browser.close();
  console.log('\nDone.');
}

main();
