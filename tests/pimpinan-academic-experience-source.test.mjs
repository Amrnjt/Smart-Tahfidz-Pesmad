import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const dash = readFileSync(new URL('../src/components/UstadzDashboard.tsx', import.meta.url), 'utf8');
const overview = readFileSync(new URL('../src/components/dashboard/PimpinanAcademicOverview.tsx', import.meta.url), 'utf8');

test('pimpinan keeps the shared dashboard but receives a dedicated executive academic overview', () => {
  assert.match(dash, /const isPimpinan = normalizedRole === 'pimpinan'/);
  assert.match(dash, /isPimpinan && \(/);
  assert.match(dash, /<PimpinanAcademicOverview/);
  assert.match(dash, /onOpenCollectiveReport=\{\(\) => setShowCollectiveReport\(true\)\}/);
});

test('executive overview reports active students, formal classes VII-IX, and alumni', () => {
  assert.match(overview, /statusAkademikFormal \|\| 'Aktif'/);
  assert.match(overview, /santri\.statusAkademikFormal === 'Lulus'/);
  assert.match(overview, /countClass\('VII'\)/);
  assert.match(overview, /countClass\('VIII'\)/);
  assert.match(overview, /countClass\('IX'\)/);
  assert.match(overview, /label="Santri Aktif"/);
  assert.match(overview, /label="Alumni"/);
});

test('pimpinan academic surface is explicitly view-only and contains no mutation APIs', () => {
  assert.match(overview, /Mode Pimpinan · View-only/);
  assert.doesNotMatch(overview, /promoteFormalCohort/);
  assert.doesNotMatch(overview, /setAcademicPeriod/);
  assert.doesNotMatch(overview, /upsertAcademicHistory/);
  assert.doesNotMatch(overview, /updateSantri|deleteSantri|addSantri/);
});

test('pimpinan can open collective academic report but not operational santri or setor forms', () => {
  assert.match(dash, /<CollectiveAcademicReportModal/);
  assert.match(dash, /santriList=\{santriList\}/);
  assert.match(dash, /currentUser=\{currentUser\}/);
  assert.match(app, /activeTab === 'ziyadah' && isUstadz/);
  assert.match(app, /activeTab === 'santri' && isUstadz/);
  assert.match(app, /activeTab === 'kelas' && isUstadz/);
});

test('app wires notification feedback into shared staff dashboard report flow', () => {
  const start = app.indexOf('<UstadzDashboard');
  const end = app.indexOf('/>', start);
  assert.ok(start >= 0 && end > start);
  const block = app.slice(start, end);
  assert.match(block, /onNotify=\{notify\}/);
});

test('collective report button is the only academic action in the executive overview', () => {
  assert.match(overview, /Rekap Kolektif/);
  assert.match(overview, /onClick=\{onOpenCollectiveReport\}/);
});


test('formal class counts exclude alumni by deriving VII-IX from active students only', () => {
  assert.match(overview, /const active = santriList\.filter/);
  assert.match(overview, /const countClass = \(kelas: 'VII' \| 'VIII' \| 'IX'\) =>\s*active\.filter/);
});
