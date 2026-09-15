# History Query Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent application startup and History Table visits from downloading every setoran document while retaining accurate scoped dashboards, role isolation, exports, edits, deletes, and accordion behavior.

**Architecture:** Split master-data synchronization from setoran synchronization. Add a bounded repository API shared by History and dashboard consumers, with server-side role scope, composite-key deduplication, request-race protection, and in-memory range caching. Migrate consumers before removing the legacy full-collection listeners.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Firebase Firestore 12, Node test runner, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-09-15-history-query-optimization-design.md`

## Global Constraints

- Never issue an unbounded query for the four setoran collections during application startup.
- Default History period remains the current month.
- Wali and Santri queries must include their `idSantri` scope at the Firestore query layer.
- Cache keys must include date bounds and student scope.
- Use `<type>:<id>` for all merged-record identities.
- “Semua Waktu” is explicit and paginated; it is never the initial request.
- Preserve category, score, search, month, range, accordion, edit, delete, batch, PDF, CSV, WhatsApp, and view-only behavior.
- Do not remove legacy full listeners until both History and dashboard have bounded replacements.

---

### Task 1: Bounded Query Contracts and Cache Keys

**Files:**
- Create: `src/services/historyQueryTypes.ts`
- Create: `src/utils/historyQueryKey.ts`
- Create: `tests/history-query-contract.test.ts`

**Interfaces:**
- Produces: `HistoryQueryScope`, `HistoryRangeRequest`, `HistoryQueryResult`, `createHistoryQueryKey(request)`.
- Consumes: `CombinedHistoryItem` from `src/types/index.ts`.

- [ ] **Step 1: Write the failing contract tests**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHistoryQueryKey } from '../src/utils/historyQueryKey.ts';

test('cache key isolates staff and student scopes', () => {
  const base = { startDate: '2026-09-01', endDate: '2026-09-30' };
  assert.notEqual(
    createHistoryQueryKey({ ...base, scope: { kind: 'staff' } }),
    createHistoryQueryKey({ ...base, scope: { kind: 'student', idSantri: 'S-1' } }),
  );
});

test('cache key is stable for an identical request', () => {
  const request = {
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    scope: { kind: 'student' as const, idSantri: 'S-1' },
  };
  assert.equal(createHistoryQueryKey(request), createHistoryQueryKey({ ...request }));
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/history-query-contract.test.ts`

Expected: FAIL because `historyQueryKey.ts` does not exist.

- [ ] **Step 3: Implement the contracts and deterministic key**

```ts
export type HistoryQueryScope =
  | { kind: 'staff' }
  | { kind: 'student'; idSantri: string };

export interface HistoryRangeRequest {
  startDate: string;
  endDate: string;
  scope: HistoryQueryScope;
}

export interface HistoryQueryResult {
  records: CombinedHistoryItem[];
  source: 'server' | 'scoped-cache';
}

export function createHistoryQueryKey(request: HistoryRangeRequest): string {
  const owner = request.scope.kind === 'student'
    ? `student:${request.scope.idSantri}`
    : 'staff';
  return `${owner}|${request.startDate}|${request.endDate}`;
}
```

- [ ] **Step 4: Run tests and TypeScript**

Run: `node --test tests/history-query-contract.test.ts && npm run lint`

