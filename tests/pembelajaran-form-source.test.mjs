import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/components/PembelajaranForm.tsx', import.meta.url), 'utf8');

test('non-tahfidz input does not collect four-aspect reading quality evaluation', () => {
  assert.doesNotMatch(source, /Evaluasi Kualitas Bacaan Santri/);
  assert.doesNotMatch(source, /useState<AspekKualitas>/);
  assert.doesNotMatch(source, /\bhukumTajwid,\s*$/m);
  assert.doesNotMatch(source, /\bmakhrojHuruf,\s*$/m);
  assert.doesNotMatch(source, /\bkefasihan,\s*$/m);
  assert.doesNotMatch(source, /\bkelancaran,\s*$/m);
});

test('non-tahfidz input still records learning assessment and progress', () => {
  assert.match(source, /Predikat Nilai Pembelajaran/);
  assert.match(source, /Status Kenaikan \/ Progres Materi/);
  assert.match(source, /\bnilai,\s*$/m);
  assert.match(source, /\bstatusKenaikan,\s*$/m);
  assert.match(source, /\bpokokBahasan:/);
  assert.match(source, /\btahapIstimewa:/);
  assert.match(source, /\bkendalaSantri:/);
  assert.match(source, /\brekomendasiTindakLanjut:/);
});


test('kelas istimewa input uses the shared ustadz notes instead of a separate obstacle observation field', () => {
  assert.doesNotMatch(source, /Catatan Observasi Kendala Santri/);
  assert.doesNotMatch(source, /useState\(['\"]['\"]\).*kendalaSantri/);
  assert.doesNotMatch(source, /\\bkendalaSantri:/);
  assert.match(source, /Catatan Ustadz & Rekomendasi Khusus/);
});
