import type {
  AppConfig,
  BinnadzorRecord,
  MurojaahRecord,
  PantauanLiburanRecord,
  PembelajaranRecord,
  Santri,
  User,
  ZiyadahRecord
} from '../types';
import { getLinkedSantriId, isStaffRole, normalizeUserRole } from '../utils/roles';
import { db } from './firebase';
import { storageService } from './storageService';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'tahfidz_users_db_v2',
  SANTRI: 'tahfidz_santri_db_v2',
  ZIYADAH: 'tahfidz_ziyadah_db_v2',
  MUROJAAH: 'tahfidz_murojaah_db_v2',
  BINNADZOR: 'tahfidz_binnadzor_db_v2',
  PEMBELAJARAN: 'tahfidz_pembelajaran_db_v2',
  KELAS: 'tahfidz_kelas_db_v2',
  PANTAUAN_LIBURAN: 'tahfidz_pantauan_liburan_v2',
  APP_CONFIG: 'tahfidz_app_config_v2'
} as const;

const COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  ZIYADAH: 'ziyadah',
  MUROJAAH: 'murojaah',
  BINNADZOR: 'binnadzor',
  PEMBELAJARAN: 'pembelajaran',
  PANTAUAN_LIBURAN: 'pantauan_liburan',
  APP_CONFIG: 'app_config'
} as const;

let installed = false;

function writeArrayCache<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function defaultAppConfig(): AppConfig {
  return {
    programLiburanActive: false,
    programLiburanJudul: 'Program Pantauan Liburan Santri',
    updatedAt: new Date().toISOString()
  };
}

function sanitizeNonStaffCache(): void {
  writeArrayCache(STORAGE_KEYS.USERS, []);
  writeArrayCache(STORAGE_KEYS.SANTRI, []);
  writeArrayCache(STORAGE_KEYS.ZIYADAH, []);
  writeArrayCache(STORAGE_KEYS.MUROJAAH, []);
  writeArrayCache(STORAGE_KEYS.BINNADZOR, []);
  writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, []);
  writeArrayCache(STORAGE_KEYS.KELAS, []);
  writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, []);
}

function sortByTimestamp<T extends { timestamp?: string }>(items: T[]): T[] {
  return items.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
}

function sortPantauan(items: PantauanLiburanRecord[]): PantauanLiburanRecord[] {
  return items.sort(
    (a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp)
  );
}

/**
 * P0.5 privacy/read-scope gate.
 *
 * Staff retain the existing all-data sync. Wali/Santri subscriptions are
 * constrained to their linked idSantri before data reaches LocalStorage.
 * Firestore Rules remain the security boundary; this wrapper makes the client
 * queries compatible with ownership-based Rules instead of downloading all
 * documents and filtering them only in the UI.
 */
