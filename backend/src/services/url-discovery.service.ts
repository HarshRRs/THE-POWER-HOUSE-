import type { Page } from 'playwright';
import { prisma } from '../config/database.js';
import type { PrefectureConfig } from '../types/prefecture.types.js';
import { broadcastToBossPanel } from './websocket.service.js';
import logger from '../utils/logger.util.js';

// French booking keywords to validate booking pages
const BOOKING_KEYWORDS = [
  'rendez-vous',
  'réservation',
  'reservation',
  'prendre un rendez-vous',
  'titre de séjour',
  'titre de sejour',
  'démarche',
  'demarche',
  'booking',
  'créneau',
  'creneau',
  'disponibilité',
  'disponibilite',
  'planning',
  'calendrier',
];

// Valid domains for French prefectures
const VALID_DOMAINS = [
  '.gouv.fr',
  'rdv-titres.apps.paris.fr',
  'doctolib.fr',
  'prefenligne.fr',
  'rdv-prefecture.interieur.gouv.fr',
];

// Keywords indicating a maintenance/error page (should not auto-update)
const MAINTENANCE_KEYWORDS = [
  'maintenance',
  'temporairement indisponible',
  'service indisponible',
  'erreur',
  'page non trouvée',
  '404',
  'not found',
];

export interface UrlValidationResult {
  isValid: boolean;
  confidence: number;
  indicators: {
    httpStatus: number;
    hasBookingKeywords: boolean;
    matchingKeywords: string[];
    matchingSelectors: string[];
    isGouvDomain: boolean;
    isMaintenance: boolean;
  };
}

export interface UrlChangeData {
  prefectureId: string;
  originalUrl: string;
  finalUrl: string;
  redirectChain: string[];
  page: Page;
  config: PrefectureConfig;
}

/**
 * Generate fallback URLs based on common French prefecture patterns
 */
export function generateFallbackUrls(config: PrefectureConfig): string[] {
  const { department, id } = config;
  
  // Extract department name from ID (e.g., 'paris_75' -> 'paris')
  const deptName = id.split('_')[0];
  
  // Common URL patterns used by French prefectures
  const patterns: string[] = [];
  
  // Standard ANTS booking pattern
  patterns.push(`https://www.${deptName}.gouv.fr/booking/create`);
  
  // With numeric suffix (common pattern)
  patterns.push(`https://www.${deptName}.gouv.fr/booking/create/${department}`);
  
  // Alternative paths
  patterns.push(`https://www.${deptName}.gouv.fr/prendre-rendez-vous`);
  patterns.push(`https://www.${deptName}.gouv.fr/demarches/rendez-vous`);
  
  // Central prefecture booking system
  patterns.push(`https://rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/${department}/`);
  
  // Filter out the current URL if present
  return patterns.filter(url => url !== config.bookingUrl);
}

/**
 * Check if a URL is on a valid French government domain
 */
export function isValidDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return VALID_DOMAINS.some(domain => urlObj.hostname.endsWith(domain) || urlObj.hostname.includes(domain.replace('.', '')));
  } catch {
    return false;
  }
}

/**
 * Validate if a URL is a valid booking page
 */
export async function validateBookingUrl(
  page: Page,
  url: string,
  selectors?: PrefectureConfig['selectors']
): Promise<UrlValidationResult> {
  const result: UrlValidationResult = {
    isValid: false,
    confidence: 0,
    indicators: {
      httpStatus: 0,
      hasBookingKeywords: false,
      matchingKeywords: [],
      matchingSelectors: [],
      isGouvDomain: isValidDomain(url),
      isMaintenance: false,
    },
  };
  
  try {
    // Navigate to URL
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    result.indicators.httpStatus = response?.status() || 0;
    
    // Check for HTTP errors
    if (!response || response.status() >= 400) {
      return result;
    }
    
    // Get page text content
    const pageContent = await page.textContent('body').catch(() => '') || '';
    const lowerContent = pageContent.toLowerCase();
    
    // Check for maintenance/error keywords
    for (const keyword of MAINTENANCE_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        result.indicators.isMaintenance = true;
        return result; // Don't validate maintenance pages
      }
    }
    
    // Check for booking keywords
    for (const keyword of BOOKING_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        result.indicators.matchingKeywords.push(keyword);
      }
    }
    result.indicators.hasBookingKeywords = result.indicators.matchingKeywords.length > 0;
    
    // Check for booking selectors if provided
    if (selectors) {
      const selectorsToCheck = [
        selectors.availableSlot,
        selectors.noSlotIndicator,
        selectors.procedureDropdown,
        selectors.nextButton,
      ].filter(Boolean);
      
      for (const selector of selectorsToCheck) {
        if (!selector) continue;
        // Check each selector in the comma-separated list
        const selectorParts = selector.split(',').map(s => s.trim());
        for (const part of selectorParts) {
          try {
            const element = await page.$(part);
            if (element) {
              result.indicators.matchingSelectors.push(part);
              break; // Found at least one matching part
            }
          } catch {
            // Selector invalid, skip
          }
        }
      }
    }
    
    // Calculate confidence score
    const httpScore = result.indicators.httpStatus === 200 ? 0.20 : 0;
    const keywordScore = result.indicators.hasBookingKeywords ? 
      Math.min(0.25, result.indicators.matchingKeywords.length * 0.08) : 0;
    const selectorScore = selectors ? 
      Math.min(0.30, result.indicators.matchingSelectors.length * 0.10) : 0.15; // Default if no selectors
    const domainScore = result.indicators.isGouvDomain ? 0.25 : 0;
    
    result.confidence = httpScore + keywordScore + selectorScore + domainScore;
    result.isValid = result.confidence >= 0.6 && !result.indicators.isMaintenance;
    
  } catch (error) {
    logger.error('URL validation error:', error);
  }
  
  return result;
}

