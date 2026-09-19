import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('secure auth bootstrap exists and trusts Pimpinan without making it writer staff', () => {
  for (const file of [
    'api/_credentials.ts',
    'api/_firebaseAdmin.ts',
    'api/auth/login.ts',
    'api/auth/admin-users.ts',
    'api/auth/migrate-credentials.ts',
    'src/services/authService.ts',
    'src/services/secureAccountBridge.ts',
    'src/SecureApp.tsx',
    'firebase.json',
  ]) assert.equal(existsSync(file), true, `${file} must exist`);

  const login = readFileSync('api/auth/login.ts', 'utf8');
  const admin = readFileSync('api/auth/admin-users.ts', 'utf8');
  const migrate = readFileSync('api/auth/migrate-credentials.ts', 'utf8');
  const firebase = readFileSync('src/services/firebase.ts', 'utf8');
  const authService = readFileSync('src/services/authService.ts', 'utf8');
  const main = readFileSync('src/main.tsx', 'utf8');

  assert.match(login, /'Pimpinan'/);
  assert.match(migrate, /'Pimpinan'/);
  assert.match(admin, /'Pimpinan'/);
  assert.match(admin, /return role === 'Superadmin' \|\| role === 'Ustadz';/);
  assert.match(firebase, /export const auth = getAuth\(app\);/);
  assert.match(authService, /normalizeUserRole/);
  assert.match(main, /SecureApp/);
  assert.match(main, /installSecureAccountBridge\(\)/);
});
