import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('Pimpinan receives global monitoring data without global users', () => {
  assert.equal(existsSync('src/services/roleScopedSync.ts'), true);
  const source = readFileSync('src/services/roleScopedSync.ts', 'utf8');

  assert.match(source, /normalizedRole === 'Pimpinan'/);
  assert.match(source, /startPimpinanRealtimeScope/);
  assert.match(source, /doc\(db, COLLECTIONS\.USERS, session\.id\)/);

  for (const key of [
    'SANTRI', 'ZIYADAH', 'MUROJAAH', 'BINNADZOR',
    'PEMBELAJARAN', 'KELAS', 'PANTAUAN_LIBURAN'
  ]) {
    assert.match(source, new RegExp(`collection\\(db, COLLECTIONS\\.${key}\\)`));
  }

  const pimpinanBlock = source.match(/function startPimpinanRealtimeScope[\s\S]*?\n}\n\nfunction startPersonalRealtimeScope/)?.[0] ?? '';
  assert.doesNotMatch(pimpinanBlock, /collection\(db, COLLECTIONS\.USERS\)/);
});

test('Wali and Santri retain idSantri-scoped sync', () => {
  const source = readFileSync('src/services/roleScopedSync.ts', 'utf8');
  assert.match(source, /getLinkedSantriId\(session\)/);
  assert.match(source, /where\('idSantri', '==', targetSantriId\)/);
});

test('role scoped sync is installed after secure auth bridge', () => {
  const main = readFileSync('src/main.tsx', 'utf8');
  assert.match(main, /installSecureAccountBridge\(\);[\s\S]*installRoleScopedSync\(\);/);
});

test('role helpers separate writer staff from global readers', () => {
  const roles = readFileSync('src/utils/roles.ts', 'utf8');
  assert.match(roles, /function isWriterStaffRole/);
  assert.match(roles, /function isGlobalReaderRole/);
  assert.match(roles, /normalized === 'Superadmin' \|\| normalized === 'Ustadz'/);
  assert.match(roles, /normalized === 'Superadmin' \|\| normalized === 'Pimpinan' \|\| normalized === 'Ustadz'/);
});