/**
 * Try fallback URLs when primary URL fails
 */
export async function tryFallbackUrls(
  config: PrefectureConfig,
  page: Page
): Promise<{ url: string; confidence: number } | null> {
  const fallbackUrls = generateFallbackUrls(config);
  
  logger.info(`Trying ${fallbackUrls.length} fallback URLs for ${config.id}`);
  
  for (const url of fallbackUrls) {
    try {
      const validation = await validateBookingUrl(page, url, config.selectors);
      
      if (validation.isValid && validation.confidence >= 0.7) {
        logger.info(`Found valid fallback URL for ${config.id}: ${url} (confidence: ${validation.confidence})`);
        return { url, confidence: validation.confidence };
      }
    } catch (error) {
      logger.debug(`Fallback URL failed for ${config.id}: ${url}`, error);
    }
  }
  
  return null;
}

/**
 * Handle URL change detection
 */
export async function handleUrlChange(data: UrlChangeData): Promise<void> {
  const { prefectureId, originalUrl, finalUrl, redirectChain, page, config } = data;
  
  // Skip if URLs are the same (after normalization)
  const normalizedOriginal = originalUrl.replace(/\/$/, '').toLowerCase();
  const normalizedFinal = finalUrl.replace(/\/$/, '').toLowerCase();
  
  if (normalizedOriginal === normalizedFinal) {
    return;
  }
  
  logger.info(`URL change detected for ${prefectureId}: ${originalUrl} -> ${finalUrl}`);
  
  // Validate the new URL
  const validation = await validateBookingUrl(page, finalUrl, config.selectors);
  
  // Skip if it's a maintenance page
  if (validation.indicators.isMaintenance) {
    logger.warn(`Skipping URL change for ${prefectureId}: maintenance page detected`);
    return;
  }
  
  // Determine validation status based on confidence
  let validationStatus: 'AUTO_APPROVED' | 'PENDING' | 'REJECTED';
  
  if (validation.confidence >= 0.8) {
    validationStatus = 'AUTO_APPROVED';
  } else if (validation.confidence >= 0.6) {
    validationStatus = 'PENDING';
  } else {
    validationStatus = 'REJECTED';
  }
  
  // Create URL history record
  const urlHistory = await prisma.urlHistory.create({
    data: {
      prefectureId,
      oldUrl: originalUrl,
      newUrl: finalUrl,
      redirectChain: redirectChain,
      discoveryMethod: 'REDIRECT',
      validationStatus,
      confidence: validation.confidence,
      validationDetails: validation.indicators,
      appliedAt: validationStatus === 'AUTO_APPROVED' ? new Date() : null,
    },
  });
  
  // If auto-approved, update the prefecture URL
  if (validationStatus === 'AUTO_APPROVED') {
    await updatePrefectureUrl(prefectureId, finalUrl, urlHistory.id);
    
    // Broadcast success notification
    broadcastToBossPanel({
      type: 'url_auto_updated',
      prefectureId,
      oldUrl: originalUrl,
      newUrl: finalUrl,
      confidence: validation.confidence,
    });
  } else if (validationStatus === 'PENDING') {
    // Broadcast pending notification for admin review
    const prefecture = await prisma.prefecture.findUnique({
      where: { id: prefectureId },
      select: { name: true },
    });
    
    broadcastToBossPanel({
      type: 'url_change_detected',
      prefectureId,
      prefectureName: prefecture?.name || prefectureId,
      oldUrl: originalUrl,
      newUrl: finalUrl,
      confidence: validation.confidence,
      requiresApproval: true,
      urlHistoryId: urlHistory.id,
    });
  }
  
  logger.info(`URL change for ${prefectureId}: status=${validationStatus}, confidence=${validation.confidence}`);
}

