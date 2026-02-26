import type { ConsulateConfig, ConsulateScrapeResult, CsrfSession, AvailableDate } from '../types/consulate.types.js';
import { CONSULATE_CONFIG } from '../config/constants.js';
import logger from '../utils/logger.util.js';

// CSRF session cache per consulate
const csrfCache = new Map<string, CsrfSession>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract CSRF token and cookies from the landing page
 */
async function fetchCsrfSession(baseUrl: string): Promise<CsrfSession> {
  const response = await fetch(baseUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CSRF token: HTTP ${response.status}`);
  }

  const html = await response.text();

  // Extract CSRF token from <input name="_token" value="...">
  const tokenMatch = html.match(/<input[^>]*name=["']_token["'][^>]*value=["']([^"']+)["']/);
  if (!tokenMatch) {
    throw new Error('CSRF token not found in page HTML');
  }

  // Extract cookies from response headers
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  const cookies = setCookieHeaders
    .map((c) => c.split(';')[0])
    .join('; ');

  return {
    token: tokenMatch[1],
    cookies,
    fetchedAt: Date.now(),
  };
}

/**
 * Get a valid CSRF session, using cache if still fresh
 */
async function getCsrfSession(consulateId: string, baseUrl: string): Promise<CsrfSession> {
  const cached = csrfCache.get(consulateId);

  if (cached && (Date.now() - cached.fetchedAt) < CONSULATE_CONFIG.csrfTokenTtlMs) {
    return cached;
  }

  logger.debug(`Fetching fresh CSRF session for ${consulateId}`);
  const session = await fetchCsrfSession(baseUrl);
  csrfCache.set(consulateId, session);
  return session;
}

/**
 * Invalidate cached CSRF session (e.g. on 419 error)
 */
function invalidateCsrfSession(consulateId: string): void {
  csrfCache.delete(consulateId);
}

/**
 * Fetch available services and blocked dates for a category
 */
async function fetchServices(
  baseUrl: string,
  categoryId: number,
  session: CsrfSession
): Promise<{ services: Array<{ id: number; name: string }>; noDates: string[] }> {
  const response = await fetch(`${baseUrl}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': session.cookies,
      'X-CSRF-TOKEN': session.token,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      category: categoryId,
      _token: session.token,
    }),
  });

  if (response.status === 419 || response.status === 422) {
    throw new TokenExpiredError('CSRF token expired');
  }

  if (!response.ok) {
    throw new Error(`Services API returned HTTP ${response.status}`);
  }

  const json = await response.json() as {
    data?: {
      services?: Array<{ id: number; name: string }>;
      no_dates?: string[];
    };
  };

  return {
    services: json.data?.services || [],
    noDates: json.data?.no_dates || [],
  };
}

/**
 * Check available time slots for a specific date and service
 */
async function fetchTimeSlots(
  baseUrl: string,
  date: string,
  serviceId: number,
  categoryId: number,
  session: CsrfSession
): Promise<string[]> {
  const response = await fetch(`${baseUrl}/time_slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': session.cookies,
      'X-CSRF-TOKEN': session.token,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      appmnt_date: date,
      service: serviceId,
      category: categoryId,
      _token: session.token,
    }),
  });

  if (response.status === 419 || response.status === 422) {
    throw new TokenExpiredError('CSRF token expired');
  }

  if (!response.ok) {
    return [];
  }

  const text = await response.text();

  // The response is HTML with time slot elements
  // Parse time slots from patterns like: value="09:00" or >09:00<
  const slots: string[] = [];
  const slotRegex = /(?:value=["'](\d{2}:\d{2})["']|>(\d{2}:\d{2})<)/g;
  let match: RegExpExecArray | null;
  while ((match = slotRegex.exec(text)) !== null) {
    const slot = match[1] || match[2];
    if (slot && !slots.includes(slot)) {
      slots.push(slot);
    }
  }

  return slots;
}

/**
 * Generate candidate dates to check (next N days excluding weekends and blocked dates)
 */
function generateCandidateDates(noDates: string[], maxDates: number): string[] {
  const candidates: string[] = [];
  const today = new Date();

  // Convert no_dates to a Set for O(1) lookup
  // no_dates from API are in "YYYY-MM-DD" format
  const blockedSet = new Set(noDates);

  for (let i = 1; i <= 90 && candidates.length < maxDates; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Format as YYYY-MM-DD for blocked check
    const isoDate = date.toISOString().split('T')[0];
    if (blockedSet.has(isoDate)) continue;

    // Format as DD-MM-YYYY for the API (the format the site expects)
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    candidates.push(`${dd}-${mm}-${yyyy}`);
  }

  return candidates;
}

class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

/**
 * Main scraper function for a consulate category
 */
export async function scrapeConsulate(
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

  const attemptScrape = async (isRetry: boolean): Promise<ConsulateScrapeResult> => {
    // Get CSRF session
    const session = await getCsrfSession(config.id, config.baseUrl);

    try {
      // 1. Fetch services and blocked dates
      const { services, noDates } = await fetchServices(
        config.baseUrl,
        categoryId,
        session
      );

      if (services.length === 0) {
        return {
          status: 'no_slots',
          category: categoryId,
          categoryName: category.name,
          slotsAvailable: 0,
          availableDates: [],
          bookingUrl: config.baseUrl,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // 2. Generate candidate dates
      const candidateDates = generateCandidateDates(
        noDates,
        CONSULATE_CONFIG.maxDatesToCheck
      );

      if (candidateDates.length === 0) {
        logger.debug(`No candidate dates available for ${config.id}/${category.name}`);
        return {
          status: 'no_slots',
          category: categoryId,
          categoryName: category.name,
          slotsAvailable: 0,
          availableDates: [],
          bookingUrl: config.baseUrl,
          responseTimeMs: Date.now() - startTime,
        };
      }

      // 3. Check time slots for each date (use first service)
      const primaryService = services[0];
      const availableDates: AvailableDate[] = [];
      let totalSlots = 0;

      for (const date of candidateDates) {
        await delay(CONSULATE_CONFIG.requestDelayMs);

        const slots = await fetchTimeSlots(
          config.baseUrl,
          date,
          primaryService.id,
          categoryId,
          session
        );

        if (slots.length > 0) {
          availableDates.push({
            date,
            slots,
            serviceId: primaryService.id,
            serviceName: primaryService.name,
          });
          totalSlots += slots.length;

          logger.info(
            `SLOTS FOUND: ${slots.length} on ${date} for ${config.name}/${category.name} (${primaryService.name})`
          );
        }
      }

      if (totalSlots > 0) {
        return {
          status: 'slots_found',
          category: categoryId,
          categoryName: category.name,
          slotsAvailable: totalSlots,
          availableDates,
          bookingUrl: `${config.baseUrl}/application`,
          responseTimeMs: Date.now() - startTime,
        };
      }

      return {
        status: 'no_slots',
        category: categoryId,
        categoryName: category.name,
        slotsAvailable: 0,
        availableDates: [],
        bookingUrl: config.baseUrl,
        responseTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError && !isRetry) {
        logger.warn(`CSRF token expired for ${config.id}, refreshing and retrying`);
        invalidateCsrfSession(config.id);
        return attemptScrape(true);
      }
      throw error;
    }
  };

  try {
    return await attemptScrape(false);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
