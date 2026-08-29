import { User, Santri, ZiyadahRecord, MurojaahRecord } from '../types';
import { INITIAL_USERS, INITIAL_SANTRI, INITIAL_ZIYADAH, INITIAL_MUROJAAH } from '../data/sampleDatabase';

const STORAGE_KEYS = {
  USERS: 'tahfidz_users_db',
  SANTRI: 'tahfidz_santri_db',
  ZIYADAH: 'tahfidz_ziyadah_db',
  MUROJAAH: 'tahfidz_murojaah_db',
  SESSION: 'tahfidz_active_session'
};

export const storageService = {
  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(data);
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

  saveZiyadah(record: Omit<ZiyadahRecord, 'id' | 'timestamp'>): ZiyadahRecord {
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

    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
    return newRecord;
  },

  saveMurojaah(record: Omit<MurojaahRecord, 'id' | 'timestamp'>): MurojaahRecord {
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

    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
    return newRecord;
  },

  deleteRecord(type: 'Ziyadah' | 'Murojaah', id: string): boolean {
    if (type === 'Ziyadah') {
      const records = this.getZiyadahRecords().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
    } else {
      const records = this.getMurojaahRecords().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
    }
    return true;
  },

  updateRecord(type: 'Ziyadah' | 'Murojaah', id: string, updatedData: Partial<ZiyadahRecord | MurojaahRecord>): boolean {
    if (type === 'Ziyadah') {
      const records = this.getZiyadahRecords().map(r => r.id === id ? { ...r, ...updatedData } as ZiyadahRecord : r);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(records));
    } else {
      const records = this.getMurojaahRecords().map(r => r.id === id ? { ...r, ...updatedData } as MurojaahRecord : r);
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(records));
    }
    return true;
  },

  addSantri(santri: Santri, defaultPassword = '123'): Santri {
    const list = this.getSantriList();
    list.push(santri);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));

    // Automatically create Wali and Santri accounts
    const users = this.getUsers();
    
    // 1. Wali Account
    const waliUsername = `wali_${santri.idSantri.toLowerCase()}`;
    if (!users.some(u => u.username.toLowerCase() === waliUsername.toLowerCase())) {
      users.push({
        id: `USR-WLI-${Date.now().toString().slice(-4)}`,
        username: waliUsername,
        password: defaultPassword,
        role: 'Wali',
        nama: santri.waliNama ? `Wali ${santri.namaSantri} (${santri.waliNama})` : `Wali ${santri.namaSantri}`,
        idSantri: santri.idSantri
      });
    }

    // 2. Santri View-Only Account (login via ID Santri)
    if (!users.some(u => u.username.toLowerCase() === santri.idSantri.toLowerCase())) {
      users.push({
        id: `USR-STR-${Date.now().toString().slice(-4)}`,
        username: santri.idSantri,
        password: defaultPassword,
        role: 'Santri',
        nama: santri.namaSantri,
        idSantri: santri.idSantri
      });
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return santri;
  },

  deleteSantri(idSantri: string, deleteRelatedHistory = true): boolean {
    // 1. Remove from Santri list
    const santriList = this.getSantriList().filter(s => s.idSantri !== idSantri);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));

    // 2. Remove associated Wali and Santri user accounts
    const users = this.getUsers().filter(u => u.idSantri !== idSantri && u.username.toLowerCase() !== idSantri.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // 3. Clean up related Ziyadah and Murojaah records if requested
    if (deleteRelatedHistory) {
      const ziyadah = this.getZiyadahRecords().filter(r => r.idSantri !== idSantri);
      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(ziyadah));

      const murojaah = this.getMurojaahRecords().filter(r => r.idSantri !== idSantri);
      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(murojaah));
    }

    return true;
  },

  addUser(user: User): User {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },

  updateUser(id: string, updatedData: Partial<User>): boolean {
    const users = this.getUsers().map(u => u.id === id ? { ...u, ...updatedData } : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  },

  deleteUser(id: string): boolean {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
    localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(INITIAL_ZIYADAH));
    localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(INITIAL_MUROJAAH));
  }
};
