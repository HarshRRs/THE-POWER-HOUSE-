import type { PrefectureConfig } from '../../types/prefecture.types.js';

// Major cities prefectures - TIER 2 (60s check interval)
// UPDATED: Only Lyon and Moulins based on investigation

export const TIER2_PREFECTURES: PrefectureConfig[] = [
  // ═══════════════════════════════════════
  // RHÔNE (69) - Lyon - ANEF Platform - NO CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'lyon_69',
    name: 'Lyon (Rhône)',
    department: '69',
    region: 'Auvergne-Rhône-Alpes',
    tier: 2,
    // ANEF = Administration Numérique des Étrangers en France
    // National platform for first-time residence permit applications
    bookingUrl: 'https://administration-etrangers-en-france.interieur.gouv.fr/',
    checkInterval: 60,
    bookingSystem: 'anef',
    selectors: {
      // ANEF uses FranceConnect or email login
      loginButton: '.fr-btn, button.fr-btn',
      franceConnectBtn: '#franceconnect-button, .france-connect-btn',
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      // Navigation
      newApplicationBtn: 'a[href*="nouvelle"], .new-application',
      appointmentBtn: 'a[href*="rendez-vous"], .appointment-link',
      // Calendar
      availableSlot: '.slot-available, .creneau, .calendar-day.available, .fr-table tbody tr',
      noSlotIndicator: '.no-appointment, .alert-warning, .aucun-creneau',
      cookieAccept: '.tarteaucitronAllow, .cookie-accept',
      captchaDetect: '', // NO CAPTCHA
    },
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // ALLIER (03) - Moulins - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'moulins_03',
    name: 'Moulins (Allier)',
    department: '03',
    region: 'Auvergne-Rhône-Alpes',
    tier: 2,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/4418/',
    checkInterval: 60,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.slot-available',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR'],
  },
];

export default TIER2_PREFECTURES;
