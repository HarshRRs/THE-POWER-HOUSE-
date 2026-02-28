import type { Procedure } from '@prisma/client';

export interface PrefectureSelectors {
  availableSlot: string;
  noSlotIndicator?: string;
  slotDate?: string;
  slotTime?: string;
  cookieAccept?: string;
  procedureDropdown?: string;
  nextButton?: string;
  captchaDetect?: string;
}

export interface PrefectureConfig {
  id: string;
  name: string;
  department: string;
  region: string;
  tier: 1 | 2 | 3;
  bookingUrl: string;
  checkInterval: number;
  selectors: PrefectureSelectors;
  procedures: Procedure[];
  bookingSystem: 'ants' | 'custom' | 'prefenligne' | 'doctolib';
}

export interface ScrapeResult {
  status: 'slots_found' | 'no_slots' | 'error' | 'captcha' | 'timeout' | 'blocked';
  slotsAvailable: number;
  slotDate?: string;
  slotTime?: string;
  bookingUrl: string;
  screenshotPath?: string;
  errorMessage?: string;
  responseTimeMs: number;
  // URL tracking fields
  finalUrl?: string;
  redirectCount?: number;
  urlChanged?: boolean;
}

export interface ScrapeJobData {
  prefectureId: string;
}
