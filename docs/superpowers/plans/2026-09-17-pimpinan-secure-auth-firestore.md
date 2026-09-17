# Pimpinan Secure Auth & Firestore Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Smart Tahfidz from client-trusted username/password sessions to Firebase Auth custom-token sessions so Firestore can enforce Pimpinan as global read-only at the server boundary.

**Architecture:** Reuse the proven `security/p0-auth-role-integration` design rather than merging that diverged branch. A Vercel server endpoint verifies migrated password hashes, creates Firebase custom tokens with role claims, and the client signs in with Firebase Auth. Firestore Rules use those claims; Pimpinan is a trusted global reader but never a writer and never receives the global users/credential dataset.

**Tech Stack:** React 19, TypeScript, Vite 6, Firebase Auth, Firestore, Firebase Admin, Vercel Functions, Firebase Emulator Suite.

**Spec:** Existing role contract in `src/utils/roles.ts` and P1/P2/P2.1/P3A implementation on `feat/p1-pimpinan-role-foundation`.

## Global Constraints

- Preserve existing Ustadz/Wali/Santri/Superadmin behavior unless security requires a fail-closed change.
- Pimpinan may read global tahfidz monitoring data but may not create, update, delete, manage users, or read credential material.
- Plaintext passwords must not remain in client session/cache after secure auth migration.
- Do not merge to `main` or deploy Firestore Rules in this phase.
- All security changes must pass regression tests, TypeScript, production build, and Firestore/Auth emulator tests before being considered merge-ready.
- Unknown roles fail closed.

---

### Task 1: Port secure server authentication with Pimpinan claims

**Files:**
- Create: `api/_credentials.ts`
- Create: `api/_firebaseAdmin.ts`
- Create: `api/auth/login.ts`
- Create: `api/auth/admin-users.ts`
- Create: `api/auth/migrate-credentials.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Test: `tests/auth.runtime.test.ts`

**Interfaces:**
- Produces `/api/auth/login` returning `{ success, token, user }`.
- Firebase custom claims contain `role`, `username`, and `idSantri`.
- `Pimpinan` is accepted as a trusted role but rejected by account-management write actions.

- [ ] Write failing tests that login accepts Pimpinan, issues a Pimpinan claim, and admin APIs reject Pimpinan writes.
- [ ] Verify tests fail against current branch.
- [ ] Port the server auth files from `security/p0-auth-role-integration` and extend all role unions/allowlists with `Pimpinan`.
- [ ] Ensure profile cleaning clears `idSantri` for Pimpinan.
- [ ] Run auth runtime tests.
- [ ] Commit.

### Task 2: Port Firebase Auth client bootstrap

**Files:**
- Create: `src/services/authService.ts`
- Create: `src/services/secureAccountBridge.ts`
- Create: `src/SecureApp.tsx`
- Modify: `src/services/firebase.ts`
- Modify: `src/main.tsx`
- Test: `tests/auth.runtime.test.ts`

**Interfaces:**
- `authService.signIn(username, password, rememberMe)` replaces legacy Firestore password matching.
- `authService.restoreSession()` trusts Firebase ID-token claims, not LocalStorage role data.
- `installSecureAccountBridge()` keeps existing LoginView/account UI while routing account lifecycle through server APIs.

- [ ] Write failing source/runtime tests for custom-token login and Pimpinan session restoration.
- [ ] Verify RED.
- [ ] Port client auth files and use `normalizeUserRole()` for all role normalization.
- [ ] Strip password fields before storing application sessions.
- [ ] Boot through `SecureApp` and install account bridge before scoped sync.
- [ ] Run tests, TypeScript, and build.
- [ ] Commit.

### Task 3: Add Pimpinan global read-only scoped sync

**Files:**
- Create: `src/services/roleScopedSync.ts`
- Modify: `src/utils/roles.ts`
- Test: `tests/auth.runtime.test.ts`

**Interfaces:**
- Superadmin/Ustadz retain staff sync.
- Wali/Santri keep ownership-scoped queries.
- Pimpinan receives global `santri`, `ziyadah`, `murojaah`, `binnadzor`, `pembelajaran`, `kelas`, `pantauan_liburan`, and `app_config`, but only its own user profile and no credentials.

- [ ] Write failing tests for Pimpinan global-read/no-users behavior.
- [ ] Verify RED.
- [ ] Add explicit role helpers separating writers from global readers.
- [ ] Port/adapt role-scoped sync with a dedicated Pimpinan branch.
- [ ] Ensure Pimpinan cache never contains the global users list.
- [ ] Run tests and build.
- [ ] Commit.

### Task 4: Replace open Firestore Rules with role enforcement

**Files:**
- Modify: `firestore.rules`
- Create: `firebase.json`
- Test: `tests/firestore.rules.test.mjs`

**Interfaces:**
- `isWriterStaff()` = Superadmin or Ustadz.
- `isGlobalReader()` = Superadmin, Ustadz, or Pimpinan.
- `Pimpinan` can read global monitoring collections but never write.
- `users` reads are limited to writer staff or own profile; Pimpinan does not get all users.
- `auth_credentials` is server-only.
- Unreviewed paths deny all.

- [ ] Write emulator tests for Pimpinan global reads and denied writes.
- [ ] Verify RED with current open rules.
- [ ] Adapt the secure rules from `security/p0-auth-role-integration` to include Pimpinan as global reader only.
- [ ] Add/retain ownership rules for Wali/Santri.
- [ ] Run Firestore emulator tests.
- [ ] Commit.

### Task 5: Migration gate and final verification

**Files:**
- Create/adapt: `scripts/verify-auth-role-fail-closed.mjs`
- Create/adapt: `scripts/verify-security-bootstrap.mjs`
- Modify: `package.json`
- Verify: whole branch diff against `main`

**Interfaces:**
- Secure rules must not be deployed before credentials are migrated and required Vercel/Firebase Admin environment variables exist.

- [ ] Verify migration endpoint can convert legacy `users.password` into hashed `auth_credentials` and remove plaintext password from `users`.
- [ ] Run role fail-closed verification.
- [ ] Run auth emulator tests.
- [ ] Run Firestore rules emulator tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Audit diff for accidental UI/history changes.
- [ ] Record deployment prerequisites; do not deploy or merge automatically.
