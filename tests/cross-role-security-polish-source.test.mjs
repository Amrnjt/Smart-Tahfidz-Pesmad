import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../src/hooks/useActiveTabNavigation.ts', import.meta.url), 'utf8');
const bottom = readFileSync(new URL('../src/components/BottomNav.tsx', import.meta.url), 'utf8');
const history = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');
const pimpinan = readFileSync(new URL('../src/components/dashboard/PimpinanAcademicOverview.tsx', import.meta.url), 'utf8');
const superadmin = readFileSync(new URL('../src/components/dashboard/SuperadminControlCenter.tsx', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

test('operational staff access is explicit and unknown roles fail closed', () => {
  assert.match(app, /const isUstadz = userRoleStr === 'ustadz' \|\| userRoleStr === 'superadmin'/);
  assert.match(app, /const isKnownRole = isUstadz \|\| isPimpinan \|\| isWali \|\| isSantri/);
  assert.match(app, /Role akun tidak dikenali/);
  assert.match(app, /Akses operasional dinonaktifkan untuk sesi ini/);
  assert.match(bottom, /const isUstadz = roleStr === 'ustadz' \|\| roleStr === 'superadmin'/);
  assert.match(app, /currentUser && isKnownRole && \(/);
  assert.match(bottom, /if \(!isKnownRole\) return null/);
});

test('tab navigation uses role allow-lists rather than negative role inference', () => {
  assert.match(nav, /const STAFF_TABS = new Set<ActiveTab>\(VALID_TABS\)/);
  assert.match(nav, /const PIMPINAN_TABS = new Set<ActiveTab>\(\['dashboard', 'riwayat', 'mushaf'\]\)/);
  assert.match(nav, /const WALI_TABS = new Set<ActiveTab>\(\['dashboard', 'riwayat', 'mushaf', 'pantauan'\]\)/);
  assert.match(nav, /const SANTRI_TABS = new Set<ActiveTab>\(\['dashboard', 'riwayat', 'mushaf'\]\)/);
  assert.match(nav, /return SAFE_FALLBACK_TABS/);
  assert.match(nav, /return allowedTabs\.has\(tab\) \? tab : 'dashboard'/);
  assert.doesNotMatch(nav, /!VIEW_ONLY_TABS\.has/);
});

test('personal realtime setoran remains server-scoped by linked santri id', () => {
  assert.match(app, /const isPersonal = normalizedRole === 'santri' \|\| normalizedRole === 'wali' \|\| normalizedRole\.includes\('wali'\)/);
  assert.match(app, /scope: isPersonal \? \{ kind: 'student', idSantri \} : \{ kind: 'staff' \}/);
});

test('history mutation handlers enforce view-only internally, not only through hidden buttons', () => {
  assert.match(history, /const denyViewOnlyMutation = \(\): boolean =>/);
  assert.match(history, /Akun ini berada dalam mode view-only/);

  for (const handler of [
    'handleDelete',
    'confirmSingleDelete',
    'confirmBatchDelete',
    'toggleSelectAll',
    'toggleSelectItem',
    'openEditModal',
    'handleSaveEdit',
  ]) {
    const start = history.indexOf(`const ${handler}`);
    assert.ok(start >= 0, `${handler} should exist`);
    const block = history.slice(start, start + 450);
    assert.match(block, /denyViewOnlyMutation\(\)/, `${handler} should enforce view-only`);
  }

  assert.match(history, /!isViewOnly && showTrashModal/);
});

test('new executive surfaces retain readable responsive column counts', () => {
  assert.match(pimpinan, /grid-cols-2 gap-2\.5 sm:grid-cols-3 lg:grid-cols-5/);
  assert.match(superadmin, /grid-cols-2 gap-2\.5 sm:grid-cols-3 xl:grid-cols-5/);
});

test('P11 does not pretend permissive Firestore rules are server-side role security', () => {
  assert.match(rules, /allow read, write: if true/);
  assert.doesNotMatch(nav, /request\.auth/);
});


test('operational pages remain gated by the explicit staff flag in App', () => {
  assert.match(app, /isSetorActive && isUstadz/);
  assert.match(app, /activeTab === 'ziyadah' && isUstadz/);
  assert.match(app, /activeTab === 'santri' && isUstadz/);
  assert.match(app, /activeTab === 'kelas' && isUstadz/);
});
