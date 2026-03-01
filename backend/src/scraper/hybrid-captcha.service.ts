import logger from '../utils/logger.util.js';
import { createWorker, Worker, OEM, PSM } from 'tesseract.js';
import sharp from 'sharp';

// ═══════════════════════════════════════════════════════════════════════════
// HYBRID CAPTCHA SOLVER - Smart Strategy
// ═══════════════════════════════════════════════════════════════════════════
// 
// RDV-Préfecture CAPTCHAs:
//   - HARD difficulty (gradient bg, noise lines, warped text)
//   - Tesseract CANNOT solve these → 2Captcha only
//   - BUT: CAPTCHA only shows ONCE per session
//   - After solving: session validated → no more CAPTCHA for weeks
//   - Cost: $0.003 per session init = nearly FREE
//
// Indian Embassy CAPTCHAs:
//   - EASY difficulty (simple numeric text)
//   - Tesseract solves 95% → FREE
//   - 2Captcha fallback for remaining 5%
//
// Strategy: Solve once → persist session cookies → ride session
// ═══════════════════════════════════════════════════════════════════════════

export type SimpleCaptchaType = 
  | 'numeric'           // Only numbers (0-9)
  | 'alphanumeric'      // Letters and numbers
  | 'alphanumeric_upper' // Uppercase letters and numbers
  | 'text'              // Any text
  | 'math'              // Math expression (5+3=?)
  | 'unknown';

export interface CaptchaSolveResult {
  text: string;
  confidence: number;
  method: 'tesseract' | '2captcha' | 'math';
  cost: number;  // in USD
  timeMs: number;
}

export interface CaptchaStats {
  totalAttempts: number;
  tesseractSuccess: number;
  tesseractFailed: number;
  twoCaptchaSuccess: number;
  twoCaptchaFailed: number;
  totalCost: number;
  averageConfidence: number;
}

class HybridCaptchaSolver {
  private worker: Worker | null = null;
  private isInitialized = false;
  private apiKey: string | null = null;
  
  private stats: CaptchaStats = {
    totalAttempts: 0,
    tesseractSuccess: 0,
    tesseractFailed: 0,
    twoCaptchaSuccess: 0,
    twoCaptchaFailed: 0,
    totalCost: 0,
    averageConfidence: 0,
  };

  private confidenceHistory: number[] = [];

  constructor() {
    this.apiKey = process.env.TWOCAPTCHA_API_KEY || null;
    if (!this.apiKey) {
      logger.warn('HybridCaptchaSolver: No 2Captcha API key - using Tesseract only');
    }
  }

