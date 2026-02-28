#!/usr/bin/env npx ts-node
/**
 * URL Validation Script for all 101 French Prefectures
 * 
 * Validates all prefecture booking URLs and reports:
 * - Working URLs (HTTP 200)
 * - Redirected URLs (with final destination)
 * - Broken URLs (4xx/5xx errors)
 * - Timeout/unreachable URLs
 * 
 * Usage: npx ts-node scripts/validate-urls.ts
 */

import { ALL_PREFECTURES } from '../src/scraper/prefectures/index.js';

// French booking keywords to detect
const BOOKING_KEYWORDS = [
  'rendez-vous',
  'réservation',
  'titre de séjour',
  'démarche',
  'booking',
  'créneau',
  'disponibilité',
  'planning',
  'calendrier',
  'étrangers',
  'préfecture',
];

interface UrlValidationResult {
  id: string;
  name: string;
  tier: number;
  originalUrl: string;
  finalUrl: string | null;
  status: 'working' | 'redirected' | 'broken' | 'timeout' | 'error';
  httpStatus: number | null;
  hasBookingKeywords: boolean;
  isGouvDomain: boolean;
  redirectChain: string[];
  errorMessage: string | null;
  responseTime: number;
}

async function validateUrl(url: string, timeout = 15000): Promise<{
  finalUrl: string | null;
  httpStatus: number | null;
  redirectChain: string[];
  body: string | null;
  errorMessage: string | null;
  responseTime: number;
}> {
  const startTime = Date.now();
  const redirectChain: string[] = [url];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    });
    
    clearTimeout(timeoutId);
    
    const finalUrl = response.url;
    const body = await response.text();
    
    // Track if URL was redirected
    if (finalUrl !== url) {
      redirectChain.push(finalUrl);
    }
    
    return {
      finalUrl,
      httpStatus: response.status,
      redirectChain,
      body,
      errorMessage: null,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      finalUrl: null,
      httpStatus: null,
      redirectChain,
      body: null,
      errorMessage,
      responseTime: Date.now() - startTime,
    };
  }
}

function hasBookingKeywords(body: string | null): boolean {
  if (!body) return false;
  const lowerBody = body.toLowerCase();
  return BOOKING_KEYWORDS.some(keyword => lowerBody.includes(keyword.toLowerCase()));
}

function isGouvDomain(url: string | null): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.endsWith('.gouv.fr') || urlObj.hostname.endsWith('.interieur.gouv.fr');
  } catch {
    return false;
  }
}

async function validatePrefecture(config: typeof ALL_PREFECTURES[0]): Promise<UrlValidationResult> {
  const result = await validateUrl(config.bookingUrl);
  
  let status: UrlValidationResult['status'];
  
  if (result.errorMessage) {
    if (result.errorMessage.includes('abort') || result.errorMessage.includes('timeout')) {
      status = 'timeout';
    } else {
      status = 'error';
    }
  } else if (result.httpStatus && result.httpStatus >= 200 && result.httpStatus < 300) {
    if (result.finalUrl && result.finalUrl !== config.bookingUrl) {
      status = 'redirected';
    } else {
      status = 'working';
    }
  } else if (result.httpStatus && result.httpStatus >= 300 && result.httpStatus < 400) {
    status = 'redirected';
  } else {
    status = 'broken';
  }
  
  return {
    id: config.id,
    name: config.name,
    tier: config.tier,
    originalUrl: config.bookingUrl,
    finalUrl: result.finalUrl,
    status,
    httpStatus: result.httpStatus,
    hasBookingKeywords: hasBookingKeywords(result.body),
    isGouvDomain: isGouvDomain(result.finalUrl),
    redirectChain: result.redirectChain,
    errorMessage: result.errorMessage,
    responseTime: result.responseTime,
  };
}

