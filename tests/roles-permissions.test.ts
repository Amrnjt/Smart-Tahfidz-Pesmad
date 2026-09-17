import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canDeleteHistory,
  canEditHistory,
  canManageKelas,
  canManageSantri,
  canManageUsers,
  canViewAllHistory,
  canWriteSetoran,
  normalizeUserRole,
} from '../src/utils/roles.ts';

test('normalizeUserRole canonicalizes pimpinan variants', () => {
  assert.equal(normalizeUserRole('Pimpinan'), 'Pimpinan');
  assert.equal(normalizeUserRole('pimpinan'), 'Pimpinan');
  assert.equal(normalizeUserRole('  PIMPINAN  '), 'Pimpinan');
});

test('Pimpinan can view all history but cannot mutate tahfidz data', () => {
  assert.equal(canViewAllHistory('Pimpinan'), true);
  assert.equal(canWriteSetoran('Pimpinan'), false);
  assert.equal(canEditHistory('Pimpinan'), false);
  assert.equal(canDeleteHistory('Pimpinan'), false);
  assert.equal(canManageSantri('Pimpinan'), false);
  assert.equal(canManageKelas('Pimpinan'), false);
  assert.equal(canManageUsers('Pimpinan'), false);
});

test('existing roles keep their intended foundation permissions', () => {
  assert.equal(canViewAllHistory('Superadmin'), true);
  assert.equal(canViewAllHistory('Ustadz'), true);
  assert.equal(canViewAllHistory('Wali'), false);
  assert.equal(canViewAllHistory('Santri'), false);

  assert.equal(canWriteSetoran('Superadmin'), true);
  assert.equal(canWriteSetoran('Ustadz'), true);
  assert.equal(canWriteSetoran('Wali'), false);
  assert.equal(canWriteSetoran('Santri'), false);
});
