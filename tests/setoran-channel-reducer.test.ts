import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_SETORAN_DATASET,
  type SetoranDataset,
} from '../src/services/setoranQuery.types';
import {
  initialChannel,
  reduceChannel,
} from '../src/state/setoranChannelReducer';

const DATA: SetoranDataset = {
  ...EMPTY_SETORAN_DATASET,
  ziyadah: [{
    id: 'NEW',
    timestamp: '2026-09-15 07:00',
    idSantri: 'S-1',
    surah: 'Al-Baqarah',
    ayatAwal: 1,
    ayatAkhir: 5,
    nilai: 'Baik',
    catatan: '',
    inputBy: 'Ustadz',
  }],
};

const OLD_DATA: SetoranDataset = {
  ...EMPTY_SETORAN_DATASET,
  ziyadah: [{
    ...DATA.ziyadah[0],
    id: 'OLD',
    timestamp: '2026-08-01 07:00',
  }],
};

test('refresh failure preserves the last successful dataset', () => {
  const loaded = reduceChannel(initialChannel(DATA), {
    type: 'success',
    requestId: 0,
    data: DATA,
  });
  const loading = reduceChannel(loaded, { type: 'start', requestId: 2 });
  const failed = reduceChannel(loading, {
    type: 'error',
    requestId: 2,
    error: 'offline',
  });

  assert.equal(failed.data, DATA);
  assert.equal(failed.status, 'error');
  assert.equal(failed.error, 'offline');
  assert.equal(failed.isStale, true);
});

test('an older response cannot replace a newer request', () => {
  const loading = reduceChannel(initialChannel(EMPTY_SETORAN_DATASET), {
    type: 'start',
    requestId: 2,
  });
  const ignored = reduceChannel(loading, {
    type: 'success',
    requestId: 1,
    data: OLD_DATA,
  });

  assert.equal(ignored, loading);
});

test('successful empty data is distinct from an error', () => {
  const result = reduceChannel(initialChannel(DATA), {
    type: 'success',
    requestId: 0,
    data: EMPTY_SETORAN_DATASET,
  });

  assert.equal(result.status, 'success');
  assert.equal(result.error, null);
  assert.equal(result.isStale, false);
  assert.equal(result.data, EMPTY_SETORAN_DATASET);
});

test('initial cached data remains stale until a request succeeds', () => {
  const cached = initialChannel(DATA, true);
  const loading = reduceChannel(cached, { type: 'start', requestId: 1 });

  assert.equal(cached.isStale, true);
  assert.equal(loading.data, DATA);
  assert.equal(loading.isStale, true);
});

test('reset returns an idle channel with the supplied data', () => {
  const loading = reduceChannel(initialChannel(DATA), {
    type: 'start',
    requestId: 4,
  });
  const reset = reduceChannel(loading, {
    type: 'reset',
    data: EMPTY_SETORAN_DATASET,
  });

  assert.deepEqual(reset, initialChannel(EMPTY_SETORAN_DATASET));
});
