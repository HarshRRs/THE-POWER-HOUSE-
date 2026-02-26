import logger from '../utils/logger.util.js';

/**
 * 2Captcha / Anti-Captcha integration service
 * Solves CAPTCHAs via external API (~$3/1000 solves)
 * 
 * Supports:
 * - Image CAPTCHA (base64 image → text answer)
 * - reCAPTCHA v2 (sitekey + url → token)
 * - hCaptcha (sitekey + url → token)
 */

const TWO_CAPTCHA_API_KEY = process.env.TWO_CAPTCHA_API_KEY || '';
const TWO_CAPTCHA_BASE = 'http://2captcha.com';
const POLL_INTERVAL_MS = 5000; // Check every 5 seconds
const MAX_WAIT_MS = 120000; // Max 2 minutes wait

interface CaptchaResult {
  success: boolean;
  answer: string;
  captchaId?: string;
  cost?: number;
  solveTimeMs?: number;
  error?: string;
}

/**
 * Solve an image CAPTCHA (base64 encoded)
 * Used for: French prefecture text CAPTCHAs
 */
export async function solveImageCaptcha(base64Image: string): Promise<CaptchaResult> {
  const startTime = Date.now();
  
  if (!TWO_CAPTCHA_API_KEY) {
    logger.warn('2Captcha API key not configured, cannot solve CAPTCHA');
    return { success: false, answer: '', error: 'API key not configured' };
  }

  try {
    // Step 1: Submit CAPTCHA
    const submitUrl = `${TWO_CAPTCHA_BASE}/in.php`;
    const submitBody = new URLSearchParams({
      key: TWO_CAPTCHA_API_KEY,
      method: 'base64',
      body: base64Image,
      json: '1',
    });

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      body: submitBody,
    });
    const submitData = await submitRes.json() as { status: number; request: string };

    if (submitData.status !== 1) {
      logger.error(`2Captcha submit failed: ${submitData.request}`);
      return { success: false, answer: '', error: submitData.request };
    }

    const captchaId = submitData.request;
    logger.debug(`2Captcha submitted, ID: ${captchaId}`);

    // Step 2: Poll for result
    const answer = await pollForResult(captchaId);
    const solveTimeMs = Date.now() - startTime;

    if (answer) {
      logger.info(`CAPTCHA solved in ${solveTimeMs}ms: ${answer.substring(0, 10)}...`);
      return { success: true, answer, captchaId, solveTimeMs };
    }

    return { success: false, answer: '', captchaId, error: 'Timeout waiting for solution' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`2Captcha error: ${msg}`);
    return { success: false, answer: '', error: msg };
  }
}

/**
 * Solve reCAPTCHA v2
 * Used for: Some prefectures that use Google reCAPTCHA
 */
export async function solveRecaptchaV2(siteKey: string, pageUrl: string): Promise<CaptchaResult> {
  const startTime = Date.now();
  
  if (!TWO_CAPTCHA_API_KEY) {
    return { success: false, answer: '', error: 'API key not configured' };
  }

  try {
    // Submit reCAPTCHA task
    const submitUrl = `${TWO_CAPTCHA_BASE}/in.php`;
    const submitBody = new URLSearchParams({
      key: TWO_CAPTCHA_API_KEY,
      method: 'userrecaptcha',
      googlekey: siteKey,
      pageurl: pageUrl,
      json: '1',
    });

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      body: submitBody,
    });
    const submitData = await submitRes.json() as { status: number; request: string };

    if (submitData.status !== 1) {
      return { success: false, answer: '', error: submitData.request };
    }

    const captchaId = submitData.request;
    logger.debug(`reCAPTCHA submitted, ID: ${captchaId}`);

    // Poll for result (reCAPTCHA takes longer, ~20-60 seconds)
    const answer = await pollForResult(captchaId);
    const solveTimeMs = Date.now() - startTime;

    if (answer) {
      logger.info(`reCAPTCHA solved in ${solveTimeMs}ms`);
      return { success: true, answer, captchaId, solveTimeMs };
    }

    return { success: false, answer: '', captchaId, error: 'Timeout' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, answer: '', error: msg };
  }
}

/**
 * Solve hCaptcha
 * Used for: Some newer prefecture forms
 */
export async function solveHCaptcha(siteKey: string, pageUrl: string): Promise<CaptchaResult> {
  const startTime = Date.now();
  
  if (!TWO_CAPTCHA_API_KEY) {
    return { success: false, answer: '', error: 'API key not configured' };
  }

  try {
    const submitUrl = `${TWO_CAPTCHA_BASE}/in.php`;
    const submitBody = new URLSearchParams({
      key: TWO_CAPTCHA_API_KEY,
      method: 'hcaptcha',
      sitekey: siteKey,
      pageurl: pageUrl,
      json: '1',
    });

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      body: submitBody,
    });
    const submitData = await submitRes.json() as { status: number; request: string };

    if (submitData.status !== 1) {
      return { success: false, answer: '', error: submitData.request };
    }

    const captchaId = submitData.request;
    const answer = await pollForResult(captchaId);
    const solveTimeMs = Date.now() - startTime;

    if (answer) {
      logger.info(`hCaptcha solved in ${solveTimeMs}ms`);
      return { success: true, answer, captchaId, solveTimeMs };
    }

    return { success: false, answer: '', captchaId, error: 'Timeout' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, answer: '', error: msg };
  }
}

/**
 * Report a bad CAPTCHA solution (get refund from 2Captcha)
 */
export async function reportBadCaptcha(captchaId: string): Promise<void> {
  if (!TWO_CAPTCHA_API_KEY || !captchaId) return;
  
  try {
    await fetch(`${TWO_CAPTCHA_BASE}/res.php?key=${TWO_CAPTCHA_API_KEY}&action=reportbad&id=${captchaId}&json=1`);
    logger.info(`Reported bad CAPTCHA: ${captchaId}`);
  } catch {
    // Non-critical, ignore
  }
}

/**
 * Get 2Captcha account balance
 */
export async function getCaptchaBalance(): Promise<number> {
  if (!TWO_CAPTCHA_API_KEY) return 0;
  
  try {
    const res = await fetch(`${TWO_CAPTCHA_BASE}/res.php?key=${TWO_CAPTCHA_API_KEY}&action=getbalance&json=1`);
    const data = await res.json() as { status: number; request: string };
    return data.status === 1 ? parseFloat(data.request) : 0;
  } catch {
    return 0;
  }
}

/**
 * Check if 2Captcha is configured and ready
 */
export function isCaptchaServiceReady(): boolean {
  return TWO_CAPTCHA_API_KEY.length > 0;
}

// ─── Internal helpers ───────────────────────────────────

async function pollForResult(captchaId: string): Promise<string | null> {
  const deadline = Date.now() + MAX_WAIT_MS;
  
  // Initial wait before first poll (solutions take at least a few seconds)
  await sleep(10000);

  while (Date.now() < deadline) {
    const resultUrl = `${TWO_CAPTCHA_BASE}/res.php?key=${TWO_CAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`;
    const res = await fetch(resultUrl);
    const data = await res.json() as { status: number; request: string };

    if (data.status === 1) {
      return data.request; // Solved!
    }

    if (data.request !== 'CAPCHA_NOT_READY') {
      logger.error(`2Captcha error: ${data.request}`);
      return null; // Real error
    }

    // Not ready yet, wait and retry
    await sleep(POLL_INTERVAL_MS);
  }

  return null; // Timed out
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
