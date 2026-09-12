# Smart Tahfidz RDS Foundations + Adaptive App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the semantic Revolutionary Design System foundations and a responsive App Shell that hosts later role experiences without changing protected data, auth, or business logic.

**Architecture:** Add focused CSS custom-property tokens and small TypeScript resolution utilities around the existing React/Vite shell. Keep `App.tsx` as the composition boundary, refactor the existing `Navbar`, `DesktopPrimaryNav`, and `BottomNav` only where shell responsibilities require it, and expose stable props/interfaces to later slices. Responsive composition is CSS-first: Compact, Medium, and Expanded render intentional shell variants rather than a scaled desktop layout.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, existing CSS files/custom properties, `lucide-react`, existing `motion` package, Node `node:test`, and the repository’s Playwright browser fixture. No new dependency is required by this plan.

**Spec:** `docs/superpowers/specs/2026-09-12-smart-tahfidz-revolutionary-design.md`

## Global Constraints

- This plan is documentation for a later implementation; do not execute it in the current dirty working tree.
- Before implementation begins, use the Superpowers `using-git-worktrees` workflow to create an isolated Revolutionary Design worktree from the approved clean base. Select the exact branch and path only after verifying Git state.
- Revolutionary experience, evolutionary migration: preserve authentication/session behavior, Firestore structures, permissions, business logic, domain models, and functional workflows.
- New UI may depend on the protected core; the protected core must never depend on the Revolutionary UI layer.
- Existing Smart Tahfidz brand colors and identity remain recognizable.
- Use semantic tokens instead of hard-coded one-off visual colors.
- Support Light, Dark, and System; System follows OS/browser preference, while explicit Light/Dark overrides it.
- Dark mode is intentionally designed, not a color inversion; theme state has one clear source of truth and does not require Firestore persistence.
- Use Solid, Soft, Glass, and Ambient materials selectively; blur must degrade to solid elevated surfaces and decoration must never impair readability.
- Qur'anic/Arabic content requires dedicated typography, directionality, line height, reading width, spacing, and fallback behavior.
- Motion explains state and continuity; support `prefers-reduced-motion`; visual luxury is enhancement, not dependency.
- Do not add generative AI, predictive academic judgments, scoring/rubric logic, Firestore schema changes, auth rewrites, dashboard redesigns, or secondary-page migration in this slice.
- Do not randomly reorder primary navigation. Permission overrides convenience; UI visibility is not authorization.
- Compact, Medium, and Expanded are distinct compositions. Do not merely shrink desktop into mobile.
- First viewport must expose meaningful value and the primary action; avoid accidental page-level horizontal scrolling.
- Target relevant WCAG 2.2 AA principles: keyboard navigation, visible focus, semantic landmarks, labels, touch targets, reduced motion, contrast, and non-color-only states.
- Protect mid-range mobile performance: CSS handles responsiveness, blur is selective, effects progressively enhance, and desktop navigation is not rendered offscreen as the primary mobile strategy.
- Every implementation task ends with TDD, focused verification, and a focused commit containing only that task’s files.
- Human preview follows `Build → Test → Run → Preview → Human Review → Continue`; preview does not replace tests.

## Planned File Architecture

### Created

- `src/design-system/tokens.css` — semantic color, depth, spacing, radius, typography, and motion custom properties for Light and Dark themes, including fallback-safe material classes.
- `src/design-system/theme.ts` — pure `ThemePreference`/`ResolvedTheme` types and browser-independent theme resolution helpers.
- `src/design-system/ThemeProvider.tsx` — the single React theme source of truth, system preference subscription, document theme attribute, and no-persistence default.
- `src/design-system/materials.css` — focused Solid, Soft, Glass, and Ambient material primitives with blur fallback.
- `src/design-system/typography.css` — product and Qur'anic typography classes, directionality, readable widths, and long-content behavior.
- `src/design-system/motion.css` — motion grammar variables/classes and reduced-motion overrides.
- `src/design-system/layout.css` — Compact/Medium/Expanded composition primitives, first-viewport constraints, safe-area handling, and shell layout contracts.
- `src/design-system/CommandTrigger.tsx` — shell-level desktop/mobile command entry trigger; it opens a caller-owned surface but does not register feature commands.
- `src/design-system/command.ts` — minimal stable command-layer types for future role-filtered registries without feature population.
- `tests/design-system/theme.test.mjs` — Node unit tests for pure theme resolution and system preference behavior.
- `tests/browser/app-shell.test.mjs` — Playwright browser checks for shell modes, theme, command trigger, keyboard access, focus, reduced motion, and first-viewport behavior.

### Modified

