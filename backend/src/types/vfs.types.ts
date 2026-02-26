import type { Procedure } from '@prisma/client';

export interface VfsConfig {
  id: string;
  name: string;
  countryCode: string;       // e.g., 'ITA' for Italy
  destinationCountry: string; // e.g., 'Italy'
  sourceCountry: string;     // e.g., 'India'
  sourceCountryCode: string; // e.g., 'IND'
  baseUrl: string;
  appointmentUrl: string;
  checkInterval: number;
  centers: VfsCenter[];
  visaCategories: VfsVisaCategory[];
}

export interface VfsCenter {
  id: string;
  name: string;
  city: string;
  code: string;  // VFS center code
}

export interface VfsVisaCategory {
  id: string;
  name: string;
  code: string;
  procedures: Procedure[];
}

export interface VfsScrapeResult {
  status: 'slots_found' | 'no_slots' | 'error' | 'timeout' | 'captcha_blocked';
  centerId: string;
  centerName: string;
  categoryId: string;
  categoryName: string;
  slotsAvailable: number;
  availableDates: VfsAvailableDate[];
  bookingUrl: string;
  errorMessage?: string;
  responseTimeMs: number;
  screenshotPath?: string;
}

export interface VfsAvailableDate {
  date: string;
  slots: string[];
}

export interface VfsScrapeJobData {
  configId: string;
  centerId: string;
  categoryId: string;
}

export interface VfsBrowserSession {
  configId: string;
  lastUsed: number;
  isActive: boolean;
}
