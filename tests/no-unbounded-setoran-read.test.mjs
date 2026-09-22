import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const history = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');

test('app state no longer initializes setoran from lifetime local caches', () => {
  assert.doesNotMatch(app, /useState<ZiyadahRecord\[\]>\(\(\)\s*=>[\s\S]*?getZiyadahRecords/);
  assert.doesNotMatch(app, /useState<MurojaahRecord\[\]>\(\(\)\s*=>[\s\S]*?getMurojaahRecords/);
  assert.match(app, /startDate:\s*addDaysToDateInput|const startDate = addDaysToDateInput/);
});

test('HistoryTable owns bounded query data instead of merging global arrays', () => {
  assert.match(history, /useHistoryRange\(activeRangeRequest\)/);
  assert.match(history, /useHistoryArchive\(historyScope, dateFilterMode === 'all'\)/);
  assert.doesNotMatch(history, /actualBinnadzor\s*=\s*binnadzorRecords\s*\|\|\s*storageService\.getBinnadzorRecords/);
});