- `src/main.tsx` — wrap the existing app with `ThemeProvider` and load the RDS foundation styles once.
- `src/App.tsx` — retain current data/auth/tab composition while adding the shell-level command trigger and RDS shell landmarks/classes; no business logic or service contract changes.
- `src/index.css` — replace shell-wide color/spacing assumptions with semantic token usage where this file already owns global primitives; preserve existing focus and forced-colors behavior.
- `src/app-shell.css` — adapt existing shell geometry and navigation styles to RDS materials/composition modes without duplicating token definitions.
- `src/responsive-accessibility.css` — consolidate existing responsive and reduced-motion guardrails into the RDS layout/motion contracts; preserve unrelated dashboard rules.
- `src/chrome-transition-fix.css` — keep existing navigation transition compatibility while consuming RDS motion variables and reduced-motion behavior.
- `src/components/Navbar.tsx` — retain brand/profile/sync responsibilities while exposing an accessible compact header and the command trigger slot.
- `src/components/DesktopPrimaryNav.tsx` — retain current predictable tab ordering and add Expanded/Medium shell variants with semantic navigation landmarks.
- `src/components/BottomNav.tsx` — retain current mobile actions, active-state semantics, safe-area handling, and permission filtering while consuming Compact shell primitives.
- `src/hooks/useActiveTabNavigation.ts` — only if required to expose a stable navigation callback/interface to the shell; preserve URL, Back, scroll-reset, and role sanitization behavior.
- `tests/browser/dashboard-fixture.tsx` — mount the same RDS theme/shell context used by the app so browser checks exercise real shell components without production data.

### Tested without modification unless a test fixture extension is required

- `tests/browser/dashboard.test.mjs` — existing navigation regression suite remains a required regression command and is extended only if a shell contract cannot be covered by the new isolated shell suite.
- `tests/navigation-jank-regression.test.mjs` — existing source-level navigation regression remains required.
- `tests/setor-dropup-source.test.mjs` — existing Setor/drop-up source regression remains required.

The plan does not modify `src/services/`, `src/types/index.ts`, dashboard components, Firestore/auth code, package manifests, or test backups. Existing dirty changes in any path are unrelated until proven otherwise.

## Interfaces

The following interfaces are the cross-task contracts. Names must remain consistent across the implementation:

```ts
// src/design-system/theme.ts
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export function resolveTheme(preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme;
export function getStoredThemePreference(value: string | null): ThemePreference;
```

```ts
// src/design-system/ThemeProvider.tsx
export interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}
export function ThemeProvider(props: { children: React.ReactNode; initialPreference?: ThemePreference }): JSX.Element;
export function useTheme(): ThemeContextValue;
```

```ts
// src/design-system/command.ts
export interface CommandTriggerProps {
  onOpen: () => void;
  mode: 'expanded' | 'medium' | 'compact';
  disabled?: boolean;
}
export interface CommandDefinition {
  id: string;
  label: string;
  keywords?: string[];
  isAllowed: (context: { role: string }) => boolean;
  execute: () => void | Promise<void>;
}
export type CommandRegistry = ReadonlyArray<CommandDefinition>;
```

`CommandDefinition` is a future-consumer contract only in this slice: no feature registry, action population, or authorization replacement is implemented here.

## Task 1: Establish semantic RDS tokens and material contracts

**Files:**
- Create: `src/design-system/tokens.css`
- Create: `src/design-system/materials.css`
- Create: `src/design-system/typography.css`
- Create: `tests/browser/app-shell.test.mjs` (initial token/material assertions)
- Modify: `src/index.css` and `src/main.tsx`

**Interfaces:**
- Produces CSS custom properties for canvas/surface, text, border, interactive, primary emphasis, status, depth, spacing, radius, typography, and motion categories.
- Produces `.rds-surface-solid`, `.rds-surface-soft`, `.rds-surface-glass`, `.rds-surface-ambient`, `.rds-type-product`, and `.rds-type-quranic` classes.

- [ ] Write failing browser assertions that Light exposes readable semantic variables, each material class exists, Solid is the default critical surface, and Qur'anic content has `dir="rtl"`, readable line-height, and bounded reading width.
- [ ] Run `npm run dev` and `node --test tests/browser/app-shell.test.mjs` from the isolated worktree; verify the new selectors fail because the contracts do not yet exist. Do not run the server during this planning task.
- [ ] Add the token and material styles without changing existing brand values more than necessary; use `@supports (backdrop-filter: blur(1px))` for Glass and a solid elevated fallback outside it.
- [ ] Add Product/Qur'anic typography styles with system fallbacks, `overflow-wrap`, `text-wrap: pretty` where supported, and no package/font change unless the implementation evidence requires it.
- [ ] Import the foundation CSS once from `src/main.tsx`; replace only global declarations in `src/index.css` that duplicate token ownership.
- [ ] Run `node --test tests/browser/app-shell.test.mjs`, `npm run lint`, and `npm run build`; verify PASS and no dashboard behavior is altered.
- [ ] Commit only the Task 1 files with `git add` paths listed above and `git commit -m "feat: establish RDS semantic foundations"`.

