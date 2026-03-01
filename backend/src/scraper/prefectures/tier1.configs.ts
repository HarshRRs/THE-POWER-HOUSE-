import type { PrefectureConfig } from '../../types/prefecture.types.js';

// Île-de-France prefectures - TIER 1 (30s check interval)
// These have the highest demand and need maximum scraping frequency
// 
// UPDATED: All URLs verified and corrected based on investigation
// - 3 prefectures WITHOUT CAPTCHA: Paris (ANTS), Bobigny (ezbooking), Lyon (ANEF)
// - 7 prefectures WITH CAPTCHA: Use RDV-Préfecture system (2Captcha required)

export const TIER1_PREFECTURES: PrefectureConfig[] = [
  // ═══════════════════════════════════════
  // PARIS (75) - ANTS National Platform - NO CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'paris_75',
    name: 'Paris',
    department: '75',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://rendezvouspasseport.ants.gouv.fr/',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: {
      cityInput: '#Recherchez-une-ville',
      procedureDropdown: '#selectMotif',
      personsDropdown: '#selectPersonDesktop',
      startDate: '#start-date',
      endDate: '#end-date',
      distanceSlider: '#rangeInput',
      searchButton: '#search-btn',
      cookieAccept: 'button.tarteaucitronAllow, .cookie-accept-btn',
      availableSlot: '.fr-table tbody tr, .appointment-slot, [data-slot]',
      noSlotIndicator: '.no-appointment, .alert-warning, .aucun-creneau',
      captchaDetect: '', // NO CAPTCHA
    },
    procedures: ['CARTE_IDENTITE', 'PASSEPORT', 'TITRE_SEJOUR'],
  },
  
  // ═══════════════════════════════════════
  // SEINE-SAINT-DENIS (93) - Bobigny - ezbooking - NO CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'bobigny_93',
    name: 'Bobigny (Seine-Saint-Denis)',
    department: '93',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.seine-saint-denis.gouv.fr/index.php/booking/create/16105',
    checkInterval: 30,
    bookingSystem: 'ezbooking',
    selectors: {
      termsCheckbox: 'input#condition',
      submitButton: 'input[name="nextButton"]',
      manageButton: 'input[name="manageButton"]',
      noSlotIndicator: 'main ul li, .alert-warning',
      availableSlot: '.slot-available, .creneau, .calendar-day.available',
      slotDate: '.date, .slot-date',
      slotTime: '.heure, .slot-time',
      cookieAccept: '.cookie-accept, .tarteaucitronAllow',
      captchaDetect: '', // NO CAPTCHA
    },
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // VAL-DE-MARNE (94) - Créteil - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'creteil_94',
    name: 'Créteil (Val-de-Marne)',
    department: '94',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/',
    checkInterval: 30,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      takeAppointmentBtn: '.q-btn.bg-primary.text-white, a[href*="cgu"]',
      manageAppointmentLink: 'a[href*="/login/"]',
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.q-btn--unelevated, .slot-available',
      noSlotIndicator: '.text-warning, .aucun-creneau',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR'],
  },
  
  // ═══════════════════════════════════════
  // HAUTS-DE-SEINE (92) - Nanterre - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'nanterre_92',
    name: 'Nanterre (Hauts-de-Seine)',
    department: '92',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1922/',
    checkInterval: 30,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      takeAppointmentBtn: '.q-btn.bg-primary.text-white',
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      nextButton: 'button.q-btn--standard.bg-primary',
      availableSlot: '.slot-available, .calendar-day',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // ESSONNE (91) - Évry - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'evry_91',
    name: 'Évry (Essonne)',
    department: '91',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/2200/',
    checkInterval: 30,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.slot-available',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // VAL-D'OISE (95) - Cergy-Pontoise - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'cergy_95',
    name: 'Cergy-Pontoise (Val-d\'Oise)',
    department: '95',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/',
    checkInterval: 30,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      departmentDropdown: 'select[name="department"], .department-select',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.slot-available',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR'],
  },
  
  // ═══════════════════════════════════════
  // SEINE-ET-MARNE (77) - Melun - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'melun_77',
    name: 'Melun (Seine-et-Marne)',
    department: '77',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/',
    checkInterval: 30,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      departmentDropdown: 'select[name="department"], .department-select',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.slot-available',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR'],
  },
  
  // ═══════════════════════════════════════
  // YVELINES (78) - Versailles - RDV-Préfecture - CAPTCHA
  // ═══════════════════════════════════════
  {
    id: 'versailles_78',
    name: 'Versailles (Yvelines)',
    department: '78',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1040/',
    checkInterval: 30,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      captchaImage: 'img[src^="data:image/png;base64"]',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.slot-available',
      noSlotIndicator: '.aucun-creneau, .text-warning',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
];

export default TIER1_PREFECTURES;
