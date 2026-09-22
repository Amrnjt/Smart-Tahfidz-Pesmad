import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('master realtime subscription excludes setoran collections', () => {
  const start = storage.indexOf('subscribeMasterData(');
  const end = storage.indexOf('subscribeRecentSetoran(', start);
  assert.ok(start >= 0 && end > start);
  const masterBody = storage.slice(start, end);
  for (const collection of ['COLLECTIONS.ZIYADAH', 'COLLECTIONS.MUROJAAH', 'COLLECTIONS.BINNADZOR', 'COLLECTIONS.PEMBELAJARAN']) {
    assert.doesNotMatch(masterBody, new RegExp(collection.replace('.', '\\.')));
  }
});

test('app startup uses bounded subscriptions instead of legacy full realtime sync', () => {
  assert.match(app, /storageService\.subscribeMasterData\(/);
  assert.match(app, /storageService\.subscribeRecentSetoran\(/);
  assert.doesNotMatch(app, /storageService\.initRealtimeSync\(/);
});
