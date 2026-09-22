import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const santriManagement = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('formal promotion model includes active and graduated states', () => {
  assert.match(types, /export type StatusAkademikFormal = 'Aktif' \| 'Lulus';/);
  assert.match(types, /statusAkademikFormal\?: StatusAkademikFormal;/);
  assert.match(types, /tahunLulus\?: string;/);
  assert.match(types, /tanggalLulus\?: string;/);
  assert.match(types, /export interface KenaikanKelasFormalRecord/);
  assert.match(types, /kelasTujuan: KelasFormal \| 'Lulus';/);
});

test('promotion only runs from a saved Genap period and derives the next school year', () => {
  const start = storage.indexOf('async promoteFormalCohort');
  const end = storage.indexOf('subscribeMasterData', start);
  assert.ok(start >= 0 && end > start);
  const block = storage.slice(start, end);

  assert.match(block, /semester !== 'Genap'/);
  assert.match(block, /Kenaikan kelas formal hanya dapat diproses pada Semester Genap/);
  assert.match(block, /getNextTahunPelajaran\(tahunPelajaranAsal\)/);
});

test('promotion uses deterministic run log to block duplicate cohort processing', () => {
  assert.match(storage, /ACADEMIC_PROMOTIONS: 'academic_promotions'/);
  assert.match(storage, /const promotionId = `\$\{tahunPelajaranAsal\.replace\('\/', '-'\)\}_\$\{kelasAsal\}`/);
  assert.match(storage, /existingPromotion\.exists\(\)/);
  assert.match(storage, /sudah diproses untuk Tahun Pelajaran/);
  assert.match(rules, /match \/academic_promotions\/\{id\}/);
});

test('VII and VIII promotion writes source and next-year history snapshots without changing Quran class', () => {
  const start = storage.indexOf('async promoteFormalCohort');
  const end = storage.indexOf('subscribeMasterData', start);
  const block = storage.slice(start, end);

  assert.match(block, /kelasAsal === 'VII' \? 'VIII'/);
  assert.match(block, /kelasAsal === 'VIII' \? 'IX'/);
  assert.match(block, /sourceHistoryId/);
  assert.match(block, /targetHistoryId/);
  assert.match(block, /semester: 'Ganjil'/);
  assert.match(block, /kelasFormal: kelasTujuan/);
  assert.doesNotMatch(block, /batch\.set\(doc\(db, COLLECTIONS\.SANTRI, santri\.idSantri\), cleanForFirestore\(\{[\s\S]*?kelas:/);
});

test('class IX graduation preserves santri record and marks alumni instead of deleting it', () => {
  const start = storage.indexOf('async promoteFormalCohort');
  const end = storage.indexOf('subscribeMasterData', start);
  const block = storage.slice(start, end);

  assert.match(block, /kelasTujuan === 'Lulus'/);
  assert.match(block, /statusAkademikFormal: 'Lulus'/);
  assert.match(block, /tahunLulus:/);
  assert.match(block, /tanggalLulus:/);
  assert.doesNotMatch(block, /deleteDoc/);
});

test('promotion UI exposes three cohort previews and graduation confirmation', () => {
  assert.match(santriManagement, /id="formal-promotion-card"/);
  assert.match(santriManagement, /Kenaikan Kelas Formal/);
  assert.match(santriManagement, /\(\['VII', 'VIII', 'IX'\] as KelasFormal\[\]\)\.map/);
  assert.match(santriManagement, /Preview Kenaikan/);
  assert.match(santriManagement, /Preview Kelulusan/);
  assert.match(santriManagement, /Luluskan \$\{candidates\.length\} Santri/);
  assert.match(santriManagement, /statusAkademikFormal \|\| 'Aktif'/);
});

test('processed cohorts are disabled in the UI and cannot be previewed again', () => {
  assert.match(santriManagement, /const processed = promotionRuns\[kelas\]/);
  assert.match(santriManagement, /Boolean\(processed\)/);
  assert.match(santriManagement, /Sudah diproses/);
});


test('promotion keeps a bounded cloud batch and commits before local cache is treated as updated', () => {
  const start = storage.indexOf('async promoteFormalCohort');
  const end = storage.indexOf('subscribeMasterData', start);
  const block = storage.slice(start, end);

  assert.match(block, /candidates\.length > 150/);
  assert.match(block, /const batch = writeBatch\(db\)/);
  assert.match(block, /await batch\.commit\(\)/);
  assert.ok(block.indexOf('await batch.commit()') < block.indexOf('writeArrayCache(STORAGE_KEYS.SANTRI'));
});
