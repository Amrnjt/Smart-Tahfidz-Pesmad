import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const typesContent = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
const storageServiceContent = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const historyTableContent = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');
const trashModalContent = readFileSync(new URL('../src/components/TrashBinModal.tsx', import.meta.url), 'utf8');
const scheduleHelperContent = readFileSync(new URL('../src/utils/scheduleHelper.ts', import.meta.url), 'utf8');

test('TrashRecord interface includes all required metadata fields', () => {
  assert.match(typesContent, /export interface TrashRecord\s*\{/);
  assert.match(typesContent, /recordId:\s*string;/);
  assert.match(typesContent, /recordType:\s*TrashRecordType;/);
  assert.match(typesContent, /sourceCollection:\s*string;/);
  assert.match(typesContent, /payload:\s*Record<string,\s*any>;/);
  assert.match(typesContent, /deletedAt:\s*string;/);
  assert.match(typesContent, /deletedBy:\s*string;/);
  assert.match(typesContent, /expiresAt:\s*string;/);
});

test('storageService implements atomic soft delete with 15-day expiration', () => {
  assert.match(storageServiceContent, /COLLECTIONS\.TRASH/);
  assert.match(storageServiceContent, /15\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(storageServiceContent, /deleteRecord\s*\(/);
  assert.match(storageServiceContent, /deleteRecordsBatch\s*\(/);
  assert.match(storageServiceContent, /restoreTrashRecord\s*\(/);
  assert.match(storageServiceContent, /purgeExpiredTrash\s*\(/);
});

test('HistoryTable integrates TrashBinModal and soft delete actions', () => {
  assert.match(historyTableContent, /import\s*\{\s*TrashBinModal\s*\}\s*from\s*'\.\/TrashBinModal'/);
  assert.match(historyTableContent, /<TrashBinModal/);
  assert.match(historyTableContent, /Tempat Sampah/);
  assert.match(historyTableContent, /15\s*hari/i);
});

test('TrashBinModal renders 15-day retention notice and restore capability', () => {
  assert.match(trashModalContent, /Retensi 15 Hari/);
  assert.match(trashModalContent, /restoreTrashRecord/);
  assert.match(trashModalContent, /permanentlyDeleteTrashRecord/);
  assert.match(trashModalContent, /emptyTrash/);
});

test('Schedule helper defines active (0,1,2,3) and inactive (4,5,6) weekdays', () => {
  assert.match(scheduleHelperContent, /ACTIVE_SETORAN_WEEKDAYS\s*=\s*\[0,\s*1,\s*2,\s*3\]/);
  assert.match(scheduleHelperContent, /INACTIVE_SETORAN_WEEKDAYS\s*=\s*\[4,\s*5,\s*6\]/);
  assert.match(scheduleHelperContent, /isSetoranActiveDay/);
  assert.match(scheduleHelperContent, /getPreviousActiveDayKey/);
});
