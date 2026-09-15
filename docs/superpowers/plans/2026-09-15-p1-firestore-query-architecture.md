# P1 Firestore Query Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace startup-wide setoran listeners with separate recent realtime, analytics-range, historical-range, and administrative query channels without changing Firestore documents or displayed data meaning.

**Architecture:** A typed `setoranQueryService` will own every Firestore read for Ziyadah, Murojaah, Binnadzor, and Pembelajaran. Focused React hooks will manage recent, analytics, and historical channel state; `storageService` will retain mutations and master-data synchronization until P5.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Firebase/Firestore 12, Node 22 test runner with `tsx`.

**Spec:** `docs/superpowers/specs/2026-09-15-p1-firestore-query-architecture-design.md`

## Global Constraints

- Merge P0 PR #39 into `main` before creating the P1 implementation worktree.
- Do not migrate, rewrite, or delete existing Firestore documents.
- Recent realtime coverage is exactly the latest 30 calendar days.
- Default analytics coverage is six months; twelve months loads only when selected.
- Firestore remains the source of truth for every historical request.
- P1 does not implement role-scoped queries, monthly summaries, the final LocalStorage policy, or the History Accordion.
- The P2 History Accordion must consume the P1 historical range boundary and must never require a global full-history array.
- A query error and a successful empty query are distinct states.
- Keep the last successful channel data visible when a refresh fails.
- Every listener must unsubscribe on logout, auth change, and unmount.
- No new runtime dependency is required; tests use the existing `tsx` dev dependency.

---

## File Structure

### New files

- `src/services/setoranQuery.types.ts` — shared dataset, range, channel-state, adapter, and service interfaces.
- `src/utils/setoranDataset.ts` — pure timestamp boundaries, deterministic sorting, merging, and ID deduplication.
- `src/services/setoranFirestoreAdapter.ts` — the only module that translates query requests into Firestore calls.
- `src/services/setoranQueryService.ts` — four-collection orchestration, recent subscriptions, range reads, and santri reads.
- `src/state/setoranChannelReducer.ts` — pure channel state transitions and latest-request-wins logic.
- `src/hooks/useRecentSetoranRecords.ts` — recent 30-day realtime lifecycle.
- `src/hooks/useAnalyticsSetoranRecords.ts` — six/twelve-month one-time analytics lifecycle.
- `src/hooks/useHistoricalSetoranRecords.ts` — on-demand History range and compatibility all-history lifecycle.
- `tests/setoran-dataset.test.ts` — pure dataset and timestamp contract tests.
- `tests/setoran-query-service.test.ts` — adapter-driven query service tests.
- `tests/setoran-channel-reducer.test.ts` — channel state and stale-response tests.
- `tests/setoran-consumer-contracts.test.mjs` — source contracts preventing consumers from returning to global arrays.
- `.github/workflows/p1-query-architecture.yml` — P1 regression gate.

### Modified files

- `package.json` — add `test:p1`.
- `src/App.tsx` — own reference data separately and connect query hooks to consumers.
- `src/services/storageService.ts` — retain master-data listeners, remove default setoran-wide reads, and query before santri deletion.
- `src/services/cloudCommitGate.ts` — make old-record edits independent of LocalStorage completeness.
- `src/components/UstadzDashboard.tsx` — use recent data for operations and analytics data for charts.
- `src/components/WaliDashboard.tsx` — use recent data for activity and analytics data for trends.
- `src/components/SantriDashboard.tsx` — use recent data for activity and analytics data for trends.
- `src/components/HistoryTable.tsx` — request current month, custom range, or explicit all-history data on demand.
- `src/components/UnduhLaporanModal.tsx` — fetch the selected report period before PDF generation.

---

### Task 1: Typed datasets and deterministic data utilities

**Files:**
- Create: `src/services/setoranQuery.types.ts`
- Create: `src/utils/setoranDataset.ts`
- Create: `tests/setoran-dataset.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ZiyadahRecord`, `MurojaahRecord`, `BinnadzorRecord`, and `PembelajaranRecord` from `src/types/index.ts`.
- Produces: `SetoranDataset`, `SetoranDateRange`, `QueryChannelState<T>`, `EMPTY_SETORAN_DATASET`, `mergeSetoranDatasets()`, `sortAndDedupeRecords()`, `isCanonicalSetoranTimestamp()`, `createRecentRange()`, and `createMonthRange()`.

- [ ] **Step 1: Add the P1 test command**

Add this script to `package.json`:

```json
"test:p1": "node --import tsx --test tests/setoran-*.test.ts"
```

- [ ] **Step 2: Write failing dataset tests**

Create `tests/setoran-dataset.test.ts` with these cases:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMonthRange,
  createRecentRange,
  sortAndDedupeRecords,
} from '../src/utils/setoranDataset';

test('sortAndDedupeRecords keeps one record per id and sorts newest first', () => {
  const result = sortAndDedupeRecords([
    { id: 'A', timestamp: '2026-09-14 08:00' },
    { id: 'B', timestamp: '2026-09-15 07:00' },
    { id: 'A', timestamp: '2026-09-14 08:00' },
  ]);
  assert.deepEqual(result.map(record => record.id), ['B', 'A']);
});

