import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const service = readFileSync(new URL('../src/services/academicReportService.ts', import.meta.url), 'utf8');
const pdf = readFileSync(new URL('../src/utils/academicReportPdf.ts', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../src/components/AcademicReportModal.tsx', import.meta.url), 'utf8');
const management = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');

test('academic report uses July-June school year boundaries', () => {
  assert.match(service, /startDate: `\$\{startYear\}-07-01`/);
  assert.match(service, /endDate: `\$\{startYear\}-12-31`/);
  assert.match(service, /startDate: `\$\{endYear\}-01-01`/);
  assert.match(service, /endDate: `\$\{endYear\}-06-30`/);
  assert.match(service, /label: `Tahun Pelajaran \$\{tahunPelajaran\}`/);
});

test('report data is fetched with a student-scoped bounded history query', () => {
  assert.match(service, /fetchHistoryRange\(\{/);
  assert.match(service, /startDate: range\.startDate/);
  assert.match(service, /endDate: range\.endDate/);
  assert.match(service, /scope: \{ kind: 'student', idSantri: request\.santri\.idSantri \}/);
  assert.match(service, /storageService\.fetchAcademicHistory\(request\.santri\.idSantri\)/);
});

test('report summarizes all four Smart Tahfidz activity types and categorical quality scores', () => {
  assert.match(service, /'Ziyadah'/);
  assert.match(service, /'Murojaah'/);
  assert.match(service, /'Binnadzor'/);
  assert.match(service, /'Pembelajaran'/);
  assert.match(service, /Mengulang: 1/);
  assert.match(service, /Kurang: 2/);
  assert.match(service, /Baik: 3/);
  assert.match(service, /'Sangat Baik': 4/);
  assert.match(service, /activeDays/);
  assert.match(service, /totalZiyadahAyat/);
});

test('PDF clearly labels the quality index as internal and not a formal school grade', () => {
  assert.match(pdf, /Indeks Kualitas menggunakan skala internal 1-4/);
  assert.match(pdf, /bukan nilai rapor sekolah formal/);
  assert.match(pdf, /REKAP AKADEMIK SMART TAHFIDZ/);
  assert.match(pdf, /DISTRIBUSI NILAI SETORAN/);
  assert.match(pdf, /pdf\.save\(/);
});

test('academic report modal supports semester and full-year preview before PDF download', () => {
  assert.match(modal, /Rekap Akademik & PDF/);
  assert.match(modal, /Per Semester/);
  assert.match(modal, /1 Tahun Pelajaran/);
  assert.match(modal, /fetchAcademicReport/);
  assert.match(modal, /downloadAcademicReportPdf/);
  assert.match(modal, /Mengambil rekap dari Cloud Firestore/);
  assert.match(modal, /Indeks ini bukan nilai rapor sekolah formal/);
});

test('santri management exposes report access for active students and alumni alike', () => {
  assert.match(management, /setReportSantri\(santri\)/);
  assert.match(management, /Rekap & PDF/);
  assert.match(management, /<AcademicReportModal/);
  assert.doesNotMatch(management, /statusAkademikFormal[^\n]*Rekap & PDF/);
});


test('PDF keeps the activity excerpt bounded and identifies the data source', () => {
  assert.match(pdf, /summary\.records\.slice\(0, 20\)/);
  assert.match(pdf, /Cloud Firestore/);
  assert.match(pdf, /Scoped cache/);
});
