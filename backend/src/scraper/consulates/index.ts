import { INDIAN_EMBASSY_PARIS } from './indian-embassy-paris.config.js';
import type { ConsulateConfig } from '../../types/consulate.types.js';

export const ALL_CONSULATES: ConsulateConfig[] = [
  INDIAN_EMBASSY_PARIS,
];

export const CONSULATE_MAP = new Map<string, ConsulateConfig>(
  ALL_CONSULATES.map((c) => [c.id, c])
);

export function getConsulateConfig(id: string): ConsulateConfig | undefined {
  return CONSULATE_MAP.get(id);
}

export const CONSULATE_STATS = {
  total: ALL_CONSULATES.length,
};

export { INDIAN_EMBASSY_PARIS };
export default ALL_CONSULATES;
