import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, PantauanLiburanRecord, AppConfig, TrashRecord, CombinedHistoryItem, RiwayatAkademikRecord, SemesterAkademik, KenaikanKelasFormalRecord, KelasFormal } from '../types';
import { getTodayInputFormat, getCurrentTimeInputFormat } from '../utils/dateFormatter';
import type { HistoryRangeRequest } from './historyQueryTypes';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  type QueryConstraint
} from 'firebase/firestore';
import {
  COLLECTIONS,
  STORAGE_KEYS,
  cleanForFirestore,
  deduplicateById,
  normalizeKelas,
  normalizeTipeKelas,
  readArrayCache,
  writeArrayCache
} from './storageCore';
import {
  createDefaultAppConfig,
  getNextTahunPelajaran,
  isValidTahunPelajaran
} from './academicPeriod';
import {
  realtimeService,
  type PantauanLiburanSubscriptionRequest,
  type RecentSetoranUpdate
} from './realtimeService';
import {
  consolidateBinnadzorClasses,
  getKelasPengampuIds,
  isBinnadzorClass
} from '../utils/classUtils';

type StudentSetoranRecord = {
  id: string;
  idSantri: string;
  timestamp: string;
};

async function fetchLatestSetoranRecord<T extends StudentSetoranRecord>(
  collectionName: string,
  idSantri: string,
  localRecords: T[]
): Promise<T | null> {
  if (!idSantri) return null;

  try {
    const latestQuery = query(
      collection(db, collectionName),
      where('idSantri', '==', idSantri),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(latestQuery);
    const latestDoc = snapshot.docs[0];
    if (latestDoc) {
      const data = latestDoc.data() as T;
      return { ...data, id: data.id || latestDoc.id };
    }
  } catch (error) {
    console.warn(`Latest setoran lookup failed for ${collectionName}, falling back to cache:`, error);
  }

  return localRecords
    .filter(record => record.idSantri === idSantri)
    .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))[0] || null;
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
    const normalized = readArrayCache<Kelas>(STORAGE_KEYS.KELAS).map((k) => ({
      ...k,
      namaKelas: isBinnadzorClass(k) ? 'Binnadzor' : k.namaKelas,
      tipeKelas: normalizeTipeKelas(k.tipeKelas)
    }));
    return consolidateBinnadzorClasses(normalized);
  },

  async consolidateLegacyBinnadzorClasses(): Promise<{
    changed: boolean;
    mergedClassCount: number;
    normalizedSantriCount: number;
  }> {
    // This is a one-time master-data migration, so keep it Superadmin-only.
    this.assertCanManageAccounts();
    this.assertCanMutate('Gabungkan kelas Binnadzor');

    const [kelasSnap, santriSnap, userSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.KELAS)),
      getDocs(collection(db, COLLECTIONS.SANTRI)),
      getDocs(collection(db, COLLECTIONS.USERS)),
    ]);

    const rawKelas: Kelas[] = kelasSnap.docs.map(docSnap => {
      const data = docSnap.data() as Kelas;
      return { ...data, id: data.id || docSnap.id };
    });
    const candidates = rawKelas.filter(isBinnadzorClass);
    const candidateIds = new Set(candidates.map(kelas => kelas.id));
    const candidateSantriIds = new Set(
      candidates.flatMap(kelas => kelas.santriIds || []).filter(Boolean)
    );

    const rawSantri: Santri[] = santriSnap.docs.map(docSnap => {
      const data = docSnap.data() as Santri;
      return { ...data, idSantri: data.idSantri || docSnap.id };
    });
    const targetSantriIds = new Set<string>(candidateSantriIds);
    rawSantri.forEach(santri => {
      if (normalizeKelas(santri.kelas) === 'Binnadzor') {
        targetSantriIds.add(santri.idSantri);
      }
    });

    if (candidates.length === 0 && targetSantriIds.size === 0) {
      return { changed: false, mergedClassCount: 0, normalizedSantriCount: 0 };
    }

    let canonical = candidates.length > 0
      ? consolidateBinnadzorClasses(rawKelas).find(isBinnadzorClass)
      : undefined;

    if (!canonical) {
      const preferredId = 'KLS-BINNADZOR';
      const idTaken = rawKelas.some(kelas => kelas.id === preferredId);
      canonical = {
        id: idTaken ? `${preferredId}-${Date.now()}` : preferredId,
        namaKelas: 'Binnadzor',
        tipeKelas: 'Binnadzor',
        musyrif: '',
        musyrifIds: [],
        santriIds: [],
        silabusMateri: [],
        createdAt: new Date().toISOString(),
      };
    }

    canonical = {
      ...canonical,
      namaKelas: 'Binnadzor',
      tipeKelas: 'Binnadzor',
      santriIds: Array.from(targetSantriIds),
    };

    const canonicalId = canonical.id;
    const removedClassIds = candidates
      .map(kelas => kelas.id)
      .filter(id => id !== canonicalId);

    const canonicalSource = candidates.find(kelas => kelas.id === canonicalId);
    const canonicalSourceSantri = new Set(canonicalSource?.santriIds || []);
    const membershipChanged =
      canonicalSourceSantri.size !== targetSantriIds.size
      || Array.from(targetSantriIds).some(id => !canonicalSourceSantri.has(id));

    const classNeedsRewrite =
      candidates.length !== 1
      || !canonicalSource
      || canonicalSource.namaKelas.trim().toLowerCase() !== 'binnadzor'
      || String(canonicalSource.tipeKelas || '').trim().toLowerCase() !== 'binnadzor'
      || membershipChanged;

    const santriToNormalize = rawSantri.filter(
      santri => targetSantriIds.has(santri.idSantri) && santri.kelas.trim() !== 'Binnadzor'
    );

    const rawUsers: User[] = userSnap.docs.map(docSnap => {
      const data = docSnap.data() as User;
      return { ...data, id: data.id || docSnap.id };
    });
    const usersToNormalize = rawUsers.filter(
      user => Boolean(user.kelasId) && removedClassIds.includes(user.kelasId || '')
    );

    const changed =
      classNeedsRewrite
      || removedClassIds.length > 0
      || santriToNormalize.length > 0
      || usersToNormalize.length > 0;

    if (!changed) {
      return {
        changed: false,
        mergedClassCount: candidates.length,
        normalizedSantriCount: 0,
      };
    }

    const operationCount =
      1 + removedClassIds.length + santriToNormalize.length + usersToNormalize.length;
    if (operationCount > 450) {
      throw new Error('Migrasi kelas Binnadzor terlalu besar untuk satu operasi Cloud.');
    }

    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.KELAS, canonicalId), cleanForFirestore(canonical));
    removedClassIds.forEach(id => {
      batch.delete(doc(db, COLLECTIONS.KELAS, id));
    });
    santriToNormalize.forEach(santri => {
      batch.set(
        doc(db, COLLECTIONS.SANTRI, santri.idSantri),
        { kelas: 'Binnadzor' },
        { merge: true }
      );
    });
    usersToNormalize.forEach(user => {
      batch.set(
        doc(db, COLLECTIONS.USERS, user.id),
        { kelasId: canonicalId },
        { merge: true }
      );
    });
    await batch.commit();

    const nextKelas = [
      ...rawKelas.filter(kelas => !candidateIds.has(kelas.id)),
      canonical,
    ];
    writeArrayCache(STORAGE_KEYS.KELAS, nextKelas);

    const nextSantri = rawSantri.map(santri =>
      targetSantriIds.has(santri.idSantri)
        ? { ...santri, kelas: 'Binnadzor' }
        : santri
    );
    writeArrayCache(STORAGE_KEYS.SANTRI, nextSantri);

    const removedIdSet = new Set(removedClassIds);
    const nextUsers = rawUsers.map(user =>
      user.kelasId && removedIdSet.has(user.kelasId)
        ? { ...user, kelasId: canonicalId }
        : user
    );
    writeArrayCache(STORAGE_KEYS.USERS, nextUsers);

    return {
      changed: true,
      mergedClassCount: Math.max(1, candidates.length),
      normalizedSantriCount: santriToNormalize.length,
    };
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
        ? { ...createDefaultAppConfig(), ...parsed }
        : createDefaultAppConfig();
    } catch {
      return createDefaultAppConfig();
    }
  },

  getPantauanLiburanRecords(): PantauanLiburanRecord[] {
    return readArrayCache<PantauanLiburanRecord>(STORAGE_KEYS.PANTAUAN_LIBURAN);
  },

  async setAcademicPeriod(
    tahunPelajaran: string,
    semester: SemesterAkademik,
    updatedBy: string = 'Ustadz / Admin'
  ): Promise<AppConfig> {
    this.assertCanMutate('Ubah periode akademik');
    const cleanYear = tahunPelajaran.trim();
    if (!isValidTahunPelajaran(cleanYear)) {
      throw new Error('Tahun pelajaran harus berformat YYYY/YYYY dan tahun kedua harus berurutan.');
    }

    const updated: AppConfig = {
      ...this.getAppConfig(),
      tahunPelajaranAktif: cleanYear,
      semesterAkademikAktif: semester,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    await setDoc(doc(db, COLLECTIONS.APP_CONFIG, 'global_settings'), cleanForFirestore(updated), { merge: true });
    localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(updated));
    return updated;
  },

  async upsertAcademicHistory(
    santri: Santri,
    recordedBy: string = 'Ustadz / Admin'
  ): Promise<RiwayatAkademikRecord | null> {
    this.assertCanMutate('Simpan riwayat akademik');
    if (!santri.satuanPendidikan || !santri.kelasFormal) return null;

    const config = this.getAppConfig();
    const tahunPelajaran = config.tahunPelajaranAktif || createDefaultAppConfig().tahunPelajaranAktif!;
    const semester = config.semesterAkademikAktif || createDefaultAppConfig().semesterAkademikAktif!;
    const safeYear = tahunPelajaran.replace('/', '-');
    const id = `${santri.idSantri}_${safeYear}_${semester.toLowerCase()}`;

    const record: RiwayatAkademikRecord = {
      id,
      idSantri: santri.idSantri,
      namaSantri: santri.namaSantri,
      satuanPendidikan: santri.satuanPendidikan,
      kelasFormal: santri.kelasFormal,
      kelasAlQuran: santri.kelas || '',
      tahunPelajaran,
      semester,
      statusAkademikFormal: santri.statusAkademikFormal || 'Aktif',
      recordedAt: new Date().toISOString(),
      recordedBy
    };

    await setDoc(doc(db, COLLECTIONS.ACADEMIC_HISTORY, id), cleanForFirestore(record), { merge: true });
    return record;
  },

  async fetchAcademicHistory(idSantri?: string): Promise<RiwayatAkademikRecord[]> {
    const source = idSantri
      ? query(collection(db, COLLECTIONS.ACADEMIC_HISTORY), where('idSantri', '==', idSantri))
      : collection(db, COLLECTIONS.ACADEMIC_HISTORY);
    const snapshot = await getDocs(source);
    const records = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as RiwayatAkademikRecord;
      return { ...data, id: data.id || docSnap.id };
    });

    const semesterRank: Record<SemesterAkademik, number> = { Ganjil: 1, Genap: 2 };
    return records.sort((a, b) =>
      b.tahunPelajaran.localeCompare(a.tahunPelajaran) ||
      semesterRank[b.semester] - semesterRank[a.semester] ||
      b.recordedAt.localeCompare(a.recordedAt)
    );
  },

  async fetchAcademicHistoryByPeriod(
    tahunPelajaran: string,
    semester?: SemesterAkademik
  ): Promise<RiwayatAkademikRecord[]> {
    const constraints: QueryConstraint[] = [
      where('tahunPelajaran', '==', tahunPelajaran.trim())
    ];
    if (semester) {
      constraints.push(where('semester', '==', semester));
    }

    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ACADEMIC_HISTORY), ...constraints)
    );
    const records = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as RiwayatAkademikRecord;
      return { ...data, id: data.id || docSnap.id };
    });

    const semesterRank: Record<SemesterAkademik, number> = { Ganjil: 1, Genap: 2 };
    return records.sort((a, b) =>
      a.namaSantri.localeCompare(b.namaSantri, 'id') ||
      semesterRank[a.semester] - semesterRank[b.semester] ||
      a.recordedAt.localeCompare(b.recordedAt)
    );
  },

  async getFormalPromotionRun(
    tahunPelajaranAsal: string,
    kelasAsal: KelasFormal
  ): Promise<KenaikanKelasFormalRecord | null> {
    const id = `${tahunPelajaranAsal.replace('/', '-')}_${kelasAsal}`;
    const snapshot = await getDoc(doc(db, COLLECTIONS.ACADEMIC_PROMOTIONS, id));
    if (!snapshot.exists()) return null;
    return snapshot.data() as KenaikanKelasFormalRecord;
  },

  async promoteFormalCohort(
    kelasAsal: KelasFormal,
    processedBy: string = 'Ustadz / Admin'
  ): Promise<KenaikanKelasFormalRecord> {
    this.assertCanMutate(kelasAsal === 'IX' ? 'Luluskan kelas formal IX' : 'Naikkan kelas formal');

    const config = this.getAppConfig();
    const tahunPelajaranAsal = config.tahunPelajaranAktif || '';
    const semester = config.semesterAkademikAktif;
    if (!isValidTahunPelajaran(tahunPelajaranAsal)) {
      throw new Error('Tahun pelajaran aktif belum valid.');
    }
    if (semester !== 'Genap') {
      throw new Error('Kenaikan kelas formal hanya dapat diproses pada Semester Genap.');
    }

    const tahunPelajaranTujuan = getNextTahunPelajaran(tahunPelajaranAsal);
    const kelasTujuan: KelasFormal | 'Lulus' =
      kelasAsal === 'VII' ? 'VIII' :
      kelasAsal === 'VIII' ? 'IX' :
      'Lulus';

    const promotionId = `${tahunPelajaranAsal.replace('/', '-')}_${kelasAsal}`;
    const promotionRef = doc(db, COLLECTIONS.ACADEMIC_PROMOTIONS, promotionId);
    const existingPromotion = await getDoc(promotionRef);
    if (existingPromotion.exists()) {
      throw new Error(`Kelas ${kelasAsal} sudah diproses untuk Tahun Pelajaran ${tahunPelajaranAsal}.`);
    }

    const cloudSantriSnapshot = await getDocs(collection(db, COLLECTIONS.SANTRI));
    const candidates = cloudSantriSnapshot.docs
      .map(docSnap => docSnap.data() as Santri)
      .filter(santri =>
        santri.satuanPendidikan === 'MTs' &&
        santri.kelasFormal === kelasAsal &&
        (santri.statusAkademikFormal || 'Aktif') === 'Aktif'
      );

    if (candidates.length === 0) {
      throw new Error(`Tidak ada santri aktif kelas ${kelasAsal} yang dapat diproses.`);
    }
    if (candidates.length > 150) {
      throw new Error('Jumlah santri dalam satu angkatan melebihi batas aman batch. Pecah proses sebelum melanjutkan.');
    }

    const processedAt = new Date().toISOString();
    const sourceSafeYear = tahunPelajaranAsal.replace('/', '-');
    const targetSafeYear = tahunPelajaranTujuan.replace('/', '-');
    const batch = writeBatch(db);

    for (const santri of candidates) {
      const sourceHistoryId = `${santri.idSantri}_${sourceSafeYear}_genap`;
      const sourceHistory: RiwayatAkademikRecord = {
        id: sourceHistoryId,
        idSantri: santri.idSantri,
        namaSantri: santri.namaSantri,
        satuanPendidikan: 'MTs',
        kelasFormal: kelasAsal,
        kelasAlQuran: santri.kelas || '',
        tahunPelajaran: tahunPelajaranAsal,
        semester: 'Genap',
        statusAkademikFormal: kelasAsal === 'IX' ? 'Lulus' : 'Aktif',
        recordedAt: processedAt,
        recordedBy: processedBy
      };
      batch.set(doc(db, COLLECTIONS.ACADEMIC_HISTORY, sourceHistoryId), cleanForFirestore(sourceHistory), { merge: true });

      if (kelasTujuan === 'Lulus') {
        batch.set(doc(db, COLLECTIONS.SANTRI, santri.idSantri), cleanForFirestore({
          statusAkademikFormal: 'Lulus',
          tahunLulus: tahunPelajaranAsal.split('/')[1],
          tanggalLulus: processedAt
        }), { merge: true });
      } else {
        batch.set(doc(db, COLLECTIONS.SANTRI, santri.idSantri), cleanForFirestore({
          kelasFormal: kelasTujuan,
          statusAkademikFormal: 'Aktif',
          tahunLulus: '',
          tanggalLulus: ''
        }), { merge: true });

        const targetHistoryId = `${santri.idSantri}_${targetSafeYear}_ganjil`;
        const targetHistory: RiwayatAkademikRecord = {
          id: targetHistoryId,
          idSantri: santri.idSantri,
          namaSantri: santri.namaSantri,
          satuanPendidikan: 'MTs',
          kelasFormal: kelasTujuan,
          kelasAlQuran: santri.kelas || '',
          tahunPelajaran: tahunPelajaranTujuan,
          semester: 'Ganjil',
          statusAkademikFormal: 'Aktif',
          recordedAt: processedAt,
          recordedBy: processedBy
        };
        batch.set(doc(db, COLLECTIONS.ACADEMIC_HISTORY, targetHistoryId), cleanForFirestore(targetHistory), { merge: true });
      }
    }

    const promotionRecord: KenaikanKelasFormalRecord = {
      id: promotionId,
      satuanPendidikan: 'MTs',
      kelasAsal,
      kelasTujuan,
      tahunPelajaranAsal,
      tahunPelajaranTujuan,
      jumlahSantri: candidates.length,
      idSantri: candidates.map(santri => santri.idSantri),
      processedAt,
      processedBy
    };
    batch.set(promotionRef, cleanForFirestore(promotionRecord));

    await batch.commit();

    const promotedIds = new Set(candidates.map(santri => santri.idSantri));
    const localSantri = this.getSantriList().map(santri => {
      if (!promotedIds.has(santri.idSantri)) return santri;
      if (kelasTujuan === 'Lulus') {
        return {
          ...santri,
          statusAkademikFormal: 'Lulus' as const,
          tahunLulus: tahunPelajaranAsal.split('/')[1],
          tanggalLulus: processedAt
        };
      }
      return {
        ...santri,
        kelasFormal: kelasTujuan,
        statusAkademikFormal: 'Aktif' as const,
        tahunLulus: '',
        tanggalLulus: ''
      };
    });
    writeArrayCache(STORAGE_KEYS.SANTRI, localSantri);

    return promotionRecord;
  },

  subscribeMasterData(onUpdate?: () => void): () => void {
    return realtimeService.subscribeMasterData(onUpdate);
  },

  subscribePantauanLiburan(
    request: PantauanLiburanSubscriptionRequest,
    onUpdate?: (records: PantauanLiburanRecord[]) => void
  ): () => void {
    return realtimeService.subscribePantauanLiburan(request, onUpdate);
  },

  subscribeRecentSetoran(
    request: HistoryRangeRequest,
    onUpdate?: (update: RecentSetoranUpdate) => void
  ): () => void {
    return realtimeService.subscribeRecentSetoran(
      request,
      (id) => this.isDeletedRecord(id),
      onUpdate
    );
  },

  async getLatestZiyadahForSantri(idSantri: string): Promise<ZiyadahRecord | null> {
    return fetchLatestSetoranRecord(
      COLLECTIONS.ZIYADAH,
      idSantri,
      this.getZiyadahRecords()
    );
  },

  async getLatestMurojaahForSantri(idSantri: string): Promise<MurojaahRecord | null> {
    return fetchLatestSetoranRecord(
      COLLECTIONS.MUROJAAH,
      idSantri,
      this.getMurojaahRecords()
    );
  },

  async getLatestBinnadzorForSantri(idSantri: string): Promise<BinnadzorRecord | null> {
    return fetchLatestSetoranRecord(
      COLLECTIONS.BINNADZOR,
      idSantri,
      this.getBinnadzorRecords()
    );
  },

  async getLatestPembelajaranForSantri(idSantri: string): Promise<PembelajaranRecord | null> {
    return fetchLatestSetoranRecord(
      COLLECTIONS.PEMBELAJARAN,
      idSantri,
      this.getPembelajaranRecords()
    );
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
      const consolidatedKelas = consolidateBinnadzorClasses(
        kelasList.map(kelas => ({
          ...kelas,
          namaKelas: isBinnadzorClass(kelas) ? 'Binnadzor' : kelas.namaKelas,
        }))
      );
      writeArrayCache(STORAGE_KEYS.KELAS, consolidatedKelas);

      const config = appConfigSnap.exists() ? appConfigSnap.data() as AppConfig : createDefaultAppConfig();
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));

      return { success: true };
    } catch (err) {
      console.error('syncWithCloud error:', err);
      return { success: false, message: (err as Error).message };
    }
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
    const users = this.getUsers();
    const normalizedId = santri.idSantri.trim().toLowerCase();
    const waliUsername = `wali_${normalizedId}`;

    const existingSantri = list.find(
      item => item.idSantri.trim().toLowerCase() === normalizedId
    );
    if (existingSantri) {
      throw new Error(
        `ID/username "${santri.idSantri}" sudah digunakan oleh santri ${existingSantri.namaSantri}.`
      );
    }

    const existingSantriAccount = users.find(
      user => user.username.trim().toLowerCase() === normalizedId
    );
    if (existingSantriAccount) {
      throw new Error(
        `Username "${santri.idSantri}" sudah digunakan oleh akun ${existingSantriAccount.nama}.`
      );
    }

    const existingWaliAccount = users.find(
      user => user.username.trim().toLowerCase() === waliUsername
    );
    if (existingWaliAccount) {
      throw new Error(
        `Username wali "${waliUsername}" sudah digunakan oleh akun ${existingWaliAccount.nama}.`
      );
    }

    list.push(santri);
    writeArrayCache(STORAGE_KEYS.SANTRI, list);
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

    const existingIndex = users.findIndex(
      current => current.username.trim().toLowerCase() === ensuredUser.username.toLowerCase()
    );
    if (existingIndex >= 0) {
      throw new Error(
        `Username "${ensuredUser.username}" sudah digunakan oleh akun ${users[existingIndex].nama}.`
      );
    }
    users.push(ensuredUser);

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

};
