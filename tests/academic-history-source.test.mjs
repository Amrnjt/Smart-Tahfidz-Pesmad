import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const storageCore = readFileSync(new URL('../src/services/storageCore.ts', import.meta.url), 'utf8');
const santriManagement = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('academic period is stored independently from current formal class', () => {
  assert.match(types, /export type SemesterAkademik = 'Ganjil' \| 'Genap';/);
  assert.match(types, /tahunPelajaranAktif\?: string;/);
  assert.match(types, /semesterAkademikAktif\?: SemesterAkademik;/);
  assert.match(storage, /async setAcademicPeriod\(/);
  assert.match(storage, /Tahun pelajaran harus berformat YYYY\/YYYY/);
});

test('academic history stores a semester snapshot instead of deriving history from current santri state', () => {
  assert.match(types, /export interface RiwayatAkademikRecord/);
  assert.match(types, /tahunPelajaran: string;/);
  assert.match(types, /semester: SemesterAkademik;/);
  assert.match(types, /kelasFormal: KelasFormal;/);
  assert.match(types, /kelasAlQuran\?: string;/);
  assert.match(storageCore, /ACADEMIC_HISTORY: 'academic_history'/);
  assert.match(storage, /async upsertAcademicHistory\(/);
  assert.match(storage, /const id = `\$\{santri\.idSantri\}_\$\{safeYear\}_\$\{semester\.toLowerCase\(\)\}`/);
  assert.match(storage, /setDoc\(doc\(db, COLLECTIONS\.ACADEMIC_HISTORY, id\)/);
  assert.match(rules, /match \/academic_history\/\{id\}/);
});

test('santri form writes academic snapshots after create and edit', () => {
  assert.match(santriManagement, /await storageService\.upsertAcademicHistory\(updatedSantri/);
  assert.match(santriManagement, /await storageService\.upsertAcademicHistory\(newSantri/);
});

test('academic period and per-santri history are visible in the santri management UI', () => {
  assert.match(santriManagement, /id="academic-period-card"/);
  assert.match(santriManagement, /Periode Akademik Aktif/);
  assert.match(santriManagement, /Tahun Pelajaran/);
  assert.match(santriManagement, /Semester/);
  assert.match(santriManagement, /Riwayat Formal/);
  assert.match(santriManagement, /Simpan Snapshot Periode Aktif/);
  assert.match(santriManagement, /storageService\.fetchAcademicHistory/);
});

test('changing academic period explicitly does not promote formal classes', () => {
  const start = santriManagement.indexOf('const handleSaveAcademicPeriod');
  const end = santriManagement.indexOf('const loadAcademicHistory', start);
  assert.ok(start >= 0 && end > start);
  const block = santriManagement.slice(start, end);
  assert.match(block, /storageService\.setAcademicPeriod/);
  assert.doesNotMatch(block, /updateSantri/);
  assert.doesNotMatch(block, /kelasFormal/);
});


test('formal history Firestore access is explicitly declared', () => {
  assert.match(rules, /match \/academic_history\/\{id\}/);
  assert.match(rules, /allow read, write: if true;/);
});
