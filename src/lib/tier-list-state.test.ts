import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TIER_LIST_MAX_ITEMS,
  createTierListShareCode,
  createTierListSnapshot,
  parseTierListShareCode,
  parseTierListSnapshot,
  serializeTierListSnapshot,
} from './tier-list-state.ts';

const tiers = [
  { id: 's', items: [{ id: 'one', label: '첫 번째 🐧' }] },
  { id: 'a', items: [] },
  { id: 'b', items: [] },
  { id: 'c', items: [] },
  { id: 'd', items: [] },
  { id: 'unranked', items: [{ id: 'two', label: 'Second' }] },
];

test('snapshot is versioned, deterministic by tier id, and JSON round-trips Unicode', () => {
  const snapshot = createTierListSnapshot([...tiers].reverse(), new Date('2026-07-18T00:00:00Z'));
  assert.deepEqual(snapshot.tiers.map((tier) => tier.id), ['s', 'a', 'b', 'c', 'd', 'unranked']);
  assert.equal(parseTierListSnapshot(serializeTierListSnapshot(snapshot))?.tiers[0].items[0].label, '첫 번째 🐧');
});

test('share code round-trips and expires after at most 30 days', () => {
  const now = new Date('2026-07-18T00:00:00Z');
  const snapshot = createTierListSnapshot(tiers, now);
  const code = createTierListShareCode(snapshot, now);
  assert.equal(parseTierListShareCode(code, new Date('2026-08-16T23:59:59Z'))?.tiers[0].items[0].id, 'one');
  assert.equal(parseTierListShareCode(code, new Date('2026-08-17T00:00:00Z')), null);
});

test('malformed, duplicate, oversized, and tampered inputs fail closed', () => {
  const snapshot = createTierListSnapshot(tiers, new Date('2026-07-18T00:00:00Z'));
  assert.equal(parseTierListShareCode('tl1.not*base64'), null);
  assert.equal(parseTierListShareCode(`${createTierListShareCode(snapshot)}x`), null);
  assert.equal(parseTierListSnapshot({ ...snapshot, tiers: snapshot.tiers.slice(1) }), null);
  assert.equal(parseTierListSnapshot({
    ...snapshot,
    tiers: snapshot.tiers.map((tier, index) => index === 1 ? { ...tier, items: [{ id: 'one', label: 'duplicate' }] } : tier),
  }), null);
  const tooMany = Array.from({ length: TIER_LIST_MAX_ITEMS + 1 }, (_, index) => ({ id: `x-${index}`, label: `Item ${index}` }));
  assert.equal(parseTierListSnapshot({
    ...snapshot,
    tiers: snapshot.tiers.map((tier) => tier.id === 'unranked' ? { ...tier, items: tooMany } : { ...tier, items: [] }),
  }), null);
});
