import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInWithCustomToken } from 'firebase/auth';

import loginHandler from '../api/auth/login';
import migrateHandler from '../api/auth/migrate-credentials';
import adminUsersHandler from '../api/auth/admin-users';

const PROJECT_ID = 'demo-smart-tahfidz';
const MIGRATION_SECRET = 'test-only-migration-secret-123456789';
const users = [
  { id: 'super-1', username: 'supertest', password: 'PassSuper123!', nama: 'Super Test', role: 'Superadmin', idSantri: '' },
  { id: 'ustadz-1', username: 'ustadztest', password: 'PassUstadz123!', nama: 'Ustadz Test', role: 'Ustadz', idSantri: '' },
  { id: 'wali-1', username: 'walitest', password: 'PassWali123!', nama: 'Wali Test', role: 'Wali', idSantri: 'santri-a' },
  { id: 'santri-1', username: 'santritest', password: 'PassSantri123!', nama: 'Santri Test', role: 'Santri', idSantri: 'santri-a' },
] as const;

let testEnv: RulesTestEnvironment;
const clientApps: FirebaseApp[] = [];

function mockResponse() {
  const state: { statusCode: number; body: any; headers: Record<string, string> } = {
    statusCode: 200,
    body: undefined,
    headers: {},
  };
  return {
    state,
    res: {
      setHeader(name: string, value: string) {
        state.headers[name.toLowerCase()] = value;
      },
      status(code: number) {
        state.statusCode = code;
        return this;
      },
      json(body: any) {
        state.body = body;
        return this;
      },
    },
  };
}

async function call(handler: (req: any, res: any) => Promise<any>, req: any) {
  const { state, res } = mockResponse();
  await handler(req, res);
  return state;
}

async function loginClient(user: (typeof users)[number], suffix: string) {
  const response = await call(loginHandler, {
    method: 'POST',
    headers: {},
    body: { username: user.username, password: user.password },
  });
  assert.equal(response.statusCode, 200, `${user.role}: ${JSON.stringify(response.body)}`);

  const app = initializeApp({
    apiKey: 'fake-api-key',
    projectId: PROJECT_ID,
    authDomain: `${PROJECT_ID}.firebaseapp.com`,
  }, `runtime-${user.id}-${suffix}-${Date.now()}`);
  clientApps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const credential = await signInWithCustomToken(auth, response.body.token);
  return { response, credential, idToken: await credential.user.getIdToken(true) };
}

before(async () => {
  process.env.FIREBASE_PROJECT_ID = PROJECT_ID;
  process.env.FIRESTORE_DATABASE_ID = '(default)';
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
  process.env.P0_MIGRATION_SECRET = MIGRATION_SECRET;
  process.env.P0_ALLOW_LEGACY_LOGIN_MIGRATION = 'false';
  delete process.env.FIREBASE_CLIENT_EMAIL;
  delete process.env.FIREBASE_PRIVATE_KEY;
  delete process.env.VERCEL_ENV;

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8080 },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const user of users) {
      await setDoc(doc(db, 'users', user.id), { ...user });
    }
  });
});

after(async () => {
  await Promise.all(clientApps.map((app) => deleteApp(app)));
  await testEnv?.cleanup();
});

test('login endpoint method and invalid credentials fail safely', async () => {
  const getResponse = await call(loginHandler, { method: 'GET', headers: {}, body: {} });
  assert.equal(getResponse.statusCode, 405);

  const invalidResponse = await call(loginHandler, {
    method: 'POST',
    headers: {},
    body: { username: 'does-not-exist', password: 'wrong-password' },
  });
  assert.equal(invalidResponse.statusCode, 401, JSON.stringify(invalidResponse.body));
});

test('controlled migration hashes credentials and removes plaintext passwords', async () => {
  const denied = await call(migrateHandler, {
    method: 'POST',
    headers: { 'x-migration-secret': 'wrong-secret' },
    body: {},
  });
  assert.equal(denied.statusCode, 403);

  const migrated = await call(migrateHandler, {
    method: 'POST',
    headers: { 'x-migration-secret': MIGRATION_SECRET },
    body: {},
  });
  assert.equal(migrated.statusCode, 200, JSON.stringify(migrated.body));
  assert.equal(migrated.body.readyForAuthGate, true);
  assert.equal(migrated.body.migrated, users.length);
  assert.equal(migrated.body.skipped, 0);
  assert.equal(migrated.body.conflicts, 0);

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const user of users) {
      const profile = (await getDoc(doc(db, 'users', user.id))).data()!;
      assert.equal('password' in profile, false, `${user.role} plaintext password must be removed`);
      assert.equal(profile.authUid, user.id);

      const credential = (await getDoc(doc(db, 'auth_credentials', user.id))).data()!;
      assert.equal(credential.username, user.username);
      assert.equal(credential.role, user.role);
      assert.equal(credential.credential.algorithm, 'scrypt');
      assert.notEqual(credential.credential.hash, user.password);
    }
  });
});

