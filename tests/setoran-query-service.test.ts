import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  SetoranCollectionName,
  SetoranFirestoreAdapter,
} from '../src/services/setoranFirestoreAdapter';
import type {
  SetoranDateRange,
  SetoranDataset,
} from '../src/services/setoranQuery.types';
import { createSetoranQueryService } from '../src/services/setoranQueryService';

const COLLECTIONS: SetoranCollectionName[] = [
  'ziyadah',
  'murojaah',
  'binnadzor',
  'pembelajaran',
];

const RANGE: SetoranDateRange = {
  startInclusive: '2026-09-01 00:00',
  endExclusive: '2026-10-01 00:00',
};

const FIXTURES: SetoranDataset = {
  ziyadah: [{
    id: 'ZYD-1',
    timestamp: '2026-09-15 07:00',
    idSantri: 'S-1',
    namaSantri: 'Ahmad',
    surah: 'Al-Baqarah',
    ayatAwal: 1,
    ayatAkhir: 5,
    nilai: 'Baik',
    catatan: '',
    inputBy: 'Ustadz',
  }],
  murojaah: [{
    id: 'MRJ-1',
    timestamp: '2026-09-15 07:05',
    idSantri: 'S-1',
    namaSantri: 'Ahmad',
    surahAtauJuz: 'Juz 1',
    nilai: 'Sangat Baik',
    catatan: '',
    inputBy: 'Ustadz',
  }],
  binnadzor: [{
    id: 'BND-1',
    timestamp: '2026-09-15 07:10',
    idSantri: 'S-1',
    namaSantri: 'Ahmad',
    modeInput: 'halaman',
    halamanAwal: 1,
    halamanAkhir: 2,
    materi: 'Halaman 1–2',
    nilai: 'Baik',
    catatan: '',
    inputBy: 'Ustadz',
  }],
  pembelajaran: [{
    id: 'PBL-1',
    timestamp: '2026-09-15 07:15',
    idSantri: 'S-1',
    namaSantri: 'Ahmad',
    tipeKelas: 'Jilid',
    jilidAtauKategori: 'Ummi Jilid 1',
    materiPokok: 'Halaman 5',
    nilai: 'Baik',
    inputBy: 'Ustadz',
  }],
};

function createFakeAdapter(
  seed: Partial<Record<SetoranCollectionName, unknown[]>> = FIXTURES,
): SetoranFirestoreAdapter & {
  rangeCalls: Array<{ collection: SetoranCollectionName; range: SetoranDateRange }>;
  allCalls: SetoranCollectionName[];
  santriCalls: Array<{ collection: SetoranCollectionName; idSantri: string }>;
  unsubscribeCount: number;
  emit(collection: SetoranCollectionName, records: unknown[]): void;
  rejectRangeCollection: SetoranCollectionName | null;
} {
  const listeners = new Map<SetoranCollectionName, (records: unknown[]) => void>();
  const fake = {
    rangeCalls: [] as Array<{ collection: SetoranCollectionName; range: SetoranDateRange }>,
    allCalls: [] as SetoranCollectionName[],
    santriCalls: [] as Array<{ collection: SetoranCollectionName; idSantri: string }>,
    unsubscribeCount: 0,
    rejectRangeCollection: null as SetoranCollectionName | null,
    subscribe(
      collectionName: SetoranCollectionName,
      range: SetoranDateRange,
      onData: (records: unknown[]) => void,
      _onError: (error: Error) => void,
    ) {
      fake.rangeCalls.push({ collection: collectionName, range });
      listeners.set(collectionName, onData);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        fake.unsubscribeCount += 1;
        listeners.delete(collectionName);
      };
    },
    async fetchRange(
      collectionName: SetoranCollectionName,
      range: SetoranDateRange,
    ) {
      fake.rangeCalls.push({ collection: collectionName, range });
      if (fake.rejectRangeCollection === collectionName) {
        throw new Error(`failed:${collectionName}`);
      }
      return seed[collectionName] ?? [];
    },
    async fetchAll(collectionName: SetoranCollectionName) {
      fake.allCalls.push(collectionName);
      return seed[collectionName] ?? [];
    },
    async fetchBySantri(
      collectionName: SetoranCollectionName,
      idSantri: string,
    ) {
      fake.santriCalls.push({ collection: collectionName, idSantri });
      return (seed[collectionName] ?? []).filter(
        record => (record as { idSantri?: string }).idSantri === idSantri,
      );
    },
    emit(collectionName: SetoranCollectionName, records: unknown[]) {
      listeners.get(collectionName)?.(records);
    },
  };
  return fake;
}

