import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const service = readFileSync(new URL('../src/services/collectiveAcademicReportService.ts', import.meta.url), 'utf8');
const pdf = readFileSync(new URL('../src/utils/collectiveAcademicReportPdf.ts', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../src/components/CollectiveAcademicReportModal.tsx', import.meta.url), 'utf8');
const management = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');

test('collective report queries academic snapshots by bounded school period', () => {
  assert.match(storage, /async fetchAcademicHistoryByPeriod\(/);
  assert.match(storage, /where\('tahunPelajaran', '==', tahunPelajaran\.trim\(\)\)/);
  assert.match(storage, /where\('semester', '==', semester\)/);
});

test('collective membership comes from historical formal-class snapshots, not current santri class', () => {
  assert.match(service, /storageService\.fetchAcademicHistoryByPeriod/);
  assert.match(service, /snapshot\.kelasFormal === request\.kelasFormal/);
  assert.match(service, /const cohortIds = new Set\(snapshotsBySantri\.keys\(\)\)/);
  assert.doesNotMatch(service, /santri\.kelasFormal === request\.kelasFormal/);
});

test('collective setoran query is bounded once by period and then grouped by cohort members', () => {
  assert.match(service, /fetchHistoryRange\(\{/);
  assert.match(service, /startDate: range\.startDate/);
  assert.match(service, /endDate: range\.endDate/);
  assert.match(service, /scope: \{ kind: 'staff' \}/);
  assert.match(service, /history\.records\.filter\(record => cohortIds\.has\(record\.idSantri\)\)/);
});

test('collective report includes active students and alumni when snapshots place them in the selected cohort', () => {
  assert.match(service, /statusAkademikFormal \|\| 'Aktif'/);
  assert.match(modal, /Alumni tetap masuk bila memiliki snapshot pada kelas dan periode yang dipilih/);
  assert.match(modal, /tidak dipindahkan ke kelas baru dalam laporan historis/);
});

test('collective preview exposes all requested Smart Tahfidz metrics', () => {
  assert.match(modal, /Rekap Kolektif Kelas Formal/);
  assert.match(modal, /Ziyadah/);
  assert.match(modal, /Muroja'ah/);
  assert.match(modal, /Binnadzor/);
  assert.match(modal, /Materi/);
  assert.match(modal, /Total Setoran/);
  assert.match(modal, /Hari/);
  assert.match(modal, /Ayat/);
  assert.match(modal, /Indeks/);
});

test('collective PDF is A4 landscape and explains the internal quality index', () => {
  assert.match(pdf, /new JsPDF\('l', 'mm', 'a4'\)/);
  assert.match(pdf, /REKAP KOLEKTIF SMART TAHFIDZ/);
  assert.match(pdf, /Indeks Kualitas adalah skala internal 1–4/);
  assert.match(pdf, /bukan nilai rapor sekolah formal/);
  assert.match(pdf, /pdf\.save\(/);
});

test('santri management exposes collective report without restricting it to current active class filters', () => {
  assert.match(management, /Rekap Kolektif/);
  assert.match(management, /setShowCollectiveReport\(true\)/);
  assert.match(management, /<CollectiveAcademicReportModal/);
});


test('collective PDF guards table width before rendering rows', () => {
  assert.match(pdf, /if \(tableWidth > contentWidth\)/);
  assert.match(pdf, /Lebar tabel rekap kolektif melebihi area PDF/);
});
