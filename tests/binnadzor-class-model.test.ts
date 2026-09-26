import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getClassGroup, matchesClassGroup } from '../src/utils/classUtils.ts';
import { normalizeTipeKelas } from '../src/services/storageCore.ts';

test('Binnadzor is one canonical type while operational class names may use A/B/C/D', () => {
  for (const name of ['Binnadzor A', 'Binnadzor B', 'Binnadzor C', 'Binnadzor D']) {
    assert.equal(getClassGroup(name), 'Binnadzor');
    assert.equal(normalizeTipeKelas(name), 'Binnadzor');
    assert.equal(matchesClassGroup(name, 'Binnadzor'), true);
  }
});

test('TipeKelas contract contains only canonical Binnadzor, not lettered variants', () => {
  const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
  const typeBlock = types.slice(
    types.indexOf('export type TipeKelas'),
    types.indexOf('export const TIPE_KELAS_OPTIONS')
  );
  assert.match(typeBlock, /\| 'Binnadzor'/);
  assert.doesNotMatch(typeBlock, /Binnadzor A/);
  assert.doesNotMatch(typeBlock, /Binnadzor B/);
});

test('Santri form exposes only Binnadzor as the Al-Quran type', () => {
  const source = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');
  assert.match(source, /<option value="Binnadzor">Binnadzor<\/option>/);
  assert.doesNotMatch(source, /<option value="Binnadzor A">/);
  assert.doesNotMatch(source, /<option value="Binnadzor B">/);
});

test('Kelas model keeps operational class name separate from canonical type', () => {
  const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
  assert.match(types, /namaKelas: string;/);
  assert.match(types, /tipeKelas: TipeKelas;/);
});
