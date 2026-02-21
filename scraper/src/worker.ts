import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { PrefectureConfig, ScrapeResult } from './types';

/**
 * RDVPriority - Playwright Scraper Worker
 *
 * Implements actual prefecture scraping using Playwright.
 */

export class ScraperWorker {
    private prefecture: PrefectureConfig;
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    constructor(prefecture: PrefectureConfig) {
        this.prefecture = prefecture;
    }

    async init(): Promise<void> {
        console.log(`🔧 Initializing worker for ${this.prefecture.name}...`);
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'fr-FR',
            extraHTTPHeaders: {
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });
    }

    /**
     * Check a prefecture booking page for available slots
     */
    async checkAvailability(): Promise<ScrapeResult> {
        console.log(`🔍 Checking ${this.prefecture.name}...`);

        if (!this.context) {
            return { slotsFound: 0, error: 'Browser context not initialized' };
        }

        let page: Page | null = null;

        try {
            page = await this.context.newPage();

            // Set reasonable timeouts for prefecture websites which can be slow
            page.setDefaultNavigationTimeout(45000);
            page.setDefaultTimeout(30000);

            // Navigate to booking page
            await page.goto(this.prefecture.bookingUrl, {
                waitUntil: 'domcontentloaded',
            });

            // Handle potential basic bot protection (like accepting cookies) gently if needed here
            // e.g. await page.locator('#tarteaucitronPersonalize2').click({ timeout: 2000 }).catch(() => {});

            const selectors = this.prefecture.selectors || {};

            // 1. Check for "no slots" indicators
            const noSlotSelector = selectors.noSlotIndicator || '.complet, :has-text("aucun créneau"), :has-text("Il n\'existe plus de plage horaire")';
            const hasNoSlots = await page.$(noSlotSelector).catch(() => null);

            if (hasNoSlots) {
                return { slotsFound: 0, checkedAt: new Date().toISOString() };
            }

            // 2. Look for explicit availability indicators
            const availabilitySelector = selectors.availabilityIndicator || '.available, .slot-available, [data-available="true"], :has-text("Créneaux disponibles")';
            const availableElements = await page.$$(availabilitySelector).catch(() => []);

            if (availableElements.length > 0) {
                return {
                    slotsFound: availableElements.length,
                    checkedAt: new Date().toISOString(),
                };
            }

            // 3. Optional: Try to interact with a booking button if needed to reveal slots
            const bookingBtnSelector = selectors.bookingButton || 'a[href*="rendez-vous"], button:has-text("Prendre")';
            const bookingBtn = await page.$(bookingBtnSelector).catch(() => null);

            if (bookingBtn) {
                // In some complex cases, clicking might be required, but usually we just detect the presence of positive elements
                // For this implementation, we assume if we didn't see "No slots" and we couldn't find explicit available slots, we found 0 slots clearly visible.
            }

            return {
                slotsFound: 0,
                checkedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error(`⚠️ Error checking ${this.prefecture.name}: ${error instanceof Error ? error.message : error}`);
            return {
                slotsFound: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
                checkedAt: new Date().toISOString()
            };
        } finally {
            if (page) {
                await page.close().catch(() => { });
            }
        }
    }

    async close(): Promise<void> {
        if (this.context) {
            await this.context.close().catch(() => { });
        }
        if (this.browser) {
            await this.browser.close().catch(() => { });
        }
    }
}
