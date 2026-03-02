/**
 * Simple CAPTCHA Solver Test with actual live image
 */

import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';
import * as fs from 'fs';
import * as path from 'path';

// Fresh live CAPTCHA from RDV-Préfecture Créteil
const CAPTCHA_BASE64 = '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';

async function main() {
  console.log('\n=== LIVE CAPTCHA SOLVER TEST ===\n');

  // Save base64 to temp file first
  const tempPath = path.join(process.cwd(), 'temp_captcha.png');
  const imageBuffer = Buffer.from(CAPTCHA_BASE64, 'base64');
  fs.writeFileSync(tempPath, imageBuffer);
  console.log(`Saved CAPTCHA to: ${tempPath}`);
  console.log(`Image size: ${imageBuffer.length} bytes`);

  const solver = new HybridCaptchaSolver();

  try {
    // Read image back from file (to ensure it's valid)
    const imageFromFile = fs.readFileSync(tempPath);
    console.log(`Read back: ${imageFromFile.length} bytes`);

    console.log('\n--- Testing FREE Tesseract OCR ---');
    const startTime = Date.now();
    
    const result = await solver.solveFree(imageFromFile, 'alphanumeric_upper');
    
    const elapsed = Date.now() - startTime;
    console.log(`\nResult: "${result.text}"`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Time: ${elapsed}ms`);
    console.log(`Success: ${result.success ? 'YES' : 'NO'}`);

    // Statistics
    console.log('\n--- Statistics ---');
    const stats = solver.getStats();
    console.log(`Total attempts: ${stats.totalAttempts}`);
    console.log(`Tesseract successes: ${stats.tesseractSuccess}`);
    console.log(`Tesseract failures: ${stats.tesseractFailed}`);

    // Cleanup
    fs.unlinkSync(tempPath);
    console.log('\nTemp file cleaned up.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await solver.terminate();
    console.log('Worker terminated.');
  }
}

main();
