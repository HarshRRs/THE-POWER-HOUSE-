import type { PrefectureConfig } from '../../types/prefecture.types.js';

// Île-de-France prefectures - TIER 1 (30s check interval)
// These have the highest demand and need maximum scraping frequency
// 
// IMPORTANT: French prefecture booking systems:
// 1. ANEF (administration-etrangers-en-france.interieur.gouv.fr) - National system for first-time applications
// 2. Prefecture-specific booking (gouv.fr/booking) - For renewals and some procedures
// 3. Custom systems (Paris uses rdv-titres.apps.paris.fr)
//
// Most use the standard gouv.fr booking platform which has consistent selectors

// Common selectors for the standard gouv.fr booking platform
const GOUV_BOOKING_SELECTORS = {
  // Available slots are shown in calendar or list format
  availableSlot: [
    '.fc-event',                           // FullCalendar event (many prefectures use this)
    '.slot-available',                     // Standard slot class
    '.creneau-disponible',                 // French "available slot"
    '.day-cell.available',                 // Calendar day available
    'button.slot:not([disabled])',         // Clickable slot button
    '.time-slot:not(.disabled)',           // Time slot not disabled
    'a.btn-success',                       // Green success button (available)
    '[data-available="true"]',             // Data attribute marking availability
  ].join(', '),
  
  // No availability indicators
  noSlotIndicator: [
    '.alert-warning',                      // Bootstrap warning alert
    '.alert-info',                         // Info alert (often "no slots")
    '.no-availability',                    // No availability message
    '.aucun-creneau',                      // French "no slot"
    '.text-danger',                        // Red text usually means no slots
    '.message-info',                       // Info message
  ].join(', '),
  
  // Date/time extraction
  slotDate: '.fc-event-title, .slot-date, .date-creneau, .day-label',
  slotTime: '.fc-event-time, .slot-time, .heure-creneau, .time-label',
  
  // Cookie consent (French RGPD compliance)
  cookieAccept: [
    '#tarteaucitronAllDenied2',            // Tarteaucitron deny all (common French cookie banner)
    '.tarteaucitronAllow',                 // Tarteaucitron allow
    '#cookie-consent-accept',              // Standard accept button
    '.cookie-accept',                      // Generic accept class
    'button[data-consent="accept"]',       // Data consent button
    '#onetrust-accept-btn-handler',        // OneTrust accept
  ].join(', '),
  
  // Form elements
  procedureDropdown: 'select#planning, select[name="planning"], select#motif, select[name="motif"]',
  nextButton: 'button[type="submit"], .btn-primary, input[type="submit"]',
  
  // CAPTCHA detection
  captchaDetect: [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '.g-recaptcha',
    '.h-captcha',
    '#cf-wrapper',                         // Cloudflare
  ].join(', '),
};

export const TIER1_PREFECTURES: PrefectureConfig[] = [
  // ═══════════════════════════════════════
  // PARIS (75) - Custom system
  // ═══════════════════════════════════════
  {
    id: 'paris_75',
    name: 'Paris',
    department: '75',
    region: 'Île-de-France',
    tier: 1,
    // Paris uses its own booking system
    bookingUrl: 'https://rdv-titres.apps.paris.fr/',
    checkInterval: 30,
    bookingSystem: 'custom',
    selectors: {
      availableSlot: '.slot-available, .creneau-libre, .fc-event, button.btn-success:not([disabled])',
      noSlotIndicator: '.alert-warning, .aucun-creneau, .no-slot, .text-muted',
      slotDate: '.slot-date, .date-rdv',
      slotTime: '.slot-time, .heure-rdv',
      cookieAccept: '#tarteaucitronAllDenied2, .tarteaucitronAllow, #cookie-accept',
      captchaDetect: 'iframe[src*="recaptcha"], .g-recaptcha',
    },
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // SEINE-SAINT-DENIS (93) - Bobigny
  // ═══════════════════════════════════════
  {
    id: 'bobigny_93',
    name: 'Bobigny (Seine-Saint-Denis)',
    department: '93',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.seine-saint-denis.gouv.fr/booking/create/9497',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION', 'VISA'],
  },
  
  // ═══════════════════════════════════════
  // VAL-DE-MARNE (94) - Créteil
  // ═══════════════════════════════════════
  {
    id: 'creteil_94',
    name: 'Créteil (Val-de-Marne)',
    department: '94',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.val-de-marne.gouv.fr/booking/create/14066',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // HAUTS-DE-SEINE (92) - Nanterre
  // ═══════════════════════════════════════
  {
    id: 'nanterre_92',
    name: 'Nanterre (Hauts-de-Seine)',
    department: '92',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.hauts-de-seine.gouv.fr/booking/create/9359',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // ESSONNE (91) - Évry
  // ═══════════════════════════════════════
  {
    id: 'evry_91',
    name: 'Évry (Essonne)',
    department: '91',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.essonne.gouv.fr/booking/create/10498',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // VAL-D'OISE (95) - Cergy-Pontoise
  // ═══════════════════════════════════════
  {
    id: 'cergy_95',
    name: 'Cergy-Pontoise (Val-d\'Oise)',
    department: '95',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.val-doise.gouv.fr/booking/create/13814',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // SEINE-ET-MARNE (77) - Melun
  // ═══════════════════════════════════════
  {
    id: 'melun_77',
    name: 'Melun (Seine-et-Marne)',
    department: '77',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.seine-et-marne.gouv.fr/booking/create/11157',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // YVELINES (78) - Versailles
  // ═══════════════════════════════════════
  {
    id: 'versailles_78',
    name: 'Versailles (Yvelines)',
    department: '78',
    region: 'Île-de-France',
    tier: 1,
    bookingUrl: 'https://www.yvelines.gouv.fr/booking/create/12647',
    checkInterval: 30,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
];

export default TIER1_PREFECTURES;
