import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const bottomNav = readFileSync(new URL('../src/components/BottomNav.tsx', import.meta.url), 'utf8');
const setorActions = readFileSync(new URL('../src/config/setorActions.ts', import.meta.url), 'utf8');
const dropupCss = readFileSync(new URL('../src/setor-dropup.css', import.meta.url), 'utf8');
const motionFinishCss = readFileSync(new URL('../src/motion-finish.css', import.meta.url), 'utf8');
const chromeTransitionCss = readFileSync(new URL('../src/chrome-transition-fix.css', import.meta.url), 'utf8');
const manageSheet = readFileSync(new URL('../src/components/ManageActionSheet.tsx', import.meta.url), 'utf8');
const pantauanPage = readFileSync(new URL('../src/components/PantauanLiburanPage.tsx', import.meta.url), 'utf8');
const pantauanWali = readFileSync(new URL('../src/components/PantauanLiburanWaliSection.tsx', import.meta.url), 'utf8');
const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');

test('Setor launcher exposes an accessible command tray above the mobile FAB', () => {
  assert.match(bottomNav, /id="setor-dropup-menu"/);
  assert.match(bottomNav, /aria-controls="setor-dropup-menu"/);
  assert.match(bottomNav, /aria-haspopup="menu"/);
  assert.match(bottomNav, /className="p2-setor-tray"/);
  assert.match(bottomNav, /className={`p2-setor-tile/);
  assert.match(bottomNav, /isActionSheetOpen \? \([\s\S]*?<X/);
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{/);
  assert.match(dropupCss, /bottom:\s*calc\(/);
  assert.match(dropupCss, /transform-origin:\s*center bottom/);
});

test('Setor command tray keeps the four primary setoran routes', () => {
  for (const tab of ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran']) {
    assert.match(setorActions, new RegExp(`tab: '${tab}'`));
  }
  assert.match(bottomNav, /SETOR_ACTIONS\.map/);
});

test('Setor command tray uses spring motion and an outside-close backdrop', () => {
  assert.match(bottomNav, /type: 'spring'/);
  assert.match(bottomNav, /p2-setor-dropup-backdrop/);
  assert.match(bottomNav, /setIsActionSheetOpen\(false\)/);
});

test('Setor command tray remains centered with a balanced two-column layout', () => {
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{[\s\S]*?left:\s*50%/);
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{[\s\S]*?translate:\s*-50%\s+0/);
  assert.match(dropupCss, /\.p2-setor-dropup\s*\{[\s\S]*?width:\s*min\(330px,/);
  assert.match(dropupCss, /\.p2-setor-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
});

test('Kelola is an anchored accessible popover with outside and Escape close', () => {
  assert.match(manageSheet, /id="manage-popover-menu"/);
  assert.match(manageSheet, /role="menu"/);
  assert.match(manageSheet, /absolute bottom-\[calc\(100%\+12px\)\]/);
  assert.match(manageSheet, /document\.addEventListener\('pointerdown'/);
  assert.match(manageSheet, /event\.key === 'Escape'/);
  assert.match(manageSheet, /initial=\{\{ opacity: 0, y: 8, scale: 0\.96 \}\}/);
});

test('Kelola keeps Kelas, Santri, and dedicated Pantauan Liburan destinations', () => {
  assert.match(manageSheet, /onSelect\(tab\)/);
  assert.match(manageSheet, /chooseAction\(e, 'kelas'/);
  assert.match(manageSheet, /chooseAction\(e, 'santri'/);
  assert.match(manageSheet, /chooseAction\(e, 'pantauan'/);
  assert.match(manageSheet, /Pantauan Liburan/);
  assert.doesNotMatch(bottomNav, /PantauanLiburanMonitorModal/);
  assert.match(app, /activeTab === 'pantauan'/);
  assert.match(app, /<PantauanLiburanPage/);
  assert.match(pantauanPage, /mode: 'monitor' \| 'wali'/);
});

test('Pantauan prayer status includes Tanpa Alasan while preserving old Halangan data', () => {
  assert.match(types, /'Tanpa Alasan'/);
  assert.match(types, /value: 'Berhalangan', label: 'Halangan'/);
  assert.match(pantauanWali, /opt\.value === 'Sakit'/);
  assert.match(pantauanWali, /bg-slate-800 text-white/);
  assert.match(pantauanPage, /tanpaAlasan/);
  assert.match(pantauanPage, /status === 'Berhalangan' \? 'Halangan'/);
});

test('Kelola trigger exposes open state and rotates its chevron', () => {
  assert.match(bottomNav, /aria-expanded=\{isManageSheetOpen\}/);
  assert.match(bottomNav, /<ChevronDown/);
  assert.match(bottomNav, /isManageSheetOpen \? 'rotate-180 text-emerald-700'/);
  assert.match(bottomNav, /transition-transform duration-200/);
});

test('Bottom navbar keeps role-specific item counts and Smart Tahfidz active colors', () => {
  assert.match(bottomNav, /grid-cols-3/);
  assert.match(bottomNav, /grid-cols-4/);
  assert.match(bottomNav, /grid grid-cols-5/);
  assert.match(bottomNav, /isActive[\s\S]*?bg-emerald-50\/90 text-emerald-800 font-bold/);
  assert.match(bottomNav, /aria-current=\{isActive \? 'page' : undefined\}/);
});

test('Page navigation keeps content live and uses a short local no-scale entrance', () => {
  assert.match(app, /className="p3-page-content/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*(?!none)[\w-]+/);
  assert.doesNotMatch(chromeTransitionCss, /::view-transition-/);
  assert.match(chromeTransitionCss, /\.p3-page-content\.is-navigation-entering\s*\{[\s\S]*?animation:/);
  assert.match(chromeTransitionCss, /--chrome-local-page-duration:\s*260ms/);
  assert.match(chromeTransitionCss, /@media \(max-width: 767px\)[\s\S]*?--chrome-local-page-duration:\s*240ms/);
  assert.doesNotMatch(chromeTransitionCss, /scale\(/);
});

test('Navbar hardening closes both launchers before page navigation', () => {
  assert.match(bottomNav, /const navigateTo = \(tab: ActiveTab\) => \{[\s\S]*?setIsActionSheetOpen\(false\);[\s\S]*?setIsManageSheetOpen\(false\);[\s\S]*?setActiveTab\(tab\);[\s\S]*?\};/);
  assert.match(bottomNav, /onClick=\{\(\) => navigateTo\('dashboard'\)\}/);
  assert.match(bottomNav, /onClick=\{\(\) => navigateTo\('riwayat'\)\}/);
  assert.match(bottomNav, /onClick=\{\(\) => navigateTo\('mushaf'\)\}/);
  assert.match(bottomNav, /onSelect=\{\(tab\) => navigateTo\(tab\)\}/);
});

test('Navbar hardening separates Kelola open state from active page state', () => {
  assert.match(bottomNav, /isActive=\{isManageActive\}/);
  assert.match(bottomNav, /isOpen=\{isManageSheetOpen\}/);
  assert.match(bottomNav, /isActive \|\| isOpen/);
  assert.match(bottomNav, /aria-expanded=\{isManageSheetOpen\}/);
});

test('Mobile navigation opts out of legacy native active indicators', () => {
  assert.match(motionFinishCss, /@media \(max-width: 767px\)[\s\S]*?\.p2-bottom-item\.is-active \.p2-bottom-icon-wrap,[\s\S]*?view-transition-name:\s*none/);
  assert.match(motionFinishCss, /\.ui-app-shell > main#main-content\s*\{[\s\S]*?view-transition-name:\s*none/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-nav-active/);
});


test('Metode Ummi launcher uses the supplied logo image on mobile and desktop', () => {
  assert.match(setorActions, /title: 'Metode Ummi'/);
  assert.match(setorActions, /label: 'Metode Ummi'/);
  assert.match(setorActions, /const UMMI_LOGO_DATA_URI = 'data:image\/jpeg;base64,/);
  assert.match(setorActions, /imageSrc: UMMI_LOGO_DATA_URI/);
  assert.match(bottomNav, /action\.imageSrc/);
  assert.match(bottomNav, /<img/);
});
