import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { storageService } from './storageService';
import type { User } from '../types';
import { normalizeUserRole } from '../utils/roles';

interface LoginResponse {
  success?: boolean;
  token?: string;
  user?: User;
  message?: string;
}

function trustedRole(role: unknown) {
  return normalizeUserRole(role);
}

function stripCredentialFields(user: User): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function waitForFirebaseUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | undefined;
    unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        unsubscribe?.();
        resolve(firebaseUser);
      },
      (error) => {
        unsubscribe?.();
        reject(error);
      }
    );
  });
}

export const authService = {
  async signIn(
    usernameInput: string,
    passwordInput: string,
    rememberMe = true
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!username || !password) {
      return { success: false, message: 'Harap masukkan Username / ID Santri dan Password.' };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password })
      });

      const payload = (await response.json().catch(() => ({}))) as LoginResponse;
      if (!response.ok || !payload.success || !payload.token || !payload.user) {
        return {
          success: false,
          message: payload.message || 'Username / ID Santri atau Password salah.'
        };
      }

      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithCustomToken(auth, payload.token);

      const safeUser = stripCredentialFields({
        ...payload.user,
        role: normalizeUserRole(payload.user.role) || payload.user.role
      });
      storageService.setSession(safeUser);
      return { success: true, user: safeUser };
    } catch (error) {
      console.error('Secure login failed:', error);
      return {
        success: false,
        message: 'Layanan autentikasi sedang tidak dapat dijangkau. Silakan coba lagi.'
      };
    }
  },

  async restoreSession(): Promise<User | null> {
    try {
      const firebaseUser = await waitForFirebaseUser();
      if (!firebaseUser) {
        storageService.setSession(null);
        return null;
      }

      const token = await firebaseUser.getIdTokenResult();
      const cached = storageService.getSession();
      const role = trustedRole(token.claims.role);
      const username = String(token.claims.username || '').trim().toLowerCase();
      const idSantri = String(token.claims.idSantri || '').trim();

      // Never promote a Firebase identity from cached application data. Role and
      // username must be present in the signed ID token created by the server.
      if (!role || !username) {
        await firebaseSignOut(auth);
        storageService.setSession(null);
        return null;
      }

      const restored: User = stripCredentialFields({
        id: firebaseUser.uid,
        username,
        role,
        nama: firebaseUser.displayName || cached?.nama || username,
        idSantri: idSantri || undefined,
        kelasId: cached?.kelasId,
        notificationPermission: cached?.notificationPermission
      });

      storageService.setSession(restored);
      return restored;
    } catch (error) {
      console.error('Failed to restore Firebase Auth session:', error);
      storageService.setSession(null);
      return null;
    }
  },

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } finally {
      storageService.setSession(null);
    }
  }
};
