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
const monitorModal = readFileSync(new URL('../src/components/PantauanLiburanMonitorModal.tsx', import.meta.url), 'utf8');
const setorActions = readFileSync(new URL('../src/config/setorActions.ts', import.meta.url), 'utf8');

test('Setor launcher exposes a mobile drop-up menu above the FAB', () => {
  assert.match(bottomNav, /id="setor-dropup-menu"/);
  assert.match(bottomNav, /aria-controls="setor-dropup-menu"/);
  assert.match(bottomNav, /aria-haspopup="menu"/);
  assert.match(bottomNav, /p2-setor-dropup-item/);
  assert.match(bottomNav, /\{isActionSheetOpen \? \([\s\S]*?<X/);
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{/);
  assert.match(dropupCss, /bottom:\s*calc\(/);
  assert.match(dropupCss, /transform-origin:\s*center bottom/);
});

test('Setor drop-up keeps the four primary setoran routes', () => {
  for (const label of ['Ziyadah', "Muroja'ah", 'Binnadzor', 'Non-Tahfidz']) {
    assert.match(setorActions, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(bottomNav, /SETOR_ACTIONS\.map/);
});

test('Setor drop-up uses spring motion and an outside-close backdrop', () => {
  assert.match(bottomNav, /type: 'spring'/);
  assert.match(bottomNav, /p2-setor-dropup-backdrop/);
  assert.match(bottomNav, /setIsActionSheetOpen\(false\)/);
});

test('Kelola popover exposes the live Pantauan Liburan switch and monitor access', () => {
  assert.match(manageSheet, /Pantauan Liburan/);
  assert.match(manageSheet, /onOpenPantauanLiburan/);
  assert.match(bottomNav, /PantauanLiburanMonitorModal/);
  assert.match(bottomNav, /setShowMonitorModal\(true\)/);
  assert.match(bottomNav, /santriList=\{santriList\}/);
  assert.match(bottomNav, /onNotify=\{onNotify\}/);
  assert.match(monitorModal, /role="switch"/);
  assert.match(monitorModal, /storageService\.getAppConfig\(\)/);
  assert.match(monitorModal, /storageService\.setProgramLiburanActive/);
});

test('Setor drop-up centers the menu and uses balanced balloon widths', () => {
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{[\s\S]*?align-items:\s*center/);
  assert.match(dropupCss, /\.p2-setor-dropup-item\s*\{[\s\S]*?width:\s*min\(13rem,\s*100%\)/);
  assert.match(dropupCss, /\.p2-setor-dropup-program\s*\{[\s\S]*?width:\s*min\(14\.25rem,\s*100%\)/);
});

test('Kelola renders an anchored mini popover with outside-click and escape dismissal', () => {
  assert.match(manageSheet, /id="manage-popover-menu"/);
  assert.match(manageSheet, /role="menu"/);
  assert.match(manageSheet, /fixed inset-0 z-30 bg-transparent/);
  assert.match(manageSheet, /document\.addEventListener\('pointerdown'/);
  assert.match(manageSheet, /event\.key === 'Escape'/);
  assert.match(manageSheet, /trigger\.focus\(\)/);
});

test('Kelola popover stays centered above its trigger and uses restrained motion', () => {
  assert.match(manageSheet, /bottom-\[calc\(100%\+12px\)\]/);
  assert.match(manageSheet, /left-1\/2 -translate-x-1\/2/);
  assert.match(manageSheet, /initial=\{\{ opacity: 0, y: 8, scale: 0\.96 \}\}/);
  assert.match(manageSheet, /animate=\{\{ opacity: 1, y: 0, scale: 1 \}\}/);
  assert.match(manageSheet, /transition=\{\{ duration: 0\.2, ease:/);
});

test('Kelola keeps Kelas and Santri destinations and rotates a dropdown chevron', () => {
  assert.match(manageSheet, /chooseAction\(e, 'kelas'/);
  assert.match(manageSheet, /chooseAction\(e, 'santri'/);
  assert.match(manageSheet, /Buka Kelola Kelas/);
  assert.match(manageSheet, /Buka Kelola Santri/);
  assert.match(bottomNav, /ChevronDown/);
  assert.match(bottomNav, /aria-expanded=\{isManageSheetOpen\}/);
  assert.match(bottomNav, /isManageSheetOpen \? 'rotate-180 text-emerald-700'/);
});

test('Bottom navbar keeps a compact floating hierarchy with Smart Tahfidz colors', () => {
  assert.match(bottomNav, /fixed left-0 right-0 bottom-2\.5/);
  assert.match(bottomNav, /max-w-\[390px\][\s\S]*?grid-cols-5/);
  assert.match(bottomNav, /bg-white\/98/);
  assert.match(bottomNav, /bg-emerald-50\/90 text-emerald-800 font-bold/);
  assert.match(bottomNav, /from-emerald-700 to-emerald-600/);
});

test('Bottom navbar keeps labels visible and transition feedback restrained', () => {
  assert.match(bottomNav, /\{label\}/);
  assert.match(bottomNav, /transition-all duration-200/);
  assert.match(bottomNav, /active:scale-95/);
});

test('Page navigation keeps page content live and uses a short local no-scale entrance', () => {
  assert.match(app, /className="p3-page-content/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*(?!none)[\w-]+/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-page/);
  assert.doesNotMatch(chromeTransitionCss, /::view-transition-/);
  assert.match(chromeTransitionCss, /\.p3-page-content\.is-navigation-entering\s*\{[\s\S]*?animation:/);
  assert.match(chromeTransitionCss, /--chrome-local-page-duration:\s*260ms/);
  assert.match(chromeTransitionCss, /@media \(max-width: 767px\)[\s\S]*?--chrome-local-page-duration:\s*240ms/);
  assert.doesNotMatch(chromeTransitionCss, /scale\(/);
});

test('Bottom navbar keeps one semantic active-state owner without native snapshots', () => {
  assert.match(bottomNav, /aria-current=\{isActive \? 'page' : undefined\}/);
  assert.doesNotMatch(bottomNav, /p2-bottom-active-rail/);
  assert.doesNotMatch(bottomNav, /showActiveRail/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-nav-active/);
  assert.match(bottomNav, /isActive[\s\S]*?bg-emerald-50\/90/);
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
  assert.match(bottomNav, /isActive \|\| isOpen/);
  assert.match(bottomNav, /aria-expanded=\{isManageSheetOpen\}/);
});

test('Navbar hardening leaves a single mobile active-indicator owner', () => {
  assert.doesNotMatch(appShellCss, /\.p2-bottom-dock-bedimcode \.p2-bottom-item::before/);
  assert.doesNotMatch(appShellCss, /\.p2-bottom-dock-bedimcode \.p2-bottom-item\.is-active::before/);
  assert.doesNotMatch(motionFinishCss, /\.p2-bottom-item\.is-active \.p2-bottom-icon-wrap,\s*\.p2-setor-fab\.is-active\s*\{\s*view-transition-name:\s*p2-nav-active;/);
  assert.doesNotMatch(motionFinishCss, /\.ui-app-shell > main#main-content\s*\{\s*view-transition-name:\s*p2-page;/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-nav-active/);
});
