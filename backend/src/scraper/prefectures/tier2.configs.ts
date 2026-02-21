import type { PrefectureConfig } from '../../types/prefecture.types.js';

// Major cities prefectures - TIER 2 (60s check interval)
// These are high-demand prefectures outside Île-de-France

// Common selectors for the standard gouv.fr booking platform
const GOUV_BOOKING_SELECTORS = {
  availableSlot: [
    '.fc-event',
    '.slot-available',
    '.creneau-disponible',
    '.day-cell.available',
    'button.slot:not([disabled])',
    '.time-slot:not(.disabled)',
    'a.btn-success',
    '[data-available="true"]',
  ].join(', '),
  noSlotIndicator: [
    '.alert-warning',
    '.alert-info',
    '.no-availability',
    '.aucun-creneau',
    '.text-danger',
    '.message-info',
  ].join(', '),
  slotDate: '.fc-event-title, .slot-date, .date-creneau, .day-label',
  slotTime: '.fc-event-time, .slot-time, .heure-creneau, .time-label',
  cookieAccept: [
    '#tarteaucitronAllDenied2',
    '.tarteaucitronAllow',
    '#cookie-consent-accept',
    '.cookie-accept',
    'button[data-consent="accept"]',
    '#onetrust-accept-btn-handler',
  ].join(', '),
  procedureDropdown: 'select#planning, select[name="planning"], select#motif, select[name="motif"]',
  nextButton: 'button[type="submit"], .btn-primary, input[type="submit"]',
  captchaDetect: [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '.g-recaptcha',
    '.h-captcha',
    '#cf-wrapper',
  ].join(', '),
};

export const TIER2_PREFECTURES: PrefectureConfig[] = [
  // ═══════════════════════════════════════
  // RHÔNE (69) - Lyon
  // ═══════════════════════════════════════
  {
    id: 'lyon_69',
    name: 'Lyon (Rhône)',
    department: '69',
    region: 'Auvergne-Rhône-Alpes',
    tier: 2,
    bookingUrl: 'https://www.rhone.gouv.fr/booking/create/41799',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // BOUCHES-DU-RHÔNE (13) - Marseille
  // ═══════════════════════════════════════
  {
    id: 'marseille_13',
    name: 'Marseille (Bouches-du-Rhône)',
    department: '13',
    region: 'Provence-Alpes-Côte d\'Azur',
    tier: 2,
    bookingUrl: 'https://www.bouches-du-rhone.gouv.fr/booking/create/4896',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // HAUTE-GARONNE (31) - Toulouse
  // ═══════════════════════════════════════
  {
    id: 'toulouse_31',
    name: 'Toulouse (Haute-Garonne)',
    department: '31',
    region: 'Occitanie',
    tier: 2,
    bookingUrl: 'https://www.haute-garonne.gouv.fr/booking/create/8242',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // NORD (59) - Lille
  // ═══════════════════════════════════════
  {
    id: 'lille_59',
    name: 'Lille (Nord)',
    department: '59',
    region: 'Hauts-de-France',
    tier: 2,
    bookingUrl: 'https://www.nord.gouv.fr/booking/create/10015',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // LOIRE-ATLANTIQUE (44) - Nantes
  // ═══════════════════════════════════════
  {
    id: 'nantes_44',
    name: 'Nantes (Loire-Atlantique)',
    department: '44',
    region: 'Pays de la Loire',
    tier: 2,
    bookingUrl: 'https://www.loire-atlantique.gouv.fr/booking/create/9088',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // GIRONDE (33) - Bordeaux
  // ═══════════════════════════════════════
  {
    id: 'bordeaux_33',
    name: 'Bordeaux (Gironde)',
    department: '33',
    region: 'Nouvelle-Aquitaine',
    tier: 2,
    bookingUrl: 'https://www.gironde.gouv.fr/booking/create/7882',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // HÉRAULT (34) - Montpellier
  // ═══════════════════════════════════════
  {
    id: 'montpellier_34',
    name: 'Montpellier (Hérault)',
    department: '34',
    region: 'Occitanie',
    tier: 2,
    bookingUrl: 'https://www.herault.gouv.fr/booking/create/8413',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // BAS-RHIN (67) - Strasbourg
  // ═══════════════════════════════════════
  {
    id: 'strasbourg_67',
    name: 'Strasbourg (Bas-Rhin)',
    department: '67',
    region: 'Grand Est',
    tier: 2,
    bookingUrl: 'https://www.bas-rhin.gouv.fr/booking/create/3876',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // ALPES-MARITIMES (06) - Nice
  // ═══════════════════════════════════════
  {
    id: 'nice_06',
    name: 'Nice (Alpes-Maritimes)',
    department: '06',
    region: 'Provence-Alpes-Côte d\'Azur',
    tier: 2,
    bookingUrl: 'https://www.alpes-maritimes.gouv.fr/booking/create/2838',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // SEINE-MARITIME (76) - Rouen
  // ═══════════════════════════════════════
  {
    id: 'rouen_76',
    name: 'Rouen (Seine-Maritime)',
    department: '76',
    region: 'Normandie',
    tier: 2,
    bookingUrl: 'https://www.seine-maritime.gouv.fr/booking/create/11305',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // ILLE-ET-VILAINE (35) - Rennes
  // ═══════════════════════════════════════
  {
    id: 'rennes_35',
    name: 'Rennes (Ille-et-Vilaine)',
    department: '35',
    region: 'Bretagne',
    tier: 2,
    bookingUrl: 'https://www.ille-et-vilaine.gouv.fr/booking/create/8613',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
  
  // ═══════════════════════════════════════
  // ISÈRE (38) - Grenoble
  // ═══════════════════════════════════════
  {
    id: 'grenoble_38',
    name: 'Grenoble (Isère)',
    department: '38',
    region: 'Auvergne-Rhône-Alpes',
    tier: 2,
    bookingUrl: 'https://www.isere.gouv.fr/booking/create/8725',
    checkInterval: 60,
    bookingSystem: 'ants',
    selectors: GOUV_BOOKING_SELECTORS,
    procedures: ['TITRE_SEJOUR', 'NATURALISATION'],
  },
];

export default TIER2_PREFECTURES;
