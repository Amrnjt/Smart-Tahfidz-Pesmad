import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bottomNav = readFileSync(new URL('../src/components/BottomNav.tsx', import.meta.url), 'utf8');
const dropupCss = readFileSync(new URL('../src/setor-dropup.css', import.meta.url), 'utf8');
const manageSheet = readFileSync(new URL('../src/components/ManageActionSheet.tsx', import.meta.url), 'utf8');

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

test('Kelola keeps the Bedimcode open-close mechanism but renders separate floating bars', () => {
  assert.match(manageSheet, /p2-manage-dropdown-list/);
  assert.match(manageSheet, /p2-manage-dropdown-link/);
  assert.match(manageSheet, /role="menu"/);
  assert.doesNotMatch(manageSheet, /p2-manage-dropdown-subtitle/);
  assert.doesNotMatch(manageSheet, /p2-manage-dropdown-chevron/);
  assert.match(dropupCss, /\.p2-manage-dropdown\s*\{[\s\S]*?max-height:\s*0/);
  assert.match(dropupCss, /\.p2-manage-dropdown\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(dropupCss, /transition:\s*max-height\s*\.4s/);
  assert.match(dropupCss, /\.p2-manage-dropdown\.is-open\s*\{[\s\S]*?max-height:/);
  assert.match(dropupCss, /\.p2-manage-dropdown-list\s*\{[\s\S]*?display:\s*flex/);
  assert.match(dropupCss, /\.p2-manage-dropdown-list\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(dropupCss, /\.p2-manage-dropdown-list\s*\{[\s\S]*?gap:/);
  assert.match(dropupCss, /\.p2-manage-dropdown-link\s*\{[\s\S]*?width:\s*min\(12\.5rem,\s*100%\)/);
  assert.match(dropupCss, /\.p2-manage-dropdown-link\s*\{[\s\S]*?border-radius:\s*999px/);
  assert.match(dropupCss, /\.p2-manage-dropdown-link\s*\{[\s\S]*?box-shadow:/);
});

test('Kelola floating bars stay centered and animate upward with stagger', () => {
  assert.match(dropupCss, /\.p2-manage-dropdown\s*\{[\s\S]*?left:\s*50%/);
  assert.match(dropupCss, /\.p2-manage-dropdown\s*\{[\s\S]*?translate:\s*-50%\s+0/);
  assert.match(dropupCss, /\.p2-manage-dropdown-link\s*\{[\s\S]*?transform:\s*translateY\(/);
  assert.match(dropupCss, /\.p2-manage-dropdown\.is-open\s+\.p2-manage-dropdown-link/);
  assert.match(dropupCss, /nth-child\(2\)/);
});

test('Kelola keeps Kelas and Santri destinations and rotates a dropdown chevron', () => {
  assert.match(manageSheet, /Kelola Kelas/);
  assert.match(manageSheet, /Kelola Santri/);
  assert.match(manageSheet, /tab: 'kelas'/);
  assert.match(manageSheet, /tab: 'santri'/);
  assert.match(bottomNav, /ChevronDown/);
  assert.match(bottomNav, /p2-manage-toggle-chevron/);
  assert.match(bottomNav, /aria-expanded=\{isManageSheetOpen\}/);
  assert.match(dropupCss, /\.p2-manage-toggle-chevron\.is-open\s*\{[\s\S]*?rotate\(180deg\)/);
});
