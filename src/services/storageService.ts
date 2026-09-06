import { signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

import {
  User,
  Santri,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  Kelas,
  TipeKelas,
  WiridYaumiyyahRecord,
  PantauanLiburanRecord,
  ProgramPantauanConfig,
} from '../types';

import {
  INITIAL_SANTRI,
  INITIAL_ZIYADAH,
  INITIAL_MUROJAAH,
  INITIAL_BINNADZOR,
  INITIAL_PEMBELAJARAN,
} from '../data/sampleDatabase';

import { isAdminRole, isProtectedUser, isStaffRole } from '../utils/roles';
import { getClassGroup } from '../utils/classUtils';

import { db, auth, functions } from './firebase';

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  documentId,
  getDocFromServer,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';

/**
 * ============================================================
 * NORMALIZER
 * ============================================================
 */

function normalizeKelas(kelas: string): string {
  return getClassGroup(kelas);
}

function normalizeTipeKelas(tipe: string): TipeKelas {
  const normalized = (tipe || '').trim().toLowerCase();

  if (
    normalized.includes('tahfidz') ||
    normalized.includes('tahfiz')
  ) {
    return 'Tahfidz';
  }

  if (normalized.includes('binnadzor')) {
    return 'Binnadzor';
  }

  if (
    normalized.includes('jilid') ||
    normalized.includes('ummi')
  ) {
    return 'Jilid';
  }

  if (normalized.includes('istimewa')) {
    return 'Kelas Istimewa';
  }

  return 'Binnadzor';
}

/**
 * ============================================================
 * STORAGE KEYS
 * ============================================================
 */

const STORAGE_KEYS = {
  USERS: 'tahfidz_users_db_v2',
  SANTRI: 'tahfidz_santri_db_v2',
  ZIYADAH: 'tahfidz_ziyadah_db_v2',
  MUROJAAH: 'tahfidz_murojaah_db_v2',
  BINNADZOR: 'tahfidz_binnadzor_db_v2',
  PEMBELAJARAN: 'tahfidz_pembelajaran_db_v2',
  KELAS: 'tahfidz_kelas_db_v2',
  SESSION: 'tahfidz_active_session_v2',

  // Program Pantauan Liburan
  PANTAUAN_CONFIG: 'tahfidz_pantauan_config_v1',
  WIRID_YAUMIYYAH: 'tahfidz_wirid_yaumiyyah_v1',

  // Alias kompatibilitas versi lama
  PROGRAM_PANTAUAN_CONFIG: 'tahfidz_pantauan_config_v1',
  PANTAUAN_LIBURAN: 'tahfidz_wirid_yaumiyyah_v1',
};

/**
 * ============================================================
 * FIRESTORE COLLECTIONS
 * ============================================================
 */

const COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  ZIYADAH: 'ziyadah',
  MUROJAAH: 'murojaah',
  BINNADZOR: 'binnadzor',
  PEMBELAJARAN: 'pembelajaran',
  KELAS: 'kelas',

  // Program Pantauan Liburan
  PANTAUAN_CONFIG: 'pantauan_config',
  WIRID_YAUMIYYAH: 'wirid_yaumiyyah',

  // Alias kompatibilitas
  PROGRAM_PANTAUAN_CONFIG: 'pantauan_config',
  PANTAUAN_LIBURAN: 'wirid_yaumiyyah',
};

/**
 * Remove undefined values before sending data to Firestore.
 */
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function createTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * ============================================================
 * STORAGE SERVICE
 * ============================================================
 */

