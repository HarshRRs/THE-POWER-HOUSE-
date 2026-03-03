import type { PrefectureConfig } from '../../types/prefecture.types.js';

// Île-de-France prefectures - TIER 1 (3-minute check interval)
// Each prefecture now has ALL real sub-categories as separate procedures.
// Demarche codes verified from rdv-prefecture.interieur.gouv.fr (2024-2025).

export const TIER1_PREFECTURES: PrefectureConfig[] = [
  // ═══════════════════════════════════════
  // PARIS (75) - ANTS National Platform - NO CAPTCHA
  // Categories: Passeport, Carte Nationale d'Identité only
  // ═══════════════════════════════════════
  {
    id: 'paris_75',
    name: 'Paris',
    department: '75',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://rendezvouspasseport.ants.gouv.fr/',
    checkInterval: 180,
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
    // ANTS handles only French identity documents
    procedures: ['CARTE_IDENTITE', 'PASSEPORT'],
  },

  // ═══════════════════════════════════════
  // SEINE-SAINT-DENIS (93) - Bobigny - ezbooking - NO CAPTCHA
  // Single demarche page — covers Titre de séjour + Naturalisation
  // ═══════════════════════════════════════
  {
    id: 'bobigny_93',
    name: 'Bobigny (Seine-Saint-Denis)',
    department: '93',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.seine-saint-denis.gouv.fr/index.php/booking/create/16105',
    checkInterval: 180,
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
  // All real demarche sub-categories for Créteil
  // ═══════════════════════════════════════
  {
    id: 'creteil_94',
    name: 'Créteil (Val-de-Marne)',
    department: '94',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/',
    checkInterval: 180,
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
    // All real sub-categories tracked — each gets its own demarche job via categories config
    procedures: [
      'TITRE_SEJOUR',               // Generic / Remise de titre prêt (16040)
      'TITRE_SEJOUR_SALARIE',       // Renouvellement salarié
      'TITRE_SEJOUR_ETUDIANT',      // Renouvellement étudiant
      'TITRE_SEJOUR_VPF',           // Vie privée et familiale
      'TITRE_SEJOUR_RENOUVELLEMENT',// Renouvellement générique
      'TITRE_SEJOUR_DUPLICATA',     // Duplicata perte/vol
      'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
      'NATURALISATION',
    ],
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
    checkInterval: 180,
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
    procedures: [
      'TITRE_SEJOUR',
      'TITRE_SEJOUR_SALARIE',
      'TITRE_SEJOUR_ETUDIANT',
      'TITRE_SEJOUR_VPF',
      'TITRE_SEJOUR_RENOUVELLEMENT',
      'TITRE_SEJOUR_DUPLICATA',
      'TITRE_SEJOUR_ENTREPRENEUR',
      'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
      'NATURALISATION',
    ],
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
      'TITRE_SEJOUR_ENTREPRENEUR',
      'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
      'NATURALISATION',
    ],
  },

  // ═══════════════════════════════════════
  // VAL-D'OISE (95) - Cergy-Pontoise - RDV-Préfecture - CAPTCHA
  // Two guichets: 1380 (main) + 9481 (overflow)
  // ═══════════════════════════════════════
  {
    id: 'cergy_95',
    name: 'Cergy-Pontoise (Val-d\'Oise)',
    department: '95',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/1380/',
    checkInterval: 180,
    bookingSystem: 'rdv-prefecture',
    selectors: {
      takeAppointmentBtn: '.q-btn.bg-primary.text-white, a[href*="cgu"]',
      captchaInput: 'input[name="captchaUsercode"]',
      captchaId: 'input[name="captchaId"]',
      nextButton: 'button.q-btn.bg-primary',
      availableSlot: '.q-btn--unelevated, .slot-available',
      noSlotIndicator: '.text-warning, .aucun-creneau',
      captchaDetect: 'input[name="captchaUsercode"]',
    },
    procedures: [
      'TITRE_SEJOUR',
      'TITRE_SEJOUR_SALARIE',
      'TITRE_SEJOUR_ETUDIANT',
      'TITRE_SEJOUR_VPF',
      'TITRE_SEJOUR_RENOUVELLEMENT',
      'TITRE_SEJOUR_DUPLICATA',
      'TITRE_SEJOUR_ENTREPRENEUR',
      'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
    ],
  },

  // ═══════════════════════════════════════
  // SEINE-ET-MARNE (77) - Melun - ANEF Platform - NO CAPTCHA
  // ANEF: Première demande + Renouvellement titre de séjour
  // ═══════════════════════════════════════
  {
    id: 'melun_77',
    name: 'Melun (Seine-et-Marne)',
    department: '77',
    region: 'Île-de-France',
    tier: 1,
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
    ],
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
    checkInterval: 180,
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
    procedures: [
      'TITRE_SEJOUR',
      'TITRE_SEJOUR_SALARIE',
      'TITRE_SEJOUR_ETUDIANT',
      'TITRE_SEJOUR_VPF',
      'TITRE_SEJOUR_RENOUVELLEMENT',
      'TITRE_SEJOUR_DUPLICATA',
      'TITRE_SEJOUR_ENTREPRENEUR',
      'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
      'NATURALISATION',
    ],
  },
];

export default TIER1_PREFECTURES;
