import { User, Santri, ZiyadahRecord, MurojaahRecord } from '../types';
import { INITIAL_USERS, INITIAL_SANTRI, INITIAL_ZIYADAH, INITIAL_MUROJAAH } from '../data/sampleDatabase';
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
  SESSION: 'tahfidz_active_session_v2'
};

const COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  ZIYADAH: 'ziyadah',
  MUROJAAH: 'murojaah'
};

// Helper to remove any undefined fields before sending to Firestore
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const storageService = {
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
      return Array.isArray(parsed) ? parsed : INITIAL_SANTRI;
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
      return Array.isArray(parsed) ? parsed : INITIAL_ZIYADAH;
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
      return Array.isArray(parsed) ? parsed : INITIAL_MUROJAAH;
    } catch {
      return INITIAL_MUROJAAH;
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
        const usersToSync = [...INITIAL_USERS, ...localUsers];
        for (const user of usersToSync) {
          if (!remoteUserMap.has(user.id) && !remoteUserMap.has(user.username.toLowerCase())) {
            const cleanUser = cleanForFirestore(user);
            await setDoc(doc(db, COLLECTIONS.USERS, user.id), cleanUser).catch(console.error);
            remoteUserMap.set(user.id, user);
            remoteUserMap.set(user.username.toLowerCase(), user);
          }
        }

        // B. Migrate Santri
        const santriSnapshot = await getDocs(collection(db, COLLECTIONS.SANTRI));
        const remoteSantriMap = new Map<string, Santri>();
        santriSnapshot.forEach((docSnap) => {
          const s = docSnap.data() as Santri;
          if (s.idSantri) remoteSantriMap.set(s.idSantri, s);
        });

        const localSantri = this.getSantriList();
        const santriToSync = [...INITIAL_SANTRI, ...localSantri];
        for (const santri of santriToSync) {
          if (!remoteSantriMap.has(santri.idSantri)) {
            const cleanSantri = cleanForFirestore(santri);
            await setDoc(doc(db, COLLECTIONS.SANTRI, santri.idSantri), cleanSantri).catch(console.error);
            remoteSantriMap.set(santri.idSantri, santri);
          }
        }

        // C. Migrate Ziyadah & Murojaah records if any
        const ziyadahSnapshot = await getDocs(collection(db, COLLECTIONS.ZIYADAH));
        const remoteZiyadahMap = new Map<string, ZiyadahRecord>();
        ziyadahSnapshot.forEach((docSnap) => {
          const z = docSnap.data() as ZiyadahRecord;
          if (z.id) remoteZiyadahMap.set(z.id, z);
        });
        const localZiyadah = this.getZiyadahRecords();
        for (const z of localZiyadah) {
          if (!remoteZiyadahMap.has(z.id)) {
            await setDoc(doc(db, COLLECTIONS.ZIYADAH, z.id), cleanForFirestore(z)).catch(console.error);
            remoteZiyadahMap.set(z.id, z);
          }
        }

        const murojaahSnapshot = await getDocs(collection(db, COLLECTIONS.MUROJAAH));
        const remoteMurojaahMap = new Map<string, MurojaahRecord>();
        murojaahSnapshot.forEach((docSnap) => {
          const m = docSnap.data() as MurojaahRecord;
          if (m.id) remoteMurojaahMap.set(m.id, m);
        });
        const localMurojaah = this.getMurojaahRecords();
        for (const m of localMurojaah) {
          if (!remoteMurojaahMap.has(m.id)) {
            await setDoc(doc(db, COLLECTIONS.MUROJAAH, m.id), cleanForFirestore(m)).catch(console.error);
            remoteMurojaahMap.set(m.id, m);
          }
        }
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

        // Ensure default admin account is ALWAYS present
        const hasAdmin = users.some(u => u.username.toLowerCase() === 'admin');
        if (!hasAdmin) {
          const adminUser = INITIAL_USERS[0];
          users.unshift(adminUser);
          setDoc(doc(db, COLLECTIONS.USERS, adminUser.id), cleanForFirestore(adminUser)).catch(console.error);
        }

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
            santriMap.set(s.idSantri, s);
            santri.push(s);
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
      if (!snapshot.empty) {
        const records: ZiyadahRecord[] = [];
        const recordMap = new Map<string, ZiyadahRecord>();
        snapshot.forEach((docSnap) => {
          const r = docSnap.data() as ZiyadahRecord;
          if (r && r.id && !recordMap.has(r.id)) {
            recordMap.set(r.id, r);
            records.push(r);
          }
        });
        records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
        if (onUpdate) onUpdate();
      }
    }, (err) => {
      console.warn('Ziyadah firestore sync error:', err);
    });

    // 4. Sync Murojaah Realtime
    const unsubMurojaah = onSnapshot(collection(db, COLLECTIONS.MUROJAAH), (snapshot) => {
      if (!snapshot.empty) {
        const records: MurojaahRecord[] = [];
        const recordMap = new Map<string, MurojaahRecord>();
        snapshot.forEach((docSnap) => {
          const r = docSnap.data() as MurojaahRecord;
          if (r && r.id && !recordMap.has(r.id)) {
            recordMap.set(r.id, r);
            records.push(r);
          }
        });
        records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
        if (onUpdate) onUpdate();
      }
    }, (err) => {
      console.warn('Murojaah firestore sync error:', err);
    });

    return () => {
      unsubUsers();
      unsubSantri();
      unsubZiyadah();
      unsubMurojaah();
    };
  },

  async saveZiyadah(record: Omit<ZiyadahRecord, 'id'> & { timestamp?: string }): Promise<ZiyadahRecord> {
    const records = this.getZiyadahRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);
    
    let timestamp = record.timestamp;
    if (!timestamp) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
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
    }

    return newRecord;
  },

  async saveMurojaah(record: Omit<MurojaahRecord, 'id'> & { timestamp?: string }): Promise<MurojaahRecord> {
    const records = this.getMurojaahRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);
    
    let timestamp = record.timestamp;
    if (!timestamp) {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
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
    }

    return newRecord;
  },

  async deleteRecord(type: 'Ziyadah' | 'Murojaah', id: string): Promise<boolean> {
    if (type === 'Ziyadah') {
      const records = this.getZiyadahRecords().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
      try {
        await deleteDoc(doc(db, COLLECTIONS.ZIYADAH, id));
      } catch (e) {
        console.error('Failed to delete Ziyadah from Firestore:', e);
      }
    } else {
      const records = this.getMurojaahRecords().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
      try {
        await deleteDoc(doc(db, COLLECTIONS.MUROJAAH, id));
      } catch (e) {
        console.error('Failed to delete Murojaah from Firestore:', e);
      }
    }
    return true;
  },

  async updateRecord(type: 'Ziyadah' | 'Murojaah', id: string, updatedData: Partial<ZiyadahRecord | MurojaahRecord>): Promise<boolean> {
    if (type === 'Ziyadah') {
      const records = this.getZiyadahRecords().map(r => r.id === id ? { ...r, ...updatedData } as ZiyadahRecord : r);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
      const target = records.find(r => r.id === id);
      if (target) {
        try {
          await setDoc(doc(db, COLLECTIONS.ZIYADAH, id), cleanForFirestore(target), { merge: true });
        } catch (e) {
          console.error('Failed to update Ziyadah in Firestore:', e);
        }
      }
    } else {
      const records = this.getMurojaahRecords().map(r => r.id === id ? { ...r, ...updatedData } as MurojaahRecord : r);
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
      const target = records.find(r => r.id === id);
      if (target) {
        try {
          await setDoc(doc(db, COLLECTIONS.MUROJAAH, id), cleanForFirestore(target), { merge: true });
        } catch (e) {
          console.error('Failed to update Murojaah in Firestore:', e);
        }
      }
    }
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
      }
    }
    return true;
  },

  async deleteSantri(idSantri: string, deleteRelatedHistory = true): Promise<boolean> {
    // 1. Remove from Santri list
    const santriList = this.getSantriList().filter(s => s.idSantri !== idSantri);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));

    // 2. Remove associated Wali and Santri user accounts
    const usersToDelete = this.getUsers().filter(u => u.idSantri === idSantri || u.username.toLowerCase() === idSantri.toLowerCase());
    const users = this.getUsers().filter(u => u.idSantri !== idSantri && u.username.toLowerCase() !== idSantri.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // 3. Clean up related Ziyadah and Murojaah records if requested
    let ziyadahToDelete: ZiyadahRecord[] = [];
    let murojaahToDelete: MurojaahRecord[] = [];

    if (deleteRelatedHistory) {
      ziyadahToDelete = this.getZiyadahRecords().filter(r => r.idSantri === idSantri);
      const ziyadah = this.getZiyadahRecords().filter(r => r.idSantri !== idSantri);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(ziyadah));

      murojaahToDelete = this.getMurojaahRecords().filter(r => r.idSantri === idSantri);
      const murojaah = this.getMurojaahRecords().filter(r => r.idSantri !== idSantri);
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(murojaah));
    }

    // Cloud Firestore delete
    try {
      await deleteDoc(doc(db, COLLECTIONS.SANTRI, idSantri));
      for (const u of usersToDelete) {
        await deleteDoc(doc(db, COLLECTIONS.USERS, u.id));
      }
      if (deleteRelatedHistory) {
        for (const z of ziyadahToDelete) {
          await deleteDoc(doc(db, COLLECTIONS.ZIYADAH, z.id));
        }
        for (const m of murojaahToDelete) {
          await deleteDoc(doc(db, COLLECTIONS.MUROJAAH, m.id));
        }
      }
    } catch (e) {
      console.error('Failed to delete Santri from Firestore:', e);
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
      idSantri: user.role === 'Ustadz' ? '' : (user.idSantri || '')
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
      }
    }

    return true;
  },

  async deleteUser(id: string): Promise<boolean> {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Cloud Firestore delete
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, id));
    } catch (e) {
      console.error('Failed to delete User from Firestore:', e);
    }

    return true;
  },

  getSession(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!data) return null;
    try {
      return JSON.parse(data);
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

  async resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
    localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(INITIAL_ZIYADAH));
    localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(INITIAL_MUROJAAH));
  }
};
