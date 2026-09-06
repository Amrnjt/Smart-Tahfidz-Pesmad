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

import {
  isAdminRole,
  isProtectedUser,
  isStaffRole,
} from '../utils/roles';

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

const STORAGE_KEYS = {
  USERS: 'tahfidz_users_db_v2',
  SANTRI: 'tahfidz_santri_db_v2',
  ZIYADAH: 'tahfidz_ziyadah_db_v2',
  MUROJAAH: 'tahfidz_murojaah_db_v2',
  BINNADZOR: 'tahfidz_binnadzor_db_v2',
  PEMBELAJARAN: 'tahfidz_pembelajaran_db_v2',
  KELAS: 'tahfidz_kelas_db_v2',
  SESSION: 'tahfidz_active_session_v2',

  PANTAUAN_CONFIG: 'tahfidz_pantauan_config_v1',
  WIRID_YAUMIYYAH: 'tahfidz_wirid_yaumiyyah_v1',

  PROGRAM_PANTAUAN_CONFIG: 'tahfidz_pantauan_config_v1',
  PANTAUAN_LIBURAN: 'tahfidz_wirid_yaumiyyah_v1',
};

const COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  ZIYADAH: 'ziyadah',
  MUROJAAH: 'murojaah',
  BINNADZOR: 'binnadzor',
  PEMBELAJARAN: 'pembelajaran',
  KELAS: 'kelas',

  PANTAUAN_CONFIG: 'pantauan_config',
  WIRID_YAUMIYYAH: 'wirid_yaumiyyah',

  PROGRAM_PANTAUAN_CONFIG: 'pantauan_config',
  PANTAUAN_LIBURAN: 'wirid_yaumiyyah',
};

function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function createTimestamp(): string {
  const now = new Date();
  const pad = (n: number) =>
    n.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(
    now.getMonth() + 1,
  )}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
}