test('equal timestamps use id as a deterministic descending tie-breaker', () => {
  const result = sortAndDedupeRecords([
    { id: 'A', timestamp: '2026-09-15 07:00' },
    { id: 'B', timestamp: '2026-09-15 07:00' },
  ]);
  assert.deepEqual(result.map(record => record.id), ['B', 'A']);
});

test('invalid timestamps are excluded and reported without rewriting the record', () => {
  const invalid: Array<{ id: string; timestamp: string }> = [];
  const result = sortAndDedupeRecords(
    [
      { id: 'VALID', timestamp: '2026-09-15 07:00' },
      { id: 'INVALID', timestamp: '15/09/2026 07:00' },
    ],
    record => invalid.push(record),
  );
  assert.deepEqual(result.map(record => record.id), ['VALID']);
  assert.deepEqual(invalid.map(record => record.id), ['INVALID']);
});

test('createRecentRange returns an inclusive 30-day start and exclusive end', () => {
  assert.deepEqual(
    createRecentRange(new Date('2026-09-15T12:00:00+07:00'), 30),
    {
      startInclusive: '2026-08-17 00:00',
      endExclusive: '2026-09-16 00:00',
    },
  );
});

test('createMonthRange handles December rollover', () => {
  assert.deepEqual(createMonthRange(2026, 11), {
    startInclusive: '2026-12-01 00:00',
    endExclusive: '2027-01-01 00:00',
  });
});
```

- [ ] **Step 3: Run the tests and confirm the missing-module failure**

Run:

```bash
npm run test:p1
```

Expected: FAIL because `setoranDataset.ts` does not exist.

- [ ] **Step 4: Add the shared types**

Create `src/services/setoranQuery.types.ts` with these public contracts:

```ts
import type {
  BinnadzorRecord,
  MurojaahRecord,
  PembelajaranRecord,
  ZiyadahRecord,
} from '../types';

export interface SetoranDataset {
  ziyadah: ZiyadahRecord[];
  murojaah: MurojaahRecord[];
  binnadzor: BinnadzorRecord[];
  pembelajaran: PembelajaranRecord[];
}

export interface SetoranDateRange {
  startInclusive: string;
  endExclusive: string;
}

export type QueryChannelStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryChannelState<T> {
  data: T;
  status: QueryChannelStatus;
  error: string | null;
  isStale: boolean;
  requestId: number;
}

export const EMPTY_SETORAN_DATASET: SetoranDataset = {
  ziyadah: [],
  murojaah: [],
  binnadzor: [],
  pembelajaran: [],
};
```

- [ ] **Step 5: Implement pure dataset utilities**

Create `src/utils/setoranDataset.ts`. The core implementation must use:

```ts
import type { SetoranDataset, SetoranDateRange } from '../services/setoranQuery.types';

type TimestampedRecord = { id: string; timestamp: string };

export function isCanonicalSetoranTimestamp(timestamp: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?Z?)?)?$/.test(timestamp);
}

export function sortAndDedupeRecords<T extends TimestampedRecord>(
  records: T[],
  onInvalid: (record: T) => void = () => {},
): T[] {
  const byId = new Map<string, T>();
  for (const record of records) {
    if (!record.id || !isCanonicalSetoranTimestamp(record.timestamp)) {
      onInvalid(record);
      continue;
    }
    if (!byId.has(record.id)) byId.set(record.id, record);
  }
  return [...byId.values()].sort(
    (left, right) =>
      right.timestamp.localeCompare(left.timestamp) ||
      right.id.localeCompare(left.id),
  );
}

export function mergeSetoranDatasets(...datasets: SetoranDataset[]): SetoranDataset {
  return {
    ziyadah: sortAndDedupeRecords(datasets.flatMap(item => item.ziyadah)),
    murojaah: sortAndDedupeRecords(datasets.flatMap(item => item.murojaah)),
    binnadzor: sortAndDedupeRecords(datasets.flatMap(item => item.binnadzor)),
    pembelajaran: sortAndDedupeRecords(datasets.flatMap(item => item.pembelajaran)),
  };
}
```

Use `Asia/Jakarta` calendar boundaries and emit the existing `YYYY-MM-DD HH:mm` format. `createRecentRange(now, 30)` starts 29 calendar days before today at 00:00 and ends tomorrow at 00:00, so the range contains exactly 30 calendar dates including today.

Invalid timestamps are never rewritten or deleted. The query service supplies an `onInvalidRecord` callback that logs the collection name and record ID for diagnosis while excluding the invalid record from ordered channel output.

- [ ] **Step 6: Run tests and static checks**

Run:

```bash
npm run test:p1
npm run lint
```

Expected: all dataset tests PASS and TypeScript emits no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json src/services/setoranQuery.types.ts src/utils/setoranDataset.ts tests/setoran-dataset.test.ts
git commit -m "test: define P1 setoran data contracts"
```

---

### Task 2: Firestore adapter and four-collection query service

**Files:**
- Create: `src/services/setoranFirestoreAdapter.ts`
- Create: `src/services/setoranQueryService.ts`
- Create: `tests/setoran-query-service.test.ts`

