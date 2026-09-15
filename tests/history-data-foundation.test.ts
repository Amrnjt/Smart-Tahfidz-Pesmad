import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deduplicateHistoryItems,
  getHistoryItemKey,
  groupHistoryItemsByDate,
} from '../src/utils/historyUtils.ts';
import type { CombinedHistoryItem } from '../src/types/index.ts';

const record = (
  type: CombinedHistoryItem['type'],
  id: string,
  timestamp: string,
): CombinedHistoryItem => ({
  id,
  type,
  timestamp,
  idSantri: 'S-001',
  namaSantri: 'Ahmad',
  materi: 'Al-Baqarah ayat 1-5',
  nilai: 'Baik',
  catatan: '',
  inputBy: 'Ustadz',
});

test('history key includes collection type so equal document ids do not collide', () => {
  assert.equal(getHistoryItemKey(record('Ziyadah', 'same-id', '2026-09-15 08:00')), 'Ziyadah:same-id');
  assert.equal(getHistoryItemKey(record('Binnadzor', 'same-id', '2026-09-15 08:05')), 'Binnadzor:same-id');
});

test('deduplication removes only repeated records from the same collection', () => {
  const ziyadah = record('Ziyadah', 'same-id', '2026-09-15 08:00');
  const binnadzor = record('Binnadzor', 'same-id', '2026-09-15 08:05');

  assert.deepEqual(
    deduplicateHistoryItems([ziyadah, ziyadah, binnadzor]),
    [ziyadah, binnadzor],
  );
});

test('grouping preserves filtered order and ignores invalid timestamps', () => {
  const newest = record('Ziyadah', '1', '2026-09-15 08:00');
  const older = record('Murojaah', '2', '2026-09-14T19:30:00');
  const invalid = record('Binnadzor', '3', 'tidak-valid');

  const groups = groupHistoryItemsByDate([newest, older, invalid]);

  assert.deepEqual(groups.map(group => group.dateKey), ['2026-09-15', '2026-09-14']);
  assert.deepEqual(groups[0].items, [newest]);
  assert.deepEqual(groups[1].items, [older]);
});