Expected: PASS with zero TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/historyQueryTypes.ts src/utils/historyQueryKey.ts tests/history-query-contract.test.ts
git commit -m "feat: define scoped history query contracts"
```

### Task 2: Scoped Firestore History Repository

**Files:**
- Create: `src/services/historyRepository.ts`
- Modify: `src/services/storageService.ts`
- Modify: `firestore.indexes.json`
- Create: `tests/history-repository-source.test.mjs`

**Interfaces:**
- Consumes: `HistoryRangeRequest` and `HistoryQueryResult` from Task 1.
- Produces: `fetchHistoryRange(request): Promise<HistoryQueryResult>` and `fetchHistoryDate(date, scope)`.

- [ ] **Step 1: Write failing source and behavior assertions**

Assert that the repository builds timestamp lower/upper bounds, adds `where('idSantri', '==', ...)` for student scope, queries all four collection constants, and merges with `getHistoryItemKey`.

```js
test('student history query is server scoped', () => {
  const source = readFileSync('src/services/historyRepository.ts', 'utf8');
  assert.match(source, /where\('idSantri',\s*'==',\s*request\.scope\.idSantri\)/);
  assert.doesNotMatch(source, /getZiyadahRecords\(\).*filter/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/history-repository-source.test.mjs`

Expected: FAIL because the repository is absent.

- [ ] **Step 3: Implement one bounded query builder per collection**

Use `query(collection(db, collectionName), ...constraints)` with:

```ts
where('timestamp', '>=', `${request.startDate} 00:00`),
where('timestamp', '<=', `${request.endDate} 23:59:59`),
orderBy('timestamp', 'desc')
```

Prepend the `idSantri` equality constraint for student scope. Normalize each snapshot into `CombinedHistoryItem`, merge, deduplicate by `getHistoryItemKey`, and sort descending.

- [ ] **Step 4: Remove unscoped fallback from the bounded API**

On query failure, return a previously cached result only for the exact `createHistoryQueryKey(request)`. Otherwise throw `HistoryQueryError` with code `INDEX_REQUIRED`, `OFFLINE`, or `UNKNOWN`. Never read all four legacy arrays as fallback.

- [ ] **Step 5: Declare Firestore indexes**

Add composite indexes for each of `ziyadah`, `murojaah`, `binnadzor`, and `pembelajaran` using ascending `idSantri` and descending `timestamp`.

- [ ] **Step 6: Verify**

Run: `node --test tests/history-query-contract.test.ts tests/history-repository-source.test.mjs && npm run lint && npm run build`

Expected: all tests and build pass.

- [ ] **Step 7: Commit**

```bash
git add src/services/historyRepository.ts src/services/storageService.ts firestore.indexes.json tests/history-repository-source.test.mjs
git commit -m "feat: add scoped bounded history queries"
```

### Task 3: Split Master and Setoran Realtime Subscriptions

**Files:**
- Modify: `src/services/storageService.ts`
- Modify: `src/App.tsx`
- Create: `tests/realtime-scope-regression.test.mjs`

**Interfaces:**
- Produces: `subscribeMasterData(onUpdate): () => void` and `subscribeRecentSetoran(request, onUpdate): () => void`.
- Consumes: query scope and normalization from Tasks 1–2.

- [ ] **Step 1: Write the failing regression test**

Read the `subscribeMasterData` function body and assert it references users, santri, kelas, app config, and not the four setoran collection constants. Assert `App.tsx` calls `subscribeMasterData`, not `initRealtimeSync`.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/realtime-scope-regression.test.mjs`

Expected: FAIL because the master-only API is absent.

- [ ] **Step 3: Extract master listeners**

Move users, santri, kelas, and app-config listeners into `subscribeMasterData`. Keep holiday monitoring behind its current feature lifecycle. Leave `initRealtimeSync` temporarily available but unused by `App.tsx`.

- [ ] **Step 4: Add bounded recent-setoran subscription**

Accept `HistoryRangeRequest`, apply the same server constraints as Task 2, merge snapshots by composite key, and return one disposer that unsubscribes all four listeners.

- [ ] **Step 5: Update application startup**

Change the startup effect to call `refreshMasterData()` and `subscribeMasterData()`. Do not populate the four setoran arrays through this callback.

- [ ] **Step 6: Verify and commit**

Run: `node --test tests/realtime-scope-regression.test.mjs && npm run lint && npm run build`

```bash
git add src/services/storageService.ts src/App.tsx tests/realtime-scope-regression.test.mjs
git commit -m "refactor: separate master and setoran subscriptions"
```

### Task 4: History-Owned Bounded Loading

**Files:**
- Create: `src/hooks/useHistoryRange.ts`
- Modify: `src/components/HistoryTable.tsx`
- Modify: `src/App.tsx`
- Create: `tests/history-range-state.test.ts`

**Interfaces:**
- Produces: `useHistoryRange({ startDate, endDate, scope })` returning `{ records, status, error, refresh }`.
- Consumes: `fetchHistoryRange` and query/cache contracts.

- [ ] **Step 1: Write failing reducer tests**

Test initial loading, cached refresh, success, failure retaining cached records, and stale request IDs being ignored. Keep the reducer exported from `useHistoryRange.ts` for deterministic tests.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/history-range-state.test.ts`

Expected: FAIL because the hook/reducer is absent.

- [ ] **Step 3: Implement the request state machine**

Use incrementing request IDs. Only the latest request may commit success or error. Preserve existing records during refreshing and expose retry through `refresh()`.

- [ ] **Step 4: Replace History array ownership**

Derive `startDate`, `endDate`, and scope from active filters/current user. Replace the four input arrays as the primary source with `records` from the hook. Keep optional legacy arrays only during this task as a compatibility prop, without reading them in the new path.

- [ ] **Step 5: Add truthful UI states**

Render skeleton/spinner for initial loading, a quiet refreshing indicator with current records retained, retryable error state, and empty state only after a successful empty result.

- [ ] **Step 6: Update export**

CSV exports current queried records. PDF receives the active bounded records or issues an explicit bounded fetch for the selected range. Disable export while the active request has never succeeded.

- [ ] **Step 7: Verify and commit**

Run: `node --test tests/history-range-state.test.ts tests/history-data-foundation.test.ts && npm run lint && npm run build`

```bash
git add src/hooks/useHistoryRange.ts src/components/HistoryTable.tsx src/App.tsx tests/history-range-state.test.ts
git commit -m "feat: load history from bounded scoped queries"
```

### Task 5: Bounded Dashboard Data and Aggregate Counts

**Files:**
- Create: `src/hooks/useDashboardSetoran.ts`
- Modify: `src/services/historyRepository.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/UstadzDashboard.tsx`
- Modify: `src/components/WaliDashboard.tsx`
- Modify: `src/components/SantriDashboard.tsx`
- Create: `tests/dashboard-query-window.test.ts`

**Interfaces:**
- Produces: recent 30-day records plus scoped aggregate counts.
- Consumes: `subscribeRecentSetoran` and `fetchSetoranCounts`.

- [ ] **Step 1: Write failing tests for the dashboard window**

Use a fixed clock and assert the request covers today minus 29 days through today. Assert Wali/Santri scope contains `idSantri` and staff scope does not.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/dashboard-query-window.test.ts`

Expected: FAIL because the dashboard hook is absent.

- [ ] **Step 3: Implement the bounded dashboard hook**

Subscribe to a 30-day range, dispose on scope/window changes, and expose `{ recentRecords, counts, status }`. Use `getCountFromServer` for lifetime count cards that genuinely require all-time totals.

- [ ] **Step 4: Migrate dashboard components**

Feed charts and activity from `recentRecords`. Label them “30 Hari Terakhir”. Feed lifetime KPI cards only from aggregate counts. Preserve role-specific visibility.

- [ ] **Step 5: Verify and commit**

Run: `node --test tests/dashboard-query-window.test.ts && npm run lint && npm run build`

```bash
git add src/hooks/useDashboardSetoran.ts src/services/historyRepository.ts src/App.tsx src/components/UstadzDashboard.tsx src/components/WaliDashboard.tsx src/components/SantriDashboard.tsx tests/dashboard-query-window.test.ts
git commit -m "feat: scope dashboard setoran data"
```

### Task 6: Remove Legacy Full-Collection Loading

**Files:**
- Modify: `src/services/storageService.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/HistoryTable.tsx`
- Create: `tests/no-unbounded-setoran-read.test.mjs`

**Interfaces:**
- Removes: runtime use of `initRealtimeSync` and full setoran getters from app startup/History.
- Consumes: bounded History and dashboard hooks.

- [ ] **Step 1: Write the failing repository-wide regression test**

Assert `App.tsx` contains no startup calls to `getZiyadahRecords`, `getMurojaahRecords`, `getBinnadzorRecords`, `getPembelajaranRecords`, or `initRealtimeSync`. Assert the active master subscriber contains no unbounded setoran `onSnapshot(collection(...))` calls.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/no-unbounded-setoran-read.test.mjs`

Expected: FAIL while legacy startup reads remain.

- [ ] **Step 3: Remove legacy runtime wiring**

Delete the four global arrays and their refresh assignments from `App.tsx`. Remove compatibility props from History and dashboards. Replace form success callbacks with bounded-query invalidation signals.

- [ ] **Step 4: Retain migration-safe storage methods**

Keep local getters only where offline edit/delete recovery still requires them, mark them legacy, and ensure no startup path calls them. Do not delete storage keys in this release.

- [ ] **Step 5: Verify and commit**

Run: `node --test tests/*.test.mjs tests/*.test.ts && npm run lint && npm run build`

```bash
git add src/services/storageService.ts src/App.tsx src/components/HistoryTable.tsx tests/no-unbounded-setoran-read.test.mjs
git commit -m "refactor: remove unbounded setoran startup reads"
```

### Task 7: All-Time Pagination, Error Copy, and Final Flow Verification

**Files:**
- Modify: `src/services/historyRepository.ts`
- Modify: `src/hooks/useHistoryRange.ts`
- Modify: `src/components/HistoryTable.tsx`
- Modify: `firestore.indexes.json`
- Create: `tests/history-pagination.test.ts`

**Interfaces:**
- Produces: `fetchHistoryPage({ scope, pageSize, cursor })` with opaque per-collection cursors.
- Consumes: existing normalization, cache, and composite keys.

- [ ] **Step 1: Write failing pagination tests**

Assert default page size is 50, next-page merge deduplicates composite keys, and an empty cursor set ends pagination. Assert changing role scope clears cursors.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/history-pagination.test.ts`

Expected: FAIL because pagination is absent.

- [ ] **Step 3: Implement explicit all-time pagination**

Use `limit(50)` and `startAfter(cursor)` per collection. Merge four bounded pages, sort descending, and return new opaque cursors. “Muat Riwayat Sebelumnya” requests the next page; no query may request an entire collection.

- [ ] **Step 4: Add explicit error copy**

Map repository errors to concise Indonesian UI messages: missing index, offline without scoped cache, and retryable unknown failure. Never render a failure as “Belum ada data”.

- [ ] **Step 5: Run full verification**

Run:

```bash
node --test tests/*.test.mjs tests/*.test.ts
npm run lint
npm run build
git diff --check
```

Expected: all tests pass, TypeScript exits 0, Vite build exits 0, and diff check is clean. Existing large-bundle warnings may remain but no new warning may be introduced by this feature.

- [ ] **Step 6: Manual role matrix**

Verify in the browser:

- staff startup does not issue unbounded setoran reads;
- staff History defaults to current month;
- Wali and Santri network queries include only their `idSantri`;
- changing periods cannot display stale results;
- accordion, edit, delete, batch selection, CSV, PDF, and WhatsApp still work;
- all-time mode loads 50-item pages;
- leaving a tab disposes its scoped listener.

- [ ] **Step 7: Commit**

```bash
git add src/services/historyRepository.ts src/hooks/useHistoryRange.ts src/components/HistoryTable.tsx firestore.indexes.json tests/history-pagination.test.ts
git commit -m "feat: finish bounded history data loading"
```
