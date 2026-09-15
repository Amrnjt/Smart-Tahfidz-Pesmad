# History Query Optimization Design

## Goal

Stop loading every Ziyadah, Murojaah, Binnadzor, and Pembelajaran document when the application starts. History, dashboards, and form flows must request only the records they need while preserving role restrictions, edits, deletes, exports, realtime feedback, and the date accordion.

## Current Problem

`App.tsx` calls `storageService.initRealtimeSync()` at application startup. That method attaches unbounded `onSnapshot(collection(...))` listeners to all four record collections and writes every document into local storage. Consequently, a lazy History Table would still be backed by a full-database download.

`HistoryTable` also receives the four complete record arrays from `App.tsx`, combines them in memory, then applies date, category, score, and search filters locally.

## Target Data Ownership

### Global application state

Global realtime synchronization owns only small master/configuration data:

- users;
- santri;
- kelas;
- application configuration;
- holiday-monitoring data only while that feature is active.

It must not subscribe to the complete four setoran collections.

### Dashboard state

The dashboard owns a bounded operational window, initially the latest 30 days. Trend and activity components use this bounded dataset. Lifetime totals, if displayed, use Firestore aggregate count queries instead of downloading all matching documents.

The UI must label period-bound metrics accurately. A metric calculated from 30 days may not be presented as an all-time total.

### History state

`HistoryTable` owns its queried records and cache. It no longer treats the arrays passed from `App.tsx` as its primary data source.

The initial request uses the currently active period. The default period remains the current month to preserve existing behavior. Changing the period issues a bounded query. Previously loaded ranges may be reused from an in-memory cache during the mounted session.

For Wali and Santri, queries include `idSantri` so unrelated students' documents are not downloaded. Staff queries omit this restriction.

### Form state

Setoran forms retain the master data needed for input. After a successful write, they do not require a full collection refresh. The affected dashboard/history query is invalidated or receives the newly created record through its scoped subscription.

## Query API

Introduce explicit storage APIs rather than exposing collection-wide cache reads:

- `subscribeMasterData(onUpdate)`;
- `subscribeRecentSetoran({ startDate, endDate, idSantri? }, onUpdate)`;
- `fetchHistoryRange({ startDate, endDate, idSantri? })`;
- `fetchHistoryDate({ date, idSantri? })`;
- `fetchSetoranCounts({ startDate?, endDate?, idSantri? })` where lifetime metrics are needed.

Every setoran query runs against the four collections and merges results using the composite history key `<type>:<id>`. Range bounds use the existing sortable timestamp format. Results are sorted descending after merging.

Server-side Wali/Santri filtering combines equality on `idSantri` with timestamp range ordering. Required composite indexes must be declared in `firestore.indexes.json`. A missing index is an explicit error with user-facing retry feedback; the application must not silently fall back to downloading the entire local cache for a restricted user.

## History Loading States

History exposes four states:

- initial loading: no queried data is available yet;
- refreshing: cached/query data remains visible while a new request runs;
- empty: the bounded query completed with no matches;
- error: query failed, with retry and no false empty state.

Requests carry a monotonically increasing request token or cancellation flag. A slower earlier request must not overwrite the result of a newer filter selection.

## Cache Rules

- Cache keys include start date, end date, role scope, and `idSantri`.
- Cache lives in memory for the mounted session.
- Cache never mixes staff and student-scoped results.
- Edit and delete update or invalidate every cache entry containing the affected composite key.
- A new setoran invalidates overlapping dashboard/history ranges.
- Local storage is an offline fallback only for data already fetched under the same scope; it is not a license to expose an unbounded cross-role cache.

## Realtime Strategy

Realtime remains scoped:

- master collections retain their listeners;
- the dashboard subscribes only to its active bounded window;
- History uses a bounded subscription for its active range, or a one-shot bounded fetch followed by explicit refresh;
- switching tabs disposes the previous scoped listener;
- no duplicate listeners may exist for the same consumer.

For the first implementation, History uses bounded one-shot fetches with retry. Dashboard uses one bounded listener because live operational feedback is more valuable there. This keeps Firestore reads predictable and avoids multiple simultaneous History listeners while users adjust filters.

## Compatibility

The following behavior must remain available:

- category, score, search, month, preset, and custom-range filters;
- date accordion and record-detail accordion;
- role-based view-only behavior;
- PDF and CSV export for the active requested range;
- single and batch edit/delete behavior;
- duplicate prevention using `<type>:<id>`;
- WhatsApp reports;
- existing setoran forms.

“All time” becomes an explicit user action and must not run on initial page entry. It may be implemented as paginated loading/export rather than a single unbounded request.

## Delivery Sequence

1. Split master listeners from setoran listeners without changing consumers.
2. Add bounded query contracts, role scopes, normalization, and tests.
3. Move History ownership to bounded range queries and scoped cache.
4. Move dashboard activity/trends to the bounded recent subscription and aggregate counts.
5. Remove full setoran refreshes from `App.tsx` and form success handlers.
6. Add Firestore indexes and verify staff, Wali, and Santri flows.
7. Verify edit, delete, batch selection, export, stale requests, offline/error states, and duplicate prevention.

## Testing

- Unit tests for query scope, date bounds, cache keys, merge/deduplication, and stale-request rejection.
- Source/integration tests proving `initRealtimeSync` no longer attaches collection-wide setoran listeners.
- Role tests proving Wali/Santri requests include only their `idSantri`.
- Component tests for loading, refreshing, empty, error, retry, and period changes.
- Regression tests for date accordion, row selection, edit/delete, PDF/CSV export, and new-record refresh.
- TypeScript check and production build.

## Rollback Boundary

Each delivery step is independently revertible. The date accordion and P1.1 history utilities remain compatible with the old array-backed data during migration. Full collection listeners are removed only after dashboard and History consumers have bounded replacements.
