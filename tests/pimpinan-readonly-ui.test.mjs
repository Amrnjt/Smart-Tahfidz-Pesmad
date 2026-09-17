import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const historyView = readFileSync('src/components/PimpinanHistoryTable.tsx', 'utf8');
const bottomNav = readFileSync('src/components/PimpinanBottomNav.tsx', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const navbar = readFileSync('src/components/Navbar.tsx', 'utf8');
const santriManagement = readFileSync('src/components/SantriManagement.tsx', 'utf8');

test('Pimpinan history presenter contains no mutation path', () => {
  assert.doesNotMatch(historyView, /updateRecord|deleteRecord|deleteRecordsBatch|setRecord|addRecord/);
  assert.doesNotMatch(historyView, /Trash2|SquarePen|\bPencil\b/);
  assert.match(historyView, /UnduhLaporanModal/);
});

test('Pimpinan mobile navigation exposes only read-only primary destinations', () => {
  assert.match(bottomNav, /Beranda/);
  assert.match(bottomNav, /Riwayat/);
  assert.match(bottomNav, /Mushaf/);
  assert.doesNotMatch(bottomNav, /Setor|Kelola|Pantauan/);
});

test('App routes Pimpinan through dedicated read-only presenters', () => {
  assert.match(app, /PimpinanHistoryTable/);
  assert.match(app, /PimpinanBottomNav/);
  assert.match(app, /isGlobalReadOnlyRole/);
  assert.match(app, /canWriteSetoran/);
});

test('Pimpinan cannot trigger manual cloud sync mutation path', () => {
  assert.match(app, /if \(isGlobalReadOnlyRole\(currentUser\?\.role\)\) return;/);
  assert.match(app, /onRefresh=\{canSetor \? handleManualRefresh : undefined\}/);
});

test('Navbar identifies Pimpinan explicitly instead of falling back to Ustadz', () => {
  assert.match(navbar, /normalizeUserRole/);
  assert.match(navbar, /Pimpinan:\s*\{/);
  assert.match(navbar, /label:\s*'Pimpinan'/);
});

test('account management can create and edit Pimpinan without a santri link', () => {
  const pimpinanOptions = santriManagement.match(/option value="Pimpinan"/g) || [];
  assert.ok(pimpinanOptions.length >= 2);
  assert.match(santriManagement, /editRole === 'Pimpinan'/);
  assert.match(santriManagement, /newUserRole === 'Pimpinan'/);
});
