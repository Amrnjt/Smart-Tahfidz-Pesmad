# Pesmad App V1 — Architecture Design

Date: 2026-10-04
Status: Approved design, pending implementation-plan review
Owner context: Pesmad digital ecosystem

## 1. Goal

Build a new installable PWA named **Pesmad App** at `app.tahfidzpesmad.my.id` as the internal portal and command center for Pesmad. The existing Smart Tahfidz application remains unchanged at `tahfidzpesmad.my.id` so previously distributed links and credentials continue to work.

V1 is for **Superadmin, Pimpinan, and Ustadz** only. Wali and Santri continue to use Smart Tahfidz directly and are not redirected to Pesmad App.

Pesmad App V1 must:

- reuse existing Smart Tahfidz username/password credentials;
- introduce a safer central Pesmad Identity layer without forcing a mass password reset;
- show live summary data from Smart Tahfidz and Sistem Kinerja;
- present all planned modules visually, while only Tahfidz and Kinerja are active initially;
- enforce role and module permissions on the server;
- remain operational when one downstream module is unavailable;
- be installable as a PWA on mobile devices;
- preserve the existing Smart Tahfidz production domain and user flow.

## 2. Existing Systems and Constraints

### Smart Tahfidz

- Existing repository: `Amrnjt/Smart-Tahfidz-Pesmad`.
- Existing production domain: `tahfidzpesmad.my.id` and `www.tahfidzpesmad.my.id`.
- Existing Vercel project: `smart-tahfidz-pesmad`.
- Current frontend stack: React 19, Vite, TypeScript, Firebase/Firestore.
- Existing roles: `Superadmin`, `Ustadz`, `Pimpinan`, `Wali`, `Santri`.
- Current authentication is legacy application authentication against the Firestore `users` collection and still depends on stored username/password fields.
- Current Tahfidz data model already separates master data and setoran collections such as `santri`, `kelas`, `ziyadah`, `murojaah`, `binnadzor`, and `pembelajaran`.
- Existing performance work explicitly avoids unbounded loading of all setoran collections at startup.

### Sistem Kinerja

- Existing repository: `Amrnjt/Sistem-Kinerja-Pesmad`.
- Stack: React/Vite frontend, Express backend, PostgreSQL, Drizzle ORM, Firebase Admin dependency.
- Existing KPI model includes task totals, completed/in-progress/overdue counts, completion rate, on-time rate, review scores, top performers, and units needing attention.
- Existing `/api/kpi/summary` currently performs broad in-memory calculations and contains placeholder/fallback values. Pesmad App must not present those placeholders as real data.
- Current Kinerja `AuthContext` is a user-switching mechanism rather than production authentication and must not be reused as the final access-control mechanism.

### Shared Firebase project

Smart Tahfidz and Sistem Kinerja currently point to the same Firebase project. This provides a practical migration path for central identity, while application data stores remain independently owned by their modules.

## 3. Domain and Deployment Model

The existing Smart Tahfidz domain is preserved exactly:

```text
tahfidzpesmad.my.id
└── Smart Tahfidz existing app
```

A separate portal is introduced:

```text
app.tahfidzpesmad.my.id
└── Pesmad App
```

Future module domains may include:

```text
kinerja.tahfidzpesmad.my.id
keuangan.tahfidzpesmad.my.id
diniyah.tahfidzpesmad.my.id
```

V1 only requires the existing Tahfidz domain and the new Pesmad App domain. No redirect is added from `tahfidzpesmad.my.id` to Pesmad App.

The new Pesmad App is deployed as its own Vercel project linked to a new repository, tentatively named `Pesmad-App`.

## 4. Pesmad App Technology Choice

Pesmad App V1 uses **Next.js App Router with TypeScript**.

Reasoning:

- the portal needs server-side authentication/session handling;
- dashboard aggregation should not expose downstream databases directly to the browser;
- module access must be authorized on the server;
- Next.js provides one deployable unit for UI, route handlers, session exchange, integration adapters, and PWA assets.

Smart Tahfidz remains on its current React/Vite stack. No framework migration is part of V1.

Expected high-level structure:

```text
app/
  login/
  dashboard/
  users/
  api/
    auth/
    dashboard/
components/
lib/
  auth/
  permissions/
  integrations/
    tahfidz/
    kinerja/
public/
  icons/
  sw.js
```

## 5. Pesmad Identity

Pesmad Identity becomes the central identity/profile layer for internal users without replacing Smart Tahfidz credentials from the user's point of view.

