# P1 Firestore Query Architecture Design

**Status:** Approved in chat on 15 September 2026  
**Project:** Smart Tahfidz Pesmad  
**Scope:** Separate recent realtime data from historical reads without changing Firestore documents or the meaning of displayed data.

## 1. Context

The application currently subscribes to the complete Ziyadah, Murojaah, Binnadzor, and Pembelajaran collections. Each snapshot is copied into application state and LocalStorage, then filtered in React for dashboards, History, charts, PDF reports, and role-specific views.

This works for a small dataset but makes startup reads, memory use, and LocalStorage grow with the entire history. Replacing those listeners with a simple `limit(50)` is not acceptable because several consumers currently treat the received arrays as complete history.

## 2. Goals

P1 must:

1. Stop subscribing to complete setoran collections during normal application startup.
2. Keep today's metrics, seven-day rhythm, and recent activity realtime.
3. Keep 6- and 12-month charts complete for the requested period.
4. Keep History and PDF results correct for the explicitly requested period.
5. Make administrative deletion independent of partial client state.
6. Preserve existing Firestore document formats and stored history.
7. Surface loading and query failures explicitly instead of treating them as empty data.

## 3. Non-goals

P1 will not:

- migrate or delete Firestore documents;
- add monthly aggregate documents; that remains P4;
- implement role-scoped Firestore queries or security rules; that remains P3;
- redesign LocalStorage comprehensively; that remains P5;
- redesign History into an accordion; that remains P2;
- change dashboard, chart, or PDF calculation semantics.

## 4. Data channels

The application will use separate channels instead of one global full-history array.

### 4.1 Recent realtime channel

- Query each setoran collection using a lower timestamp boundary covering the latest 30 days.
- Order records by `timestamp`.
- Keep the listener active only while an authenticated application session needs recent data.
- Unsubscribe on logout, Firebase user change, and application unmount.
- Use this channel for today's totals, seven-day rhythm, recent activity, and immediate post-submit feedback.

Thirty days provides a safety margin beyond the seven-day dashboard while bounding reads independently from the age of the database.

### 4.2 Analytics channel

- Fetch the chart's selected period with one-time Firestore queries.
- Load six months for the default chart view.
- Fetch the additional period only when the user selects twelve months.
- Refresh analytics after a successful mutation that affects the active period or after manual refresh.
- Do not keep a realtime listener over the analytics period.

P4 may later replace these raw range reads with monthly summary documents without changing the chart-facing interface.

### 4.3 Historical range channel

- Fetch History and PDF records only when the relevant view or export action requests them.
- Accept explicit inclusive start and exclusive end boundaries.
- Combine results from all four setoran collections using stable timestamp ordering.
- Keep historical results separate from recent global application state.
- Never persist an on-demand historical result as the new global database copy.

During P1, the current explicit “all history” action may perform a one-time full read for compatibility, but it must not create a listener or run at application startup. P2 removes this transitional path by introducing incremental History loading.

### 4.4 Administrative channel

- Deleting a santri must query each related collection directly by `idSantri`.
- Deletion must never infer completeness from recent, analytics, History, or LocalStorage arrays.
- The existing confirmation and authorization flow remains unchanged.

## 5. Service boundaries

Create a focused query service, tentatively `src/services/setoranQueryService.ts`, responsible only for Firestore reads and subscriptions for the four setoran collections.

Its public interface will expose:

- recent-record subscription;
- range-based record fetching;
- analytics-period fetching;
- records-by-santri fetching for administrative operations;
- a single normalized result shape containing the four typed record arrays.

`storageService.ts` remains responsible for mutations, master data, application configuration, and the legacy cache during P1. Components must not construct Firestore queries directly.

The query service must hide collection-specific duplication behind a typed collection definition so that all four setoran types receive identical timestamp, error, and unsubscribe behavior.

## 6. Application state

Application state must distinguish at least:

- `recentRecords`;
- `analyticsRecords`;
- `historicalRecords`;
- loading state per channel;
- error state per channel;
- active range metadata for analytics and History.

