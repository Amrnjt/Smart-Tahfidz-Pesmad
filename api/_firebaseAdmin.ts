import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PRODUCTION_PROJECT_ID = 'tonal-garage-pn96h';
const PRODUCTION_DATABASE_ID = 'ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured on the server.`);
  }
  return value;
}

function getAdminConfig() {
  const projectId = requiredEnv('FIREBASE_PROJECT_ID');
  const databaseId = requiredEnv('FIRESTORE_DATABASE_ID');
  const clientEmail = requiredEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

  if (
    process.env.VERCEL_ENV === 'preview' &&
    projectId === PRODUCTION_PROJECT_ID &&
    databaseId === PRODUCTION_DATABASE_ID
  ) {
    throw new Error('Preview Firebase Admin must use an isolated Firebase project/database.');
  }

  return { projectId, databaseId, clientEmail, privateKey };
}

function getAdminApp(config: ReturnType<typeof getAdminConfig>): App {
  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    projectId: config.projectId,
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey
    })
  });
}

export function getAdminServices() {
  const config = getAdminConfig();
  const app = getAdminApp(config);

  return {
    auth: getAuth(app),
    db: getFirestore(app, config.databaseId)
  };
}
