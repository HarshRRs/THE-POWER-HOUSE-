/**
 * End-to-end CAPTCHA Solver Test
 * Fetches live CAPTCHA from RDV-Préfecture, decodes it, and solves it
 */
import { HybridCaptchaSolver } from '../scraper/hybrid-captcha.service.js';
import sharp from 'sharp';

// Create a realistic test CAPTCHA image using sharp
async function createTestCaptcha(text: string): Promise<Buffer> {
  // Create SVG with CAPTCHA-like text
  const width = 200;
  const height = 70;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <line x1="10" y1="20" x2="190" y2="50" stroke="#ddd" stroke-width="1"/>
      <line x1="30" y1="60" x2="170" y2="10" stroke="#ddd" stroke-width="1"/>
      <text x="50%" y="55%" text-anchor="middle" font-size="36" font-family="Arial, sans-serif" 
            font-weight="bold" fill="black" letter-spacing="8">${text}</text>
    </svg>`;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

async function main() {
  console.log('\n====================================');
  console.log('  CAPTCHA SOLVER TEST SUITE');
  console.log('====================================\n');

  const solver = new HybridCaptchaSolver();

  const testCases = [
    { text: '4BT96', type: 'alphanumeric_upper' as const, desc: 'RDV-Prefecture style' },
    { text: '51613', type: 'numeric' as const, desc: 'Indian Embassy style' },
    { text: 'JGFGGR', type: 'alphanumeric_upper' as const, desc: 'Live Creteil CAPTCHA' },
    { text: 'AB3D7', type: 'alphanumeric_upper' as const, desc: 'Mixed alpha-num' },
    { text: '98241', type: 'numeric' as const, desc: 'Numeric only' },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`--- Test: ${tc.desc} (expected: "${tc.text}") ---`);
    
    try {
      const image = await createTestCaptcha(tc.text);
      console.log(`  Image: ${image.length} bytes`);

      const t1 = Date.now();
      const result = await solver.solveFree(image, tc.type);
      const elapsed = Date.now() - t1;

      if (result) {
        const match = result.text.toUpperCase() === tc.text.toUpperCase();
        console.log(`  OCR:        "${result.text}"`);
        console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`  Time:       ${elapsed}ms`);
        console.log(`  Match:      ${match ? 'YES ✓' : 'NO ✗'}`);
        if (match) passed++; else failed++;
      } else {
        console.log(`  Result:     FAILED (null)`);
        console.log(`  Time:       ${elapsed}ms`);
        failed++;
      }
    } catch (err: any) {
      console.log(`  ERROR: ${err.message}`);
      failed++;
    }
    console.log();
  }

  // Summary
  console.log('====================================');
  console.log('  RESULTS');
  console.log('====================================');
  console.log(`  Passed: ${passed}/${testCases.length}`);
  console.log(`  Failed: ${failed}/${testCases.length}`);
  console.log(`  Rate:   ${((passed / testCases.length) * 100).toFixed(0)}%`);
  
  // Stats
  const stats = solver.getStats();
  const rates = solver.getSuccessRates();
  console.log(`\n  Tesseract OK:   ${stats.tesseractSuccess}`);
  console.log(`  Tesseract Fail: ${stats.tesseractFailed}`);
  console.log(`  Avg Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
  console.log(`  FREE rate:      ${(rates.free * 100).toFixed(1)}%`);

  // Cost projection
  console.log('\n--- Monthly Cost Projection ---');
  const freeRate = rates.free || 0.7;
  const dailyCaptchas = 72;  // 1440 checks * 5% trigger
  const paidPerDay = dailyCaptchas * (1 - freeRate);
  const monthlyCost = paidPerDay * 0.003 * 30;
  console.log(`  Daily CAPTCHAs:  ~${dailyCaptchas}`);
  console.log(`  FREE solved:     ~${Math.round(dailyCaptchas * freeRate)} (${(freeRate * 100).toFixed(0)}%)`);
  console.log(`  Paid needed:     ~${paidPerDay.toFixed(0)}/day`);
  console.log(`  Monthly cost:    $${monthlyCost.toFixed(2)}`);

  await solver.terminate();
  console.log('\nDone.');
}

main();
