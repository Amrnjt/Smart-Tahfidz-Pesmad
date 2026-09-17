import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync('src/App.tsx', 'utf8');
const history = readFileSync('src/components/HistoryTable.tsx', 'utf8');
const desktopNav = readFileSync('src/components/DesktopPrimaryNav.tsx', 'utf8');
const bottomNav = readFileSync('src/components/BottomNav.tsx', 'utf8');
const navigation = readFileSync('src/hooks/useActiveTabNavigation.ts', 'utf8');

test('Pimpinan runtime uses centralized role permissions instead of Ustadz fallback', () => {
  assert.match(app, /normalizeUserRole/);
  assert.match(app, /canWriteSetoran/);
  assert.doesNotMatch(app, /const isUstadz = !isWali && !isSantri/);
});

test('Pimpinan can only navigate monitoring tabs', () => {
  assert.match(navigation, /PIMPINAN_TABS/);
  assert.match(navigation, /'dashboard'.*'riwayat'.*'mushaf'/s);
  assert.match(navigation, /normalizedRole === 'Pimpinan'/);
});

test('Pimpinan history is global but mutation controls are view-only', () => {
  assert.match(history, /canViewAllHistory/);
  assert.match(history, /canEditHistory/);
  assert.match(history, /canDeleteHistory/);
  assert.match(history, /isGlobalViewOnly/);
});

test('desktop and mobile navigation hide staff actions from Pimpinan', () => {
  assert.match(desktopNav, /canWriteSetoran/);
  assert.match(bottomNav, /canWriteSetoran/);
  assert.match(bottomNav, /isPimpinanRole/);
});
