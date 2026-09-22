import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, TipeKelas, PantauanLiburanRecord, AppConfig, TrashRecord, CombinedHistoryItem } from '../types';
import { getClassGroup } from '../utils/classUtils';
import { getTodayInputFormat, getCurrentTimeInputFormat } from '../utils/dateFormatter';
import type { HistoryRangeRequest } from './historyQueryTypes';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint
} from 'firebase/firestore';

function normalizeKelas(kelas: string): string {
  return getClassGroup(kelas);
}

function normalizeTipeKelas(tipe: string): TipeKelas {
  const normalized = (tipe || '').trim();
  if (normalized.toLowerCase().includes('tahfidz') || normalized.toLowerCase().includes('tahfiz')) return 'Tahfidz';
  if (normalized.toLowerCase().includes('binnadzor')) return 'Binnadzor';
  if (normalized.toLowerCase().includes('jilid') || normalized.toLowerCase().includes('ummi')) return 'Jilid';
  if (normalized.toLowerCase().includes('istimewa')) return 'Kelas Istimewa';
  return 'Binnadzor';
}

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
  APP_CONFIG: 'tahfidz_app_config_v2',
  DELETED_RECORDS: 'tahfidz_deleted_records_v2',
  TRASH: 'tahfidz_trash_records_v2'
};

const COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  ZIYADAH: 'ziyadah',
  MUROJAAH: 'murojaah',
  BINNADZOR: 'binnadzor',
  PEMBELAJARAN: 'pembelajaran',
  KELAS: 'kelas',
  PANTAUAN_LIBURAN: 'pantauan_liburan',
  APP_CONFIG: 'app_config',
  TRASH: 'trash_records'
};

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function deduplicateById<T extends { id?: string; idSantri?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = item.id || (item as any).idSantri;
    if (key) {
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

function readArrayCache<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArrayCache<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function createDefaultAppConfig(): AppConfig {
  return {
    programLiburanActive: false,
    programLiburanJudul: 'Program Pantauan Liburan Santri',
    updatedAt: new Date().toISOString()
  };
}

export const storageService = {
  getDeletedRecordIds(): Set<string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_RECORDS);
      if (!data) return new Set();
      const parsed = JSON.parse(data);
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  },

  isDeletedRecord(id: string): boolean {
    if (!id) return false;
    return this.getDeletedRecordIds().has(id);
  },

  markRecordDeleted(id: string): void {
    if (!id) return;
    try {
      const set = this.getDeletedRecordIds();
      set.add(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_RECORDS, JSON.stringify(Array.from(set)));
    } catch (e) {
      console.error('Failed to mark record as deleted:', e);
    }
  },

  unmarkRecordDeleted(id: string): void {
    if (!id) return;
    try {
      const set = this.getDeletedRecordIds();
      if (set.has(id)) {
        set.delete(id);
        localStorage.setItem(STORAGE_KEYS.DELETED_RECORDS, JSON.stringify(Array.from(set)));
      }
    } catch (e) {
      console.error('Failed to unmark record as deleted:', e);
    }
  },

  assertCanMutate(actionName = 'Mutasi data'): void {
    const session = this.getSession();
    const role = String(session?.role || '').trim().toLowerCase();
    if (role === 'pimpinan') {
      throw new Error(`Akses ditolak: Akun dengan role Pimpinan hanya memiliki hak akses view-only (${actionName} tidak diizinkan).`);
    }
  },

  assertCanManageAccounts(): void {
    if (String(this.getSession()?.role || '').trim().toLowerCase() !== 'superadmin') {
      throw new Error('Akses ditolak: Hanya Superadmin yang dapat mengubah akun pengguna.');
    }
  },

  async authenticate(usernameInput: string, passwordInput: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Harap masukkan Username / ID Santri dan Password.' };
    }

    const localUsers = this.getUsers();
    let matched = localUsers.find(
      u => u.username && u.username.trim().toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (!matched) {
      try {
        const querySnap = await getDocs(collection(db, COLLECTIONS.USERS));
        const remoteUsers: User[] = [];
        querySnap.forEach((docSnap) => {
          const u = docSnap.data() as User;
          if (u && u.username) {
            remoteUsers.push(u);
            if (u.username.trim().toLowerCase() === cleanUser && u.password === cleanPass) {
              matched = u;
            }
          }
        });

        // Cloud is the source of truth, including the legitimate empty state.
        writeArrayCache(STORAGE_KEYS.USERS, remoteUsers);
      } catch (err) {
        console.warn('Direct Firestore authentication fallback error:', err);
      }
    }

    if (matched) {
      const r = String(matched.role || '').trim().toLowerCase();
      if (r === 'superadmin') {
        matched.role = 'Superadmin';
      } else if (r === 'pimpinan') {
        matched.role = 'Pimpinan';
      } else if (r === 'wali' || r.includes('wali')) {
        matched.role = 'Wali';
      } else if (r === 'santri') {
        matched.role = 'Santri';
      } else {
        matched.role = 'Ustadz';
      }

      this.setSession(matched);
      return { success: true, user: matched };
    }

    return {
      success: false,
      message: 'Username / ID Santri atau Password salah. Silakan periksa kembali huruf besar/kecil atau PIN Anda.'
    };
  },

  getUsers(): User[] {
    return readArrayCache<User>(STORAGE_KEYS.USERS);
  },

  getSantriList(): Santri[] {
    const raw = readArrayCache<Santri>(STORAGE_KEYS.SANTRI);
    const deduplicated = deduplicateById(raw);
    if (deduplicated.length !== raw.length) {
      writeArrayCache(STORAGE_KEYS.SANTRI, deduplicated);
    }
    return deduplicated.map((s) => ({
      ...s,
      kelas: normalizeKelas(s.kelas)
    }));
  },

  getZiyadahRecords(): ZiyadahRecord[] {
    const raw = readArrayCache<ZiyadahRecord>(STORAGE_KEYS.ZIYADAH);
    const deduplicated = deduplicateById(raw);
    if (deduplicated.length !== raw.length) {
      writeArrayCache(STORAGE_KEYS.ZIYADAH, deduplicated);
    }
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? deduplicated.filter((r) => !deletedIds.has(r.id)) : deduplicated;
  },

  getMurojaahRecords(): MurojaahRecord[] {
    const raw = readArrayCache<MurojaahRecord>(STORAGE_KEYS.MUROJAAH);
    const deduplicated = deduplicateById(raw);
    if (deduplicated.length !== raw.length) {
      writeArrayCache(STORAGE_KEYS.MUROJAAH, deduplicated);
    }
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? deduplicated.filter((r) => !deletedIds.has(r.id)) : deduplicated;
  },

  getBinnadzorRecords(): BinnadzorRecord[] {
    const raw = readArrayCache<BinnadzorRecord>(STORAGE_KEYS.BINNADZOR);
    const deduplicated = deduplicateById(raw);
    if (deduplicated.length !== raw.length) {
      writeArrayCache(STORAGE_KEYS.BINNADZOR, deduplicated);
    }
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? deduplicated.filter((r) => !deletedIds.has(r.id)) : deduplicated;
  },

  getPembelajaranRecords(): PembelajaranRecord[] {
    const raw = readArrayCache<PembelajaranRecord>(STORAGE_KEYS.PEMBELAJARAN);
    const deduplicated = deduplicateById(raw);
    if (deduplicated.length !== raw.length) {
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, deduplicated);
    }
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? deduplicated.filter((r) => !deletedIds.has(r.id)) : deduplicated;
  },

  getKelasList(): Kelas[] {
    return readArrayCache<Kelas>(STORAGE_KEYS.KELAS).map((k) => ({
      ...k,
      tipeKelas: normalizeTipeKelas(k.tipeKelas)
    }));
  },

  getAppConfig(): AppConfig {
    const data = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
    if (!data) {
      const defaultConfig = createDefaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    try {
      const parsed = JSON.parse(data);
      return parsed && typeof parsed.programLiburanActive === 'boolean'
        ? parsed
        : createDefaultAppConfig();
    } catch {
      return createDefaultAppConfig();
    }
  },

  getPantauanLiburanRecords(): PantauanLiburanRecord[] {
    return readArrayCache<PantauanLiburanRecord>(STORAGE_KEYS.PANTAUAN_LIBURAN);
  },

  subscribeMasterData(onUpdate?: () => void): () => void {
    const notifyUpdate = () => {
      if (onUpdate) onUpdate();
    };

    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      const users: User[] = [];
      const userMap = new Map<string, User>();
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as User;
        if (u && u.id && !userMap.has(u.id)) {
          userMap.set(u.id, u);
          users.push(u);
        }
      });
      writeArrayCache(STORAGE_KEYS.USERS, users);
      notifyUpdate();
    }, (err) => console.warn('Users firestore sync error:', err));

    const unsubSantri = onSnapshot(collection(db, COLLECTIONS.SANTRI), (snapshot) => {
      const santri: Santri[] = [];
      const santriMap = new Map<string, Santri>();
      snapshot.forEach((docSnap) => {
        const s = docSnap.data() as Santri;
        if (s && s.idSantri && !santriMap.has(s.idSantri)) {
          const normalizedS = { ...s, kelas: normalizeKelas(s.kelas) };
          santriMap.set(s.idSantri, normalizedS);
          santri.push(normalizedS);
        }
      });
      writeArrayCache(STORAGE_KEYS.SANTRI, santri);
      notifyUpdate();
    }, (err) => console.warn('Santri firestore sync error:', err));

    const unsubKelas = onSnapshot(collection(db, COLLECTIONS.KELAS), (snapshot) => {
      const kelasList: Kelas[] = [];
      const kelasMap = new Map<string, Kelas>();
      snapshot.forEach((docSnap) => {
        const k = docSnap.data() as Kelas;
        if (k && k.id && !kelasMap.has(k.id)) {
          const normalizedK = { ...k, tipeKelas: normalizeTipeKelas(k.tipeKelas) };
          kelasMap.set(k.id, normalizedK);
          kelasList.push(normalizedK);
        }
      });
      writeArrayCache(STORAGE_KEYS.KELAS, kelasList);
      notifyUpdate();
    }, (err) => console.warn('Kelas firestore sync error:', err));

    const unsubAppConfig = onSnapshot(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), (docSnap) => {
      const config = docSnap.exists() ? docSnap.data() as AppConfig : createDefaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
      notifyUpdate();
    }, (err) => console.warn('AppConfig firestore sync error:', err));

    const unsubPantauanLiburan = onSnapshot(collection(db, COLLECTIONS.PANTAUAN_LIBURAN), (snapshot) => {
      const records: PantauanLiburanRecord[] = [];
      const recordMap = new Map<string, PantauanLiburanRecord>();
      snapshot.forEach((docSnap) => {
        const record = docSnap.data() as PantauanLiburanRecord;
        if (record && record.id && !recordMap.has(record.id)) {
          recordMap.set(record.id, record);
          records.push(record);
        }
      });
      records.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp));
      writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, records);
      notifyUpdate();
    }, (err) => console.warn('Pantauan Liburan firestore sync error:', err));

    return () => {
      unsubUsers();
      unsubSantri();
      unsubKelas();
      unsubAppConfig();
      unsubPantauanLiburan();
    };
  },

  subscribeRecentSetoran(request: HistoryRangeRequest, onUpdate?: () => void): () => void {
    if (request.scope.kind === 'student' && !request.scope.idSantri.trim()) {
      console.warn('Recent setoran subscription skipped because idSantri is empty.');
      return () => undefined;
    }

    // Discard legacy all-time cache before the bounded listeners repopulate it.
    writeArrayCache(STORAGE_KEYS.ZIYADAH, []);
    writeArrayCache(STORAGE_KEYS.MUROJAAH, []);
    writeArrayCache(STORAGE_KEYS.BINNADZOR, []);
    writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, []);

    const buildConstraints = (): QueryConstraint[] => {
      const constraints: QueryConstraint[] = [];
      if (request.scope.kind === 'student') {
        constraints.push(where('idSantri', '==', request.scope.idSantri));
      }
      constraints.push(
        where('timestamp', '>=', `${request.startDate} 00:00`),
        where('timestamp', '<=', `${request.endDate} 23:59:59`),
        orderBy('timestamp', 'desc'),
      );
      return constraints;
    };

    const notifyUpdate = () => {
      if (onUpdate) onUpdate();
    };

    const unsubZiyadah = onSnapshot(
      query(collection(db, COLLECTIONS.ZIYADAH), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as ZiyadahRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !this.isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.ZIYADAH, records);
        notifyUpdate();
      },
      (err) => console.warn('Bounded Ziyadah sync error:', err),
    );

    const unsubMurojaah = onSnapshot(
      query(collection(db, COLLECTIONS.MUROJAAH), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as MurojaahRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !this.isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.MUROJAAH, records);
        notifyUpdate();
      },
      (err) => console.warn('Bounded Murojaah sync error:', err),
    );

    const unsubBinnadzor = onSnapshot(
      query(collection(db, COLLECTIONS.BINNADZOR), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as BinnadzorRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !this.isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.BINNADZOR, records);
        notifyUpdate();
      },
      (err) => console.warn('Bounded Binnadzor sync error:', err),
    );

    const unsubPembelajaran = onSnapshot(
      query(collection(db, COLLECTIONS.PEMBELAJARAN), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as PembelajaranRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !this.isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records);
        notifyUpdate();
      },
      (err) => console.warn('Bounded Pembelajaran sync error:', err),
    );

    return () => {
      unsubZiyadah();
      unsubMurojaah();
      unsubBinnadzor();
      unsubPembelajaran();
    };
  },

  // Cloud Firestore is the single source of truth. This function never seeds
  // demo/sample data or re-uploads stale local cache when Cloud is empty.
  initRealtimeSync(onUpdate?: () => void): () => void {
    const notifyUpdate = () => {
      if (onUpdate) onUpdate();
    };

    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      const users: User[] = [];
      const userMap = new Map<string, User>();
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as User;
        if (u && u.id && !userMap.has(u.id)) {
          userMap.set(u.id, u);
          users.push(u);
        }
      });
      writeArrayCache(STORAGE_KEYS.USERS, users);
      notifyUpdate();
    }, (err) => {
      console.warn('Users firestore sync error:', err);
    });

    const unsubSantri = onSnapshot(collection(db, COLLECTIONS.SANTRI), (snapshot) => {
      const santri: Santri[] = [];
      const santriMap = new Map<string, Santri>();
      snapshot.forEach((docSnap) => {
        const s = docSnap.data() as Santri;
        if (s && s.idSantri && !santriMap.has(s.idSantri)) {
          const normalizedS = { ...s, kelas: normalizeKelas(s.kelas) };
          santriMap.set(s.idSantri, normalizedS);
          santri.push(normalizedS);
        }
      });
      writeArrayCache(STORAGE_KEYS.SANTRI, santri);
      notifyUpdate();
    }, (err) => {
      console.warn('Santri firestore sync error:', err);
    });

    const unsubZiyadah = onSnapshot(collection(db, COLLECTIONS.ZIYADAH), (snapshot) => {
      const records: ZiyadahRecord[] = [];
      const recordMap = new Map<string, ZiyadahRecord>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ZiyadahRecord;
        const id = data.id || docSnap.id;
        if (id && !recordMap.has(id) && !this.isDeletedRecord(id)) {
          const r = { ...data, id };
          recordMap.set(id, r);
          records.push(r);
        }
      });
      records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.ZIYADAH, records);
      notifyUpdate();
    }, (err) => {
      console.warn('Ziyadah firestore sync error:', err);
    });

    const unsubMurojaah = onSnapshot(collection(db, COLLECTIONS.MUROJAAH), (snapshot) => {
      const records: MurojaahRecord[] = [];
      const recordMap = new Map<string, MurojaahRecord>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MurojaahRecord;
        const id = data.id || docSnap.id;
        if (id && !recordMap.has(id) && !this.isDeletedRecord(id)) {
          const r = { ...data, id };
          recordMap.set(id, r);
          records.push(r);
        }
      });
      records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.MUROJAAH, records);
      notifyUpdate();
    }, (err) => {
      console.warn('Murojaah firestore sync error:', err);
    });

    const unsubKelas = onSnapshot(collection(db, COLLECTIONS.KELAS), (snapshot) => {
      const kelasList: Kelas[] = [];
      const kelasMap = new Map<string, Kelas>();
      snapshot.forEach((docSnap) => {
        const k = docSnap.data() as Kelas;
        if (k && k.id && !kelasMap.has(k.id)) {
          const normalizedK = { ...k, tipeKelas: normalizeTipeKelas(k.tipeKelas) };
          kelasMap.set(k.id, normalizedK);
          kelasList.push(normalizedK);
        }
      });
      writeArrayCache(STORAGE_KEYS.KELAS, kelasList);
      notifyUpdate();
    }, (err) => {
      console.warn('Kelas firestore sync error:', err);
    });

    const unsubBinnadzor = onSnapshot(collection(db, COLLECTIONS.BINNADZOR), (snapshot) => {
      const records: BinnadzorRecord[] = [];
      const recordMap = new Map<string, BinnadzorRecord>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as BinnadzorRecord;
        const id = data.id || docSnap.id;
        if (id && !recordMap.has(id) && !this.isDeletedRecord(id)) {
          const r = { ...data, id };
          recordMap.set(id, r);
          records.push(r);
        }
      });
      records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.BINNADZOR, records);
      notifyUpdate();
    }, (err) => {
      console.warn('Binnadzor firestore sync error:', err);
    });

    const unsubPembelajaran = onSnapshot(collection(db, COLLECTIONS.PEMBELAJARAN), (snapshot) => {
      const records: PembelajaranRecord[] = [];
      const recordMap = new Map<string, PembelajaranRecord>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PembelajaranRecord;
        const id = data.id || docSnap.id;
        if (id && !recordMap.has(id) && !this.isDeletedRecord(id)) {
          const r = { ...data, id };
          recordMap.set(id, r);
          records.push(r);
        }
      });
      records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records);
      notifyUpdate();
    }, (err) => {
      console.warn('Pembelajaran firestore sync error:', err);
    });

    const unsubAppConfig = onSnapshot(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), (docSnap) => {
      const config = docSnap.exists() ? docSnap.data() as AppConfig : createDefaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
      notifyUpdate();
    }, (err) => {
      console.warn('AppConfig firestore sync error:', err);
    });

    const unsubPantauanLiburan = onSnapshot(collection(db, COLLECTIONS.PANTAUAN_LIBURAN), (snapshot) => {
      const records: PantauanLiburanRecord[] = [];
      const recordMap = new Map<string, PantauanLiburanRecord>();
      snapshot.forEach((docSnap) => {
        const r = docSnap.data() as PantauanLiburanRecord;
        if (r && r.id && !recordMap.has(r.id)) {
          recordMap.set(r.id, r);
          records.push(r);
        }
      });
      records.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp));
      writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, records);
      notifyUpdate();
    }, (err) => {
      console.warn('Pantauan Liburan firestore sync error:', err);
    });

    return () => {
      unsubUsers();
      unsubSantri();
      unsubZiyadah();
      unsubMurojaah();
      unsubKelas();
      unsubBinnadzor();
      unsubPembelajaran();
      unsubAppConfig();
      unsubPantauanLiburan();
    };
  },

  async saveZiyadah(record: Omit<ZiyadahRecord, 'id'> & { timestamp?: string }): Promise<ZiyadahRecord> {
    this.assertCanMutate('Tambah setoran ziyadah');
    const records = this.getZiyadahRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);

    let timestamp = record.timestamp;
    if (!timestamp) {
      timestamp = `${getTodayInputFormat()} ${getCurrentTimeInputFormat()}`;
    }
    const uniqueId = `ZYD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: ZiyadahRecord = {
      ...record,
      id: uniqueId,
      timestamp,
      namaSantri: santri?.namaSantri || record.idSantri
    };

    const nextRecords = records.filter(r => r.id !== newRecord.id);
    nextRecords.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.ZIYADAH, nextRecords);

    try {
      await setDoc(doc(db, COLLECTIONS.ZIYADAH, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Ziyadah to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async saveMurojaah(record: Omit<MurojaahRecord, 'id'> & { timestamp?: string }): Promise<MurojaahRecord> {
    this.assertCanMutate('Tambah setoran murojaah');
    const records = this.getMurojaahRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);

    let timestamp = record.timestamp;
    if (!timestamp) {
      timestamp = `${getTodayInputFormat()} ${getCurrentTimeInputFormat()}`;
    }
    const uniqueId = `MRJ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: MurojaahRecord = {
      ...record,
      id: uniqueId,
      timestamp,
      namaSantri: santri?.namaSantri || record.idSantri
    };

    const nextRecords = records.filter(r => r.id !== newRecord.id);
    nextRecords.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.MUROJAAH, nextRecords);

    try {
      await setDoc(doc(db, COLLECTIONS.MUROJAAH, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Murojaah to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async saveBinnadzor(record: Omit<BinnadzorRecord, 'id'> & { timestamp?: string }): Promise<BinnadzorRecord> {
    this.assertCanMutate('Tambah setoran binnadzor');
    const records = this.getBinnadzorRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);

    let timestamp = record.timestamp;
    if (!timestamp) {
      timestamp = `${getTodayInputFormat()} ${getCurrentTimeInputFormat()}`;
    }
    const uniqueId = `BND-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: BinnadzorRecord = {
      ...record,
      id: uniqueId,
      timestamp,
      namaSantri: santri?.namaSantri || record.idSantri
    };

    const nextRecords = records.filter(r => r.id !== newRecord.id);
    nextRecords.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.BINNADZOR, nextRecords);

    try {
      await setDoc(doc(db, COLLECTIONS.BINNADZOR, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Binnadzor to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async savePembelajaran(record: Omit<PembelajaranRecord, 'id'> & { timestamp?: string }): Promise<PembelajaranRecord> {
    this.assertCanMutate('Tambah rekaman pembelajaran');
    const records = this.getPembelajaranRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);

    let timestamp = record.timestamp;
    if (!timestamp) {
      timestamp = `${getTodayInputFormat()} ${getCurrentTimeInputFormat()}`;
    }
    const uniqueId = `PBL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: PembelajaranRecord = {
      ...record,
      id: uniqueId,
      timestamp,
      namaSantri: santri?.namaSantri || record.idSantri
    };

    const nextRecords = records.filter(r => r.id !== newRecord.id);
    nextRecords.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, nextRecords);

    try {
      await setDoc(doc(db, COLLECTIONS.PEMBELAJARAN, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Pembelajaran to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  getTrashRecords(): TrashRecord[] {
    return readArrayCache<TrashRecord>(STORAGE_KEYS.TRASH);
  },

  async purgeExpiredTrash(): Promise<number> {
    try {
      const nowIso = new Date().toISOString();
      const trashSnap = await getDocs(collection(db, COLLECTIONS.TRASH));
      const expiredDocIds: string[] = [];
      const validTrash: TrashRecord[] = [];

      trashSnap.forEach(docSnap => {
        const data = docSnap.data() as TrashRecord;
        const id = data.id || docSnap.id;
        if (data.expiresAt && data.expiresAt <= nowIso) {
          expiredDocIds.push(id);
        } else {
          validTrash.push({ ...data, id });
        }
      });

      if (expiredDocIds.length > 0) {
        for (let i = 0; i < expiredDocIds.length; i += 450) {
          const chunk = expiredDocIds.slice(i, i + 450);
          const batch = writeBatch(db);
          chunk.forEach(docId => {
            batch.delete(doc(db, COLLECTIONS.TRASH, docId));
          });
          await batch.commit();
        }
      }

      validTrash.sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''));
      writeArrayCache(STORAGE_KEYS.TRASH, validTrash);
      return expiredDocIds.length;
    } catch (e) {
      console.error('Failed to purge expired trash:', e);
      return 0;
    }
  },

  async fetchTrashRecords(): Promise<TrashRecord[]> {
    try {
      await this.purgeExpiredTrash();
      const snap = await getDocs(collection(db, COLLECTIONS.TRASH));
      const list: TrashRecord[] = [];
      const nowIso = new Date().toISOString();
      snap.forEach(docSnap => {
        const data = docSnap.data() as TrashRecord;
        const id = data.id || docSnap.id;
        if (!data.expiresAt || data.expiresAt > nowIso) {
          list.push({ ...data, id });
        }
      });
      list.sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || ''));
      writeArrayCache(STORAGE_KEYS.TRASH, list);
      return list;
    } catch (e) {
      console.error('Failed to fetch trash records:', e);
      return this.getTrashRecords();
    }
  },

  async deleteRecord(
    type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran',
    id: string,
    deletedBy?: string
  ): Promise<boolean> {
    this.assertCanMutate('Hapus riwayat setoran');
    if (!id) return false;

    const sourceCollection = type === 'Ziyadah' ? COLLECTIONS.ZIYADAH
      : type === 'Murojaah' ? COLLECTIONS.MUROJAAH
      : type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN
      : COLLECTIONS.BINNADZOR;

    let existingRecord: any = null;
    if (type === 'Ziyadah') {
      existingRecord = this.getZiyadahRecords().find(r => r.id === id);
    } else if (type === 'Murojaah') {
      existingRecord = this.getMurojaahRecords().find(r => r.id === id);
    } else if (type === 'Pembelajaran') {
      existingRecord = this.getPembelajaranRecords().find(r => r.id === id);
    } else {
      existingRecord = this.getBinnadzorRecords().find(r => r.id === id);
    }

    if (!existingRecord) {
      try {
        const snap = await getDoc(doc(db, sourceCollection, id));
        if (snap.exists()) {
          existingRecord = { ...snap.data(), id: snap.id };
        }
      } catch (e) {
        console.warn('Could not retrieve record from Firestore before soft delete:', e);
      }
    }

    if (!existingRecord) {
      existingRecord = { id };
    }

    const now = new Date();
    const deletedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const trashDocId = `trash_${id}`;
    const author = deletedBy || this.getSession()?.name || this.getSession()?.username || 'Ustadz / Admin';

    const trashItem: TrashRecord = {
      id: trashDocId,
      recordId: id,
      recordType: type,
      sourceCollection,
      payload: existingRecord,
      deletedAt,
      deletedBy: author,
      expiresAt,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.TRASH, trashDocId), cleanForFirestore(trashItem));
    batch.delete(doc(db, sourceCollection, id));
    await batch.commit();

    this.markRecordDeleted(id);

    if (type === 'Ziyadah') {
      writeArrayCache(STORAGE_KEYS.ZIYADAH, this.getZiyadahRecords().filter(r => r.id !== id));
    } else if (type === 'Murojaah') {
      writeArrayCache(STORAGE_KEYS.MUROJAAH, this.getMurojaahRecords().filter(r => r.id !== id));
    } else if (type === 'Pembelajaran') {
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, this.getPembelajaranRecords().filter(r => r.id !== id));
    } else {
      writeArrayCache(STORAGE_KEYS.BINNADZOR, this.getBinnadzorRecords().filter(r => r.id !== id));
    }

    const currentTrash = this.getTrashRecords().filter(t => t.recordId !== id && t.id !== trashDocId);
    currentTrash.unshift(trashItem);
    writeArrayCache(STORAGE_KEYS.TRASH, currentTrash);

    return true;
  },

  async deleteRecordsBatch(
    items: { type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran'; id: string }[],
    deletedBy?: string
  ): Promise<boolean> {
    this.assertCanMutate('Hapus masal riwayat setoran');
    if (!items || items.length === 0) return true;

    const now = new Date();
    const deletedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const author = deletedBy || this.getSession()?.name || this.getSession()?.username || 'Ustadz / Admin';

    const ziyadahCache = this.getZiyadahRecords();
    const murojaahCache = this.getMurojaahRecords();
    const binnadzorCache = this.getBinnadzorRecords();
    const pembelajaranCache = this.getPembelajaranRecords();

    const getSourceCollection = (type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran') =>
      type === 'Ziyadah' ? COLLECTIONS.ZIYADAH
        : type === 'Murojaah' ? COLLECTIONS.MUROJAAH
        : type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN
        : COLLECTIONS.BINNADZOR;

    const getCachedRecord = (item: { type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran'; id: string }) => {
      if (item.type === 'Ziyadah') return ziyadahCache.find(r => r.id === item.id);
      if (item.type === 'Murojaah') return murojaahCache.find(r => r.id === item.id);
      if (item.type === 'Pembelajaran') return pembelajaranCache.find(r => r.id === item.id);
      return binnadzorCache.find(r => r.id === item.id);
    };

    // Historical rows may live outside the 12-month dashboard cache. Resolve any
    // missing payload directly from Firestore before moving it to Trash.
    const resolved = await Promise.all(items.map(async item => {
      const sourceCollection = getSourceCollection(item.type);
      let payload: any = getCachedRecord(item);
      if (!payload) {
        const snap = await getDoc(doc(db, sourceCollection, item.id));
        payload = snap.exists() ? { ...snap.data(), id: snap.id } : { id: item.id };
      }
      return { item, sourceCollection, payload };
    }));

    const trashItems: TrashRecord[] = resolved.map(({ item, sourceCollection, payload }) => ({
      id: `trash_${item.id}`,
      recordId: item.id,
      recordType: item.type,
      sourceCollection,
      payload,
      deletedAt,
      deletedBy: author,
      expiresAt,
    }));

    // Each item uses two writes (Trash set + source delete). 225 items keeps each
    // Firestore batch comfortably below the 500-operation limit.
    for (let index = 0; index < resolved.length; index += 225) {
      const batch = writeBatch(db);
      resolved.slice(index, index + 225).forEach(({ item, sourceCollection }, chunkIndex) => {
        const trashItem = trashItems[index + chunkIndex];
        batch.set(doc(db, COLLECTIONS.TRASH, trashItem.id), cleanForFirestore(trashItem));
        batch.delete(doc(db, sourceCollection, item.id));
      });
      await batch.commit();
    }

    items.forEach(item => {
      if (item.id) this.markRecordDeleted(item.id);
    });

    const ziyadahIds = new Set(items.filter(i => i.type === 'Ziyadah').map(i => i.id));
    const murojaahIds = new Set(items.filter(i => i.type === 'Murojaah').map(i => i.id));
    const binnadzorIds = new Set(items.filter(i => i.type === 'Binnadzor').map(i => i.id));
    const pembelajaranIds = new Set(items.filter(i => i.type === 'Pembelajaran').map(i => i.id));

    if (ziyadahIds.size > 0) writeArrayCache(STORAGE_KEYS.ZIYADAH, ziyadahCache.filter(r => !ziyadahIds.has(r.id)));
    if (murojaahIds.size > 0) writeArrayCache(STORAGE_KEYS.MUROJAAH, murojaahCache.filter(r => !murojaahIds.has(r.id)));
    if (binnadzorIds.size > 0) writeArrayCache(STORAGE_KEYS.BINNADZOR, binnadzorCache.filter(r => !binnadzorIds.has(r.id)));
    if (pembelajaranIds.size > 0) writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, pembelajaranCache.filter(r => !pembelajaranIds.has(r.id)));

    const deletedIds = new Set(items.map(i => i.id));
    const currentTrash = this.getTrashRecords().filter(t => !deletedIds.has(t.recordId));
    writeArrayCache(STORAGE_KEYS.TRASH, [...trashItems, ...currentTrash]);

    return true;
  },

  async restoreTrashRecord(trashId: string): Promise<{ success: boolean; message?: string; record?: any }> {
    this.assertCanMutate('Pulihkan data dari sampah');
    try {
      let trashItem = this.getTrashRecords().find(t => t.id === trashId || t.recordId === trashId);
      if (!trashItem) {
        const snap = await getDoc(doc(db, COLLECTIONS.TRASH, trashId));
        if (snap.exists()) {
          trashItem = { ...snap.data(), id: snap.id } as TrashRecord;
        }
      }

      if (!trashItem) {
        return { success: false, message: 'Data di Tempat Sampah tidak ditemukan.' };
      }

      const originalId = trashItem.recordId;
      const targetCollection = trashItem.sourceCollection;

      // Check Firestore directly because bounded operational caches may not contain
      // historical records outside the active dashboard window.
      const activeSnap = await getDoc(doc(db, targetCollection, originalId));
      if (activeSnap.exists()) {
        return {
          success: false,
          message: `Record aktif dengan ID '${originalId}' sudah ada dalam sistem. Pemulihan dibatalkan agar tidak menimpa data aktif.`
        };
      }

      const payloadToRestore = {
        ...trashItem.payload,
        id: originalId
      };

      const batch = writeBatch(db);
      batch.set(doc(db, targetCollection, originalId), cleanForFirestore(payloadToRestore));
      batch.delete(doc(db, COLLECTIONS.TRASH, trashItem.id));
      await batch.commit();

      this.unmarkRecordDeleted(originalId);

      // The bounded realtime listener owns operational setoran caches. Do not
      // inject an old restored record into the dashboard window here; History
      // will retrieve it through its scoped query after refresh.
      const updatedTrash = this.getTrashRecords().filter(t => t.id !== trashItem?.id && t.recordId !== originalId);
      writeArrayCache(STORAGE_KEYS.TRASH, updatedTrash);

      return { success: true, record: payloadToRestore };
    } catch (e) {
      console.error('Failed to restore record:', e);
      return { success: false, message: (e as Error).message || 'Gagal memulihkan data' };
    }
  },

  async permanentlyDeleteTrashRecord(trashId: string): Promise<boolean> {
    this.assertCanMutate('Hapus permanen data sampah');
    try {
      const trashItem = this.getTrashRecords().find(t => t.id === trashId);
      await deleteDoc(doc(db, COLLECTIONS.TRASH, trashId));
      if (trashItem?.recordId) {
        this.markRecordDeleted(trashItem.recordId);
      }
      const updated = this.getTrashRecords().filter(t => t.id !== trashId);
      writeArrayCache(STORAGE_KEYS.TRASH, updated);
      return true;
    } catch (e) {
      console.error('Failed to permanently delete trash record:', e);
      return false;
    }
  },

  async emptyTrash(): Promise<boolean> {
    this.assertCanMutate('Kosongkan tempat sampah');
    try {
      const trashList = await this.fetchTrashRecords();
      if (trashList.length === 0) return true;

      for (let i = 0; i < trashList.length; i += 450) {
        const chunk = trashList.slice(i, i + 450);
        const batch = writeBatch(db);
        chunk.forEach(t => {
          batch.delete(doc(db, COLLECTIONS.TRASH, t.id));
          if (t.recordId) this.markRecordDeleted(t.recordId);
        });
        await batch.commit();
      }

      writeArrayCache(STORAGE_KEYS.TRASH, []);
      return true;
    } catch (e) {
      console.error('Failed to empty trash:', e);
      return false;
    }
  },

  async syncWithCloud(): Promise<{ success: boolean; message?: string }> {
    this.assertCanMutate('Sinkronisasi manual cloud');
    try {
      const [userSnap, santriSnap, kelasSnap, appConfigSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.USERS)),
        getDocs(collection(db, COLLECTIONS.SANTRI)),
        getDocs(collection(db, COLLECTIONS.KELAS)),
        getDoc(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings')),
      ]);

      const users: User[] = [];
      const userMap = new Map<string, User>();
      userSnap.forEach((docSnap) => {
        const user = docSnap.data() as User;
        if (user && user.id && !userMap.has(user.id)) {
          userMap.set(user.id, user);
          users.push(user);
        }
      });
      writeArrayCache(STORAGE_KEYS.USERS, users);

      const santriList: Santri[] = [];
      const santriMap = new Map<string, Santri>();
      santriSnap.forEach((docSnap) => {
        const santri = docSnap.data() as Santri;
        if (santri && santri.idSantri && !santriMap.has(santri.idSantri)) {
          const normalized = { ...santri, kelas: normalizeKelas(santri.kelas) };
          santriMap.set(santri.idSantri, normalized);
          santriList.push(normalized);
        }
      });
      writeArrayCache(STORAGE_KEYS.SANTRI, santriList);

      const kelasList: Kelas[] = [];
      const kelasMap = new Map<string, Kelas>();
      kelasSnap.forEach((docSnap) => {
        const kelas = docSnap.data() as Kelas;
        if (kelas && kelas.id && !kelasMap.has(kelas.id)) {
          const normalized = { ...kelas, tipeKelas: normalizeTipeKelas(kelas.tipeKelas) };
          kelasMap.set(kelas.id, normalized);
          kelasList.push(normalized);
        }
      });
      writeArrayCache(STORAGE_KEYS.KELAS, kelasList);

      const config = appConfigSnap.exists() ? appConfigSnap.data() as AppConfig : createDefaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));

      return { success: true };
    } catch (err) {
      console.error('syncWithCloud error:', err);
      return { success: false, message: (err as Error).message };
    }
  },

  async fetchRecordsForDateRange(startDate: string, endDate: string): Promise<CombinedHistoryItem[]> {
    const deletedIds = this.getDeletedRecordIds();
    const results: CombinedHistoryItem[] = [];
    const seen = new Set<string>();

    const startBound = `${startDate} 00:00`;
    const endBound = `${endDate} 23:59:59`;

    try {
      // 1. Ziyadah
      const ziyadahQ = query(
        collection(db, COLLECTIONS.ZIYADAH),
        where('timestamp', '>=', startBound),
        where('timestamp', '<=', endBound),
        orderBy('timestamp', 'desc')
      );
      const ziyadahSnap = await getDocs(ziyadahQ);
      ziyadahSnap.forEach(docSnap => {
        const d = docSnap.data() as ZiyadahRecord;
        const id = d.id || docSnap.id;
        if (id && !deletedIds.has(id) && !seen.has(id)) {
          seen.add(id);
          results.push({
            id,
            type: 'Ziyadah',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: `${d.surah} • ayat ${d.ayatAwal}-${d.ayatAkhir}`,
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            surah: d.surah,
            ayatAwal: d.ayatAwal,
            ayatAkhir: d.ayatAkhir
          });
        }
      });

      // 2. Murojaah
      const murojaahQ = query(
        collection(db, COLLECTIONS.MUROJAAH),
        where('timestamp', '>=', startBound),
        where('timestamp', '<=', endBound),
        orderBy('timestamp', 'desc')
      );
      const murojaahSnap = await getDocs(murojaahQ);
      murojaahSnap.forEach(docSnap => {
        const d = docSnap.data() as MurojaahRecord;
        const id = d.id || docSnap.id;
        if (id && !deletedIds.has(id) && !seen.has(id)) {
          seen.add(id);
          results.push({
            id,
            type: 'Murojaah',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: d.surahAtauJuz,
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            surahAtauJuz: d.surahAtauJuz
          });
        }
      });

      // 3. Binnadzor
      const binnadzorQ = query(
        collection(db, COLLECTIONS.BINNADZOR),
        where('timestamp', '>=', startBound),
        where('timestamp', '<=', endBound),
        orderBy('timestamp', 'desc')
      );
      const binnadzorSnap = await getDocs(binnadzorQ);
      binnadzorSnap.forEach(docSnap => {
        const d = docSnap.data() as BinnadzorRecord;
        const id = d.id || docSnap.id;
        if (id && !deletedIds.has(id) && !seen.has(id)) {
          seen.add(id);
          results.push({
            id,
            type: 'Binnadzor',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: d.surahAtauHalaman || d.materi || 'Tilawah',
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            surahAtauJuz: d.surahAtauHalaman,
            hukumTajwid: d.hukumTajwid,
            makhrojHuruf: d.makhrojHuruf,
            kefasihan: d.kefasihan,
            kelancaran: d.kelancaran
          });
        }
      });

      // 4. Pembelajaran
      const pembelajaranQ = query(
        collection(db, COLLECTIONS.PEMBELAJARAN),
        where('timestamp', '>=', startBound),
        where('timestamp', '<=', endBound),
        orderBy('timestamp', 'desc')
      );
      const pembelajaranSnap = await getDocs(pembelajaranQ);
      pembelajaranSnap.forEach(docSnap => {
        const d = docSnap.data() as PembelajaranRecord;
        const id = d.id || docSnap.id;
        if (id && !deletedIds.has(id) && !seen.has(id)) {
          seen.add(id);
          results.push({
            id,
            type: 'Pembelajaran',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: d.materi || (d.jilid ? `${d.jilid} Hal ${d.halaman}` : 'Materi Pembelajaran'),
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            tipeKelas: d.tipeKelas,
            statusKenaikan: d.statusKenaikan,
            kendalaSantri: d.kendalaSantri,
            rekomendasiTindakLanjut: d.rekomendasiTindakLanjut
          });
        }
      });
    } catch (err) {
      console.warn('Firestore range query failed, falling back to local cache:', err);
      const inRange = (ts: string) => {
        if (!ts) return false;
        const datePart = ts.slice(0, 10);
        return datePart >= startDate && datePart <= endDate;
      };

      this.getZiyadahRecords().filter(r => inRange(r.timestamp)).forEach(d => {
        if (!deletedIds.has(d.id) && !seen.has(d.id)) {
          seen.add(d.id);
          results.push({
            id: d.id,
            type: 'Ziyadah',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: `${d.surah} • ayat ${d.ayatAwal}-${d.ayatAkhir}`,
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            surah: d.surah,
            ayatAwal: d.ayatAwal,
            ayatAkhir: d.ayatAkhir
          });
        }
      });

      this.getMurojaahRecords().filter(r => inRange(r.timestamp)).forEach(d => {
        if (!deletedIds.has(d.id) && !seen.has(d.id)) {
          seen.add(d.id);
          results.push({
            id: d.id,
            type: 'Murojaah',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: d.surahAtauJuz,
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            surahAtauJuz: d.surahAtauJuz
          });
        }
      });

      this.getBinnadzorRecords().filter(r => inRange(r.timestamp)).forEach(d => {
        if (!deletedIds.has(d.id) && !seen.has(d.id)) {
          seen.add(d.id);
          results.push({
            id: d.id,
            type: 'Binnadzor',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: d.surahAtauHalaman || d.materi || 'Tilawah',
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            surahAtauJuz: d.surahAtauHalaman,
            hukumTajwid: d.hukumTajwid,
            makhrojHuruf: d.makhrojHuruf,
            kefasihan: d.kefasihan,
            kelancaran: d.kelancaran
          });
        }
      });

      this.getPembelajaranRecords().filter(r => inRange(r.timestamp)).forEach(d => {
        if (!deletedIds.has(d.id) && !seen.has(d.id)) {
          seen.add(d.id);
          results.push({
            id: d.id,
            type: 'Pembelajaran',
            timestamp: d.timestamp,
            idSantri: d.idSantri,
            namaSantri: d.namaSantri,
            materi: d.materi || (d.jilid ? `${d.jilid} Hal ${d.halaman}` : 'Materi Pembelajaran'),
            nilai: d.nilai,
            catatan: d.catatan || '',
            inputBy: d.inputBy || '',
            tipeKelas: d.tipeKelas,
            statusKenaikan: d.statusKenaikan,
            kendalaSantri: d.kendalaSantri,
            rekomendasiTindakLanjut: d.rekomendasiTindakLanjut
          });
        }
      });
    }

    results.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return results;
  },

  async fetchRecordsForDate(dateStr: string): Promise<CombinedHistoryItem[]> {
    return this.fetchRecordsForDateRange(dateStr, dateStr);
  },

  async updateRecord(type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran', id: string, updatedData: Partial<ZiyadahRecord | MurojaahRecord | BinnadzorRecord | PembelajaranRecord>): Promise<boolean> {
    this.assertCanMutate('Ubah riwayat setoran');
    if (!id) return false;

    const collectionName = type === 'Ziyadah' ? COLLECTIONS.ZIYADAH
      : type === 'Murojaah' ? COLLECTIONS.MUROJAAH
      : type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN
      : COLLECTIONS.BINNADZOR;

    await setDoc(doc(db, collectionName, id), cleanForFirestore(updatedData), { merge: true });

    // Keep the bounded operational cache coherent only when the record is
    // already present. Historical records outside the window are updated
    // directly in Firestore and remain outside the dashboard cache.
    if (type === 'Ziyadah') {
      writeArrayCache(STORAGE_KEYS.ZIYADAH, this.getZiyadahRecords().map(r => r.id === id ? { ...r, ...updatedData } as ZiyadahRecord : r));
    } else if (type === 'Murojaah') {
      writeArrayCache(STORAGE_KEYS.MUROJAAH, this.getMurojaahRecords().map(r => r.id === id ? { ...r, ...updatedData } as MurojaahRecord : r));
    } else if (type === 'Pembelajaran') {
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, this.getPembelajaranRecords().map(r => r.id === id ? { ...r, ...updatedData } as PembelajaranRecord : r));
    } else {
      writeArrayCache(STORAGE_KEYS.BINNADZOR, this.getBinnadzorRecords().map(r => r.id === id ? { ...r, ...updatedData } as BinnadzorRecord : r));
    }

    return true;
  },

  async setProgramLiburanActive(active: boolean, updatedBy: string = 'Ustadz / Admin'): Promise<AppConfig> {
    this.assertCanMutate('Ubah status program liburan');
    const prev = this.getAppConfig();
    const updated: AppConfig = {
      ...prev,
      programLiburanActive: active,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(updated));
    try {
      await setDoc(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), cleanForFirestore(updated));
    } catch (err) {
      console.error('Failed to update app config in Firestore:', err);
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(prev));
      throw err;
    }
    return updated;
  },

  async savePantauanLiburan(record: Omit<PantauanLiburanRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<PantauanLiburanRecord> {
    this.assertCanMutate('Simpan pantauan liburan');
    const records = this.getPantauanLiburanRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);

    let timestamp = record.timestamp;
    if (!timestamp) {
      timestamp = `${getTodayInputFormat()} ${getCurrentTimeInputFormat()}`;
    }

    const id = record.id || `LBR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newRecord: PantauanLiburanRecord = {
      ...record,
      id,
      timestamp,
      namaSantri: santri?.namaSantri || record.namaSantri || record.idSantri,
      kelas: santri?.kelas || record.kelas || ''
    };

    const existingIndex = records.findIndex(r => r.id === newRecord.id || (r.idSantri === newRecord.idSantri && r.tanggal === newRecord.tanggal));
    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.unshift(newRecord);
    }

    records.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp));
    writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, records);

    try {
      await setDoc(doc(db, COLLECTIONS.PANTAUAN_LIBURAN, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Pantauan Liburan to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async deletePantauanLiburan(id: string): Promise<boolean> {
    this.assertCanMutate('Hapus pantauan liburan');
    await deleteDoc(doc(db, COLLECTIONS.PANTAUAN_LIBURAN, id));
    writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, this.getPantauanLiburanRecords().filter(r => r.id !== id));
    return true;
  },

  async addSantri(santri: Santri, defaultPassword = '123'): Promise<Santri> {
    this.assertCanMutate('Tambah data santri');
    const list = this.getSantriList();
    const existingIndex = list.findIndex(s => s.idSantri === santri.idSantri);
    if (existingIndex >= 0) {
      list[existingIndex] = santri;
    } else {
      list.push(santri);
    }
    writeArrayCache(STORAGE_KEYS.SANTRI, list);

    const users = this.getUsers();

    const waliUsername = `wali_${santri.idSantri.toLowerCase()}`;
    let waliUser = users.find(u => u.username.toLowerCase() === waliUsername.toLowerCase());
    if (waliUser) {
      waliUser.nama = santri.waliNama ? `Wali ${santri.namaSantri} (${santri.waliNama})` : `Wali ${santri.namaSantri}`;
      waliUser.idSantri = santri.idSantri;
    } else {
      waliUser = {
        id: `USR-WLI-${santri.idSantri}`,
        username: waliUsername,
        password: defaultPassword,
        role: 'Wali',
        nama: santri.waliNama ? `Wali ${santri.namaSantri} (${santri.waliNama})` : `Wali ${santri.namaSantri}`,
        idSantri: santri.idSantri
      };
      users.push(waliUser);
    }

    const santriUsername = santri.idSantri;
    let santriUser = users.find(u => u.username.toLowerCase() === santriUsername.toLowerCase());
    if (santriUser) {
      santriUser.nama = santri.namaSantri;
      santriUser.idSantri = santri.idSantri;
    } else {
      santriUser = {
        id: `USR-STR-${santri.idSantri}`,
        username: santri.idSantri,
        password: defaultPassword,
        role: 'Santri',
        nama: santri.namaSantri,
        idSantri: santri.idSantri
      };
      users.push(santriUser);
    }

    writeArrayCache(STORAGE_KEYS.USERS, users);

    try {
      await setDoc(doc(db, COLLECTIONS.SANTRI, santri.idSantri), cleanForFirestore(santri));
      await setDoc(doc(db, COLLECTIONS.USERS, waliUser.id), cleanForFirestore(waliUser));
      await setDoc(doc(db, COLLECTIONS.USERS, santriUser.id), cleanForFirestore(santriUser));
    } catch (e) {
      console.error('Failed to sync new Santri to Firestore:', e);
      throw e;
    }

    return santri;
  },

  async updateSantri(idSantri: string, updatedData: Partial<Santri>): Promise<boolean> {
    this.assertCanMutate('Ubah data santri');
    const list = this.getSantriList().map(s => s.idSantri === idSantri ? { ...s, ...updatedData } : s);
    writeArrayCache(STORAGE_KEYS.SANTRI, list);

    const target = list.find(s => s.idSantri === idSantri);
    if (target) {
      try {
        await setDoc(doc(db, COLLECTIONS.SANTRI, idSantri), cleanForFirestore(target), { merge: true });
      } catch (e) {
        console.error('Failed to update Santri in Firestore:', e);
        throw e;
      }
    }
    return true;
  },

  async deleteSantri(idSantri: string, deleteRelatedHistory = true): Promise<boolean> {
    this.assertCanMutate('Hapus santri');

    const usersToDelete = this.getUsers().filter(
      u => u.idSantri === idSantri || u.username.toLowerCase() === idSantri.toLowerCase()
    );

    const relatedSnapshots = deleteRelatedHistory
      ? await Promise.all([
          getDocs(query(collection(db, COLLECTIONS.ZIYADAH), where('idSantri', '==', idSantri))),
          getDocs(query(collection(db, COLLECTIONS.MUROJAAH), where('idSantri', '==', idSantri))),
          getDocs(query(collection(db, COLLECTIONS.BINNADZOR), where('idSantri', '==', idSantri))),
          getDocs(query(collection(db, COLLECTIONS.PEMBELAJARAN), where('idSantri', '==', idSantri))),
        ])
      : [];

    const deleteRefs = [
      doc(db, COLLECTIONS.SANTRI, idSantri),
      ...usersToDelete.map(user => doc(db, COLLECTIONS.USERS, user.id)),
    ];

    if (deleteRelatedHistory) {
      relatedSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(docSnap => deleteRefs.push(docSnap.ref));
      });
    }

    for (let index = 0; index < deleteRefs.length; index += 450) {
      const batch = writeBatch(db);
      deleteRefs.slice(index, index + 450).forEach(ref => batch.delete(ref));
      await batch.commit();
    }

    writeArrayCache(STORAGE_KEYS.SANTRI, this.getSantriList().filter(s => s.idSantri !== idSantri));
    writeArrayCache(
      STORAGE_KEYS.USERS,
      this.getUsers().filter(u => u.idSantri !== idSantri && u.username.toLowerCase() !== idSantri.toLowerCase())
    );

    if (deleteRelatedHistory) {
      relatedSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(docSnap => this.markRecordDeleted(docSnap.id));
      });
      writeArrayCache(STORAGE_KEYS.ZIYADAH, this.getZiyadahRecords().filter(r => r.idSantri !== idSantri));
      writeArrayCache(STORAGE_KEYS.MUROJAAH, this.getMurojaahRecords().filter(r => r.idSantri !== idSantri));
      writeArrayCache(STORAGE_KEYS.BINNADZOR, this.getBinnadzorRecords().filter(r => r.idSantri !== idSantri));
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, this.getPembelajaranRecords().filter(r => r.idSantri !== idSantri));
    }

    return true;
  },

  async addUser(user: User): Promise<User> {
    this.assertCanManageAccounts();
    this.assertCanMutate('Tambah pengguna');
    const users = this.getUsers();

    const ensuredUser: User = {
      id: user.id || `USR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      username: user.username ? user.username.trim().toLowerCase() : '',
      password: user.password ? user.password.trim() : '123',
      role: user.role || 'Ustadz',
      nama: user.nama ? user.nama.trim() : 'Ustadz Pengajar',
      idSantri: (user.role === 'Ustadz' || user.role === 'Superadmin' || user.role === 'Pimpinan') ? '' : (user.idSantri || '')
    };

    const existingIndex = users.findIndex(u => u.username.toLowerCase() === ensuredUser.username.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = ensuredUser;
    } else {
      users.push(ensuredUser);
    }

    writeArrayCache(STORAGE_KEYS.USERS, users);

    try {
      await setDoc(doc(db, COLLECTIONS.USERS, ensuredUser.id), cleanForFirestore(ensuredUser));
    } catch (e) {
      console.error('Failed to save User to Firestore:', e);
      throw e;
    }

    return ensuredUser;
  },

  async updateUser(id: string, updatedData: Partial<User>): Promise<boolean> {
    this.assertCanManageAccounts();
    this.assertCanMutate('Ubah pengguna');
    const cleanUpdate = { ...updatedData };
    if (cleanUpdate.username) cleanUpdate.username = cleanUpdate.username.trim().toLowerCase();
    if (cleanUpdate.password) cleanUpdate.password = cleanUpdate.password.trim();
    if (cleanUpdate.nama) cleanUpdate.nama = cleanUpdate.nama.trim();

    const users = this.getUsers().map(u => u.id === id ? { ...u, ...cleanUpdate } : u);
    writeArrayCache(STORAGE_KEYS.USERS, users);

    const currentSession = this.getSession();
    if (currentSession && currentSession.id === id) {
      this.setSession({ ...currentSession, ...cleanUpdate });
    }

    const target = users.find(u => u.id === id);
    if (target) {
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, id), cleanForFirestore(target), { merge: true });
      } catch (e) {
        console.error('Failed to update User in Firestore:', e);
        throw e;
      }
    }

    return true;
  },

  async deleteUser(id: string): Promise<boolean> {
    this.assertCanManageAccounts();
    this.assertCanMutate('Hapus pengguna');
    await deleteDoc(doc(db, COLLECTIONS.USERS, id));
    writeArrayCache(STORAGE_KEYS.USERS, this.getUsers().filter(u => u.id !== id));
    return true;
  },

  getSession(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!data) return null;
    try {
      const user = JSON.parse(data);
      if (user) {
        const r = String(user.role || '').trim().toLowerCase();
        if (r === 'superadmin') {
          user.role = 'Superadmin';
        } else if (r === 'pimpinan') {
          user.role = 'Pimpinan';
        } else if (r === 'wali' || r.includes('wali')) {
          user.role = 'Wali';
        } else if (r === 'santri') {
          user.role = 'Santri';
        } else {
          user.role = 'Ustadz';
        }
      }
      return user;
    } catch {
      return null;
    }
  },

  setSession(user: User | null) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    }
  },

  async addKelas(kelas: Kelas): Promise<Kelas> {
    this.assertCanMutate('Tambah kelas');
    const list = this.getKelasList();
    const assignedIds = new Set(kelas.santriIds || []);

    for (const k of list) {
      if (k.id !== kelas.id && k.santriIds && k.santriIds.length > 0) {
        const prevCount = k.santriIds.length;
        k.santriIds = k.santriIds.filter(id => !assignedIds.has(id));
        if (k.santriIds.length !== prevCount) {
          try {
            await setDoc(doc(db, COLLECTIONS.KELAS, k.id), cleanForFirestore(k), { merge: true });
          } catch (e) {
            console.error('Failed to update other class:', e);
            throw e;
          }
        }
      }
    }

    const existingIndex = list.findIndex(k => k.id === kelas.id);
    if (existingIndex >= 0) {
      list[existingIndex] = kelas;
    } else {
      list.push(kelas);
    }
    writeArrayCache(STORAGE_KEYS.KELAS, list);
    try {
      await setDoc(doc(db, COLLECTIONS.KELAS, kelas.id), cleanForFirestore(kelas));
    } catch (e) {
      console.error('Failed to save Kelas to Firestore:', e);
      throw e;
    }

    const allSantri = this.getSantriList();
    let santriChanged = false;
    for (const s of allSantri) {
      if (assignedIds.has(s.idSantri) && s.kelas !== kelas.namaKelas) {
        s.kelas = kelas.namaKelas;
        santriChanged = true;
        try {
          await setDoc(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });
        } catch (e) {
          console.error('Failed to sync santri.kelas:', e);
          throw e;
        }
      }
    }
    if (santriChanged) writeArrayCache(STORAGE_KEYS.SANTRI, allSantri);

    return kelas;
  },

  async updateKelas(id: string, updatedData: Partial<Kelas>): Promise<boolean> {
    this.assertCanMutate('Ubah kelas');
    const list = this.getKelasList();
    const currentKelas = list.find(k => k.id === id);
    const oldSantriIds = new Set(currentKelas?.santriIds || []);
    const newSantriIds = updatedData.santriIds !== undefined ? new Set(updatedData.santriIds) : oldSantriIds;

    if (updatedData.santriIds !== undefined) {
      for (const k of list) {
        if (k.id !== id && k.santriIds && k.santriIds.length > 0) {
          const prevCount = k.santriIds.length;
          k.santriIds = k.santriIds.filter(sid => !newSantriIds.has(sid));
          if (k.santriIds.length !== prevCount) {
            try {
              await setDoc(doc(db, COLLECTIONS.KELAS, k.id), cleanForFirestore(k), { merge: true });
            } catch (e) {
              console.error('Failed to update other class:', e);
              throw e;
            }
          }
        }
      }
    }

    const updatedList = list.map(k => k.id === id ? { ...k, ...updatedData } : k);
    writeArrayCache(STORAGE_KEYS.KELAS, updatedList);
    const target = updatedList.find(k => k.id === id);
    if (target) {
      try {
        await setDoc(doc(db, COLLECTIONS.KELAS, id), cleanForFirestore(target), { merge: true });
      } catch (e) {
        console.error('Failed to update Kelas in Firestore:', e);
        throw e;
      }
    }

    const allSantri = this.getSantriList();
    let santriChanged = false;
    const kelasName = target?.namaKelas || '';

    for (const s of allSantri) {
      if (newSantriIds.has(s.idSantri)) {
        if (s.kelas !== kelasName) {
          s.kelas = kelasName;
          santriChanged = true;
          try {
            await setDoc(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });
          } catch (e) {
            console.error('Failed to sync santri.kelas:', e);
            throw e;
          }
        }
      } else if (oldSantriIds.has(s.idSantri)) {
        s.kelas = '';
        santriChanged = true;
        try {
          await setDoc(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });
        } catch (e) {
          console.error('Failed to reset santri.kelas:', e);
          throw e;
        }
      }
    }
    if (santriChanged) writeArrayCache(STORAGE_KEYS.SANTRI, allSantri);

    return true;
  },

  async deleteKelas(id: string): Promise<boolean> {
    this.assertCanMutate('Hapus kelas');
    const list = this.getKelasList();
    const deletedKelas = list.find(k => k.id === id);
    const affectedSantriIds = new Set(deletedKelas?.santriIds || []);
    const allSantri = this.getSantriList();
    const updatedSantri = allSantri.map(s => affectedSantriIds.has(s.idSantri) ? { ...s, kelas: '' } : s);

    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.KELAS, id));
    updatedSantri.filter(s => affectedSantriIds.has(s.idSantri)).forEach(s => {
      batch.set(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });
    });
    await batch.commit();

    writeArrayCache(STORAGE_KEYS.KELAS, list.filter(k => k.id !== id));
    if (affectedSantriIds.size > 0) writeArrayCache(STORAGE_KEYS.SANTRI, updatedSantri);
    return true;
  },

  // Backwards-compatible name. This now clears local cache only; it never
  // restores sample/demo records into production state.
  async resetToDefault() {
    this.assertCanMutate('Reset data lokal');
    writeArrayCache(STORAGE_KEYS.USERS, []);
    writeArrayCache(STORAGE_KEYS.SANTRI, []);
    writeArrayCache(STORAGE_KEYS.ZIYADAH, []);
    writeArrayCache(STORAGE_KEYS.MUROJAAH, []);
    writeArrayCache(STORAGE_KEYS.BINNADZOR, []);
    writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, []);
    writeArrayCache(STORAGE_KEYS.KELAS, []);
    writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, []);
    localStorage.removeItem(STORAGE_KEYS.APP_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.DELETED_RECORDS);
  }
};
