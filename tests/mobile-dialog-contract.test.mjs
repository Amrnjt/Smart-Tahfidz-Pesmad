import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const santri = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');
const trash = readFileSync(new URL('../src/components/TrashBinModal.tsx', import.meta.url), 'utf8');

test('mobile dialogs keep breathing room instead of consuming the full viewport', () => {
  assert.match(css, /\.ui-dialog-overlay[\s\S]*padding: 1rem;/);
  assert.match(css, /max-height: min\(88dvh, 42rem\);/);
  assert.match(css, /@media \(min-width: 640px\)[\s\S]*max-height: calc\(100dvh - 2rem\);/);
});

test('santri management dialog forms stack fields on narrow screens', () => {
  const responsivePairs = santri.match(/grid grid-cols-1 sm:grid-cols-2 gap-3/g) || [];
  assert.ok(responsivePairs.length >= 6);
  assert.doesNotMatch(santri, /grid grid-cols-2 gap-3/);
});

test('trash modal follows the shared responsive dialog height contract', () => {
  assert.doesNotMatch(trash, /max-h-\[90vh\]/);
  assert.match(trash, /ui-dialog-panel max-w-4xl flex flex-col p-0 overflow-hidden/);
});
