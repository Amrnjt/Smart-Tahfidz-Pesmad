import { auth } from './firebase';
import { storageService } from './storageService';
import type { Santri, User } from '../types';

const USER_CACHE_KEY = 'tahfidz_users_db_v2';
const MASKED_PASSWORD = '••••••••';
let installed = false;

function maskUser(user: User): User {
  const safe: User = { ...user };
  delete safe.password;
  Object.defineProperty(safe, 'password', {
    value: MASKED_PASSWORD,
    writable: false,
    enumerable: false,
    configurable: true
  });
  return safe;
}

function scrubLocalUserCache(users: User[]) {
  try {
    const safeUsers = users.map((user) => {
      const { password: _password, ...safe } = user;
      return safe;
    });
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(safeUsers));
  } catch (error) {
    console.warn('Failed to scrub local user credential cache:', error);
  }
}

async function callAccountApi<T>(payload: Record<string, unknown>): Promise<T> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('Sesi Firebase Auth tidak tersedia. Silakan login ulang.');
  }

  const idToken = await firebaseUser.getIdToken();
  const response = await fetch('/api/auth/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success !== true) {
    throw new Error(body?.message || 'Operasi akun gagal diproses oleh server.');
  }
  return body as T;
}

export function installSecureAccountBridge() {
  if (installed) return;
  installed = true;

  const originalGetUsers = storageService.getUsers.bind(storageService);
  const originalSyncWithCloud = storageService.syncWithCloud.bind(storageService);

  storageService.getUsers = () => {
    const rawUsers = originalGetUsers();
    scrubLocalUserCache(rawUsers);
    return rawUsers.map(maskUser);
  };

  storageService.addUser = async (user: User): Promise<User> => {
    const password = user.password?.trim();
    if (!password || password === MASKED_PASSWORD) {
      throw new Error('Password awal akun wajib diisi.');
    }

    const { password: _password, ...profile } = user;
    const result = await callAccountApi<{ success: true; user: User }>({
      action: 'createUser',
      user: profile,
      password
    });
    await originalSyncWithCloud();
    return maskUser(result.user);
  };

  storageService.updateUser = async (id: string, updatedData: Partial<User>): Promise<boolean> => {
    const cleanUpdate = { ...updatedData };
    const submittedPassword = cleanUpdate.password?.trim();
    delete cleanUpdate.password;

    await callAccountApi({
      action: 'updateUser',
      id,
      updatedData: cleanUpdate,
      ...(submittedPassword && submittedPassword !== MASKED_PASSWORD
        ? { password: submittedPassword }
        : {})
    });
    await originalSyncWithCloud();
    return true;
  };

  storageService.deleteUser = async (id: string): Promise<boolean> => {
    await callAccountApi({ action: 'deleteUser', id });
    const rawUsers = originalGetUsers().filter((user) => user.id !== id);
    scrubLocalUserCache(rawUsers);
    await originalSyncWithCloud();
    return true;
  };

  storageService.addSantri = async (santri: Santri, defaultPassword = '123'): Promise<Santri> => {
    const password = defaultPassword.trim();
    if (!password) throw new Error('Password awal akun santri/wali wajib diisi.');

    const result = await callAccountApi<{ success: true; santri: Santri }>({
      action: 'createSantriBundle',
      santri,
      defaultPassword: password
    });
    await originalSyncWithCloud();
    return result.santri;
  };

  storageService.deleteSantri = async (
    idSantri: string,
    deleteRelatedHistory = true
  ): Promise<boolean> => {
    await callAccountApi({
      action: 'deleteSantriBundle',
      idSantri,
      deleteRelatedHistory
    });
    await originalSyncWithCloud();
    return true;
  };
}

export { MASKED_PASSWORD };
