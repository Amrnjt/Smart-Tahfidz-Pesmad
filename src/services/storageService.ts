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

  addSantri(santri: Santri): Santri {
    const list = this.getSantriList();
    list.push(santri);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));

    // Create Wali user automatically
    const users = this.getUsers();
    users.push({
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: santri.idSantri,
      password: '123',
      role: 'Wali',
      nama: `Wali ${santri.namaSantri}`,
      idSantri: santri.idSantri
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    return santri;
  },

  deleteSantri(idSantri: string, deleteRelatedHistory = true): boolean {
    // 1. Remove from Santri list
    const santriList = this.getSantriList().filter(s => s.idSantri !== idSantri);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));

    // 2. Remove associated Wali user account
    const users = this.getUsers().filter(u => u.idSantri !== idSantri && u.username !== idSantri);
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
