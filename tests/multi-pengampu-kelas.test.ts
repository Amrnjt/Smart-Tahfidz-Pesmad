import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getKelasPengampuIds, isKelasDiampuOleh } from '../src/utils/classUtils.ts';
import type { Kelas } from '../src/types/index.ts';

const makeKelas = (overrides: Partial<Kelas> = {}): Kelas => ({
  id: 'KLS-1',
  namaKelas: 'Tahfidz B',
  tipeKelas: 'Tahfidz',
  santriIds: ['S-001'],
  createdAt: '2026-09-24T00:00:00.000Z',
  ...overrides,
});

test('legacy single musyrifId remains a valid pengampu', () => {
  const kelas = makeKelas({ musyrifId: 'USR-1' });
  assert.deepEqual(getKelasPengampuIds(kelas), ['USR-1']);
  assert.equal(isKelasDiampuOleh(kelas, 'USR-1'), true);
});

test('multi pengampu includes every teacher and deduplicates legacy primary id', () => {
  const kelas = makeKelas({
    musyrifId: 'USR-1',
    musyrifIds: ['USR-1', 'USR-2', 'USR-3'],
  });
  assert.deepEqual(getKelasPengampuIds(kelas), ['USR-1', 'USR-2', 'USR-3']);
  assert.equal(isKelasDiampuOleh(kelas, 'USR-2'), true);
  assert.equal(isKelasDiampuOleh(kelas, 'USR-3'), true);
  assert.equal(isKelasDiampuOleh(kelas, 'USR-X'), false);
});

test('KelasManagement persists musyrifIds and keeps one legacy primary id', () => {
  const source = readFileSync(new URL('../src/components/KelasManagement.tsx', import.meta.url), 'utf8');
  assert.match(source, /const \[newMusyrifIds, setNewMusyrifIds\] = useState<string\[]>\(\[\]\)/);
  assert.match(source, /const \[editMusyrifIds, setEditMusyrifIds\] = useState<string\[]>\(\[\]\)/);
  assert.match(source, /musyrifId: newMusyrifIds\[0\] \|\| undefined/);
  assert.match(source, /musyrifIds: newMusyrifIds/);
  assert.match(source, /musyrifId: editMusyrifIds\[0\] \|\| undefined/);
  assert.match(source, /musyrifIds: editMusyrifIds/);
  assert.match(source, /<PengampuSelector/);
  assert.match(source, /Satu kelas dapat memiliki lebih dari satu guru/);
});

test('all setoran forms resolve every class taught by the current Ustadz', () => {
  for (const relativePath of [
    '../src/components/ZiyadahForm.tsx',
    '../src/components/MurojaahForm.tsx',
    '../src/components/BinnadzorForm.tsx',
    '../src/components/PembelajaranForm.tsx',
  ]) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.match(source, /kelasList\.filter\(kelas => isKelasDiampuOleh\(kelas, currentUser\.id\)\)/, relativePath);
    assert.match(source, /new Set\(myKelasList\.flatMap\(kelas => kelas\.santriIds \|\| \[\]\)\)/, relativePath);
    assert.doesNotMatch(source, /kelasList\.find\(k => k\.musyrifId === currentUser\.id\)/, relativePath);
  }
});

test('assigned empty classes do not fall back to all santri', () => {
  for (const relativePath of [
    '../src/components/ZiyadahForm.tsx',
    '../src/components/MurojaahForm.tsx',
    '../src/components/BinnadzorForm.tsx',
    '../src/components/PembelajaranForm.tsx',
  ]) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /if \(santriIds\.size === 0\) return santriList/, relativePath);
  }
});

test('Ustadz dashboard counts classes where the user is any listed pengampu', () => {
  const source = readFileSync(new URL('../src/components/UstadzDashboard.tsx', import.meta.url), 'utf8');
  assert.match(source, /isKelasDiampuOleh\(kelas, currentUser\.id\)/);
  assert.match(source, /Atur guru pengampu pada Kelola Kelas/);
});

test('Firebase blueprint documents the multi-pengampu field', () => {
  const blueprint = readFileSync(new URL('../firebase-blueprint.json', import.meta.url), 'utf8');
  assert.match(blueprint, /"musyrifIds": \{ "type": "array" \}/);
});
