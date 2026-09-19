import type {
  AppConfig,
  BinnadzorRecord,
  Kelas,
  MurojaahRecord,
  PantauanLiburanRecord,
  PembelajaranRecord,
  Santri,
  User,
  ZiyadahRecord
} from '../types';
import {
  getLinkedSantriId,
  isWriterStaffRole,
  normalizeUserRole
} from '../utils/roles';
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
  SESSION: 'tahfidz_active_session_v2',
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
  KELAS: 'kelas',
  PANTAUAN_LIBURAN: 'pantauan_liburan',
  APP_CONFIG: 'app_config'
} as const;

let installed = false;
let realtimeRegistered = false;
let activeUnsubscribe: (() => void) | null = null;
let activeOnUpdate: (() => void) | undefined;

function writeArrayCache<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function clearDataCache(): void {
  writeArrayCache(STORAGE_KEYS.USERS, []);
  writeArrayCache(STORAGE_KEYS.SANTRI, []);
  writeArrayCache(STORAGE_KEYS.ZIYADAH, []);
  writeArrayCache(STORAGE_KEYS.MUROJAAH, []);
  writeArrayCache(STORAGE_KEYS.BINNADZOR, []);
  writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, []);
  writeArrayCache(STORAGE_KEYS.KELAS, []);
  writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, []);
}

function defaultAppConfig(): AppConfig {
  return {
    programLiburanActive: false,
    programLiburanJudul: 'Program Pantauan Liburan Santri',
    updatedAt: new Date().toISOString()
  };
}

function sortByTimestamp<T extends { timestamp?: string }>(items: T[]): T[] {
  return items.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));
}

function sortPantauan(items: PantauanLiburanRecord[]): PantauanLiburanRecord[] {
  return items.sort(
    (a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp)
  );
}

function readStrictSession(): User | null {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    const role = normalizeUserRole(parsed?.role);
    if (!parsed || !role) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

function snapshotArray<T>(snapshot: any): T[] {
  return snapshot.docs.map((item: any) => {
    const data = item.data() as Record<string, unknown>;
    return ({
      ...data,
      ...(Object.prototype.hasOwnProperty.call(data, 'id')
        ? { id: String(data.id || item.id) }
        : {})
    }) as T;
  });
}

function startPimpinanRealtimeScope(session: User, onUpdate?: () => void): () => void {
  clearDataCache();
  const normalizedRole = normalizeUserRole(session.role);
  if (normalizedRole !== 'Pimpinan') return () => undefined;

  const notify = () => onUpdate?.();
  const onError = (label: string) => (error: unknown) => {
    console.warn(`${label} Pimpinan scoped sync error:`, error);
  };

  // Pimpinan only receives its own profile, never the global users collection.
  const unsubUser = session.id
    ? onSnapshot(
        doc(db, COLLECTIONS.USERS, session.id),
        (snapshot) => {
          writeArrayCache<User>(
            STORAGE_KEYS.USERS,
            snapshot.exists() ? [{ ...(snapshot.data() as User), id: session.id }] : []
          );
          notify();
        },
        onError('User profile')
      )
    : () => undefined;

  const bindCollection = <T>(
    collectionName: string,
    storageKey: string,
    sorter: (items: T[]) => T[] = (items) => items
  ) => onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      writeArrayCache(storageKey, sorter(snapshotArray<T>(snapshot)));
      notify();
    },
    onError(collectionName)
  );

  const unsubSantri = bindCollection<Santri>(COLLECTIONS.SANTRI, STORAGE_KEYS.SANTRI);
  const unsubZiyadah = bindCollection<ZiyadahRecord>(COLLECTIONS.ZIYADAH, STORAGE_KEYS.ZIYADAH, sortByTimestamp);
  const unsubMurojaah = bindCollection<MurojaahRecord>(COLLECTIONS.MUROJAAH, STORAGE_KEYS.MUROJAAH, sortByTimestamp);
  const unsubBinnadzor = bindCollection<BinnadzorRecord>(COLLECTIONS.BINNADZOR, STORAGE_KEYS.BINNADZOR, sortByTimestamp);
  const unsubPembelajaran = bindCollection<PembelajaranRecord>(COLLECTIONS.PEMBELAJARAN, STORAGE_KEYS.PEMBELAJARAN, sortByTimestamp);
  const unsubKelas = bindCollection<Kelas>(COLLECTIONS.KELAS, STORAGE_KEYS.KELAS);
  const unsubPantauan = bindCollection<PantauanLiburanRecord>(COLLECTIONS.PANTAUAN_LIBURAN, STORAGE_KEYS.PANTAUAN_LIBURAN, sortPantauan);

  const unsubConfig = onSnapshot(
    doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'),
    (snapshot) => {
      localStorage.setItem(
        STORAGE_KEYS.APP_CONFIG,
        JSON.stringify(snapshot.exists() ? snapshot.data() as AppConfig : defaultAppConfig())
      );
      notify();
    },
    onError('AppConfig')
  );

  return () => {
    unsubUser();
    unsubSantri();
    unsubZiyadah();
    unsubMurojaah();
    unsubBinnadzor();
    unsubPembelajaran();
    unsubKelas();
    unsubPantauan();
    unsubConfig();
  };
}