**Interfaces:**
- Consumes: `SetoranDataset`, `SetoranDateRange`, and `sortAndDedupeRecords()`.
- Produces:
  - `subscribeRecentRecords(range, onData, onError, deletedIds?): () => void`
  - `fetchRecordsByRange(range, deletedIds?): Promise<SetoranDataset>`
  - `fetchAllRecords(deletedIds?): Promise<SetoranDataset>`
  - `fetchRecordsBySantri(idSantri): Promise<SetoranDataset>`

- [ ] **Step 1: Write failing service tests with a fake adapter**

Create a fake adapter that records requests and returns typed arrays. Cover these assertions:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import type { SetoranCollectionName, SetoranFirestoreAdapter } from '../src/services/setoranFirestoreAdapter';
import type { SetoranDateRange, SetoranDataset } from '../src/services/setoranQuery.types';
import { createSetoranQueryService } from '../src/services/setoranQueryService';

const RANGE: SetoranDateRange = {
  startInclusive: '2026-09-01 00:00',
  endExclusive: '2026-10-01 00:00',
};
const ZIYADAH = {
  id: 'ZYD-1',
  timestamp: '2026-09-15 07:00',
  idSantri: 'S-1',
  namaSantri: 'Ahmad',
  surah: 'Al-Baqarah',
  ayatAwal: 1,
  ayatAkhir: 5,
  nilai: 'Baik' as const,
  catatan: '',
  inputBy: 'Ustadz',
};

function createFakeAdapter(
  seed: Partial<Record<SetoranCollectionName, unknown[]>> = {},
): SetoranFirestoreAdapter & {
  rangeCalls: Array<{ collection: SetoranCollectionName; range: SetoranDateRange }>;
  unsubscribeCount: number;
  emit(collection: SetoranCollectionName, records: unknown[]): void;
} {
  const listeners = new Map<SetoranCollectionName, (records: unknown[]) => void>();
  return {
    rangeCalls: [],
    unsubscribeCount: 0,
    subscribe(collectionName, range, onData) {
      this.rangeCalls.push({ collection: collectionName, range });
      listeners.set(collectionName, onData);
      return () => {
        this.unsubscribeCount += 1;
        listeners.delete(collectionName);
      };
    },
    async fetchRange(collectionName, range) {
      this.rangeCalls.push({ collection: collectionName, range });
      return seed[collectionName] ?? [];
    },
    async fetchAll(collectionName) {
      return seed[collectionName] ?? [];
    },
    async fetchBySantri(collectionName, idSantri) {
      return (seed[collectionName] ?? []).filter(
        record => (record as { idSantri?: string }).idSantri === idSantri,
      );
    },
    emit(collectionName, records) {
      listeners.get(collectionName)?.(records);
    },
  };
}

test('fetchRecordsByRange queries all four collections with the same range', async () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);
  await service.fetchRecordsByRange(RANGE);
  assert.deepEqual(
    adapter.rangeCalls.map(call => call.collection),
    ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'],
  );
  assert.ok(adapter.rangeCalls.every(call => call.range === RANGE));
});

test('subscribeRecentRecords emits only after every collection has an initial value', () => {
  const adapter = createFakeAdapter();
  const service = createSetoranQueryService(adapter);
  const emissions: SetoranDataset[] = [];
  const unsubscribe = service.subscribeRecentRecords(RANGE, data => emissions.push(data), () => {});
  adapter.emit('ziyadah', [ZIYADAH]);
  adapter.emit('murojaah', []);
  adapter.emit('binnadzor', []);
  assert.equal(emissions.length, 0);
  adapter.emit('pembelajaran', []);
  assert.equal(emissions.length, 1);
  unsubscribe();
  assert.equal(adapter.unsubscribeCount, 4);
});

test('deleted ids and duplicate ids are excluded before emission', async () => {
  const adapter = createFakeAdapter({ ziyadah: [ZIYADAH, ZIYADAH] });
  const service = createSetoranQueryService(adapter);
  const result = await service.fetchRecordsByRange(RANGE, new Set([ZIYADAH.id]));
  assert.deepEqual(result.ziyadah, []);
});

test('invalid timestamps are reported through the service diagnostic callback', async () => {
  const diagnostics: string[] = [];
  const adapter = createFakeAdapter({
    ziyadah: [{ ...ZIYADAH, id: 'BROKEN', timestamp: '15/09/2026' }],
  });
  const service = createSetoranQueryService(adapter, {
    onInvalidRecord: (collection, id) => diagnostics.push(`${collection}:${id}`),
  });
  const result = await service.fetchRecordsByRange(RANGE);
  assert.deepEqual(result.ziyadah, []);
  assert.deepEqual(diagnostics, ['ziyadah:BROKEN']);
});
```

- [ ] **Step 2: Run the service test and confirm failure**

Run:

```bash
node --import tsx --test tests/setoran-query-service.test.ts
```

Expected: FAIL because the adapter and service modules do not exist.

- [ ] **Step 3: Implement the adapter contract**

`src/services/setoranFirestoreAdapter.ts` must export:

```ts
export type SetoranCollectionName =
  | 'ziyadah'
  | 'murojaah'
  | 'binnadzor'
  | 'pembelajaran';

