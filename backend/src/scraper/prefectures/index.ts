import { TIER1_PREFECTURES } from './tier1.configs.js';
import { TIER2_PREFECTURES } from './tier2.configs.js';
import { TIER3_PREFECTURES } from './tier3.configs.js';
import type { PrefectureConfig } from '../../types/prefecture.types.js';

// ════════════════════════════════════════════════════════════════
// ACTIVE PREFECTURES - Only 10 prefectures for faster performance
// ════════════════════════════════════════════════════════════════
// These are the only prefectures that will be scraped and shown
// in the frontend. All others are deactivated.
//
// ID Format: {city}_{department}
// ════════════════════════════════════════════════════════════════
export const ACTIVE_PREFECTURE_IDS = [
  // Île-de-France (8 prefectures)
  'paris_75',           // Paris
  'bobigny_93',         // Seine-Saint-Denis
  'creteil_94',         // Val-de-Marne
  'nanterre_92',        // Hauts-de-Seine
  'evry_91',            // Essonne
  'cergy_95',           // Val-d'Oise
  'melun_77',           // Seine-et-Marne
  'versailles_78',      // Yvelines
  
  // Other major cities (2 prefectures)
  'lyon_69',            // Rhône
  'moulins_03',         // Allier
];

// All prefectures config (for reference, but only ACTIVE ones are used)
const ALL_PREFECTURES_CONFIG: PrefectureConfig[] = [
  ...TIER1_PREFECTURES,
  ...TIER2_PREFECTURES,
  ...TIER3_PREFECTURES,
];

// Filter to only active prefectures
export const ALL_PREFECTURES: PrefectureConfig[] = ALL_PREFECTURES_CONFIG.filter(
  (p) => ACTIVE_PREFECTURE_IDS.includes(p.id)
);

// All prefectures for database (to set others to PAUSED)
export const ALL_PREFECTURES_FULL: PrefectureConfig[] = ALL_PREFECTURES_CONFIG;

// Map for quick lookup by ID
export const PREFECTURE_MAP = new Map<string, PrefectureConfig>(
  ALL_PREFECTURES.map((p) => [p.id, p])
);

// Get prefecture by ID
export function getPrefectureConfig(id: string): PrefectureConfig | undefined {
  return PREFECTURE_MAP.get(id);
}

// Check if prefecture is active
export function isPrefectureActive(id: string): boolean {
  return ACTIVE_PREFECTURE_IDS.includes(id);
}

// Stats
export const PREFECTURE_STATS = {
  total: ALL_PREFECTURES.length,
  active: ACTIVE_PREFECTURE_IDS.length,
  inactive: ALL_PREFECTURES_CONFIG.length - ACTIVE_PREFECTURE_IDS.length,
};

export { TIER1_PREFECTURES, TIER2_PREFECTURES, TIER3_PREFECTURES };
export default ALL_PREFECTURES;
