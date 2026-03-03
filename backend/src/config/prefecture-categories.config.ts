import type { Procedure } from '@prisma/client';

/**
 * Prefecture Category Configuration
 *
 * Hardcoded demarche codes for RDV-Prefecture booking system.
 * Each category maps to a specific URL:
 *   https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/{CODE}/
 *
 * HOW SCRAPING WORKS:
 * - Each demarche code = one separate scraper job
 * - Results reported independently per category
 * - Boss panel shows slot count per category per prefecture
 */

export interface CategoryConfig {
  code: string;           // Demarche code (e.g., "16040")
  name: string;           // Display name shown in boss panel
  procedure: Procedure;   // Maps to Prisma Procedure enum
  description?: string;
}

export const RDV_PREFECTURE_BASE_URL = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche';

export function getCategoryUrl(code: string): string {
  return `${RDV_PREFECTURE_BASE_URL}/${code}/`;
}

/**
 * RDV-Préfecture demarche codes per prefecture.
 * Each entry = one scraper job = separate slot data in boss panel.
 *
 * NOTE: Codes with "?" are estimated — verify by visiting the prefecture page.
 * Confirmed codes have no "?" comment.
 */
export const RDV_PREFECTURE_CATEGORIES: Record<string, CategoryConfig[]> = {

  // ═══════════════════════════════════════
  // VAL-DE-MARNE (94) - Créteil
  // ═══════════════════════════════════════
  'creteil_94': [
    {
      code: '16040',
      name: 'Remise de titre prêt',
      procedure: 'TITRE_SEJOUR',
      description: 'Retrait de titre de séjour prêt (confirmed)',
    },
    {
      code: '16041',    // ? - verify on site
      name: 'Renouvellement salarié',
      procedure: 'TITRE_SEJOUR_SALARIE',
      description: 'Renouvellement titre séjour — salarié / travailleur',
    },
    {
      code: '16042',    // ? - verify on site
      name: 'Renouvellement étudiant',
      procedure: 'TITRE_SEJOUR_ETUDIANT',
      description: 'Renouvellement titre séjour — étudiant',
    },
    {
      code: '16043',    // ? - verify on site
      name: 'Vie privée et familiale',
      procedure: 'TITRE_SEJOUR_VPF',
      description: 'Titre séjour — vie privée, mariage, famille',
    },
    {
      code: '16044',    // ? - verify on site
      name: 'Changement de statut',
      procedure: 'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
      description: 'Changement statut étudiant → salarié',
    },
    {
      code: '16045',    // ? - verify on site
      name: 'Duplicata (perte/vol)',
      procedure: 'TITRE_SEJOUR_DUPLICATA',
      description: 'Remplacement titre perdu ou volé',
    },
  ],

  // ═══════════════════════════════════════
  // HAUTS-DE-SEINE (92) - Nanterre
  // ═══════════════════════════════════════
  'nanterre_92': [
    {
      code: '1922',
      name: 'Titre de séjour — général',
      procedure: 'TITRE_SEJOUR',
      description: 'Toutes démarches titre de séjour (confirmed)',
    },
    {
      code: '1923',    // ? - verify on site
      name: 'Renouvellement salarié',
      procedure: 'TITRE_SEJOUR_SALARIE',
    },
    {
      code: '1924',    // ? - verify on site
      name: 'Renouvellement étudiant',
      procedure: 'TITRE_SEJOUR_ETUDIANT',
    },
    {
      code: '1925',    // ? - verify on site
      name: 'Vie privée et familiale',
      procedure: 'TITRE_SEJOUR_VPF',
    },
    {
      code: '2810',    // ? - verify on site
      name: 'Changement de statut',
      procedure: 'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
    },
    {
      code: '1926',    // ? - verify on site
      name: 'Entrepreneur / profession libérale',
      procedure: 'TITRE_SEJOUR_ENTREPRENEUR',
    },
    {
      code: '1927',    // ? - verify on site
      name: 'Duplicata (perte/vol)',
      procedure: 'TITRE_SEJOUR_DUPLICATA',
    },
    {
      code: '1928',    // ? - verify on site
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
    },
  ],

  // ═══════════════════════════════════════
  // ESSONNE (91) - Évry
  // ═══════════════════════════════════════
  'evry_91': [
    {
      code: '2200',
      name: 'Titre de séjour — général',
      procedure: 'TITRE_SEJOUR',
      description: 'Toutes démarches titre de séjour (confirmed)',
    },
    {
      code: '2201',    // ? - verify on site
      name: 'Renouvellement salarié',
      procedure: 'TITRE_SEJOUR_SALARIE',
    },
    {
      code: '2202',    // ? - verify on site
      name: 'Renouvellement étudiant',
      procedure: 'TITRE_SEJOUR_ETUDIANT',
    },
    {
      code: '2203',    // ? - verify on site
      name: 'Vie privée et familiale',
      procedure: 'TITRE_SEJOUR_VPF',
    },
    {
      code: '2204',    // ? - verify on site
      name: 'Changement de statut',
      procedure: 'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
    },
    {
      code: '2205',    // ? - verify on site
      name: 'Entrepreneur / profession libérale',
      procedure: 'TITRE_SEJOUR_ENTREPRENEUR',
    },
    {
      code: '2206',    // ? - verify on site
      name: 'Duplicata (perte/vol)',
      procedure: 'TITRE_SEJOUR_DUPLICATA',
    },
    {
      code: '2207',    // ? - verify on site
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
    },
  ],

  // ═══════════════════════════════════════
  // VAL-D'OISE (95) - Cergy-Pontoise
  // Guichet 1: 1380 | Guichet 2: 9481
  // ═══════════════════════════════════════
  'cergy_95': [
    {
      code: '1380',
      name: 'Titre de séjour — Guichet 1',
      procedure: 'TITRE_SEJOUR',
      description: 'Guichet principal (confirmed)',
    },
    {
      code: '9481',
      name: 'Titre de séjour — Guichet 2',
      procedure: 'TITRE_SEJOUR_RENOUVELLEMENT',
      description: 'Guichet overflow (confirmed)',
    },
    {
      code: '1381',    // ? - verify on site
      name: 'Renouvellement salarié',
      procedure: 'TITRE_SEJOUR_SALARIE',
    },
    {
      code: '1382',    // ? - verify on site
      name: 'Renouvellement étudiant',
      procedure: 'TITRE_SEJOUR_ETUDIANT',
    },
    {
      code: '1383',    // ? - verify on site
      name: 'Vie privée et familiale',
      procedure: 'TITRE_SEJOUR_VPF',
    },
    {
      code: '1384',    // ? - verify on site
      name: 'Changement de statut',
      procedure: 'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
    },
  ],

  // ═══════════════════════════════════════
  // YVELINES (78) - Versailles
  // ═══════════════════════════════════════
  'versailles_78': [
    {
      code: '1040',
      name: 'Titre de séjour — général',
      procedure: 'TITRE_SEJOUR',
      description: 'Toutes démarches titre de séjour (confirmed)',
    },
    {
      code: '1041',    // ? - verify on site
      name: 'Renouvellement salarié',
      procedure: 'TITRE_SEJOUR_SALARIE',
    },
    {
      code: '1042',    // ? - verify on site
      name: 'Renouvellement étudiant',
      procedure: 'TITRE_SEJOUR_ETUDIANT',
    },
    {
      code: '1043',    // ? - verify on site
      name: 'Vie privée et familiale',
      procedure: 'TITRE_SEJOUR_VPF',
    },
    {
      code: '1044',    // ? - verify on site
      name: 'Changement de statut',
      procedure: 'CHANGEMENT_STATUT_ETUDIANT_SALARIE',
    },
    {
      code: '1045',    // ? - verify on site
      name: 'Entrepreneur / profession libérale',
      procedure: 'TITRE_SEJOUR_ENTREPRENEUR',
    },
    {
      code: '1046',    // ? - verify on site
      name: 'Duplicata (perte/vol)',
      procedure: 'TITRE_SEJOUR_DUPLICATA',
    },
    {
      code: '1047',    // ? - verify on site
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
    },
  ],

  // ═══════════════════════════════════════
  // ALLIER (03) - Moulins
  // ═══════════════════════════════════════
  'moulins_03': [
    {
      code: '4418',
      name: 'Titre de séjour — général',
      procedure: 'TITRE_SEJOUR',
      description: 'Toutes démarches (confirmed)',
    },
    {
      code: '4419',    // ? - verify on site
      name: 'Renouvellement salarié',
      procedure: 'TITRE_SEJOUR_SALARIE',
    },
    {
      code: '4420',    // ? - verify on site
      name: 'Renouvellement étudiant',
      procedure: 'TITRE_SEJOUR_ETUDIANT',
    },
    {
      code: '4421',    // ? - verify on site
      name: 'Vie privée et familiale',
      procedure: 'TITRE_SEJOUR_VPF',
    },
    {
      code: '4422',    // ? - verify on site
      name: 'Duplicata (perte/vol)',
      procedure: 'TITRE_SEJOUR_DUPLICATA',
    },
  ],
};

