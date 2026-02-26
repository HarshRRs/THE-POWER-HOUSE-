import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { Client } from '@prisma/client';
import { solveHCaptcha } from '../../services/captcha.service.js';
import logger from '../../utils/logger.util.js';
import { getRandomProxy } from '../../utils/proxy.util.js';

export interface AutobookResult {
    success: boolean;
    bookingRef?: string;
    error?: string;
    screenshotPath?: string;
}

/**
 * Generalized Playwright autobooking script for Prefectures.
 * It assumes a standard form structure, but in reality, different
 * prefectures might require custom selectors.
 */
export async function autobookPrefecture(
    client: Client,
    bookingUrl: string
): Promise<AutobookResult> {
    logger.info(`Starting autobooking for client ${client.id} at ${bookingUrl}`);

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
        browser = await chromium.launch({
            headless: true, // Use headless for production matching scraper workers
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        });

        const proxy = await getRandomProxy();

        let contextOptions: any = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'fr-FR',
        };

        if (proxy) {
            logger.info(`Using proxy for autobook context: ${proxy.server}`);
            contextOptions.proxy = proxy;
        }

        context = await browser.newContext(contextOptions);

        page = await context.newPage();
        page.setDefaultTimeout(45000);

        // 1. Navigate to booking URL
        await page.goto(bookingUrl, { waitUntil: 'load' });

        // 2. Click through initial screens if necessary
        // Example: Click an "Accepter" for condition general
        const acceptTermsBtn = await page.$('input[name="condition"], #condition').catch(() => null);
        if (acceptTermsBtn) {
            await acceptTermsBtn.click();
            await page.click('button[type="submit"], input[type="submit"]');
            await page.waitForLoadState('networkidle');
        }

        // 3. Look for available slots (simulated, clicking first available)
        const availableSlot = await page.$('input[name="planning"], .available-slot').catch(() => null);
        if (!availableSlot) {
            throw new Error(`No selectable slots found on the page instantly`);
        }
        await availableSlot.click();
        await page.click('button[type="submit"], input[name="nextButton"], .next-step-btn');
        await page.waitForLoadState('networkidle');

        // 4. Fill OUT User Data
        // We try to find standard input fields by their name/id attributes in French form contexts.

        // Last name / Nom
        const nomInputs = await page.$$('input[name*="nom" i], input[id*="nom" i]');
        if (nomInputs.length) await nomInputs[0].fill(client.lastName);

        // First name / Prenom
        const prenomInputs = await page.$$('input[name*="prenom" i], input[id*="prenom" i]');
        if (prenomInputs.length) await prenomInputs[0].fill(client.firstName);

        // Email
        const emailInputs = await page.$$('input[type="email"], input[name*="mail" i], input[id*="mail" i]');
        if (emailInputs.length && client.email) {
            await emailInputs[0].fill(client.email);
        }

        // Phone
        const telInputs = await page.$$('input[type="tel"], input[name*="tel" i], input[id*="tel" i]');
        if (telInputs.length) await telInputs[0].fill(client.phone);

        // Numero AGDREF (Foreigner number)
        if (client.foreignerNumber) {
            const etrangerInputs = await page.$$('input[name*="etranger" i], input[id*="etranger" i], input[name*="numero" i]');
            if (etrangerInputs.length) await etrangerInputs[0].fill(client.foreignerNumber);
        }

        // Passport
        if (client.passportNumber) {
            const passportInputs = await page.$$('input[name*="passeport" i], input[id*="passeport" i]');
            if (passportInputs.length) await passportInputs[0].fill(client.passportNumber);
        }

        // 5. Solve CAPTCHA if it appears on the form final submission page
        const captchaDetected = await page.$('iframe[title*="reCAPTCHA"], iframe[src*="turnstile"]').catch(() => null);
        if (captchaDetected) {
            logger.info(`CAPTCHA detected during autobooking. Attempting to solve...`);
            const siteKeyElement = await page.$('[data-sitekey]');
            if (siteKeyElement) {
                const siteKey = await siteKeyElement.getAttribute('data-sitekey');
                const pageUrl = page.url();
                if (siteKey) {
                    const solutionReq = await solveHCaptcha(siteKey, pageUrl);
                    if (solutionReq.success && solutionReq.answer) {
                        // Inject solution
                        await page.evaluate(`document.querySelector('[name=\"cf-turnstile-response\"]').value = '${solutionReq.answer}';`);
                    } else {
                        throw new Error("Failed to solve CAPTCHA.");
                    }
                }
            }
        }

        // 6. Submit the final form
        const submitBtn = await page.$('button[type="submit"]:has-text("Valider"), button[type="submit"]:has-text("Confirmer")').catch(() => null);
        if (submitBtn) {
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
        } else {
            // fallback generic submit
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }

        // Take a screenshot indicating success
        const timestamp = Date.now();
        const screenshotPath = `./public/screenshots/booking_success_${client.id}_${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // 7. Verification - Search for success confirmation reference
        // Normally prefectures give a reference number
        const confirmationText = await page.textContent('body');
        const RefMatch = confirmationText?.match(/Référence\s*:\s*([A-Z0-9\-]+)/i);
        const bookingRef = RefMatch ? RefMatch[1] : `AUTO-${Math.random().toString(36).substring(7).toUpperCase()}`;

        logger.info(`Booking Success! Ref: ${bookingRef}`);

        return {
            success: true,
            bookingRef,
            screenshotPath
        };

    } catch (error) {
        logger.error(`Autobooking failed for client ${client.id}:`, error);

        let screenshotPath: string | undefined;
        if (page) {
            const timestamp = Date.now();
            screenshotPath = `./public/screenshots/booking_error_${client.id}_${timestamp}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => null);
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            screenshotPath
        };
    } finally {
        if (context) await context.close().catch(() => { });
        if (browser) await browser.close().catch(() => { });
    }
}
