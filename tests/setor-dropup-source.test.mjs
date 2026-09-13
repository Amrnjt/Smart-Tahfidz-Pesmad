import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const bottomNav = readFileSync(new URL('../src/components/BottomNav.tsx', import.meta.url), 'utf8');
const dropupCss = readFileSync(new URL('../src/setor-dropup.css', import.meta.url), 'utf8');
const appShellCss = readFileSync(new URL('../src/app-shell.css', import.meta.url), 'utf8');
const motionFinishCss = readFileSync(new URL('../src/motion-finish.css', import.meta.url), 'utf8');
const chromeTransitionCss = readFileSync(new URL('../src/chrome-transition-fix.css', import.meta.url), 'utf8');
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

test('Bottom navbar adopts Bedimcode hierarchy while keeping Smart Tahfidz colors', () => {
  assert.match(bottomNav, /p2-bottom-dock-bedimcode/);
  assert.match(bottomNav, /p2-bottom-item-bedimcode/);
  assert.match(appShellCss, /\.p2-bottom-dock-bedimcode\s*\{/);
  assert.match(appShellCss, /\.p2-bottom-dock-bedimcode\s+\.p2-bottom-item\s*\{[\s\S]*?background:\s*transparent/);
  assert.match(appShellCss, /\.p2-bottom-dock-bedimcode\s+\.p2-bottom-item\.is-active\s*\{[\s\S]*?color:\s*var\(--shell-active-text\)/);
  assert.match(chromeTransitionCss, /\.p2-bottom-active-rail\s*\{[\s\S]*?background:\s*var\(--brand-primary\)/);
});

test('Bedimcode navbar keeps labels visible and transition feedback restrained', () => {
  assert.match(appShellCss, /\.p2-bottom-dock-bedimcode\s+\.p2-bottom-label\s*\{[\s\S]*?opacity:\s*1/);
  assert.match(appShellCss, /\.p2-bottom-dock-bedimcode\s+\.p2-bottom-icon-wrap\s*\{[\s\S]*?transition:/);
  assert.match(appShellCss, /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.p2-bottom-dock-bedimcode \.p2-bottom-item:hover/);
});

test('Page navigation keeps page content live and uses a short local no-scale entrance', () => {
  assert.match(app, /className="p3-page-content/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*(?!none)[\w-]+/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-page/);
  assert.doesNotMatch(chromeTransitionCss, /::view-transition-/);
  assert.match(chromeTransitionCss, /\.p3-page-content\.is-navigation-entering\s*\{[\s\S]*?animation:/);
  assert.match(chromeTransitionCss, /--chrome-local-page-duration:\s*320ms/);
  assert.match(chromeTransitionCss, /@media \(max-width: 767px\)[\s\S]*?--chrome-local-page-duration:\s*300ms/);
  assert.doesNotMatch(chromeTransitionCss, /scale\(/);
});

test('Bottom navbar keeps one active rail without native snapshots', () => {
  assert.match(bottomNav, /p2-bottom-active-rail/);
  assert.match(bottomNav, /showActiveRail/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-nav-active/);
  assert.match(chromeTransitionCss, /\.p2-bottom-item\.is-active \.p2-bottom-icon-wrap,[\s\S]*?view-transition-name:\s*none/);
});

test('Navbar hardening closes both launchers before every page navigation', () => {
  assert.match(bottomNav, /const navigateTo = \(tab: ActiveTab\) => \{[\s\S]*?setIsActionSheetOpen\(false\);[\s\S]*?setIsManageSheetOpen\(false\);[\s\S]*?setActiveTab\(tab\);[\s\S]*?\};/);
  assert.match(bottomNav, /onClick=\{\(\) => navigateTo\('dashboard'\)\}/);
  assert.match(bottomNav, /onClick=\{\(\) => navigateTo\('riwayat'\)\}/);
  assert.match(bottomNav, /onClick=\{\(\) => navigateTo\('mushaf'\)\}/);
  assert.match(bottomNav, /onSelect=\{\(tab\) => navigateTo\(tab\)\}/);
  assert.match(bottomNav, /useEffect\(\(\) => \{[\s\S]*?setIsActionSheetOpen\(false\);[\s\S]*?setIsManageSheetOpen\(false\);[\s\S]*?\}, \[activeTab\]\);/);
});

test('Navbar hardening separates Kelola open-state from page active-state', () => {
  assert.match(bottomNav, /isActive=\{isManageActive\}/);
  assert.match(bottomNav, /isOpen=\{isManageSheetOpen\}/);
  assert.match(bottomNav, /aria-current=\{isActive \? 'page' : undefined\}/);
  assert.match(bottomNav, /p2-manage-toggle[^`]*\$\{isOpen \? 'is-open' : ''\}/);
  assert.match(appShellCss, /\.p2-bottom-dock-bedimcode \.p2-manage-toggle\.is-open\s*\{/);
});

test('Navbar hardening leaves a single mobile active-indicator owner', () => {
  assert.doesNotMatch(appShellCss, /\.p2-bottom-dock-bedimcode \.p2-bottom-item::before/);
  assert.doesNotMatch(appShellCss, /\.p2-bottom-dock-bedimcode \.p2-bottom-item\.is-active::before/);
  assert.doesNotMatch(motionFinishCss, /\.p2-bottom-item\.is-active \.p2-bottom-icon-wrap,\s*\.p2-setor-fab\.is-active\s*\{\s*view-transition-name:\s*p2-nav-active;/);
  assert.doesNotMatch(motionFinishCss, /\.ui-app-shell > main#main-content\s*\{\s*view-transition-name:\s*p2-page;/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-nav-active/);
});