/**
 * Non-RDV-Prefecture systems (ANTS, ezbooking, ANEF)
 * These don't use demarche codes — they select procedures within their own forms.
 */
export const OTHER_SYSTEM_CATEGORIES: Record<string, CategoryConfig[]> = {

  // ═══════════════════════════════════════
  // PARIS (75) - ANTS System
  // Only covers French national documents (not titre de séjour)
  // ═══════════════════════════════════════
  'paris_75': [
    {
      code: 'CARTE_IDENTITE',
      name: 'Carte Nationale d\'Identité',
      procedure: 'CARTE_IDENTITE',
      description: 'CNI — nouveau ou renouvellement',
    },
    {
      code: 'PASSEPORT',
      name: 'Passeport',
      procedure: 'PASSEPORT',
      description: 'Passeport biométrique — nouveau ou renouvellement',
    },
  ],

  // ═══════════════════════════════════════
  // SEINE-SAINT-DENIS (93) - Bobigny - ezbooking
  // Single form covers both procedures
  // ═══════════════════════════════════════
  'bobigny_93': [
    {
      code: 'TITRE_SEJOUR',
      name: 'Titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Toutes catégories titre séjour',
    },
    {
      code: 'NATURALISATION',
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
      description: 'Demande de naturalisation française',
    },
  ],

  // ═══════════════════════════════════════
  // SEINE-ET-MARNE (77) - Melun - ANEF System
  // ═══════════════════════════════════════
  'melun_77': [
    {
      code: 'PREMIERE_DEMANDE',
      name: 'Première demande titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Première demande — nouveaux arrivants',
    },
    {
      code: 'RENOUVELLEMENT',
      name: 'Renouvellement titre de séjour',
      procedure: 'TITRE_SEJOUR_RENOUVELLEMENT',
      description: 'Renouvellement de titre déjà obtenu',
    },
  ],

  // ═══════════════════════════════════════
  // RHÔNE (69) - Lyon - ANEF System
  // ═══════════════════════════════════════
  'lyon_69': [
    {
      code: 'PREMIERE_DEMANDE',
      name: 'Première demande titre de séjour',
      procedure: 'TITRE_SEJOUR',
      description: 'Première demande — nouveaux arrivants',
    },
    {
      code: 'RENOUVELLEMENT',
      name: 'Renouvellement titre de séjour',
      procedure: 'TITRE_SEJOUR_RENOUVELLEMENT',
      description: 'Renouvellement de titre déjà obtenu',
    },
    {
      code: 'NATURALISATION',
      name: 'Naturalisation',
      procedure: 'NATURALISATION',
      description: 'Demande de nationalité française',
    },
  ],
};

export function getCategoryUrl2(code: string): string {
  return `${RDV_PREFECTURE_BASE_URL}/${code}/`;
}

export interface EmbassyCategoryConfig {
  id: number;
  code: string;
  name: string;
  procedure: Procedure;
  procedures: Procedure[];
}

/**
 * Indian Embassy Paris categories — used by embassy.booking.ts
 * for matching category codes to display names and procedures.
 */
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

export function getPrefectureCategories(prefectureId: string): CategoryConfig[] {

  if (RDV_PREFECTURE_CATEGORIES[prefectureId]) {
    return RDV_PREFECTURE_CATEGORIES[prefectureId];
  }
  if (OTHER_SYSTEM_CATEGORIES[prefectureId]) {
    return OTHER_SYSTEM_CATEGORIES[prefectureId];
  }
  return [];
}

export function isRdvPrefectureSystem(prefectureId: string): boolean {
  return prefectureId in RDV_PREFECTURE_CATEGORIES;
}

export function getAllConfiguredPrefectureIds(): string[] {
  return [
    ...Object.keys(RDV_PREFECTURE_CATEGORIES),
    ...Object.keys(OTHER_SYSTEM_CATEGORIES),
  ];
}
