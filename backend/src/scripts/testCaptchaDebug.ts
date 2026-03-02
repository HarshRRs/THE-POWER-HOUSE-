/**
 * Debug live CAPTCHA - save images and try multiple preprocessing strategies
 */
import { chromium } from 'playwright';
import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n=== CAPTCHA DEBUG TEST ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale: 'fr-FR',
  });

  const solver = new HybridCaptchaSolver();
  const page = await context.newPage();

  try {
    // Navigate to Créteil
    console.log('Loading Créteil (94) page...');
    await page.goto('https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/', {
      waitUntil: 'networkidle', timeout: 30000,
    });

    // Take screenshot for visual reference
    await page.screenshot({ path: 'debug_page.png', fullPage: true });
    console.log('Saved: debug_page.png');

    // Get raw CAPTCHA image (NOT canvas-redrawn)
    const rawBase64 = await page.evaluate(() => {
      const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
      if (!img) return null;
      // Return raw src without canvas conversion
      const match = img.src.match(/base64,(.+)$/);
      return match ? match[1] : null;
    });

    // Also get canvas-redrawn version
    const canvasBase64 = await page.evaluate(() => {
      const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
      if (!img) return null;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      return canvas.toDataURL('image/png').split(',')[1];
    });

    if (!rawBase64 && !canvasBase64) {
      console.log('No CAPTCHA found!');
      return;
    }

    // Save both versions
    if (rawBase64) {
      const rawBuf = Buffer.from(rawBase64, 'base64');
      fs.writeFileSync('debug_captcha_raw.png', rawBuf);
      console.log(`Raw CAPTCHA: ${rawBuf.length} bytes -> debug_captcha_raw.png`);
    }

    if (canvasBase64) {
      const canvasBuf = Buffer.from(canvasBase64, 'base64');
      fs.writeFileSync('debug_captcha_canvas.png', canvasBuf);
      console.log(`Canvas CAPTCHA: ${canvasBuf.length} bytes -> debug_captcha_canvas.png`);
    }

    // Try different preprocessing strategies on canvas image
    const testImage = Buffer.from(canvasBase64!, 'base64');
    console.log(`\nTesting ${testImage.length} byte image with different strategies:\n`);

    // Strategy 1: Raw (no preprocessing)
    console.log('Strategy 1: Raw image (no preprocessing)');
    const r1 = await solver.solveFree(testImage, 'alphanumeric_upper');
    console.log(`  -> "${r1?.text || 'FAIL'}" (${r1 ? (r1.confidence*100).toFixed(0) : 0}%)\n`);

    // Strategy 2: Just grayscale + resize up
    console.log('Strategy 2: Grayscale + 3x upscale');
    const img2 = await sharp(testImage)
      .grayscale()
      .resize({ width: 600, height: 210, kernel: 'lanczos3' })
      .png()
      .toBuffer();
    fs.writeFileSync('debug_strategy2.png', img2);
    const r2 = await solver.solveFree(img2, 'alphanumeric_upper');
    console.log(`  -> "${r2?.text || 'FAIL'}" (${r2 ? (r2.confidence*100).toFixed(0) : 0}%)\n`);

    // Strategy 3: Grayscale + threshold 100
    console.log('Strategy 3: Grayscale + threshold(100)');
    const img3 = await sharp(testImage)
      .grayscale()
      .resize({ width: 600, height: 210, kernel: 'lanczos3' })
      .threshold(100)
      .png()
      .toBuffer();
    fs.writeFileSync('debug_strategy3.png', img3);
    const r3 = await solver.solveFree(img3, 'alphanumeric_upper');
    console.log(`  -> "${r3?.text || 'FAIL'}" (${r3 ? (r3.confidence*100).toFixed(0) : 0}%)\n`);

    // Strategy 4: Grayscale + threshold 150
    console.log('Strategy 4: Grayscale + threshold(150)');
    const img4 = await sharp(testImage)
      .grayscale()
      .resize({ width: 600, height: 210, kernel: 'lanczos3' })
      .threshold(150)
      .png()
      .toBuffer();
    fs.writeFileSync('debug_strategy4.png', img4);
    const r4 = await solver.solveFree(img4, 'alphanumeric_upper');
    console.log(`  -> "${r4?.text || 'FAIL'}" (${r4 ? (r4.confidence*100).toFixed(0) : 0}%)\n`);

    // Strategy 5: Grayscale + negate + threshold (invert)
    console.log('Strategy 5: Grayscale + negate + threshold(128)');
    const img5 = await sharp(testImage)
      .grayscale()
      .resize({ width: 600, height: 210, kernel: 'lanczos3' })
      .negate()
      .threshold(128)
      .png()
      .toBuffer();
    fs.writeFileSync('debug_strategy5.png', img5);
    const r5 = await solver.solveFree(img5, 'alphanumeric_upper');
    console.log(`  -> "${r5?.text || 'FAIL'}" (${r5 ? (r5.confidence*100).toFixed(0) : 0}%)\n`);

    // Strategy 6: Normalize + sharpen + threshold
    console.log('Strategy 6: Normalize + sharpen + threshold(128)');
    const img6 = await sharp(testImage)
      .grayscale()
      .resize({ width: 600, height: 210, kernel: 'lanczos3' })
      .normalize()
      .sharpen()
      .threshold(128)
      .png()
      .toBuffer();
    fs.writeFileSync('debug_strategy6.png', img6);
    const r6 = await solver.solveFree(img6, 'alphanumeric_upper');
    console.log(`  -> "${r6?.text || 'FAIL'}" (${r6 ? (r6.confidence*100).toFixed(0) : 0}%)\n`);

    // Strategy 7: Median filter (noise removal) + threshold
    console.log('Strategy 7: Median(3) + grayscale + threshold(128)');
    const img7 = await sharp(testImage)
      .median(3)
      .grayscale()
      .resize({ width: 600, height: 210, kernel: 'lanczos3' })
      .threshold(128)
      .png()
      .toBuffer();
    fs.writeFileSync('debug_strategy7.png', img7);
    const r7 = await solver.solveFree(img7, 'alphanumeric_upper');
    console.log(`  -> "${r7?.text || 'FAIL'}" (${r7 ? (r7.confidence*100).toFixed(0) : 0}%)\n`);

    console.log('All debug images saved. Check them visually!');

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await solver.terminate();
    await page.close();
    await browser.close();
    console.log('Done.');
  }
}

main();