## Task 2: Add deterministic theme resolution and provider

**Files:**
- Create: `src/design-system/theme.ts`
- Create: `src/design-system/ThemeProvider.tsx`
- Create: `tests/design-system/theme.test.mjs`
- Modify: `src/main.tsx`
- Test: `tests/browser/app-shell.test.mjs`

**Interfaces:**
- Consumes `ThemePreference`, `ResolvedTheme`, `resolveTheme`, and `getStoredThemePreference` signatures above.
- Produces `ThemeContextValue`, `ThemeProvider`, and `useTheme` signatures above.
- Document state: `document.documentElement.dataset.theme` is exactly `light` or `dark`; preference is represented separately as `data-theme-preference` with `light`, `dark`, or `system`.

- [ ] Write failing Node tests for light override, dark override, system-light, system-dark, invalid/null preference fallback to `system`, and no dependence on `window` in `resolveTheme`.
- [ ] Run `node --test tests/design-system/theme.test.mjs`; verify failure identifies missing module/functions.
- [ ] Implement pure resolution and parsing functions; do not read/write Firestore or add a dependency.
- [ ] Implement `ThemeProvider` with one state source, initial preference from an explicit prop or local browser storage only if the repository’s existing UI convention confirms it; system changes affect only `system` preference.
- [ ] Apply the document attributes synchronously from provider state and subscribe/unsubscribe to `matchMedia('(prefers-color-scheme: dark)')` changes; use a guarded browser check for fixture/SSR-like execution.
- [ ] Run unit tests, `npm run lint`, and `npm run build`; verify all pass.
- [ ] Extend browser tests to select Light/Dark/System and verify the resolved document theme and no unreadable transition (theme attributes update atomically before computed color assertions).
- [ ] Run the browser test and existing `node --test tests/browser/dashboard.test.mjs`; commit only Task 2 files with `git commit -m "feat: add RDS theme architecture"`.

## Task 3: Consolidate motion primitives and reduced-motion behavior

**Files:**
- Modify: `src/design-system/motion.ts`
- Create: `src/design-system/motion.css`
- Modify: `src/index.css`, `src/app-shell.css`, and `src/chrome-transition-fix.css`
- Modify: `tests/browser/app-shell.test.mjs`
- Test: `tests/browser/dashboard.test.mjs`

**Interfaces:**
- Preserve existing `motionDuration`, `motionEase`, `motionSpring`, `motionTransition`, and `reducedMotionTransition` exports.
- Add only focused named exports if needed: `motionCategory` with `feedback | continuity | data | celebration | entrance`, and `motionCssVar(category)` returning a token name; no new animation library.

- [ ] Write failing browser checks using Playwright’s `reducedMotion: 'reduce'` context: shell transitions have zero duration/animation, while normal mode has the RDS duration variables; verify ripple/press feedback is not required for operation.
- [ ] Run `node --test tests/browser/app-shell.test.mjs tests/browser/dashboard.test.mjs`; verify the new assertions fail before CSS/exports are added while existing regressions remain identifiable.
- [ ] Map existing durations/easings to the five categories and CSS variables; preserve existing page/chart behavior and use transform/opacity for shell transitions.
- [ ] Add `@media (prefers-reduced-motion: reduce)` overrides that set transition/animation duration to `0s`, remove nonessential animation, and preserve state changes/focus.
- [ ] Run `npm run lint`, `npm run build`, and both browser suites; verify existing reduced-motion/navigation tests still pass.
- [ ] Commit only Task 3 files with `git commit -m "feat: consolidate adaptive motion foundations"`.

## Task 4: Define responsive composition and accessibility primitives

**Files:**
- Create: `src/design-system/layout.css`
- Modify: `src/responsive-accessibility.css`, `src/index.css`, and `src/app-shell.css`
- Modify: `tests/browser/app-shell.test.mjs`

**Interfaces:**
- Produces CSS-first Compact, Medium, and Expanded composition using CSS media queries and/or container queries. A `[data-layout-mode="compact|medium|expanded"]` attribute may be used only as a semantic/testing contract if needed; it must not require JavaScript breakpoint synchronization. If an attribute would require React resize listeners or `window.innerWidth`, omit it and test the actual CSS composition instead.
- Produces `.rds-main-landmark`, `.rds-focus-visible`, `.rds-touch-target`, `.rds-safe-area-bottom`, and `.rds-no-page-overflow` contracts.

