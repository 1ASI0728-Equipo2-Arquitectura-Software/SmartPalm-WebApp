import { recommendationClientKey } from './recommendation.assembler';

const STORAGE_KEY = 'smartpalm_rec_id_registry_v1';

type RegistryMap = Record<string, number>;

function readMap(): RegistryMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RegistryMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: RegistryMap): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/** Remember id obtained from Location or detail navigation. */
export function rememberRecommendationId(content: string, createdAt: string, id: number): void {
  if (!id || !content) return;
  const map = readMap();
  map[recommendationClientKey(content, createdAt)] = id;
  writeMap(map);
}

export function lookupRecommendationId(content: string, createdAt: string): number {
  const map = readMap();
  return map[recommendationClientKey(content, createdAt)] ?? 0;
}

export function rememberRecommendationIdByKey(clientKey: string, id: number): void {
  if (!id || !clientKey) return;
  const map = readMap();
  map[clientKey] = id;
  writeMap(map);
}
