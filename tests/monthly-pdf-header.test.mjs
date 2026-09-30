import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/hooks/useGeneratePDF.ts', import.meta.url), 'utf8');

test('monthly report header uses a vector Al-Quran mark instead of the Q placeholder', () => {
  assert.match(source, /function drawQuranMark\(/);
  assert.match(source, /drawQuranMark\(pdf, margin \+ 6\.0, y \+ 7\.2, 10, 13\.2\)/);
  assert.doesNotMatch(source, /pdf\.text\('Q', margin \+ 11, y \+ 15/);
});

test('Quran mark remains vector-based for crisp printing', () => {
  const start = source.indexOf('function drawQuranMark');
  const end = source.indexOf('function drawSectionHeader', start);
  const block = source.slice(start, end);
  assert.match(block, /pdf\.lines\(/);
  assert.match(block, /pdf\.line\(/);
  assert.match(block, /pdf\.triangle\(/);
  assert.doesNotMatch(block, /addImage/);
});
