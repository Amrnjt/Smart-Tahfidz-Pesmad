import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '../_firebaseAdmin';
import { hashPassword } from '../_credentials';

const ALLOWED_ROLES = new Set(['Superadmin', 'Ustadz', 'Wali', 'Santri']);

function normalizeRole(role: unknown): 'Superadmin' | 'Ustadz' | 'Wali' | 'Santri' {
  const value = String(role || '').trim();
  return ALLOWED_ROLES.has(value) ? value as any : 'Ustadz';
}

function send(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function cleanProfile(input: Record<string, any>) {
  const role = normalizeRole(input.role);
  return {
    id: String(input.id || '').trim(),
    username: String(input.username || '').trim().toLowerCase(),
    role,
    nama: String(input.nama || '').trim(),
    idSantri: role === 'Wali' || role === 'Santri' ? String(input.idSantri || '').trim() : '',
    kelasId: String(input.kelasId || '').trim(),
    ...(input.notificationPermission ? { notificationPermission: input.notificationPermission } : {})
  };
}

function publicUser(profile: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(profile).filter(([key, value]) => key !== 'password' && value !== undefined)
  );
}

async function verifyCaller(req: any) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const { auth } = getAdminServices();
  const decoded = await auth.verifyIdToken(header.slice(7));
  if (!ALLOWED_ROLES.has(String(decoded.role || ''))) {
    throw new Error('FORBIDDEN');
  }
  return decoded;
}

function isStaff(role: unknown) {
  return role === 'Superadmin' || role === 'Ustadz';
}

async function ensureAuthUser(
  auth: ReturnType<typeof getAdminServices>['auth'],
  profile: Record<string, any>
) {
  const uid = profile.id;
  try {
    const existing = await auth.getUser(uid);
    if (existing.displayName !== profile.nama) {
      await auth.updateUser(uid, { displayName: profile.nama });
    }
  } catch (error: any) {
    if (error?.code !== 'auth/user-not-found') throw error;
    await auth.createUser({ uid, displayName: profile.nama });
  }
  await auth.setCustomUserClaims(uid, {
    role: profile.role,
    username: profile.username,
    idSantri: profile.idSantri || ''
  });
}

