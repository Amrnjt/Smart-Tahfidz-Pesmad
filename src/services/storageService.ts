import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, TipeKelas, PantauanLiburanRecord, AppConfig } from '../types';
import { INITIAL_USERS, INITIAL_SANTRI, INITIAL_ZIYADAH, INITIAL_MUROJAAH, INITIAL_BINNADZOR, INITIAL_PEMBELAJARAN } from '../data/sampleDatabase';
import { getClassGroup } from '../utils/classUtils';
import { getTodayInputFormat, getCurrentTimeInputFormat } from '../utils/dateFormatter';

function normalizeKelas(kelas: string): string {
  const g = getClassGroup(kelas);
  return g;
}

function normalizeTipeKelas(tipe: string): TipeKelas {
  const normalized = (tipe || '').trim();
  if (normalized.toLowerCase().includes('tahfidz') || normalized.toLowerCase().includes('tahfiz')) return 'Tahfidz';
  if (normalized.toLowerCase().includes('binnadzor')) return 'Binnadzor';
  if (normalized.toLowerCase().includes('jilid') || normalized.toLowerCase().includes('ummi')) return 'Jilid';
  if (normalized.toLowerCase().includes('istimewa')) return 'Kelas Istimewa';
  return 'Binnadzor';
}
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

// Helper to remove any undefined fields before sending to Firestore
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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

    // 1. Try local cache first for instant response
    const localUsers = this.getUsers();
    let matched = localUsers.find(
      u => u.username && u.username.trim().toLowerCase() === cleanUser && u.password === cleanPass
    );

    // 2. If not matched in local cache, query Firestore directly to ensure newly created accounts on other devices or fresh sessions are immediately authenticated
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

        // Update local cache if remote has latest accounts
        if (remoteUsers.length > 0) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remoteUsers));
        }
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
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        return INITIAL_USERS;
      }
      // Ensure default superadmin (anas) is present in users list
      const hasSuperadmin = parsed.some(u => u.username?.toLowerCase() === 'anas' || u.role === 'Superadmin');
      if (!hasSuperadmin) {
        const superadminUser = INITIAL_USERS.find(u => u.username === 'anas');
        if (superadminUser) {
          parsed.unshift(superadminUser);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch {
      return INITIAL_USERS;
    }
  },

  getSantriList(): Santri[] {
    const data = localStorage.getItem(STORAGE_KEYS.SANTRI);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
      return INITIAL_SANTRI;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return INITIAL_SANTRI;
      const normalized = parsed.map((s: Santri) => ({ ...s, kelas: normalizeKelas(s.kelas) }));
      return normalized;
    } catch {
      return INITIAL_SANTRI;
    }
  },

  getZiyadahRecords(): ZiyadahRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ZIYADAH);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(INITIAL_ZIYADAH));
      return INITIAL_ZIYADAH;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return INITIAL_ZIYADAH;
      const deletedIds = this.getDeletedRecordIds();
      return deletedIds.size > 0 ? parsed.filter((r: ZiyadahRecord) => !deletedIds.has(r.id)) : parsed;
    } catch {
      return INITIAL_ZIYADAH;
    }
  },

  getMurojaahRecords(): MurojaahRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.MUROJAAH);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(INITIAL_MUROJAAH));
      return INITIAL_MUROJAAH;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return INITIAL_MUROJAAH;
      const deletedIds = this.getDeletedRecordIds();
      return deletedIds.size > 0 ? parsed.filter((r: MurojaahRecord) => !deletedIds.has(r.id)) : parsed;
    } catch {
      return INITIAL_MUROJAAH;
    }
  },

  getBinnadzorRecords(): BinnadzorRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.BINNADZOR);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(INITIAL_BINNADZOR));
      return INITIAL_BINNADZOR;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return INITIAL_BINNADZOR;
      const deletedIds = this.getDeletedRecordIds();
      return deletedIds.size > 0 ? parsed.filter((r: BinnadzorRecord) => !deletedIds.has(r.id)) : parsed;
    } catch {
      return INITIAL_BINNADZOR;
    }
  },

  getPembelajaranRecords(): PembelajaranRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.PEMBELAJARAN);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(INITIAL_PEMBELAJARAN));
      return INITIAL_PEMBELAJARAN;
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return INITIAL_PEMBELAJARAN;
      const deletedIds = this.getDeletedRecordIds();
      return deletedIds.size > 0 ? parsed.filter((r: PembelajaranRecord) => !deletedIds.has(r.id)) : parsed;
    } catch {
      return INITIAL_PEMBELAJARAN;
    }
  },

  getKelasList(): Kelas[] {
    const data = localStorage.getItem(STORAGE_KEYS.KELAS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const normalized = parsed.map((k: Kelas) => ({ ...k, tipeKelas: normalizeTipeKelas(k.tipeKelas) }));
      return normalized;
    } catch {
      return [];
    }
  },

  getAppConfig(): AppConfig {
    const data = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
    if (!data) {
      const defaultConfig: AppConfig = {
        programLiburanActive: false,
        programLiburanJudul: 'Program Pantauan Liburan Santri',
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(defaultConfig));
      return defaultConfig;
    }
    try {
      const parsed = JSON.parse(data);
      return parsed && typeof parsed.programLiburanActive === 'boolean'
        ? parsed
        : { programLiburanActive: false, programLiburanJudul: 'Program Pantauan Liburan Santri' };
    } catch {
      return { programLiburanActive: false, programLiburanJudul: 'Program Pantauan Liburan Santri' };
    }
  },

  getPantauanLiburanRecords(): PantauanLiburanRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.PANTAUAN_LIBURAN);
    if (!data) {
      return [];
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  // Real-time Firestore Listeners that automatically update localStorage & app state across all devices
  initRealtimeSync(onUpdate?: () => void): () => void {
    // 1. Initial One-time Migration & Seeding: Ensure all local users & santri exist in Firestore
    const seedAndMigrate = async () => {
      try {
        // A. Migrate Users
        const userSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const remoteUserMap = new Map<string, User>();
        userSnapshot.forEach((docSnap) => {
          const u = docSnap.data() as User;
          if (u.id) remoteUserMap.set(u.id, u);
          if (u.username) remoteUserMap.set(u.username.toLowerCase(), u);
        });

        const localUsers = this.getUsers();
        // Akun demo (INITIAL_USERS) hanya di-seed ketika database benar-benar
        // kosong (belum ada satu pun akun di cloud maupun lokal). Ini mencegah
        // akun demo muncul kembali setelah diedit atau dihapus, sekaligus tetap
        // menyediakan akun awal agar tidak terjadi lockout pada database baru.
        const isFreshDatabase = remoteUserMap.size === 0 && localUsers.length === 0;
        const usersToSync = isFreshDatabase ? [...INITIAL_USERS] : [...localUsers];
        for (const user of usersToSync) {
          if (!remoteUserMap.has(user.id) && !remoteUserMap.has(user.username.toLowerCase())) {
            const cleanUser = cleanForFirestore(user);
            await setDoc(doc(db, COLLECTIONS.USERS, user.id), cleanUser).catch(console.error);
            remoteUserMap.set(user.id, user);
            remoteUserMap.set(user.username.toLowerCase(), user);
          }
        }

        // B. Migrate Santri (Hanya saat database cloud dan lokal benar-benar baru)
        const santriSnapshot = await getDocs(collection(db, COLLECTIONS.SANTRI));
        const remoteSantriMap = new Map<string, Santri>();
        santriSnapshot.forEach((docSnap) => {
          const s = docSnap.data() as Santri;
          if (s.idSantri) remoteSantriMap.set(s.idSantri, s);
        });

        const localSantri = this.getSantriList();
        if (remoteSantriMap.size === 0 && localSantri.length === 0 && INITIAL_SANTRI.length > 0) {
          for (const santri of INITIAL_SANTRI) {
            const cleanSantri = cleanForFirestore(santri);
            await setDoc(doc(db, COLLECTIONS.SANTRI, santri.idSantri), cleanSantri).catch(console.error);
            remoteSantriMap.set(santri.idSantri, santri);
          }
        }
        // Catatan: Ziyadah, Murojaah, Binnadzor, & Pembelajaran TIDAK di-reupload dari lokal ke cloud.
        // Cloud Firestore adalah Single Source of Truth, sehingga record yang telah dihapus tidak akan dibangkitkan kembali.
      } catch (err) {
        console.warn('Initial Firestore seeding/sync warning:', err);
      }
    };

    seedAndMigrate();

    // 1. Sync Users Realtime
    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      if (!snapshot.empty) {
        const users: User[] = [];
        const userMap = new Map<string, User>();
        snapshot.forEach((docSnap) => {
          const u = docSnap.data() as User;
          if (u && u.id && !userMap.has(u.id)) {
            userMap.set(u.id, u);
            users.push(u);
          }
        });

        // Demo/seed accounts (admin, Ustadz Abdullah Robbani, dll.) diperlakukan
        // sama seperti akun biasa: boleh diedit, di-rename, atau dihapus secara
        // permanen. Kita TIDAK lagi memaksa akun 'admin' selalu ada di sini,
        // sehingga perubahan pada akun demo tidak akan ter-reset otomatis.
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        if (onUpdate) onUpdate();
      } else {
        INITIAL_USERS.forEach((u) => {
          setDoc(doc(db, COLLECTIONS.USERS, u.id), cleanForFirestore(u)).catch(console.error);
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
        if (onUpdate) onUpdate();
      }
    }, (err) => {
      console.warn('Users firestore sync error:', err);
    });

    // 2. Sync Santri Realtime
    const unsubSantri = onSnapshot(collection(db, COLLECTIONS.SANTRI), (snapshot) => {
      if (!snapshot.empty) {
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
        localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santri));
        if (onUpdate) onUpdate();
      } else {
        // If remote is empty, check if local has santri to preserve
        const localSantri = this.getSantriList();
        if (localSantri.length > 0) {
          localSantri.forEach((s) => {
            setDoc(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s)).catch(console.error);
          });
        }
      }
    }, (err) => {
      console.warn('Santri firestore sync error:', err);
    });

    // 3. Sync Ziyadah Realtime
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
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Ziyadah firestore sync error:', err);
    });

    // 4. Sync Murojaah Realtime
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
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Murojaah firestore sync error:', err);
    });

    // 5. Sync Kelas Realtime
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
      localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(kelasList));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Kelas firestore sync error:', err);
    });

    // 6. Sync Binnadzor Realtime
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
      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(records));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Binnadzor firestore sync error:', err);
    });

    // 7. Sync Pembelajaran Realtime
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
      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(records));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Pembelajaran firestore sync error:', err);
    });

    // 8. Sync AppConfig Realtime (Program Pantauan Liburan Switch)
    const unsubAppConfig = onSnapshot(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const config = docSnap.data() as AppConfig;
        localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
        if (onUpdate) onUpdate();
      }
    }, (err) => {
      console.warn('AppConfig firestore sync error:', err);
    });

    // 9. Sync Pantauan Liburan Realtime
    const unsubPantauanLiburan = onSnapshot(collection(db, COLLECTIONS.PANTAUAN_LIBURAN), (snapshot) => {
      if (!snapshot.empty) {
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
        localStorage.setItem(STORAGE_KEYS.PANTAUAN_LIBURAN, JSON.stringify(records));
        if (onUpdate) onUpdate();
      }
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

    // 1. Optimistic Local Save
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));

    // 2. Cloud Firestore Save
    try {
      const cleanRecord = cleanForFirestore(newRecord);
      await setDoc(doc(db, COLLECTIONS.ZIYADAH, newRecord.id), cleanRecord);
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

    // 1. Optimistic Local Save
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));

    // 2. Cloud Firestore Save
    try {
      const cleanRecord = cleanForFirestore(newRecord);
      await setDoc(doc(db, COLLECTIONS.MUROJAAH, newRecord.id), cleanRecord);
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

    // 1. Optimistic Local Save
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(records));

    // 2. Cloud Firestore Save
    try {
      const cleanRecord = cleanForFirestore(newRecord);
      await setDoc(doc(db, COLLECTIONS.BINNADZOR, newRecord.id), cleanRecord);
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

    // 1. Optimistic Local Save
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(records));

    // 2. Cloud Firestore Save
    try {
      const cleanRecord = cleanForFirestore(newRecord);
      await setDoc(doc(db, COLLECTIONS.PEMBELAJARAN, newRecord.id), cleanRecord);
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

    // Cloud is the commit gate: do not hide local data if Firestore delete fails.
    await deleteDoc(doc(db, collectionName, id));
    this.markRecordDeleted(id);

    if (type === 'Ziyadah') {
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(this.getZiyadahRecords().filter(r => r.id !== id)));
    } else if (type === 'Murojaah') {
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(this.getMurojaahRecords().filter(r => r.id !== id)));
    } else if (type === 'Pembelajaran') {
      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(this.getPembelajaranRecords().filter(r => r.id !== id)));
    } else {
      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(this.getBinnadzorRecords().filter(r => r.id !== id)));
    }
    return true;
  },

  async deleteRecordsBatch(items: { type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran'; id: string }[]): Promise<boolean> {
    if (!items || items.length === 0) return true;

    // Commit all Cloud deletes first so UI/local cache only change after Firestore confirms.
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

    if (ziyadahIds.size > 0) localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(this.getZiyadahRecords().filter(r => !ziyadahIds.has(r.id))));
    if (murojaahIds.size > 0) localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(this.getMurojaahRecords().filter(r => !murojaahIds.has(r.id))));
    if (binnadzorIds.size > 0) localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(this.getBinnadzorRecords().filter(r => !binnadzorIds.has(r.id))));
    if (pembelajaranIds.size > 0) localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(this.getPembelajaranRecords().filter(r => !pembelajaranIds.has(r.id))));

    return true;
  },

  // Full manual sync with Cloud Firestore without unmounting UI
  async syncWithCloud(): Promise<{ success: boolean; message?: string }> {
    try {
      const deletedIds = this.getDeletedRecordIds();

      // 1. Sync Users
      const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
      if (!userSnap.empty) {
        const users: User[] = [];
        const userMap = new Map<string, User>();
        userSnap.forEach((docSnap) => {
          const u = docSnap.data() as User;
          if (u && u.id && !userMap.has(u.id)) {
            userMap.set(u.id, u);
            users.push(u);
          }
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // 2. Sync Santri
      const santriSnap = await getDocs(collection(db, COLLECTIONS.SANTRI));
      if (!santriSnap.empty) {
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
        localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));
      }

      // 3. Sync Ziyadah
      const ziyadahSnap = await getDocs(collection(db, COLLECTIONS.ZIYADAH));
      const ziyadahRecords: ZiyadahRecord[] = [];
      ziyadahSnap.forEach((docSnap) => {
        const data = docSnap.data() as ZiyadahRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) {
          ziyadahRecords.push({ ...data, id });
        }
      });
      ziyadahRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(ziyadahRecords));

      // 4. Sync Murojaah
      const murojaahSnap = await getDocs(collection(db, COLLECTIONS.MUROJAAH));
      const murojaahRecords: MurojaahRecord[] = [];
      murojaahSnap.forEach((docSnap) => {
        const data = docSnap.data() as MurojaahRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) {
          murojaahRecords.push({ ...data, id });
        }
      });
      murojaahRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(murojaahRecords));

      // 5. Sync Binnadzor
      const binnadzorSnap = await getDocs(collection(db, COLLECTIONS.BINNADZOR));
      const binnadzorRecords: BinnadzorRecord[] = [];
      binnadzorSnap.forEach((docSnap) => {
        const data = docSnap.data() as BinnadzorRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) {
          binnadzorRecords.push({ ...data, id });
        }
      });
      binnadzorRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(binnadzorRecords));

      // 6. Sync Pembelajaran
      const pembelajaranSnap = await getDocs(collection(db, COLLECTIONS.PEMBELAJARAN));
      const pembelajaranRecords: PembelajaranRecord[] = [];
      pembelajaranSnap.forEach((docSnap) => {
        const data = docSnap.data() as PembelajaranRecord;
        const id = data.id || docSnap.id;
        if (id && !deletedIds.has(id)) {
          pembelajaranRecords.push({ ...data, id });
        }
      });
      pembelajaranRecords.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(pembelajaranRecords));

      // 7. Sync Kelas
      const kelasSnap = await getDocs(collection(db, COLLECTIONS.KELAS));
      const kelasList: Kelas[] = [];
      kelasSnap.forEach((docSnap) => {
        const k = docSnap.data() as Kelas;
        if (k && k.id) {
          kelasList.push({ ...k, tipeKelas: normalizeTipeKelas(k.tipeKelas) });
        }
      });
      if (kelasList.length > 0) {
        localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(kelasList));
      }

      return { success: true };
    } catch (err) {
      console.error('syncWithCloud error:', err);
      return { success: false, message: (err as Error).message };
    }
  },

  async updateRecord(type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran', id: string, updatedData: Partial<ZiyadahRecord | MurojaahRecord | BinnadzorRecord | PembelajaranRecord>): Promise<boolean> {
    if (type === 'Ziyadah') {
      const records = this.getZiyadahRecords().map(r => r.id === id ? { ...r, ...updatedData } as ZiyadahRecord : r);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
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
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
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
      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(records));
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
      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(records));
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
    localStorage.setItem(STORAGE_KEYS.PANTAUAN_LIBURAN, JSON.stringify(records));

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
    const records = this.getPantauanLiburanRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.PANTAUAN_LIBURAN, JSON.stringify(records));
    return true;
  },

  async addSantri(santri: Santri, defaultPassword = '123'): Promise<Santri> {
    const list = this.getSantriList();
    // Check if santri already exists by idSantri
    const existingIndex = list.findIndex(s => s.idSantri === santri.idSantri);
    if (existingIndex >= 0) {
      list[existingIndex] = santri;
    } else {
      list.push(santri);
    }
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));

    // Automatically create Wali and Santri accounts for home and remote access
    const users = this.getUsers();
    
    // 1. Wali Account
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

    // 2. Santri View-Only Account (login via ID Santri)
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

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Sync to Firestore Cloud Database (Using clean objects to eliminate undefined)
    try {
      const cleanSantri = cleanForFirestore(santri);
      const cleanWaliUser = cleanForFirestore(waliUser);
      const cleanSantriUser = cleanForFirestore(santriUser);

      await setDoc(doc(db, COLLECTIONS.SANTRI, santri.idSantri), cleanSantri);
      await setDoc(doc(db, COLLECTIONS.USERS, waliUser.id), cleanWaliUser);
      await setDoc(doc(db, COLLECTIONS.USERS, santriUser.id), cleanSantriUser);
    } catch (e) {
      console.error('Failed to sync new Santri to Firestore:', e);
      throw e;
    }

    return santri;
  },

  async updateSantri(idSantri: string, updatedData: Partial<Santri>): Promise<boolean> {
    const list = this.getSantriList().map(s => {
      if (s.idSantri === idSantri) {
        return { ...s, ...updatedData };
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));

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

    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(this.getSantriList().filter(s => s.idSantri !== idSantri)));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.getUsers().filter(u => u.idSantri !== idSantri && u.username.toLowerCase() !== idSantri.toLowerCase())));

    if (deleteRelatedHistory) {
      ziyadahToDelete.forEach(r => this.markRecordDeleted(r.id));
      murojaahToDelete.forEach(r => this.markRecordDeleted(r.id));
      binnadzorToDelete.forEach(r => this.markRecordDeleted(r.id));
      pembelajaranToDelete.forEach(r => this.markRecordDeleted(r.id));
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(this.getZiyadahRecords().filter(r => r.idSantri !== idSantri)));
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(this.getMurojaahRecords().filter(r => r.idSantri !== idSantri)));
      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(this.getBinnadzorRecords().filter(r => r.idSantri !== idSantri)));
      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(this.getPembelajaranRecords().filter(r => r.idSantri !== idSantri)));
    }

    return true;
  },

  async addUser(user: User): Promise<User> {
    const users = this.getUsers();
    
    // Ensure unique ID if not provided or to prevent collisions
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

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Cloud Firestore save directly
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

    const users = this.getUsers().map(u => {
      if (u.id === id) {
        return { ...u, ...cleanUpdate };
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update active session if the edited user is currently logged in
    const currentSession = this.getSession();
    if (currentSession && currentSession.id === id) {
      this.setSession({ ...currentSession, ...cleanUpdate });
    }

    // Cloud Firestore update
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
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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

    // 1. Remove assigned santri from other classes if any (avoid multi-class duplication)
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
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list));
    try {
      await setDoc(doc(db, COLLECTIONS.KELAS, kelas.id), cleanForFirestore(kelas));
    } catch (e) {
      console.error('Failed to save Kelas to Firestore:', e);
      throw e;
    }

    // 2. Synchronize santri.kelas property
    const allSantri = this.getSantriList();
    let santriChanged = false;
    for (const s of allSantri) {
      if (assignedIds.has(s.idSantri)) {
        if (s.kelas !== kelas.namaKelas) {
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
    }
    if (santriChanged) {
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(allSantri));
    }

    return kelas;
  },

  async updateKelas(id: string, updatedData: Partial<Kelas>): Promise<boolean> {
    const list = this.getKelasList();
    const currentKelas = list.find(k => k.id === id);
    const oldSantriIds = new Set(currentKelas?.santriIds || []);
    const newSantriIds = updatedData.santriIds !== undefined ? new Set(updatedData.santriIds) : oldSantriIds;

    // 1. Remove newly assigned santri from other classes if any
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
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(updatedList));
    const target = updatedList.find(k => k.id === id);
    if (target) {
      try {
        await setDoc(doc(db, COLLECTIONS.KELAS, id), cleanForFirestore(target), { merge: true });
      } catch (e) {
        console.error('Failed to update Kelas in Firestore:', e);
        throw e;
      }
    }

    // 2. Synchronize santri.kelas
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
        // Removed from this class
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
    if (santriChanged) {
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(allSantri));
    }

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

    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list.filter(k => k.id !== id)));
    if (affectedSantriIds.size > 0) {
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(updatedSantri));
    }
    return true;
  },

  async resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
    localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(INITIAL_ZIYADAH));
    localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(INITIAL_MUROJAAH));
    localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(INITIAL_BINNADZOR));
    localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(INITIAL_PEMBELAJARAN));
    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify([]));
  }
};
