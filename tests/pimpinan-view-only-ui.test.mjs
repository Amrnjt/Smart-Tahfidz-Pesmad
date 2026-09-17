import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync('src/App.tsx', 'utf8');
const pimpinanHistory = readFileSync('src/components/PimpinanHistoryTable.tsx', 'utf8');
const pimpinanBottomNav = readFileSync('src/components/PimpinanBottomNav.tsx', 'utf8');
const navigation = readFileSync('src/hooks/useActiveTabNavigation.ts', 'utf8');
const roles = readFileSync('src/utils/roles.ts', 'utf8');

test('Pimpinan runtime uses centralized role permissions instead of Ustadz fallback', () => {
  assert.match(app, /normalizeUserRole/);
  assert.match(app, /canWriteSetoran/);
  assert.match(app, /isGlobalReadOnlyRole/);
  assert.doesNotMatch(app, /const isUstadz = !isWali && !isSantri/);
});

test('Pimpinan can only navigate monitoring tabs through centralized tab access', () => {
  assert.match(navigation, /canAccessTab/);
  assert.match(roles, /READ_ONLY_TABS/);
  assert.match(roles, /'dashboard'.*'riwayat'.*'mushaf'/s);
  assert.match(roles, /normalized === 'Pimpinan'/);
});

test('Pimpinan history uses a dedicated global presenter without mutation paths', () => {
  assert.match(app, /PimpinanHistoryTable/);
  assert.match(pimpinanHistory, /Riwayat Seluruh Santri/);
  assert.doesNotMatch(pimpinanHistory, /deleteRecord|updateRecord|Trash2|SquarePen|\bPencil\b/);
});

test('Pimpinan mobile navigation exposes only read-only primary destinations', () => {
  assert.match(app, /PimpinanBottomNav/);
  assert.match(pimpinanBottomNav, /Beranda/);
  assert.match(pimpinanBottomNav, /Riwayat/);
  assert.match(pimpinanBottomNav, /Mushaf/);
  assert.doesNotMatch(pimpinanBottomNav, /Setor|Kelola|Pantauan/);
});
