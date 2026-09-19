import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('cutover readiness artifacts exist and fail closed', () => {
  for (const file of [
    'api/auth/readiness.ts',
    'scripts/verify-security-bootstrap.mjs',
    'docs/security/p3e-production-cutover.md',
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  const readiness = readFileSync('api/auth/readiness.ts', 'utf8');
  assert.match(readiness, /P0_MIGRATION_SECRET/);
  assert.match(readiness, /readyForCutover/);
  assert.match(readiness, /legacyPasswordsRemaining/);
  assert.match(readiness, /missingCredentials/);
  assert.match(readiness, /missingAuthUsers/);
  assert.match(readiness, /claimMismatches/);
  assert.match(readiness, /usernameConflicts/);

  const verifier = readFileSync('scripts/verify-security-bootstrap.mjs', 'utf8');
  assert.match(verifier, /P0_ALLOW_LEGACY_LOGIN_MIGRATION/);
  assert.match(verifier, /firestore\.rules/);
  assert.match(verifier, /auth_credentials/);
  assert.match(verifier, /process\.exitCode = 1/);
});

test('package exposes explicit security readiness commands', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['verify:security-bootstrap'], 'node scripts/verify-security-bootstrap.mjs');
  assert.equal(pkg.scripts['verify:cutover-env'], 'node scripts/verify-security-bootstrap.mjs --require-env');
});

test('environment template documents every server-side cutover prerequisite', () => {
  const env = readFileSync('.env.example', 'utf8');
  for (const key of [
    'FIREBASE_PROJECT_ID',
    'FIRESTORE_DATABASE_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'P0_MIGRATION_SECRET',
    'P0_ALLOW_LEGACY_LOGIN_MIGRATION',
  ]) assert.match(env, new RegExp(`^${key}=`, 'm'));
});
