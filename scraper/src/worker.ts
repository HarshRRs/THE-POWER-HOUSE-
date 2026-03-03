import { firefox, Browser, BrowserContext, Page } from 'playwright';
import fs from 'fs';
import path from 'path';
import { PrefectureConfig, ScrapeResult } from './types';

/**
 * RDVPriority - Playwright Scraper Worker
 *
 * Uses Firefox (not Chromium) to match the backend BrowserPool.
 * Firefox's CDP is harder to fingerprint than Chrome's, and the
 * Dockerfile.worker already installs Firefox.
 *
 * Anti-detection measures applied:
 * - `dom.webdriver.enabled: false` — hides navigator.webdriver
 * - `marionette.enabled: false` — disables Marionette (automation flag)
 * - French locale + Accept-Language headers
 * - Random 3-8 s human delay after navigation
 * - Screenshot saved to ./debug/ on any unexpected error
 */

// ── Firefox-only User Agents ──────────────────────────────────────────────
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
];

const SCREEN_RESOLUTIONS = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
];

function randomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
}

async function saveDebugScreenshot(page: Page, prefectureId: string, reason: string): Promise<void> {
    try {
        const debugDir = path.resolve('./debug');
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
        }
        const filename = `${prefectureId}_${reason}_${Date.now()}.png`;
        const filepath = path.join(debugDir, filename);
        const screenshot = await page.screenshot({ fullPage: true });
        fs.writeFileSync(filepath, screenshot);
        console.log(`   📸 Debug screenshot saved: ${filepath}`);
    } catch {
        // Screenshot failed — non-critical
    }
}

export class ScraperWorker {
    private prefecture: PrefectureConfig;
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;

    constructor(prefecture: PrefectureConfig) {
        this.prefecture = prefecture;
    }

    async init(): Promise<void> {
        console.log(`🔧 Initializing worker for ${this.prefecture.name}...`);
        const userAgent = randomElement(USER_AGENTS);

        this.browser = await firefox.launch({
            headless: true,
            firefoxUserPrefs: {
                // ── Core anti-detection ──────────────────────────────
                'dom.webdriver.enabled': false,
                'marionette.enabled': false,
                'remote.enabled': false,

                // ── Telemetry off ────────────────────────────────────
                'toolkit.telemetry.enabled': false,
                'datareporting.policy.dataSubmissionEnabled': false,
                'browser.crashReports.unsubmittedCheck.autoSubmit2': false,

                // ── Privacy ──────────────────────────────────────────
                'privacy.trackingprotection.enabled': false,
                'network.cookie.cookieBehavior': 0,
                'privacy.resistFingerprinting': false,   // Resist FP changes too many things

                // ── WebRTC: prevent IP leak ───────────────────────────
                'media.peerconnection.enabled': false,

                // ── French locale ─────────────────────────────────────
                'intl.accept_languages': 'fr-FR,fr,en-US,en',

                // ── Performance ───────────────────────────────────────
                'network.http.connection-timeout': 45,
                'network.http.response.timeout': 60,
                'browser.cache.disk.enable': false,
                'browser.cache.memory.enable': true,
                'network.prefetch-next': false,
                'network.dns.disablePrefetch': true,
                'browser.safebrowsing.malware.enabled': false,
                'browser.safebrowsing.phishing.enabled': false,
            },
        });

        const resolution = randomElement(SCREEN_RESOLUTIONS);

        this.context = await this.browser.newContext({
            userAgent,
            viewport: resolution,
            locale: 'fr-FR',
            timezoneId: 'Europe/Paris',
            extraHTTPHeaders: {
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'DNT': '1',
                'Upgrade-Insecure-Requests': '1',
            },
        });

        // Overwrite navigator.webdriver in every page opened by this context
        await this.context.addInitScript(`
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en-US', 'en'] });
        `);
    }

    /**
     * Check a prefecture booking page for available slots.
     * Applies human-like timing and saves a screenshot on error.
     */
    async checkAvailability(): Promise<ScrapeResult> {
        console.log(`🔍 Checking ${this.prefecture.name}...`);

        if (!this.context) {
            return { slotsFound: 0, error: 'Browser context not initialized' };
        }

        let page: Page | null = null;

        try {
            page = await this.context.newPage();

            // Reasonable timeouts for prefecture websites (can be slow)
            page.setDefaultNavigationTimeout(45000);
            page.setDefaultTimeout(30000);

            // Block heavy resources to speed up scraping
            await page.route('**/*', (route) => {
                const type = route.request().resourceType();
                if (['media', 'font'].includes(type)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });

            // Navigate to booking page
            await page.goto(this.prefecture.bookingUrl, {
                waitUntil: 'domcontentloaded',
            });

            // ── Human-like delay: act like a person reading the page ──
            await randomDelay(3000, 8000);

            const selectors = this.prefecture.selectors || {};

            // 1. Check for "no slots" indicators first (fast path)
            const noSlotSelector = selectors.noSlotIndicator
                || '.complet, :has-text("aucun créneau"), :has-text("Il n\'existe plus de plage horaire")';
            const hasNoSlots = await page.$(noSlotSelector).catch(() => null);

            if (hasNoSlots) {
                return { slotsFound: 0, checkedAt: new Date().toISOString() };
            }

            // 2. Look for explicit availability indicators
            const availabilitySelector = selectors.availabilityIndicator
                || '.available, .slot-available, [data-available="true"], :has-text("Créneaux disponibles")';
            const availableElements = await page.$$(availabilitySelector).catch(() => []);

            if (availableElements.length > 0) {
                // Save a confirmation screenshot as proof
                if (page) await saveDebugScreenshot(page, this.prefecture.id, 'slots_found');
                return {
                    slotsFound: availableElements.length,
                    checkedAt: new Date().toISOString(),
                };
            }

            // 3. Optional booking button presence check
            const bookingBtnSelector = selectors.bookingButton
                || 'a[href*="rendez-vous"], button:has-text("Prendre")';
            await page.$(bookingBtnSelector).catch(() => null);
            // Presence alone isn't conclusive — fall through to no-slots

            return {
                slotsFound: 0,
                checkedAt: new Date().toISOString(),
            };

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`⚠️ Error checking ${this.prefecture.name}: ${msg}`);

            // Save debug screenshot so we can diagnose without SSH-ing into server
            if (page) {
                await saveDebugScreenshot(page, this.prefecture.id, 'error');
            }

            return {
                slotsFound: 0,
                error: msg,
                checkedAt: new Date().toISOString(),
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
