/**
 * Test script for the Hybrid CAPTCHA Solver
 * 
 * Run: npx tsx src/scripts/testCaptchaSolver.ts
 */

import { hybridCaptchaSolver, SimpleCaptchaType } from '../scraper/hybrid-captcha.service.js';
import * as fs from 'fs';
import * as path from 'path';

// Sample CAPTCHA test cases
const testCases = [
  {
    name: 'Numeric CAPTCHA (Indian Embassy style)',
    type: 'numeric' as SimpleCaptchaType,
    // Create a simple test image or load from file
    imageUrl: 'https://via.placeholder.com/150x50/FFFFFF/000000?text=51613',
  },
  {
    name: 'Alphanumeric CAPTCHA (RDV-Prefecture style)',
    type: 'alphanumeric_upper' as SimpleCaptchaType,
    imageUrl: 'https://via.placeholder.com/150x50/FFFFFF/000000?text=4BT96',
  },
];

async function fetchImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         HYBRID CAPTCHA SOLVER - TEST SUITE                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Type: ${testCase.type}`);
    console.log(`   URL: ${testCase.imageUrl}`);

    try {
      const imageBuffer = await fetchImage(testCase.imageUrl);
      console.log(`   Image size: ${imageBuffer.length} bytes`);

      // Test FREE solver (Tesseract only)
      console.log('\n   🔓 Testing FREE solver (Tesseract)...');
      const freeResult = await hybridCaptchaSolver.solveFree(imageBuffer, testCase.type);
      
      if (freeResult) {
        console.log(`   ✅ FREE Result: "${freeResult.text}"`);
        console.log(`      Confidence: ${Math.round(freeResult.confidence * 100)}%`);
        console.log(`      Time: ${freeResult.timeMs}ms`);
        console.log(`      Cost: $${freeResult.cost}`);
      } else {
        console.log('   ❌ FREE solver failed');
      }

      // Test HYBRID solver (Tesseract + 2Captcha fallback)
      console.log('\n   🔀 Testing HYBRID solver...');
      const hybridResult = await hybridCaptchaSolver.solve(imageBuffer, testCase.type);
      
      if (hybridResult) {
        console.log(`   ✅ HYBRID Result: "${hybridResult.text}"`);
        console.log(`      Method: ${hybridResult.method}`);
        console.log(`      Confidence: ${Math.round(hybridResult.confidence * 100)}%`);
        console.log(`      Time: ${hybridResult.timeMs}ms`);
        console.log(`      Cost: $${hybridResult.cost}`);
      } else {
        console.log('   ❌ HYBRID solver failed');
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    console.log('\n   ' + '─'.repeat(55));
  }

  // Print final stats
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL STATISTICS                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const stats = hybridCaptchaSolver.getStats();
  const rates = hybridCaptchaSolver.getSuccessRates();

  console.log(`   Total Attempts: ${stats.totalAttempts}`);
  console.log(`   Tesseract Success: ${stats.tesseractSuccess}`);
  console.log(`   Tesseract Failed: ${stats.tesseractFailed}`);
  console.log(`   2Captcha Success: ${stats.twoCaptchaSuccess}`);
  console.log(`   2Captcha Failed: ${stats.twoCaptchaFailed}`);
  console.log(`   Total Cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`   Avg Confidence: ${Math.round(stats.averageConfidence * 100)}%`);
  console.log('');
  console.log(`   FREE Success Rate: ${Math.round(rates.free * 100)}%`);
  console.log(`   PAID Success Rate: ${Math.round(rates.paid * 100)}%`);
  console.log(`   Overall Success Rate: ${Math.round(rates.overall * 100)}%`);

  // Cleanup
  await hybridCaptchaSolver.terminate();
  console.log('\n✅ Test complete, worker terminated.');
}

// Run tests
runTests().catch(console.error);
