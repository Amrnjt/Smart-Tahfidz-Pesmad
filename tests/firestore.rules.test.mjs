import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-smart-tahfidz';
let env;

const identities = {
  superadmin: ['super-1', { role: 'Superadmin', username: 'super', idSantri: '' }],
  pimpinan: ['pimpinan-1', { role: 'Pimpinan', username: 'pimpinan', idSantri: '' }],
  ustadz: ['ustadz-1', { role: 'Ustadz', username: 'ustadz', idSantri: '' }],
  wali: ['wali-1', { role: 'Wali', username: 'wali', idSantri: 'santri-a' }],
  santri: ['santri-user-a', { role: 'Santri', username: 'santri-a', idSantri: 'santri-a' }],
  unknown: ['unknown-1', { role: 'Operator', username: 'operator', idSantri: '' }],
};

const dbFor = (key) => {
  const [uid, claims] = identities[key];
  return env.authenticatedContext(uid, claims).firestore();
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });

  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [uid, claims] of Object.values(identities)) {
      if (claims.role !== 'Operator') {
        await setDoc(doc(db, 'users', uid), {
          id: uid,
          username: claims.username,
          role: claims.role,
          idSantri: claims.idSantri,
          nama: claims.username,
        });
      }
    }

    await setDoc(doc(db, 'santri', 'santri-a'), { idSantri: 'santri-a', namaSantri: 'A' });
    await setDoc(doc(db, 'santri', 'santri-b'), { idSantri: 'santri-b', namaSantri: 'B' });

    for (const name of ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran', 'pantauan_liburan']) {
      await setDoc(doc(db, name, `${name}-a`), { id: `${name}-a`, idSantri: 'santri-a', timestamp: '2026-09-19 07:00' });
      await setDoc(doc(db, name, `${name}-b`), { id: `${name}-b`, idSantri: 'santri-b', timestamp: '2026-09-19 07:00' });
    }

    await setDoc(doc(db, 'kelas', 'kelas-1'), { id: 'kelas-1', namaKelas: 'Tahfidz A' });
    await setDoc(doc(db, 'app_config', 'global_settings'), { programLiburanActive: true });
    await setDoc(doc(db, 'trash_records', 'trash-1'), { id: 'trash-1' });
    await setDoc(doc(db, 'auth_credentials', 'super-1'), { username: 'super', credential: { hash: 'never-client-readable' } });
  });
});

after(async () => {
  await env?.cleanup();
});

test('unauthenticated and unknown roles fail closed', async () => {
  const anon = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anon, 'santri', 'santri-a')));
  await assertFails(getDoc(doc(dbFor('unknown'), 'santri', 'santri-a')));
});

test('Pimpinan is global monitoring reader but cannot mutate or enumerate users', async () => {
  const db = dbFor('pimpinan');

  for (const name of ['santri', 'ziyadah', 'murojaah', 'binnadzor', 'pembelajaran', 'kelas', 'pantauan_liburan']) {
    await assertSucceeds(getDocs(collection(db, name)));
  }
  await assertSucceeds(getDoc(doc(db, 'app_config', 'global_settings')));
  await assertSucceeds(getDoc(doc(db, 'users', 'pimpinan-1')));
  await assertFails(getDoc(doc(db, 'users', 'ustadz-1')));
  await assertFails(getDocs(collection(db, 'users')));
  await assertFails(setDoc(doc(db, 'ziyadah', 'pimpinan-write'), { idSantri: 'santri-a' }));
  await assertFails(setDoc(doc(db, 'app_config', 'global_settings'), { programLiburanActive: false }));
  await assertFails(getDoc(doc(db, 'trash_records', 'trash-1')));
  await assertFails(getDoc(doc(db, 'auth_credentials', 'super-1')));
});

test('writer staff can read globally and mutate tahfidz data but credentials stay server-only', async () => {
  for (const key of ['superadmin', 'ustadz']) {
    const db = dbFor(key);
    await assertSucceeds(getDocs(collection(db, 'santri')));
    await assertSucceeds(getDocs(collection(db, 'users')));
    await assertSucceeds(setDoc(doc(db, 'ziyadah', `${key}-write`), { idSantri: 'santri-a' }));
    await assertSucceeds(setDoc(doc(db, 'kelas', `${key}-kelas`), { namaKelas: key }));
    await assertFails(setDoc(doc(db, 'users', 'client-created-user'), { role: 'Santri' }));
    await assertFails(getDoc(doc(db, 'auth_credentials', 'super-1')));
  }
});

test('Wali and Santri only read their linked santri scope', async () => {
  for (const key of ['wali', 'santri']) {
    const db = dbFor(key);
    const [uid] = identities[key];

    await assertSucceeds(getDoc(doc(db, 'users', uid)));
    await assertFails(getDoc(doc(db, 'users', 'ustadz-1')));

    await assertSucceeds(getDoc(doc(db, 'santri', 'santri-a')));
    await assertFails(getDoc(doc(db, 'santri', 'santri-b')));
    await assertFails(getDocs(collection(db, 'santri')));

    await assertSucceeds(getDoc(doc(db, 'ziyadah', 'ziyadah-a')));
    await assertFails(getDoc(doc(db, 'ziyadah', 'ziyadah-b')));
    await assertSucceeds(
      getDocs(query(collection(db, 'ziyadah'), where('idSantri', '==', 'santri-a')))
    );
    await assertFails(getDocs(collection(db, 'ziyadah')));

    await assertSucceeds(getDoc(doc(db, 'app_config', 'global_settings')));
    await assertFails(getDocs(collection(db, 'kelas')));
    await assertFails(setDoc(doc(db, 'murojaah', `${key}-write`), { idSantri: 'santri-a' }));
    await assertFails(getDoc(doc(db, 'auth_credentials', 'super-1')));
  }
});

test('rules contain no unconditional allow and credentials are explicitly denied', () => {
  const rules = readFileSync('firestore.rules', 'utf8');
  assert.doesNotMatch(rules, /allow\s+[^;]*:\s*if\s+true\s*;/);
  assert.match(rules, /match \/auth_credentials\/\{credentialId\}/);
  assert.match(rules, /allow read, write: if false;/);
});
