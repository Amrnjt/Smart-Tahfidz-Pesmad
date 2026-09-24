import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const dash = readFileSync(new URL('../src/components/UstadzDashboard.tsx', import.meta.url), 'utf8');
const center = readFileSync(new URL('../src/components/dashboard/SuperadminControlCenter.tsx', import.meta.url), 'utf8');

test('superadmin control center is rendered only for Superadmin', () => {
  assert.match(dash, /const isSuperadmin = normalizedRole === 'superadmin'/);
  assert.match(dash, /isSuperadmin && \(/);
  assert.match(dash, /<SuperadminControlCenter/);
});

test('control center health checks active formal data and personal account linkage', () => {
  assert.match(center, /statusAkademikFormal \|\| 'Aktif'/);
  assert.match(center, /!santri\.satuanPendidikan \|\| !santri\.kelasFormal/);
  assert.match(center, /role === 'wali' \|\| role === 'santri'/);
  assert.match(center, /!idSantri \|\| !knownSantriIds\.has\(idSantri\)/);
});

test('duplicate santri IDs are detected without mutating master data', () => {
  assert.match(center, /const idFrequency = new Map<string, number>\(\)/);
  assert.match(center, /filter\(count => count > 1\)\.length/);
  assert.doesNotMatch(center, /storageService/);
  assert.doesNotMatch(center, /updateSantri|deleteSantri|addSantri/);
});

test('formal distribution VII-IX comes from active students and alumni stay separate', () => {
  assert.match(center, /const countFormalClass = \(kelas: 'VII' \| 'VIII' \| 'IX'\) =>\s*activeSantri\.filter/);
  assert.match(center, /statusAkademikFormal === 'Lulus'/);
  assert.match(center, /label="Kelas VII"/);
  assert.match(center, /label="Kelas VIII"/);
  assert.match(center, /label="Kelas IX"/);
  assert.match(center, /label="Alumni"/);
});

test('superadmin shortcuts reuse existing sanctioned administration surfaces', () => {
  assert.match(dash, /onOpenSantri=\{\(\) => setActiveTab\('santri'\)\}/);
  assert.match(dash, /onOpenKelas=\{\(\) => setActiveTab\('kelas'\)\}/);
  assert.match(dash, /onOpenCollectiveReport=\{\(\) => setShowCollectiveReport\(true\)\}/);
  assert.match(center, /Kelola Santri & Akun/);
  assert.match(center, /Kelola Kelas Al-Qur'an/);
  assert.match(center, /Rekap Kolektif/);
});

test('collective report can be opened by Pimpinan or Superadmin, while mutation pages remain isUstadz-gated', () => {
  assert.match(dash, /\(isPimpinan \|\| isSuperadmin\) && showCollectiveReport/);
  assert.match(app, /activeTab === 'santri' && isUstadz/);
  assert.match(app, /activeTab === 'kelas' && isUstadz/);
});

test('app passes realtime users master data into the shared staff dashboard', () => {
  const start = app.indexOf('<UstadzDashboard');
  const end = app.indexOf('/>', start);
  assert.ok(start >= 0 && end > start);
  const block = app.slice(start, end);
  assert.match(block, /userList=\{userList\}/);
});


test('formal completeness warning ignores alumni and evaluates active students only', () => {
  assert.match(center, /const activeSantri = santriList\.filter/);
  assert.match(center, /const formalIncomplete = activeSantri\.filter/);
});
