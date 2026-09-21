import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/services/historyRepository.ts', import.meta.url), 'utf8');

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
