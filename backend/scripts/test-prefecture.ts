#!/usr/bin/env npx tsx
/**
 * Standalone Prefecture Scraper Test
 * Run with: npx tsx scripts/test-prefecture.ts [prefecture_id]
 * Example: npx tsx scripts/test-prefecture.ts lyon_69
 */

import { getPrefectureConfig, ALL_PREFECTURES } from '../src/scraper/prefectures/index.js';
import { scrapePrefecture } from '../src/scraper/base.scraper.js';
import { shutdownBrowserPool } from '../src/scraper/browser.pool.js';

async function main() {
  const prefectureId = process.argv[2];

  if (!prefectureId) {
    console.log('\nAvailable prefectures:');
    console.log('─'.repeat(60));
    const configs = ALL_PREFECTURES;
    
    // Group by tier
    const tier1 = configs.filter(c => c.tier === 1);
    const tier2 = configs.filter(c => c.tier === 2);
    const tier3 = configs.filter(c => c.tier === 3);
    
    console.log('\n📍 Tier 1 (High Priority):');
    tier1.forEach(c => console.log(`  - ${c.id.padEnd(20)} ${c.name} (${c.department})`));
    
    console.log('\n📍 Tier 2 (Medium Priority):');
    tier2.forEach(c => console.log(`  - ${c.id.padEnd(20)} ${c.name} (${c.department})`));
    
    if (tier3.length > 0) {
      console.log('\n📍 Tier 3 (Low Priority):');
      tier3.forEach(c => console.log(`  - ${c.id.padEnd(20)} ${c.name} (${c.department})`));
    }
    
    console.log('\n─'.repeat(60));
    console.log('Usage: npx tsx scripts/test-prefecture.ts <prefecture_id>');
    console.log('Example: npx tsx scripts/test-prefecture.ts lyon_69\n');
    process.exit(0);
  }

  const config = getPrefectureConfig(prefectureId);
  
  if (!config) {
    console.error(`\n❌ Prefecture not found: ${prefectureId}`);
    console.log('Run without arguments to see available prefectures.\n');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`🏛️  Testing Prefecture: ${config.name}`);
  console.log('═'.repeat(60));
  console.log(`ID:          ${config.id}`);
  console.log(`Department:  ${config.department}`);
  console.log(`Region:      ${config.region}`);
  console.log(`Tier:        ${config.tier}`);
  console.log(`System:      ${config.bookingSystem}`);
  console.log(`URL:         ${config.bookingUrl}`);
  console.log(`Procedures:  ${config.procedures.join(', ')}`);
  console.log('─'.repeat(60));
  console.log('Selectors:');
  console.log(`  Slot:      ${config.selectors.availableSlot.substring(0, 50)}...`);
  console.log(`  No Slot:   ${config.selectors.noSlotIndicator?.substring(0, 50) || 'N/A'}...`);
  console.log('─'.repeat(60));
  
  console.log('\n⏳ Starting scraper test...\n');
  const startTime = Date.now();

  try {
    const result = await scrapePrefecture(config);
    const duration = Date.now() - startTime;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 SCRAPER RESULT');
    console.log('═'.repeat(60));
    console.log(`Status:          ${getStatusEmoji(result.status)} ${result.status.toUpperCase()}`);
    console.log(`Slots Available: ${result.slotsAvailable}`);
    console.log(`Response Time:   ${result.responseTimeMs}ms`);
    console.log(`Total Duration:  ${duration}ms`);
    
    if (result.slotDate) {
      console.log(`Slot Date:       ${result.slotDate}`);
    }
    if (result.slotTime) {
      console.log(`Slot Time:       ${result.slotTime}`);
    }
    if (result.errorMessage) {
      console.log(`Error:           ${result.errorMessage}`);
    }
    if (result.screenshotPath) {
      console.log(`Screenshot:      ${result.screenshotPath}`);
    }
    console.log(`Booking URL:     ${result.bookingUrl}`);
    console.log('═'.repeat(60) + '\n');

    // Summary
    if (result.status === 'slots_found') {
      console.log('✅ SUCCESS: Slots detected! The scraper is working correctly.\n');
    } else if (result.status === 'no_slots') {
      console.log('✅ SUCCESS: No slots available (scraper working, just no appointments).\n');
    } else if (result.status === 'captcha') {
      console.log('⚠️  CAPTCHA: Page requires CAPTCHA solving. Configure CAPTCHA provider.\n');
    } else if (result.status === 'blocked') {
      console.log('❌ BLOCKED: Prefecture site blocked the request. Try with proxy.\n');
    } else if (result.status === 'timeout') {
      console.log('⏰ TIMEOUT: Page took too long to load.\n');
    } else {
      console.log('❌ ERROR: Scraper encountered an error.\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    console.log('🧹 Cleaning up browser pool...');
    await shutdownBrowserPool();
    console.log('✅ Done.\n');
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'slots_found': return '🟢';
    case 'no_slots': return '🟡';
    case 'captcha': return '🔐';
    case 'blocked': return '🚫';
    case 'timeout': return '⏰';
    case 'error': return '❌';
    default: return '❓';
  }
}

main().catch(console.error);
