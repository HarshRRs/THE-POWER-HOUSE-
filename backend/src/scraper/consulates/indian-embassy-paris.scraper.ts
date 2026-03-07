import type { ConsulateConfig, ConsulateScrapeResult, AvailableDate } from '../../types/consulate.types.js';
import { getBrowserPool, type PageSession } from '../browser.pool.js';
import { proxyService } from '../proxy.service.js';
import { randomDelay } from '../../utils/retry.util.js';
import { humanReadPage, humanClick } from '../../utils/human.util.js';
import logger from '../../utils/logger.util.js';

const MAX_PROXY_RETRIES = 3;

/**
 * Custom Playwright scraper for Indian Embassy Paris (appointment.eoiparis.com)
 *
 * This bypasses the standard HTTP-based VFS/Laravel scraper because the Embassy
 * uses a custom web portal with dynamic dropdowns and no standard CSRF tokens.
 *
 * How it works:
 *   1. Navigate to the appointment page
 *   2. Detect and handle Cloudflare challenge if present
 *   3. Select the service type from the dropdown matching the category
 *   4. Wait for the calendar to render
 *   5. Scan for available date cells in the calendar
 *   6. For each available date, extract time slots
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
                    await pool.releasePage(page, context);
                    session = null;
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

            // Check for Cloudflare challenge
            const pageText = await page.content();
            if (pageText.toLowerCase().includes('cloudflare') && pageText.toLowerCase().includes('just a moment')) {
                logger.warn(`Cloudflare block detected for Indian Embassy. Attempt ${attempt + 1}`);
                if (proxy) proxyService.reportFailure(proxy, targetDomain);
                if (attempt < MAX_PROXY_RETRIES - 1) {
                    if (proxy) usedProxies.add(proxy.server);
                    await pool.releasePage(page, context);
                    session = null;
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

            // ── Step 1: Find and interact with service dropdown ──────
            logger.info(`Navigated to ${config.baseUrl} for category ${category.name}`);

            // Common selectors for the Indian Embassy appointment form
            const dropdownSelectors = [
                '#service_group',           // Main service dropdown
                'select[name="service"]',   // Alternative form
                '#appointment_type',        // Another common pattern
                'select.form-control',      // Generic Bootstrap select
                '#serviceId',               // ID-based service selector
            ];

            let dropdownFound = false;
            for (const selector of dropdownSelectors) {
                try {
                    const dropdown = await page.$(selector);
                    if (dropdown) {
                        // Get all options to find the one matching our category
                        const options = await page.$$eval(`${selector} option`, (opts: HTMLOptionElement[]) =>
                            opts.map((opt: HTMLOptionElement) => ({
                                value: opt.value,
                                text: opt.textContent?.trim() || '',
                            }))
                        );

                        logger.debug(`Found dropdown ${selector} with ${options.length} options`);

                        // Find the best matching option for this category
                        const categoryNameLower = category.name.toLowerCase();
                        const matchingOption = options.find(opt =>
                            opt.text.toLowerCase().includes(categoryNameLower) ||
                            categoryNameLower.includes(opt.text.toLowerCase())
                        ) || options.find(opt =>
                            opt.value === String(categoryId) ||
                            opt.value === category.name
                        );

                        if (matchingOption && matchingOption.value) {
                            await page.selectOption(selector, matchingOption.value);
                            logger.info(`Selected service: "${matchingOption.text}" (value=${matchingOption.value})`);
                            dropdownFound = true;
                            await randomDelay(1500, 3000);
                            break;
                        } else if (options.length > 1) {
                            // Select first non-empty option as fallback
                            const firstOption = options.find(o => o.value && o.value !== '');
                            if (firstOption) {
                                await page.selectOption(selector, firstOption.value);
                                logger.info(`Fallback: selected first service "${firstOption.text}"`);
                                dropdownFound = true;
                                await randomDelay(1500, 3000);
                                break;
                            }
                        }
                    }
                } catch (e) {
                    logger.debug(`Dropdown ${selector} not found or not interactable`);
                }
            }

            if (!dropdownFound) {
                logger.warn(`No service dropdown found for Indian Embassy category ${category.name}`);
            }

            // ── Step 2: Look for "Next" / "Continue" button ──────────
            const submitSelectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Next")',
                'button:has-text("Continue")',
                'button:has-text("Suivant")',
                '.btn-primary',
                '#submit_btn',
            ];

            for (const selector of submitSelectors) {
                try {
                    const btn = page.locator(selector).first();
                    if (await btn.isVisible({ timeout: 2000 })) {
                        await humanClick(page, selector);
                        await randomDelay(2000, 4000);
                        try {
                            await page.waitForLoadState('networkidle', { timeout: 10000 });
                        } catch { /* timeout ok */ }
                        logger.debug(`Clicked submit: ${selector}`);
                        break;
                    }
                } catch { /* not found */ }
            }

            // ── Step 3: Scan for available dates in calendar ─────────
            const availableDates: AvailableDate[] = [];
            let totalSlots = 0;

            // Common calendar selectors for appointment systems
            const calendarDateSelectors = [
                '.day-enabled',                    // Custom calendar
                'td.available',                    // Table-based calendar
                '.calendar-day:not(.disabled)',    // Generic calendar
                '.datepicker td:not(.disabled):not(.old):not(.new)', // Bootstrap datepicker
                '[data-available="true"]',         // Data attribute
                '.fc-event',                       // FullCalendar events
                '.slot-available',                 // Direct slot elements
            ];

            for (const selector of calendarDateSelectors) {
                try {
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        logger.info(`Found ${elements.length} available date(s) using ${selector}`);
                        for (const el of elements) {
                            const dateText = await el.textContent();
                            if (dateText && dateText.trim()) {
                                availableDates.push({
                                    date: dateText.trim(),
                                    slots: ['available'],
                                    serviceId: categoryId,
                                    serviceName: category.name,
                                });
                                totalSlots++;
                            }
                        }
                        break; // Found dates with this selector, stop trying others
                    }
                } catch {
                    // Selector not found
                }
            }

            // ── Step 4: Check page text for "no appointment" indicators ──
            if (totalSlots === 0) {
                const bodyText = await page.textContent('body').catch(() => '') || '';
                const lowerBody = bodyText.toLowerCase();

                const noSlotIndicators = [
                    'no appointment',
                    'no slot',
                    'not available',
                    'aucun rendez-vous',
                    'aucun créneau',
                    'no dates available',
                    'currently unavailable',
                    'fully booked',
                    'no open',
                ];

                const isConfirmedNoSlots = noSlotIndicators.some(ind => lowerBody.includes(ind));

                if (isConfirmedNoSlots) {
                    logger.info(`Indian Embassy: Confirmed no slots for ${category.name}`);
                } else {
                    // Page loaded but we couldn't find calendar OR no-slot indicator
                    // This might mean the page structure changed
                    const bodyLength = bodyText.length;
                    if (bodyLength < 500) {
                        logger.warn(`Indian Embassy: Page too short (${bodyLength} chars), possible block`);
                    } else {
                        logger.debug(`Indian Embassy: Page loaded (${bodyLength} chars) but no calendar found for ${category.name}`);
                    }
                }
            }

            // Mark proxy as successful
            if (proxy) proxyService.reportSuccess(proxy, targetDomain);

            await pool.releasePage(page, context);
            session = null;

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
            const failedProxy = session?.proxy;

            if (session) {
                await pool.releasePage(session.page, session.context).catch(() => { });
                session = null;
            }

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.warn(`Attempt ${attempt + 1} failed for ${config.id}: ${errorMessage}`);

            if (failedProxy) {
                proxyService.reportFailure(failedProxy, targetDomain);
                usedProxies.add(failedProxy.server);
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
