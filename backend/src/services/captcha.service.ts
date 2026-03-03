import logger from '../utils/logger.util.js';

/**
 * 2Captcha / Anti-Captcha integration service
 * Solves CAPTCHAs via external API (~$3/1000 solves)
 * 
 * Supports:
 * - Image CAPTCHA (base64 image → text answer)
 * - reCAPTCHA v2 (sitekey + url → token)
 * - hCaptcha (sitekey + url → token)
 * - Cloudflare Turnstile (sitekey + url → token)
 */

const TWO_CAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || process.env.TWO_CAPTCHA_API_KEY || '';
const TWO_CAPTCHA_BASE = 'http://2captcha.com';
const CAPSOLVER_API_KEY = process.env.CAPSOLVER_API_KEY || '';
const CAPSOLVER_BASE = 'https://api.capsolver.com';
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
 * Solve Cloudflare Turnstile
 * Used for: RDV-Prefecture sites that use Cloudflare protection
 * 
 * This is triggered AFTER the application CAPTCHA is solved,
 * when the form submission redirects to /_validerCaptcha
 * 
 * For managed challenge pages, additional metadata is required:
 * - action: from cType in _cf_chl_opt (e.g., "managed")
 * - data: from cRay in _cf_chl_opt (Cloudflare Ray ID)
 * - pagedata: from cH in _cf_chl_opt (challenge hash)
 * - userAgent: browser's user agent string
 * 
 * Cost: ~$0.003 per solve (same as other CAPTCHAs)
 */
export async function solveTurnstile(
  siteKey: string,
  pageUrl: string,
  challengeMetadata?: {
    action?: string;
    cData?: string;
    chlPageData?: string;
    userAgent?: string;
  },
): Promise<CaptchaResult> {
  const startTime = Date.now();
  
  // Try 2Captcha first (primary provider)
  if (TWO_CAPTCHA_API_KEY) {
    const result = await solveTurnstileWith2Captcha(siteKey, pageUrl, challengeMetadata, startTime);
    if (result.success) return result;
    logger.warn(`2Captcha Turnstile failed: ${result.error}`);
  }

  // Fallback to CapSolver if configured
  if (CAPSOLVER_API_KEY) {
    logger.info('Falling back to CapSolver for Turnstile...');
    const result = await solveTurnstileWithCapSolver(siteKey, pageUrl, challengeMetadata, startTime);
    if (result.success) return result;
    logger.warn(`CapSolver Turnstile failed: ${result.error}`);
  }

  if (!TWO_CAPTCHA_API_KEY && !CAPSOLVER_API_KEY) {
    return { success: false, answer: '', error: 'No CAPTCHA provider configured' };
  }

  return { success: false, answer: '', error: 'All CAPTCHA providers failed' };
}

