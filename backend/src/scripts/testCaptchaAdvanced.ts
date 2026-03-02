/**
 * Advanced CAPTCHA preprocessing - isolate white text from colored background
 */
import { chromium } from 'playwright';
import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';
import sharp from 'sharp';
import * as fs from 'fs';

async function main() {
  console.log('\n=== ADVANCED CAPTCHA PREPROCESSING ===\n');

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    locale: 'fr-FR',
  })).newPage();

  const solver = new HybridCaptchaSolver();

  try {
    await page.goto('https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/', {
      waitUntil: 'networkidle', timeout: 30000,
    });

    // Get canvas version
    const b64 = await page.evaluate(() => {
      const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
      if (!img) return null;
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    });

    if (!b64) { console.log('No CAPTCHA!'); return; }
    const img = Buffer.from(b64, 'base64');
    console.log(`Original: ${img.length} bytes`);

    // APPROACH 1: Extract individual RGB channels, find which has best text isolation
    const { data, info } = await sharp(img).raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    console.log(`Image: ${width}x${height}, ${channels} channels`);

    // For each pixel, calculate brightness
    // White text = high brightness, colored background = medium, black lines = low
    const brightnessMap = Buffer.alloc(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * channels];
      const g = data[i * channels + 1];
      const b = data[i * channels + 2];
      // Luminance formula
      brightnessMap[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }

    // Strategy A: High threshold to isolate ONLY white text
    for (const thresh of [180, 190, 200, 210, 220]) {
      const binaryBuf = Buffer.alloc(width * height);
      for (let i = 0; i < width * height; i++) {
        binaryBuf[i] = brightnessMap[i] > thresh ? 255 : 0;
      }

      const processed = await sharp(binaryBuf, { raw: { width, height, channels: 1 } })
        .resize({ width: width * 3, height: height * 3, kernel: 'lanczos3' })
        .png()
        .toBuffer();

      const fname = `debug_bright_${thresh}.png`;
      fs.writeFileSync(fname, processed);

      const result = await solver.solveFree(processed, 'alphanumeric_upper');
      console.log(`  Brightness>${thresh}: "${result?.text || 'FAIL'}" (${result ? (result.confidence*100).toFixed(0) : 0}%) -> ${fname}`);
    }

    // Strategy B: Extract saturation - white text has LOW saturation, colored bg has HIGH
    console.log('\n--- Saturation-based isolation ---');
    const satBuf = Buffer.alloc(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * channels];
      const g = data[i * channels + 1];
      const b = data[i * channels + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Saturation (0-255 scale)
      const sat = max === 0 ? 0 : Math.round(((max - min) / max) * 255);
      // White text = low sat AND high brightness
      const brightness = brightnessMap[i];
      // Text is white (low sat + high bright) OR very dark (noise lines)
      // We want: LOW saturation + HIGH brightness = text
      satBuf[i] = (sat < 80 && brightness > 150) ? 255 : 0;
    }

    const satProcessed = await sharp(satBuf, { raw: { width, height, channels: 1 } })
      .resize({ width: width * 3, height: height * 3, kernel: 'lanczos3' })
      .png()
      .toBuffer();
    fs.writeFileSync('debug_sat_filter.png', satProcessed);

    const satResult = await solver.solveFree(satProcessed, 'alphanumeric_upper');
    console.log(`  Sat<80 + Bright>150: "${satResult?.text || 'FAIL'}" (${satResult ? (satResult.confidence*100).toFixed(0) : 0}%)`);

    // Strategy C: Combined - low saturation + high brightness, then clean up
    console.log('\n--- Combined filter with cleanup ---');
    for (const [satThresh, brightThresh] of [[60, 170], [80, 160], [100, 140], [50, 180]]) {
      const combinedBuf = Buffer.alloc(width * height);
      for (let i = 0; i < width * height; i++) {
        const r = data[i * channels];
        const g = data[i * channels + 1];
        const b = data[i * channels + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : ((max - min) / max) * 255;
        const bright = brightnessMap[i];
        combinedBuf[i] = (sat < satThresh && bright > brightThresh) ? 255 : 0;
      }

      const combinedProcessed = await sharp(combinedBuf, { raw: { width, height, channels: 1 } })
        .resize({ width: width * 3, height: height * 3, kernel: 'lanczos3' })
        .median(3) // Remove noise
        .png()
        .toBuffer();

      const fname = `debug_combined_s${satThresh}_b${brightThresh}.png`;
      fs.writeFileSync(fname, combinedProcessed);

      const combinedResult = await solver.solveFree(combinedProcessed, 'alphanumeric_upper');
      console.log(`  Sat<${satThresh} + Bright>${brightThresh}: "${combinedResult?.text || 'FAIL'}" (${combinedResult ? (combinedResult.confidence*100).toFixed(0) : 0}%)`);
    }

    console.log('\nAll debug images saved.');

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
