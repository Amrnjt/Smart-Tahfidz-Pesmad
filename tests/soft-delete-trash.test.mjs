import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const typesContent = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
const storageServiceContent = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const historyTableContent = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');
const trashModalContent = readFileSync(new URL('../src/components/TrashBinModal.tsx', import.meta.url), 'utf8');

function getBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `Missing block start: ${startMarker}`);
  assert.ok(end > start, `Missing block end: ${endMarker}`);
  return source.slice(start, end);
}

test('TrashRecord keeps recovery metadata required for soft delete', () => {
  assert.match(typesContent, /export interface TrashRecord\s*\{/);
  assert.match(typesContent, /recordId:\s*string;/);
  assert.match(typesContent, /recordType:\s*TrashRecordType;/);
  assert.match(typesContent, /sourceCollection:\s*string;/);
  assert.match(typesContent, /payload:\s*Record<string,\s*any>;/);
  assert.match(typesContent, /deletedAt:\s*string;/);
  assert.match(typesContent, /deletedBy:\s*string;/);
  assert.match(typesContent, /expiresAt:\s*string;/);
});

test('single soft delete atomically writes Trash before deleting the source record', () => {
  const block = getBlock(storageServiceContent, 'async deleteRecord(', 'async deleteRecordsBatch(');

  assert.match(block, /await getDoc\(doc\(db, sourceCollection, id\)\)/);
  assert.match(block, /15\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(block, /const trashDocId = `trash_\$\{id\}`/);
  assert.match(block, /const batch = writeBatch\(db\)/);
  assert.match(block, /batch\.set\(doc\(db, COLLECTIONS\.TRASH, trashDocId\), cleanForFirestore\(trashItem\)\)/);
  assert.match(block, /batch\.delete\(doc\(db, sourceCollection, id\)\)/);
  assert.match(block, /await batch\.commit\(\)/);
  assert.match(block, /this\.markRecordDeleted\(id\)/);
});

test('batch soft delete preserves historical payloads and stays below Firestore batch limits', () => {
  const block = getBlock(storageServiceContent, 'async deleteRecordsBatch(', 'async restoreTrashRecord(');

  assert.match(block, /await Promise\.all\(items\.map\(async item =>/);
  assert.match(block, /await getDoc\(doc\(db, sourceCollection, item\.id\)\)/);
  assert.match(block, /index \+= 225/);
  assert.match(block, /batch\.set\(doc\(db, COLLECTIONS\.TRASH, trashItem\.id\), cleanForFirestore\(trashItem\)\)/);
  assert.match(block, /batch\.delete\(doc\(db, sourceCollection, item\.id\)\)/);
  assert.match(block, /await batch\.commit\(\)/);
});

test('restore refuses to overwrite an active record and restores source + removes Trash atomically', () => {
  const block = getBlock(storageServiceContent, 'async restoreTrashRecord(', 'async permanentlyDeleteTrashRecord(');

  assert.match(block, /const activeSnap = await getDoc\(doc\(db, targetCollection, originalId\)\)/);
  assert.match(block, /if \(activeSnap\.exists\(\)\)/);
  assert.match(block, /Pemulihan dibatalkan agar tidak menimpa data aktif/);
  assert.match(block, /const batch = writeBatch\(db\)/);
  assert.match(block, /batch\.set\(doc\(db, targetCollection, originalId\), cleanForFirestore\(payloadToRestore\)\)/);
  assert.match(block, /batch\.delete\(doc\(db, COLLECTIONS\.TRASH, trashItem\.id\)\)/);
  assert.match(block, /await batch\.commit\(\)/);
  assert.match(block, /this\.unmarkRecordDeleted\(originalId\)/);
});

test('expired Trash records are purged and hidden from recovery results', () => {
  const purgeBlock = getBlock(storageServiceContent, 'async purgeExpiredTrash(', 'async fetchTrashRecords(');
  const fetchBlock = getBlock(storageServiceContent, 'async fetchTrashRecords(', 'async deleteRecord(');

  assert.match(purgeBlock, /data\.expiresAt && data\.expiresAt <= nowIso/);
  assert.match(purgeBlock, /i \+= 450/);
  assert.match(purgeBlock, /batch\.delete\(doc\(db, COLLECTIONS\.TRASH, docId\)\)/);
  assert.match(fetchBlock, /await this\.purgeExpiredTrash\(\)/);
  assert.match(fetchBlock, /!data\.expiresAt \|\| data\.expiresAt > nowIso/);
});

test('HistoryTable integrates TrashBinModal through the current lazy-loaded view-only-safe flow', () => {
  assert.match(
    historyTableContent,
    /const TrashBinModal = lazy\(\(\) =>\s*import\('\.\/TrashBinModal'\)\.then\(\(module\) => \(\{ default: module\.TrashBinModal \}\)\)\s*\)/
  );
  assert.match(historyTableContent, /setShowTrashModal\(true\)/);
  assert.match(historyTableContent, /!isViewOnly && showTrashModal && \(/);
  assert.match(historyTableContent, /<TrashBinModal/);
  assert.match(historyTableContent, /dapat dipulihkan dalam 15 hari/);
});

test('TrashBinModal exposes recovery, permanent delete, empty trash, and retention messaging', () => {
  assert.match(trashModalContent, /Retensi 15 Hari/);
  assert.match(trashModalContent, /fetchTrashRecords\(\)/);
  assert.match(trashModalContent, /restoreTrashRecord\(item\.id\)/);
  assert.match(trashModalContent, /permanentlyDeleteTrashRecord\(itemToPermanentDelete\.id\)/);
  assert.match(trashModalContent, /emptyTrash\(\)/);
  assert.match(trashModalContent, /15 hari sebelum dihapus permanen/);
});