A successful empty query is represented separately from a failed query. A failed refresh keeps the last successful dataset visible and exposes a retryable error state.

No consumer may assume that `recentRecords` represents complete history.

## 7. Timestamp contract

Existing records store `timestamp` as a sortable string. P1 must:

- generate range boundaries in the same canonical format as stored documents;
- validate representative existing timestamps before cutover;
- sort merged records deterministically by timestamp and record ID;
- avoid silently substituting the current time when a stored timestamp is invalid.

Invalid records remain stored, are reported diagnostically, and must not corrupt ordering for valid records.

## 8. LocalStorage compatibility

LocalStorage remains available during P1 to avoid combining query migration with the P5 cache redesign. However:

- Firestore is the source of truth for requested historical ranges;
- cached data must not fill missing History or PDF results;
- recent snapshots may update the existing recent-facing cache only after all consumers stop treating that cache as complete history;
- stale legacy arrays may be read only as an offline fallback and must be labelled as stale in application state;
- P1 must not erase a user's legacy cache merely because a bounded query returned fewer records.

P5 will later define cache size, expiry, and migration policy.

## 9. Error and lifecycle behavior

- Initial load: show the existing loading treatment until the channel resolves.
- Refresh failure: keep the last successful data, show a non-blocking error, and provide retry.
- Initial failure without cache: show an explicit unavailable/error state, not a zero-statistics state.
- Offline with cache: show cached data with stale/offline status.
- Authentication change: dispose all listeners and discard data belonging to the previous session.
- Duplicate delivery: normalize by record ID before committing channel state.
- Out-of-order responses: only the latest request for a channel and range may update state.

## 10. P2 History handoff

P2 will build the History Accordion on top of the P1 range-query boundary:

- “Setor Hari Ini” is open by default;
- records are grouped by calendar day;
- older date windows are requested incrementally;
- each collection maintains its own Firestore cursor or date-window boundary;
- “Muat riwayat sebelumnya” must not re-download already loaded windows;
- accordion grouping occurs only over loaded pages, never over the complete database;
- search and filters issue scoped queries rather than filtering an assumed global full-history array.

The detailed pagination and accordion interaction design belongs to the separate P2 specification.

## 11. Migration sequence

1. Add typed query boundaries and automated tests.
2. Introduce the recent realtime channel without removing the legacy listeners.
3. Migrate dashboard today, seven-day, and activity consumers.
4. Introduce analytics-period fetching and migrate charts.
5. Introduce historical range fetching and migrate History/PDF access.
6. Move santri deletion completeness checks to direct Firestore queries.
7. Verify every consumer no longer assumes recent data is complete history.
8. Remove full-history setoran listeners from application startup.
9. Retain a temporary rollback switch for one release cycle, disabled by default.

The rollback switch may restore legacy read behavior but must not alter writes or Firestore documents.

## 12. Testing and acceptance gates

### Automated

- Query-boundary formatting and timestamp ordering tests.
- Four-collection merge and ID deduplication tests.
- Recent listener unsubscribe tests.
- Latest-request-wins tests for changing ranges.
- Successful-empty versus failed-query state tests.
- Dashboard calculation regression fixtures for today and seven days.
- Chart regression fixtures for six and twelve months.
- History/PDF range completeness tests.
- Santri deletion lookup completeness tests.
- TypeScript, production build, and existing regression suites.

### Manual

- Login and logout for Ustadz/Admin, Wali, and Santri.
- Submit each of the four setoran types and confirm one realtime appearance.
- Refresh and cross-device synchronization.
- Compare current and P1 dashboard totals using the same fixture data.
- Compare six- and twelve-month chart values.
- Export PDF for current and older periods.
- Open History with recent, older, and all-history selections.
- Simulate offline and failed query states.
- Confirm no listener survives logout.

## 13. Completion criteria

P1 is complete only when:

- normal application startup creates no full-history setoran listener;
- current dashboard meanings and values are unchanged;
- History and PDF remain correct for requested periods;
- administrative deletion does not depend on partial state;
- failures cannot masquerade as valid empty datasets;
- all automated and manual regression gates pass;
- no Firestore document migration or deletion occurred.
