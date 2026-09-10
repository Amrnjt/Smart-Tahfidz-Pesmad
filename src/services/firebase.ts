import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

type RuntimeFirebaseConfig = FirebaseOptions & {
  firestoreDatabaseId?: string;
};

const isPreview = import.meta.env.VITE_VERCEL_ENV === 'preview';

const previewConfig: RuntimeFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID?.trim(),
};

if (isPreview) {
  const requiredPreviewConfig: Array<[string, string | undefined]> = [
    ['VITE_FIREBASE_API_KEY', previewConfig.apiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', previewConfig.authDomain],
    ['VITE_FIREBASE_PROJECT_ID', previewConfig.projectId],
    ['VITE_FIREBASE_STORAGE_BUCKET', previewConfig.storageBucket],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', previewConfig.messagingSenderId],
    ['VITE_FIREBASE_APP_ID', previewConfig.appId],
    ['VITE_FIRESTORE_DATABASE_ID', previewConfig.firestoreDatabaseId],
  ];
  const missing = requiredPreviewConfig.filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Preview Firebase client isolation is not configured: missing ${missing.join(', ')}`);
  }
}

const runtimeConfig: RuntimeFirebaseConfig = isPreview ? previewConfig : firebaseConfig;
const app = getApps().length === 0 ? initializeApp(runtimeConfig) : getApp();

export const auth = getAuth(app);

// Inisialisasi Firestore dengan database ID yang dikonfigurasi.
export const db = runtimeConfig.firestoreDatabaseId && runtimeConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, runtimeConfig.firestoreDatabaseId)
  : getFirestore(app);

export default app;
