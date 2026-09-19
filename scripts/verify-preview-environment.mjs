const PRODUCTION_PROJECT_ID = 'tonal-garage-pn96h';
const PRODUCTION_DATABASE_ID = 'ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e';

if (process.env.VERCEL_ENV !== 'preview') {
  console.log('Preview environment gate skipped outside Vercel Preview.');
  process.exit(0);
}

const required = [
  'FIREBASE_PROJECT_ID',
  'FIRESTORE_DATABASE_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'P0_MIGRATION_SECRET',
];

const missing = required.filter((key) => !String(process.env[key] || '').trim());
const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
const databaseId = String(process.env.FIRESTORE_DATABASE_ID || '').trim();
const migrationSecret = String(process.env.P0_MIGRATION_SECRET || '').trim();
const legacyFallback = process.env.P0_ALLOW_LEGACY_LOGIN_MIGRATION === 'true';

if (missing.length) {
  const bit = {
    FIREBASE_PROJECT_ID: 1,
    FIRESTORE_DATABASE_ID: 2,
    FIREBASE_CLIENT_EMAIL: 4,
    FIREBASE_PRIVATE_KEY: 8,
    P0_MIGRATION_SECRET: 16,
  };
  const mask = missing.reduce((sum, key) => sum + bit[key], 0);
  console.error('P3F Preview environment NOT READY: required env is incomplete.');
  process.exit(20 + mask);
}
if (migrationSecret.length < 24) {
  console.error('P3F Preview environment NOT READY: migration secret is too short.');
  process.exit(3);
}
if (legacyFallback) {
  console.error('P3F Preview environment NOT READY: legacy login fallback is enabled.');
  process.exit(4);
}
if (projectId === PRODUCTION_PROJECT_ID && databaseId === PRODUCTION_DATABASE_ID) {
  console.error('P3F Preview environment NOT READY: Firebase Admin targets production.');
  process.exit(5);
}

console.log('P3F Preview environment READY and isolated from production.');
