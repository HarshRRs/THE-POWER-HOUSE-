import type { Procedure } from '@prisma/client';

/**
 * Prefecture Category Configuration
 * 
 * Hardcoded demarche codes for RDV-Prefecture booking system.
 * Each category maps to a specific URL: 
 *   https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/{CODE}/
 * 
 * These codes are specific to each prefecture and must be researched
 * by visiting each prefecture's RDV-Prefecture page.
 */

export interface CategoryConfig {
  code: string;           // Demarche code (e.g., "16040")
  name: string;           // Display name (e.g., "Renouvellement salarié")
  procedure: Procedure;   // Maps to Prisma Procedure enum
  description?: string;   // Optional description
}

// Base URL pattern for RDV-Prefecture
export const RDV_PREFECTURE_BASE_URL = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche';

/**
 * Generate full category URL from demarche code
 */
export function getCategoryUrl(code: string): string {
  return `${RDV_PREFECTURE_BASE_URL}/${code}/`;
}

/**
 * RDV-Prefecture Categories by Prefecture ID
 * 
 * Prefecture IDs match the format: {city}_{department}
 * 
 * NOTE: These codes are hardcoded after manual research of each prefecture website.
 * New categories can be discovered by visiting the prefecture's main page and 
 * extracting demarche codes from available procedures.
 */
export const RDV_PREFECTURE_CATEGORIES: Record<string, CategoryConfig[]> = {
  // ═══════════════════════════════════════
  // VAL-DE-MARNE (94) - Créteil
  // ═══════════════════════════════════════
  'creteil_94': [
    {
      code: '16040',
      name: 'Remise de titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Retrait de titre de séjour prêt',
    },
    // Additional categories to be discovered and added
    // Common RDV-Prefecture categories typically include:
    // - Renouvellement salarié
    // - Renouvellement étudiant
    // - Changement de statut
    // - Première demande
    // - Duplicata
    // - Vie privée et familiale
  ],

  // ═══════════════════════════════════════
  // HAUTS-DE-SEINE (92) - Nanterre
  // ═══════════════════════════════════════
  'nanterre_92': [
    {
      code: '1922',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Démarches liées au titre de séjour',
    },
  ],

  // ═══════════════════════════════════════
  // ESSONNE (91) - Évry
  // ═══════════════════════════════════════
  'evry_91': [
    {
      code: '2200',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Démarches liées au titre de séjour',
    },
  ],

  // ═══════════════════════════════════════
  // VAL-D'OISE (95) - Cergy-Pontoise
  // Guichet 1: demarche/1380 | Guichet 2: demarche/9481
  // ═══════════════════════════════════════
  'cergy_95': [
    {
      code: '1380',
      name: 'Titre de séjour - Guichet 1',
      procedure: 'TITRE_SEJOUR',
      description: 'Guichet 1 - Démarches titre de séjour',
    },
    {
      code: '9481',
      name: 'Titre de séjour - Guichet 2',
      procedure: 'TITRE_SEJOUR',
      description: 'Guichet 2 - Démarches titre de séjour',
    },
  ],

  // ═══════════════════════════════════════
  // YVELINES (78) - Versailles
  // ═══════════════════════════════════════
  'versailles_78': [
    {
      code: '1040',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Démarches liées au titre de séjour',
    },
  ],

  // ═══════════════════════════════════════
  // ALLIER (03) - Moulins
  // ═══════════════════════════════════════
  'moulins_03': [
    {
      code: '4418',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Démarches liées au titre de séjour',
    },
  ],
};

/**
 * Non-RDV-Prefecture systems (ANTS, ezbooking, ANEF)
 * These don't use demarche codes - they use procedure selection in the form.
 * Categories are procedure-based, not URL-based.
 */
export const OTHER_SYSTEM_CATEGORIES: Record<string, CategoryConfig[]> = {
  // ═══════════════════════════════════════
  // PARIS (75) - ANTS System
  // ═══════════════════════════════════════
  'paris_75': [
    {
      code: 'CARTE_IDENTITE',
      name: 'Carte d\'identité',
      procedure: 'CARTE_IDENTITE',
    },
    {
      code: 'PASSEPORT',
      name: 'Passeport',
      procedure: 'PASSEPORT',
    },
  ],

  // ═══════════════════════════════════════
  // SEINE-SAINT-DENIS (93) - Bobigny - ezbooking
  // ═══════════════════════════════════════
  'bobigny_93': [
    {
      code: 'TITRE_SEJOUR',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
    },
    {
      code: 'NATURALISATION',
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
    },
  ],

  // ═══════════════════════════════════════
  // SEINE-ET-MARNE (77) - Melun - ANEF System
  // ═══════════════════════════════════════
  'melun_77': [
    {
      code: 'TITRE_SEJOUR',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
    },
  ],

  // ═══════════════════════════════════════
  // RHÔNE (69) - Lyon - ANEF System
  // ═══════════════════════════════════════
  'lyon_69': [
    {
      code: 'TITRE_SEJOUR',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
    },
    {
      code: 'NATURALISATION',
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
    },
  ],
};

/**
 * Indian Embassy Paris Categories
 * These map to category IDs on the appointment.eoiparis.com system
 */
export interface EmbassyCategoryConfig {
  id: number;             // Category ID on the embassy system
  code: string;           // Internal code for matching
  name: string;           // Display name
  procedure: Procedure;   // Maps to Prisma Procedure enum
  procedures: Procedure[]; // All related procedures
}

export const INDIAN_EMBASSY_CATEGORIES: EmbassyCategoryConfig[] = [
  {
    id: 3,
    code: 'PASSPORT',
    name: 'Passport Services',
    procedure: 'PASSPORT_RENEWAL',
    procedures: ['PASSPORT_RENEWAL', 'PASSPORT_REISSUE', 'PASSPORT_NEW', 'PASSPORT_TATKAL'],
  },
  {
    id: 1,
    code: 'OCI',
    name: 'OCI Services',
    procedure: 'OCI_REGISTRATION',
    procedures: ['OCI_REGISTRATION', 'OCI_RENEWAL', 'OCI_MISC'],
  },
  {
    id: 2,
    code: 'VISA',
    name: 'Visa Services',
    procedure: 'VISA_CONSULAR',
    procedures: ['VISA_CONSULAR'],
  },
  {
    id: 27,
    code: 'BIRTH',
    name: 'Birth Registration',
    procedure: 'BIRTH_REGISTRATION',
    procedures: ['BIRTH_REGISTRATION'],
  },
];

/**
 * Get all categories for a prefecture
 */
export function getPrefectureCategories(prefectureId: string): CategoryConfig[] {
  // First check RDV-Prefecture categories
  if (RDV_PREFECTURE_CATEGORIES[prefectureId]) {
    return RDV_PREFECTURE_CATEGORIES[prefectureId];
  }
  
  // Then check other systems
  if (OTHER_SYSTEM_CATEGORIES[prefectureId]) {
    return OTHER_SYSTEM_CATEGORIES[prefectureId];
  }
  
  return [];
}

/**
 * Check if prefecture uses RDV-Prefecture system (has demarche codes)
 */
export function isRdvPrefectureSystem(prefectureId: string): boolean {
  return prefectureId in RDV_PREFECTURE_CATEGORIES;
}

/**
 * Get all prefectures with categories configured
 */
export function getAllConfiguredPrefectureIds(): string[] {
  return [
    ...Object.keys(RDV_PREFECTURE_CATEGORIES),
    ...Object.keys(OTHER_SYSTEM_CATEGORIES),
  ];
}
