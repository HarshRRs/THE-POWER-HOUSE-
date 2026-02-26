import type { Procedure } from '@prisma/client';

export interface ConsulateConfig {
  id: string;
  name: string;
  country: string;
  city: string;
  type: string;
  baseUrl: string;
  checkInterval: number;
  categories: ConsulateServiceCategory[];
}

export interface ConsulateServiceCategory {
  id: number;
  name: string;
  procedures: Procedure[];
}

export interface ConsulateScrapeResult {
  status: 'slots_found' | 'no_slots' | 'error' | 'timeout';
  category: number;
  categoryName: string;
  slotsAvailable: number;
  availableDates: AvailableDate[];
  bookingUrl: string;
  errorMessage?: string;
  responseTimeMs: number;
}

export interface AvailableDate {
  date: string;
  slots: string[];
  serviceId: number;
  serviceName: string;
}

export interface CsrfSession {
  token: string;
  cookies: string;
  fetchedAt: number;
}

export interface ConsulateScrapeJobData {
  consulateId: string;
  categoryId: number;
}