### V1 eligible roles

- Superadmin
- Pimpinan
- Ustadz

Wali and Santri remain outside Pesmad App V1.

### Identity record

A central profile is stored separately from legacy Tahfidz user records. It contains identity and permissions, not plaintext passwords.

Conceptual shape:

```ts
type PesmadUser = {
  authUid: string;
  legacyUserId: string;
  username: string;
  nama: string;
  role: 'Superadmin' | 'Pimpinan' | 'Ustadz';
  active: boolean;
  modules: {
    tahfidz: ModuleAccess;
    kinerja: ModuleAccess;
    keuangan: ModuleAccess;
    diniyah: ModuleAccess;
    santri: ModuleAccess;
    laporan: ModuleAccess;
  };
};

type ModuleAccess = 'none' | 'view' | 'user' | 'admin';
```

## 6. Credential Migration Strategy

Migration is **lazy**, performed when an eligible internal user first signs in to Pesmad App.

### First Pesmad App login

1. User submits the same Smart Tahfidz username/password they already know.
2. Pesmad App server verifies those credentials against the legacy Smart Tahfidz user source.
3. The server confirms the account is active and role is one of the V1-eligible internal roles.
4. If the identity has not yet been migrated, Pesmad App creates or links a Firebase Authentication user using an internal deterministic identifier while preserving the user's current password.
5. Pesmad App creates the central Pesmad Identity profile and default module permissions.
6. The portal establishes a secure authenticated session.

### Subsequent Pesmad App logins

Subsequent logins use Firebase Authentication, while the UI continues to ask for the same username/password. The user does not need to know any internal email/identifier used by Firebase Authentication.

### Transitional legacy password rule

Pesmad App must not create a second plaintext password store. However, Smart Tahfidz currently still depends on its legacy credential field. Therefore:

- the legacy Smart Tahfidz credential remains temporarily for Smart Tahfidz compatibility;
- Pesmad App does not duplicate it in Pesmad Identity;
- removal of legacy password dependence belongs to a later Smart Tahfidz authentication migration, after Pesmad App identity is stable.

No mass reset is required in V1.

## 7. Session Model

Pesmad App uses Firebase Authentication as the authentication authority for migrated internal users, then exchanges a verified Firebase ID token for a secure server-managed session cookie.

Session requirements:

- cookie is `HttpOnly`;
- cookie is `Secure` in production;
- cookie uses an appropriate `SameSite` policy;
- server routes verify the session before returning protected data;
- logout revokes/clears the portal session;
- role and module access are read from the current Pesmad Identity profile, not trusted from client state.

V1 does **not** provide cross-application SSO. Smart Tahfidz and Sistem Kinerja may still ask for login separately when opened. They must use the same known credentials. Full SSO is a post-V1 phase.

## 8. Role and Permission Model

Global role and module access are separate concepts.

Default V1 access:

| Role | Portal | Tahfidz | Kinerja | Portal User/Access Management |
|---|---|---|---|---|
| Superadmin | full | admin | admin | full |
| Pimpinan | full | view | view | none |
| Ustadz | yes | user, scoped by class | user, scoped by assignments | none |
| Wali | not in V1 | existing Tahfidz flow | none | none |
| Santri | not in V1 | existing Tahfidz flow | none | none |

The server is authoritative for access decisions. Client-side hiding of buttons is only presentation and never the security boundary.

Superadmin receives a `Pengguna & Akses` area where module access can be set to `none`, `view`, `user`, or `admin`.

## 9. Module Registry

Pesmad App uses a registry so the dashboard can represent both active and future modules consistently.

V1 registry:

```text
Smart Tahfidz       ACTIVE
Sistem Kinerja      ACTIVE
Keuangan            COMING_SOON
Diniyah             COMING_SOON
Data Santri         COMING_SOON
Laporan Terpadu     COMING_SOON
```

Each module has at least:

- stable ID;
- display name;
- description;
- status;
- launch URL;
- icon key;
- enabled state;
- required permission.

A COMING_SOON module is visible but cannot be launched as an active product feature.

## 10. Dashboard Experience

Pesmad App is a command center, not only a link launcher.

The default dashboard contains:

- authenticated user's name and role;
- active academic period when available;
- summary metrics for Smart Tahfidz;
- summary metrics for Sistem Kinerja;
- active-module cards with launch actions;
- visible COMING_SOON module cards;
- resilient unavailable/error states per module;
- manual `Perbarui Data` action.

