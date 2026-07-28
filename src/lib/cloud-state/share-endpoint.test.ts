import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createShareSnapshot,
  getShareSnapshot,
  handleCreateRequest,
  type ShareKv,
} from './share-endpoint.ts';

const NOW = Date.parse('2026-07-20T00:00:00.000Z');

function memoryKv(): ShareKv & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    async get(key) {
      return store.get(key) ?? null;
    },
    async put(key, value) {
      store.set(key, value);
    },
  };
}

const TIER_PAYLOAD = {
  title: 'My game tier list',
  tiers: [
    { id: 's', label: 'S', items: [{ id: 'a1', label: 'Chess' }] },
    { id: 'a', label: 'A', items: [{ id: 'a2', label: 'Sudoku' }] },
  ],
};

test('blog copy creates and reads a tier-list snapshot owned by blog.oiyo.net', async () => {
  const kv = memoryKv();
  const created = await createShareSnapshot(kv, { kind: 'tier-list.v1', payload: TIER_PAYLOAD }, { nowMs: NOW });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(created.snapshot.owner, 'blog.oiyo.net');

  const read = await getShareSnapshot(kv, 'tier-list.v1', created.snapshot.snapshotId, NOW + 1000);
  assert.equal(read.ok, true);
});

test('blog copy rejects a game-records payload on the tier-list route contract', async () => {
  const kv = memoryKv();
  const created = await createShareSnapshot(
    kv,
    { kind: 'tier-list.v1', payload: { records: [] } },
    { nowMs: NOW },
  );
  assert.equal(created.ok, false);
});

test('blog copy fails closed without a KV binding', async () => {
  const res = await handleCreateRequest(undefined, 'tier-list.v1', {
    async text() {
      return JSON.stringify({ payload: TIER_PAYLOAD });
    },
  });
  assert.equal(res.status, 503);
});
