import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/services/historyRepository.ts', import.meta.url), 'utf8');
const historyTable = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');

test('student history query is server scoped', () => {
  assert.match(source, /where\('idSantri',\s*'==',\s*request\.scope\.idSantri\)/);
  assert.match(source, /where\('timestamp',\s*'>=',/);
  assert.match(source, /where\('timestamp',\s*'<=',/);
  assert.doesNotMatch(source, /getZiyadahRecords\(\)/);
  assert.doesNotMatch(source, /getMurojaahRecords\(\)/);
});

test('history repository queries all four setoran collections through bounded APIs', () => {
  for (const collection of ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran']) {
    assert.match(source, new RegExp(`\\b${collection}\\b`));
  }
  assert.match(source, /limit\(pageSize\)/);
  assert.match(source, /startAfter\(previous\)/);
});


test('binnadzor history preserves and renders all four quality dimensions', () => {
  for (const field of ['hukumTajwid', 'makhrojHuruf', 'kefasihan', 'kelancaran']) {
    assert.match(source, new RegExp(`\\b${field}: record\\.${field}\\b`));
    assert.match(historyTable, new RegExp(`item\\.${field}`));
  }

  assert.match(historyTable, /const hasBinnadzorQualityDetails =/);
  assert.match(historyTable, /item\.type === 'Binnadzor'/);
  assert.match(historyTable, /Kualitas Bacaan/);
  assert.match(historyTable, />Tajwid</);
  assert.match(historyTable, />Makhroj</);
  assert.match(historyTable, />Fashohah</);
  assert.match(historyTable, />Kelancaran</);
});