async function usernameOwner(db: ReturnType<typeof getAdminServices>['db'], username: string) {
  const snapshot = await db.collection('auth_credentials').where('username', '==', username).limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0].id;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { success: false, message: 'Metode tidak diizinkan.' });
  }

  try {
    const caller = await verifyCaller(req);
    const callerRole = normalizeRole(caller.role);
    const { auth, db } = getAdminServices();
    const action = String(req.body?.action || '');

    if (action === 'updateUser' && caller.uid === String(req.body?.id || '')) {
      const update = req.body?.updatedData || {};
      const keys = Object.keys(update).filter((key) => update[key] !== undefined);
      const isNotificationOnly = keys.every((key) => key === 'notificationPermission') && !req.body?.password;
      if (!isStaff(callerRole) && isNotificationOnly) {
        await db.collection('users').doc(caller.uid).set({
          notificationPermission: update.notificationPermission
        }, { merge: true });
        return send(res, 200, { success: true });
      }
    }

    if (!isStaff(callerRole)) {
      return send(res, 403, { success: false, message: 'Hak akses tidak mencukupi.' });
    }

    if (action === 'createUser') {
      const requested = cleanProfile(req.body?.user || {});
      const password = String(req.body?.password || '').trim();
      requested.id = requested.id || `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      if (!requested.username || !requested.nama || password.length < 3) {
        return send(res, 400, { success: false, message: 'Nama, username, dan password awal wajib valid.' });
      }
      if (!/^[A-Za-z0-9_-]{3,128}$/.test(requested.id)) {
        return send(res, 400, { success: false, message: 'ID akun tidak valid.' });
      }
      if (requested.role === 'Superadmin' && callerRole !== 'Superadmin') {
        return send(res, 403, { success: false, message: 'Hanya Superadmin yang dapat membuat Superadmin.' });
      }

      const owner = await usernameOwner(db, requested.username);
      if (owner && owner !== requested.id) {
        return send(res, 409, { success: false, message: 'Username sudah digunakan akun lain.' });
      }

      await ensureAuthUser(auth, requested);
      const now = new Date().toISOString();
      const batch = db.batch();
      batch.set(db.collection('users').doc(requested.id), {
        ...publicUser(requested),
        password: FieldValue.delete(),
        authUid: requested.id,
        credentialMigratedAt: now
      }, { merge: true });
      batch.set(db.collection('auth_credentials').doc(requested.id), {
        ...publicUser(requested),
        userId: requested.id,
        credential: hashPassword(password),
        createdAt: now,
        migratedFromLegacy: false
      });
      await batch.commit();
      return send(res, 200, { success: true, user: publicUser(requested) });
    }

    if (action === 'updateUser') {
      const id = String(req.body?.id || '').trim();
      const credentialRef = db.collection('auth_credentials').doc(id);
      const credentialDoc = await credentialRef.get();
      if (!credentialDoc.exists) {
        return send(res, 409, { success: false, message: 'Akun belum dimigrasikan ke autentikasi aman.' });
      }

      const current = credentialDoc.data() as Record<string, any>;
      const updatedData = req.body?.updatedData || {};
      const next = cleanProfile({ ...current, ...updatedData, id });
      const password = String(req.body?.password || '').trim();

      if (!next.username || !next.nama) {
        return send(res, 400, { success: false, message: 'Nama dan username wajib diisi.' });
      }
      if ((current.role === 'Superadmin' || next.role === 'Superadmin') && callerRole !== 'Superadmin') {
        return send(res, 403, { success: false, message: 'Perubahan akun Superadmin hanya dapat dilakukan Superadmin.' });
      }

      const owner = await usernameOwner(db, next.username);
      if (owner && owner !== id) {
        return send(res, 409, { success: false, message: 'Username sudah digunakan akun lain.' });
      }

      await ensureAuthUser(auth, next);
      const now = new Date().toISOString();
      const credentialUpdate: Record<string, any> = {
        username: next.username,
        nama: next.nama,
        role: next.role,
        idSantri: next.idSantri,
        kelasId: next.kelasId,
        updatedAt: now
      };
      if (password) credentialUpdate.credential = hashPassword(password);

      const batch = db.batch();
      batch.set(db.collection('users').doc(id), {
        ...publicUser(next),
        password: FieldValue.delete(),
        authUid: id
      }, { merge: true });
      batch.set(credentialRef, credentialUpdate, { merge: true });
      await batch.commit();
      return send(res, 200, { success: true, user: publicUser(next) });
    }

    if (action === 'deleteUser') {
      const id = String(req.body?.id || '').trim();
      if (!id) return send(res, 400, { success: false, message: 'ID akun wajib diisi.' });

      const credentialRef = db.collection('auth_credentials').doc(id);
      const credentialDoc = await credentialRef.get();
      const targetRole = credentialDoc.exists ? normalizeRole(credentialDoc.data()?.role) : 'Ustadz';
      if (targetRole === 'Superadmin' && callerRole !== 'Superadmin') {
        return send(res, 403, { success: false, message: 'Akun Superadmin tidak dapat dihapus oleh Ustadz.' });
      }

      const batch = db.batch();
      batch.delete(db.collection('users').doc(id));
      batch.delete(credentialRef);
      await batch.commit();
      try {
        await auth.deleteUser(id);
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') throw error;
      }
      return send(res, 200, { success: true });
    }

    if (action === 'createSantriBundle') {
      const santri = req.body?.santri || {};
      const idSantri = String(santri.idSantri || '').trim();
      const namaSantri = String(santri.namaSantri || '').trim();
      const defaultPassword = String(req.body?.defaultPassword || '').trim();
      if (!idSantri || !namaSantri || defaultPassword.length < 3) {
        return send(res, 400, { success: false, message: 'Data santri dan password awal belum lengkap.' });
      }

      const waliProfile = cleanProfile({
        id: `USR-WLI-${idSantri}`,
        username: `wali_${idSantri.toLowerCase()}`,
        role: 'Wali',
        nama: santri.waliNama ? `Wali ${namaSantri} (${String(santri.waliNama).trim()})` : `Wali ${namaSantri}`,
        idSantri
      });
      const santriProfile = cleanProfile({
        id: `USR-STR-${idSantri}`,
        username: idSantri.toLowerCase(),
        role: 'Santri',
        nama: namaSantri,
        idSantri
      });

      for (const profile of [waliProfile, santriProfile]) {
        const owner = await usernameOwner(db, profile.username);
        if (owner && owner !== profile.id) {
          return send(res, 409, { success: false, message: `Username ${profile.username} sudah digunakan.` });
        }
      }

      await ensureAuthUser(auth, waliProfile);
      await ensureAuthUser(auth, santriProfile);
      const now = new Date().toISOString();
      const batch = db.batch();
      batch.set(db.collection('santri').doc(idSantri), santri, { merge: true });
      for (const profile of [waliProfile, santriProfile]) {
        batch.set(db.collection('users').doc(profile.id), {
          ...publicUser(profile),
          password: FieldValue.delete(),
          authUid: profile.id,
          credentialMigratedAt: now
        }, { merge: true });
        batch.set(db.collection('auth_credentials').doc(profile.id), {
          ...publicUser(profile),
          userId: profile.id,
          credential: hashPassword(defaultPassword),
          createdAt: now,
          migratedFromLegacy: false
        });
      }
      await batch.commit();
      return send(res, 200, { success: true, santri });
    }

    if (action === 'deleteSantriBundle') {
      const idSantri = String(req.body?.idSantri || '').trim();
      const deleteRelatedHistory = req.body?.deleteRelatedHistory !== false;
      if (!idSantri) return send(res, 400, { success: false, message: 'ID santri wajib diisi.' });

      const credentialSnapshot = await db.collection('auth_credentials').where('idSantri', '==', idSantri).get();
      const userIds = credentialSnapshot.docs.map((doc) => doc.id);
      const userSnapshot = await db.collection('users').where('idSantri', '==', idSantri).get();
      userSnapshot.docs.forEach((doc) => {
        if (!userIds.includes(doc.id)) userIds.push(doc.id);
      });

      const historyCollections = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'];
      const historyDocs: any[] = [];
      if (deleteRelatedHistory) {
        for (const collectionName of historyCollections) {
          const snapshot = await db.collection(collectionName).where('idSantri', '==', idSantri).get();
          historyDocs.push(...snapshot.docs);
        }
      }

      const operationCount = 1 + userIds.length * 2 + historyDocs.length;
      if (operationCount > 450) {
        return send(res, 409, { success: false, message: 'Data terkait terlalu banyak untuk satu operasi aman.' });
      }

      const batch = db.batch();
      batch.delete(db.collection('santri').doc(idSantri));
      userIds.forEach((id) => {
        batch.delete(db.collection('users').doc(id));
        batch.delete(db.collection('auth_credentials').doc(id));
      });
      historyDocs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      for (const id of userIds) {
        try {
          await auth.deleteUser(id);
        } catch (error: any) {
          if (error?.code !== 'auth/user-not-found') console.error('Auth cleanup failed:', id, error);
        }
      }
      return send(res, 200, { success: true });
    }

    return send(res, 400, { success: false, message: 'Aksi akun tidak dikenali.' });
  } catch (error: any) {
    if (error?.message === 'UNAUTHENTICATED' || error?.code === 'auth/id-token-expired') {
      return send(res, 401, { success: false, message: 'Sesi autentikasi tidak valid. Silakan login ulang.' });
    }
    if (error?.message === 'FORBIDDEN') {
      return send(res, 403, { success: false, message: 'Token tidak memiliki role aplikasi yang tepercaya.' });
    }
    console.error('Secure account API error:', error);
    return send(res, 500, { success: false, message: 'Operasi akun gagal diproses.' });
  }
}
