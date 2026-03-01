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
  // Additional selectors for different systems
  cityInput?: string;
  personsDropdown?: string;
  startDate?: string;
  endDate?: string;
  distanceSlider?: string;
  searchButton?: string;
  termsCheckbox?: string;
  submitButton?: string;
  manageButton?: string;
  takeAppointmentBtn?: string;
  manageAppointmentLink?: string;
  captchaInput?: string;
  captchaId?: string;
  captchaImage?: string;
  departmentDropdown?: string;
  // ANEF system
  loginButton?: string;
  franceConnectBtn?: string;
  emailInput?: string;
  passwordInput?: string;
  newApplicationBtn?: string;
  appointmentBtn?: string;
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
  bookingSystem: 'ants' | 'custom' | 'prefenligne' | 'doctolib' | 'rdv-prefecture' | 'ezbooking' | 'anef';
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
