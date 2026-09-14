import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const admin = read('api/_firebaseAdmin.ts');
const client = read('src/services/firebase.ts');
const vite = read('vite.config.ts');
const envExample = read('.env.example');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

assert(!admin.includes('|| DEFAULT_PROJECT_ID'), 'Firebase Admin must not silently fall back to the production project ID.');
assert(!admin.includes('|| DEFAULT_DATABASE_ID'), 'Firebase Admin must not silently fall back to the production database ID.');
assert(admin.includes("VERCEL_ENV === 'preview'"), 'Firebase Admin must explicitly detect Vercel Preview.');
assert(admin.includes('Preview Firebase Admin'), 'Firebase Admin must reject a shared production target in Preview.');

assert(vite.includes("'import.meta.env.VITE_VERCEL_ENV'"), 'Vite must expose VERCEL_ENV to client code as VITE_VERCEL_ENV.');
assert(client.includes('VITE_VERCEL_ENV'), 'Firebase client bootstrap must detect Vercel Preview.');
for (const key of [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIRESTORE_DATABASE_ID'
]) {
  assert(client.includes(key), `Firebase client Preview override must consume ${key}.`);
  assert(envExample.includes(`${key}=`), `.env.example must document ${key}.`);
}
assert(client.includes('Preview Firebase client isolation is not configured'), 'Preview client must fail closed when its isolated Firebase config is incomplete.');

if (!process.exitCode) {
  console.log('PASS: Preview Firebase client and Admin targets are isolated from production defaults.');
}
