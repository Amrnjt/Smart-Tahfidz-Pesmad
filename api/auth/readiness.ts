import { getAdminServices } from '../_firebaseAdmin.js';

type AuthRole = 'Superadmin' | 'Pimpinan' | 'Ustadz' | 'Wali' | 'Santri';

function normalizeRole(role: unknown): AuthRole | null {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'superadmin') return 'Superadmin';
  if (value === 'pimpinan') return 'Pimpinan';
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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { success: false, message: 'Metode tidak diizinkan.' });
  }

  const expectedSecret = process.env.P0_MIGRATION_SECRET;
  const suppliedSecret = String(req.headers['x-migration-secret'] || '');
  if (!expectedSecret || expectedSecret.length < 24 || suppliedSecret !== expectedSecret) {
    return send(res, 403, { success: false, message: 'Audit readiness tidak diizinkan.' });
  }

  try {
    const { auth, db } = getAdminServices();
    const usersSnapshot = await db.collection('users').get();
    const credentialsSnapshot = await db.collection('auth_credentials').get();
    const credentials = new Map(credentialsSnapshot.docs.map((item) => [item.id, item.data() as Record<string, any>]));
    const usernameOwners = new Map<string, string[]>();

    let legacyPasswordsRemaining = 0;
    let missingCredentials = 0;
    let missingAuthUsers = 0;
    let claimMismatches = 0;
    let unknownRoles = 0;

    for (const userDoc of usersSnapshot.docs) {
      const profile = userDoc.data() as Record<string, any>;
      const userId = String(profile.id || userDoc.id);
      const username = String(profile.username || '').trim().toLowerCase();
      const role = normalizeRole(profile.role);
      const idSantri = role === 'Wali' || role === 'Santri' ? String(profile.idSantri || '') : '';

      if (typeof profile.password === 'string' && profile.password.trim()) {
        legacyPasswordsRemaining += 1;
      }

      if (!role || !username) {
        unknownRoles += 1;
        continue;
      }

      const owners = usernameOwners.get(username) || [];
      owners.push(userId);
      usernameOwners.set(username, owners);

      const credential = credentials.get(userId);
      if (
        !credential ||
        !credential.credential ||
        credential.credential.algorithm !== 'scrypt' ||
        String(credential.username || '').trim().toLowerCase() !== username ||
        normalizeRole(credential.role) !== role
      ) {
        missingCredentials += 1;
      }

      try {
        const firebaseUser = await auth.getUser(userId);
        const claims = firebaseUser.customClaims || {};
        if (
          claims.role !== role ||
          String(claims.username || '').trim().toLowerCase() !== username ||
          String(claims.idSantri || '') !== idSantri
        ) {
          claimMismatches += 1;
        }
      } catch (error: any) {
        if (error?.code === 'auth/user-not-found') {
          missingAuthUsers += 1;
        } else {
          throw error;
        }
      }
    }

    const usernameConflicts = [...usernameOwners.values()].filter((owners) => owners.length > 1).length;
    const orphanCredentials = credentialsSnapshot.docs.filter(
      (item) => !usersSnapshot.docs.some((user) => String((user.data() as any).id || user.id) === item.id)
    ).length;

    const readyForCutover =
      legacyPasswordsRemaining === 0 &&
      missingCredentials === 0 &&
      missingAuthUsers === 0 &&
      claimMismatches === 0 &&
      usernameConflicts === 0 &&
      unknownRoles === 0;

    return send(res, 200, {
      success: true,
      readyForCutover,
      totalUsers: usersSnapshot.size,
      totalCredentials: credentialsSnapshot.size,
      legacyPasswordsRemaining,
      missingCredentials,
      missingAuthUsers,
      claimMismatches,
      usernameConflicts,
      unknownRoles,
      orphanCredentials,
      legacyLoginFallbackEnabled: process.env.P0_ALLOW_LEGACY_LOGIN_MIGRATION === 'true'
    });
  } catch (error) {
    console.error('Security readiness audit error:', error);
    return send(res, 500, {
      success: false,
      readyForCutover: false,
      message: 'Audit kesiapan keamanan gagal diproses.'
    });
  }
}
