import type { PrefectureConfig } from '../../types/prefecture.types.js';

// Major cities prefectures - TIER 2 (3-minute check interval)

export const TIER2_PREFECTURES: PrefectureConfig[] = [
  // ═══════════════════════════════════════
  // RHÔNE (69) - Lyon - ANEF Platform - NO CAPTCHA
  // ANEF categories: Première demande + Renouvellement + Naturalisation
  // ═══════════════════════════════════════
  {
    id: 'lyon_69',
    name: 'Lyon (Rhône)',
    department: '69',
    region: 'Auvergne-Rhône-Alpes',
    tier: 2,
    bookingUrl: 'https://administration-etrangers-en-france.interieur.gouv.fr/',
    checkInterval: 180,
    bookingSystem: 'anef',
    selectors: {
      loginButton: '.fr-btn, button.fr-btn',
      franceConnectBtn: '#franceconnect-button, .france-connect-btn',
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      newApplicationBtn: 'a[href*="nouvelle"], .new-application',
      appointmentBtn: 'a[href*="rendez-vous"], .appointment-link',
      availableSlot: '.slot-available, .creneau, .calendar-day.available, .fr-table tbody tr',
      noSlotIndicator: '.no-appointment, .alert-warning, .aucun-creneau',
      cookieAccept: '.tarteaucitronAllow, .cookie-accept',
      captchaDetect: '', // NO CAPTCHA
    },
    procedures: [
      'TITRE_SEJOUR',               // Première demande
      'TITRE_SEJOUR_RENOUVELLEMENT',// Renouvellement
      'NATURALISATION',             // Naturalisation (Lyon only)
    ],
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
    checkInterval: 180,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.slot-available',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: [
      'TITRE_SEJOUR',
      'TITRE_SEJOUR_SALARIE',
      'TITRE_SEJOUR_ETUDIANT',
      'TITRE_SEJOUR_VPF',
      'TITRE_SEJOUR_RENOUVELLEMENT',
      'TITRE_SEJOUR_DUPLICATA',
    ],
  },
];

export default TIER2_PREFECTURES;
