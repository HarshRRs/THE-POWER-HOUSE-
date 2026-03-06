import type { ConsulateConfig, ConsulateScrapeResult, AvailableDate } from '../../types/consulate.types.js';
import { getBrowserPool, type PageSession } from '../browser.pool.js';
import { proxyService } from '../proxy.service.js';
import { randomDelay } from '../../utils/retry.util.js';
import { humanReadPage } from '../../utils/human.util.js';
import logger from '../../utils/logger.util.js';

const MAX_PROXY_RETRIES = 3;

/**
 * Custom Playwright scraper for Indian Embassy Paris (appointment.eoiparis.com)
 * This bypasses the standard HTTP-based VFS scraper because the Embassy
 * uses a custom portal with dynamic dropdowns and unique CAPTCHA flows.
 */
export async function scrapeIndianEmbassy(
    config: ConsulateConfig,
    categoryId: number
): Promise<ConsulateScrapeResult> {
    const startTime = Date.now();
    const category = config.categories.find((c) => c.id === categoryId);

    if (!category) {
        return {
            status: 'error',
            category: categoryId,
            categoryName: 'Unknown',
            slotsAvailable: 0,
            availableDates: [],
            bookingUrl: config.baseUrl,
            errorMessage: `Category ${categoryId} not found in config`,
            responseTimeMs: Date.now() - startTime,
        };
    }

    const pool = await getBrowserPool();
    let session: PageSession | null = null;
    const targetDomain = new URL(config.baseUrl).hostname;
    const usedProxies = new Set<string>();

    for (let attempt = 0; attempt < MAX_PROXY_RETRIES; attempt++) {
        try {
            session = await pool.getPage(targetDomain, usedProxies.size > 0 ? usedProxies : undefined);
            const { page, context, proxy } = session;

            if (attempt > 0) {
                logger.info(`Retry attempt ${attempt + 1}/${MAX_PROXY_RETRIES} for ${config.id} with different proxy`);
            }

            logger.debug(`Scraping Indian Embassy (${config.id}): ${config.baseUrl}`);

            const response = await page.goto(config.baseUrl, {
                waitUntil: 'networkidle',
                timeout: 45000,
            });

            if (response && response.status() >= 400) {
                logger.warn(`HTTP ${response.status()} for ${config.id}`);
                if (proxy) proxyService.reportFailure(proxy, targetDomain);

                if (attempt < MAX_PROXY_RETRIES - 1) {
                    if (proxy) usedProxies.add(proxy.server);
                    pool.releasePage(page, context);
                    continue;
                }

                return {
                    status: response.status() === 403 ? 'blocked' : 'error',
                    category: categoryId,
                    categoryName: category.name,
                    slotsAvailable: 0,
                    availableDates: [],
                    bookingUrl: config.baseUrl,
                    errorMessage: `HTTP ${response.status()}`,
                    responseTimeMs: Date.now() - startTime,
                };
            }

            await randomDelay(1000, 2000);
            await humanReadPage(page);

            // Check for bot detection (Cloudflare)
            const pageText = await page.content();
            if (pageText.toLowerCase().includes('cloudflare') && pageText.toLowerCase().includes('just a moment')) {
                logger.warn(`Cloudflare block detected for Indian Embassy. Attempt ${attempt + 1}`);
                if (proxy) proxyService.reportFailure(proxy, targetDomain);
                if (attempt < MAX_PROXY_RETRIES - 1) {
                    if (proxy) usedProxies.add(proxy.server);
                    pool.releasePage(page, context);
                    continue;
                }
                return {
                    status: 'blocked',
                    category: categoryId,
                    categoryName: category.name,
                    slotsAvailable: 0,
                    availableDates: [],
                    bookingUrl: config.baseUrl,
                    errorMessage: 'Blocked by Cloudflare',
                    responseTimeMs: Date.now() - startTime,
                };
            }

            // NOTE: Here we would interact with the dropdowns for specific services based on category.id
            // For now, we simulate finding 0 slots until exact DOM selectors are known.
            logger.info(`Navigated to ${config.baseUrl} for category ${category.name}`);

            const availableDates: AvailableDate[] = [];
            const totalSlots = 0;

            // Ensure we mark proxy as successful if we got the page loaded
            if (proxy) proxyService.reportSuccess(proxy, targetDomain);

            pool.releasePage(page, context);

            return {
                status: totalSlots > 0 ? 'slots_found' : 'no_slots',
                category: categoryId,
                categoryName: category.name,
                slotsAvailable: totalSlots,
                availableDates,
                bookingUrl: config.baseUrl,
                responseTimeMs: Date.now() - startTime,
            };

        } catch (error) {
            if (session) pool.releasePage(session.page, session.context);

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.warn(`Attempt ${attempt + 1} failed for ${config.id}: ${errorMessage}`);

            if (session && session.proxy) {
                proxyService.reportFailure(session.proxy, targetDomain);
                usedProxies.add(session.proxy.server);
            }

            if (attempt === MAX_PROXY_RETRIES - 1) {
                logger.error(`Consulate scrape error for ${config.id}/${category.name}: ${errorMessage}`);
                return {
                    status: errorMessage.includes('timeout') ? 'timeout' : 'error',
                    category: categoryId,
                    categoryName: category.name,
                    slotsAvailable: 0,
                    availableDates: [],
                    bookingUrl: config.baseUrl,
                    errorMessage,
                    responseTimeMs: Date.now() - startTime,
                };
            }
        }
    }

    return {
        status: 'error',
        category: categoryId,
        categoryName: category.name,
        slotsAvailable: 0,
        availableDates: [],
        bookingUrl: config.baseUrl,
        errorMessage: 'Max retries exceeded',
        responseTimeMs: Date.now() - startTime,
    };
}
