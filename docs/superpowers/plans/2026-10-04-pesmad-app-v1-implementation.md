# Pesmad App V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable Pesmad App PWA at `app.tahfidzpesmad.my.id` for Superadmin, Pimpinan, and Ustadz, reusing existing Smart Tahfidz credentials, aggregating real Tahfidz/Kinerja summaries, and leaving the existing Smart Tahfidz production flow untouched.

**Architecture:** Build a new `Amrnjt/Pesmad-App` Next.js App Router application as the identity, permission, PWA, and dashboard-aggregation layer. Read Tahfidz data server-side from the existing named Firestore database with bounded queries, and consume Kinerja through a protected server-to-server summary API. Harden Sistem Kinerja authentication separately so it no longer defaults to a user-switching Superadmin session.

**Tech Stack:** Next.js App Router, TypeScript, React, Firebase Authentication/Admin SDK, named Firestore database, Vitest, React Testing Library, Playwright, PWA manifest/service worker, Vercel; existing Sistem Kinerja Express + PostgreSQL + Drizzle ORM.

**Spec:** `docs/superpowers/specs/2026-10-04-pesmad-app-v1-design.md`

## Global Constraints

- `tahfidzpesmad.my.id` and `www.tahfidzpesmad.my.id` remain assigned to the existing Smart Tahfidz application; no V1 redirect to Pesmad App.
- Pesmad App V1 admits only `Superadmin`, `Pimpinan`, and `Ustadz`; `Wali` and `Santri` remain on the existing Smart Tahfidz flow.
- Users keep the same Smart Tahfidz username/password from their point of view; no mass password reset.
- Pesmad Identity never stores a second plaintext password.
- Legacy Smart Tahfidz password dependence is transitional and is not removed in this V1.
- Portal authorization is server-authoritative; React visibility is never the security boundary.
- Module access levels are exactly `none | view | user | admin`.
- V1 module registry contains Tahfidz and Kinerja as active modules; Keuangan, Diniyah, Data Santri, and Laporan Terpadu are visible `COMING_SOON` modules.
- Tahfidz dashboard integration is read-only and must not issue unbounded startup reads against `ziyadah`, `murojaah`, `binnadzor`, or `pembelajaran`.
- Kinerja summary values must be real database-derived values; unavailable metrics return `null`, never fabricated defaults.
- One downstream module failure must not turn the entire dashboard request into a failure.
- Pesmad App is an installable PWA in V1. Static assets may be cached; auth, permission, and live dashboard responses must not be served stale-forever.
- Full cross-application SSO is outside V1. Kinerja may ask for login again, but must accept the same Pesmad credentials.
- Superadmin is the only role that may change Pesmad App account/module permissions. Pimpinan is view-only. Ustadz access is scoped to assigned classes/tasks.
- Production Firebase Admin credentials and Kinerja integration tokens live only in encrypted server environment variables.

## Review Focus

1. **Unsupported role login:** a valid legacy Wali/Santri credential must be rejected by Pesmad App without creating Firebase Auth or Pesmad Identity records. Covered in Task 3.
2. **Expired/invalid session or changed permission:** protected APIs must return `401/403` from current server state and must not be satisfied from PWA cache. Covered in Tasks 4 and 5.
3. **Partial downstream outage:** Kinerja timeout/error must still return a `200` dashboard response with Tahfidz data and `kinerja.status = "unavailable"`; the reverse must also hold. Covered in Task 7.
4. **Ustadz scope leakage:** Tahfidz metrics must only count santri in classes assigned through `musyrifId`/`musyrifIds`; Kinerja metrics must only count tasks for the mapped Kinerja user UID. Covered in Tasks 6 and 9.
5. **Offline/stale PWA state:** installed app shell may open offline, but auth/dashboard/profile/permission endpoints must never display an old authorized state as fresh data. Covered in Task 2 and Task 11.

---

## File Structure Locked by This Plan

### New repository: `Amrnjt/Pesmad-App`

