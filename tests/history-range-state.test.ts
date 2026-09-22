import assert from 'node:assert/strict';
import test from 'node:test';
import {
  historyRangeReducer,
  initialHistoryRangeState,
} from '../src/hooks/useHistoryRange.ts';

test('history range state distinguishes initial loading and refreshing', () => {
  const loading = historyRangeReducer(initialHistoryRangeState, { type: 'start', requestId: 1, preserveRecords: false });
  assert.equal(loading.status, 'loading');

  const success = historyRangeReducer(loading, {
    type: 'success',
    requestId: 1,
    records: [{
      id: 'A',
      type: 'Ziyadah',
      timestamp: '2026-09-20 19:00',
      idSantri: 'S-1',
      namaSantri: 'Santri',
      materi: 'Al-Fatihah',
      nilai: 'Baik',
      catatan: '',
      inputBy: 'Ustadz',
    }],
    source: 'server',
  });
  const refreshing = historyRangeReducer(success, { type: 'start', requestId: 2, preserveRecords: true });
  assert.equal(refreshing.status, 'refreshing');
  assert.equal(refreshing.records.length, 1);
});

test('stale history request cannot overwrite the latest result', () => {
  const first = historyRangeReducer(initialHistoryRangeState, { type: 'start', requestId: 1, preserveRecords: false });
  const second = historyRangeReducer(first, { type: 'start', requestId: 2, preserveRecords: false });
  const stale = historyRangeReducer(second, {
    type: 'success',
    requestId: 1,
    records: [],
    source: 'server',
  });
  assert.equal(stale.activeRequestId, 2);
  assert.equal(stale.status, 'loading');
});

test('history query errors retain already visible records', () => {
  const seeded = {
    ...initialHistoryRangeState,
    records: [{
      id: 'A',
      type: 'Ziyadah' as const,
      timestamp: '2026-09-20 19:00',
      idSantri: 'S-1',
      namaSantri: 'Santri',
      materi: 'Al-Fatihah',
      nilai: 'Baik' as const,
      catatan: '',
      inputBy: 'Ustadz',
    }],
    activeRequestId: 3,
    status: 'refreshing' as const,
  };
  const failed = historyRangeReducer(seeded, { type: 'error', requestId: 3, error: 'Offline' });
  assert.equal(failed.status, 'error');
  assert.equal(failed.records.length, 1);
});
