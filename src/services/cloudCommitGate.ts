import type {
  AppConfig,
  BinnadzorRecord,
  Kelas,
  MurojaahRecord,
  PantauanLiburanRecord,
  PembelajaranRecord,
  Santri,
  ZiyadahRecord
} from '../types';
import { getTodayInputFormat, getCurrentTimeInputFormat } from '../utils/dateFormatter';
import { db } from './firebase';
import { storageService } from './storageService';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

const STORAGE_KEYS = {
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

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function writeArrayCache<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function nowTimestamp(timestamp?: string): string {
  return timestamp || `${getTodayInputFormat()} ${getCurrentTimeInputFormat()}`;
}

/**
 * P0.3 Data Truth gate.
 *
 * Firestore is the commit gate for operational Tahfidz mutations. LocalStorage
 * is updated only after the Cloud write succeeds. Account lifecycle is
 * intentionally excluded here and is owned exclusively by P0.1's trusted
 * secureAccountBridge/server endpoints.
 */
export function installCloudCommitGate(): void {
  if (installed) return;
  installed = true;

  storageService.saveZiyadah = async (
    record: Omit<ZiyadahRecord, 'id'> & { timestamp?: string }
  ): Promise<ZiyadahRecord> => {
    const santri = storageService.getSantriList().find((s) => s.idSantri === record.idSantri);
    const newRecord: ZiyadahRecord = {
      ...record,
      id: `ZYD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: nowTimestamp(record.timestamp),
      namaSantri: santri?.namaSantri || record.idSantri
    };

    await setDoc(doc(db, COLLECTIONS.ZIYADAH, newRecord.id), cleanForFirestore(newRecord));

    const records = storageService.getZiyadahRecords();
    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.ZIYADAH, records);
    return newRecord;
  };

  storageService.saveMurojaah = async (
    record: Omit<MurojaahRecord, 'id'> & { timestamp?: string }
  ): Promise<MurojaahRecord> => {
    const santri = storageService.getSantriList().find((s) => s.idSantri === record.idSantri);
    const newRecord: MurojaahRecord = {
      ...record,
      id: `MRJ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: nowTimestamp(record.timestamp),
      namaSantri: santri?.namaSantri || record.idSantri
    };

    await setDoc(doc(db, COLLECTIONS.MUROJAAH, newRecord.id), cleanForFirestore(newRecord));

    const records = storageService.getMurojaahRecords();
    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.MUROJAAH, records);
    return newRecord;
  };

  storageService.saveBinnadzor = async (
    record: Omit<BinnadzorRecord, 'id'> & { timestamp?: string }
  ): Promise<BinnadzorRecord> => {
    const santri = storageService.getSantriList().find((s) => s.idSantri === record.idSantri);
    const newRecord: BinnadzorRecord = {
      ...record,
      id: `BND-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: nowTimestamp(record.timestamp),
      namaSantri: santri?.namaSantri || record.idSantri
    };

    await setDoc(doc(db, COLLECTIONS.BINNADZOR, newRecord.id), cleanForFirestore(newRecord));

    const records = storageService.getBinnadzorRecords();
    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.BINNADZOR, records);
    return newRecord;
  };

  storageService.savePembelajaran = async (
    record: Omit<PembelajaranRecord, 'id'> & { timestamp?: string }
  ): Promise<PembelajaranRecord> => {
    const santri = storageService.getSantriList().find((s) => s.idSantri === record.idSantri);
    const newRecord: PembelajaranRecord = {
      ...record,
      id: `PBL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: nowTimestamp(record.timestamp),
      namaSantri: santri?.namaSantri || record.idSantri
    };

    await setDoc(doc(db, COLLECTIONS.PEMBELAJARAN, newRecord.id), cleanForFirestore(newRecord));

    const records = storageService.getPembelajaranRecords();
    records.unshift(newRecord);
    writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records);
    return newRecord;
  };

  storageService.updateRecord = async (
    type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran',
    id: string,
    updatedData: Partial<ZiyadahRecord | MurojaahRecord | BinnadzorRecord | PembelajaranRecord>
  ): Promise<boolean> => {
    if (type === 'Ziyadah') {
      const records = storageService.getZiyadahRecords();
      const current = records.find((r) => r.id === id);
      if (!current) return false;
      const target = { ...current, ...updatedData } as ZiyadahRecord;
      await setDoc(doc(db, COLLECTIONS.ZIYADAH, id), cleanForFirestore(target), { merge: true });
      writeArrayCache(STORAGE_KEYS.ZIYADAH, records.map((r) => r.id === id ? target : r));
      return true;
    }

    if (type === 'Murojaah') {
      const records = storageService.getMurojaahRecords();
      const current = records.find((r) => r.id === id);
      if (!current) return false;
      const target = { ...current, ...updatedData } as MurojaahRecord;
      await setDoc(doc(db, COLLECTIONS.MUROJAAH, id), cleanForFirestore(target), { merge: true });
      writeArrayCache(STORAGE_KEYS.MUROJAAH, records.map((r) => r.id === id ? target : r));
      return true;
    }

    if (type === 'Pembelajaran') {
      const records = storageService.getPembelajaranRecords();
      const current = records.find((r) => r.id === id);
      if (!current) return false;
      const target = { ...current, ...updatedData } as PembelajaranRecord;
      await setDoc(doc(db, COLLECTIONS.PEMBELAJARAN, id), cleanForFirestore(target), { merge: true });
      writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records.map((r) => r.id === id ? target : r));
      return true;
    }

    const records = storageService.getBinnadzorRecords();
    const current = records.find((r) => r.id === id);
    if (!current) return false;
    const target = { ...current, ...updatedData } as BinnadzorRecord;
    await setDoc(doc(db, COLLECTIONS.BINNADZOR, id), cleanForFirestore(target), { merge: true });
    writeArrayCache(STORAGE_KEYS.BINNADZOR, records.map((r) => r.id === id ? target : r));
    return true;
  };

  storageService.setProgramLiburanActive = async (
    active: boolean,
    updatedBy: string = 'Ustadz / Admin'
  ): Promise<AppConfig> => {
    const updated: AppConfig = {
      ...storageService.getAppConfig(),
      programLiburanActive: active,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    await setDoc(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), cleanForFirestore(updated));
    localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(updated));
    return updated;
  };

  storageService.savePantauanLiburan = async (
    record: Omit<PantauanLiburanRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): Promise<PantauanLiburanRecord> => {
    const santri = storageService.getSantriList().find((s) => s.idSantri === record.idSantri);
    const newRecord: PantauanLiburanRecord = {
      ...record,
      id: record.id || `LBR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: nowTimestamp(record.timestamp),
      namaSantri: santri?.namaSantri || record.namaSantri || record.idSantri,
      kelas: santri?.kelas || record.kelas || ''
    };

    await setDoc(
      doc(db, COLLECTIONS.PANTAUAN_LIBURAN, newRecord.id),
      cleanForFirestore(newRecord)
    );

    const records = storageService.getPantauanLiburanRecords();
    const existingIndex = records.findIndex(
      (r) => r.id === newRecord.id || (r.idSantri === newRecord.idSantri && r.tanggal === newRecord.tanggal)
    );
    if (existingIndex >= 0) records[existingIndex] = newRecord;
    else records.unshift(newRecord);

    records.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp));
    writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, records);
    return newRecord;
  };

  storageService.updateSantri = async (
    idSantri: string,
    updatedData: Partial<Santri>
  ): Promise<boolean> => {
    const list = storageService.getSantriList();
    const current = list.find((s) => s.idSantri === idSantri);
    if (!current) return false;

    const target: Santri = { ...current, ...updatedData };
    await setDoc(doc(db, COLLECTIONS.SANTRI, idSantri), cleanForFirestore(target), { merge: true });
    writeArrayCache(STORAGE_KEYS.SANTRI, list.map((s) => s.idSantri === idSantri ? target : s));
    return true;
  };

  storageService.addKelas = async (kelas: Kelas): Promise<Kelas> => {
    const currentList = storageService.getKelasList();
    const nextList = currentList.map((k) => ({ ...k, santriIds: [...(k.santriIds || [])] }));
    const assignedIds = new Set(kelas.santriIds || []);
    const changedOtherClasses: Kelas[] = [];

    for (const k of nextList) {
      if (k.id === kelas.id) continue;
      const filtered = (k.santriIds || []).filter((id) => !assignedIds.has(id));
      if (filtered.length !== (k.santriIds || []).length) {
        k.santriIds = filtered;
        changedOtherClasses.push(k);
      }
    }

    const targetIndex = nextList.findIndex((k) => k.id === kelas.id);
    if (targetIndex >= 0) nextList[targetIndex] = kelas;
    else nextList.push(kelas);

    const allSantri = storageService.getSantriList().map((s) => ({ ...s }));
    const changedSantri: Santri[] = [];
    for (const s of allSantri) {
      if (assignedIds.has(s.idSantri) && s.kelas !== kelas.namaKelas) {
        s.kelas = kelas.namaKelas;
        changedSantri.push(s);
      }
    }

    const operationCount = 1 + changedOtherClasses.length + changedSantri.length;
    if (operationCount > 450) {
      throw new Error('Perubahan kelas terlalu besar untuk satu operasi Cloud.');
    }

    const batch = writeBatch(db);
    changedOtherClasses.forEach((k) => {
      batch.set(doc(db, COLLECTIONS.KELAS, k.id), cleanForFirestore(k), { merge: true });
    });
    batch.set(doc(db, COLLECTIONS.KELAS, kelas.id), cleanForFirestore(kelas));
    changedSantri.forEach((s) => {
      batch.set(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });
    });
    await batch.commit();

    writeArrayCache(STORAGE_KEYS.KELAS, nextList);
    if (changedSantri.length > 0) writeArrayCache(STORAGE_KEYS.SANTRI, allSantri);
    return kelas;
  };

  storageService.updateKelas = async (
    id: string,
    updatedData: Partial<Kelas>
  ): Promise<boolean> => {
    const currentList = storageService.getKelasList();
    const currentKelas = currentList.find((k) => k.id === id);
    if (!currentKelas) return false;

    const oldSantriIds = new Set(currentKelas.santriIds || []);
    const target: Kelas = { ...currentKelas, ...updatedData };
    const newSantriIds = new Set(target.santriIds || []);
    const nextList = currentList.map((k) => ({ ...k, santriIds: [...(k.santriIds || [])] }));
    const changedOtherClasses: Kelas[] = [];

    if (updatedData.santriIds !== undefined) {
      for (const k of nextList) {
        if (k.id === id) continue;
        const filtered = (k.santriIds || []).filter((sid) => !newSantriIds.has(sid));
        if (filtered.length !== (k.santriIds || []).length) {
          k.santriIds = filtered;
          changedOtherClasses.push(k);
        }
      }
    }

    const targetIndex = nextList.findIndex((k) => k.id === id);
    nextList[targetIndex] = target;

    const allSantri = storageService.getSantriList().map((s) => ({ ...s }));
    const changedSantri: Santri[] = [];
    for (const s of allSantri) {
      if (newSantriIds.has(s.idSantri)) {
        if (s.kelas !== target.namaKelas) {
          s.kelas = target.namaKelas;
          changedSantri.push(s);
        }
      } else if (oldSantriIds.has(s.idSantri) && s.kelas !== '') {
        s.kelas = '';
        changedSantri.push(s);
      }
    }

    const operationCount = 1 + changedOtherClasses.length + changedSantri.length;
    if (operationCount > 450) {
      throw new Error('Perubahan kelas terlalu besar untuk satu operasi Cloud.');
    }

    const batch = writeBatch(db);
    changedOtherClasses.forEach((k) => {
      batch.set(doc(db, COLLECTIONS.KELAS, k.id), cleanForFirestore(k), { merge: true });
    });
    batch.set(doc(db, COLLECTIONS.KELAS, id), cleanForFirestore(target), { merge: true });
    changedSantri.forEach((s) => {
      batch.set(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });
    });
    await batch.commit();

    writeArrayCache(STORAGE_KEYS.KELAS, nextList);
    if (changedSantri.length > 0) writeArrayCache(STORAGE_KEYS.SANTRI, allSantri);
    return true;
  };
}