### Superadmin/Pimpinan dashboard

Shows institution-level summaries across available modules.

### Ustadz dashboard

Shows scoped information only:

- Tahfidz summary related to classes the Ustadz teaches;
- Kinerja summary related to the user's own tasks/assignments;
- only modules that the user is permitted to access.

## 11. Dashboard Aggregator

The browser calls a Pesmad App server endpoint such as:

```text
GET /api/dashboard
```

The server aggregates independently from each module adapter:

```text
Browser
  ↓
Pesmad App Dashboard API
  ├── Identity/Permission check
  ├── Tahfidz adapter
  └── Kinerja adapter
```

Conceptual response:

```json
{
  "profile": {},
  "modules": [],
  "tahfidz": { "status": "available", "data": {} },
  "kinerja": { "status": "available", "data": {} }
}
```

One adapter failure must not fail the entire dashboard.

Example:

```json
{
  "tahfidz": { "status": "available", "data": {} },
  "kinerja": { "status": "unavailable", "data": null }
}
```

## 12. Smart Tahfidz Integration

V1 Tahfidz integration is **read-only** from Pesmad App.

The portal must not load all historical setoran records. It computes only bounded summary data required by the dashboard, server-side, for example:

- active santri count;
- today's total setoran count;
- today's Ziyadah count;
- today's Murojaah count;
- today's Binnadzor count;
- today's Pembelajaran count;
- last-updated timestamp.

Queries must use explicit date and/or role scoping and server-side count/aggregation where available. No unbounded collection scans are allowed as part of portal startup.

A future materialized document such as `portalSummaries/current` may replace the bounded query adapter if data volume justifies it, but V1 does not require changes to the Smart Tahfidz write path.

## 13. Sistem Kinerja Integration

Pesmad App does not query the Kinerja PostgreSQL database directly.

Sistem Kinerja exposes a dedicated integration endpoint, for example:

```text
GET /api/integrations/pesmad/summary
```

The endpoint returns real aggregated values from SQL, not placeholder values.

Expected fields include:

```json
{
  "totalTasks": 0,
  "completedTasks": 0,
  "inProgressTasks": 0,
  "overdueTasks": 0,
  "completionRate": 0,
  "onTimeRate": null,
  "averageScore": null,
  "lastUpdated": "ISO-8601"
}
```

If a metric cannot be truthfully calculated from available data, it returns `null` rather than a fabricated default.

For Ustadz, the Kinerja integration supports user-scoped summary data. Pimpinan receives read-only institution-level summary. Superadmin receives institution-level administrative access.

The integration endpoint is authenticated server-to-server and is not an open anonymous KPI endpoint.

## 14. Kinerja Authentication for V1

The existing user-switching `AuthContext` is not accepted as production authentication.

Before Sistem Kinerja is considered ACTIVE in production, it must require a real authenticated Pesmad identity. In V1, it may ask the user to log in again using the same Pesmad username/password. Full SSO is deferred.

The active-module release gate therefore requires:

- no automatic default Superadmin session;
- authenticated identity required;
- module authorization enforced;
- existing same credentials accepted.

## 15. Error Handling and Resilience

Adapters are isolated.

Requirements:

- Tahfidz timeout/failure does not make Kinerja unavailable;
- Kinerja timeout/failure does not make Tahfidz unavailable;
- identity/session failure does block protected dashboard data;
- unavailable module summaries display a neutral status and retry action;
- COMING_SOON modules never produce network errors because they are not called;
- adapter errors are logged server-side without exposing secrets to the browser.

Dashboard summary responses may be cached for approximately 1–5 minutes. Authentication, permission, and session responses must not be served from stale PWA caches.

## 16. PWA Requirements

Pesmad App is an installable PWA in V1.

Required capabilities:

- application manifest with Pesmad name, icons, theme metadata, `standalone` display mode, and start URL;
- service-worker registration;
- installable experience on supported mobile browsers;
- standalone/fullscreen-like launch behavior;
- versioned static app-shell caching;
- safe offline fallback for the shell/navigation frame;
- no offline mutation queue in V1;
- no long-lived caching of authentication responses, permissions, or live dashboard API responses.

Caching policy:

- static versioned assets: cache-first;
- navigation/app shell: network-first with safe cached fallback;
- `/api/auth/*`: network-only/no-store;
- `/api/dashboard`: network-first or short server cache, never stale-forever;
- permission/profile responses: network-first/no-store when authorization changes could matter.

