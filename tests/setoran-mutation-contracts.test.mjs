import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cloudGate = readFileSync(
  new URL('../src/services/cloudCommitGate.ts', import.meta.url),
  'utf8',
);
const storage = readFileSync(
  new URL('../src/services/storageService.ts', import.meta.url),
  'utf8',
);

test('record updates do not require the record in LocalStorage', () => {
  const updateRecord = cloudGate.slice(
    cloudGate.indexOf('storageService.updateRecord'),
    cloudGate.indexOf('storageService.setProgramLiburanActive'),
  );
  assert.ok(updateRecord.length > 0, 'record mutation override must exist');
  assert.doesNotMatch(updateRecord, /if \(!current\) return false/);
  assert.match(updateRecord, /setDoc\([\s\S]*?merge: true/);
});

test('santri deletion queries Cloud and chunks writes', () => {
  assert.match(storage, /fetchRecordsBySantri/);
  assert.match(storage, /chunkBatchOperations/);
  assert.doesNotMatch(storage, /terlalu banyak untuk satu operasi hapus Cloud/);
});