export function installRoleScopedSync(): void {
  if (installed) return;
  installed = true;

  const originalInitRealtimeSync = storageService.initRealtimeSync.bind(storageService);
  const originalSyncWithCloud = storageService.syncWithCloud.bind(storageService);

  storageService.initRealtimeSync = (onUpdate?: () => void): (() => void) => {
    const session = storageService.getSession();
    const role = normalizeUserRole(session?.role);

    if (session && isStaffRole(role)) {
      return originalInitRealtimeSync(onUpdate);
    }

    sanitizeNonStaffCache();

    if (!session || !role) {
      onUpdate?.();
      return () => undefined;
    }

    const targetSantriId = getLinkedSantriId(session);
    if (!targetSantriId) {
      console.warn('Role-scoped sync blocked: linked idSantri is missing.');
      onUpdate?.();
      return () => undefined;
    }

    const notify = () => onUpdate?.();
    const onError = (label: string) => (error: unknown) => {
      console.warn(`${label} role-scoped sync error:`, error);
    };

    const unsubUsers = session.id
      ? onSnapshot(
          doc(db, COLLECTIONS.USERS, session.id),
          (snapshot) => {
            writeArrayCache<User>(
              STORAGE_KEYS.USERS,
              snapshot.exists() ? [{ ...(snapshot.data() as User), id: session.id }] : []
            );
            notify();
          },
          onError('Users')
        )
      : () => undefined;

    const unsubSantri = onSnapshot(
      doc(db, COLLECTIONS.SANTRI, targetSantriId),
      (snapshot) => {
        writeArrayCache<Santri>(
          STORAGE_KEYS.SANTRI,
          snapshot.exists() ? [{ ...(snapshot.data() as Santri), idSantri: targetSantriId }] : []
        );
        notify();
      },
      onError('Santri')
    );

    const scopedQuery = (collectionName: string) =>
      query(collection(db, collectionName), where('idSantri', '==', targetSantriId));

    const unsubZiyadah = onSnapshot(
      scopedQuery(COLLECTIONS.ZIYADAH),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          ...(item.data() as ZiyadahRecord),
          id: (item.data() as ZiyadahRecord).id || item.id
        }));
        writeArrayCache(STORAGE_KEYS.ZIYADAH, sortByTimestamp(records));
        notify();
      },
      onError('Ziyadah')
    );

    const unsubMurojaah = onSnapshot(
      scopedQuery(COLLECTIONS.MUROJAAH),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          ...(item.data() as MurojaahRecord),
          id: (item.data() as MurojaahRecord).id || item.id
        }));
        writeArrayCache(STORAGE_KEYS.MUROJAAH, sortByTimestamp(records));
        notify();
      },
      onError('Murojaah')
    );

    const unsubBinnadzor = onSnapshot(
      scopedQuery(COLLECTIONS.BINNADZOR),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          ...(item.data() as BinnadzorRecord),
          id: (item.data() as BinnadzorRecord).id || item.id
        }));
        writeArrayCache(STORAGE_KEYS.BINNADZOR, sortByTimestamp(records));
        notify();
      },
      onError('Binnadzor')
    );

    const unsubPembelajaran = onSnapshot(
      scopedQuery(COLLECTIONS.PEMBELAJARAN),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          ...(item.data() as PembelajaranRecord),
          id: (item.data() as PembelajaranRecord).id || item.id
        }));
        writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, sortByTimestamp(records));
        notify();
      },
      onError('Pembelajaran')
    );

    const unsubPantauan = onSnapshot(
      scopedQuery(COLLECTIONS.PANTAUAN_LIBURAN),
      (snapshot) => {
        const records = snapshot.docs.map((item) => ({
          ...(item.data() as PantauanLiburanRecord),
          id: (item.data() as PantauanLiburanRecord).id || item.id
        }));
        writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, sortPantauan(records));
        notify();
      },
      onError('Pantauan Liburan')
    );

    const unsubAppConfig = onSnapshot(
      doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'),
      (snapshot) => {
        const config = snapshot.exists() ? snapshot.data() as AppConfig : defaultAppConfig();
        localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
        notify();
      },
      onError('AppConfig')
    );

    return () => {
      unsubUsers();
      unsubSantri();
      unsubZiyadah();
      unsubMurojaah();
      unsubBinnadzor();
      unsubPembelajaran();
      unsubPantauan();
      unsubAppConfig();
    };
  };

  storageService.syncWithCloud = async (): Promise<{ success: boolean; message?: string }> => {
    const session = storageService.getSession();
    const role = normalizeUserRole(session?.role);

    if (session && isStaffRole(role)) {
      return originalSyncWithCloud();
    }

    sanitizeNonStaffCache();

    if (!session || !role) {
      return { success: false, message: 'Sesi pengguna tidak valid.' };
    }

    const targetSantriId = getLinkedSantriId(session);
    if (!targetSantriId) {
      return { success: false, message: 'Akun belum terhubung dengan ID santri.' };
    }

    try {
      const scoped = (collectionName: string) =>
        query(collection(db, collectionName), where('idSantri', '==', targetSantriId));

      const [
        userSnap,
        santriSnap,
        ziyadahSnap,
        murojaahSnap,
        binnadzorSnap,
        pembelajaranSnap,
        pantauanSnap,
        appConfigSnap
      ] = await Promise.all([
        session.id ? getDoc(doc(db, COLLECTIONS.USERS, session.id)) : Promise.resolve(null),
        getDoc(doc(db, COLLECTIONS.SANTRI, targetSantriId)),
        getDocs(scoped(COLLECTIONS.ZIYADAH)),
        getDocs(scoped(COLLECTIONS.MUROJAAH)),
        getDocs(scoped(COLLECTIONS.BINNADZOR)),
        getDocs(scoped(COLLECTIONS.PEMBELAJARAN)),
        getDocs(scoped(COLLECTIONS.PANTAUAN_LIBURAN)),
        getDoc(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'))
      ]);

      writeArrayCache<User>(
        STORAGE_KEYS.USERS,
        userSnap && userSnap.exists() ? [{ ...(userSnap.data() as User), id: session.id }] : []
      );
      writeArrayCache<Santri>(
        STORAGE_KEYS.SANTRI,
        santriSnap.exists() ? [{ ...(santriSnap.data() as Santri), idSantri: targetSantriId }] : []
      );

      const ziyadah = ziyadahSnap.docs.map((item) => ({
        ...(item.data() as ZiyadahRecord),
        id: (item.data() as ZiyadahRecord).id || item.id
      }));
      const murojaah = murojaahSnap.docs.map((item) => ({
        ...(item.data() as MurojaahRecord),
        id: (item.data() as MurojaahRecord).id || item.id
      }));
      const binnadzor = binnadzorSnap.docs.map((item) => ({
        ...(item.data() as BinnadzorRecord),
        id: (item.data() as BinnadzorRecord).id || item.id
      }));
      const pembelajaran = pembelajaranSnap.docs.map((item) => ({
        ...(item.data() as PembelajaranRecord),
        id: (item.data() as PembelajaranRecord).id || item.id
      }));
      const pantauan = pantauanSnap.docs.map((item) => ({
        ...(item.data() as PantauanLiburanRecord),
        id: (item.data() as PantauanLiburanRecord).id || item.id
      }));

      writeArrayCache(STORAGE_KEYS.ZIYADAH, sortByTimestamp(ziyadah));
      writeArrayCache(STORAGE_KEYS.MUROJAAH, sortByTimestamp(murojaah));
      writeArrayCache(STORAGE_KEYS.BINNADZOR, sortByTimestamp(binnadzor));
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, sortByTimestamp(pembelajaran));
      writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, sortPantauan(pantauan));
      writeArrayCache(STORAGE_KEYS.KELAS, []);

      const config = appConfigSnap.exists() ? appConfigSnap.data() as AppConfig : defaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));

      return { success: true };
    } catch (error) {
      console.error('Role-scoped Cloud sync failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Gagal menyinkronkan data sesuai hak akses.'
      };
    }
  };
}