export const storageService = {
  /**
   * ==========================================================
   * AUTH
   * ==========================================================
   */

  async authenticate(
    usernameInput: string,
    passwordInput: string,
  ): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        message: 'Harap masukkan Username / ID Santri dan Password.',
      };
    }

    try {
      const login = httpsCallable<
        { username: string; password: string },
        { token: string; user: User }
      >(functions, 'loginAccount');

      const result = await login({
        username: cleanUser,
        password: cleanPass,
      });

      await signInWithCustomToken(auth, result.data.token);

      this.setSession(result.data.user);

      return {
        success: true,
        user: result.data.user,
      };
    } catch {
      return {
        success: false,
        message:
          'Login gagal. Periksa akun, koneksi, atau coba kembali beberapa saat lagi.',
      };
    }
  },

  /**
   * ==========================================================
   * USERS
   * ==========================================================
   */

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.USERS,
        JSON.stringify([]),
      );

      return [];
    }

    try {
      const parsed = JSON.parse(data);

      if (!Array.isArray(parsed)) {
        localStorage.setItem(
          STORAGE_KEYS.USERS,
          JSON.stringify([]),
        );

        return [];
      }

      return parsed;
    } catch {
      return [];
    }
  },

  /**
   * ==========================================================
   * SANTRI
   * ==========================================================
   */

  getSantriList(): Santri[] {
    const data = localStorage.getItem(STORAGE_KEYS.SANTRI);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.SANTRI,
        JSON.stringify(INITIAL_SANTRI),
      );

      return INITIAL_SANTRI;
    }

    try {
      const parsed = JSON.parse(data);

      if (!Array.isArray(parsed)) {
        return INITIAL_SANTRI;
      }

      return parsed.map((s: Santri) => ({
        ...s,
        kelas: normalizeKelas(s.kelas),
      }));
    } catch {
      return INITIAL_SANTRI;
    }
  },

  /**
   * ==========================================================
   * ZIYADAH
   * ==========================================================
   */

  getZiyadahRecords(): ZiyadahRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.ZIYADAH);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.ZIYADAH,
        JSON.stringify(INITIAL_ZIYADAH),
      );

      return INITIAL_ZIYADAH;
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed
        : INITIAL_ZIYADAH;
    } catch {
      return INITIAL_ZIYADAH;
    }
  },

  /**
   * ==========================================================
   * MUROJAAH
   * ==========================================================
   */

  getMurojaahRecords(): MurojaahRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.MUROJAAH);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.MUROJAAH,
        JSON.stringify(INITIAL_MUROJAAH),
      );

      return INITIAL_MUROJAAH;
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed
        : INITIAL_MUROJAAH;
    } catch {
      return INITIAL_MUROJAAH;
    }
  },

  /**
   * ==========================================================
   * BINNADZOR
   * ==========================================================
   */

  getBinnadzorRecords(): BinnadzorRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.BINNADZOR);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.BINNADZOR,
        JSON.stringify(INITIAL_BINNADZOR),
      );

      return INITIAL_BINNADZOR;
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed
        : INITIAL_BINNADZOR;
    } catch {
      return INITIAL_BINNADZOR;
    }
  },

  /**
   * ==========================================================
   * PEMBELAJARAN
   * ==========================================================
   */

  getPembelajaranRecords(): PembelajaranRecord[] {
    const data = localStorage.getItem(
      STORAGE_KEYS.PEMBELAJARAN,
    );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.PEMBELAJARAN,
        JSON.stringify(INITIAL_PEMBELAJARAN),
      );

      return INITIAL_PEMBELAJARAN;
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed
        : INITIAL_PEMBELAJARAN;
    } catch {
      return INITIAL_PEMBELAJARAN;
    }
  },

  /**
   * ==========================================================
   * KELAS
   * ==========================================================
   */

  getKelasList(): Kelas[] {
    const data = localStorage.getItem(STORAGE_KEYS.KELAS);

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.KELAS,
        JSON.stringify([]),
      );

      return [];
    }

    try {
      const parsed = JSON.parse(data);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((k: Kelas) => ({
        ...k,
        tipeKelas: normalizeTipeKelas(k.tipeKelas),
      }));
    } catch {
      return [];
    }
  },

  /**
   * ==========================================================
   * PROGRAM PANTAUAN LIBURAN
   * ==========================================================
   */

  async getPantauanConfig(): Promise<ProgramPantauanConfig> {
    const defaultConfig: ProgramPantauanConfig = {
      id: 'pantauan-config-001',
      isEnabled: false,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system',
    };

    try {
      const configDoc = await getDocFromServer(
        doc(
          db,
          COLLECTIONS.PANTAUAN_CONFIG,
          'pantauan-config-001',
        ),
      );

      if (configDoc.exists()) {
        const config =
          configDoc.data() as ProgramPantauanConfig;

        localStorage.setItem(
          STORAGE_KEYS.PANTAUAN_CONFIG,
          JSON.stringify(config),
        );

        return config;
      }
    } catch (err) {
      console.warn(
        'Failed to fetch Pantauan Config from Firestore:',
        err,
      );
    }

    const localData = localStorage.getItem(
      STORAGE_KEYS.PANTAUAN_CONFIG,
    );

    if (localData) {
      try {
        const parsed = JSON.parse(
          localData,
        ) as ProgramPantauanConfig;

        if (parsed?.id) {
          return parsed;
        }
      } catch {
        // Gunakan konfigurasi default.
      }
    }

    return defaultConfig;
  },

  /**
   * Versi sinkron untuk kompatibilitas komponen lama.
   */
  getProgramPantauanConfig(): ProgramPantauanConfig {
    const defaultConfig: ProgramPantauanConfig = {
      id: 'pantauan-config-001',
      isEnabled: false,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'system',
    };

    const data = localStorage.getItem(
      STORAGE_KEYS.PANTAUAN_CONFIG,
    );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.PANTAUAN_CONFIG,
        JSON.stringify(defaultConfig),
      );

      return defaultConfig;
    }

    try {
      const parsed = JSON.parse(data);

      return {
        ...defaultConfig,
        ...parsed,
      };
    } catch {
      return defaultConfig;
    }
  },

  async setPantauanConfig(
    config: ProgramPantauanConfig,
  ): Promise<void> {
    if (!isAdminRole(this.getSession()?.role)) {
      throw new Error(
        'Hanya admin yang dapat mengaktifkan atau menonaktifkan Program Pantauan.',
      );
    }

    const updatedConfig: ProgramPantauanConfig = {
      ...config,
      id: config.id || 'pantauan-config-001',
      lastUpdated: new Date().toISOString(),
      updatedBy:
        this.getSession()?.nama ||
        this.getSession()?.username ||
        config.updatedBy ||
        'Admin',
    };

    await setDoc(
      doc(
        db,
        COLLECTIONS.PANTAUAN_CONFIG,
        updatedConfig.id,
      ),
      cleanForFirestore(updatedConfig),
    );

    localStorage.setItem(
      STORAGE_KEYS.PANTAUAN_CONFIG,
      JSON.stringify(updatedConfig),
    );
  },

  /**
   * Alias kompatibilitas versi fitur sebelumnya.
   */
  async setProgramPantauanConfig(
    config: ProgramPantauanConfig,
  ): Promise<void> {
    return this.setPantauanConfig(config);
  },

  /**
   * ==========================================================
   * WIRID YAUMIYYAH / PANTAUAN HARIAN
   * ==========================================================
   */

  getWiridYaumiyyahRecords(): WiridYaumiyyahRecord[] {
    const data = localStorage.getItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
    );

    if (!data) {
      return [];
    }

    try {
      const parsed = JSON.parse(data);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  },

  /**
   * Alias kompatibilitas dengan nama sebelumnya.
   */
  getPantauanLiburanRecords(): PantauanLiburanRecord[] {
    return this.getWiridYaumiyyahRecords();
  },

  async saveWiridYaumiyyah(
    record: Omit<
      WiridYaumiyyahRecord,
      'id' | 'tanggal'
    > & {
      id?: string;
      tanggal?: string;
    },
  ): Promise<WiridYaumiyyahRecord> {
    const session = this.getSession();

    if (
      session?.role !== 'Wali' ||
      !session.idSantri ||
      session.idSantri !== record.idSantri
    ) {
      throw new Error(
        'Akses wali tidak sesuai dengan data santri.',
      );
    }

    const records = this.getWiridYaumiyyahRecords();

    const timestamp =
      record.timestamp || createTimestamp();

    const tanggal =
      record.tanggal ||
      timestamp.substring(0, 10);

    const santri = this.getSantriList().find(
      (s) => s.idSantri === record.idSantri,
    );

    const recordId =
      record.id ||
      `${encodeURIComponent(
        record.idSantri,
      )}_${tanggal}`;

    const newRecord: WiridYaumiyyahRecord = {
      ...record,
      id: recordId,
      tanggal,
      timestamp,
      inputBy: session.id,
      namaSantri:
        santri?.namaSantri ||
        record.namaSantri ||
        record.idSantri,
    };

    const existingIndex = records.findIndex(
      (r) =>
        r.idSantri === record.idSantri &&
        (
          r.tanggal === tanggal ||
          r.timestamp.startsWith(tanggal)
        ),
    );

    const updatedRecords = [...records];

    if (existingIndex >= 0) {
      updatedRecords[existingIndex] = newRecord;
    } else {
      updatedRecords.unshift(newRecord);
    }

    await runTransaction(db, async (transaction) => {
      const configRef = doc(
        db,
        COLLECTIONS.PANTAUAN_CONFIG,
        'pantauan-config-001',
      );

      const configSnapshot =
        await transaction.get(configRef);

      if (
        !configSnapshot.exists() ||
        configSnapshot.data()?.isEnabled !== true
      ) {
        throw new Error(
          'Program Pantauan Liburan sedang dinonaktifkan oleh Admin.',
        );
      }

      const recordRef = doc(
        db,
        COLLECTIONS.WIRID_YAUMIYYAH,
        newRecord.id,
      );

      transaction.set(
        recordRef,
        cleanForFirestore(newRecord),
      );
    });

    localStorage.setItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
      JSON.stringify(updatedRecords),
    );

    return newRecord;
  },

  /**
   * Alias untuk komponen lama.
   */
  async addPantauanLiburan(
    record: PantauanLiburanRecord,
  ): Promise<PantauanLiburanRecord> {
    const session = this.getSession();

    if (
      session?.role === 'Wali' &&
      session.idSantri === record.idSantri
    ) {
      return this.saveWiridYaumiyyah(record);
    }

    if (!isAdminRole(session?.role)) {
      throw new Error(
        'Anda tidak memiliki akses untuk menyimpan Program Pantauan.',
      );
    }

    const records =
      this.getWiridYaumiyyahRecords();

    const tanggal =
      record.tanggal ||
      record.timestamp.substring(0, 10);

    const normalizedRecord: PantauanLiburanRecord = {
      ...record,
      tanggal,
    };

    const index = records.findIndex(
      (r) => r.id === normalizedRecord.id,
    );

    if (index >= 0) {
      records[index] = normalizedRecord;
    } else {
      records.unshift(normalizedRecord);
    }

    await setDoc(
      doc(
        db,
        COLLECTIONS.WIRID_YAUMIYYAH,
        normalizedRecord.id,
      ),
      cleanForFirestore(normalizedRecord),
    );

    localStorage.setItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
      JSON.stringify(records),
    );

    return normalizedRecord;
  },

  getWiridYaumiyyahBySantri(
    idSantri: string,
  ): WiridYaumiyyahRecord[] {
    return this.getWiridYaumiyyahRecords()
      .filter(
        (record) =>
          record.idSantri === idSantri,
      )
      .sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp),
      );
  },

  async deletePantauanLiburan(
    id: string,
  ): Promise<boolean> {
    const session = this.getSession();

    const target =
      this.getWiridYaumiyyahRecords().find(
        (record) => record.id === id,
      );

    const hasAccess =
      isAdminRole(session?.role) ||
      (
        session?.role === 'Wali' &&
        session.idSantri &&
        target?.idSantri === session.idSantri
      );

    if (!hasAccess) {
      throw new Error(
        'Anda tidak memiliki akses untuk menghapus data pantauan ini.',
      );
    }

    const records =
      this.getWiridYaumiyyahRecords().filter(
        (record) => record.id !== id,
      );

    localStorage.setItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
      JSON.stringify(records),
    );

    try {
      await deleteDoc(
        doc(
          db,
          COLLECTIONS.WIRID_YAUMIYYAH,
          id,
        ),
      );
    } catch (err) {
      console.error(
        'Failed to delete Pantauan Liburan:',
        err,
      );

      throw err;
    }

    return true;
  },

  /**
   * ==========================================================
   * REALTIME FIRESTORE SYNC
   * ==========================================================
   */

  initRealtimeSync(
    onUpdate?: () => void,
  ): () => void {
    const seedAndMigrate = async () => {
      try {
        /**
         * SANTRI
         */
        const santriSnapshot = await getDocs(
          collection(db, COLLECTIONS.SANTRI),
        );

        const remoteSantriMap =
          new Map<string, Santri>();

        santriSnapshot.forEach((docSnap) => {
          const santri =
            docSnap.data() as Santri;

          if (santri.idSantri) {
            remoteSantriMap.set(
              santri.idSantri,
              santri,
            );
          }
        });

        const localSantri =
          this.getSantriList();

        const santriToSync = [
          ...INITIAL_SANTRI,
          ...localSantri,
        ];

        for (const santri of santriToSync) {
          if (
            !remoteSantriMap.has(
              santri.idSantri,
            )
          ) {
            await setDoc(
              doc(
                db,
                COLLECTIONS.SANTRI,
                santri.idSantri,
              ),
              cleanForFirestore(santri),
            ).catch(console.error);

            remoteSantriMap.set(
              santri.idSantri,
              santri,
            );
          }
        }

        /**
         * ZIYADAH
         */
        const ziyadahSnapshot = await getDocs(
          collection(db, COLLECTIONS.ZIYADAH),
        );

        const remoteZiyadahMap =
          new Map<string, ZiyadahRecord>();

        ziyadahSnapshot.forEach((docSnap) => {
          const record =
            docSnap.data() as ZiyadahRecord;

          if (record.id) {
            remoteZiyadahMap.set(
              record.id,
              record,
            );
          }
        });

        for (
          const record of this.getZiyadahRecords()
        ) {
          if (
            !remoteZiyadahMap.has(record.id)
          ) {
            await setDoc(
              doc(
                db,
                COLLECTIONS.ZIYADAH,
                record.id,
              ),
              cleanForFirestore(record),
            ).catch(console.error);
          }
        }

        /**
         * MUROJAAH
         */
        const murojaahSnapshot = await getDocs(
          collection(
            db,
            COLLECTIONS.MUROJAAH,
          ),
        );

        const remoteMurojaahMap =
          new Map<string, MurojaahRecord>();

        murojaahSnapshot.forEach(
          (docSnap) => {
            const record =
              docSnap.data() as MurojaahRecord;

            if (record.id) {
              remoteMurojaahMap.set(
                record.id,
                record,
              );
            }
          },
        );

        for (
          const record of this.getMurojaahRecords()
        ) {
          if (
            !remoteMurojaahMap.has(record.id)
          ) {
            await setDoc(
              doc(
                db,
                COLLECTIONS.MUROJAAH,
                record.id,
              ),
              cleanForFirestore(record),
            ).catch(console.error);
          }
        }

        /**
         * BINNADZOR
         */
        const binnadzorSnapshot = await getDocs(
          collection(
            db,
            COLLECTIONS.BINNADZOR,
          ),
        );

        const remoteBinnadzorMap =
          new Map<string, BinnadzorRecord>();

        binnadzorSnapshot.forEach(
          (docSnap) => {
            const record =
              docSnap.data() as BinnadzorRecord;

            if (record.id) {
              remoteBinnadzorMap.set(
                record.id,
                record,
              );
            }
          },
        );

        for (
          const record of this.getBinnadzorRecords()
        ) {
          if (
            !remoteBinnadzorMap.has(record.id)
          ) {
            await setDoc(
              doc(
                db,
                COLLECTIONS.BINNADZOR,
                record.id,
              ),
              cleanForFirestore(record),
            ).catch(console.error);
          }
        }

        /**
         * PEMBELAJARAN
         */
        const pembelajaranSnapshot =
          await getDocs(
            collection(
              db,
              COLLECTIONS.PEMBELAJARAN,
            ),
          );

        const remotePembelajaranMap =
          new Map<
            string,
            PembelajaranRecord
          >();

        pembelajaranSnapshot.forEach(
          (docSnap) => {
            const record =
              docSnap.data() as PembelajaranRecord;

            if (record.id) {
              remotePembelajaranMap.set(
                record.id,
                record,
              );
            }
          },
        );

        for (
          const record of this.getPembelajaranRecords()
        ) {
          if (
            !remotePembelajaranMap.has(
              record.id,
            )
          ) {
            await setDoc(
              doc(
                db,
                COLLECTIONS.PEMBELAJARAN,
                record.id,
              ),
              cleanForFirestore(record),
            ).catch(console.error);
          }
        }
      } catch (err) {
        console.warn(
          'Initial Firestore seeding/sync warning:',
          err,
        );
      }
    };

    void seedAndMigrate();

    /**
     * 1. USERS
     */
    const usersSource = isStaffRole(
      this.getSession()?.role,
    )
      ? collection(db, COLLECTIONS.USERS)
      : query(
          collection(db, COLLECTIONS.USERS),
          where(
            documentId(),
            '==',
            auth.currentUser?.uid ||
              '__none__',
          ),
        );

    const unsubUsers = onSnapshot(
      usersSource,
      (snapshot) => {
        const users: User[] = [];
        const userMap =
          new Map<string, User>();

        snapshot.forEach((docSnap) => {
          const user =
            docSnap.data() as User;

          if (
            user?.id &&
            !userMap.has(user.id)
          ) {
            userMap.set(user.id, user);
            users.push(user);
          }
        });

        localStorage.setItem(
          STORAGE_KEYS.USERS,
          JSON.stringify(users),
        );

        onUpdate?.();
      },
      (err) => {
        console.warn(
          'Users firestore sync error:',
          err,
        );
      },
    );

    /**
     * 2. SANTRI
     */
    const unsubSantri = onSnapshot(
      collection(db, COLLECTIONS.SANTRI),
      (snapshot) => {
        const santriList: Santri[] = [];
        const santriMap =
          new Map<string, Santri>();

        snapshot.forEach((docSnap) => {
          const santri =
            docSnap.data() as Santri;

          if (
            santri?.idSantri &&
            !santriMap.has(
              santri.idSantri,
            )
          ) {
            const normalizedSantri = {
              ...santri,
              kelas: normalizeKelas(
                santri.kelas,
              ),
            };

            santriMap.set(
              santri.idSantri,
              normalizedSantri,
            );

            santriList.push(
              normalizedSantri,
            );
          }
        });

        if (santriList.length > 0) {
          localStorage.setItem(
            STORAGE_KEYS.SANTRI,
            JSON.stringify(santriList),
          );

          onUpdate?.();
        } else {
          const localSantri =
            this.getSantriList();

          localSantri.forEach(
            (santri) => {
              setDoc(
                doc(
                  db,
                  COLLECTIONS.SANTRI,
                  santri.idSantri,
                ),
                cleanForFirestore(santri),
              ).catch(console.error);
            },
          );
        }
      },
      (err) => {
        console.warn(
          'Santri firestore sync error:',
          err,
        );
      },
    );

    /**
     * Helper realtime records
     */
    const syncRecords = <T extends {
      id: string;
      timestamp: string;
    }>(
      collectionName: string,
      storageKey: string,
    ) =>
      onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
          const records: T[] = [];
          const map =
            new Map<string, T>();

          snapshot.forEach((docSnap) => {
            const record =
              docSnap.data() as T;

            if (
              record?.id &&
              !map.has(record.id)
            ) {
              map.set(record.id, record);
              records.push(record);
            }
          });

          records.sort((a, b) =>
            b.timestamp.localeCompare(
              a.timestamp,
            ),
          );

          localStorage.setItem(
            storageKey,
            JSON.stringify(records),
          );

          onUpdate?.();
        },
        (err) => {
          console.warn(
            `${collectionName} firestore sync error:`,
            err,
          );
        },
      );

    /**
     * 3. ZIYADAH
     */
    const unsubZiyadah =
      syncRecords<ZiyadahRecord>(
        COLLECTIONS.ZIYADAH,
        STORAGE_KEYS.ZIYADAH,
      );

    /**
     * 4. MUROJAAH
     */
    const unsubMurojaah =
      syncRecords<MurojaahRecord>(
        COLLECTIONS.MUROJAAH,
        STORAGE_KEYS.MUROJAAH,
      );

    /**
     * 5. KELAS
     */
    const unsubKelas = onSnapshot(
      collection(db, COLLECTIONS.KELAS),
      (snapshot) => {
        const kelasList: Kelas[] = [];
        const kelasMap =
          new Map<string, Kelas>();

        snapshot.forEach((docSnap) => {
          const kelas =
            docSnap.data() as Kelas;

          if (
            kelas?.id &&
            !kelasMap.has(kelas.id)
          ) {
            const normalizedKelas = {
              ...kelas,
              tipeKelas:
                normalizeTipeKelas(
                  kelas.tipeKelas,
                ),
            };

            kelasMap.set(
              kelas.id,
              normalizedKelas,
            );

            kelasList.push(
              normalizedKelas,
            );
          }
        });

        localStorage.setItem(
          STORAGE_KEYS.KELAS,
          JSON.stringify(kelasList),
        );

        onUpdate?.();
      },
      (err) => {
        console.warn(
          'Kelas firestore sync error:',
          err,
        );
      },
    );

    /**
     * 6. BINNADZOR
     */
    const unsubBinnadzor =
      syncRecords<BinnadzorRecord>(
        COLLECTIONS.BINNADZOR,
        STORAGE_KEYS.BINNADZOR,
      );

    /**
     * 7. PEMBELAJARAN
     */
    const unsubPembelajaran =
      syncRecords<PembelajaranRecord>(
        COLLECTIONS.PEMBELAJARAN,
        STORAGE_KEYS.PEMBELAJARAN,
      );

    /**
     * 8. PROGRAM PANTAUAN CONFIG
     */
    const unsubPantauanConfig =
      onSnapshot(
        doc(
          db,
          COLLECTIONS.PANTAUAN_CONFIG,
          'pantauan-config-001',
        ),
        (snapshot) => {
          if (snapshot.exists()) {
            const config =
              snapshot.data() as ProgramPantauanConfig;

            localStorage.setItem(
              STORAGE_KEYS.PANTAUAN_CONFIG,
              JSON.stringify(config),
            );

            onUpdate?.();
          }
        },
        (err) => {
          console.warn(
            'Program Pantauan Config firestore sync error:',
            err,
          );
        },
      );

    /**
     * 9. WIRID YAUMIYYAH
     */
    const unsubWiridYaumiyyah =
      syncRecords<WiridYaumiyyahRecord>(
        COLLECTIONS.WIRID_YAUMIYYAH,
        STORAGE_KEYS.WIRID_YAUMIYYAH,
      );

    return () => {
      unsubUsers();
      unsubSantri();
      unsubZiyadah();
      unsubMurojaah();
      unsubKelas();
      unsubBinnadzor();
      unsubPembelajaran();
      unsubPantauanConfig();
      unsubWiridYaumiyyah();
    };
  },

  /**
   * ==========================================================
   * SAVE RECORDS
   * ==========================================================
   */

  async saveZiyadah(
    record: Omit<ZiyadahRecord, 'id'> & {
      timestamp?: string;
    },
  ): Promise<ZiyadahRecord> {
    const records = this.getZiyadahRecords();

    const santri = this.getSantriList().find(
      (s) =>
        s.idSantri === record.idSantri,
    );

    const timestamp =
      record.timestamp || createTimestamp();

    const newRecord: ZiyadahRecord = {
      ...record,
      id: `ZYD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      timestamp,
      namaSantri:
        santri?.namaSantri ||
        record.idSantri,
    };

    records.unshift(newRecord);

    localStorage.setItem(
      STORAGE_KEYS.ZIYADAH,
      JSON.stringify(records),
    );

    try {
      await setDoc(
        doc(
          db,
          COLLECTIONS.ZIYADAH,
          newRecord.id,
        ),
        cleanForFirestore(newRecord),
      );
    } catch (err) {
      console.error(
        'Failed to save Ziyadah to Firestore:',
        err,
      );
    }

    return newRecord;
  },

  async saveMurojaah(
    record: Omit<MurojaahRecord, 'id'> & {
      timestamp?: string;
    },
  ): Promise<MurojaahRecord> {
    const records =
      this.getMurojaahRecords();

    const santri = this.getSantriList().find(
      (s) =>
        s.idSantri === record.idSantri,
    );

    const timestamp =
      record.timestamp || createTimestamp();

    const newRecord: MurojaahRecord = {
      ...record,
      id: `MRJ-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      timestamp,
      namaSantri:
        santri?.namaSantri ||
        record.idSantri,
    };

    records.unshift(newRecord);

    localStorage.setItem(
      STORAGE_KEYS.MUROJAAH,
      JSON.stringify(records),
    );

    try {
      await setDoc(
        doc(
          db,
          COLLECTIONS.MUROJAAH,
          newRecord.id,
        ),
        cleanForFirestore(newRecord),
      );
    } catch (err) {
      console.error(
        'Failed to save Murojaah to Firestore:',
        err,
      );
    }

    return newRecord;
  },

  async saveBinnadzor(
    record: Omit<BinnadzorRecord, 'id'> & {
      timestamp?: string;
    },
  ): Promise<BinnadzorRecord> {
    const records =
      this.getBinnadzorRecords();

    const santri = this.getSantriList().find(
      (s) =>
        s.idSantri === record.idSantri,
    );

    const timestamp =
      record.timestamp || createTimestamp();

    const newRecord: BinnadzorRecord = {
      ...record,
      id: `BND-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      timestamp,
      namaSantri:
        santri?.namaSantri ||
        record.idSantri,
    };

    records.unshift(newRecord);

    localStorage.setItem(
      STORAGE_KEYS.BINNADZOR,
      JSON.stringify(records),
    );

    try {
      await setDoc(
        doc(
          db,
          COLLECTIONS.BINNADZOR,
          newRecord.id,
        ),
        cleanForFirestore(newRecord),
      );
    } catch (err) {
      console.error(
        'Failed to save Binnadzor to Firestore:',
        err,
      );
    }

    return newRecord;
  },

  async savePembelajaran(
    record: Omit<
      PembelajaranRecord,
      'id'
    > & {
      timestamp?: string;
    },
  ): Promise<PembelajaranRecord> {
    const records =
      this.getPembelajaranRecords();

    const santri = this.getSantriList().find(
      (s) =>
        s.idSantri === record.idSantri,
    );

    const timestamp =
      record.timestamp || createTimestamp();

    const newRecord: PembelajaranRecord = {
      ...record,
      id: `PBL-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`,
      timestamp,
      namaSantri:
        santri?.namaSantri ||
        record.idSantri,
    };

    records.unshift(newRecord);

    localStorage.setItem(
      STORAGE_KEYS.PEMBELAJARAN,
      JSON.stringify(records),
    );

    try {
      await setDoc(
        doc(
          db,
          COLLECTIONS.PEMBELAJARAN,
          newRecord.id,
        ),
        cleanForFirestore(newRecord),
      );
    } catch (err) {
      console.error(
        'Failed to save Pembelajaran to Firestore:',
        err,
      );
    }

    return newRecord;
  },

  /**
   * ==========================================================
   * DELETE RECORD
   * ==========================================================
   */

  async deleteRecord(
    type:
      | 'Ziyadah'
      | 'Murojaah'
      | 'Binnadzor'
      | 'Pembelajaran',
    id: string,
  ): Promise<boolean> {
    const config = {
      Ziyadah: {
        getRecords:
          this.getZiyadahRecords.bind(this),
        storageKey: STORAGE_KEYS.ZIYADAH,
        collection: COLLECTIONS.ZIYADAH,
      },

      Murojaah: {
        getRecords:
          this.getMurojaahRecords.bind(this),
        storageKey: STORAGE_KEYS.MUROJAAH,
        collection: COLLECTIONS.MUROJAAH,
      },

      Binnadzor: {
        getRecords:
          this.getBinnadzorRecords.bind(this),
        storageKey:
          STORAGE_KEYS.BINNADZOR,
        collection:
          COLLECTIONS.BINNADZOR,
      },

      Pembelajaran: {
        getRecords:
          this.getPembelajaranRecords.bind(
            this,
          ),
        storageKey:
          STORAGE_KEYS.PEMBELAJARAN,
        collection:
          COLLECTIONS.PEMBELAJARAN,
      },
    }[type];

    const records = config
      .getRecords()
      .filter((record) => record.id !== id);

    localStorage.setItem(
      config.storageKey,
      JSON.stringify(records),
    );

    try {
      await deleteDoc(
        doc(
          db,
          config.collection,
          id,
        ),
      );
    } catch (err) {
      console.error(
        `Failed to delete ${type}:`,
        err,
      );
    }

    return true;
  },

  /**
   * ==========================================================
   * UPDATE RECORD
   * ==========================================================
   */

  async updateRecord(
    type:
      | 'Ziyadah'
      | 'Murojaah'
      | 'Binnadzor'
      | 'Pembelajaran',
    id: string,
    updatedData: Partial<
      | ZiyadahRecord
      | MurojaahRecord
      | BinnadzorRecord
      | PembelajaranRecord
    >,
  ): Promise<boolean> {
    if (type === 'Ziyadah') {
      const records =
        this.getZiyadahRecords().map(
          (record) =>
            record.id === id
              ? ({
                  ...record,
                  ...updatedData,
                } as ZiyadahRecord)
              : record,
        );

      localStorage.setItem(
        STORAGE_KEYS.ZIYADAH,
        JSON.stringify(records),
      );

      const target = records.find(
        (record) => record.id === id,
      );

      if (target) {
        await setDoc(
          doc(
            db,
            COLLECTIONS.ZIYADAH,
            id,
          ),
          cleanForFirestore(target),
          { merge: true },
        );
      }
    }

    if (type === 'Murojaah') {
      const records =
        this.getMurojaahRecords().map(
          (record) =>
            record.id === id
              ? ({
                  ...record,
                  ...updatedData,
                } as MurojaahRecord)
              : record,
        );

      localStorage.setItem(
        STORAGE_KEYS.MUROJAAH,
        JSON.stringify(records),
      );

      const target = records.find(
        (record) => record.id === id,
      );

      if (target) {
        await setDoc(
          doc(
            db,
            COLLECTIONS.MUROJAAH,
            id,
          ),
          cleanForFirestore(target),
          { merge: true },
        );
      }
    }

    if (type === 'Binnadzor') {
      const records =
        this.getBinnadzorRecords().map(
          (record) =>
            record.id === id
              ? ({
                  ...record,
                  ...updatedData,
                } as BinnadzorRecord)
              : record,
        );

      localStorage.setItem(
        STORAGE_KEYS.BINNADZOR,
        JSON.stringify(records),
      );

      const target = records.find(
        (record) => record.id === id,
      );

      if (target) {
        await setDoc(
          doc(
            db,
            COLLECTIONS.BINNADZOR,
            id,
          ),
          cleanForFirestore(target),
          { merge: true },
        );
      }
    }

    if (type === 'Pembelajaran') {
      const records =
        this.getPembelajaranRecords().map(
          (record) =>
            record.id === id
              ? ({
                  ...record,
                  ...updatedData,
                } as PembelajaranRecord)
              : record,
        );

      localStorage.setItem(
        STORAGE_KEYS.PEMBELAJARAN,
        JSON.stringify(records),
      );

      const target = records.find(
        (record) => record.id === id,
      );

      if (target) {
        await setDoc(
          doc(
            db,
            COLLECTIONS.PEMBELAJARAN,
            id,
          ),
          cleanForFirestore(target),
          { merge: true },
        );
      }
    }

    return true;
  },

  /**
   * ==========================================================
   * SANTRI MANAGEMENT
   * ==========================================================
   */

  async addSantri(
    santri: Santri,
    defaultPassword = '123',
  ): Promise<Santri> {
    const list = this.getSantriList();

    const existingIndex =
      list.findIndex(
        (s) =>
          s.idSantri === santri.idSantri,
      );

    if (existingIndex >= 0) {
      list[existingIndex] = santri;
    } else {
      list.push(santri);
    }

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(list),
    );

    const users = this.getUsers();

    /**
     * WALI ACCOUNT
     */
    const waliUsername =
      `wali_${santri.idSantri.toLowerCase()}`;

    let waliUser = users.find(
      (user) =>
        user.username.toLowerCase() ===
        waliUsername.toLowerCase(),
    );

    if (waliUser) {
      waliUser.nama = santri.waliNama
        ? `Wali ${santri.namaSantri} (${santri.waliNama})`
        : `Wali ${santri.namaSantri}`;

      waliUser.idSantri =
        santri.idSantri;
    } else {
      waliUser = {
        id: `USR-WLI-${santri.idSantri}`,
        username: waliUsername,
        password: defaultPassword,
        role: 'Wali',
        nama: santri.waliNama
          ? `Wali ${santri.namaSantri} (${santri.waliNama})`
          : `Wali ${santri.namaSantri}`,
        idSantri: santri.idSantri,
      };

      users.push(waliUser);
    }

    /**
     * SANTRI ACCOUNT
     */
    const santriUsername =
      santri.idSantri;

    let santriUser = users.find(
      (user) =>
        user.username.toLowerCase() ===
        santriUsername.toLowerCase(),
    );

    if (santriUser) {
      santriUser.nama =
        santri.namaSantri;

      santriUser.idSantri =
        santri.idSantri;
    } else {
      santriUser = {
        id: `USR-STR-${santri.idSantri}`,
        username: santri.idSantri,
        password: defaultPassword,
        role: 'Santri',
        nama: santri.namaSantri,
        idSantri: santri.idSantri,
      };

      users.push(santriUser);
    }

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(users),
    );

    try {
      await setDoc(
        doc(
          db,
          COLLECTIONS.SANTRI,
          santri.idSantri,
        ),
        cleanForFirestore(santri),
      );

      await setDoc(
        doc(
          db,
          COLLECTIONS.USERS,
          waliUser.id,
        ),
        cleanForFirestore(waliUser),
      );

      await setDoc(
        doc(
          db,
          COLLECTIONS.USERS,
          santriUser.id,
        ),
        cleanForFirestore(santriUser),
      );
    } catch (err) {
      console.error(
        'Failed to sync new Santri:',
        err,
      );
    }

    return santri;
  },

  async updateSantri(
    idSantri: string,
    updatedData: Partial<Santri>,
  ): Promise<boolean> {
    const list = this.getSantriList().map(
      (santri) =>
        santri.idSantri === idSantri
          ? {
              ...santri,
              ...updatedData,
            }
          : santri,
    );

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(list),
    );

    const target = list.find(
      (santri) =>
        santri.idSantri === idSantri,
    );

    if (target) {
      try {
        await setDoc(
          doc(
            db,
            COLLECTIONS.SANTRI,
            idSantri,
          ),
          cleanForFirestore(target),
          { merge: true },
        );
      } catch (err) {
        console.error(
          'Failed to update Santri:',
          err,
        );
      }
    }

    return true;
  },

  async deleteSantri(
    idSantri: string,
    deleteRelatedHistory = true,
  ): Promise<boolean> {
    if (
      !isStaffRole(
        this.getSession()?.role,
      )
    ) {
      throw new Error(
        'Akses pengelolaan akun diperlukan.',
      );
    }

    const remoteUsers = await getDocs(
      collection(db, COLLECTIONS.USERS),
    );

    const related =
      remoteUsers.docs.filter((userDoc) => {
        const data = userDoc.data();

        return (
          data.idSantri === idSantri ||
          String(
            data.username || '',
          ).toLowerCase() ===
            idSantri.toLowerCase()
        );
      });

    if (
      related.some((userDoc) =>
        isProtectedUser(
          userDoc.data() as User,
        ),
      )
    ) {
      throw new Error(
        'Santri terhubung ke superadmin yang dilindungi.',
      );
    }

    const refs = [
      doc(
        db,
        COLLECTIONS.SANTRI,
        idSantri,
      ),
      ...related.map(
        (userDoc) => userDoc.ref,
      ),
    ];

    if (deleteRelatedHistory) {
      for (const name of [
        COLLECTIONS.ZIYADAH,
        COLLECTIONS.MUROJAAH,
        COLLECTIONS.BINNADZOR,
        COLLECTIONS.PEMBELAJARAN,
        COLLECTIONS.WIRID_YAUMIYYAH,
      ]) {
        const records = await getDocs(
          query(
            collection(db, name),
            where(
              'idSantri',
              '==',
              idSantri,
            ),
          ),
        );

        refs.push(
          ...records.docs.map(
            (recordDoc) =>
              recordDoc.ref,
          ),
        );
      }
    }

    if (refs.length > 500) {
      throw new Error(
        'Riwayat terlalu besar untuk penghapusan sekaligus. Hubungi administrator Firebase.',
      );
    }

    const batch = writeBatch(db);

    refs.forEach((ref) =>
      batch.delete(ref),
    );

    await batch.commit();

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(
        this.getSantriList().filter(
          (santri) =>
            santri.idSantri !== idSantri,
        ),
      ),
    );

    const deletedIds = new Set(
      related.map(
        (userDoc) => userDoc.id,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(
        this.getUsers().filter(
          (user) =>
            !deletedIds.has(user.id),
        ),
      ),
    );

    if (deleteRelatedHistory) {
      localStorage.setItem(
        STORAGE_KEYS.ZIYADAH,
        JSON.stringify(
          this.getZiyadahRecords().filter(
            (record) =>
              record.idSantri !==
              idSantri,
          ),
        ),
      );

      localStorage.setItem(
        STORAGE_KEYS.MUROJAAH,
        JSON.stringify(
          this.getMurojaahRecords().filter(
            (record) =>
              record.idSantri !==
              idSantri,
          ),
        ),
      );

      localStorage.setItem(
        STORAGE_KEYS.BINNADZOR,
        JSON.stringify(
          this.getBinnadzorRecords().filter(
            (record) =>
              record.idSantri !==
              idSantri,
          ),
        ),
      );

      localStorage.setItem(
        STORAGE_KEYS.PEMBELAJARAN,
        JSON.stringify(
          this.getPembelajaranRecords().filter(
            (record) =>
              record.idSantri !==
              idSantri,
          ),
        ),
      );

      localStorage.setItem(
        STORAGE_KEYS.WIRID_YAUMIYYAH,
        JSON.stringify(
          this.getWiridYaumiyyahRecords().filter(
            (record) =>
              record.idSantri !==
              idSantri,
          ),
        ),
      );
    }

    return true;
  },

  /**
   * ==========================================================
   * USER MANAGEMENT
   * ==========================================================
   */

  async addUser(
    user: User,
  ): Promise<User> {
    if (user.role === 'Superadmin') {
      throw new Error(
        'Superadmin hanya dapat ditetapkan melalui administrasi Firebase.',
      );
    }

    const users = this.getUsers();

    const ensuredUser: User = {
      id:
        user.id ||
        `USR-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`,

      username: user.username
        ? user.username
            .trim()
            .toLowerCase()
        : '',

      password: user.password
        ? user.password.trim()
        : '123',

      role: user.role || 'Ustadz',

      nama: user.nama
        ? user.nama.trim()
        : 'Ustadz Pengajar',

      idSantri: isStaffRole(user.role)
        ? ''
        : user.idSantri || '',
    };

    const existingIndex =
      users.findIndex(
        (existingUser) =>
          existingUser.username.toLowerCase() ===
          ensuredUser.username.toLowerCase(),
      );

    if (existingIndex >= 0) {
      throw new Error(
        'Username sudah digunakan.',
      );
    }

    await setDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        ensuredUser.id,
      ),
      cleanForFirestore(ensuredUser),
    );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify([
        ...users,
        ensuredUser,
      ]),
    );

    return ensuredUser;
  },

  async updateUser(
    id: string,
    updatedData: Partial<User>,
  ): Promise<boolean> {
    const remote = await getDocFromServer(
      doc(
        db,
        COLLECTIONS.USERS,
        id,
      ),
    );

    if (!remote.exists()) {
      throw new Error(
        'Akun tidak ditemukan.',
      );
    }

    const ownNotification =
      this.getSession()?.id === id &&
      Object.keys(updatedData).every(
        (key) =>
          key ===
          'notificationPermission',
      );

    if (
      (
        isProtectedUser(
          remote.data() as User,
        ) &&
        !ownNotification
      ) ||
      updatedData.role === 'Superadmin'
    ) {
      throw new Error(
        'Perubahan superadmin hanya melalui administrasi Firebase.',
      );
    }

    const cleanUpdate = {
      ...updatedData,
    };

    if (cleanUpdate.username) {
      cleanUpdate.username =
        cleanUpdate.username
          .trim()
          .toLowerCase();
    }

    if (cleanUpdate.password) {
      cleanUpdate.password =
        cleanUpdate.password.trim();
    }

    if (cleanUpdate.nama) {
      cleanUpdate.nama =
        cleanUpdate.nama.trim();
    }

    const target = {
      ...remote.data(),
      ...cleanUpdate,
      id,
    } as User;

    await setDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        id,
      ),
      cleanForFirestore(target),
    );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(
        this.getUsers().map((user) =>
          user.id === id
            ? target
            : user,
        ),
      ),
    );

    if (
      this.getSession()?.id === id
    ) {
      const {
        password: _password,
        ...profile
      } = target;

      this.setSession(
        profile as User,
      );
    }

    return true;
  },

  async deleteUser(
    id: string,
  ): Promise<boolean> {
    if (
      !isStaffRole(
        this.getSession()?.role,
      )
    ) {
      throw new Error(
        'Akses pengelolaan akun diperlukan.',
      );
    }

    const targetRef = doc(
      db,
      COLLECTIONS.USERS,
      id,
    );

    await runTransaction(
      db,
      async (transaction) => {
        const snapshot =
          await transaction.get(
            targetRef,
          );

        if (
          isProtectedUser(
            snapshot.data() as User,
          )
        ) {
          throw new Error(
            'Superadmin tidak dapat dihapus.',
          );
        }

        transaction.delete(targetRef);
      },
    );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(
        this.getUsers().filter(
          (user) => user.id !== id,
        ),
      ),
    );

    if (
      this.getSession()?.id === id
    ) {
      this.setSession(null);
    }

    return true;
  },

  /**
   * ==========================================================
   * SESSION
   * ==========================================================
   */

  getSession(): User | null {
    const data = localStorage.getItem(
      STORAGE_KEYS.SESSION,
    );

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setSession(
    user: User | null,
  ): void {
    if (!user) {
      localStorage.removeItem(
        STORAGE_KEYS.SESSION,
      );

      void signOut(auth);

      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.SESSION,
      JSON.stringify(user),
    );
  },

  /**
   * ==========================================================
   * KELAS MANAGEMENT
   * ==========================================================
   */

  async addKelas(
    kelas: Kelas,
  ): Promise<Kelas> {
    const list = this.getKelasList();

    const assignedIds = new Set(
      kelas.santriIds || [],
    );

    for (const existingKelas of list) {
      if (
        existingKelas.id !== kelas.id &&
        existingKelas.santriIds?.length
      ) {
        const previousCount =
          existingKelas.santriIds.length;

        existingKelas.santriIds =
          existingKelas.santriIds.filter(
            (id) =>
              !assignedIds.has(id),
          );

        if (
          existingKelas.santriIds
            .length !== previousCount
        ) {
          try {
            await setDoc(
              doc(
                db,
                COLLECTIONS.KELAS,
                existingKelas.id,
              ),
              cleanForFirestore(
                existingKelas,
              ),
              { merge: true },
            );
          } catch (err) {
            console.error(
              'Failed to update other class:',
              err,
            );
          }
        }
      }
    }

    const existingIndex =
      list.findIndex(
        (existingKelas) =>
          existingKelas.id === kelas.id,
      );

    if (existingIndex >= 0) {
      list[existingIndex] = kelas;
    } else {
      list.push(kelas);
    }

    localStorage.setItem(
      STORAGE_KEYS.KELAS,
      JSON.stringify(list),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.KELAS,
        kelas.id,
      ),
      cleanForFirestore(kelas),
    );

    const allSantri =
      this.getSantriList();

    let santriChanged = false;

    for (const santri of allSantri) {
      if (
        assignedIds.has(
          santri.idSantri,
        ) &&
        santri.kelas !== kelas.namaKelas
      ) {
        santri.kelas =
          kelas.namaKelas;

        santriChanged = true;

        await setDoc(
          doc(
            db,
            COLLECTIONS.SANTRI,
            santri.idSantri,
          ),
          cleanForFirestore(santri),
          { merge: true },
        );
      }
    }

    if (santriChanged) {
      localStorage.setItem(
        STORAGE_KEYS.SANTRI,
        JSON.stringify(allSantri),
      );
    }

    return kelas;
  },

  async updateKelas(
    id: string,
    updatedData: Partial<Kelas>,
  ): Promise<boolean> {
    const list = this.getKelasList();

    const currentKelas = list.find(
      (kelas) => kelas.id === id,
    );

    const oldSantriIds = new Set(
      currentKelas?.santriIds || [],
    );

    const newSantriIds =
      updatedData.santriIds !==
      undefined
        ? new Set(
            updatedData.santriIds,
          )
        : oldSantriIds;

    if (
      updatedData.santriIds !==
      undefined
    ) {
      for (const kelas of list) {
        if (
          kelas.id !== id &&
          kelas.santriIds?.length
        ) {
          const previousCount =
            kelas.santriIds.length;

          kelas.santriIds =
            kelas.santriIds.filter(
              (santriId) =>
                !newSantriIds.has(
                  santriId,
                ),
            );

          if (
            kelas.santriIds.length !==
            previousCount
          ) {
            await setDoc(
              doc(
                db,
                COLLECTIONS.KELAS,
                kelas.id,
              ),
              cleanForFirestore(kelas),
              { merge: true },
            );
          }
        }
      }
    }

    const updatedList = list.map(
      (kelas) =>
        kelas.id === id
          ? {
              ...kelas,
              ...updatedData,
            }
          : kelas,
    );

    localStorage.setItem(
      STORAGE_KEYS.KELAS,
      JSON.stringify(updatedList),
    );

    const target = updatedList.find(
      (kelas) => kelas.id === id,
    );

    if (target) {
      await setDoc(
        doc(
          db,
          COLLECTIONS.KELAS,
          id,
        ),
        cleanForFirestore(target),
        { merge: true },
      );
    }

    const allSantri =
      this.getSantriList();

    let santriChanged = false;

    const kelasName =
      target?.namaKelas || '';

    for (const santri of allSantri) {
      if (
        newSantriIds.has(
          santri.idSantri,
        )
      ) {
        if (
          santri.kelas !== kelasName
        ) {
          santri.kelas = kelasName;
          santriChanged = true;

          await setDoc(
            doc(
              db,
              COLLECTIONS.SANTRI,
              santri.idSantri,
            ),
            cleanForFirestore(santri),
            { merge: true },
          );
        }
      } else if (
        oldSantriIds.has(
          santri.idSantri,
        )
      ) {
        santri.kelas = '';
        santriChanged = true;

        await setDoc(
          doc(
            db,
            COLLECTIONS.SANTRI,
            santri.idSantri,
          ),
          cleanForFirestore(santri),
          { merge: true },
        );
      }
    }

    if (santriChanged) {
      localStorage.setItem(
        STORAGE_KEYS.SANTRI,
        JSON.stringify(allSantri),
      );
    }

    return true;
  },

  async deleteKelas(
    id: string,
  ): Promise<boolean> {
    const list = this.getKelasList();

    const deletedKelas = list.find(
      (kelas) => kelas.id === id,
    );

    const affectedSantriIds =
      new Set(
        deletedKelas?.santriIds || [],
      );

    const updatedList = list.filter(
      (kelas) => kelas.id !== id,
    );

    localStorage.setItem(
      STORAGE_KEYS.KELAS,
      JSON.stringify(updatedList),
    );

    await deleteDoc(
      doc(
        db,
        COLLECTIONS.KELAS,
        id,
      ),
    );

    const allSantri =
      this.getSantriList();

    let santriChanged = false;

    for (const santri of allSantri) {
      if (
        affectedSantriIds.has(
          santri.idSantri,
        )
      ) {
        santri.kelas = '';
        santriChanged = true;

        await setDoc(
          doc(
            db,
            COLLECTIONS.SANTRI,
            santri.idSantri,
          ),
          cleanForFirestore(santri),
          { merge: true },
        );
      }
    }

    if (santriChanged) {
      localStorage.setItem(
        STORAGE_KEYS.SANTRI,
        JSON.stringify(allSantri),
      );
    }

    return true;
  },

  /**
   * ==========================================================
   * RESET LOCAL DATA
   * ==========================================================
   */

  async resetToDefault(): Promise<void> {
    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify([]),
    );

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(INITIAL_SANTRI),
    );

    localStorage.setItem(
      STORAGE_KEYS.ZIYADAH,
      JSON.stringify(INITIAL_ZIYADAH),
    );

    localStorage.setItem(
      STORAGE_KEYS.MUROJAAH,
      JSON.stringify(INITIAL_MUROJAAH),
    );

    localStorage.setItem(
      STORAGE_KEYS.BINNADZOR,
      JSON.stringify(INITIAL_BINNADZOR),
    );

    localStorage.setItem(
      STORAGE_KEYS.PEMBELAJARAN,
      JSON.stringify(
        INITIAL_PEMBELAJARAN,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.KELAS,
      JSON.stringify([]),
    );

    localStorage.setItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
      JSON.stringify([]),
    );
  },
};