export interface SetoranFirestoreAdapter {
  subscribe(
    collectionName: SetoranCollectionName,
    range: SetoranDateRange,
    onData: (records: unknown[]) => void,
    onError: (error: Error) => void,
  ): () => void;
  fetchRange(
    collectionName: SetoranCollectionName,
    range: SetoranDateRange,
  ): Promise<unknown[]>;
  fetchAll(collectionName: SetoranCollectionName): Promise<unknown[]>;
  fetchBySantri(
    collectionName: SetoranCollectionName,
    idSantri: string,
  ): Promise<unknown[]>;
}
```

The Firebase implementation must use:

```ts
query(
  collection(db, collectionName),
  where('timestamp', '>=', range.startInclusive),
  where('timestamp', '<', range.endExclusive),
  orderBy('timestamp', 'desc'),
)
```

`fetchBySantri` uses `where('idSantri', '==', idSantri)`. Map every snapshot using `id: data.id || docSnap.id`.

- [ ] **Step 4: Implement service orchestration**

Use one definition table for the four dataset keys and collection names:

```ts
const DEFINITIONS = [
  ['ziyadah', 'ziyadah'],
  ['murojaah', 'murojaah'],
  ['binnadzor', 'binnadzor'],
  ['pembelajaran', 'pembelajaran'],
] as const;
```

`createSetoranQueryService(adapter, options?)` accepts
`options.onInvalidRecord(collectionName, recordId)`; the production default calls
`console.warn` without mutating the document. `subscribeRecentRecords` must:

1. keep the latest array for each key;
2. wait until all four listeners have emitted once;
3. filter `deletedIds`;
4. deduplicate and sort before calling `onData`;
5. return one function that invokes all four unsubscribe functions exactly once.

`fetchRecordsByRange`, `fetchAllRecords`, and `fetchRecordsBySantri` must use `Promise.all` and reject the combined request if any collection fails. They must not return a partial dataset as a successful result.

- [ ] **Step 5: Run service and full P1 tests**

Run:

```bash
npm run test:p1
npm run lint
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/setoranFirestoreAdapter.ts src/services/setoranQueryService.ts tests/setoran-query-service.test.ts
git commit -m "feat: add bounded Firestore setoran queries"
```

---

### Task 3: Channel reducer and React query hooks

**Files:**
- Create: `src/state/setoranChannelReducer.ts`
- Create: `src/hooks/useRecentSetoranRecords.ts`
- Create: `src/hooks/useAnalyticsSetoranRecords.ts`
- Create: `src/hooks/useHistoricalSetoranRecords.ts`
- Create: `tests/setoran-channel-reducer.test.ts`

**Interfaces:**
- Consumes: the query service from Task 2.
- Produces:
  - `useRecentSetoranRecords({ enabled, now, deletedIds, initialData })`
  - `useAnalyticsSetoranRecords({ enabled, months, refreshToken, deletedIds })`
  - `useHistoricalSetoranRecords({ enabled, deletedIds })`
  - each hook returns `{ data, status, error, isStale, retry }`.

- [ ] **Step 1: Write failing reducer tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_SETORAN_DATASET, type SetoranDataset } from '../src/services/setoranQuery.types';
import { initialChannel, reduceChannel } from '../src/state/setoranChannelReducer';

const DATA: SetoranDataset = {
  ...EMPTY_SETORAN_DATASET,
  ziyadah: [{
    id: 'NEW',
    timestamp: '2026-09-15 07:00',
    idSantri: 'S-1',
    surah: 'Al-Baqarah',
    ayatAwal: 1,
    ayatAkhir: 5,
    nilai: 'Baik',
    catatan: '',
    inputBy: 'Ustadz',
  }],
};
const OLD_DATA: SetoranDataset = {
  ...EMPTY_SETORAN_DATASET,
  ziyadah: [{ ...DATA.ziyadah[0], id: 'OLD', timestamp: '2026-08-01 07:00' }],
};

test('refresh failure preserves the last successful dataset', () => {
  const loaded = reduceChannel(initialChannel(DATA), { type: 'success', requestId: 1, data: DATA });
  const loading = reduceChannel(loaded, { type: 'start', requestId: 2 });
  const failed = reduceChannel(loading, { type: 'error', requestId: 2, error: 'offline' });
  assert.equal(failed.data, DATA);
  assert.equal(failed.status, 'error');
  assert.equal(failed.isStale, true);
});

test('an older response cannot replace a newer request', () => {
  const loading = reduceChannel(initialChannel(EMPTY_SETORAN_DATASET), {
    type: 'start',
    requestId: 2,
  });
  const ignored = reduceChannel(loading, {
    type: 'success',
    requestId: 1,
    data: OLD_DATA,
  });
  assert.equal(ignored, loading);
});

test('successful empty data is not an error', () => {
  const result = reduceChannel(initialChannel(DATA), {
    type: 'success',
    requestId: 1,
    data: EMPTY_SETORAN_DATASET,
  });
  assert.equal(result.status, 'success');
  assert.equal(result.error, null);
  assert.equal(result.isStale, false);
});
```

- [ ] **Step 2: Run the reducer test and confirm failure**