```text
src/
  app/
    api/
      auth/login/route.ts
      auth/logout/route.ts
      auth/me/route.ts
      dashboard/route.ts
      admin/users/[uid]/modules/route.ts
    dashboard/page.tsx
    login/page.tsx
    admin/access/page.tsx
    layout.tsx
    page.tsx
    globals.css
    manifest.ts
  components/
    auth/LoginForm.tsx
    dashboard/DashboardShell.tsx
    dashboard/MetricCard.tsx
    dashboard/ModuleCard.tsx
    dashboard/ModuleGrid.tsx
    pwa/ServiceWorkerRegister.tsx
    admin/ModuleAccessEditor.tsx
  lib/
    auth/firebasePasswordSignIn.ts
    auth/internalIdentity.ts
    auth/legacyCredentialVerifier.ts
    auth/session.ts
    dashboard/getDashboard.ts
    firebase/admin.ts
    identity/repository.ts
    identity/types.ts
    integrations/kinerja/client.ts
    integrations/kinerja/types.ts
    integrations/tahfidz/summary.ts
    integrations/tahfidz/types.ts
    modules/permissions.ts
    modules/registry.ts
    time/jakartaDayRange.ts
  middleware.ts
public/
  icons/
  offline.html
  sw.js
tests/
  auth/
  dashboard/
  identity/
  integrations/
  modules/
  pwa/
e2e/
  auth.spec.ts
  dashboard.spec.ts
  pwa.spec.ts
```

### Existing repository: `Amrnjt/Sistem-Kinerja-Pesmad`

```text
server/
  auth/firebaseAdmin.ts
  auth/session.ts
  auth/integrationAuth.ts
  routes/auth.ts
  routes/pesmadIntegration.ts
  services/pesmadSummaryService.ts
src/
  components/LoginPage.tsx
  context/AuthContext.tsx
server.ts
```

Avoid unrelated restructuring. `server.ts` keeps existing routes but mounts the new focused auth/integration routers.

---

### Task 1: Bootstrap the Pesmad App repository and quality gates

**Files:**
- Create in new repo: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `tests/smoke/app-shell.test.tsx`

**Interfaces:**
- Consumes: approved architecture spec only.
- Produces: a buildable Next.js App Router project with `npm run lint`, `npm run test`, `npm run build`, and `npm run test:e2e` scripts.

- [ ] **Step 1: Establish the new repository prerequisite**

Create or confirm the separate repository `Amrnjt/Pesmad-App`, then implement on branch `feat/pesmad-app-v1`. If the connected GitHub tooling cannot create repositories, only this repository-creation action requires the owner's GitHub UI; all subsequent source changes remain agent-executable.

- [ ] **Step 2: Scaffold the project and test runner**

Use Next.js App Router + TypeScript with `src/` layout. Add Vitest + jsdom + React Testing Library and Playwright. Do not add a database ORM to Pesmad App; Firestore access belongs behind focused repository/adapters.

- [ ] **Step 3: Write the failing shell smoke test**

`tests/smoke/app-shell.test.tsx` asserts the root page identifies the product as `PESMAD APP` and does not render any legacy Tahfidz credential fields on the public root page.

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- tests/smoke/app-shell.test.tsx`
Expected: FAIL because the Pesmad App shell has not been implemented.

- [ ] **Step 5: Implement the minimal shell**

`src/app/page.tsx` redirects authenticated routing later but for this task renders the product shell only; `layout.tsx` defines Indonesian metadata and viewport defaults.

- [ ] **Step 6: Verify build and tests**

Run: `npm run lint && npm test && npm run build`
Expected: all PASS/build succeeds.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: bootstrap Pesmad App"
```

---

