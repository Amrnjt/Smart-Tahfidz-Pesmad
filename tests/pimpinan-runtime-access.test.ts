import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAccessTab,
  isGlobalReadOnlyRole,
  isPersonalViewOnlyRole,
  usesGlobalDashboard,
} from '../src/utils/roles.ts';

test('Pimpinan is a global read-only role', () => {
  assert.equal(isGlobalReadOnlyRole('Pimpinan'), true);
  assert.equal(isPersonalViewOnlyRole('Pimpinan'), false);
  assert.equal(usesGlobalDashboard('Pimpinan'), true);
});

test('Pimpinan can only access read-only primary tabs', () => {
  assert.equal(canAccessTab('Pimpinan', 'dashboard'), true);
  assert.equal(canAccessTab('Pimpinan', 'riwayat'), true);
  assert.equal(canAccessTab('Pimpinan', 'mushaf'), true);

  assert.equal(canAccessTab('Pimpinan', 'ziyadah'), false);
  assert.equal(canAccessTab('Pimpinan', 'murojaah'), false);
  assert.equal(canAccessTab('Pimpinan', 'binnadzor'), false);
  assert.equal(canAccessTab('Pimpinan', 'pembelajaran'), false);
  assert.equal(canAccessTab('Pimpinan', 'santri'), false);
  assert.equal(canAccessTab('Pimpinan', 'kelas'), false);
});

test('existing roles retain expected navigation scope', () => {
  assert.equal(canAccessTab('Ustadz', 'ziyadah'), true);
  assert.equal(canAccessTab('Superadmin', 'kelas'), true);
  assert.equal(canAccessTab('Wali', 'riwayat'), true);
  assert.equal(canAccessTab('Wali', 'ziyadah'), false);
  assert.equal(canAccessTab('Santri', 'mushaf'), true);
  assert.equal(canAccessTab('Santri', 'santri'), false);
});

test('unknown roles fail closed', () => {
  assert.equal(canAccessTab('operator', 'dashboard'), false);
  assert.equal(canAccessTab('operator', 'riwayat'), false);
  assert.equal(canAccessTab('operator', 'ziyadah'), false);
});