```bash
node --import tsx --test tests/setoran-channel-reducer.test.ts
```

Expected: FAIL because `setoranChannelReducer.ts` does not exist.

- [ ] **Step 3: Implement the pure reducer**

Use discriminated actions:

```ts
export type ChannelAction<T> =
  | { type: 'start'; requestId: number }
  | { type: 'success'; requestId: number; data: T }
  | { type: 'error'; requestId: number; error: string }
  | { type: 'reset'; data: T };

export function initialChannel<T>(
  data: T,
  isStale = false,
): QueryChannelState<T> {
  return {
    data,
    status: 'idle',
    error: null,
    isStale,
    requestId: 0,
  };
}

export function reduceChannel<T>(
  state: QueryChannelState<T>,
  action: ChannelAction<T>,
): QueryChannelState<T> {
  if (
    (action.type === 'success' || action.type === 'error') &&
    action.requestId !== state.requestId
  ) {
    return state;
  }
  if (action.type === 'start') {
    return { ...state, status: 'loading', error: null, requestId: action.requestId };
  }
  if (action.type === 'success') {
    return { ...state, data: action.data, status: 'success', error: null, isStale: false };
  }
  if (action.type === 'error') {
    return { ...state, status: 'error', error: action.error, isStale: true };
  }
  return initialChannel(action.data);
}
```

Ignore `success` and `error` actions whose `requestId` differs from the active request. On refresh error, preserve data and set `isStale: true`.

- [ ] **Step 4: Implement the recent hook**

`useRecentSetoranRecords` must:

- seed state from `initialData` when supplied and mark it `isStale: true` until Firestore succeeds;
- create the 30-day range once per calendar day;
- subscribe only when `enabled` is true;
- dispatch `start` before subscription;
- dispatch `success` for complete four-collection emissions;
- dispatch `error` without clearing successful data;
- unsubscribe in the effect cleanup;
- expose `retry()` by incrementing an internal retry token.

- [ ] **Step 5: Implement analytics and History hooks**

`useAnalyticsSetoranRecords` converts `months: 6 | 12` into an exact month range and calls `fetchRecordsByRange`. Increment a request ID for each range or retry and ignore stale responses through the reducer.

`useHistoricalSetoranRecords` must expose:

```ts
{
  ...channelState,
  loadRange(range: SetoranDateRange): Promise<void>,
  loadAll(): Promise<void>,
  reset(): void,
  retry(): void,
}
```

`loadAll()` is the transitional P1 compatibility path. It must be invoked only by an explicit “Semua Riwayat” action and never by hook initialization.

- [ ] **Step 6: Run tests and TypeScript**

```bash
npm run test:p1
npm run lint
```

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/state/setoranChannelReducer.ts src/hooks/useRecentSetoranRecords.ts src/hooks/useAnalyticsSetoranRecords.ts src/hooks/useHistoricalSetoranRecords.ts tests/setoran-channel-reducer.test.ts
git commit -m "feat: add isolated setoran data channels"
```

---

### Task 4: Migrate application startup and dashboards

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/services/storageService.ts`
- Modify: `src/components/UstadzDashboard.tsx`
- Modify: `src/components/WaliDashboard.tsx`
- Modify: `src/components/SantriDashboard.tsx`
- Create: `tests/setoran-consumer-contracts.test.mjs`

**Interfaces:**
- Consumes: recent and analytics hooks from Task 3.
- Produces: dashboard props that distinguish `recentRecords` from `analyticsRecords`; reference-data synchronization that contains no setoran listener.

- [ ] **Step 1: Write failing source-contract tests**

Create `tests/setoran-consumer-contracts.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
const dashboards = ['UstadzDashboard', 'WaliDashboard', 'SantriDashboard']
  .map(name => readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), 'utf8'));

test('App uses explicit recent and analytics channels', () => {
  assert.match(app, /useRecentSetoranRecords/);
  assert.match(app, /useAnalyticsSetoranRecords/);
  assert.match(app, /recentRecords=/);
  assert.match(app, /analyticsRecords=/);
});

test('reference synchronization has no setoran collection listener', () => {
  const referenceSync = storage.slice(
    storage.indexOf('initReferenceRealtimeSync'),
    storage.indexOf('async syncReferenceDataWithCloud'),
  );
  for (const collection of ['ZIYADAH', 'MUROJAAH', 'BINNADZOR', 'PEMBELAJARAN']) {
    assert.doesNotMatch(referenceSync, new RegExp(`COLLECTIONS\\.${collection}`));
  }
});

test('all dashboards distinguish recent and analytics records', () => {
  for (const dashboard of dashboards) {
    assert.match(dashboard, /recentRecords/);
    assert.match(dashboard, /analyticsRecords/);
  }
});
```

- [ ] **Step 2: Run the contract test and confirm failure**

```bash
node --test tests/setoran-consumer-contracts.test.mjs
```

Expected: FAIL because the application still owns four global storage arrays.

- [ ] **Step 3: Split reference-data synchronization**

Rename `storageService.initRealtimeSync` to `initReferenceRealtimeSync`. Keep listeners for:

- users;
- santri;
- kelas;
- app config;
- pantauan liburan.

