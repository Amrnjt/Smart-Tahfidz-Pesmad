import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '../_firebaseAdmin';
import { hashPassword, safeLegacyCompare, verifyPassword, type StoredCredential } from '../_credentials';

type AuthRole = 'Superadmin' | 'Ustadz' | 'Wali' | 'Santri';

function normalizeRole(role: unknown): AuthRole | null {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'superadmin') return 'Superadmin';
  if (value === 'ustadz') return 'Ustadz';
  if (value === 'wali' || value.includes('wali')) return 'Wali';
  if (value === 'santri') return 'Santri';
  return null;
}

function send(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

async function ensureFirebaseIdentity(
  auth: ReturnType<typeof getAdminServices>['auth'],
  userId: string,
  nama: string,
  claims: Record<string, string>
) {
  try {
    const existing = await auth.getUser(userId);
    if (existing.displayName !== nama) {
      await auth.updateUser(userId, { displayName: nama });
    }
  } catch (error: any) {
    if (error?.code !== 'auth/user-not-found') throw error;
    await auth.createUser({ uid: userId, displayName: nama });
  }
  await auth.setCustomUserClaims(userId, claims);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { success: false, message: 'Metode tidak diizinkan.' });
  }

  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim();
  if (!username || !password) {
    return send(res, 400, { success: false, message: 'Username dan password wajib diisi.' });
  }

  try {
    const { auth, db } = getAdminServices();
    const credentials = db.collection('auth_credentials');

    let credentialSnapshot = await credentials.where('username', '==', username).limit(1).get();

    // Disabled by default. This exists only for a controlled migration window.
    // Production activation should run /api/auth/migrate-credentials first.
    if (credentialSnapshot.empty && process.env.P0_ALLOW_LEGACY_LOGIN_MIGRATION === 'true') {
      const legacyUsers = await db.collection('users').where('username', '==', username).limit(1).get();
      if (!legacyUsers.empty) {
        const legacyDoc = legacyUsers.docs[0];
        const legacyUser = legacyDoc.data() as Record<string, any>;
        const legacyPassword = String(legacyUser.password || '');

        if (legacyPassword && safeLegacyCompare(legacyPassword, password)) {
          const legacyRole = normalizeRole(legacyUser.role);
          if (!legacyRole) {
            return send(res, 403, { success: false, message: 'Role akun tidak dikenali.' });
          }

          const userId = String(legacyUser.id || legacyDoc.id);
          const migratedCredential = {
            userId,
            username,
            nama: String(legacyUser.nama || username),
            role: legacyRole,
            idSantri: String(legacyUser.idSantri || ''),
            kelasId: String(legacyUser.kelasId || ''),
            credential: hashPassword(password),
            createdAt: new Date().toISOString(),
            migratedFromLegacy: true
          };

          await credentials.doc(userId).set(migratedCredential);
          await legacyDoc.ref.set({
            password: FieldValue.delete(),
            authUid: userId,
            credentialMigratedAt: new Date().toISOString()
          }, { merge: true });
          credentialSnapshot = await credentials.where('username', '==', username).limit(1).get();
        }
      }
    }

    if (credentialSnapshot.empty) {
      return send(res, 401, { success: false, message: 'Username / ID Santri atau Password salah.' });
    }

    const credentialDoc = credentialSnapshot.docs[0];
    const stored = credentialDoc.data() as Record<string, any>;
    const credential = stored.credential as StoredCredential;

    if (!verifyPassword(password, credential)) {
      return send(res, 401, { success: false, message: 'Username / ID Santri atau Password salah.' });
    }

    const userId = String(stored.userId || credentialDoc.id);
    const role = normalizeRole(stored.role);
    if (!role) {
      return send(res, 403, { success: false, message: 'Role akun tidak dikenali.' });
    }

    const nama = String(stored.nama || username);
    const idSantri = String(stored.idSantri || '');
    const kelasId = String(stored.kelasId || '');
    const claims = {
      role,
      username,
      idSantri
    };

    await ensureFirebaseIdentity(auth, userId, nama, claims);
    const token = await auth.createCustomToken(userId, claims);

    return send(res, 200, {
      success: true,
      token,
      user: {
        id: userId,
        username,
        role,
        nama,
        ...(idSantri ? { idSantri } : {}),
        ...(kelasId ? { kelasId } : {})
      }
    });
  } catch (error) {
    console.error('Custom auth login error:', error);
    return send(res, 500, {
      success: false,
      message: 'Layanan autentikasi gagal memproses login.'
    });
  }
}