async function solveTurnstileWith2Captcha(
  siteKey: string,
  pageUrl: string,
  challengeMetadata?: {
    action?: string;
    cData?: string;
    chlPageData?: string;
    userAgent?: string;
  },
  startTime = Date.now(),
): Promise<CaptchaResult> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use createTask API for Cloudflare challenge pages (requires metadata)
      if (challengeMetadata?.chlPageData) {
        const task: Record<string, unknown> = {
          type: 'TurnstileTaskProxyless',
          websiteURL: pageUrl,
          websiteKey: siteKey,
        };
        if (challengeMetadata.action) task.action = challengeMetadata.action;
        if (challengeMetadata.cData) task.data = challengeMetadata.cData;
        if (challengeMetadata.chlPageData) task.pagedata = challengeMetadata.chlPageData;
        if (challengeMetadata.userAgent) task.userAgent = challengeMetadata.userAgent;

        const submitRes = await fetch('https://api.2captcha.com/createTask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientKey: TWO_CAPTCHA_API_KEY, task }),
        });
        const submitData = await submitRes.json() as { errorId: number; errorCode?: string; taskId?: number };

        if (submitData.errorId !== 0) {
          logger.error(`Turnstile createTask failed: ${submitData.errorCode}`);
          if (attempt < MAX_RETRIES) { await sleep(2000); continue; }
          return { success: false, answer: '', error: submitData.errorCode };
        }

        const taskId = submitData.taskId;
        logger.debug(`Turnstile task submitted (attempt ${attempt}), ID: ${taskId}`);

        // Poll for result
        await sleep(10000);
        const deadline = Date.now() + MAX_WAIT_MS;
        while (Date.now() < deadline) {
          const resultRes = await fetch('https://api.2captcha.com/getTaskResult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientKey: TWO_CAPTCHA_API_KEY, taskId }),
          });
          const resultData = await resultRes.json() as {
            errorId: number; status: string; solution?: { token: string }; errorCode?: string;
          };

          if (resultData.status === 'ready' && resultData.solution?.token) {
            const solveTimeMs = Date.now() - startTime;
            logger.info(`Turnstile solved via 2Captcha in ${solveTimeMs}ms (attempt ${attempt})`);
            return { success: true, answer: resultData.solution.token, solveTimeMs, cost: 0.003 };
          }

          if (resultData.errorId !== 0 && resultData.errorCode !== 'CAPCHA_NOT_READY') {
            if (resultData.errorCode === 'ERROR_CAPTCHA_UNSOLVABLE' && attempt < MAX_RETRIES) {
              logger.warn(`Turnstile unsolvable on attempt ${attempt}, retrying...`);
              break; // Break poll, retry outer loop
            }
            return { success: false, answer: '', error: resultData.errorCode };
          }
          await sleep(POLL_INTERVAL_MS);
        }
        continue; // Retry
      }

      // Fallback: Legacy API for standalone Turnstile widgets
      const submitUrl = `${TWO_CAPTCHA_BASE}/in.php`;
      const submitBody = new URLSearchParams({
        key: TWO_CAPTCHA_API_KEY,
        method: 'turnstile',
        sitekey: siteKey,
        pageurl: pageUrl,
        json: '1',
      });
      if (challengeMetadata?.action) submitBody.set('action', challengeMetadata.action);
      if (challengeMetadata?.cData) submitBody.set('data', challengeMetadata.cData);

      const submitRes = await fetch(submitUrl, { method: 'POST', body: submitBody });
      const submitData = await submitRes.json() as { status: number; request: string };

      if (submitData.status !== 1) {
        logger.error(`Turnstile submit failed: ${submitData.request}`);
        if (attempt < MAX_RETRIES) { await sleep(2000); continue; }
        return { success: false, answer: '', error: submitData.request };
      }

      const captchaId = submitData.request;
      logger.debug(`Turnstile submitted (legacy, attempt ${attempt}), ID: ${captchaId}`);

      const answer = await pollForResult(captchaId);
      const solveTimeMs = Date.now() - startTime;

      if (answer) {
        logger.info(`Turnstile solved via 2Captcha in ${solveTimeMs}ms`);
        return { success: true, answer, captchaId, solveTimeMs, cost: 0.003 };
      }

      if (attempt < MAX_RETRIES) continue;
      return { success: false, answer: '', captchaId, error: 'Timeout waiting for Turnstile solution' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Turnstile error (attempt ${attempt}): ${msg}`);
      if (attempt === MAX_RETRIES) return { success: false, answer: '', error: msg };
      await sleep(2000);
    }
  }

  return { success: false, answer: '', error: '2Captcha retries exhausted' };
}

async function solveTurnstileWithCapSolver(
  siteKey: string,
  pageUrl: string,
  challengeMetadata?: {
    action?: string;
    cData?: string;
    chlPageData?: string;
    userAgent?: string;
  },
  startTime = Date.now(),
): Promise<CaptchaResult> {
  try {
    const task: Record<string, unknown> = {
      type: 'AntiTurnstileTaskProxyLess',
      websiteURL: pageUrl,
      websiteKey: siteKey,
    };
    if (challengeMetadata?.action) task.metadata = { action: challengeMetadata.action };
    if (challengeMetadata?.cData) {
      task.metadata = { ...(task.metadata as Record<string, unknown> || {}), cdata: challengeMetadata.cData };
    }

    const submitRes = await fetch(`${CAPSOLVER_BASE}/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientKey: CAPSOLVER_API_KEY, task }),
    });
    const submitData = await submitRes.json() as { errorId: number; errorCode?: string; errorDescription?: string; taskId?: string };

    if (submitData.errorId !== 0) {
      logger.error(`CapSolver createTask failed: ${submitData.errorCode} - ${submitData.errorDescription}`);
      return { success: false, answer: '', error: submitData.errorCode };
    }

    const taskId = submitData.taskId;
    logger.debug(`CapSolver Turnstile task submitted, ID: ${taskId}`);

    // Poll for result
    await sleep(5000);
    const deadline = Date.now() + MAX_WAIT_MS;
    while (Date.now() < deadline) {
      const resultRes = await fetch(`${CAPSOLVER_BASE}/getTaskResult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientKey: CAPSOLVER_API_KEY, taskId }),
      });
      const resultData = await resultRes.json() as {
        errorId: number; status: string; solution?: { token: string }; errorCode?: string;
      };

      if (resultData.status === 'ready' && resultData.solution?.token) {
        const solveTimeMs = Date.now() - startTime;
        logger.info(`Turnstile solved via CapSolver in ${solveTimeMs}ms`);
        return { success: true, answer: resultData.solution.token, solveTimeMs, cost: 0.001 };
      }

      if (resultData.errorId !== 0 && resultData.errorCode !== 'TASK_NOT_FOUND') {
        return { success: false, answer: '', error: resultData.errorCode };
      }

      await sleep(POLL_INTERVAL_MS);
    }

    return { success: false, answer: '', error: 'CapSolver timeout' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`CapSolver error: ${msg}`);
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