Remove the four setoran listeners from this function and its unsubscribe list. Rename `syncWithCloud` to `syncReferenceDataWithCloud` and remove its four complete setoran `getDocs` blocks.

- [ ] **Step 4: Replace global setoran cache state in App**

Remove the four `useState(() => storageService.get...Records())` declarations. Add:

```ts
const recentChannel = useRecentSetoranRecords({
  enabled: Boolean(currentUser),
  deletedIds: storageService.getDeletedRecordIds(),
  initialData: legacyRecentFallback,
});
const [analyticsMonths, setAnalyticsMonths] = useState<6 | 12>(6);
const [analyticsRefreshToken, setAnalyticsRefreshToken] = useState(0);
const analyticsChannel = useAnalyticsSetoranRecords({
  enabled: Boolean(currentUser && activeTab === 'dashboard'),
  months: analyticsMonths,
  refreshToken: analyticsRefreshToken,
  deletedIds: storageService.getDeletedRecordIds(),
});
```

Replace `refreshData` with `refreshReferenceData`; it must update only users, santri, kelas, and other reference cache data. Manual refresh calls `syncReferenceDataWithCloud()`, retries the recent channel, and increments `analyticsRefreshToken`.

`legacyRecentFallback` is created once from the four existing cache getters, filtered to the recent 30-day range, and passed only as stale initial data. A successful Firestore result replaces it. A bounded Firestore result must not overwrite or truncate the legacy cache during P1.

- [ ] **Step 5: Give dashboards separate datasets**

Change each dashboard interface to:

```ts
interface DashboardSetoranProps {
  recentRecords: SetoranDataset;
  analyticsRecords: SetoranDataset;
  analyticsStatus: QueryChannelStatus;
  onAnalyticsMonthsChange: (months: 6 | 12) => void;
}
```

Use `recentRecords` for:

- today's count and active santri;
- seven-day rhythm;
- attention and recent activity;
- Wali/Santri latest feedback.

Use `analyticsRecords` only for `CompactTrenBulananChart` and `HafalanStatsChart`. Preserve existing chart calculations and labels.

- [ ] **Step 6: Add explicit channel feedback**

If recent initial loading has no data, keep the existing loading treatment. If recent initial load fails with no cache, show a retryable Snackbar/error state and do not render zero as authoritative statistics. If analytics refresh fails, keep the last chart and mark it stale with the existing non-blocking notification system.

- [ ] **Step 7: Run regression checks**

```bash
node --test tests/setoran-consumer-contracts.test.mjs
npm run test:p1
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/services/storageService.ts src/components/UstadzDashboard.tsx src/components/WaliDashboard.tsx src/components/SantriDashboard.tsx tests/setoran-consumer-contracts.test.mjs
git commit -m "refactor: separate dashboard data channels"
```

---

### Task 5: Move History and PDF to on-demand historical queries

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/HistoryTable.tsx`
- Modify: `src/components/UnduhLaporanModal.tsx`
- Modify: `src/hooks/useGeneratePDF.ts`
- Modify: `tests/setoran-consumer-contracts.test.mjs`

**Interfaces:**
- Consumes: `useHistoricalSetoranRecords`, `createMonthRange()`, and `SetoranDataset`.
- Produces: History range loading and `loadReportRecords(range): Promise<SetoranDataset>`.

- [ ] **Step 1: Extend failing consumer contracts**

Add:

```js
test('History loads explicit ranges and has no storage fallback', () => {
  const history = readFileSync(new URL('../src/components/HistoryTable.tsx', import.meta.url), 'utf8');
  assert.match(history, /useHistoricalSetoranRecords/);
  assert.match(history, /loadRange/);
  assert.match(history, /loadAll/);
  assert.doesNotMatch(history, /storageService\.getBinnadzorRecords/);
  assert.doesNotMatch(history, /storageService\.getPembelajaranRecords/);
});