### Task 2: Add the installable PWA shell with conservative caching

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/components/pwa/ServiceWorkerRegister.tsx`
- Create: `public/sw.js`
- Create: `public/offline.html`
- Create: `public/icons/*` using the approved Pesmad icon assets
- Modify: `src/app/layout.tsx`
- Test: `tests/pwa/manifest.test.ts`
- Test: `e2e/pwa.spec.ts`

**Interfaces:**
- Consumes: Next.js app from Task 1.
- Produces: installable manifest and service worker where API auth/dashboard paths are excluded from durable cache.

- [ ] **Step 1: Write the failing manifest policy test**

Assert `manifest()` returns `name = "Pesmad App"`, `display = "standalone"`, `start_url = "/dashboard"`, and required 192/512 icon entries.

- [ ] **Step 2: Write the failing service-worker policy test**

Assert `public/sw.js` contains explicit network-only/no-cache handling for `/api/auth/`, `/api/dashboard`, and `/api/admin/`, while versioned static assets use cache-first behavior.

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- tests/pwa/manifest.test.ts`
Expected: FAIL because manifest/service worker do not exist.

- [ ] **Step 4: Implement manifest, service-worker registration, and offline shell**

Register the service worker only in the browser. Cache static app-shell assets with a versioned cache key. Navigation requests use network-first and may fall back to `/offline.html`; protected APIs are never cached.

- [ ] **Step 5: Add Playwright installability assertions**

`e2e/pwa.spec.ts` checks the manifest link resolves, service worker registers in production-like serving, and an offline reload shows the shell/offline page without fabricating authenticated dashboard data.

- [ ] **Step 6: Verify**

Run: `npm test && npm run build && npm run test:e2e -- e2e/pwa.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/manifest.ts src/components/pwa public tests/pwa e2e/pwa.spec.ts src/app/layout.tsx
git commit -m "feat: add Pesmad App PWA shell"
```

---

### Task 3: Implement Pesmad Identity and lazy migration from Smart Tahfidz credentials

**Files:**
- Create: `src/lib/firebase/admin.ts`
- Create: `src/lib/identity/types.ts`
- Create: `src/lib/identity/repository.ts`
- Create: `src/lib/auth/internalIdentity.ts`
- Create: `src/lib/auth/legacyCredentialVerifier.ts`
- Create: `src/lib/auth/firebasePasswordSignIn.ts`
- Create: `src/app/api/auth/login/route.ts`
- Test: `tests/auth/legacy-migration.test.ts`
- Test: `tests/identity/repository.test.ts`

**Interfaces:**
- Produces `normalizePesmadUsername(username: string): string`.
- Produces `internalAuthEmail(username: string): string`; this mapping is deterministic and server-only.
- Produces `verifyLegacyCredential(input: { username: string; password: string }): Promise<LegacyInternalUser | null>`.
- Produces `getIdentityByUsername(username: string): Promise<PesmadUser | null>`.
- Produces `createMigratedIdentity(input: LegacyInternalUser & { authUid: string }): Promise<PesmadUser>`.
- Produces `signInFirebasePassword(input: { email: string; password: string }): Promise<{ idToken: string; localId: string }>` using Firebase Authentication's password sign-in endpoint server-side.

`PesmadUser` uses exactly:

```ts
type ModuleAccess = 'none' | 'view' | 'user' | 'admin';
type PesmadRole = 'Superadmin' | 'Pimpinan' | 'Ustadz';
```

Identity documents live in `pesmadUsers/{authUid}` in the existing named Firestore database. They contain `authUid`, `legacyUserId`, `username`, `usernameNormalized`, `nama`, `role`, `active`, `modules`, `createdAt`, and `updatedAt`; no password field.

- [ ] **Step 1: Write failing identity tests**

Cover default permissions:
- Superadmin: Tahfidz/Kinerja `admin` and access-management capability.
- Pimpinan: Tahfidz/Kinerja `view`.
- Ustadz: Tahfidz/Kinerja `user`.
- Keuangan/Diniyah/Santri/Laporan default to `none` until activated/granted.

- [ ] **Step 2: Write failing lazy-migration tests**

Cases:
- valid legacy `Superadmin`, `Pimpinan`, or `Ustadz` creates Firebase Auth + Pesmad Identity once;
- valid `Wali` or `Santri` is rejected with `403` and creates nothing;
- wrong password returns `401` and creates nothing;
- an already migrated identity uses Firebase password sign-in and does not read/write a second plaintext password store.

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- tests/auth/legacy-migration.test.ts tests/identity/repository.test.ts`
Expected: FAIL because identity/auth implementation does not exist.

- [ ] **Step 4: Implement Firebase Admin initialization**

Initialize Admin SDK from environment credentials and select the existing named Firestore database identified by `FIREBASE_DATABASE_ID`; never import the public repo's JSON config as a server secret.

- [ ] **Step 5: Implement bounded legacy credential verification**

Read only legacy user candidates whose role is one of `Superadmin`, `Pimpinan`, `Ustadz`, normalize `username` with trim/lowercase in memory, and compare the submitted password only during first migration. Do not copy the password into `pesmadUsers`.

- [ ] **Step 6: Implement lazy migration transaction flow**

For first login: verify legacy credential → create Firebase Auth user with same password and deterministic internal email → create Pesmad Identity. If Auth creation succeeds but profile creation fails, delete the just-created Auth user so migration is retryable.

- [ ] **Step 7: Implement existing-identity login path**

Resolve `usernameNormalized` to its Pesmad Identity, derive the same internal email, call Firebase password sign-in server-side, and return the ID token only to the session-creation path.

- [ ] **Step 8: Verify**

Run: `npm test -- tests/auth tests/identity && npm run lint`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/firebase src/lib/identity src/lib/auth src/app/api/auth/login tests/auth tests/identity
git commit -m "feat: add Pesmad identity migration"
```

---

### Task 4: Add secure server-managed sessions and protected-route authorization

**Files:**
- Create: `src/lib/auth/session.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/middleware.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Test: `tests/auth/session.test.ts`
- Test: `e2e/auth.spec.ts`

**Interfaces:**
- Produces `createPesmadSession(idToken: string): Promise<string>`.
- Produces `readPesmadSession(cookieValue: string | undefined): Promise<AuthenticatedPesmadUser | null>`.
- Produces `requirePesmadSession(request: Request): Promise<AuthenticatedPesmadUser>`; throws/returns an auth error consumed by route handlers.
- Session cookie name: `__Host-pesmad_session` in production; development uses `pesmad_session` when HTTPS is unavailable.
- Production cookie attributes: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 5-day maximum age.

- [ ] **Step 1: Write failing session tests**

Assert valid ID token creates a session, invalid/revoked cookie yields unauthenticated state, and current profile `active=false` denies access even if the Firebase session itself is valid.

- [ ] **Step 2: Write failing route tests**

`/api/auth/me` returns `401` without a valid session and never emits cacheable auth headers. `/api/auth/logout` clears the cookie.

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- tests/auth/session.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement server session cookie exchange**

Use Firebase Admin session cookies. Every protected request re-reads the current Pesmad Identity profile so role/module-access changes take effect without trusting stale client state.

- [ ] **Step 5: Implement route protection**

Middleware redirects unauthenticated page navigation from `/dashboard` and `/admin/*` to `/login`; API routes still perform their own explicit session check and return JSON `401/403`.

- [ ] **Step 6: Add browser auth tests**

Playwright covers login page → successful internal login → dashboard navigation → logout, plus rejected Wali/Santri behavior using mocked test auth fixtures.

- [ ] **Step 7: Verify**

Run: `npm test -- tests/auth && npm run test:e2e -- e2e/auth.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth/session.ts src/app/api/auth src/middleware.ts tests/auth e2e/auth.spec.ts
git commit -m "feat: secure Pesmad App sessions"
```

---

### Task 5: Implement the module registry and server-side permission model

**Files:**
- Create: `src/lib/modules/registry.ts`
- Create: `src/lib/modules/permissions.ts`
- Test: `tests/modules/registry.test.ts`
- Test: `tests/modules/permissions.test.ts`

**Interfaces:**
- Produces `MODULE_REGISTRY: readonly ModuleDefinition[]`.
- Produces `canAccessModule(user: PesmadUser, moduleId: ModuleId, minimum: ModuleAccess): boolean`.
- Produces `canManageAccess(user: PesmadUser): boolean` which is true only for `Superadmin`.

Registry IDs are exactly:

```ts
'tahfidz' | 'kinerja' | 'keuangan' | 'diniyah' | 'santri' | 'laporan'
```

V1 display/status:
- Smart Tahfidz — `ACTIVE` — launch URL `https://tahfidzpesmad.my.id`.
- Sistem Kinerja — `ACTIVE` — launch URL from server configuration.
- Keuangan — `COMING_SOON`.
- Diniyah — `COMING_SOON`.
- Data Santri — `COMING_SOON`.
- Laporan Terpadu — `COMING_SOON`.

- [ ] **Step 1: Write failing registry tests**

Assert all six IDs exist once, active/coming-soon statuses match the spec, and COMING_SOON definitions never require a network summary adapter.

- [ ] **Step 2: Write failing permission tests**

Assert ordered access semantics `none < view < user < admin`, Pimpinan cannot mutate, and only Superadmin passes `canManageAccess`.

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- tests/modules`
Expected: FAIL.

- [ ] **Step 4: Implement registry and permission helpers**

Keep all security decisions in these server-safe pure helpers so route handlers and UI consume one consistent rule set.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/modules && npm run lint`
Expected: PASS.

```bash
git add src/lib/modules tests/modules
git commit -m "feat: define Pesmad module permissions"
```

---

### Task 6: Implement the read-only Smart Tahfidz summary adapter

**Files:**
- Create: `src/lib/time/jakartaDayRange.ts`
- Create: `src/lib/integrations/tahfidz/types.ts`
- Create: `src/lib/integrations/tahfidz/summary.ts`
- Test: `tests/integrations/tahfidz-summary.test.ts`

**Interfaces:**
- Produces `jakartaDayRange(now: Date): { start: string; end: string; date: string }` where range strings match the existing Tahfidz timestamp format `YYYY-MM-DD HH:mm:ss`.
- Produces `getTahfidzSummary(user: PesmadUser, now?: Date): Promise<TahfidzSummary>`.
- `TahfidzSummary` contains `totalSantriAktif`, `setoranHariIni`, `ziyadahHariIni`, `murojaahHariIni`, `binnadzorHariIni`, `pembelajaranHariIni`, and `lastUpdated`.

Server data sources are existing named-Firestore collections `santri`, `kelas`, `ziyadah`, `murojaah`, `binnadzor`, and `pembelajaran`.

- [ ] **Step 1: Write failing Jakarta date-range tests**

Pin Asia/Jakarta day boundaries, including UTC dates that cross midnight in Jakarta.

- [ ] **Step 2: Write failing institution summary tests**

For Superadmin/Pimpinan, assert each setoran collection is queried only for `timestamp >= start` and `timestamp <= end`; no historical unbounded get is permitted. Count aggregation is preferred where supported.

- [ ] **Step 3: Write failing Ustadz scope test**

Given classes where the Ustadz is present in `musyrifId` or `musyrifIds`, only today's records whose `idSantri` belongs to those classes contribute to the Ustadz summary. Today's records may be filtered server-side after the bounded one-day query; historical collections must never be loaded.

- [ ] **Step 4: Run tests to verify failure**

Run: `npm test -- tests/integrations/tahfidz-summary.test.ts`
Expected: FAIL.

- [ ] **Step 5: Implement bounded Firestore adapter**

Use aggregate count queries for institution totals. For Ustadz, fetch assigned class master data, derive the permitted `santriIds`, query only today's setoran range, then filter to that permitted set so Firestore `in` limits do not create a class-size ceiling.

- [ ] **Step 6: Verify**

Run: `npm test -- tests/integrations/tahfidz-summary.test.ts && npm run lint`
Expected: PASS and tests prove no unbounded setoran read.

- [ ] **Step 7: Commit**

```bash
git add src/lib/time src/lib/integrations/tahfidz tests/integrations/tahfidz-summary.test.ts
git commit -m "feat: aggregate bounded Tahfidz summaries"
```

---

### Task 7: Build the resilient dashboard aggregator and role-aware dashboard UI

**Files:**
- Create: `src/lib/dashboard/getDashboard.ts`
- Create: `src/app/api/dashboard/route.ts`
- Create: `src/components/dashboard/DashboardShell.tsx`
- Create: `src/components/dashboard/MetricCard.tsx`
- Create: `src/components/dashboard/ModuleCard.tsx`
- Create: `src/components/dashboard/ModuleGrid.tsx`
- Create: `src/app/dashboard/page.tsx`
- Test: `tests/dashboard/aggregator.test.ts`
- Test: `tests/dashboard/role-view.test.tsx`
- Test: `e2e/dashboard.spec.ts`

**Interfaces:**
- Produces `getDashboard(user: PesmadUser): Promise<DashboardPayload>`.
- `DashboardPayload` contains `profile`, filtered `modules`, `tahfidz: ModuleSummaryResult<TahfidzSummary>`, and `kinerja: ModuleSummaryResult<KinerjaSummary>`.
- `ModuleSummaryResult<T>` is `{ status: 'available'; data: T } | { status: 'unavailable'; data: null } | { status: 'forbidden'; data: null }`.

- [ ] **Step 1: Write failing partial-failure tests**

Mock Kinerja timeout and assert `getDashboard` still returns Tahfidz `available` and Kinerja `unavailable`. Repeat with Tahfidz failure and Kinerja success.

- [ ] **Step 2: Write failing permission/role view tests**

Assert Pimpinan sees institution summary with no mutation controls; Ustadz sees scoped cards; COMING_SOON cards render but do not invoke adapters; modules at `none` permission do not expose launch actions.

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- tests/dashboard`
Expected: FAIL.

- [ ] **Step 4: Implement aggregator**

Execute active module adapters independently with per-adapter timeout/error handling. `/api/dashboard` returns `Cache-Control: private, no-store` initially; performance optimization may add short server revalidation later without browser-stale authorization.

- [ ] **Step 5: Implement dashboard UI**

Render greeting/name/role, primary Tahfidz/Kinerja metrics, all six module cards, neutral unavailable states, and a `Perbarui Data` action that re-fetches `/api/dashboard` without full-page reload.

- [ ] **Step 6: Add browser behavior tests**

Verify responsive dashboard, module launch links, unavailable module state, and no admin controls for Pimpinan/Ustadz.

- [ ] **Step 7: Verify and commit**

Run: `npm test -- tests/dashboard && npm run test:e2e -- e2e/dashboard.spec.ts && npm run build`
Expected: PASS.

```bash
git add src/lib/dashboard src/app/api/dashboard src/app/dashboard src/components/dashboard tests/dashboard e2e/dashboard.spec.ts
git commit -m "feat: add resilient Pesmad dashboard"
```

---

### Task 8: Replace placeholder Kinerja KPI aggregation with a protected Pesmad integration endpoint

**Repository:** `Amrnjt/Sistem-Kinerja-Pesmad`

**Files:**
- Create: `server/auth/integrationAuth.ts`
- Create: `server/services/pesmadSummaryService.ts`
- Create: `server/routes/pesmadIntegration.ts`
- Modify: `server.ts`
- Modify: `package.json` to add test runner if absent
- Test: `server/services/pesmadSummaryService.test.ts`
- Test: `server/routes/pesmadIntegration.test.ts`

**Interfaces:**
- Produces `getInstitutionPesmadSummary(): Promise<KinerjaSummary>`.
- Produces `getUserPesmadSummary(uid: string): Promise<KinerjaSummary>`.
- Mounts `GET /api/integrations/pesmad/summary`.
- Request scope: omit `uid` for institution summary; include `uid=<firebaseUid>` for Ustadz summary.
- Authentication: `Authorization: Bearer <PESMAD_INTEGRATION_TOKEN>` with constant-time comparison.
- Response fields: `totalTasks`, `completedTasks`, `inProgressTasks`, `overdueTasks`, `completionRate`, `onTimeRate`, `averageScore`, `lastUpdated`.

- [ ] **Step 1: Write failing summary service tests**

Assert task counts/rates derive from fixture rows, user scope includes only `users.uid === requestedUid`, no-task rate is `0`, and unavailable review/on-time data is `null` rather than `88` or `92.5`.

- [ ] **Step 2: Write failing integration-auth tests**

Missing or incorrect bearer token returns `401`; valid token returns the summary; unknown Ustadz UID returns a safe zero/empty scoped summary or `404` according to the route contract, not institution-wide data.

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test -- server/services/pesmadSummaryService.test.ts server/routes/pesmadIntegration.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement SQL-backed aggregation**

Use Drizzle aggregate queries rather than loading every task into memory when practical. Calculate overdue from `dueDate < now` and non-completed statuses. Calculate on-time rate only when completed task timing data is sufficient; otherwise return `null`. Calculate average review score only from actual reviews; no hard-coded fallback.

- [ ] **Step 5: Implement protected route and mount it**

`server.ts` mounts the focused router; it does not expose the token or database credentials to the frontend bundle.

- [ ] **Step 6: Verify all existing Kinerja checks**

Run: `npm run lint && npm test && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server src package.json package-lock.json bun.lock
git commit -m "feat: expose protected Pesmad KPI summary"
```

---

### Task 9: Harden Sistem Kinerja authentication to the same Pesmad credentials

**Repository:** `Amrnjt/Sistem-Kinerja-Pesmad`

**Files:**
- Create: `server/auth/firebaseAdmin.ts`
- Create: `server/auth/session.ts`
- Create: `server/routes/auth.ts`
- Create: `src/components/LoginPage.tsx`
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/App.tsx`
- Modify: `server.ts`
- Test: `server/routes/auth.test.ts`
- Test: `src/context/AuthContext.test.tsx`

**Interfaces:**
- Mounts `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Login accepts `{ username: string; password: string }` and authenticates against already migrated Pesmad Identity/Firebase Auth; it must not fall back to Kinerja's old user-switching model.
- Maps authenticated Firebase UID to the existing Kinerja `users.uid` field.
- Session cookie is server-managed and required for all mutable Kinerja endpoints before the module is considered production ACTIVE.

- [ ] **Step 1: Write failing tests proving the old default-Superadmin behavior is gone**

`AuthContext` starts unauthenticated, fetches `/api/auth/me`, and never chooses `SUPERADMIN` merely because it is the first/default user.

- [ ] **Step 2: Write failing login/session tests**

Valid migrated Pesmad credentials map to exactly one Kinerja user; invalid credentials fail; inactive/missing Kinerja user does not fall back to another account.

- [ ] **Step 3: Write failing authorization tests for representative mutable endpoints**

At minimum cover task creation, user mutation, and template mutation: unauthenticated requests are rejected; Pimpinan session is view-only; Ustadz may mutate only actions permitted by existing Kinerja role rules; Superadmin administrative operations pass.

- [ ] **Step 4: Run tests to verify failure**

Run: `npm test -- server/routes/auth.test.ts src/context/AuthContext.test.tsx`
Expected: FAIL.

- [ ] **Step 5: Implement Firebase/Pesmad login and Kinerja session**

Use the same deterministic internal identity mapping as Pesmad App. Do not store another password. Resolve the Firebase UID to `users.uid` and return the Kinerja profile from `/api/auth/me`.

- [ ] **Step 6: Replace `switchUser` AuthContext**

`AuthContext` exposes `currentUser`, `isLoading`, `login(username,password)`, and `logout()`; remove `users` and `switchUser` from the authentication contract.

- [ ] **Step 7: Protect server routes**

Apply auth/role middleware to existing mutable routes. Read-only routes used by the authenticated app may require session as appropriate; the dedicated `/api/integrations/pesmad/summary` continues to use its server-to-server bearer token.

- [ ] **Step 8: Verify and commit**

Run: `npm run lint && npm test && npm run build`
Expected: PASS and no automatic Superadmin session remains.

```bash
git add server src package.json package-lock.json bun.lock
git commit -m "feat: require Pesmad authentication in Kinerja"
```

---

### Task 10: Connect Pesmad App to the protected Kinerja summary

**Repository:** `Amrnjt/Pesmad-App`

**Files:**
- Create: `src/lib/integrations/kinerja/types.ts`
- Create: `src/lib/integrations/kinerja/client.ts`
- Modify: `src/lib/dashboard/getDashboard.ts`
- Test: `tests/integrations/kinerja-client.test.ts`
- Extend: `tests/dashboard/aggregator.test.ts`

**Interfaces:**
- Produces `getKinerjaSummary(user: PesmadUser): Promise<KinerjaSummary>`.
- Uses server env `KINERJA_BASE_URL` and `KINERJA_INTEGRATION_TOKEN`.
- Ustadz request includes `uid=<authUid>`; Superadmin/Pimpinan request institution scope without `uid`.

- [ ] **Step 1: Write failing client tests**

Assert bearer token is server-side, Ustadz gets a UID-scoped URL, Pimpinan/Superadmin get institution scope, non-2xx response throws an adapter error consumed by Task 7's resilient aggregator.

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- tests/integrations/kinerja-client.test.ts tests/dashboard/aggregator.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement Kinerja client**

Use a short request timeout with `AbortController`; parse/validate only the expected summary fields and reject malformed payloads rather than rendering fabricated values.

- [ ] **Step 4: Verify**

Run: `npm test -- tests/integrations/kinerja-client.test.ts tests/dashboard/aggregator.test.ts && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/integrations/kinerja src/lib/dashboard tests/integrations tests/dashboard
git commit -m "feat: integrate Kinerja dashboard summary"
```

---

### Task 11: Add Superadmin `Pengguna & Akses` management

**Repository:** `Amrnjt/Pesmad-App`

**Files:**
- Create: `src/app/api/admin/users/[uid]/modules/route.ts`
- Create: `src/app/admin/access/page.tsx`
- Create: `src/components/admin/ModuleAccessEditor.tsx`
- Modify: `src/lib/identity/repository.ts`
- Test: `tests/modules/access-management.test.ts`
- Test: `tests/admin/access-route.test.ts`

**Interfaces:**
- Produces `updateModuleAccess(targetUid: string, modules: Partial<Record<ModuleId, ModuleAccess>>, actor: PesmadUser): Promise<PesmadUser>`.
- API accepts only known module IDs and exact access values `none|view|user|admin`.
- Actor must pass `canManageAccess(actor)`; only Superadmin may mutate.

- [ ] **Step 1: Write failing authorization/validation tests**

Assert Pimpinan/Ustadz get `403`; unknown module/access values get `400`; Superadmin update persists and is visible on the next protected request.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/modules/access-management.test.ts tests/admin/access-route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement repository mutation and API**

Write only the modules map and `updatedAt`; do not expose or mutate auth passwords from this page.

- [ ] **Step 4: Implement management UI**

List migrated Pesmad users and present per-module selectors. COMING_SOON modules may be preconfigured but remain unlaunchable while their registry status is `COMING_SOON`.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/modules tests/admin && npm run build`
Expected: PASS.

```bash
git add src/app/api/admin src/app/admin src/components/admin src/lib/identity tests/modules tests/admin
git commit -m "feat: manage Pesmad module access"
```

---

### Task 12: Release verification, Vercel deployment, and `app.tahfidzpesmad.my.id`

**Repositories:** `Amrnjt/Pesmad-App`, `Amrnjt/Sistem-Kinerja-Pesmad`; existing Smart Tahfidz is verification-only.

**Files:**
- Modify: `.env.example` files with variable names only, never secret values.
- Create if absent: repo-level release checklist documentation in `docs/release-v1.md` inside Pesmad App.
- Test: full unit/browser/build suites.

**Interfaces / Required environment variables:**

Pesmad App server:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
FIREBASE_DATABASE_ID
FIREBASE_WEB_API_KEY
KINERJA_BASE_URL
KINERJA_INTEGRATION_TOKEN
```

Sistem Kinerja server additionally receives the Firebase Admin/Auth values required by Task 9 plus the matching `PESMAD_INTEGRATION_TOKEN`.

- [ ] **Step 1: Run full Pesmad App verification**

Run: `npm run lint && npm test && npm run build && npm run test:e2e`
Expected: all PASS.

- [ ] **Step 2: Run full Kinerja verification**

Run: `npm run lint && npm test && npm run build`
Expected: all PASS.

- [ ] **Step 3: Verify Smart Tahfidz regression boundary**

Confirm no production-domain reassignment and no application-code change was required in `Amrnjt/Smart-Tahfidz-Pesmad` for V1 integration. Its existing `tahfidzpesmad.my.id` deployment must remain READY.

- [ ] **Step 4: Deploy Kinerja preview/production candidate**

Create/reuse a Vercel project linked to `Amrnjt/Sistem-Kinerja-Pesmad`, configure environment variables, deploy, and smoke-test authenticated login plus `/api/integrations/pesmad/summary` from server-to-server context.

- [ ] **Step 5: Deploy Pesmad App preview**

Create a Vercel Git project linked to `Amrnjt/Pesmad-App`, configure encrypted server env values, and validate preview on desktop/mobile. Do not attach `app.tahfidzpesmad.my.id` until preview gates pass.

- [ ] **Step 6: Run production-like browser release gates**

Verify:
- Superadmin/Pimpinan/Ustadz existing credentials work;
- Wali/Santri cannot enter Pesmad App;
- dashboard partial-outage behavior works;
- Ustadz scoping cannot see other classes/tasks;
- Pimpinan has no mutation controls;
- PWA installability/service worker behavior passes;
- offline shell does not display stale authenticated dashboard as current;
- no password, session cookie, Firebase private key, or Kinerja bearer token appears in client JS/network responses/logs.

- [ ] **Step 7: Attach production subdomain**

After gates pass, attach `app.tahfidzpesmad.my.id` to the Pesmad App Vercel production project. Leave `tahfidzpesmad.my.id` and `www.tahfidzpesmad.my.id` on `smart-tahfidz-pesmad` unchanged.

- [ ] **Step 8: Final production smoke test**

From installed/mobile PWA and normal browser, verify login, dashboard, refresh, Tahfidz launch, Kinerja launch/login, logout, and unavailable-state behavior.

- [ ] **Step 9: Commit release documentation**

```bash
git add .env.example docs/release-v1.md
git commit -m "docs: record Pesmad App V1 release gates"
```

---

## Implementation Order / Milestone Mapping

- **P0 Foundation:** Tasks 1–2.
- **P1 Identity:** Tasks 3–5.
- **P2 Portal Dashboard:** Task 7 UI foundation, with Kinerja adapter unavailable until Task 10.
- **P3 Tahfidz Integration:** Task 6 + Task 7 aggregator.
- **P4 Kinerja Integration:** Tasks 8–10.
- **P5 Superadmin:** Task 11.
- **P6 Release:** Task 12 Steps 1–6.
- **P7 Domain:** Task 12 Steps 7–9.
- **Post-V1 P8:** Cross-application SSO; explicitly not implemented by this plan.

## Cross-Repository Commit/Review Gates

1. Pesmad App Tasks 1–7 may proceed without production Kinerja; Kinerja must render `unavailable` cleanly until its endpoint is ready.
2. Kinerja Tasks 8–9 must pass their own build/tests before Pesmad App Task 10 points at a deployed candidate.
3. Neither repo is merged/deployed to production solely because unit tests pass; browser verification and security review are required before Task 12 domain attachment.
4. Smart Tahfidz production is treated as a protected dependency. V1 must not modify its domain assignment or force its existing Wali/Santri login flow through Pesmad App.
5. Before claiming V1 complete, run the repository-wide verification suites and inspect the final diffs for secrets, placeholder KPI values, unbounded Tahfidz reads, and client-only authorization.
