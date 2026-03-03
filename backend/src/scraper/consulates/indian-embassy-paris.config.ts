import type { ConsulateConfig } from '../../types/consulate.types.js';

/**
 * Indian Embassy Paris — appointment.eoiparis.com
 *
 * IMPORTANT (as of Jan 2026):
 * VFS Global terminated operations for Indian Embassy Paris on 01-07-2025.
 * All CPV services (Passport, OCI, Visa, Birth Registration) are now handled
 * DIRECTLY at the Embassy: 20-22 Rue Alberic Magnard, Paris 75116.
 *
 * Miscellaneous consular services moved to e-SEWA portal (NOT this system).
 *
 * Slot release schedule:
 *   - BULK: 25th of each month at 09:00 → entire next month's slots open
 *   - WEEKLY: Every Friday at 09:00 → limited slots for following week
 *
 * Category IDs verified against appointment.eoiparis.com dropdown (2025-2026).
 */
export const INDIAN_EMBASSY_PARIS: ConsulateConfig = {
  id: 'indian-embassy-paris',
  name: 'Indian Embassy Paris',
  country: 'India',
  city: 'Paris',
  type: 'embassy',
  baseUrl: 'https://appointment.eoiparis.com',
  checkInterval: 180, // 3 minutes — increase to 30s on 25th & Fridays at 09:00
  categories: [
    // ─────────────────────────────────────────
    // PASSPORT SERVICES (Category ID: 3)
    // Covers: New passport, Renewal, Re-issue, Tatkal (urgent)
    // Highest demand category
    // ─────────────────────────────────────────
    {
      id: 3,
      name: 'Passport Services',
      procedures: [
        'PASSPORT_RENEWAL',
        'PASSPORT_REISSUE',
        'PASSPORT_NEW',
        'PASSPORT_TATKAL',
      ],
    },

    // ─────────────────────────────────────────
    // OCI CARD SERVICES (Category ID: 1)
    // Covers: OCI Registration, OCI Renewal, OCI misc changes
    // Second most popular category for Indian diaspora
    // ─────────────────────────────────────────
    {
      id: 1,
      name: 'OCI Services',
      procedures: [
        'OCI_REGISTRATION',
        'OCI_RENEWAL',
        'OCI_MISC',
      ],
    },

    // ─────────────────────────────────────────
    // VISA SERVICES (Category ID: 2)
    // Covers: Consular visa applications
    // ─────────────────────────────────────────
    {
      id: 2,
      name: 'Visa Services',
      procedures: [
        'VISA_CONSULAR',
      ],
    },

    // ─────────────────────────────────────────
    // BIRTH REGISTRATION (Category ID: 27)
    // Only for new births — NOT via e-SEWA
    // ─────────────────────────────────────────
    {
      id: 27,
      name: 'Birth Registration',
      procedures: [
        'BIRTH_REGISTRATION',
      ],
    },
  ],
};
