import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, TipeKelas, PantauanLiburanRecord, AppConfig } from '../types';
import { getClassGroup } from '../utils/classUtils';
import { getTodayInputFormat, getCurrentTimeInputFormat } from '../utils/dateFormatter';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
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
  DELETED_RECORDS: 'tahfidz_deleted_records_v2'
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
  APP_CONFIG: 'app_config'
};

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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
    return readArrayCache<Santri>(STORAGE_KEYS.SANTRI).map((s) => ({
      ...s,
      kelas: normalizeKelas(s.kelas)
    }));
  },

  getZiyadahRecords(): ZiyadahRecord[] {
    const records = readArrayCache<ZiyadahRecord>(STORAGE_KEYS.ZIYADAH);
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? records.filter((r) => !deletedIds.has(r.id)) : records;
  },

  getMurojaahRecords(): MurojaahRecord[] {
    const records = readArrayCache<MurojaahRecord>(STORAGE_KEYS.MUROJAAH);
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? records.filter((r) => !deletedIds.has(r.id)) : records;
  },

  getBinnadzorRecords(): BinnadzorRecord[] {
    const records = readArrayCache<BinnadzorRecord>(STORAGE_KEYS.BINNADZOR);
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? records.filter((r) => !deletedIds.has(r.id)) : records;
  },

  getPembelajaranRecords(): PembelajaranRecord[] {
    const records = readArrayCache<PembelajaranRecord>(STORAGE_KEYS.PEMBELAJARAN);
    const deletedIds = this.getDeletedRecordIds();
    return deletedIds.size > 0 ? records.filter((r) => !deletedIds.has(r.id)) : records;
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

    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.ZIYADAH, records);

    try {
      await setDoc(doc(db, COLLECTIONS.ZIYADAH, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Ziyadah to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async saveMurojaah(record: Omit<MurojaahRecord, 'id'> & { timestamp?: string }): Promise<MurojaahRecord> {
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

    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.MUROJAAH, records);

    try {
      await setDoc(doc(db, COLLECTIONS.MUROJAAH, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Murojaah to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async saveBinnadzor(record: Omit<BinnadzorRecord, 'id'> & { timestamp?: string }): Promise<BinnadzorRecord> {
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

    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.BINNADZOR, records);

    try {
      await setDoc(doc(db, COLLECTIONS.BINNADZOR, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Binnadzor to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async savePembelajaran(record: Omit<PembelajaranRecord, 'id'> & { timestamp?: string }): Promise<PembelajaranRecord> {
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

    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records);

    try {
      await setDoc(doc(db, COLLECTIONS.PEMBELAJARAN, newRecord.id), cleanForFirestore(newRecord));
    } catch (e) {
      console.error('Failed to save Pembelajaran to Firestore:', e);
      throw e;
    }

    return newRecord;
  },

  async deleteRecord(type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran', id: string): Promise<boolean> {
    if (!id) return false;

    const collectionName = type === 'Ziyadah' ? COLLECTIONS.ZIYADAH
      : type === 'Murojaah' ? COLLECTIONS.MUROJAAH
      : type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN
      : COLLECTIONS.BINNADZOR;

    await deleteDoc(doc(db, collectionName, id));
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
    return true;
  },

  async deleteRecordsBatch(items: { type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran'; id: string }[]): Promise<boolean> {
    if (!items || items.length === 0) return true;

    const batch = writeBatch(db);
    items.forEach(item => {
      const coll = item.type === 'Ziyadah' ? COLLECTIONS.ZIYADAH
        : item.type === 'Murojaah' ? COLLECTIONS.MUROJAAH
        : item.type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN
        : COLLECTIONS.BINNADZOR;
      batch.delete(doc(db, coll, item.id));
    });
    await batch.commit();

    items.forEach(item => {
      if (item.id) this.markRecordDeleted(item.id);
    });

    const ziyadahIds = new Set(items.filter(i => i.type === 'Ziyadah').map(i => i.id));
    const murojaahIds = new Set(items.filter(i => i.type === 'Murojaah').map(i => i.id));
    const binnadzorIds = new Set(items.filter(i => i.type === 'Binnadzor').map(i => i.id));
    const pembelajaranIds = new Set(items.filter(i => i.type === 'Pembelajaran').map(i => i.id));

    if (ziyadahIds.size > 0) writeArrayCache(STORAGE_KEYS.ZIYADAH, this.getZiyadahRecords().filter(r => !ziyadahIds.has(r.id)));
    if (murojaahIds.size > 0) writeArrayCache(STORAGE_KEYS.MUROJAAH, this.getMurojaahRecords().filter(r => !murojaahIds.has(r.id)));
    if (binnadzorIds.size > 0) writeArrayCache(STORAGE_KEYS.BINNADZOR, this.getBinnadzorRecords().filter(r => !binnadzorIds.has(r.id)));
    if (pembelajaranIds.size > 0) writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, this.getPembelajaranRecords().filter(r => !pembelajaranIds.has(r.id)));

    return true;
  },

  async syncWithCloud(): Promise<{ success: boolean; message?: string }> {
    try {
      const deletedIds = this.getDeletedRecordIds();

      const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
      const users: User[] = [];
      const userMap = new Map<string, User>();
      userSnap.forEach((docSnap) => {
        const u = docSnap.data() as User;
        if (u && u.id && !userMap.has(u.id)) {
          userMap.set(u.id, u);
          users.push(u);
        }
      });
      writeArrayCache(STORAGE_KEYS.USERS, users);

      const santriSnap = await getDocs(collection(db, COLLECTIONS.SANTRI));
      const santriList: Santri[] = [];
      const santriMap = new Map<string, Santri>();
      santriSnap.forEach((docSnap) => {
        const s = docSnap.data() as Santri;
        if (s && s.idSantri && !santriMap.has(s.idSantri)) {
          const normalizedS = { ...s, kelas: normalizeKelas(s.kelas) };
          santriMap.set(s.idSantri, normalizedS);
          santriList.push(normalizedS);
        }
      });
      writeArrayCache(STORAGE_KEYS.SANTRI, santriList);

      const ziyadahSnap = await getDocs(collection(db, COLLECTIONS.ZIYADAH));
      const ziyadahRecords: ZiyadahRecord[] = [];
      ziyadahSnap.forEach((docSnap) => {
        const data = docSnap.data() as ZiyadahRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) ziyadahRecords.push({ ...data, id });
      });
      ziyadahRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.ZIYADAH, ziyadahRecords);

      const murojaahSnap = await getDocs(collection(db, COLLECTIONS.MUROJAAH));
      const murojaahRecords: MurojaahRecord[] = [];
      murojaahSnap.forEach((docSnap) => {
        const data = docSnap.data() as MurojaahRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) murojaahRecords.push({ ...data, id });
      });
      murojaahRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.MUROJAAH, murojaahRecords);

      const binnadzorSnap = await getDocs(collection(db, COLLECTIONS.BINNADZOR));
      const binnadzorRecords: BinnadzorRecord[] = [];
      binnadzorSnap.forEach((docSnap) => {
        const data = docSnap.data() as BinnadzorRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) binnadzorRecords.push({ ...data, id });
      });
      binnadzorRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.BINNADZOR, binnadzorRecords);

      const pembelajaranSnap = await getDocs(collection(db, COLLECTIONS.PEMBELAJARAN));
      const pembelajaranRecords: PembelajaranRecord[] = [];
      pembelajaranSnap.forEach((docSnap) => {
        const data = docSnap.data() as PembelajaranRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) pembelajaranRecords.push({ ...data, id });
      });
      pembelajaranRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, pembelajaranRecords);

      const kelasSnap = await getDocs(collection(db, COLLECTIONS.KELAS));
      const kelasList: Kelas[] = [];
      kelasSnap.forEach((docSnap) => {
        const k = docSnap.data() as Kelas;
        if (k && k.id) kelasList.push({ ...k, tipeKelas: normalizeTipeKelas(k.tipeKelas) });
      });
      writeArrayCache(STORAGE_KEYS.KELAS, kelasList);

      return { success: true };
    } catch (err) {
      console.error('syncWithCloud error:', err);
      return { success: false, message: (err as Error).message };
    }
  },

  async updateRecord(type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran', id: string, updatedData: Partial<ZiyadahRecord | MurojaahRecord | BinnadzorRecord | PembelajaranRecord>): Promise<boolean> {
    if (type === 'Ziyadah') {
      const records = this.getZiyadahRecords().map(r => r.id === id ? { ...r, ...updatedData } as ZiyadahRecord : r);
      writeArrayCache(STORAGE_KEYS.ZIYADAH, records);
      const target = records.find(r => r.id === id);
      if (target) {
        try {
          await setDoc(doc(db, COLLECTIONS.ZIYADAH, id), cleanForFirestore(target), { merge: true });
        } catch (e) {
          console.error('Failed to update Ziyadah in Firestore:', e);
          throw e;
        }
      }
    } else if (type === 'Murojaah') {
      const records = this.getMurojaahRecords().map(r => r.id === id ? { ...r, ...updatedData } as MurojaahRecord : r);
      writeArrayCache(STORAGE_KEYS.MUROJAAH, records);
      const target = records.find(r => r.id === id);
      if (target) {
        try {
          await setDoc(doc(db, COLLECTIONS.MUROJAAH, id), cleanForFirestore(target), { merge: true });
        } catch (e) {
          console.error('Failed to update Murojaah in Firestore:', e);
          throw e;
        }
      }
    } else if (type === 'Pembelajaran') {
      const records = this.getPembelajaranRecords().map(r => r.id === id ? { ...r, ...updatedData } as PembelajaranRecord : r);
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records);
      const target = records.find(r => r.id === id);
      if (target) {
        try {
          await setDoc(doc(db, COLLECTIONS.PEMBELAJARAN, id), cleanForFirestore(target), { merge: true });
        } catch (e) {
          console.error('Failed to update Pembelajaran in Firestore:', e);
          throw e;
        }
      }
    } else {
      const records = this.getBinnadzorRecords().map(r => r.id === id ? { ...r, ...updatedData } as BinnadzorRecord : r);
      writeArrayCache(STORAGE_KEYS.BINNADZOR, records);
      const target = records.find(r => r.id === id);
      if (target) {
        try {
          await setDoc(doc(db, COLLECTIONS.BINNADZOR, id), cleanForFirestore(target), { merge: true });
        } catch (e) {
          console.error('Failed to update Binnadzor in Firestore:', e);
          throw e;
        }
      }
    }
    return true;
  },

  async setProgramLiburanActive(active: boolean, updatedBy: string = 'Ustadz / Admin'): Promise<AppConfig> {
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
    await deleteDoc(doc(db, COLLECTIONS.PANTAUAN_LIBURAN, id));
    writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, this.getPantauanLiburanRecords().filter(r => r.id !== id));
    return true;
  },

  async addSantri(santri: Santri, defaultPassword = '123'): Promise<Santri> {
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
    const usersToDelete = this.getUsers().filter(u => u.idSantri === idSantri || u.username.toLowerCase() === idSantri.toLowerCase());
    const ziyadahToDelete = deleteRelatedHistory ? this.getZiyadahRecords().filter(r => r.idSantri === idSantri) : [];
    const murojaahToDelete = deleteRelatedHistory ? this.getMurojaahRecords().filter(r => r.idSantri === idSantri) : [];
    const binnadzorToDelete = deleteRelatedHistory ? this.getBinnadzorRecords().filter(r => r.idSantri === idSantri) : [];
    const pembelajaranToDelete = deleteRelatedHistory ? this.getPembelajaranRecords().filter(r => r.idSantri === idSantri) : [];

    const operationCount = 1 + usersToDelete.length + ziyadahToDelete.length + murojaahToDelete.length + binnadzorToDelete.length + pembelajaranToDelete.length;
    if (operationCount > 450) {
      throw new Error('Data terkait santri terlalu banyak untuk satu operasi hapus Cloud.');
    }

    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.SANTRI, idSantri));
    usersToDelete.forEach(u => batch.delete(doc(db, COLLECTIONS.USERS, u.id)));
    ziyadahToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.ZIYADAH, r.id)));
    murojaahToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.MUROJAAH, r.id)));
    binnadzorToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.BINNADZOR, r.id)));
    pembelajaranToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.PEMBELAJARAN, r.id)));
    await batch.commit();

    writeArrayCache(STORAGE_KEYS.SANTRI, this.getSantriList().filter(s => s.idSantri !== idSantri));
    writeArrayCache(STORAGE_KEYS.USERS, this.getUsers().filter(u => u.idSantri !== idSantri && u.username.toLowerCase() !== idSantri.toLowerCase()));

    if (deleteRelatedHistory) {
      ziyadahToDelete.forEach(r => this.markRecordDeleted(r.id));
      murojaahToDelete.forEach(r => this.markRecordDeleted(r.id));
      binnadzorToDelete.forEach(r => this.markRecordDeleted(r.id));
      pembelajaranToDelete.forEach(r => this.markRecordDeleted(r.id));
      writeArrayCache(STORAGE_KEYS.ZIYADAH, this.getZiyadahRecords().filter(r => r.idSantri !== idSantri));
      writeArrayCache(STORAGE_KEYS.MUROJAAH, this.getMurojaahRecords().filter(r => r.idSantri !== idSantri));
      writeArrayCache(STORAGE_KEYS.BINNADZOR, this.getBinnadzorRecords().filter(r => r.idSantri !== idSantri));
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, this.getPembelajaranRecords().filter(r => r.idSantri !== idSantri));
    }

    return true;
  },

  async addUser(user: User): Promise<User> {
    const users = this.getUsers();

    const ensuredUser: User = {
      id: user.id || `USR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      username: user.username ? user.username.trim().toLowerCase() : '',
      password: user.password ? user.password.trim() : '123',
      role: user.role || 'Ustadz',
      nama: user.nama ? user.nama.trim() : 'Ustadz Pengajar',
      idSantri: (user.role === 'Ustadz' || user.role === 'Superadmin') ? '' : (user.idSantri || '')
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
