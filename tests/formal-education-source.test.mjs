import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
const santriManagement = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');

test('formal education fields are optional and do not replace Quran class grouping', () => {
  assert.match(types, /kelas: string;/);
  assert.match(types, /satuanPendidikan\?: string;/);
  assert.match(types, /kelasFormal\?: string;/);
  assert.match(types, /Kelompok pembelajaran Al-Qur'an berdasarkan kemampuan\/kecakapan santri/);
});

test('santri create and edit flows persist formal education metadata', () => {
  assert.match(santriManagement, /satuanPendidikan: newSatuanPendidikan\.trim\(\)/);
  assert.match(santriManagement, /kelasFormal: newKelasFormal\.trim\(\)/);
  assert.match(santriManagement, /satuanPendidikan: editSantriSatuanPendidikan\.trim\(\)/);
  assert.match(santriManagement, /kelasFormal: editSantriKelasFormal\.trim\(\)/);
});

test('santri page distinguishes Quran class from formal education and supports formal filters', () => {
  assert.match(santriManagement, /Kelas Al-Qur'an/);
  assert.match(santriManagement, /Satuan Pendidikan/);
  assert.match(santriManagement, /Kelas Formal/);
  assert.match(santriManagement, /satuanPendidikanFilter/);
  assert.match(santriManagement, /kelasFormalFilter/);
  assert.match(santriManagement, /getFormalLabel/);
  assert.match(santriManagement, /Al-Qur'an · \{santri\.kelas\}/);
});
