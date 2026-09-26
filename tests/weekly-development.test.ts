import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWeeklyQuality, getWeekStart } from '../src/utils/weeklyDevelopment.ts';
import { getDevelopmentAllowedSantriIds } from '../src/utils/developmentScope.ts';

test('weeks start on Sunday across month and year boundaries', () => {
  assert.equal(getWeekStart('2027-01-01 19:00'), '2026-12-27');
  assert.equal(getWeekStart('2027-01-03T19:00:00'), '2027-01-03');
  assert.equal(getWeekStart('invalid'), null);
});

test('weekly percentages use real totals and sum to 100', () => {
  const rows = buildWeeklyQuality([
    { timestamp: '2026-09-13 19:00', nilai: 'Baik' },
    { timestamp: '2026-09-14 19:00', nilai: 'Mengulang' },
    { timestamp: '2026-09-19 19:00', nilai: 'Kurang' },
    { timestamp: '2026-09-20 19:00', nilai: 'Sangat Baik' },
  ], '2026-09-20', 2);
  assert.deepEqual(rows.map(row => row.total), [3, 1]);
  assert.deepEqual(rows[0].counts, { Mengulang: 1, Kurang: 1, Baik: 1, 'Sangat Baik': 0 });
  assert.equal(rows[0].Mengulang + rows[0].Kurang + rows[0].Baik + rows[0]['Sangat Baik'], 100);
  assert.equal(rows[1]['Sangat Baik'], 100);
});

test('empty weeks stay empty instead of looking like poor scores', () => {
  const rows = buildWeeklyQuality([{ timestamp: '2026-09-20', nilai: 'Baik' }], '2026-09-20', 3);
  assert.deepEqual(rows.map(row => row.total), [0, 0, 1]);
  assert.equal(rows[0].Baik, 0);
});


test('aggregate Binnadzor keeps records independent of class membership arrays', () => {
  const allowed = getDevelopmentAllowedSantriIds({
    selectedKelas: null,
    kelasList: [
      { id: 'BA', namaKelas: 'Binnadzor A', tipeKelas: 'Binnadzor A', santriIds: [], createdAt: '2026-09-01' },
      { id: 'BB', namaKelas: 'Binnadzor B', tipeKelas: 'Binnadzor B', santriIds: [], createdAt: '2026-09-01' },
    ],
    santriList: [],
    activeTipeKelas: 'Binnadzor',
  });
  assert.equal(allowed, null);
});

test('selected Binnadzor A/B class still scopes by explicit membership', () => {
  const selectedKelas = {
    id: 'BA',
    namaKelas: 'Binnadzor A',
    tipeKelas: 'Binnadzor A' as const,
    santriIds: ['S-001'],
    createdAt: '2026-09-01',
  };
  const allowed = getDevelopmentAllowedSantriIds({
    selectedKelas,
    kelasList: [selectedKelas],
    santriList: [],
    activeTipeKelas: 'Binnadzor A',
  });
  assert.deepEqual([...allowed!], ['S-001']);
});

test('empty selected Binnadzor class falls back to santri class identity', () => {
  const selectedKelas = {
    id: 'BB',
    namaKelas: 'Binnadzor B',
    tipeKelas: 'Binnadzor B' as const,
    santriIds: [],
    createdAt: '2026-09-01',
  };
  const allowed = getDevelopmentAllowedSantriIds({
    selectedKelas,
    kelasList: [selectedKelas],
    santriList: [
      { idSantri: 'S-002', namaSantri: 'Santri B', kelas: 'Binnadzor B', targetHafalan: '-' },
      { idSantri: 'S-003', namaSantri: 'Santri A', kelas: 'Binnadzor A', targetHafalan: '-' },
    ],
    activeTipeKelas: 'Binnadzor B',
  });
  assert.deepEqual([...allowed!], ['S-002']);
});

test('empty selected class without fallback does not hide all development records', () => {
  const selectedKelas = {
    id: 'BA',
    namaKelas: 'Binnadzor A',
    tipeKelas: 'Binnadzor A' as const,
    santriIds: [],
    createdAt: '2026-09-01',
  };
  const allowed = getDevelopmentAllowedSantriIds({
    selectedKelas,
    kelasList: [selectedKelas],
    santriList: [],
    activeTipeKelas: 'Binnadzor A',
  });
  assert.equal(allowed, null);
});
