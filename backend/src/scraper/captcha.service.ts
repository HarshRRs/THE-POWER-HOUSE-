import logger from '../utils/logger.util.js';

export type CaptchaType = 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'cloudflare' | 'unknown';

export interface CaptchaSolution {
  token: string;
  type: CaptchaType;
}

export interface CaptchaDetectionResult {
  detected: boolean;
  type: CaptchaType | null;
  siteKey: string | null;
  pageUrl: string;
}

/**
 * CAPTCHA detection and solving service
 * Supports 2Captcha and Anti-Captcha providers
 */
class CaptchaService {
  private provider: '2captcha' | 'anticaptcha' | null = null;
  private apiKey: string | null = null;
  private enabled = false;

  // Stats tracking
  private stats = {
    detected: 0,
    solved: 0,
    failed: 0,
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (process.env.TWOCAPTCHA_API_KEY) {
      this.provider = '2captcha';
      this.apiKey = process.env.TWOCAPTCHA_API_KEY;
      this.enabled = true;
      logger.info('CaptchaService: 2Captcha provider initialized');
    } else if (process.env.ANTICAPTCHA_API_KEY) {
      this.provider = 'anticaptcha';
      this.apiKey = process.env.ANTICAPTCHA_API_KEY;
      this.enabled = true;
      logger.info('CaptchaService: Anti-Captcha provider initialized');
    } else {
      logger.warn('CaptchaService: No CAPTCHA solving provider configured');
      logger.warn('CaptchaService: Set TWOCAPTCHA_API_KEY or ANTICAPTCHA_API_KEY to enable solving');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Detect CAPTCHA on page
   */
  async detectCaptcha(pageContent: string, pageUrl: string): Promise<CaptchaDetectionResult> {
    const result: CaptchaDetectionResult = {
      detected: false,
      type: null,
      siteKey: null,
      pageUrl,
    };

    // reCAPTCHA v2/v3 detection
    const recaptchaMatch = pageContent.match(/data-sitekey="([^"]+)"/);
    if (recaptchaMatch) {
      result.detected = true;
      result.type = pageContent.includes('grecaptcha.execute') ? 'recaptcha_v3' : 'recaptcha_v2';
      result.siteKey = recaptchaMatch[1];
      this.stats.detected++;
      logger.info(`CaptchaService: Detected ${result.type} with siteKey ${result.siteKey}`);
      return result;
    }

    // hCaptcha detection
    const hcaptchaMatch = pageContent.match(/data-sitekey="([^"]+)"[^>]*class="h-captcha"/);
    if (hcaptchaMatch || pageContent.includes('hcaptcha.com')) {
      result.detected = true;
      result.type = 'hcaptcha';
      const siteKeyMatch = pageContent.match(/data-sitekey="([^"]+)"/);
      result.siteKey = siteKeyMatch ? siteKeyMatch[1] : null;
      this.stats.detected++;
      logger.info(`CaptchaService: Detected hCaptcha`);
      return result;
    }

    // Cloudflare challenge detection
    if (
      pageContent.includes('cf-browser-verification') ||
      pageContent.includes('cloudflare') ||
      pageContent.includes('cf_chl_opt') ||
      pageContent.includes('Just a moment...')
    ) {
      result.detected = true;
      result.type = 'cloudflare';

      // Try to extract Turnstile sitekey if present
      const turnstileMatch = pageContent.match(/sitekey['"]?\s*:\s*['"]([^'"]+)['"]/i) || pageContent.match(/data-sitekey="([^"]+)"/);
      if (turnstileMatch && turnstileMatch[1]) {
        result.siteKey = turnstileMatch[1];
        logger.info(`CaptchaService: Found Cloudflare Turnstile siteKey: ${result.siteKey}`);
      }

      this.stats.detected++;
      logger.info('CaptchaService: Detected Cloudflare challenge');
      return result;
    }

    // Generic CAPTCHA indicators
    const captchaIndicators = [
      'captcha',
      'recaptcha',
      'challenge',
      'verification',
      'robot',
      'human',
      'bot-protection',
    ];

    for (const indicator of captchaIndicators) {
      if (pageContent.toLowerCase().includes(indicator)) {
        // Check if it's in a form or challenge context
        const contextMatch = pageContent.match(
          new RegExp(`<[^>]*${indicator}[^>]*>|id="[^"]*${indicator}[^"]*"|class="[^"]*${indicator}[^"]*"`, 'i')
        );
        if (contextMatch) {
          result.detected = true;
          result.type = 'unknown';
          this.stats.detected++;
          logger.info(`CaptchaService: Detected unknown CAPTCHA (indicator: ${indicator})`);
          return result;
        }
      }
    }

    return result;
  }

  /**
   * Solve CAPTCHA using configured provider
   * Returns solution token or null if failed/disabled
   */
  async solveCaptcha(
    type: CaptchaType,
    siteKey: string,
    pageUrl: string
  ): Promise<CaptchaSolution | null> {
    if (!this.enabled || !this.apiKey) {
      logger.warn('CaptchaService: Solving disabled, skipping');
      return null;
    }

    if (type === 'cloudflare' && !siteKey) {
      logger.warn('CaptchaService: Cloudflare challenged detected but no Turnstile siteKey found. Cannot solve.');
      return null;
    }

    if (type === 'unknown') {
      logger.warn('CaptchaService: Cannot solve unknown CAPTCHA type');
      return null;
    }

    try {
      logger.info(`CaptchaService: Attempting to solve ${type} CAPTCHA`);

      if (this.provider === '2captcha') {
        return await this.solve2Captcha(type, siteKey, pageUrl);
      } else if (this.provider === 'anticaptcha') {
        return await this.solveAntiCaptcha(type, siteKey, pageUrl);
      }
    } catch (error) {
      this.stats.failed++;
      logger.error('CaptchaService: Failed to solve CAPTCHA', error);
    }

    return null;
  }

