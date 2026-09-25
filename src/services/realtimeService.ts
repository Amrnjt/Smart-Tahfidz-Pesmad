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
import type { HistoryRangeRequest } from './historyQueryTypes';
import { db } from './firebase';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type QueryConstraint
} from 'firebase/firestore';
import {
  COLLECTIONS,
  STORAGE_KEYS,
  normalizeKelas,
  normalizeTipeKelas,
  writeArrayCache
} from './storageCore';
import { createDefaultAppConfig } from './academicPeriod';
import { consolidateBinnadzorClasses, isBinnadzorClass } from '../utils/classUtils';

export type RecentSetoranUpdate =
  | { type: 'ziyadah'; records: ZiyadahRecord[] }
  | { type: 'murojaah'; records: MurojaahRecord[] }
  | { type: 'binnadzor'; records: BinnadzorRecord[] }
  | { type: 'pembelajaran'; records: PembelajaranRecord[] };

export type PantauanLiburanSubscriptionRequest = {
  scope: { kind: 'student'; idSantri: string } | { kind: 'monitor' };
  maxRecords?: number;
};

export const realtimeService = {
  subscribeMasterData(onUpdate?: () => void): () => void {
    const notifyUpdate = () => onUpdate?.();

    const unsubUsers = onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
      const users: User[] = [];
      const userMap = new Map<string, User>();
      snapshot.forEach((docSnap) => {
        const user = docSnap.data() as User;
        if (user?.id && !userMap.has(user.id)) {
          userMap.set(user.id, user);
          users.push(user);
        }
      });
      writeArrayCache(STORAGE_KEYS.USERS, users);
      notifyUpdate();
    }, (err) => console.warn('Users firestore sync error:', err));

    const unsubSantri = onSnapshot(collection(db, COLLECTIONS.SANTRI), (snapshot) => {
      const santri: Santri[] = [];
      const santriMap = new Map<string, Santri>();
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Santri;
        if (item?.idSantri && !santriMap.has(item.idSantri)) {
          const normalized = { ...item, kelas: normalizeKelas(item.kelas) };
          santriMap.set(item.idSantri, normalized);
          santri.push(normalized);
        }
      });
      writeArrayCache(STORAGE_KEYS.SANTRI, santri);
      notifyUpdate();
    }, (err) => console.warn('Santri firestore sync error:', err));

    const unsubKelas = onSnapshot(collection(db, COLLECTIONS.KELAS), (snapshot) => {
      const kelasList: Kelas[] = [];
      const kelasMap = new Map<string, Kelas>();
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as Kelas;
        if (item?.id && !kelasMap.has(item.id)) {
          const normalized = { ...item, tipeKelas: normalizeTipeKelas(item.tipeKelas) };
          kelasMap.set(item.id, normalized);
          kelasList.push(normalized);
        }
      });
      const consolidated = consolidateBinnadzorClasses(
        kelasList.map(kelas => ({
          ...kelas,
          namaKelas: isBinnadzorClass(kelas) ? 'Binnadzor' : kelas.namaKelas,
        }))
      );
      writeArrayCache(STORAGE_KEYS.KELAS, consolidated);
      notifyUpdate();
    }, (err) => console.warn('Kelas firestore sync error:', err));

    const unsubAppConfig = onSnapshot(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), (docSnap) => {
      const config = docSnap.exists() ? docSnap.data() as AppConfig : createDefaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
      notifyUpdate();
    }, (err) => console.warn('AppConfig firestore sync error:', err));

    return () => {
      unsubUsers();
      unsubSantri();
      unsubKelas();
      unsubAppConfig();
    };
  },

  subscribePantauanLiburan(
    request: PantauanLiburanSubscriptionRequest,
    onUpdate?: (records: PantauanLiburanRecord[]) => void
  ): () => void {
    if (request.scope.kind === 'student' && !request.scope.idSantri.trim()) {
      console.warn('Pantauan Liburan subscription skipped because idSantri is empty.');
      writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, []);
      onUpdate?.([]);
      return () => undefined;
    }

    const constraints: QueryConstraint[] = request.scope.kind === 'student'
      ? [where('idSantri', '==', request.scope.idSantri)]
      : [orderBy('tanggal', 'desc'), limit(Math.max(1, request.maxRecords ?? 500))];

    return onSnapshot(
      query(collection(db, COLLECTIONS.PANTAUAN_LIBURAN), ...constraints),
      (snapshot) => {
        const records: PantauanLiburanRecord[] = [];
        const recordMap = new Map<string, PantauanLiburanRecord>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as PantauanLiburanRecord;
          const record = { ...data, id: data.id || docSnap.id };
          if (record.id && !recordMap.has(record.id)) {
            recordMap.set(record.id, record);
            records.push(record);
          }
        });
        records.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.timestamp.localeCompare(a.timestamp));
        writeArrayCache(STORAGE_KEYS.PANTAUAN_LIBURAN, records);
        onUpdate?.(records);
      },
      (err) => console.warn('Scoped Pantauan Liburan sync error:', err),
    );
  },

  subscribeRecentSetoran(
    request: HistoryRangeRequest,
    isDeletedRecord: (id: string) => boolean,
    onUpdate?: (update: RecentSetoranUpdate) => void
  ): () => void {
    if (request.scope.kind === 'student' && !request.scope.idSantri.trim()) {
      console.warn('Recent setoran subscription skipped because idSantri is empty.');
      return () => undefined;
    }

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

    const unsubZiyadah = onSnapshot(
      query(collection(db, COLLECTIONS.ZIYADAH), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as ZiyadahRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.ZIYADAH, records);
        onUpdate?.({ type: 'ziyadah', records });
      },
      (err) => console.warn('Bounded Ziyadah sync error:', err),
    );

    const unsubMurojaah = onSnapshot(
      query(collection(db, COLLECTIONS.MUROJAAH), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as MurojaahRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.MUROJAAH, records);
        onUpdate?.({ type: 'murojaah', records });
      },
      (err) => console.warn('Bounded Murojaah sync error:', err),
    );

    const unsubBinnadzor = onSnapshot(
      query(collection(db, COLLECTIONS.BINNADZOR), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as BinnadzorRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.BINNADZOR, records);
        onUpdate?.({ type: 'binnadzor', records });
      },
      (err) => console.warn('Bounded Binnadzor sync error:', err),
    );

    const unsubPembelajaran = onSnapshot(
      query(collection(db, COLLECTIONS.PEMBELAJARAN), ...buildConstraints()),
      (snapshot) => {
        const records = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as PembelajaranRecord;
          return { ...data, id: data.id || docSnap.id };
        }).filter(record => !isDeletedRecord(record.id));
        writeArrayCache(STORAGE_KEYS.PEMBELAJARAN, records);
        onUpdate?.({ type: 'pembelajaran', records });
      },
      (err) => console.warn('Bounded Pembelajaran sync error:', err),
    );

    return () => {
      unsubZiyadah();
      unsubMurojaah();
      unsubBinnadzor();
      unsubPembelajaran();
    };
  }
};