- [ ] Write failing browser checks at 360, 390, 768, 1024, and 1440 widths for the actual CSS media/container-query composition, no desktop sidebar in Compact, safe-area-aware bottom shell, primary action in the first viewport, and `documentElement.scrollWidth <= clientWidth`; do not use React resize listeners or `window.innerWidth` as the responsive layout engine.
- [ ] Add keyboard/focus assertions for landmark navigation, visible `:focus-visible`, labelled controls, and touch-target minimum of 44 CSS pixels for primary shell controls.
- [ ] Run the isolated browser test; verify failures identify missing mode and accessibility contracts.
- [ ] Implement CSS-first mode contracts with only the project’s necessary breakpoint boundaries, using media queries and/or container queries; use `clamp`, grid/flex, `min-width: 0`, safe-area insets, and intentional snap overflow only inside explicitly marked scrollers. Do not add React resize listeners or `window.innerWidth`; use `data-layout-mode` only if it remains a non-JavaScript semantic/testing contract.
- [ ] Ensure status/active states have text or shape/label support in addition to color and that Arabic text remains readable under all themes.
- [ ] Run browser tests, `npm run lint`, `npm run build`, and all existing navigation regressions; verify no accidental horizontal page scrolling.
- [ ] Commit only Task 4 files with `git commit -m "feat: add responsive accessibility primitives"`.

## Task 5: Add shell-level command trigger foundation

**Files:**
- Create: `src/design-system/command.ts`
- Create: `src/design-system/CommandTrigger.tsx`
- Create: `tests/design-system/command-trigger.test.mjs` (source/component contract checks using the existing test style)
- Modify: `src/App.tsx`, `src/components/Navbar.tsx`, `src/main.tsx`
- Modify: `tests/browser/dashboard-fixture.tsx` and `tests/browser/app-shell.test.mjs`

**Interfaces:**
- Consume `CommandTriggerProps` and `CommandRegistry` contracts above.
- `CommandTrigger` must render a labelled `button`, call `onOpen` once on click, expose Ctrl/Cmd+K only when `mode !== 'compact'`, and expose a compact mobile trigger without registering commands.
- The trigger must not inspect Firestore, calculate domain priorities, or bypass role permissions.

- [ ] Write failing tests for click-to-open, Ctrl+K/Cmd+K open in Expanded/Medium, no duplicate open event when keydown repeats, compact trigger visibility, and accessible name.
- [ ] Run exact Node/browser tests and verify failure.
- [ ] Implement the minimal trigger and a shell-owned `onOpenCommandLayer` callback in `App.tsx`; render the surface placeholder as a caller-owned region with `aria-hidden`/closed state and no feature registry.
- [ ] Keep normal navigation intact and ensure keyboard handling ignores editable targets unless the user explicitly presses the shortcut from a command-safe target.
- [ ] Run `npm run lint`, `npm run build`, command tests, and dashboard browser regressions; verify navigation and Setor/Kelola behavior remain unchanged.
- [ ] Commit only Task 5 files with `git commit -m "feat: add shell command trigger foundation"`.

## Task 6: Refactor the App Shell for Expanded, Medium, and Compact composition

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/DesktopPrimaryNav.tsx`
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/app-shell.css`, `src/responsive-accessibility.css`, and `src/design-system/layout.css`
- Modify: `tests/browser/dashboard-fixture.tsx`
- Test: `tests/browser/app-shell.test.mjs`, `tests/browser/dashboard.test.mjs`

**Interfaces:**
- Preserve existing `Navbar`, `DesktopPrimaryNav`, `BottomNav`, and `useActiveTabNavigation` props and callback semantics unless a backward-compatible optional shell prop is required.
- App Shell must expose one `header`, one primary `nav` landmark for Expanded/Medium, one Compact bottom `nav`, and one `main#main-content`; all labels remain stable (`Navigasi utama`, `Navigasi bawah`).
- `setActiveTab: (tab: ActiveTab) => void` remains the navigation boundary; shell does not own data writes.