  private async solve2Captcha(
    type: CaptchaType,
    siteKey: string,
    pageUrl: string
  ): Promise<CaptchaSolution | null> {
    const baseUrl = 'https://2captcha.com';

    // Map type to 2captcha method
    let method: string;
    switch (type) {
      case 'recaptcha_v2':
        method = 'userrecaptcha';
        break;
      case 'recaptcha_v3':
        method = 'userrecaptcha';
        break;
      case 'hcaptcha':
        method = 'hcaptcha';
        break;
      case 'cloudflare':
        method = 'turnstile';
        break;
      default:
        return null;
    }

    // Submit CAPTCHA
    const submitParams = new URLSearchParams({
      key: this.apiKey!,
      method,
      googlekey: siteKey,
      pageurl: pageUrl,
      json: '1',
    });

    if (type === 'recaptcha_v3') {
      submitParams.append('version', 'v3');
      submitParams.append('action', 'verify');
      submitParams.append('min_score', '0.3');
    }

    const submitResponse = await fetch(`${baseUrl}/in.php?${submitParams}`);
    const submitResult = await submitResponse.json() as { status: number; request: string };

    if (submitResult.status !== 1) {
      logger.error(`2Captcha submit error: ${submitResult.request}`);
      return null;
    }

    const taskId = submitResult.request;
    logger.debug(`2Captcha: Task submitted, ID: ${taskId}`);

    // Poll for result (max 120 seconds)
    const maxAttempts = 24;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const resultParams = new URLSearchParams({
        key: this.apiKey!,
        action: 'get',
        id: taskId,
        json: '1',
      });

      const resultResponse = await fetch(`${baseUrl}/res.php?${resultParams}`);
      const result = await resultResponse.json() as { status: number; request: string };

      if (result.status === 1) {
        this.stats.solved++;
        logger.info('2Captcha: CAPTCHA solved successfully');
        return { token: result.request, type };
      }

      if (result.request !== 'CAPCHA_NOT_READY') {
        logger.error(`2Captcha error: ${result.request}`);
        this.stats.failed++;
        return null;
      }

      logger.debug(`2Captcha: Waiting for solution... (attempt ${i + 1}/${maxAttempts})`);
    }

    this.stats.failed++;
    logger.error('2Captcha: Timeout waiting for solution');
    return null;
  }

  private async solveAntiCaptcha(
    type: CaptchaType,
    siteKey: string,
    pageUrl: string
  ): Promise<CaptchaSolution | null> {
    const baseUrl = 'https://api.anti-captcha.com';

    // Map type to anti-captcha task type
    let taskType: string;
    switch (type) {
      case 'recaptcha_v2':
        taskType = 'RecaptchaV2TaskProxyless';
        break;
      case 'recaptcha_v3':
        taskType = 'RecaptchaV3TaskProxyless';
        break;
      case 'hcaptcha':
        taskType = 'HCaptchaTaskProxyless';
        break;
      case 'cloudflare':
        taskType = 'TurnstileTaskProxyless';
        break;
      default:
        return null;
    }

    // Create task
    const createTaskBody: Record<string, unknown> = {
      clientKey: this.apiKey,
      task: {
        type: taskType,
        websiteURL: pageUrl,
        websiteKey: siteKey,
      },
    };

    if (type === 'recaptcha_v3') {
      (createTaskBody.task as Record<string, unknown>).minScore = 0.3;
      (createTaskBody.task as Record<string, unknown>).pageAction = 'verify';
    }

    const createResponse = await fetch(`${baseUrl}/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createTaskBody),
    });
    const createResult = await createResponse.json() as { errorId: number; taskId?: number; errorDescription?: string };

    if (createResult.errorId !== 0) {
      logger.error(`Anti-Captcha error: ${createResult.errorDescription}`);
      return null;
    }

    const taskId = createResult.taskId;
    logger.debug(`Anti-Captcha: Task created, ID: ${taskId}`);

    // Poll for result
    const maxAttempts = 24;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const resultResponse = await fetch(`${baseUrl}/getTaskResult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: this.apiKey,
          taskId,
        }),
      });
      const result = await resultResponse.json() as {
        errorId: number;
        status: string;
        solution?: { gRecaptchaResponse?: string; token?: string };
        errorDescription?: string;
      };

      if (result.errorId !== 0) {
        logger.error(`Anti-Captcha error: ${result.errorDescription}`);
        this.stats.failed++;
        return null;
      }

      if (result.status === 'ready' && result.solution) {
        this.stats.solved++;
        logger.info('Anti-Captcha: CAPTCHA solved successfully');
        const token = result.solution.gRecaptchaResponse || result.solution.token || '';
        return { token, type };
      }

      logger.debug(`Anti-Captcha: Waiting for solution... (attempt ${i + 1}/${maxAttempts})`);
    }

    this.stats.failed++;
    logger.error('Anti-Captcha: Timeout waiting for solution');
    return null;
  }

  getStats(): typeof this.stats {
    return { ...this.stats };
  }
}

// Singleton instance
export const captchaService = new CaptchaService();