export const storageService = {
  async authenticate(
    usernameInput: string,
    passwordInput: string,
  ): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    const cleanUser =
      usernameInput.trim().toLowerCase();

    const cleanPass =
      passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return {
        success: false,
        message:
          'Harap masukkan Username / ID Santri dan Password.',
      };
    }

    try {
      const login = httpsCallable<
        {
          username: string;
          password: string;
        },
        {
          token: string;
          user: User;
        }
      >(functions, 'loginAccount');

      const result = await login({
        username: cleanUser,
        password: cleanPass,
      });

      await signInWithCustomToken(
        auth,
        result.data.token,
      );

      this.setSession(
        result.data.user,
      );

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

  getUsers(): User[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.USERS,
      );

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
        return [];
      }

      return parsed;
    } catch {
      return [];
    }
  },

  getSantriList(): Santri[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.SANTRI,
      );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.SANTRI,
        JSON.stringify(
          INITIAL_SANTRI,
        ),
      );

      return INITIAL_SANTRI;
    }

    try {
      const parsed = JSON.parse(data);

      if (!Array.isArray(parsed)) {
        return INITIAL_SANTRI;
      }

      return parsed.map(
        (santri: Santri) => ({
          ...santri,
          kelas: normalizeKelas(
            santri.kelas,
          ),
        }),
      );
    } catch {
      return INITIAL_SANTRI;
    }
  },

  getZiyadahRecords(): ZiyadahRecord[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.ZIYADAH,
      );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.ZIYADAH,
        JSON.stringify(
          INITIAL_ZIYADAH,
        ),
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

  getMurojaahRecords(): MurojaahRecord[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.MUROJAAH,
      );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.MUROJAAH,
        JSON.stringify(
          INITIAL_MUROJAAH,
        ),
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

  getBinnadzorRecords(): BinnadzorRecord[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.BINNADZOR,
      );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.BINNADZOR,
        JSON.stringify(
          INITIAL_BINNADZOR,
        ),
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

  getPembelajaranRecords():
    PembelajaranRecord[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.PEMBELAJARAN,
      );

    if (!data) {
      localStorage.setItem(
        STORAGE_KEYS.PEMBELAJARAN,
        JSON.stringify(
          INITIAL_PEMBELAJARAN,
        ),
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

  getKelasList(): Kelas[] {
    const data =
      localStorage.getItem(
        STORAGE_KEYS.KELAS,
      );

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

      return parsed.map(
        (kelas: Kelas) => ({
          ...kelas,
          tipeKelas:
            normalizeTipeKelas(
              kelas.tipeKelas,
            ),
        }),
      );
    } catch {
      return [];
    }
  },

  getPantauanConfigLocal():
    ProgramPantauanConfig {
    const defaultConfig:
      ProgramPantauanConfig = {
        id: 'pantauan-config-001',
        isEnabled: false,
        lastUpdated:
          new Date().toISOString(),
        updatedBy: 'system',
      };

    const data =
      localStorage.getItem(
        STORAGE_KEYS.PANTAUAN_CONFIG,
      );

    if (!data) {
      return defaultConfig;
    }

    try {
      const parsed =
        JSON.parse(data);

      if (
        parsed &&
        typeof parsed.isEnabled ===
          'boolean'
      ) {
        return {
          ...defaultConfig,
          ...parsed,
        };
      }

      return defaultConfig;
    } catch {
      return defaultConfig;
    }
  },

  async getPantauanConfig():
    Promise<ProgramPantauanConfig> {
    const defaultConfig:
      ProgramPantauanConfig = {
        id: 'pantauan-config-001',
        isEnabled: false,
        lastUpdated:
          new Date().toISOString(),
        updatedBy: 'system',
      };

    try {
      const configDoc =
        await getDocFromServer(
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

    return this.getPantauanConfigLocal();
  },

  getProgramPantauanConfig():
    ProgramPantauanConfig {
    return this.getPantauanConfigLocal();
  },

  async setPantauanConfig(
    config: ProgramPantauanConfig,
  ): Promise<void> {
    if (
      !isAdminRole(
        this.getSession()?.role,
      )
    ) {
      throw new Error(
        'Hanya admin yang dapat mengaktifkan atau menonaktifkan Program Pantauan.',
      );
    }

    const updatedConfig:
      ProgramPantauanConfig = {
        ...config,
        id:
          config.id ||
          'pantauan-config-001',
        lastUpdated:
          new Date().toISOString(),
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
      cleanForFirestore(
        updatedConfig,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.PANTAUAN_CONFIG,
      JSON.stringify(
        updatedConfig,
      ),
    );
  },

  async setProgramPantauanConfig(
    config: ProgramPantauanConfig,
  ): Promise<void> {
    await this.setPantauanConfig(
      config,
    );
  },

  getWiridYaumiyyahRecords():
    WiridYaumiyyahRecord[] {
    const data =
      localStorage.getItem(
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

  getPantauanLiburanRecords():
    PantauanLiburanRecord[] {
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
    const session =
      this.getSession();

    if (
      session?.role !== 'Wali' ||
      !session.idSantri ||
      session.idSantri !==
        record.idSantri
    ) {
      throw new Error(
        'Akses wali tidak sesuai dengan data santri.',
      );
    }

    const records =
      this.getWiridYaumiyyahRecords();

    const timestamp =
      record.timestamp ||
      createTimestamp();

    const tanggal =
      record.tanggal ||
      timestamp.substring(0, 10);

    const santri =
      this.getSantriList().find(
        (item) =>
          item.idSantri ===
          record.idSantri,
      );

    const recordId =
      record.id ||
      `${encodeURIComponent(
        record.idSantri,
      )}_${tanggal}`;

    const newRecord:
      WiridYaumiyyahRecord = {
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

    const existingIndex =
      records.findIndex(
        (item) =>
          item.idSantri ===
            record.idSantri &&
          (
            item.tanggal === tanggal ||
            item.timestamp.startsWith(
              tanggal,
            )
          ),
      );

    const updatedRecords = [
      ...records,
    ];

    if (existingIndex >= 0) {
      updatedRecords[
        existingIndex
      ] = newRecord;
    } else {
      updatedRecords.unshift(
        newRecord,
      );
    }

    await runTransaction(
      db,
      async (transaction) => {
        const configRef = doc(
          db,
          COLLECTIONS.PANTAUAN_CONFIG,
          'pantauan-config-001',
        );

        const configSnapshot =
          await transaction.get(
            configRef,
          );

        if (
          !configSnapshot.exists() ||
          configSnapshot.data()
            ?.isEnabled !== true
        ) {
          throw new Error(
            'Program Pantauan Liburan sedang dinonaktifkan oleh Admin.',
          );
        }

        transaction.set(
          doc(
            db,
            COLLECTIONS.WIRID_YAUMIYYAH,
            newRecord.id,
          ),
          cleanForFirestore(
            newRecord,
          ),
        );
      },
    );

    localStorage.setItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
      JSON.stringify(
        updatedRecords,
      ),
    );

    return newRecord;
  },

  async addPantauanLiburan(
    record: PantauanLiburanRecord,
  ): Promise<PantauanLiburanRecord> {
    const session =
      this.getSession();

    if (
      session?.role === 'Wali' &&
      session.idSantri ===
        record.idSantri
    ) {
      return this.saveWiridYaumiyyah(
        record,
      );
    }

    if (
      !isAdminRole(session?.role)
    ) {
      throw new Error(
        'Anda tidak memiliki akses untuk menyimpan Program Pantauan.',
      );
    }

    const records =
      this.getWiridYaumiyyahRecords();

    const tanggal =
      record.tanggal ||
      record.timestamp.substring(
        0,
        10,
      );

    const normalizedRecord:
      PantauanLiburanRecord = {
        ...record,
        tanggal,
      };

    const index =
      records.findIndex(
        (item) =>
          item.id ===
          normalizedRecord.id,
      );

    if (index >= 0) {
      records[index] =
        normalizedRecord;
    } else {
      records.unshift(
        normalizedRecord,
      );
    }

    await setDoc(
      doc(
        db,
        COLLECTIONS.WIRID_YAUMIYYAH,
        normalizedRecord.id,
      ),
      cleanForFirestore(
        normalizedRecord,
      ),
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
    return this
      .getWiridYaumiyyahRecords()
      .filter(
        (record) =>
          record.idSantri ===
          idSantri,
      )
      .sort((a, b) =>
        b.timestamp.localeCompare(
          a.timestamp,
        ),
      );
  },

  async deletePantauanLiburan(
    id: string,
  ): Promise<boolean> {
    const session =
      this.getSession();

    const target =
      this.getWiridYaumiyyahRecords().find(
        (record) =>
          record.id === id,
      );

    const hasAccess =
      isAdminRole(
        session?.role,
      ) ||
      (
        session?.role === 'Wali' &&
        session.idSantri &&
        target?.idSantri ===
          session.idSantri
      );

    if (!hasAccess) {
      throw new Error(
        'Anda tidak memiliki akses untuk menghapus data pantauan ini.',
      );
    }

    const records =
      this.getWiridYaumiyyahRecords().filter(
        (record) =>
          record.id !== id,
      );

    await deleteDoc(
      doc(
        db,
        COLLECTIONS.WIRID_YAUMIYYAH,
        id,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.WIRID_YAUMIYYAH,
      JSON.stringify(records),
    );

    return true;
  },

  initRealtimeSync(
    onUpdate?: () => void,
  ): () => void {
    const seedAndMigrate =
      async () => {
        try {
          const santriSnapshot =
            await getDocs(
              collection(
                db,
                COLLECTIONS.SANTRI,
              ),
            );

          const remoteSantriMap =
            new Map<
              string,
              Santri
            >();

          santriSnapshot.forEach(
            (docSnap) => {
              const santri =
                docSnap.data() as Santri;

              if (
                santri.idSantri
              ) {
                remoteSantriMap.set(
                  santri.idSantri,
                  santri,
                );
              }
            },
          );

          const localSantri =
            this.getSantriList();

          for (const santri of [
            ...INITIAL_SANTRI,
            ...localSantri,
          ]) {
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
                cleanForFirestore(
                  santri,
                ),
              ).catch(
                console.error,
              );
            }
          }

          const seedRecords = async <
            T extends {
              id: string;
            },
          >(
            collectionName: string,
            records: T[],
          ) => {
            const snapshot =
              await getDocs(
                collection(
                  db,
                  collectionName,
                ),
              );

            const remoteIds =
              new Set(
                snapshot.docs.map(
                  (docSnap) =>
                    docSnap.id,
                ),
              );

            for (
              const record of records
            ) {
              if (
                !remoteIds.has(
                  record.id,
                )
              ) {
                await setDoc(
                  doc(
                    db,
                    collectionName,
                    record.id,
                  ),
                  cleanForFirestore(
                    record,
                  ),
                ).catch(
                  console.error,
                );
              }
            }
          };

          await seedRecords(
            COLLECTIONS.ZIYADAH,
            this.getZiyadahRecords(),
          );

          await seedRecords(
            COLLECTIONS.MUROJAAH,
            this.getMurojaahRecords(),
          );

          await seedRecords(
            COLLECTIONS.BINNADZOR,
            this.getBinnadzorRecords(),
          );

          await seedRecords(
            COLLECTIONS.PEMBELAJARAN,
            this.getPembelajaranRecords(),
          );
        } catch (err) {
          console.warn(
            'Initial Firestore seeding/sync warning:',
            err,
          );
        }
      };

    void seedAndMigrate();

    const usersSource =
      isStaffRole(
        this.getSession()?.role,
      )
        ? collection(
            db,
            COLLECTIONS.USERS,
          )
        : query(
            collection(
              db,
              COLLECTIONS.USERS,
            ),
            where(
              documentId(),
              '==',
              auth.currentUser?.uid ||
                '__none__',
            ),
          );

    const unsubUsers =
      onSnapshot(
        usersSource,
        (snapshot) => {
          const users: User[] =
            [];

          snapshot.forEach(
            (docSnap) => {
              const user =
                docSnap.data() as User;

              if (user) {
                users.push({
                  ...user,
                  id:
                    user.id ||
                    docSnap.id,
                });
              }
            },
          );

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

    const unsubSantri =
      onSnapshot(
        collection(
          db,
          COLLECTIONS.SANTRI,
        ),
        (snapshot) => {
          const santriList:
            Santri[] = [];

          snapshot.forEach(
            (docSnap) => {
              const santri =
                docSnap.data() as Santri;

              if (
                santri?.idSantri
              ) {
                santriList.push({
                  ...santri,
                  kelas:
                    normalizeKelas(
                      santri.kelas,
                    ),
                });
              }
            },
          );

          if (
            santriList.length >
            0
          ) {
            localStorage.setItem(
              STORAGE_KEYS.SANTRI,
              JSON.stringify(
                santriList,
              ),
            );

            onUpdate?.();
          }
        },
        (err) => {
          console.warn(
            'Santri firestore sync error:',
            err,
          );
        },
      );

    const syncRecords = <
      T extends {
        id: string;
        timestamp: string;
      },
    >(
      collectionName: string,
      storageKey: string,
    ) =>
      onSnapshot(
        collection(
          db,
          collectionName,
        ),
        (snapshot) => {
          const records: T[] =
            [];

          snapshot.forEach(
            (docSnap) => {
              const record =
                docSnap.data() as T;

              if (record?.id) {
                records.push(
                  record,
                );
              }
            },
          );

          records.sort(
            (a, b) =>
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

    const unsubZiyadah =
      syncRecords<ZiyadahRecord>(
        COLLECTIONS.ZIYADAH,
        STORAGE_KEYS.ZIYADAH,
      );

    const unsubMurojaah =
      syncRecords<MurojaahRecord>(
        COLLECTIONS.MUROJAAH,
        STORAGE_KEYS.MUROJAAH,
      );

    const unsubBinnadzor =
      syncRecords<BinnadzorRecord>(
        COLLECTIONS.BINNADZOR,
        STORAGE_KEYS.BINNADZOR,
      );

    const unsubPembelajaran =
      syncRecords<PembelajaranRecord>(
        COLLECTIONS.PEMBELAJARAN,
        STORAGE_KEYS.PEMBELAJARAN,
      );

    const unsubKelas =
      onSnapshot(
        collection(
          db,
          COLLECTIONS.KELAS,
        ),
        (snapshot) => {
          const kelasList:
            Kelas[] = [];

          snapshot.forEach(
            (docSnap) => {
              const kelas =
                docSnap.data() as Kelas;

              if (kelas?.id) {
                kelasList.push({
                  ...kelas,
                  tipeKelas:
                    normalizeTipeKelas(
                      kelas.tipeKelas,
                    ),
                });
              }
            },
          );

          localStorage.setItem(
            STORAGE_KEYS.KELAS,
            JSON.stringify(
              kelasList,
            ),
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

    const unsubPantauanConfig =
      onSnapshot(
        doc(
          db,
          COLLECTIONS.PANTAUAN_CONFIG,
          'pantauan-config-001',
        ),
        (snapshot) => {
          if (
            snapshot.exists()
          ) {
            const config =
              snapshot.data() as ProgramPantauanConfig;

            localStorage.setItem(
              STORAGE_KEYS.PANTAUAN_CONFIG,
              JSON.stringify(
                config,
              ),
            );

            onUpdate?.();
          }
        },
        (err) => {
          console.warn(
            'Pantauan config firestore sync error:',
            err,
          );
        },
      );

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

  async saveZiyadah(
    record: Omit<
      ZiyadahRecord,
      'id'
    > & {
      timestamp?: string;
    },
  ): Promise<ZiyadahRecord> {
    const records =
      this.getZiyadahRecords();

    const santri =
      this.getSantriList().find(
        (item) =>
          item.idSantri ===
          record.idSantri,
      );

    const newRecord:
      ZiyadahRecord = {
        ...record,
        id: `ZYD-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`,
        timestamp:
          record.timestamp ||
          createTimestamp(),
        namaSantri:
          santri?.namaSantri ||
          record.idSantri,
      };

    records.unshift(
      newRecord,
    );

    localStorage.setItem(
      STORAGE_KEYS.ZIYADAH,
      JSON.stringify(records),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.ZIYADAH,
        newRecord.id,
      ),
      cleanForFirestore(
        newRecord,
      ),
    );

    return newRecord;
  },

  async saveMurojaah(
    record: Omit<
      MurojaahRecord,
      'id'
    > & {
      timestamp?: string;
    },
  ): Promise<MurojaahRecord> {
    const records =
      this.getMurojaahRecords();

    const santri =
      this.getSantriList().find(
        (item) =>
          item.idSantri ===
          record.idSantri,
      );

    const newRecord:
      MurojaahRecord = {
        ...record,
        id: `MRJ-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`,
        timestamp:
          record.timestamp ||
          createTimestamp(),
        namaSantri:
          santri?.namaSantri ||
          record.idSantri,
      };

    records.unshift(
      newRecord,
    );

    localStorage.setItem(
      STORAGE_KEYS.MUROJAAH,
      JSON.stringify(records),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.MUROJAAH,
        newRecord.id,
      ),
      cleanForFirestore(
        newRecord,
      ),
    );

    return newRecord;
  },

  async saveBinnadzor(
    record: Omit<
      BinnadzorRecord,
      'id'
    > & {
      timestamp?: string;
    },
  ): Promise<BinnadzorRecord> {
    const records =
      this.getBinnadzorRecords();

    const santri =
      this.getSantriList().find(
        (item) =>
          item.idSantri ===
          record.idSantri,
      );

    const newRecord:
      BinnadzorRecord = {
        ...record,
        id: `BND-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`,
        timestamp:
          record.timestamp ||
          createTimestamp(),
        namaSantri:
          santri?.namaSantri ||
          record.idSantri,
      };

    records.unshift(
      newRecord,
    );

    localStorage.setItem(
      STORAGE_KEYS.BINNADZOR,
      JSON.stringify(records),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.BINNADZOR,
        newRecord.id,
      ),
      cleanForFirestore(
        newRecord,
      ),
    );

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

    const santri =
      this.getSantriList().find(
        (item) =>
          item.idSantri ===
          record.idSantri,
      );

    const newRecord:
      PembelajaranRecord = {
        ...record,
        id: `PBL-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase()}`,
        timestamp:
          record.timestamp ||
          createTimestamp(),
        namaSantri:
          santri?.namaSantri ||
          record.idSantri,
      };

    records.unshift(
      newRecord,
    );

    localStorage.setItem(
      STORAGE_KEYS.PEMBELAJARAN,
      JSON.stringify(records),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.PEMBELAJARAN,
        newRecord.id,
      ),
      cleanForFirestore(
        newRecord,
      ),
    );

    return newRecord;
  },

  async deleteRecord(
    type:
      | 'Ziyadah'
      | 'Murojaah'
      | 'Binnadzor'
      | 'Pembelajaran',
    id: string,
  ): Promise<boolean> {
    const mapping = {
      Ziyadah: {
        records:
          this.getZiyadahRecords(),
        storage:
          STORAGE_KEYS.ZIYADAH,
        collection:
          COLLECTIONS.ZIYADAH,
      },

      Murojaah: {
        records:
          this.getMurojaahRecords(),
        storage:
          STORAGE_KEYS.MUROJAAH,
        collection:
          COLLECTIONS.MUROJAAH,
      },

      Binnadzor: {
        records:
          this.getBinnadzorRecords(),
        storage:
          STORAGE_KEYS.BINNADZOR,
        collection:
          COLLECTIONS.BINNADZOR,
      },

      Pembelajaran: {
        records:
          this.getPembelajaranRecords(),
        storage:
          STORAGE_KEYS.PEMBELAJARAN,
        collection:
          COLLECTIONS.PEMBELAJARAN,
      },
    }[type];

    const records =
      mapping.records.filter(
        (record) =>
          record.id !== id,
      );

    localStorage.setItem(
      mapping.storage,
      JSON.stringify(records),
    );

    await deleteDoc(
      doc(
        db,
        mapping.collection,
        id,
      ),
    );

    return true;
  },

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
    const updateAndSave =
      async <T extends { id: string }>(
        records: T[],
        storageKey: string,
        collectionName: string,
      ) => {
        const updated =
          records.map(
            (record) =>
              record.id === id
                ? ({
                    ...record,
                    ...updatedData,
                  } as T)
                : record,
          );

        localStorage.setItem(
          storageKey,
          JSON.stringify(updated),
        );

        const target =
          updated.find(
            (record) =>
              record.id === id,
          );

        if (target) {
          await setDoc(
            doc(
              db,
              collectionName,
              id,
            ),
            cleanForFirestore(
              target,
            ),
            {
              merge: true,
            },
          );
        }
      };

    if (type === 'Ziyadah') {
      await updateAndSave(
        this.getZiyadahRecords(),
        STORAGE_KEYS.ZIYADAH,
        COLLECTIONS.ZIYADAH,
      );
    }

    if (type === 'Murojaah') {
      await updateAndSave(
        this.getMurojaahRecords(),
        STORAGE_KEYS.MUROJAAH,
        COLLECTIONS.MUROJAAH,
      );
    }

    if (type === 'Binnadzor') {
      await updateAndSave(
        this.getBinnadzorRecords(),
        STORAGE_KEYS.BINNADZOR,
        COLLECTIONS.BINNADZOR,
      );
    }

    if (
      type === 'Pembelajaran'
    ) {
      await updateAndSave(
        this.getPembelajaranRecords(),
        STORAGE_KEYS.PEMBELAJARAN,
        COLLECTIONS.PEMBELAJARAN,
      );
    }

    return true;
  },

  async addSantri(
    santri: Santri,
    defaultPassword = '123',
  ): Promise<Santri> {
    const list =
      this.getSantriList();

    const existingIndex =
      list.findIndex(
        (item) =>
          item.idSantri ===
          santri.idSantri,
      );

    if (existingIndex >= 0) {
      list[existingIndex] =
        santri;
    } else {
      list.push(santri);
    }

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(list),
    );

    const users =
      this.getUsers();

    const waliUsername =
      `wali_${santri.idSantri.toLowerCase()}`;

    let waliUser =
      users.find(
        (user) =>
          user.username.toLowerCase() ===
          waliUsername.toLowerCase(),
      );

    if (!waliUser) {
      waliUser = {
        id: `USR-WLI-${santri.idSantri}`,
        username:
          waliUsername,
        password:
          defaultPassword,
        role: 'Wali',
        nama:
          santri.waliNama
            ? `Wali ${santri.namaSantri} (${santri.waliNama})`
            : `Wali ${santri.namaSantri}`,
        idSantri:
          santri.idSantri,
      };

      users.push(
        waliUser,
      );
    } else {
      waliUser.nama =
        santri.waliNama
          ? `Wali ${santri.namaSantri} (${santri.waliNama})`
          : `Wali ${santri.namaSantri}`;

      waliUser.idSantri =
        santri.idSantri;
    }

    let santriUser =
      users.find(
        (user) =>
          user.username.toLowerCase() ===
          santri.idSantri.toLowerCase(),
      );

    if (!santriUser) {
      santriUser = {
        id: `USR-STR-${santri.idSantri}`,
        username:
          santri.idSantri,
        password:
          defaultPassword,
        role: 'Santri',
        nama:
          santri.namaSantri,
        idSantri:
          santri.idSantri,
      };

      users.push(
        santriUser,
      );
    } else {
      santriUser.nama =
        santri.namaSantri;

      santriUser.idSantri =
        santri.idSantri;
    }

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(users),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.SANTRI,
        santri.idSantri,
      ),
      cleanForFirestore(
        santri,
      ),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        waliUser.id,
      ),
      cleanForFirestore(
        waliUser,
      ),
    );

    await setDoc(
      doc(
        db,
        COLLECTIONS.USERS,
        santriUser.id,
      ),
      cleanForFirestore(
        santriUser,
      ),
    );

    return santri;
  },

  async updateSantri(
    idSantri: string,
    updatedData:
      Partial<Santri>,
  ): Promise<boolean> {
    const list =
      this.getSantriList().map(
        (santri) =>
          santri.idSantri ===
          idSantri
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

    const target =
      list.find(
        (santri) =>
          santri.idSantri ===
          idSantri,
      );

    if (target) {
      await setDoc(
        doc(
          db,
          COLLECTIONS.SANTRI,
          idSantri,
        ),
        cleanForFirestore(
          target,
        ),
        {
          merge: true,
        },
      );
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

    const remoteUsers =
      await getDocs(
        collection(
          db,
          COLLECTIONS.USERS,
        ),
      );

    const related =
      remoteUsers.docs.filter(
        (userDoc) => {
          const data =
            userDoc.data();

          return (
            data.idSantri ===
              idSantri ||
            String(
              data.username ||
                '',
            ).toLowerCase() ===
              idSantri.toLowerCase()
          );
        },
      );

    if (
      related.some(
        (userDoc) =>
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
        (userDoc) =>
          userDoc.ref,
      ),
    ];

    if (
      deleteRelatedHistory
    ) {
      for (const name of [
        COLLECTIONS.ZIYADAH,
        COLLECTIONS.MUROJAAH,
        COLLECTIONS.BINNADZOR,
        COLLECTIONS.PEMBELAJARAN,
        COLLECTIONS.WIRID_YAUMIYYAH,
      ]) {
        const records =
          await getDocs(
            query(
              collection(
                db,
                name,
              ),
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
        'Riwayat terlalu besar untuk penghapusan sekaligus.',
      );
    }

    const batch =
      writeBatch(db);

    refs.forEach((ref) =>
      batch.delete(ref),
    );

    await batch.commit();

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(
        this.getSantriList().filter(
          (santri) =>
            santri.idSantri !==
            idSantri,
        ),
      ),
    );

    const deletedIds =
      new Set(
        related.map(
          (userDoc) =>
            userDoc.id,
        ),
      );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(
        this.getUsers().filter(
          (user) =>
            !deletedIds.has(
              user.id,
            ),
        ),
      ),
    );

    return true;
  },

  async addUser(
    user: User,
  ): Promise<User> {
    if (
      user.role ===
      'Superadmin'
    ) {
      throw new Error(
        'Superadmin hanya dapat ditetapkan melalui administrasi Firebase.',
      );
    }

    const users =
      this.getUsers();

    const ensuredUser:
      User = {
        id:
          user.id ||
          `USR-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase()}`,

        username:
          user.username
            ?.trim()
            .toLowerCase() ||
          '',

        password:
          user.password?.trim() ||
          '123',

        role:
          user.role ||
          'Ustadz',

        nama:
          user.nama?.trim() ||
          'Ustadz Pengajar',

        idSantri:
          isStaffRole(
            user.role,
          )
            ? ''
            : user.idSantri ||
              '',
      };

    if (
      users.some(
        (existing) =>
          existing.username.toLowerCase() ===
          ensuredUser.username.toLowerCase(),
      )
    ) {
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
      cleanForFirestore(
        ensuredUser,
      ),
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
    updatedData:
      Partial<User>,
  ): Promise<boolean> {
    const remote =
      await getDocFromServer(
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
      this.getSession()?.id ===
        id &&
      Object.keys(
        updatedData,
      ).every(
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
      updatedData.role ===
        'Superadmin'
    ) {
      throw new Error(
        'Perubahan superadmin hanya melalui administrasi Firebase.',
      );
    }

    const cleanUpdate = {
      ...updatedData,
    };

    if (
      cleanUpdate.username
    ) {
      cleanUpdate.username =
        cleanUpdate.username
          .trim()
          .toLowerCase();
    }

    if (
      cleanUpdate.password
    ) {
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
      cleanForFirestore(
        target,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(
        this.getUsers().map(
          (user) =>
            user.id === id
              ? target
              : user,
        ),
      ),
    );

    if (
      this.getSession()?.id ===
      id
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

    const targetRef =
      doc(
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

        transaction.delete(
          targetRef,
        );
      },
    );

    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(
        this.getUsers().filter(
          (user) =>
            user.id !== id,
        ),
      ),
    );

    if (
      this.getSession()?.id ===
      id
    ) {
      this.setSession(null);
    }

    return true;
  },

  getSession():
    User | null {
    const data =
      localStorage.getItem(
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

  async addKelas(
    kelas: Kelas,
  ): Promise<Kelas> {
    const list =
      this.getKelasList();

    const assignedIds =
      new Set(
        kelas.santriIds ||
          [],
      );

    for (
      const existingKelas of list
    ) {
      if (
        existingKelas.id !==
          kelas.id &&
        existingKelas
          .santriIds?.length
      ) {
        existingKelas.santriIds =
          existingKelas.santriIds.filter(
            (id) =>
              !assignedIds.has(
                id,
              ),
          );

        await setDoc(
          doc(
            db,
            COLLECTIONS.KELAS,
            existingKelas.id,
          ),
          cleanForFirestore(
            existingKelas,
          ),
          {
            merge: true,
          },
        );
      }
    }

    const index =
      list.findIndex(
        (existing) =>
          existing.id ===
          kelas.id,
      );

    if (index >= 0) {
      list[index] = kelas;
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
      cleanForFirestore(
        kelas,
      ),
    );

    return kelas;
  },

  async updateKelas(
    id: string,
    updatedData:
      Partial<Kelas>,
  ): Promise<boolean> {
    const list =
      this.getKelasList();

    const updatedList =
      list.map(
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
      JSON.stringify(
        updatedList,
      ),
    );

    const target =
      updatedList.find(
        (kelas) =>
          kelas.id === id,
      );

    if (target) {
      await setDoc(
        doc(
          db,
          COLLECTIONS.KELAS,
          id,
        ),
        cleanForFirestore(
          target,
        ),
        {
          merge: true,
        },
      );
    }

    return true;
  },

  async deleteKelas(
    id: string,
  ): Promise<boolean> {
    const list =
      this.getKelasList();

    const updatedList =
      list.filter(
        (kelas) =>
          kelas.id !== id,
      );

    localStorage.setItem(
      STORAGE_KEYS.KELAS,
      JSON.stringify(
        updatedList,
      ),
    );

    await deleteDoc(
      doc(
        db,
        COLLECTIONS.KELAS,
        id,
      ),
    );

    return true;
  },

  async resetToDefault():
    Promise<void> {
    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify([]),
    );

    localStorage.setItem(
      STORAGE_KEYS.SANTRI,
      JSON.stringify(
        INITIAL_SANTRI,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.ZIYADAH,
      JSON.stringify(
        INITIAL_ZIYADAH,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.MUROJAAH,
      JSON.stringify(
        INITIAL_MUROJAAH,
      ),
    );

    localStorage.setItem(
      STORAGE_KEYS.BINNADZOR,
      JSON.stringify(
        INITIAL_BINNADZOR,
      ),
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