function startPersonalRealtimeScope(session: User, onUpdate?: () => void): () => void {
  clearDataCache();
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

  const bindScoped = <T>(
    collectionName: string,
    storageKey: string,
    sorter: (items: T[]) => T[] = (items) => items
  ) => onSnapshot(
    scopedQuery(collectionName),
    (snapshot) => {
      writeArrayCache(storageKey, sorter(snapshotArray<T>(snapshot)));
      notify();
    },
    onError(collectionName)
  );

  const unsubZiyadah = bindScoped<ZiyadahRecord>(COLLECTIONS.ZIYADAH, STORAGE_KEYS.ZIYADAH, sortByTimestamp);
  const unsubMurojaah = bindScoped<MurojaahRecord>(COLLECTIONS.MUROJAAH, STORAGE_KEYS.MUROJAAH, sortByTimestamp);
  const unsubBinnadzor = bindScoped<BinnadzorRecord>(COLLECTIONS.BINNADZOR, STORAGE_KEYS.BINNADZOR, sortByTimestamp);
  const unsubPembelajaran = bindScoped<PembelajaranRecord>(COLLECTIONS.PEMBELAJARAN, STORAGE_KEYS.PEMBELAJARAN, sortByTimestamp);
  const unsubPantauan = bindScoped<PantauanLiburanRecord>(COLLECTIONS.PANTAUAN_LIBURAN, STORAGE_KEYS.PANTAUAN_LIBURAN, sortPantauan);

  const unsubConfig = onSnapshot(
    doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'),
    (snapshot) => {
      localStorage.setItem(
        STORAGE_KEYS.APP_CONFIG,
        JSON.stringify(snapshot.exists() ? snapshot.data() as AppConfig : defaultAppConfig())
      );
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
    unsubConfig();
  };
}

export function installRoleScopedSync(): void {
  if (installed) return;
  installed = true;

  const originalInitRealtimeSync = storageService.initRealtimeSync.bind(storageService);
  const originalSyncWithCloud = storageService.syncWithCloud.bind(storageService);
  const originalSetSession = storageService.setSession.bind(storageService);

  storageService.getSession = (): User | null => readStrictSession();

  const startRealtimeScope = (onUpdate?: () => void): (() => void) => {
    const session = storageService.getSession();
    const normalizedRole = normalizeUserRole(session?.role);

    if (session && isWriterStaffRole(normalizedRole)) {
      return originalInitRealtimeSync(onUpdate);
    }

    if (!session || !normalizedRole) {
      clearDataCache();
      onUpdate?.();
      return () => undefined;
    }

    if (normalizedRole === 'Pimpinan') {
      return startPimpinanRealtimeScope(session, onUpdate);
    }

    return startPersonalRealtimeScope(session, onUpdate);
  };

  const restartRealtimeScope = () => {
    if (!realtimeRegistered) return;
    activeUnsubscribe?.();
    activeUnsubscribe = startRealtimeScope(activeOnUpdate);
  };

  storageService.initRealtimeSync = (onUpdate?: () => void): (() => void) => {
    realtimeRegistered = true;
    activeOnUpdate = onUpdate;
    activeUnsubscribe?.();
    activeUnsubscribe = startRealtimeScope(onUpdate);

    return () => {
      realtimeRegistered = false;
      activeOnUpdate = undefined;
      activeUnsubscribe?.();
      activeUnsubscribe = null;
    };
  };

  storageService.setSession = (user: User | null): void => {
    if (!user) {
      originalSetSession(null);
    } else {
      const role = normalizeUserRole(user.role);
      originalSetSession(role ? { ...user, role } : null);
    }
    restartRealtimeScope();
  };

  storageService.syncWithCloud = async (): Promise<{ success: boolean; message?: string }> => {
    const session = storageService.getSession();
    const normalizedRole = normalizeUserRole(session?.role);

    if (session && isWriterStaffRole(normalizedRole)) {
      return originalSyncWithCloud();
    }

    if (!session || !normalizedRole) {
      clearDataCache();
      return { success: false, message: 'Sesi pengguna tidak valid.' };
    }

    try {
      if (normalizedRole === 'Pimpinan') {
        clearDataCache();
        const [
          userSnap,
          santriSnap,
          ziyadahSnap,
          murojaahSnap,
          binnadzorSnap,
          pembelajaranSnap,
          kelasSnap,
          pantauanSnap,
          appConfigSnap
        ] = await Promise.all([
          session.id ? getDoc(doc(db, COLLECTIONS.USERS, session.id)) : Promise.resolve(null),
          getDocs(collection(db, COLLECTIONS.SANTRI)),
          getDocs(collection(db, COLLECTIONS.ZIYADAH)),
          getDocs(collection(db, COLLECTIONS.MUROJAAH)),
          getDocs(collection(db, COLLECTIONS.BINNADZOR)),
          getDocs(collection(db, COLLECTIONS.PEMBELAJARAN)),
          getDocs(collection(db, COLLECTIONS.KELAS)),
          getDocs(collection(db, COLLECTIONS.PANTAUAN_LIBURAN)),
          getDoc(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'))
        ]);

        writeArrayCache<User>(
          STORAGE_KEYS.USERS,
          userSnap && userSnap.exists() ? [{ ...(userSnap.data() as User), id: session.id }] : []
        );
        writeArrayCache<Santri>(STORAGE_KEYS.SANTRI, snapshotArray<Santri>(santriSnap));
        writeArrayCache(STORAGE_KEYS.ZIYADAH, sortByTimestamp(snapshotArray<ZiyadahRecord>(ziyadahSnap)));
        writeArrayCache(STORAGE_KEYS.MUROJAAH, sortByTimestamp(snapshotArray<MurojaahRecord>(murojaahSnap)));
        writeArrayCache(STORAGE_KEYS.BINNADZOR, sortByTimestamp(snapshotArray<BinnadzorRecord>(binnadzorSnap)));
        writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, sortByTimestamp(snapshotArray<PembelajaranRecord>(pembelajaranSnap)));
        writeArrayCache<Kelas>(STORAGE_KEYS.KELAS, snapshotArray<Kelas>(kelasSnap));
        writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, sortPantauan(snapshotArray<PantauanLiburanRecord>(pantauanSnap)));
        localStorage.setItem(
          STORAGE_KEYS.APP_CONFIG,
          JSON.stringify(appConfigSnap.exists() ? appConfigSnap.data() as AppConfig : defaultAppConfig())
        );
        return { success: true };
      }

      clearDataCache();
      const targetSantriId = getLinkedSantriId(session);
      if (!targetSantriId) {
        return { success: false, message: 'Akun belum terhubung dengan ID santri.' };
      }

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
      writeArrayCache(STORAGE_KEYS.ZIYADAH, sortByTimestamp(snapshotArray<ZiyadahRecord>(ziyadahSnap)));
      writeArrayCache(STORAGE_KEYS.MUROJAAH, sortByTimestamp(snapshotArray<MurojaahRecord>(murojaahSnap)));
      writeArrayCache(STORAGE_KEYS.BINNADZOR, sortByTimestamp(snapshotArray<BinnadzorRecord>(binnadzorSnap)));
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, sortByTimestamp(snapshotArray<PembelajaranRecord>(pembelajaranSnap)));
      writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, sortPantauan(snapshotArray<PantauanLiburanRecord>(pantauanSnap)));
      writeArrayCache(STORAGE_KEYS.KELAS, []);
      localStorage.setItem(
        STORAGE_KEYS.APP_CONFIG,
        JSON.stringify(appConfigSnap.exists() ? appConfigSnap.data() as AppConfig : defaultAppConfig())
      );
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