test('all four roles receive usable custom tokens with correct claims', async () => {
  for (const user of users) {
    const { response, credential } = await loginClient(user, 'claims');
    assert.equal(response.body.user.role, user.role);
    assert.ok(response.body.token, `${user.role} must receive a custom token`);

    const tokenResult = await credential.user.getIdTokenResult(true);
    assert.equal(tokenResult.claims.role, user.role);
    assert.equal(tokenResult.claims.username, user.username);
    assert.equal(tokenResult.claims.idSantri ?? '', user.idSantri);
  }
});

test('secure admin account lifecycle enforces staff boundary and never stores plaintext passwords', async () => {
  const ustadz = users.find((user) => user.role === 'Ustadz')!;
  const wali = users.find((user) => user.role === 'Wali')!;
  const ustadzSession = await loginClient(ustadz, 'admin');
  const waliSession = await loginClient(wali, 'admin');

  const waliCreateDenied = await call(adminUsersHandler, {
    method: 'POST',
    headers: { authorization: `Bearer ${waliSession.idToken}` },
    body: {
      action: 'createUser',
      user: { id: 'forbidden-user', username: 'forbidden', nama: 'Forbidden', role: 'Santri', idSantri: 'santri-x' },
      password: 'Nope123!',
    },
  });
  assert.equal(waliCreateDenied.statusCode, 403);

  const ustadzSuperadminDenied = await call(adminUsersHandler, {
    method: 'POST',
    headers: { authorization: `Bearer ${ustadzSession.idToken}` },
    body: {
      action: 'createUser',
      user: { id: 'forbidden-super', username: 'forbiddensuper', nama: 'Forbidden Super', role: 'Superadmin' },
      password: 'Nope123!',
    },
  });
  assert.equal(ustadzSuperadminDenied.statusCode, 403);

  const created = await call(adminUsersHandler, {
    method: 'POST',
    headers: { authorization: `Bearer ${ustadzSession.idToken}` },
    body: {
      action: 'createUser',
      user: { id: 'managed-wali-1', username: 'managedwali', nama: 'Managed Wali', role: 'Wali', idSantri: 'santri-managed' },
      password: 'ManagedPass123!',
    },
  });
  assert.equal(created.statusCode, 200, JSON.stringify(created.body));

  const selfNotification = await call(adminUsersHandler, {
    method: 'POST',
    headers: { authorization: `Bearer ${waliSession.idToken}` },
    body: {
      action: 'updateUser',
      id: wali.id,
      updatedData: { notificationPermission: 'granted' },
    },
  });
  assert.equal(selfNotification.statusCode, 200, JSON.stringify(selfNotification.body));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const profile = (await getDoc(doc(db, 'users', 'managed-wali-1'))).data()!;
    assert.equal('password' in profile, false);
    assert.equal(profile.role, 'Wali');

    const secureCredential = (await getDoc(doc(db, 'auth_credentials', 'managed-wali-1'))).data()!;
    assert.equal(secureCredential.credential.algorithm, 'scrypt');
    assert.notEqual(secureCredential.credential.hash, 'ManagedPass123!');

    const waliProfile = (await getDoc(doc(db, 'users', wali.id))).data()!;
    assert.equal(waliProfile.notificationPermission, 'granted');
  });

  const deleted = await call(adminUsersHandler, {
    method: 'POST',
    headers: { authorization: `Bearer ${ustadzSession.idToken}` },
    body: { action: 'deleteUser', id: 'managed-wali-1' },
  });
  assert.equal(deleted.statusCode, 200, JSON.stringify(deleted.body));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    assert.equal((await getDoc(doc(db, 'users', 'managed-wali-1'))).exists(), false);
    assert.equal((await getDoc(doc(db, 'auth_credentials', 'managed-wali-1'))).exists(), false);
  });
});
