import { existsSync, readFileSync } from 'node:fs';

const requireEnv = process.argv.includes('--require-env');
const failures = [];

function requireFile(path) {
  if (!existsSync(path)) failures.push(`File wajib tidak ditemukan: ${path}`);
}

for (const path of [
  'api/auth/login.ts',
  'api/auth/migrate-credentials.ts',
  'api/auth/readiness.ts',
  'src/services/authService.ts',
  'src/services/roleScopedSync.ts',
  'firestore.rules',
  'firebase.json',
]) requireFile(path);

if (existsSync('firestore.rules')) {
  const rules = readFileSync('firestore.rules', 'utf8');
  if (/allow\s+[^;]*:\s*if\s+true\s*;/.test(rules)) {
    failures.push('firestore.rules masih memiliki unconditional allow.');
  }
  if (!/request\.auth\.token\.role/.test(rules)) {
    failures.push('firestore.rules belum memakai Firebase Auth role claims.');
  }
  if (!/match \/auth_credentials\/\{credentialId\}/.test(rules) || !/allow read, write: if false;/.test(rules)) {
    failures.push('auth_credentials belum ditutup dari client.');
  }
}

const envTemplate = existsSync('.env.example') ? readFileSync('.env.example', 'utf8') : '';
const requiredEnv = [
  'FIREBASE_PROJECT_ID',
  'FIRESTORE_DATABASE_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'P0_MIGRATION_SECRET',
];

for (const key of requiredEnv) {
  if (!new RegExp(`^${key}=`, 'm').test(envTemplate)) {
    failures.push(`.env.example belum mendokumentasikan ${key}.`);
  }
}

if (requireEnv) {
  for (const key of requiredEnv) {
    if (!String(process.env[key] || '').trim()) failures.push(`Environment variable belum tersedia: ${key}`);
  }
  if (String(process.env.P0_MIGRATION_SECRET || '').trim().length < 24) {
    failures.push('P0_MIGRATION_SECRET minimal 24 karakter.');
  }
  if (process.env.P0_ALLOW_LEGACY_LOGIN_MIGRATION === 'true') {
    failures.push('P0_ALLOW_LEGACY_LOGIN_MIGRATION harus false sebelum rules secure diaktifkan.');
  }
}

if (failures.length > 0) {
  console.error('Security bootstrap NOT READY:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(requireEnv ? 'Cutover environment READY.' : 'Security bootstrap repository contract READY.');
}
