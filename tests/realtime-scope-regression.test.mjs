import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const realtime = readFileSync(new URL('../src/services/realtimeService.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('master realtime subscription excludes setoran collections', () => {
  const start = realtime.indexOf('subscribeMasterData(');
  const end = realtime.indexOf('subscribePantauanLiburan(', start);
  assert.ok(start >= 0 && end > start);
  const masterBody = realtime.slice(start, end);
  for (const collection of ['COLLECTIONS.ZIYADAH', 'COLLECTIONS.MUROJAAH', 'COLLECTIONS.BINNADZOR', 'COLLECTIONS.PEMBELAJARAN', 'COLLECTIONS.PANTAUAN_LIBURAN']) {
    assert.doesNotMatch(masterBody, new RegExp(collection.replace('.', '\\.')));
  }
});

test('app startup uses bounded subscriptions instead of legacy full realtime sync', () => {
  assert.match(app, /storageService\.subscribeMasterData\(/);
  assert.match(app, /storageService\.subscribeRecentSetoran\(/);
  assert.doesNotMatch(app, /storageService\.initRealtimeSync\(/);
});


test('Pantauan Liburan uses an explicit scoped subscription outside master data', () => {
  assert.match(realtime, /subscribePantauanLiburan\(/);
  const start = realtime.indexOf('subscribePantauanLiburan(');
  const end = realtime.indexOf('subscribeRecentSetoran(', start);
  assert.ok(start >= 0 && end > start);
  const block = realtime.slice(start, end);
  assert.match(block, /scope\.kind === 'student'/);
  assert.match(block, /where\('idSantri', '==', request\.scope\.idSantri\)/);
  assert.match(block, /limit\(Math\.max\(1, request\.maxRecords \?\? 500\)\)/);
});

test('bounded setoran subscriptions emit only the changed collection payload', () => {
  const start = realtime.indexOf('subscribeRecentSetoran(');
  const end = realtime.length;
  assert.ok(start >= 0 && end > start);
  const block = realtime.slice(start, end);

  for (const type of ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran']) {
    assert.match(block, new RegExp(`onUpdate\\?\\.\\(\\{ type: '${type}', records \\}\\)`));
  }

  assert.doesNotMatch(app, /\},\s*refreshRecentSetoran\s*\)/);
  assert.match(app, /update\.type === 'ziyadah'/);
  assert.match(app, /setZiyadahRecords\(update\.records\)/);
});
