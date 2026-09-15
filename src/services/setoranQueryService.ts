import type {
  BinnadzorRecord,
  MurojaahRecord,
  PembelajaranRecord,
  ZiyadahRecord,
} from '../types';
import { sortAndDedupeRecords } from '../utils/setoranDataset';
import {
  setoranFirestoreAdapter,
  type SetoranCollectionName,
  type SetoranFirestoreAdapter,
} from './setoranFirestoreAdapter';
import type { SetoranDataset, SetoranDateRange } from './setoranQuery.types';

const SETORAN_COLLECTIONS: SetoranCollectionName[] = [
  'ziyadah',
  'murojaah',
  'binnadzor',
  'pembelajaran',
];

interface SetoranRecordByCollection {
  ziyadah: ZiyadahRecord;
  murojaah: MurojaahRecord;
  binnadzor: BinnadzorRecord;
  pembelajaran: PembelajaranRecord;
}

export interface SetoranQueryServiceOptions {
  onInvalidRecord?: (collection: SetoranCollectionName, id: string) => void;
}

export interface SetoranQueryService {
  fetchRecordsByRange(
    range: SetoranDateRange,
    deletedIds?: ReadonlySet<string>,
  ): Promise<SetoranDataset>;
  fetchAllRecords(deletedIds?: ReadonlySet<string>): Promise<SetoranDataset>;
  fetchRecordsBySantri(
    idSantri: string,
    deletedIds?: ReadonlySet<string>,
  ): Promise<SetoranDataset>;
  subscribeRecentRecords(
    range: SetoranDateRange,
    onData: (records: SetoranDataset) => void,
    onError: (error: Error) => void,
    deletedIds?: ReadonlySet<string>,
  ): () => void;
}

function createEmptyDataset(): SetoranDataset {
  return {
    ziyadah: [],
    murojaah: [],
    binnadzor: [],
    pembelajaran: [],
  };
}

export function createSetoranQueryService(
  adapter: SetoranFirestoreAdapter = setoranFirestoreAdapter,
  options: SetoranQueryServiceOptions = {},
): SetoranQueryService {
  const reportInvalid = options.onInvalidRecord ?? (() => {});

  function normalizeCollection<K extends SetoranCollectionName>(
    collectionName: K,
    records: unknown[],
    deletedIds: ReadonlySet<string>,
  ): SetoranRecordByCollection[K][] {
    const candidates = records.filter(
      (record): record is SetoranRecordByCollection[K] => {
        if (!record || typeof record !== 'object') {
          reportInvalid(collectionName, '(missing id)');
          return false;
        }

        const candidate = record as { id?: unknown; timestamp?: unknown };
        if (typeof candidate.id !== 'string' || typeof candidate.timestamp !== 'string') {
          reportInvalid(
            collectionName,
            typeof candidate.id === 'string' ? candidate.id : '(missing id)',
          );
          return false;
        }
        return !deletedIds.has(candidate.id);
      },
    );

    return sortAndDedupeRecords(candidates, record => {
      reportInvalid(collectionName, record.id);
    });
  }

  async function fetchDataset(
    fetchCollection: (collectionName: SetoranCollectionName) => Promise<unknown[]>,
    deletedIds: ReadonlySet<string>,
  ): Promise<SetoranDataset> {
    const results = await Promise.all(
      SETORAN_COLLECTIONS.map(collectionName => fetchCollection(collectionName)),
    );

    return {
      ziyadah: normalizeCollection('ziyadah', results[0], deletedIds),
      murojaah: normalizeCollection('murojaah', results[1], deletedIds),
      binnadzor: normalizeCollection('binnadzor', results[2], deletedIds),
      pembelajaran: normalizeCollection('pembelajaran', results[3], deletedIds),
    };
  }

  return {
    fetchRecordsByRange(range, deletedIds = new Set()) {
      return fetchDataset(
        collectionName => adapter.fetchRange(collectionName, range),
        deletedIds,
      );
    },

    fetchAllRecords(deletedIds = new Set()) {
      return fetchDataset(
        collectionName => adapter.fetchAll(collectionName),
        deletedIds,
      );
    },

    fetchRecordsBySantri(idSantri, deletedIds = new Set()) {
      return fetchDataset(
        collectionName => adapter.fetchBySantri(collectionName, idSantri),
        deletedIds,
      );
    },

    subscribeRecentRecords(range, onData, onError, deletedIds = new Set()) {
      const current = createEmptyDataset();
      const initialized = new Set<SetoranCollectionName>();
      let disposed = false;

      const unsubscribers = SETORAN_COLLECTIONS.map(collectionName =>
        adapter.subscribe(
          collectionName,
          range,
          records => {
            if (disposed) return;
            current[collectionName] = normalizeCollection(
              collectionName,
              records,
              deletedIds,
            ) as never;
            initialized.add(collectionName);

            if (initialized.size === SETORAN_COLLECTIONS.length) {
              onData({
                ziyadah: [...current.ziyadah],
                murojaah: [...current.murojaah],
                binnadzor: [...current.binnadzor],
                pembelajaran: [...current.pembelajaran],
              });
            }
          },
          error => {
            if (!disposed) onError(error);
          },
        ),
      );

      return () => {
        if (disposed) return;
        disposed = true;
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    },
  };
}

export const setoranQueryService = createSetoranQueryService();
