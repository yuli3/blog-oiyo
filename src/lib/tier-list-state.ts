export const TIER_LIST_SCHEMA = 'oiyo.tier-list' as const;
export const TIER_LIST_SHARE_SCHEMA = 'oiyo.tier-list-share' as const;
export const TIER_LIST_VERSION = 1 as const;
export const TIER_LIST_STORAGE_KEY = 'oiyo:tier-list:v1';
export const TIER_LIST_SHARE_PREFIX = 'tl1.';
export const TIER_LIST_SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const TIER_LIST_MAX_ITEMS = 100;
export const TIER_LIST_MAX_CODE_BYTES = 24 * 1024;

export const TIER_IDS = ['s', 'a', 'b', 'c', 'd', 'unranked'] as const;
export type TierListTierId = (typeof TIER_IDS)[number];

export interface TierListItemData {
  id: string;
  label: string;
}

export interface TierListSnapshot {
  schema: typeof TIER_LIST_SCHEMA;
  version: typeof TIER_LIST_VERSION;
  savedAt: string;
  tiers: Array<{ id: TierListTierId; items: TierListItemData[] }>;
}

export interface TierListShareEnvelope {
  schema: typeof TIER_LIST_SHARE_SCHEMA;
  version: typeof TIER_LIST_VERSION;
  createdAt: string;
  expiresAt: string;
  snapshot: TierListSnapshot;
}

type TierLike = { id: string; items: readonly TierListItemData[] };

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function normalizeItem(value: unknown): TierListItemData | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') return null;
  const id = value.id.trim();
  const label = value.label.trim().replace(/\s+/g, ' ');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id) || label.length < 1 || label.length > 40) return null;
  return { id, label };
}

export function createTierListSnapshot(tiers: readonly TierLike[], now = new Date()): TierListSnapshot {
  const byId = new Map(tiers.map((tier) => [tier.id, tier.items]));
  const snapshot: TierListSnapshot = {
    schema: TIER_LIST_SCHEMA,
    version: TIER_LIST_VERSION,
    savedAt: now.toISOString(),
    tiers: TIER_IDS.map((id) => ({ id, items: [...(byId.get(id) ?? [])] })),
  };
  const parsed = parseTierListSnapshot(snapshot);
  if (!parsed) throw new Error('Invalid tier list state');
  return parsed;
}

export function parseTierListSnapshot(input: unknown): TierListSnapshot | null {
  let value = input;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (!isRecord(value)
    || value.schema !== TIER_LIST_SCHEMA
    || value.version !== TIER_LIST_VERSION
    || !isIsoDate(value.savedAt)
    || !Array.isArray(value.tiers)
    || value.tiers.length !== TIER_IDS.length) return null;

  const tierMap = new Map<TierListTierId, TierListItemData[]>();
  const itemIds = new Set<string>();
  const labels = new Set<string>();
  let totalItems = 0;

  for (const tier of value.tiers) {
    if (!isRecord(tier) || !TIER_IDS.includes(tier.id as TierListTierId) || !Array.isArray(tier.items)) return null;
    const tierId = tier.id as TierListTierId;
    if (tierMap.has(tierId)) return null;
    const items: TierListItemData[] = [];
    for (const rawItem of tier.items) {
      const item = normalizeItem(rawItem);
      if (!item) return null;
      const labelKey = item.label.toLocaleLowerCase();
      if (itemIds.has(item.id) || labels.has(labelKey)) return null;
      itemIds.add(item.id);
      labels.add(labelKey);
      items.push(item);
      totalItems += 1;
      if (totalItems > TIER_LIST_MAX_ITEMS) return null;
    }
    tierMap.set(tierId, items);
  }

  if (TIER_IDS.some((id) => !tierMap.has(id))) return null;
  return {
    schema: TIER_LIST_SCHEMA,
    version: TIER_LIST_VERSION,
    savedAt: new Date(value.savedAt).toISOString(),
    tiers: TIER_IDS.map((id) => ({ id, items: tierMap.get(id) ?? [] })),
  };
}

export function serializeTierListSnapshot(snapshot: TierListSnapshot): string {
  const parsed = parseTierListSnapshot(snapshot);
  if (!parsed) throw new Error('Invalid tier list state');
  return JSON.stringify(parsed, null, 2);
}

function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const packed = (a << 16) | (b << 8) | c;
    output += BASE64URL[(packed >> 18) & 63];
    output += BASE64URL[(packed >> 12) & 63];
    if (i + 1 < bytes.length) output += BASE64URL[(packed >> 6) & 63];
    if (i + 2 < bytes.length) output += BASE64URL[packed & 63];
  }
  return output;
}

function decodeBase64Url(value: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const bytes: number[] = [];
  for (let i = 0; i < value.length; i += 4) {
    const chunk = value.slice(i, i + 4);
    if (chunk.length === 1) return null;
    const numbers = [...chunk].map((char) => BASE64URL.indexOf(char));
    if (numbers.some((number) => number < 0)) return null;
    const packed = ((numbers[0] ?? 0) << 18)
      | ((numbers[1] ?? 0) << 12)
      | ((numbers[2] ?? 0) << 6)
      | (numbers[3] ?? 0);
    bytes.push((packed >> 16) & 255);
    if (chunk.length > 2) bytes.push((packed >> 8) & 255);
    if (chunk.length > 3) bytes.push(packed & 255);
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes)); } catch { return null; }
}

export function createTierListShareCode(
  snapshot: TierListSnapshot,
  now = new Date(),
  ttlMs = TIER_LIST_SHARE_TTL_MS,
): string {
  const parsed = parseTierListSnapshot(snapshot);
  if (!parsed || !Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > TIER_LIST_SHARE_TTL_MS) {
    throw new Error('Invalid tier list share request');
  }
  const envelope: TierListShareEnvelope = {
    schema: TIER_LIST_SHARE_SCHEMA,
    version: TIER_LIST_VERSION,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    snapshot: parsed,
  };
  const json = JSON.stringify(envelope);
  if (new TextEncoder().encode(json).byteLength > TIER_LIST_MAX_CODE_BYTES) throw new Error('Tier list share code is too large');
  return `${TIER_LIST_SHARE_PREFIX}${encodeBase64Url(json)}`;
}

export function parseTierListShareCode(code: string, now = new Date()): TierListSnapshot | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(TIER_LIST_SHARE_PREFIX) || trimmed.length > TIER_LIST_MAX_CODE_BYTES * 2) return null;
  const decoded = decodeBase64Url(trimmed.slice(TIER_LIST_SHARE_PREFIX.length));
  if (!decoded || new TextEncoder().encode(decoded).byteLength > TIER_LIST_MAX_CODE_BYTES) return null;
  let value: unknown;
  try { value = JSON.parse(decoded); } catch { return null; }
  if (!isRecord(value)
    || value.schema !== TIER_LIST_SHARE_SCHEMA
    || value.version !== TIER_LIST_VERSION
    || !isIsoDate(value.createdAt)
    || !isIsoDate(value.expiresAt)) return null;
  const createdAt = Date.parse(value.createdAt);
  const expiresAt = Date.parse(value.expiresAt);
  if (expiresAt <= now.getTime() || expiresAt <= createdAt || expiresAt - createdAt > TIER_LIST_SHARE_TTL_MS) return null;
  return parseTierListSnapshot(value.snapshot);
}
