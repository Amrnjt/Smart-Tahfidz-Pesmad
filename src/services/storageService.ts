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

export const storageService = {
  // Synchronous fallback getters from LocalStorage for instant UI response
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
      return JSON.parse(data);
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
      return JSON.parse(data);
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
      return JSON.parse(data);
    } catch {
      return INITIAL_MUROJAAH;
    }
  },

  // Real-time Firestore Listeners that automatically update localStorage & app state across all devices
  initRealtimeSync(onUpdate?: () => void): () => void {
    let initializedUsers = false;

    // Check if initial admin user needs to be seeded into Firestore
    getDocs(collection(db, COLLECTIONS.USERS)).then((snapshot) => {
      if (snapshot.empty) {
        // Seed INITIAL_USERS (admin & ustadz1) to Firestore
        INITIAL_USERS.forEach((u) => {
          setDoc(doc(db, COLLECTIONS.USERS, u.id), u).catch(console.error);
        });
      }
    }).catch(console.error);

    // 1. Sync Users
    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      if (!snapshot.empty) {
        const users: User[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as User);
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        if (onUpdate) onUpdate();
      } else if (!initializedUsers) {
        initializedUsers = true;
        INITIAL_USERS.forEach((u) => {
          setDoc(doc(db, COLLECTIONS.USERS, u.id), u).catch(console.error);
        });
      }
    }, (err) => {
      console.warn('Users firestore sync error:', err);
    });

    // 2. Sync Santri
    const unsubSantri = onSnapshot(collection(db, COLLECTIONS.SANTRI), (snapshot) => {
      const santri: Santri[] = [];
      snapshot.forEach((docSnap) => {
        santri.push(docSnap.data() as Santri);
      });
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santri));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Santri firestore sync error:', err);
    });

    // 3. Sync Ziyadah
    const unsubZiyadah = onSnapshot(collection(db, COLLECTIONS.ZIYADAH), (snapshot) => {
      const records: ZiyadahRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as ZiyadahRecord);
      });
      // Sort newest first
      records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Ziyadah firestore sync error:', err);
    });

    // 4. Sync Murojaah
    const unsubMurojaah = onSnapshot(collection(db, COLLECTIONS.MUROJAAH), (snapshot) => {
      const records: MurojaahRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as MurojaahRecord);
      });
      // Sort newest first
      records.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
      if (onUpdate) onUpdate();
    }, (err) => {
      console.warn('Murojaah firestore sync error:', err);
    });

    // Return cleanup function to unsubscribe from all listeners
    return () => {
      unsubUsers();
      unsubSantri();
      unsubZiyadah();
      unsubMurojaah();
    };
  },

  async saveZiyadah(record: Omit<ZiyadahRecord, 'id' | 'timestamp'>): Promise<ZiyadahRecord> {
    const records = this.getZiyadahRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);
    
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newRecord: ZiyadahRecord = {
      ...record,
      id: `ZYD-${Date.now().toString().slice(-6)}`,
      timestamp,
      namaSantri: santri?.namaSantri || record.idSantri
    };

    // 1. Optimistic Local Save
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));

    // 2. Cloud Firestore Save
    try {
      await setDoc(doc(db, COLLECTIONS.ZIYADAH, newRecord.id), newRecord);
    } catch (e) {
      console.error('Failed to save Ziyadah to Firestore:', e);
    }

    return newRecord;
  },

  async saveMurojaah(record: Omit<MurojaahRecord, 'id' | 'timestamp'>): Promise<MurojaahRecord> {
    const records = this.getMurojaahRecords();
    const santri = this.getSantriList().find(s => s.idSantri === record.idSantri);
    
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newRecord: MurojaahRecord = {
      ...record,
      id: `MRJ-${Date.now().toString().slice(-6)}`,
      timestamp,
      namaSantri: santri?.namaSantri || record.idSantri
    };

    // 1. Optimistic Local Save
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));

    // 2. Cloud Firestore Save
    try {
      await setDoc(doc(db, COLLECTIONS.MUROJAAH, newRecord.id), newRecord);
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
          await setDoc(doc(db, COLLECTIONS.ZIYADAH, id), target, { merge: true });
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
          await setDoc(doc(db, COLLECTIONS.MUROJAAH, id), target, { merge: true });
        } catch (e) {
          console.error('Failed to update Murojaah in Firestore:', e);
        }
      }
    }
    return true;
  },

  async addSantri(santri: Santri, defaultPassword = '123'): Promise<Santri> {
    const list = this.getSantriList();
    list.push(santri);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));

    // Automatically create Wali and Santri accounts for home and remote access
    const users = this.getUsers();
    
    // 1. Wali Account
    const waliUsername = `wali_${santri.idSantri.toLowerCase()}`;
    const existingWali = users.find(u => u.username.toLowerCase() === waliUsername.toLowerCase());
    const waliUser: User = existingWali || {
      id: `USR-WLI-${Date.now().toString().slice(-4)}-${santri.idSantri}`,
      username: waliUsername,
      password: defaultPassword,
      role: 'Wali',
      nama: santri.waliNama ? `Wali ${santri.namaSantri} (${santri.waliNama})` : `Wali ${santri.namaSantri}`,
      idSantri: santri.idSantri
    };
    if (!existingWali) {
      users.push(waliUser);
    }

    // 2. Santri View-Only Account (login via ID Santri)
    const existingSantriUser = users.find(u => u.username.toLowerCase() === santri.idSantri.toLowerCase());
    const santriUser: User = existingSantriUser || {
      id: `USR-STR-${Date.now().toString().slice(-4)}-${santri.idSantri}`,
      username: santri.idSantri,
      password: defaultPassword,
      role: 'Santri',
      nama: santri.namaSantri,
      idSantri: santri.idSantri
    };
    if (!existingSantriUser) {
      users.push(santriUser);
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Sync to Firestore Cloud Database
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, COLLECTIONS.SANTRI, santri.idSantri), santri);
      batch.set(doc(db, COLLECTIONS.USERS, waliUser.id), waliUser);
      batch.set(doc(db, COLLECTIONS.USERS, santriUser.id), santriUser);
      await batch.commit();
    } catch (e) {
      console.error('Failed to sync new Santri to Firestore:', e);
    }

    return santri;
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

    // Cloud Firestore batch delete
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, COLLECTIONS.SANTRI, idSantri));
      usersToDelete.forEach((u) => batch.delete(doc(db, COLLECTIONS.USERS, u.id)));
      if (deleteRelatedHistory) {
        ziyadahToDelete.forEach((z) => batch.delete(doc(db, COLLECTIONS.ZIYADAH, z.id)));
        murojaahToDelete.forEach((m) => batch.delete(doc(db, COLLECTIONS.MUROJAAH, m.id)));
      }
      await batch.commit();
    } catch (e) {
      console.error('Failed to delete Santri from Firestore:', e);
    }

    return true;
  },

  async addUser(user: User): Promise<User> {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Cloud Firestore save
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, user.id), user);
    } catch (e) {
      console.error('Failed to save User to Firestore:', e);
    }

    return user;
  },

  async updateUser(id: string, updatedData: Partial<User>): Promise<boolean> {
    const users = this.getUsers().map(u => {
      if (u.id === id) {
        return { ...u, ...updatedData };
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update active session if the edited user is currently logged in
    const currentSession = this.getSession();
    if (currentSession && currentSession.id === id) {
      this.setSession({ ...currentSession, ...updatedData });
    }

    // Cloud Firestore update
    const target = users.find(u => u.id === id);
    if (target) {
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, id), target, { merge: true });
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
