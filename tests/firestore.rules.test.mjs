import fs from 'node:fs';
import { after, before, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-smart-tahfidz';
let testEnv;

function dbFor(uid, role, idSantri = '') {
  return testEnv.authenticatedContext(uid, { role, idSantri }).firestore();
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await Promise.all([
      setDoc(doc(db, 'users', 'USR-SUP'), { nama: 'Superadmin', role: 'Superadmin', notificationPermission: 'default' }),
      setDoc(doc(db, 'users', 'USR-UST'), { nama: 'Ustadz', role: 'Ustadz', notificationPermission: 'default' }),
      setDoc(doc(db, 'users', 'USR-W1'), { nama: 'Wali 1', role: 'Wali', idSantri: 'S1', notificationPermission: 'default' }),
      setDoc(doc(db, 'users', 'USR-S1'), { nama: 'Santri 1', role: 'Santri', idSantri: 'S1', notificationPermission: 'default' }),
      setDoc(doc(db, 'users', 'USR-W2'), { nama: 'Wali 2', role: 'Wali', idSantri: 'S2', notificationPermission: 'default' }),
      setDoc(doc(db, 'santri', 'S1'), { idSantri: 'S1', namaSantri: 'Santri Satu' }),
      setDoc(doc(db, 'santri', 'S2'), { idSantri: 'S2', namaSantri: 'Santri Dua' }),
      setDoc(doc(db, 'ziyadah', 'Z1'), { idSantri: 'S1', surat: 'Al-Baqarah' }),
      setDoc(doc(db, 'ziyadah', 'Z2'), { idSantri: 'S2', surat: 'Ali Imran' }),
      setDoc(doc(db, 'murojaah', 'M1'), { idSantri: 'S1', surat: 'Al-Mulk' }),
      setDoc(doc(db, 'pantauan_liburan', 'P1'), { idSantri: 'S1', status: 'Jamaah' }),
      setDoc(doc(db, 'pantauan_liburan', 'P2'), { idSantri: 'S2', status: 'Sakit' }),
      setDoc(doc(db, 'kelas', 'K1'), { nama: 'Kelas 1' }),
      setDoc(doc(db, 'app_config', 'global'), { pantauanLiburanAktif: true }),
      setDoc(doc(db, 'auth_credentials', 'USR-SUP'), { username: 'super', credential: { hash: 'x' } }),
    ]);
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test('anonymous access is denied', async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'santri', 'S1')));
  await assertFails(getDoc(doc(db, 'app_config', 'global')));
});

test('Superadmin and Ustadz have intended staff access', async () => {
  for (const [uid, role] of [['USR-SUP', 'Superadmin'], ['USR-UST', 'Ustadz']]) {
    const db = dbFor(uid, role);
    await assertSucceeds(getDoc(doc(db, 'santri', 'S1')));
    await assertSucceeds(setDoc(doc(db, 'kelas', `K-${role}`), { nama: role }));
  }
});

test('Wali can read only linked-santri records and constrained linked queries', async () => {
  const db = dbFor('USR-W1', 'Wali', 'S1');
  await assertSucceeds(getDoc(doc(db, 'santri', 'S1')));
  await assertFails(getDoc(doc(db, 'santri', 'S2')));
  await assertSucceeds(getDoc(doc(db, 'ziyadah', 'Z1')));
  await assertFails(getDoc(doc(db, 'ziyadah', 'Z2')));

  const ownQuery = query(collection(db, 'ziyadah'), where('idSantri', '==', 'S1'));
  await assertSucceeds(getDocs(ownQuery));
});

test('Wali may mutate only their own pantauan_liburan records', async () => {
  const db = dbFor('USR-W1', 'Wali', 'S1');
  await assertSucceeds(setDoc(doc(db, 'pantauan_liburan', 'P-W1'), { idSantri: 'S1', status: 'Jamaah' }));
  await assertFails(setDoc(doc(db, 'pantauan_liburan', 'P-CROSS'), { idSantri: 'S2', status: 'Jamaah' }));
  await assertSucceeds(updateDoc(doc(db, 'pantauan_liburan', 'P1'), { status: 'Berhalangan' }));
  await assertFails(updateDoc(doc(db, 'pantauan_liburan', 'P1'), { idSantri: 'S2' }));
  await assertSucceeds(deleteDoc(doc(db, 'pantauan_liburan', 'P-W1')));
  await assertFails(deleteDoc(doc(db, 'pantauan_liburan', 'P2')));
});

test('Santri can read linked data but cannot perform staff or Wali writes', async () => {
  const db = dbFor('USR-S1', 'Santri', 'S1');
  await assertSucceeds(getDoc(doc(db, 'santri', 'S1')));
  await assertSucceeds(getDoc(doc(db, 'murojaah', 'M1')));
  await assertFails(getDoc(doc(db, 'santri', 'S2')));
  await assertFails(setDoc(doc(db, 'pantauan_liburan', 'P-SANTRI'), { idSantri: 'S1', status: 'Jamaah' }));
  await assertFails(updateDoc(doc(db, 'santri', 'S1'), { namaSantri: 'Changed' }));
});

test('auth_credentials is inaccessible even to staff', async () => {
  const db = dbFor('USR-SUP', 'Superadmin');
  await assertFails(getDoc(doc(db, 'auth_credentials', 'USR-SUP')));
  await assertFails(setDoc(doc(db, 'auth_credentials', 'X'), { username: 'x' }));
});

test('a user may update only their own notificationPermission field', async () => {
  const db = dbFor('USR-W1', 'Wali', 'S1');
  await assertSucceeds(getDoc(doc(db, 'users', 'USR-W1')));
  await assertSucceeds(updateDoc(doc(db, 'users', 'USR-W1'), { notificationPermission: 'granted' }));
  await assertFails(updateDoc(doc(db, 'users', 'USR-W1'), { nama: 'Escalated' }));
  await assertFails(getDoc(doc(db, 'users', 'USR-W2')));
});

test('unknown roles fail closed even when an idSantri claim is present', async () => {
  const db = dbFor('USR-X', 'Administrator', 'S1');
  await assertFails(getDoc(doc(db, 'kelas', 'K1')));
  await assertFails(getDoc(doc(db, 'santri', 'S1')));
  await assertFails(getDoc(doc(db, 'ziyadah', 'Z1')));
  await assertFails(setDoc(doc(db, 'pantauan_liburan', 'P-X'), { idSantri: 'S1', status: 'Jamaah' }));
});
