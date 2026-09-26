import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const chrome = readFileSync(new URL('../src/chrome-transition-fix.css', import.meta.url), 'utf8');
const santri = readFileSync(new URL('../src/components/SantriManagement.tsx', import.meta.url), 'utf8');

test('page transition does not leave transform on the page content', () => {
  const start = chrome.indexOf('@keyframes chrome-local-page-in');
  const end = chrome.indexOf('@media (max-width: 767px)', start);
  const keyframes = chrome.slice(start, end);
  assert.doesNotMatch(keyframes, /transform:/);
});

test('mobile dialogs float above persistent app chrome with compact height', () => {
  assert.match(css, /\.ui-dialog-overlay[\s\S]*z-index: 100;/);
  assert.match(css, /max-height: min\(72dvh, 34rem\);/);
});

test('add santri keeps header and actions outside its scrollable body', () => {
  const start = santri.indexOf('aria-label="Tambah data santri"');
  const end = santri.indexOf('{/* Modal Tambah User Akun Baru */}', start);
  assert.ok(start >= 0 && end > start);
  const block = santri.slice(start, end);
  assert.match(santri, /import \{ createPortal \} from 'react-dom';/);
  assert.match(block, /createPortal\(/);
  assert.match(block, /document\.body/);
  assert.match(block, /ui-dialog-frame max-w-md flex flex-col/);
  assert.match(block, /ui-dialog-header/);
  assert.match(block, /ui-dialog-body min-h-0 flex-1 overflow-y-auto/);
  assert.match(block, /ui-dialog-footer px-4 pb-4 sm:px-6 sm:pb-6/);
});
