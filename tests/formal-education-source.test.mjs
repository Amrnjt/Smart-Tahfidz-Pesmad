import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
const santriManagement = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');

test('formal education fields are structured without replacing Quran class grouping', () => {
  assert.match(types, /kelas: string;/);
  assert.match(types, /export type SatuanPendidikanFormal = 'MTs';/);
  assert.match(types, /SATUAN_PENDIDIKAN_FORMAL_OPTIONS: SatuanPendidikanFormal\[\] = \['MTs'\]/);
  assert.match(types, /export type KelasFormal = 'VII' \| 'VIII' \| 'IX';/);
  assert.match(types, /KELAS_FORMAL_OPTIONS: KelasFormal\[\] = \['VII', 'VIII', 'IX'\]/);
  assert.match(types, /satuanPendidikan\?: SatuanPendidikanFormal;/);
  assert.match(types, /kelasFormal\?: KelasFormal;/);
  assert.match(types, /Kelompok pembelajaran Al-Qur'an berdasarkan kemampuan\/kecakapan santri/);
});

test('santri create and edit flows persist structured formal education metadata', () => {
  assert.match(santriManagement, /satuanPendidikan: newSatuanPendidikan/);
  assert.match(santriManagement, /kelasFormal: newKelasFormal \|\| undefined/);
  assert.match(santriManagement, /satuanPendidikan: editSantriSatuanPendidikan \|\| undefined/);
  assert.match(santriManagement, /kelasFormal: editSantriKelasFormal \|\| undefined/);
});

test('formal fields use controlled MTs and VII-VIII-IX selects', () => {
  assert.match(santriManagement, /SATUAN_PENDIDIKAN_FORMAL_OPTIONS\.map/);
  assert.match(santriManagement, /KELAS_FORMAL_OPTIONS\.map/);
  assert.match(santriManagement, /-- Pilih Kelas Formal --/);
  assert.match(santriManagement, /required[\s\S]*?value=\{newKelasFormal\}/);
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