Smart Tahfidz keeps its existing PWA independently. Users may have both Smart Tahfidz and Pesmad App installed as separate icons.

## 17. Security Boundaries

Security requirements:

- no module-level authorization is trusted solely from React state;
- all protected Pesmad App API routes verify authenticated session;
- every module launch/summary checks module permission;
- Firebase Admin/server credentials stay in Vercel encrypted environment variables;
- Kinerja integration secrets/tokens stay server-side;
- sensitive downstream base URLs and privileged credentials are not embedded in public client bundles;
- no plaintext password is added to Pesmad Identity;
- legacy plaintext credential dependence is treated as transitional technical debt, not copied into new systems;
- logs must not print user passwords, session cookies, service-account JSON, or integration tokens.

## 18. Production Rollout

Implementation is staged so existing Smart Tahfidz production remains stable.

### P0 — Foundation

- create `Pesmad-App` repository;
- scaffold Next.js App Router + TypeScript;
- establish design tokens/layout foundation;
- configure environments;
- add manifest/service worker/PWA shell.

### P1 — Identity

- implement legacy credential verifier for eligible internal roles;
- implement lazy Firebase Auth migration;
- create Pesmad Identity profile;
- implement secure session cookie;
- implement role and module permission checks.

### P2 — Portal Dashboard

- implement role-aware shell/dashboard;
- implement module registry;
- display all six module cards;
- activate Tahfidz and Kinerja cards only when their release gates pass.

### P3 — Tahfidz Integration

- implement read-only bounded server-side summary adapter;
- verify no unbounded startup reads;
- verify role scoping for Ustadz.

### P4 — Kinerja Integration

- replace placeholder KPI behavior for portal use with truthful SQL aggregation;
- add authenticated integration summary endpoint;
- replace user-switching production auth with Pesmad identity login;
- verify user/institution scoping.

### P5 — Superadmin Access Management

- implement `Pengguna & Akses`;
- allow module permission changes;
- preserve Pimpinan view-only policy;
- ensure only Superadmin manages portal access.

### P6 — Release Gate

- lint/typecheck/build;
- authentication tests;
- permission tests;
- integration failure tests;
- PWA install/cache tests;
- mobile/desktop responsive verification;
- preview-deployment verification;
- security review for secrets and legacy credential handling.

### P7 — Production Domain

- create/reuse Vercel project for Pesmad App;
- deploy production;
- attach `app.tahfidzpesmad.my.id`;
- verify `tahfidzpesmad.my.id` remains attached only to Smart Tahfidz and is not redirected.

### P8 — Post-V1 SSO

After V1 identity proves stable, design a separate SSO phase for one-login access across Pesmad App, Smart Tahfidz, Sistem Kinerja, and future modules.

## 19. Explicit Non-Goals for V1

V1 does not include:

- Wali/Santri portal access;
- full cross-subdomain SSO;
- replacing the entire Smart Tahfidz authentication flow;
- merging all applications into one repository;
- direct browser access to Kinerja PostgreSQL;
- active Keuangan, Diniyah, Data Santri, or Laporan Terpadu modules;
- offline data-entry/mutation sync;
- moving Smart Tahfidz away from its current production domain;
- introducing fabricated KPI defaults when source data is absent.

## 20. Acceptance Criteria

V1 is complete only when all of the following are true:

1. `tahfidzpesmad.my.id` still opens the existing Smart Tahfidz app with no forced portal redirect.
2. Eligible Superadmin, Pimpinan, and Ustadz users can sign in to Pesmad App using their existing Smart Tahfidz credentials.
3. Wali and Santri are not admitted to Pesmad App V1.
4. Pesmad App uses secure authenticated sessions and server-side permission checks.
5. The dashboard shows real, bounded Tahfidz summary data.
6. The dashboard shows real Kinerja summary data with no fabricated KPI fallbacks.
7. Tahfidz and Kinerja failures are isolated from each other in the portal UI.
8. Pimpinan remains view-only for operational modules.
9. Only Superadmin can manage Pesmad App module access.
10. Keuangan, Diniyah, Data Santri, and Laporan Terpadu are visible as COMING_SOON and are not falsely active.
11. Pesmad App is installable as a PWA and does not cache authentication/permission data unsafely.
12. Preview deployment passes mobile, desktop, auth, permission, integration-failure, and PWA verification before production domain attachment.
13. `app.tahfidzpesmad.my.id` serves Pesmad App while the Smart Tahfidz production domain remains unchanged.