test('PDF fetches its selected range before generation', () => {
  const modal = readFileSync(new URL('../src/components/UnduhLaporanModal.tsx', import.meta.url), 'utf8');
  assert.match(modal, /loadReportRecords/);
  assert.match(modal, /await loadReportRecords/);
});
```

- [ ] **Step 2: Run the contracts and confirm failure**

```bash
node --test tests/setoran-consumer-contracts.test.mjs
```

Expected: FAIL because History and PDF still receive global arrays.

- [ ] **Step 3: Migrate History inputs**

Remove the four setoran array props from `HistoryTableProps`. Instantiate `useHistoricalSetoranRecords` inside HistoryTable.

- On initial mount, load `activeMonthKey`, defaulting to the current Jakarta month.
- When a month chip is selected, call `loadRange(createMonthRange(year, monthIndex))`.
- When a valid custom range is applied, use start at `00:00` and exclusive end at the day after `customEndDate`.
- Invoke `loadAll()` only when the user explicitly selects “Semua Riwayat”.
- Keep the previous successful result visible while a new range loads.
- Display query errors with “Coba Lagi”; do not render the failed range as empty.
- Remove `actualBinnadzor` and `actualPembelajaran` LocalStorage fallbacks.

Build month options from the current month plus month keys found in the legacy cache, but use cache only for navigation hints. Selecting a month always performs a Firestore range query.

- [ ] **Step 4: Make report loading explicit**

Change `UnduhLaporanModalProps`:

```ts
interface UnduhLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  santriList: Santri[];
  loadReportRecords: (
    range: SetoranDateRange,
    idSantri?: string,
  ) => Promise<SetoranDataset>;
}
```

In `handleDownload`:

1. calculate an exact inclusive/exclusive range from the selected single month or month range;
2. call `await loadReportRecords(range, reportSantri?.idSantri)`;
3. pass the returned dataset into `generatePDF`;
4. show the existing error treatment if loading fails;
5. never fall back to an unrelated recent or cached dataset.

`useGeneratePDF` remains a renderer and must not call Firestore.

Until P3, `loadReportRecords` performs the range query first and then filters the returned dataset by `idSantri` in memory when an ID is supplied. Do not add a compound role-scoped Firestore query in P1.

- [ ] **Step 5: Preserve edit/delete refresh behavior**

After a successful History edit or delete, reload the active History query. Do not call a global `refreshData`. Rename the callback prop to `onMutationCommitted` and use it only to retry the current historical channel and relevant recent/analytics channels.

- [ ] **Step 6: Run History/PDF regression checks**

```bash
node --test tests/setoran-consumer-contracts.test.mjs
npm run test:p1
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/HistoryTable.tsx src/components/UnduhLaporanModal.tsx src/hooks/useGeneratePDF.ts tests/setoran-consumer-contracts.test.mjs
git commit -m "refactor: query History and PDF periods on demand"
```

---

### Task 6: Make mutations and santri deletion independent of partial cache

**Files:**
- Modify: `src/services/cloudCommitGate.ts`
- Modify: `src/services/storageService.ts`
- Modify: `src/App.tsx`
- Create: `tests/setoran-mutation-contracts.test.mjs`

**Interfaces:**
- Consumes: `fetchRecordsBySantri(idSantri)` from Task 2.
- Produces: cache-independent `updateRecord()` and chunked complete santri deletion.

- [ ] **Step 1: Write failing mutation contracts**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cloudGate = readFileSync(
  new URL('../src/services/cloudCommitGate.ts', import.meta.url),
  'utf8',
);
const storage = readFileSync(
  new URL('../src/services/storageService.ts', import.meta.url),
  'utf8',
);

test('record updates do not require the record in LocalStorage', () => {
  assert.doesNotMatch(cloudGate, /if \(!current\) return false/);
  assert.match(cloudGate, /setDoc\([\s\S]*?merge: true/);
});

test('santri deletion queries Cloud and chunks writes', () => {
  assert.match(storage, /fetchRecordsBySantri/);
  assert.match(storage, /chunkBatchOperations/);
  assert.doesNotMatch(storage, /terlalu banyak untuk satu operasi hapus Cloud/);
});
```

- [ ] **Step 2: Run the mutation contracts and confirm failure**

```bash
node --test tests/setoran-mutation-contracts.test.mjs
```

Expected: FAIL on the current cache-dependent update and 450-operation abort.

- [ ] **Step 3: Refactor record updates**

For every record type, `cloudCommitGate.updateRecord` must write:

```ts
await setDoc(
  doc(db, collectionName, id),
  cleanForFirestore({ id, ...updatedData }),
  { merge: true },
);
```

After Cloud succeeds, update the matching cache entry only if it exists. Absence from LocalStorage is not a failed mutation.

- [ ] **Step 4: Query all related santri records before deletion**

In `deleteSantri`, call:

```ts
const related = deleteRelatedHistory
  ? await setoranQueryService.fetchRecordsBySantri(idSantri)
  : EMPTY_SETORAN_DATASET;
```

Construct explicit document references for santri, matching users, and all related records.

- [ ] **Step 5: Commit deletion batches safely**

Add:

```ts
async function chunkBatchOperations(
  refs: DocumentReference[],
  chunkSize = 400,
): Promise<void> {
  for (let index = 0; index < refs.length; index += chunkSize) {
    const batch = writeBatch(db);
    refs.slice(index, index + chunkSize).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}
```

Use 400 rather than Firestore's 500-write ceiling to leave operational margin. Only update tombstones and LocalStorage after every batch succeeds. If a later batch fails, throw an explicit partial-delete error and force a Cloud refresh; never report full success.

- [ ] **Step 6: Refresh bounded channels after mutations**

Expose one App callback that retries recent, analytics, and the active historical range after a successful create, edit, delete, or batch delete. Realtime delivery remains authoritative for recent data; reducer ID deduplication prevents duplicate UI entries.

- [ ] **Step 7: Run checks**

