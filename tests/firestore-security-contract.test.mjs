import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const secureRules = readFileSync('firestore.secure.rules', 'utf8');

test('secure Firestore rules require authenticated server-side identity', () => {
  assert.match(secureRules, /request\.auth\s*!=\s*null/);
  assert.match(secureRules, /auth_profiles/);
  assert.doesNotMatch(secureRules, /allow\s+(?:read|write|read,\s*write)[^;]*:\s*if\s+true\s*;/);
});

test('Pimpinan is explicitly read-only in secure rules', () => {
  assert.match(secureRules, /function\s+isPimpinan\s*\(\)/);
  assert.match(secureRules, /role\(\)\s*==\s*['"]Pimpinan['"]/);

  const writeHelper = secureRules.match(/function\s+canWriteTahfidz\s*\(\)\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(writeHelper, /isSuperadmin\(\)/);
  assert.match(writeHelper, /isUstadz\(\)/);
  assert.doesNotMatch(writeHelper, /Pimpinan|isPimpinan/);
});

test('mutable tahfidz collections are protected by role-aware write checks', () => {
  for (const collection of ['santri', 'ziyadah', 'murojaah', 'binnadzor', 'pembelajaran', 'kelas']) {
    const block = new RegExp(`match \\/${collection}\\/\\{[^}]+\\} \\{[\\s\\S]*?allow write: if canWriteTahfidz\\(\\);[\\s\\S]*?\\}`);
    assert.match(secureRules, block, `${collection} must use canWriteTahfidz()`);
  }
});

test('user and authorization profile writes are Superadmin-only', () => {
  assert.match(secureRules, /match \/users\/\{userId\}[\s\S]*?allow write: if isSuperadmin\(\);/);
  assert.match(secureRules, /match \/auth_profiles\/\{uid\}[\s\S]*?allow write: if isSuperadmin\(\);/);
});