function printResult(result: UrlValidationResult, index: number, total: number) {
  const statusEmoji = {
    working: '\x1b[32m[OK]\x1b[0m',
    redirected: '\x1b[33m[REDIRECT]\x1b[0m',
    broken: '\x1b[31m[BROKEN]\x1b[0m',
    timeout: '\x1b[31m[TIMEOUT]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m',
  };
  
  const keywordIndicator = result.hasBookingKeywords ? '\x1b[32m[BOOKING]\x1b[0m' : '\x1b[33m[NO_KEYWORDS]\x1b[0m';
  const gouvIndicator = result.isGouvDomain ? '' : '\x1b[31m[NOT_GOUV]\x1b[0m';
  
  console.log(`\n[${index + 1}/${total}] ${result.name} (Tier ${result.tier})`);
  console.log(`  ${statusEmoji[result.status]} ${keywordIndicator} ${gouvIndicator}`);
  console.log(`  URL: ${result.originalUrl}`);
  
  if (result.status === 'redirected' && result.finalUrl) {
    console.log(`  -> Final: ${result.finalUrl}`);
  }
  
  if (result.httpStatus) {
    console.log(`  HTTP: ${result.httpStatus} | Time: ${result.responseTime}ms`);
  }
  
  if (result.errorMessage) {
    console.log(`  Error: ${result.errorMessage}`);
  }
}

async function main() {
  console.log('========================================');
  console.log('Prefecture URL Validation Report');
  console.log('========================================');
  console.log(`Total prefectures: ${ALL_PREFECTURES.length}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('========================================\n');
  
  const results: UrlValidationResult[] = [];
  const total = ALL_PREFECTURES.length;
  
  // Process URLs sequentially to avoid overwhelming servers
  for (let i = 0; i < ALL_PREFECTURES.length; i++) {
    const config = ALL_PREFECTURES[i];
    const result = await validatePrefecture(config);
    results.push(result);
    printResult(result, i, total);
    
    // Small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  const working = results.filter(r => r.status === 'working');
  const redirected = results.filter(r => r.status === 'redirected');
  const broken = results.filter(r => r.status === 'broken');
  const timeout = results.filter(r => r.status === 'timeout');
  const errors = results.filter(r => r.status === 'error');
  const noKeywords = results.filter(r => !r.hasBookingKeywords && (r.status === 'working' || r.status === 'redirected'));
  
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`\x1b[32mWorking:\x1b[0m ${working.length}`);
  console.log(`\x1b[33mRedirected:\x1b[0m ${redirected.length}`);
  console.log(`\x1b[31mBroken:\x1b[0m ${broken.length}`);
  console.log(`\x1b[31mTimeout:\x1b[0m ${timeout.length}`);
  console.log(`\x1b[31mErrors:\x1b[0m ${errors.length}`);
  console.log(`\x1b[33mNo booking keywords:\x1b[0m ${noKeywords.length}`);
  
  // List problematic URLs
  if (broken.length > 0 || timeout.length > 0 || errors.length > 0) {
    console.log('\n========================================');
    console.log('PROBLEMATIC URLs (Need Manual Review)');
    console.log('========================================');
    
    [...broken, ...timeout, ...errors].forEach(r => {
      console.log(`\n${r.name} (${r.id})`);
      console.log(`  Status: ${r.status}`);
      console.log(`  URL: ${r.originalUrl}`);
      if (r.httpStatus) console.log(`  HTTP: ${r.httpStatus}`);
      if (r.errorMessage) console.log(`  Error: ${r.errorMessage}`);
    });
  }
  
  // List redirected URLs
  if (redirected.length > 0) {
    console.log('\n========================================');
    console.log('REDIRECTED URLs (Auto-discovery candidates)');
    console.log('========================================');
    
    redirected.forEach(r => {
      console.log(`\n${r.name} (${r.id})`);
      console.log(`  From: ${r.originalUrl}`);
      console.log(`  To:   ${r.finalUrl}`);
      console.log(`  Has booking keywords: ${r.hasBookingKeywords ? 'Yes' : 'No'}`);
    });
  }
  
  // URLs without booking keywords (potential issues)
  if (noKeywords.length > 0) {
    console.log('\n========================================');
    console.log('URLs WITHOUT BOOKING KEYWORDS (Verify manually)');
    console.log('========================================');
    
    noKeywords.forEach(r => {
      console.log(`  - ${r.name}: ${r.finalUrl || r.originalUrl}`);
    });
  }
  
  console.log('\n========================================');
  console.log(`Completed at: ${new Date().toISOString()}`);
  console.log('========================================');
  
  // Return exit code based on results
  const hasProblems = broken.length > 0 || timeout.length > 0 || errors.length > 0;
  process.exit(hasProblems ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