```bash
node --test tests/setoran-mutation-contracts.test.mjs
npm run test:p1
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 8: Commit**

```bash
git add src/services/cloudCommitGate.ts src/services/storageService.ts src/App.tsx tests/setoran-mutation-contracts.test.mjs
git commit -m "fix: make historical mutations Cloud-complete"
```

---

### Task 7: Cut over from full-history reads and add the P1 CI gate

**Files:**
- Modify: `src/services/storageService.ts`
- Modify: `src/App.tsx`
- Modify: `package.json`
- Modify: `tests/setoran-consumer-contracts.test.mjs`
- Create: `.github/workflows/p1-query-architecture.yml`

**Interfaces:**
- Consumes: every P1 channel and migrated consumer.
- Produces: default startup path with no full-history setoran listener or full setoran Cloud Sync.

- [ ] **Step 1: Add final failing cutover assertions**

```js
test('default startup and manual sync contain no full setoran read', () => {
  const normalStart = storage.indexOf('initReferenceRealtimeSync');
  const rollbackStart = storage.indexOf('legacyFullSetoranSync');
  const normalReadPath = storage.slice(normalStart, rollbackStart);
  const forbidden = [
    /onSnapshot\(collection\(db, COLLECTIONS\.ZIYADAH\)/,
    /onSnapshot\(collection\(db, COLLECTIONS\.MUROJAAH\)/,
    /onSnapshot\(collection\(db, COLLECTIONS\.BINNADZOR\)/,
    /onSnapshot\(collection\(db, COLLECTIONS\.PEMBELAJARAN\)/,
    /getDocs\(collection\(db, COLLECTIONS\.ZIYADAH\)\)/,
    /getDocs\(collection\(db, COLLECTIONS\.MUROJAAH\)\)/,
    /getDocs\(collection\(db, COLLECTIONS\.BINNADZOR\)\)/,
    /getDocs\(collection\(db, COLLECTIONS\.PEMBELAJARAN\)\)/,
  ];
  for (const pattern of forbidden) assert.doesNotMatch(normalReadPath, pattern);
});
```

- [ ] **Step 2: Run the assertion and confirm failure before cutover**

```bash
node --test tests/setoran-consumer-contracts.test.mjs
```

Expected: FAIL if any old setoran-wide block remains.

- [ ] **Step 3: Remove obsolete default read paths**

Delete remaining startup and manual-sync blocks that read an entire setoran collection. Do not remove:

- cache getters required by the P1 offline compatibility path;
- Firestore mutations;
- master-data listeners;
- Pantauan Liburan listeners;
- explicit `fetchAllRecords()` invoked by “Semua Riwayat”.

- [ ] **Step 4: Add the disabled rollback switch**

The only permitted legacy path is:

```ts
const legacyFullSyncEnabled =
  import.meta.env.VITE_ENABLE_LEGACY_FULL_SETORAN_SYNC === 'true';
```

It must default to false, be isolated from the normal path, and be labelled for removal after one stable release. The CI source contract scans the normal startup and manual-sync functions rather than the isolated rollback function.

Place `legacyFullSetoranSync` after `syncReferenceDataWithCloud` so the source-contract boundary above remains deterministic. The rollback function may run only when the environment flag is true.

- [ ] **Step 5: Add the P1 workflow**

`.github/workflows/p1-query-architecture.yml` must run on pull requests to `main` when P1 files change and execute:

```yaml
- name: Install dependencies
  run: npm install --no-audit --no-fund
- name: TypeScript check
  run: npm run lint
- name: P1 behavioral tests
  run: npm run test:p1
- name: P1 consumer contracts
  run: node --test tests/setoran-consumer-contracts.test.mjs tests/setoran-mutation-contracts.test.mjs
- name: Production build
  run: npm run build
```

- [ ] **Step 6: Run the full local gate**

```bash
npm run lint
npm run test:p1
node --test tests/*.test.mjs
npm run build
git diff --check
```

Expected:

- TypeScript PASS;
- all P1 behavioral tests PASS;
- all existing source regression tests PASS;
- production build PASS;
- no whitespace errors.

- [ ] **Step 7: Perform the manual regression matrix**

Verify:

1. login and logout for Ustadz/Admin, Wali, and Santri;
2. one submission for each setoran type appears exactly once;
3. refresh and cross-device updates remain correct;
4. today and seven-day totals match the pre-P1 fixture;
5. six-month chart matches the pre-P1 fixture;
6. selecting twelve months loads and displays the complete requested range;
7. current-month, custom-range, and explicit all-history views are accurate;
8. PDF single-month and multi-month exports contain the requested period;
9. old History records can be edited and deleted;
10. deleting a santri with more than 450 related documents completes in chunks;
11. offline startup with cache is labelled stale;
12. query failure is not shown as valid zero data;
13. no Firestore listener remains after logout.

- [ ] **Step 8: Commit the cutover**

```bash
git add .github/workflows/p1-query-architecture.yml package.json src/App.tsx src/services/storageService.ts tests/setoran-consumer-contracts.test.mjs
git commit -m "refactor: stop loading full setoran history at startup"
```

- [ ] **Step 9: Prepare the P1 pull request**

Use:

```text
Title: refactor: separate recent and historical setoran queries

Summary:
- replace startup-wide setoran listeners with a 30-day realtime channel
- load analytics, History, and PDF periods on demand
- make historical mutations and santri deletion independent of partial cache
- add P1 behavioral and consumer regression gates

Verification:
- npm run lint
- npm run test:p1
- node --test tests/*.test.mjs
- npm run build
- manual role, History, PDF, offline, and cross-device matrix
```

Do not merge until every required GitHub Action and deployment preview is green.
