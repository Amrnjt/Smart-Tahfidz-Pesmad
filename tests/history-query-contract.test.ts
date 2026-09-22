import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoryQueryKey } from '../src/utils/historyQueryKey.ts';

test('cache key isolates staff and student scopes', () => {
  const base = { startDate: '2026-09-01', endDate: '2026-09-30' };
  assert.notEqual(
    createHistoryQueryKey({ ...base, scope: { kind: 'staff' } }),
    createHistoryQueryKey({ ...base, scope: { kind: 'student', idSantri: 'S-1' } }),
  );
});

test('cache key is stable for an identical request', () => {
  const request = {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    scope: { kind: 'student' as const, idSantri: 'S-1' },
  };
  assert.equal(createHistoryQueryKey(request), createHistoryQueryKey({ ...request }));
});
