import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const gate = readFileSync(new URL('../src/services/cloudCommitGate.ts', import.meta.url), 'utf8');

test('historical record edits commit directly to Firestore even outside recent cache', () => {
  const start = gate.indexOf('storageService.updateRecord = async');
  const end = gate.indexOf('storageService.setProgramLiburanActive = async', start);
  assert.ok(start >= 0 && end > start);
  const block = gate.slice(start, end);
  assert.match(block, /await setDoc\(doc\(db, collectionName, id\), cleanForFirestore\(updatedData\), \{ merge: true \}\)/);
  assert.doesNotMatch(block, /if \(!current\) return false/);
});

test('batch soft delete resolves records missing from bounded cache before trashing them', () => {
  const start = storage.indexOf('async deleteRecordsBatch(');
  const end = storage.indexOf('async restoreTrashRecord(', start);
  assert.ok(start >= 0 && end > start);
  const block = storage.slice(start, end);
  assert.match(block, /await getDoc\(doc\(db, sourceCollection, item\.id\)\)/);
  assert.match(block, /payload: payload/);
});

test('delete santri with history queries Firestore by idSantri instead of bounded cache', () => {
  const start = storage.indexOf('async deleteSantri(');
  const end = storage.indexOf('async addUser(', start);
  assert.ok(start >= 0 && end > start);
  const block = storage.slice(start, end);
  assert.match(block, /getDocs\(query\(collection\(db, COLLECTIONS\.ZIYADAH\), where\('idSantri', '==', idSantri\)\)\)/);
  assert.match(block, /getDocs\(query\(collection\(db, COLLECTIONS\.PEMBELAJARAN\), where\('idSantri', '==', idSantri\)\)\)/);
  assert.doesNotMatch(block, /getZiyadahRecords\(\)\.filter\(r => r\.idSantri === idSantri\)/);
});
