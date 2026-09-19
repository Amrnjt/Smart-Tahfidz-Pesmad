import { getAdminServices } from '../_firebaseAdmin';

const REQUIRED_ENV = [
  'FIREBASE_PROJECT_ID',
  'FIRESTORE_DATABASE_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'P0_MIGRATION_SECRET',
] as const;

function send(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { success: false, message: 'Metode tidak diizinkan.' });
  }

  if (process.env.VERCEL_ENV !== 'preview') {
    return send(res, 404, { success: false, message: 'Preview readiness hanya tersedia pada deployment preview.' });
  }

  const missingEnv = REQUIRED_ENV.filter((key) => !String(process.env[key] || '').trim());
  const migrationSecretStrong = String(process.env.P0_MIGRATION_SECRET || '').trim().length >= 24;
  const legacyLoginFallbackDisabled = process.env.P0_ALLOW_LEGACY_LOGIN_MIGRATION !== 'true';

  let adminReady = false;
  let isolatedFirebaseAdmin = false;

  if (missingEnv.length === 0 && migrationSecretStrong) {
    try {
      getAdminServices();
      adminReady = true;
      isolatedFirebaseAdmin = true;
    } catch (error) {
      console.warn('Preview Firebase Admin readiness failed:', error);
    }
  }

  const readyForPreviewDryRun =
    missingEnv.length === 0 &&
    migrationSecretStrong &&
    legacyLoginFallbackDisabled &&
    adminReady &&
    isolatedFirebaseAdmin;

  return send(res, readyForPreviewDryRun ? 200 : 503, {
    success: readyForPreviewDryRun,
    environment: 'preview',
    readyForPreviewDryRun,
    requiredEnvConfigured: missingEnv.length === 0,
    missingEnv,
    migrationSecretStrong,
    legacyLoginFallbackDisabled,
    adminReady,
    isolatedFirebaseAdmin
  });
}
