import { TIER1_PREFECTURES } from './tier1.configs.js';
import { TIER2_PREFECTURES } from './tier2.configs.js';
import { TIER3_PREFECTURES } from './tier3.configs.js';
import type { PrefectureConfig } from '../../types/prefecture.types.js';

// All 101 French prefectures
export const ALL_PREFECTURES: PrefectureConfig[] = [
  ...TIER1_PREFECTURES,
  ...TIER2_PREFECTURES,
  ...TIER3_PREFECTURES,
];

// Map for quick lookup by ID
export const PREFECTURE_MAP = new Map<string, PrefectureConfig>(
  ALL_PREFECTURES.map((p) => [p.id, p])
);

// Get prefecture by ID
export function getPrefectureConfig(id: string): PrefectureConfig | undefined {
  return PREFECTURE_MAP.get(id);
}

// Get prefectures by tier
export function getPrefecturesByTier(tier: 1 | 2 | 3): PrefectureConfig[] {
  return ALL_PREFECTURES.filter((p) => p.tier === tier);
}

// Stats
export const PREFECTURE_STATS = {
  total: ALL_PREFECTURES.length,
  tier1: TIER1_PREFECTURES.length,
  tier2: TIER2_PREFECTURES.length,
  tier3: TIER3_PREFECTURES.length,
};

export { TIER1_PREFECTURES, TIER2_PREFECTURES, TIER3_PREFECTURES };
export default ALL_PREFECTURES;