test('fetchRecordsByRange queries all four collections and returns their typed datasets', async () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);

  const result = await service.fetchRecordsByRange(RANGE);

  assert.deepEqual(adapter.rangeCalls, COLLECTIONS.map(collection => ({ collection, range: RANGE })));
  assert.deepEqual(result, FIXTURES);
});

test('fetchRecordsByRange rejects instead of returning a partial dataset', async () => {
  const adapter = createFakeAdapter();
  adapter.rejectRangeCollection = 'binnadzor';
  const service = createSetoranQueryService(adapter);

  await assert.rejects(service.fetchRecordsByRange(RANGE), /failed:binnadzor/);
});

test('fetchAllRecords queries all collections only when explicitly called', async () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);

  assert.deepEqual(adapter.allCalls, []);
  const result = await service.fetchAllRecords();

  assert.deepEqual(adapter.allCalls, COLLECTIONS);
  assert.deepEqual(result, FIXTURES);
});

test('fetchRecordsBySantri queries each collection using the requested id', async () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);

  const result = await service.fetchRecordsBySantri('S-1');

  assert.deepEqual(
    adapter.santriCalls,
    COLLECTIONS.map(collection => ({ collection, idSantri: 'S-1' })),
  );
  assert.equal(result.ziyadah.length, 1);
  assert.equal(result.pembelajaran.length, 1);
});

test('subscribeRecentRecords waits for all initial collection snapshots', () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);
  const emissions: SetoranDataset[] = [];

  const unsubscribe = service.subscribeRecentRecords(
    RANGE,
    data => emissions.push(data),
    error => assert.fail(error.message),
  );
  adapter.emit('ziyadah', FIXTURES.ziyadah);
  adapter.emit('murojaah', FIXTURES.murojaah);
  adapter.emit('binnadzor', FIXTURES.binnadzor);
  assert.equal(emissions.length, 0);

  adapter.emit('pembelajaran', FIXTURES.pembelajaran);
  assert.equal(emissions.length, 1);
  assert.deepEqual(emissions[0], FIXTURES);

  unsubscribe();
  unsubscribe();
  assert.equal(adapter.unsubscribeCount, 4);
});

test('subscribeRecentRecords emits later updates after initialization', () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);
  const emissions: SetoranDataset[] = [];
  service.subscribeRecentRecords(RANGE, data => emissions.push(data), () => {});

  for (const collection of COLLECTIONS) {
    adapter.emit(collection, FIXTURES[collection]);
  }
  adapter.emit('murojaah', []);

  assert.equal(emissions.length, 2);
  assert.deepEqual(emissions[1].murojaah, []);
});

test('deleted ids and duplicate ids are excluded before a range result is returned', async () => {
  const adapter = createFakeAdapter({
    ziyadah: [FIXTURES.ziyadah[0], FIXTURES.ziyadah[0]],
  });
  const service = createSetoranQueryService(adapter);

  const result = await service.fetchRecordsByRange(
    RANGE,
    new Set([FIXTURES.ziyadah[0].id]),
  );

  assert.deepEqual(result.ziyadah, []);
});

test('invalid timestamps are reported without mutating their Firestore data', async () => {
  const diagnostics: string[] = [];
  const invalid = {
    ...FIXTURES.ziyadah[0],
    id: 'BROKEN',
    timestamp: '15/09/2026',
  };
  const adapter = createFakeAdapter({ ziyadah: [invalid] });
  const service = createSetoranQueryService(adapter, {
    onInvalidRecord: (collection, id) => diagnostics.push(`${collection}:${id}`),
  });

  const result = await service.fetchRecordsByRange(RANGE);

  assert.deepEqual(result.ziyadah, []);
  assert.deepEqual(diagnostics, ['ziyadah:BROKEN']);
  assert.equal(invalid.timestamp, '15/09/2026');
});
