import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_PROJECT_ID = 'tonal-garage-pn96h';
const DEFAULT_DATABASE_ID = 'ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e';

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured on the server.');
  }

  return initializeApp({
    projectId,
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

export function getAdminServices() {
  const app = getAdminApp();
  const databaseId = process.env.FIRESTORE_DATABASE_ID || DEFAULT_DATABASE_ID;

  return {
    auth: getAuth(app),
    db: getFirestore(app, databaseId)
  };
}
