import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/UnduhLaporanModal.tsx', import.meta.url), 'utf8');

test('PDF download santri picker uses searchable input instead of a long select', () => {
  assert.match(source, /id="report-santri-search"/);
  assert.match(source, /type="search"/);
  assert.match(source, /Cari nama, ID\/NIS, atau kelas/);
  assert.doesNotMatch(source, /<option value="">Semua Santri \(Gabungan\)<\/option>/);
});

test('santri search covers name, id and class while preserving combined report option', () => {
  assert.match(source, /s\.namaSantri/);
  assert.match(source, /s\.idSantri/);
  assert.match(source, /s\.kelas/);
  assert.match(source, /Semua Santri \(Gabungan\)/);
  assert.match(source, /setSelectedSantriId\(s\.idSantri\)/);
});

test('selected santri remains visible and can be changed', () => {
  assert.match(source, /selectedSantri &&/);
  assert.match(source, />Ganti<\/button>/);
  assert.match(source, /Santri tidak ditemukan/);
});


test('PDF download filters santri from managed class list before searching', () => {
  assert.match(source, /id="report-kelas-select"/);
  assert.match(source, /<option value="ALL">Semua Kelas<\/option>/);
  assert.match(source, /selectableKelas\.map/);
  assert.match(source, /selectedKelas\.santriIds/);
  assert.match(source, /classScopedSantriList/);
});

test('changing report class clears stale santri selection and combined report stays class-scoped', () => {
  assert.match(source, /setSelectedKelasId\(event\.target\.value\)/);
  assert.match(source, /setSelectedSantriId\(''\)/);
  assert.match(source, /reportScopeSantriIds/);
  assert.match(source, /kelasNama: selectedKelas\?\.namaKelas/);
});
