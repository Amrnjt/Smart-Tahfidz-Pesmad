import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bottomNav = readFileSync(new URL('../src/components/BottomNav.tsx', import.meta.url), 'utf8');
const dropupCss = readFileSync(new URL('../src/setor-dropup.css', import.meta.url), 'utf8');

test('Setor launcher exposes a mobile drop-up menu above the FAB', () => {
  assert.match(bottomNav, /id="setor-dropup-menu"/);
  assert.match(bottomNav, /aria-controls="setor-dropup-menu"/);
  assert.match(bottomNav, /aria-haspopup="menu"/);
  assert.match(bottomNav, /p2-setor-dropup-item/);
  assert.match(bottomNav, /isActionSheetOpen \? <X/);
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{/);
  assert.match(dropupCss, /bottom:\s*calc\(/);
  assert.match(dropupCss, /transform-origin:\s*center bottom/);
});

test('Setor drop-up keeps the four primary setoran routes', () => {
  for (const label of ['Ziyadah', "Muroja'ah", 'Binnadzor', 'Non-Tahfidz']) {
    assert.match(bottomNav, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Setor drop-up uses spring motion and an outside-close backdrop', () => {
  assert.match(bottomNav, /type: 'spring'/);
  assert.match(bottomNav, /p2-setor-dropup-backdrop/);
  assert.match(bottomNav, /setIsActionSheetOpen\(false\)/);
});

test('Setor drop-up restores the live Pantauan Liburan switch and monitor access', () => {
  assert.match(bottomNav, /Pantauan Liburan/);
  assert.match(bottomNav, /role="switch"/);
  assert.match(bottomNav, /storageService\.getAppConfig\(\)/);
  assert.match(bottomNav, /storageService\.setProgramLiburanActive/);
  assert.match(bottomNav, /PantauanLiburanMonitorModal/);
  assert.match(bottomNav, /santriList=\{santriList\}/);
  assert.match(bottomNav, /onNotify=\{onNotify\}/);
});

test('Setor drop-up centers the menu and uses balanced balloon widths', () => {
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(dropupCss, /\.p2-setor-dropup-item\s*\{[\s\S]*?width:\s*min\(13rem,\s*100%\)/);
  assert.match(dropupCss, /\.p2-setor-dropup-program\s*\{[\s\S]*?width:\s*min\(14\.25rem,\s*100%\)/);
});
