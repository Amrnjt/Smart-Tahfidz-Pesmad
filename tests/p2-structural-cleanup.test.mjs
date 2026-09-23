import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const realtime = readFileSync(new URL('../src/services/realtimeService.ts', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const cssEntry = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const vite = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const history = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');
const santriManagement = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');

test('P2 removes legacy storage APIs and delegates realtime work', () => {
  for (const legacy of ['initRealtimeSync', 'fetchRecordsForDateRange', 'fetchRecordsForDate', 'resetToDefault']) {
    assert.doesNotMatch(storage, new RegExp(legacy));
  }

  assert.doesNotMatch(storage, /onSnapshot\(/);
  assert.match(storage, /realtimeService\.subscribeMasterData/);
  assert.match(storage, /realtimeService\.subscribePantauanLiburan/);
  assert.match(storage, /realtimeService\.subscribeRecentSetoran/);
});

test('P2 realtime module keeps bounded and scoped query contracts', () => {
  assert.match(realtime, /where\('timestamp', '>=',/);
  assert.match(realtime, /where\('timestamp', '<=',/);
  assert.match(realtime, /orderBy\('timestamp', 'desc'\)/);
  assert.match(realtime, /where\('idSantri', '==', request\.scope\.idSantri\)/);
  assert.match(realtime, /maxRecords \?\? 500/);
});

test('P2 centralizes CSS ordering without dropping release layers', () => {
  assert.match(main, /import '\.\/styles\/app\.css';/);

  const layers = [
    '../index.css',
    '../design-foundation.css',
    '../app-shell.css',
    '../dashboard-experience.css',
    '../input-workflow.css',
    '../history-experience.css',
    '../motion-finish.css',
    '../release-polish.css',
    '../responsive-accessibility.css',
    '../santri-experience-finish.css',
    '../chrome-transition-fix.css',
    '../ustadz-experience-finish.css',
    '../setoran-workflow-finish.css',
    '../setor-dropup.css'
  ];

  let previous = -1;
  for (const layer of layers) {
    const index = cssEntry.indexOf(layer);
    assert.ok(index > previous, `${layer} must keep its CSS cascade order`);
    previous = index;
  }
});

test('P2 creates stable vendor chunks for heavy runtime dependencies', () => {
  for (const chunk of ['react-vendor', 'firebase-vendor', 'charts-vendor', 'motion-vendor', 'icons-vendor']) {
    assert.match(vite, new RegExp(`['"]${chunk}['"]`));
  }
});

test('P2 extracts static models from the two largest UI files', () => {
  assert.match(history, /history\/historyTableConfig/);
  assert.doesNotMatch(history, /const NAMA_BULAN = \[/);
  assert.match(santriManagement, /santri\/santriManagementModel/);
  assert.doesNotMatch(santriManagement, /const getWaliCredentialText =/);
});