/**
 * Update prefecture URL in database
 */
export async function updatePrefectureUrl(
  prefectureId: string,
  newUrl: string,
  urlHistoryId?: string
): Promise<void> {
  // Get current URL to preserve as original if not set
  const current = await prisma.prefecture.findUnique({
    where: { id: prefectureId },
    select: { bookingUrl: true, originalBookingUrl: true },
  });
  
  await prisma.prefecture.update({
    where: { id: prefectureId },
    data: {
      bookingUrl: newUrl,
      originalBookingUrl: current?.originalBookingUrl || current?.bookingUrl,
      urlLastValidatedAt: new Date(),
      urlConsecutiveFailures: 0,
    },
  });
  
  // Update URL history if provided
  if (urlHistoryId) {
    await prisma.urlHistory.update({
      where: { id: urlHistoryId },
      data: { appliedAt: new Date() },
    });
  }
  
  logger.info(`Updated booking URL for ${prefectureId}: ${newUrl}`);
}

/**
 * Increment URL failure counter
 */
export async function incrementUrlFailure(prefectureId: string): Promise<number> {
  const result = await prisma.prefecture.update({
    where: { id: prefectureId },
    data: {
      urlConsecutiveFailures: { increment: 1 },
    },
    select: { urlConsecutiveFailures: true },
  });
  
  return result.urlConsecutiveFailures;
}

/**
 * Reset URL failure counter
 */
export async function resetUrlFailure(prefectureId: string): Promise<void> {
  await prisma.prefecture.update({
    where: { id: prefectureId },
    data: { urlConsecutiveFailures: 0 },
  });
}

/**
 * Get pending URL changes for admin review
 */
export async function getPendingUrlChanges() {
  return prisma.urlHistory.findMany({
    where: { validationStatus: 'PENDING' },
    include: {
      prefecture: {
        select: { name: true, department: true, region: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Approve a pending URL change
 */
export async function approveUrlChange(urlHistoryId: string): Promise<void> {
  const urlHistory = await prisma.urlHistory.findUnique({
    where: { id: urlHistoryId },
  });
  
  if (!urlHistory || urlHistory.validationStatus !== 'PENDING') {
    throw new Error('URL change not found or already processed');
  }
  
  // Update URL history status
  await prisma.urlHistory.update({
    where: { id: urlHistoryId },
    data: {
      validationStatus: 'VALIDATED',
      appliedAt: new Date(),
    },
  });
  
  // Update prefecture URL
  await updatePrefectureUrl(urlHistory.prefectureId, urlHistory.newUrl);
  
  logger.info(`Admin approved URL change for ${urlHistory.prefectureId}: ${urlHistory.newUrl}`);
}

/**
 * Reject a pending URL change
 */
export async function rejectUrlChange(urlHistoryId: string): Promise<void> {
  const urlHistory = await prisma.urlHistory.findUnique({
    where: { id: urlHistoryId },
  });
  
  if (!urlHistory || urlHistory.validationStatus !== 'PENDING') {
    throw new Error('URL change not found or already processed');
  }
  
  // Update URL history status
  await prisma.urlHistory.update({
    where: { id: urlHistoryId },
    data: { validationStatus: 'REJECTED' },
  });
  
  // Increment failure counter
  await incrementUrlFailure(urlHistory.prefectureId);
  
  logger.info(`Admin rejected URL change for ${urlHistory.prefectureId}`);
}

/**
 * Manually update a prefecture URL
 */
export async function manualUrlUpdate(
  prefectureId: string,
  newUrl: string,
  adminUserId?: string
): Promise<void> {
  const current = await prisma.prefecture.findUnique({
    where: { id: prefectureId },
    select: { bookingUrl: true },
  });
  
  if (!current) {
    throw new Error('Prefecture not found');
  }
  
  // Create URL history record
  await prisma.urlHistory.create({
    data: {
      prefectureId,
      oldUrl: current.bookingUrl,
      newUrl,
      redirectChain: [],
      discoveryMethod: 'ADMIN_UPDATE',
      validationStatus: 'VALIDATED',
      confidence: 1.0,
      appliedAt: new Date(),
      discoveredBy: adminUserId,
    },
  });
  
  // Update prefecture
  await updatePrefectureUrl(prefectureId, newUrl);
  
  logger.info(`Manual URL update for ${prefectureId} by admin ${adminUserId}: ${newUrl}`);
}
