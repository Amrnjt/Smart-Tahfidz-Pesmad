import { FieldValue } from 'firebase-admin/firestore';
import { getAdminServices } from '../_firebaseAdmin';
import { hashPassword } from '../_credentials';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { success: false, message: 'Metode tidak diizinkan.' });
  }

  const expectedSecret = process.env.P0_MIGRATION_SECRET;
  const suppliedSecret = String(req.headers['x-migration-secret'] || '');
  if (!expectedSecret || expectedSecret.length < 24 || suppliedSecret !== expectedSecret) {
    return send(res, 403, { success: false, message: 'Migrasi tidak diizinkan.' });
  }

  try {
    const { auth, db } = getAdminServices();
    const usersSnapshot = await db.collection('users').get();
    const credentialCollection = db.collection('auth_credentials');
    const seenUsernames = new Map<string, string>();

    let migrated = 0;
    let alreadyMigrated = 0;
    let skipped = 0;
    let conflicts = 0;

    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data() as Record<string, any>;
      const userId = String(user.id || userDoc.id);
      const username = String(user.username || '').trim().toLowerCase();
      const nama = String(user.nama || username || userId);
      const role = normalizeRole(user.role);
      const idSantri = String(user.idSantri || '');
      const kelasId = String(user.kelasId || '');

      if (!username || !role) {
        skipped += 1;
        continue;
      }

      const existingOwner = seenUsernames.get(username);
      if (existingOwner && existingOwner !== userId) {
        conflicts += 1;
        continue;
      }
      seenUsernames.set(username, userId);

      const credentialRef = credentialCollection.doc(userId);
      const credentialDoc = await credentialRef.get();
      const plaintextPassword = typeof user.password === 'string' ? user.password.trim() : '';

      if (!credentialDoc.exists) {
        if (!plaintextPassword) {
          skipped += 1;
          continue;
        }

        await credentialRef.set({
          userId,
          username,
          nama,
          role,
          idSantri,
          kelasId,
          credential: hashPassword(plaintextPassword),
          createdAt: new Date().toISOString(),
          migratedFromLegacy: true
        });
        migrated += 1;
      } else {
        await credentialRef.set({
          username,
          nama,
          role,
          idSantri,
          kelasId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        alreadyMigrated += 1;
      }

      try {
        await auth.getUser(userId);
        await auth.updateUser(userId, { displayName: nama });
      } catch (error: any) {
        if (error?.code !== 'auth/user-not-found') throw error;
        await auth.createUser({ uid: userId, displayName: nama });
      }
      await auth.setCustomUserClaims(userId, { role, username, idSantri });

      await userDoc.ref.set({
        password: FieldValue.delete(),
        authUid: userId,
        credentialMigratedAt: new Date().toISOString()
      }, { merge: true });
    }

    const readyForAuthGate = skipped === 0 && conflicts === 0;
    return send(res, 200, {
      success: true,
      migrated,
      alreadyMigrated,
      skipped,
      conflicts,
      totalUsers: usersSnapshot.size,
      readyForAuthGate
    });
  } catch (error) {
    console.error('Credential migration error:', error);
    return send(res, 500, {
      success: false,
      message: 'Migrasi kredensial gagal diproses.'
    });
  }
}
