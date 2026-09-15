import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMonthRange,
  createRecentRange,
  mergeSetoranDatasets,
  sortAndDedupeRecords,
} from '../src/utils/setoranDataset';
import { EMPTY_SETORAN_DATASET } from '../src/services/setoranQuery.types';

test('sortAndDedupeRecords keeps one record per id and sorts newest first', () => {
  const result = sortAndDedupeRecords([
    { id: 'A', timestamp: '2026-09-14 08:00' },
    { id: 'B', timestamp: '2026-09-15 07:00' },
    { id: 'A', timestamp: '2026-09-14 08:00' },
  ]);

  assert.deepEqual(result.map(record => record.id), ['B', 'A']);
});

test('equal timestamps use id as a deterministic descending tie-breaker', () => {
  const result = sortAndDedupeRecords([
    { id: 'A', timestamp: '2026-09-15 07:00' },
    { id: 'B', timestamp: '2026-09-15 07:00' },
  ]);

  assert.deepEqual(result.map(record => record.id), ['B', 'A']);
});

test('invalid timestamps are excluded and reported without rewriting the record', () => {
  const invalid: Array<{ id: string; timestamp: string }> = [];
  const result = sortAndDedupeRecords(
    [
      { id: 'VALID', timestamp: '2026-09-15 07:00' },
      { id: 'INVALID', timestamp: '15/09/2026 07:00' },
    ],
    record => invalid.push(record),
  );

  assert.deepEqual(result.map(record => record.id), ['VALID']);
  assert.deepEqual(invalid.map(record => record.id), ['INVALID']);
});

test('mergeSetoranDatasets normalizes every record collection', () => {
  const result = mergeSetoranDatasets(
    {
      ...EMPTY_SETORAN_DATASET,
      ziyadah: [{
        id: 'ZYD-1',
        timestamp: '2026-09-15 07:00',
        idSantri: 'S-1',
        surah: 'Al-Baqarah',
        ayatAwal: 1,
        ayatAkhir: 5,
        nilai: 'Baik',
        catatan: '',
        inputBy: 'Ustadz',
      }],
    },
    {
      ...EMPTY_SETORAN_DATASET,
      ziyadah: [{
        id: 'ZYD-1',
        timestamp: '2026-09-15 07:00',
        idSantri: 'S-1',
        surah: 'Al-Baqarah',
        ayatAwal: 1,
        ayatAkhir: 5,
        nilai: 'Baik',
        catatan: '',
        inputBy: 'Ustadz',
      }],
    },
  );

  assert.equal(result.ziyadah.length, 1);
});

test('createRecentRange returns exactly 30 Jakarta calendar dates including today', () => {
  assert.deepEqual(
    createRecentRange(new Date('2026-09-15T12:00:00+07:00'), 30),
    {
      startInclusive: '2026-08-17 00:00',
      endExclusive: '2026-09-16 00:00',
    },
  );
});

test('createRecentRange uses Jakarta date when the supplied instant is still UTC yesterday', () => {
  assert.deepEqual(
    createRecentRange(new Date('2026-09-14T18:00:00Z'), 1),
    {
      startInclusive: '2026-09-15 00:00',
      endExclusive: '2026-09-16 00:00',
    },
  );
});

test('createMonthRange handles December rollover', () => {
  assert.deepEqual(createMonthRange(2026, 11), {
    startInclusive: '2026-12-01 00:00',
    endExclusive: '2027-01-01 00:00',
  });
});

test('createMonthRange rejects an invalid month index', () => {
  assert.throws(() => createMonthRange(2026, 12), /month index/i);
});