  /**
   * Initialize Tesseract worker (lazy initialization)
   */
  private async initWorker(): Promise<void> {
    if (this.isInitialized && this.worker) return;

    try {
      logger.info('HybridCaptchaSolver: Initializing Tesseract worker...');
      this.worker = await createWorker('eng', OEM.LSTM_ONLY, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug(`Tesseract: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      this.isInitialized = true;
      logger.info('HybridCaptchaSolver: Tesseract worker initialized');
    } catch (error) {
      logger.error('HybridCaptchaSolver: Failed to initialize Tesseract', error);
      throw error;
    }
  }

  /**
   * Preprocess image for better OCR accuracy
   */
  private async preprocessImage(
    imageBuffer: Buffer,
    type: SimpleCaptchaType
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(imageBuffer);

      // Convert to grayscale
      pipeline = pipeline.grayscale();

      // Resize for better recognition (scale up small images)
      const metadata = await sharp(imageBuffer).metadata();
      if (metadata.width && metadata.width < 200) {
        pipeline = pipeline.resize({
          width: metadata.width * 3,
          height: metadata.height ? metadata.height * 3 : undefined,
          kernel: 'lanczos3',
        });
      }

      // Apply different preprocessing based on CAPTCHA type
      switch (type) {
        case 'numeric':
        case 'alphanumeric':
        case 'alphanumeric_upper':
          // High contrast + threshold for text CAPTCHAs
          pipeline = pipeline
            .normalize()
            .modulate({ brightness: 1.1, saturation: 0 })
            .threshold(128);
          break;
        
        case 'math':
          // Less aggressive for math expressions
          pipeline = pipeline
            .normalize()
            .sharpen();
          break;
        
        default:
          // Basic preprocessing
          pipeline = pipeline.normalize();
      }

      // Invert if needed (dark text on light background is better for OCR)
      // Most CAPTCHAs have dark text on light background already

      return await pipeline.png().toBuffer();
    } catch (error) {
      logger.warn('HybridCaptchaSolver: Image preprocessing failed, using original', error);
      return imageBuffer;
    }
  }

  /**
   * Get Tesseract configuration based on CAPTCHA type
   */
  private getTesseractConfig(type: SimpleCaptchaType): Partial<Tesseract.RecognizeOptions> {
    switch (type) {
      case 'numeric':
        return {
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        };
      
      case 'alphanumeric':
        return {
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        };
      
      case 'alphanumeric_upper':
        return {
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        };
      
      case 'math':
        return {
          tessedit_char_whitelist: '0123456789+-=x*/ ',
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        };
      
      default:
        return {
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
        };
    }
  }

  /**
   * Solve math CAPTCHA (e.g., "5 + 3 = ?")
   */
  private solveMathCaptcha(text: string): string | null {
    // Extract math expression
    const cleanText = text.replace(/\s/g, '').replace(/x/gi, '*');
    
    // Try to parse and solve
    const patterns = [
      /(\d+)\+(\d+)=?\??/,  // 5+3=? or 5+3
      /(\d+)-(\d+)=?\??/,   // 5-3=?
      /(\d+)\*(\d+)=?\??/,  // 5*3=?
      /(\d+)x(\d+)=?\??/i,  // 5x3=?
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const a = parseInt(match[1], 10);
        const b = parseInt(match[2], 10);
        const op = cleanText.includes('+') ? '+' : 
                   cleanText.includes('-') ? '-' : '*';
        
        switch (op) {
          case '+': return String(a + b);
          case '-': return String(a - b);
          case '*': return String(a * b);
        }
      }
    }

    return null;
  }

  /**
   * Clean OCR output based on CAPTCHA type
   */
  private cleanOcrOutput(text: string, type: SimpleCaptchaType): string {
    let cleaned = text.trim();

    // Basic cleanup for all types
    cleaned = cleaned
      .replace(/\s+/g, '')   // Remove spaces
      .replace(/[^\w]/g, ''); // Remove special chars (except alphanumeric)

    switch (type) {
      case 'numeric':
        // For numeric-only: aggressively convert letters to likely digits
        cleaned = cleaned
          .replace(/O/gi, '0')
          .replace(/[lI]/g, '1')
          .replace(/S/gi, '5')
          .replace(/B/gi, '8')
          .replace(/Z/gi, '2')
          .replace(/G/gi, '6')
          .replace(/[^0-9]/g, ''); // Strip remaining non-digits
        break;
      
      case 'alphanumeric_upper':
        // For uppercase alphanumeric: only fix unambiguous confusions
        cleaned = cleaned
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, ''); // Keep only uppercase + digits
        break;

      case 'alphanumeric':
        // Minimal cleanup - keep as-is
        cleaned = cleaned.replace(/[^A-Za-z0-9]/g, '');
        break;
    }

    return cleaned;
  }

  /**
   * Solve CAPTCHA using Tesseract OCR (FREE)
   */
  async solveFree(
    imageBuffer: Buffer,
    type: SimpleCaptchaType = 'alphanumeric'
  ): Promise<CaptchaSolveResult | null> {
    const startTime = Date.now();
    
    try {
      await this.initWorker();
      if (!this.worker) {
        throw new Error('Tesseract worker not initialized');
      }

      // Try to preprocess image, fallback to raw if it fails
      let processedImage: Buffer;
      try {
        processedImage = await this.preprocessImage(imageBuffer, type);
      } catch (preprocessError) {
        logger.warn(`HybridCaptchaSolver: Preprocessing failed, using raw image: ${preprocessError}`);
        processedImage = imageBuffer; // Use raw image as fallback
      }

      // Configure Tesseract
      const config = this.getTesseractConfig(type);
      await this.worker.setParameters(config as Tesseract.WorkerParams);

      // Recognize text
      const { data } = await this.worker.recognize(processedImage);
      
      let text = this.cleanOcrOutput(data.text, type);
      let confidence = data.confidence / 100;

      // Handle math CAPTCHAs
      if (type === 'math') {
        const solution = this.solveMathCaptcha(text);
        if (solution) {
          text = solution;
          confidence = 0.9; // Math solving is usually accurate
        }
      }

      const timeMs = Date.now() - startTime;

      // Track stats
      this.stats.totalAttempts++;
      this.confidenceHistory.push(confidence);
      
      if (confidence >= 0.6 && text.length >= 4) {
        this.stats.tesseractSuccess++;
        logger.info(`HybridCaptchaSolver: Tesseract solved "${text}" (${Math.round(confidence * 100)}% confidence, ${timeMs}ms)`);
        
        return {
          text,
          confidence,
          method: 'tesseract',
          cost: 0,
          timeMs,
        };
      }

      // Low confidence - will need fallback
      this.stats.tesseractFailed++;
      logger.warn(`HybridCaptchaSolver: Tesseract low confidence "${text}" (${Math.round(confidence * 100)}%)`);
      return null;

    } catch (error) {
      this.stats.tesseractFailed++;
      logger.error('HybridCaptchaSolver: Tesseract failed', error);
      return null;
    }
  }

  /**
   * Solve CAPTCHA using 2Captcha (PAID fallback)
   */
  async solve2Captcha(
    imageBuffer: Buffer,
    type: SimpleCaptchaType = 'alphanumeric'
  ): Promise<CaptchaSolveResult | null> {
    if (!this.apiKey) {
      logger.warn('HybridCaptchaSolver: 2Captcha API key not configured');
      return null;
    }

    const startTime = Date.now();
    const baseUrl = 'https://2captcha.com';

    try {
      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');

      // Build request parameters
      const params: Record<string, string> = {
        key: this.apiKey,
        method: 'base64',
        body: base64Image,
        json: '1',
      };

      // Add type hints
      switch (type) {
        case 'numeric':
          params.numeric = '1';
          break;
        case 'alphanumeric':
        case 'alphanumeric_upper':
          params.numeric = '0';
          break;
        case 'math':
          params.numeric = '1';
          params.calc = '1';
          break;
      }

      // Submit CAPTCHA
      const submitResponse = await fetch(`${baseUrl}/in.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString(),
      });
      const submitResult = await submitResponse.json() as { status: number; request: string };

      if (submitResult.status !== 1) {
        logger.error(`2Captcha submit error: ${submitResult.request}`);
        this.stats.twoCaptchaFailed++;
        return null;
      }

      const taskId = submitResult.request;
      logger.debug(`2Captcha: Image CAPTCHA submitted, ID: ${taskId}`);

      // Poll for result (max 60 seconds for image CAPTCHA)
      const maxAttempts = 12;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const resultParams = new URLSearchParams({
          key: this.apiKey,
          action: 'get',
          id: taskId,
          json: '1',
        });

        const resultResponse = await fetch(`${baseUrl}/res.php?${resultParams}`);
        const result = await resultResponse.json() as { status: number; request: string };

        if (result.status === 1) {
          const timeMs = Date.now() - startTime;
          const cost = 0.003; // Standard 2Captcha rate for image CAPTCHA

          this.stats.twoCaptchaSuccess++;
          this.stats.totalCost += cost;

          logger.info(`HybridCaptchaSolver: 2Captcha solved "${result.request}" (${timeMs}ms, $${cost})`);

          return {
            text: result.request,
            confidence: 0.99, // 2Captcha uses humans, very reliable
            method: '2captcha',
            cost,
            timeMs,
          };
        }

        if (result.request !== 'CAPCHA_NOT_READY') {
          logger.error(`2Captcha error: ${result.request}`);
          this.stats.twoCaptchaFailed++;
          return null;
        }
      }

      this.stats.twoCaptchaFailed++;
      logger.error('2Captcha: Timeout waiting for solution');
      return null;

    } catch (error) {
      this.stats.twoCaptchaFailed++;
      logger.error('HybridCaptchaSolver: 2Captcha failed', error);
      return null;
    }
  }

  /**
   * Solve CAPTCHA with smart strategy:
   * - HARD CAPTCHAs (rdv-prefecture): Skip Tesseract → 2Captcha directly
   * - EASY CAPTCHAs (numeric/simple): Try Tesseract first → 2Captcha fallback
   */
  async solve(
    imageBuffer: Buffer,
    type: SimpleCaptchaType = 'alphanumeric',
    options: {
      minConfidence?: number;
      skipFree?: boolean;
      difficulty?: 'easy' | 'hard';
    } = {}
  ): Promise<CaptchaSolveResult | null> {
    const { minConfidence = 0.7, skipFree = false, difficulty = 'easy' } = options;

    logger.info(`HybridCaptchaSolver: Solving ${type} CAPTCHA (difficulty: ${difficulty})...`);

    // For HARD CAPTCHAs (rdv-prefecture): skip Tesseract, go straight to 2Captcha
    if (difficulty === 'hard') {
      logger.info('HybridCaptchaSolver: Hard CAPTCHA → using 2Captcha directly');
      return this.solve2Captcha(imageBuffer, type);
    }

    // For EASY CAPTCHAs: try FREE Tesseract first
    if (!skipFree) {
      const freeResult = await this.solveFree(imageBuffer, type);
      
      if (freeResult && freeResult.confidence >= minConfidence) {
        return freeResult;
      }

      if (freeResult) {
        logger.info(`HybridCaptchaSolver: Tesseract result "${freeResult.text}" below threshold, trying 2Captcha...`);
      }
    }

    // Fall back to 2Captcha
    return this.solve2Captcha(imageBuffer, type);
  }

  /**
   * Get solver statistics
   */
  getStats(): CaptchaStats {
    const avgConfidence = this.confidenceHistory.length > 0
      ? this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length
      : 0;

    return {
      ...this.stats,
      averageConfidence: avgConfidence,
    };
  }

  /**
   * Get success rates
   */
  getSuccessRates(): { free: number; paid: number; overall: number } {
    const freeTotal = this.stats.tesseractSuccess + this.stats.tesseractFailed;
    const paidTotal = this.stats.twoCaptchaSuccess + this.stats.twoCaptchaFailed;
    const overall = this.stats.tesseractSuccess + this.stats.twoCaptchaSuccess;

    return {
      free: freeTotal > 0 ? this.stats.tesseractSuccess / freeTotal : 0,
      paid: paidTotal > 0 ? this.stats.twoCaptchaSuccess / paidTotal : 0,
      overall: this.stats.totalAttempts > 0 ? overall / this.stats.totalAttempts : 0,
    };
  }

  /**
   * Terminate worker (call on shutdown)
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      logger.info('HybridCaptchaSolver: Worker terminated');
    }
  }
}

// Singleton export
// Export both singleton and class for flexibility
export { HybridCaptchaSolver };
export const hybridCaptchaSolver = new HybridCaptchaSolver();
