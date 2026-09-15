import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const storage = readFileSync(
  new URL('../src/services/storageService.ts', import.meta.url),
  'utf8',
);
const dashboards = ['UstadzDashboard', 'WaliDashboard', 'SantriDashboard']
  .map(name => readFileSync(
    new URL(`../src/components/${name}.tsx`, import.meta.url),
    'utf8',
  ));

test('App uses explicit recent and analytics channels', () => {
  assert.match(app, /useRecentSetoranRecords/);
  assert.match(app, /useAnalyticsSetoranRecords/);
  assert.match(app, /recentRecords=/);
  assert.match(app, /analyticsRecords=/);
});

test('reference synchronization has no setoran collection listener', () => {
  const referenceListener = storage.slice(
    storage.indexOf('initReferenceRealtimeSync'),
    storage.indexOf('async saveZiyadah'),
  );
  const referenceRefresh = storage.slice(
    storage.indexOf('async syncReferenceDataWithCloud'),
    storage.indexOf('async fetchRecordsForDateRange'),
  );
  assert.ok(referenceListener.length > 0, 'reference listener must exist');
  assert.ok(referenceRefresh.length > 0, 'reference refresh must exist');

  for (const collection of ['ZIYADAH', 'MUROJAAH', 'BINNADZOR', 'PEMBELAJARAN']) {
    const collectionPattern = new RegExp(`COLLECTIONS\\.${collection}`);
    assert.doesNotMatch(referenceListener, collectionPattern);
    assert.doesNotMatch(referenceRefresh, collectionPattern);
  }
});

test('all dashboards distinguish recent and analytics records', () => {
  for (const dashboard of dashboards) {
    assert.match(dashboard, /recentRecords/);
    assert.match(dashboard, /analyticsRecords/);
  }
});

test('History loads explicit ranges and has no storage fallback', () => {
  const history = readFileSync(
    new URL('../src/components/HistoryTable.tsx', import.meta.url),
    'utf8',
  );
  assert.match(history, /useHistoricalSetoranRecords/);
  assert.match(history, /loadRange/);
  assert.match(history, /loadAll/);
  assert.doesNotMatch(history, /storageService\.getBinnadzorRecords/);
  assert.doesNotMatch(history, /storageService\.getPembelajaranRecords/);
});

test('PDF fetches its selected range before generation', () => {
  const modal = readFileSync(
    new URL('../src/components/UnduhLaporanModal.tsx', import.meta.url),
    'utf8',
  );
  assert.match(modal, /loadReportRecords/);
  assert.match(modal, /await loadReportRecords/);
});

test('default startup and manual sync contain no full setoran read', () => {
  const normalStart = storage.indexOf('initReferenceRealtimeSync');
  const rollbackStart = storage.indexOf('async legacyFullSetoranSync');
  assert.ok(normalStart >= 0, 'normal reference sync must exist');
  assert.ok(rollbackStart > normalStart, 'rollback path must be isolated after normal sync');
  assert.match(
    storage,
    /VITE_ENABLE_LEGACY_FULL_SETORAN_SYNC\s*===\s*'true'/,
    'rollback must require an explicit environment switch',
  );

  const normalReadPath = storage.slice(normalStart, rollbackStart);
  const forbidden = [
    /onSnapshot\(collection\(db, COLLECTIONS\.ZIYADAH\)/,
    /onSnapshot\(collection\(db, COLLECTIONS\.MUROJAAH\)/,
    /onSnapshot\(collection\(db, COLLECTIONS\.BINNADZOR\)/,
    /onSnapshot\(collection\(db, COLLECTIONS\.PEMBELAJARAN\)/,
    /getDocs\(collection\(db, COLLECTIONS\.ZIYADAH\)\)/,
    /getDocs\(collection\(db, COLLECTIONS\.MUROJAAH\)\)/,
    /getDocs\(collection\(db, COLLECTIONS\.BINNADZOR\)\)/,
    /getDocs\(collection\(db, COLLECTIONS\.PEMBELAJARAN\)\)/,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(normalReadPath, pattern);
});