- [ ] Write failing browser tests for Expanded sidebar/collapsible navigation, Medium rail/reduced shell, Compact bottom navigation with no desktop sidebar, active navigation stability, Back/URL behavior, and first-viewport primary action.
- [ ] Run `node --test tests/browser/app-shell.test.mjs tests/browser/dashboard.test.mjs`; verify new mode assertions fail without disturbing baseline failures.
- [ ] Implement the smallest shell composition that reuses existing navigation components: Expanded gets a collapsible sidebar, Medium gets a reduced rail/composition, Compact gets BottomNav plus compact header/focus slot. Do not render hidden desktop navigation as the mobile primary technique.
- [ ] Preserve predictable item order, existing role sanitization, Setor/Kelola sheets, active indicators, live DOM navigation, scroll reset, and no native view-transition snapshots.
- [ ] Apply Solid to critical navigation/content surfaces, restrained Soft only to interactive affordances, selective Glass to floating shell surfaces, and Ambient only as readable background enhancement.
- [ ] Run the two browser suites at 360, 390, 768, 1024, and 1440; verify semantic landmarks, keyboard traversal, focus visibility, target sizes, safe areas, and no page overflow.
- [ ] Run `npm run lint` and `npm run build`; commit only Task 6 files with `git commit -m "feat: compose adaptive app shell"`.

## Task 7: Complete visual verification infrastructure for this slice

**Files:**
- Modify: `tests/browser/app-shell.test.mjs`
- Modify: `tests/browser/dashboard-fixture.tsx` only if theme/mode controls need fixture wiring
- Modify: `tests/browser/README.md` only to document the existing exact command for the new shell suite, if necessary

**Interfaces:**
- Browser fixture continues to render real `Navbar`, `DesktopPrimaryNav`, `BottomNav`, `useActiveTabNavigation`, and the same RDS `ThemeProvider` as the application.
- Test entry remains `node --test tests/browser/app-shell.test.mjs`; no new test runner is introduced.

- [ ] Add a matrix covering widths 360, 390, 768, 1024, and 1440; Light, Dark, and System; normal and reduced motion; keyboard command opening; navigation labels/current state; first viewport; touch-target bounds; Arabic typography; and page overflow.
- [ ] Add assertions that a failed/closed command surface does not change the active tab and that shell state changes do not issue service writes.
- [ ] Run `npm run dev` from the isolated worktree, then `node --test tests/browser/app-shell.test.mjs tests/browser/dashboard.test.mjs tests/navigation-jank-regression.test.mjs tests/setor-dropup-source.test.mjs`; record exact PASS results.
- [ ] Run `npm run lint` and `npm run build`; verify no uncaught browser errors and no regression in existing dashboard navigation.
- [ ] Commit only test/documentation files with `git commit -m "test: verify RDS shell foundations"`.

## Human Preview Checkpoints

After Tasks 1–3, pause at **Checkpoint A — RDS Foundations**. Run `npm run dev` in the isolated worktree and inspect Light, Dark, surfaces, typography, core interactive states, and reduced motion. Review at 360/390 and 1440 before continuing.

After Tasks 4–7, pause at **Checkpoint B — Adaptive App Shell**. Inspect Expanded, Medium, and Compact compositions, desktop sidebar, tablet behavior, mobile bottom navigation, command trigger, first viewport, keyboard focus, and safe-area behavior at 360, 390, 768, 1024, and 1440.

Use the existing Vite script (`npm run dev`, port 3000, host `0.0.0.0`) from the isolated worktree. Do not start the server or create the worktree during this writing-plan task. Human preview is a visual validation layer and does not replace unit, component, browser, accessibility, performance, or regression checks.

## Verification and Commit Discipline

Each task must use TDD → minimal implementation → exact test command → lint/build/regression verification → focused commit. Before every future task commit, inspect `git status --short` and confirm only that task’s intended files are staged. Never stage the current dirty working tree’s unrelated modifications or untracked files.

## Self-Review

- Approved-spec requirements belonging to RDS foundations, themes, materials, typography, depth, motion, accessibility, responsive composition, App Shell, navigation, command trigger, testing, preview, and isolation are assigned to Tasks 1–7.
- Later-slice dashboard, Setoran, assessment rubric, priority-engine, role redesign, schema, auth, AI, and secondary-page work is excluded.
- No placeholder markers or undefined task interfaces are used; every task has concrete files, interfaces, commands, and acceptance behavior.
- Theme, command, navigation, and shell interfaces are defined consistently and preserve existing callback contracts.
- No task changes Firestore schemas, services, domain types, auth, business logic, or source files outside the listed shell/foundation boundaries.
- Mobile is structurally distinct from desktop, with Compact BottomNav and no desktop sidebar as the mobile primary technique.
- Live preview checkpoints and the isolated-worktree requirement are explicit.
- The plan was written from verified repository facts: React/TypeScript/Vite package metadata, existing shell component names, `src/design-system/motion.ts`, current CSS ownership, and Node/Playwright browser test commands.
