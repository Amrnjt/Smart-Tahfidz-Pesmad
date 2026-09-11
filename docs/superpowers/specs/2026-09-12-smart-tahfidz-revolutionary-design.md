# Smart Tahfidz Revolutionary Design — Design Specification

Status: Approved Design / Pre-Implementation  
Date: 2026-09-12

This specification governs a progressive reconstruction of Smart Tahfidz. It is **not permission to rewrite the protected application core**. This is a design specification only; it does not authorize implementation, dependency changes, migration, deletion, or commitment.

## 1. Product Vision

Smart Tahfidz will evolve into a next-generation Qur'an learning and pesantren progress platform with the identity **Islamic × Futuristic × Human**. It should feel modern, premium, calm, warm, and deeply connected to its Qur'anic/pesantren purpose while keeping the existing Smart Tahfidz brand colors and identity recognizable.

Avoid generic SaaS dashboard aesthetics, excessive ornamental Islamic decoration, gamification-heavy experiences, animation for animation’s sake, and visual redesigns that destroy the existing identity.

Primary UX principle: **Adaptive Intelligence + Action First**.

When trade-offs occur, prioritize: 1) usability, 2) speed, 3) clarity, 4) accessibility, 5) visual delight. “Revolutionary” means more advanced **and** easier to use.

## 2. Migration Philosophy

The migration strategy is **Progressive Reconstruction**.

> Revolutionary experience, evolutionary migration.

Preserve healthy authentication/session behavior, Firestore data structures unless explicitly migrated later, permissions, business logic, domain models, and functional workflows. Do not rewrite working application logic merely to make it visually newer.

New UI may depend on the protected core; the protected core must never depend on the Revolutionary UI layer.

## 3. Protected Core vs Revolutionary Experience Layer

### Protected Core

- Auth & Session
- Firebase / Firestore access
- Storage/data services
- Roles & Permissions
- Existing Business Logic
- Existing Domain Models

### Revolutionary Experience Layer

- Revolutionary Design System (RDS)
- Semantic Design Tokens
- Theme System
- Motion System
- Adaptive App Shell
- Adaptive Navigation
- Focus Layer
- Adaptive Focus Hero
- Priority Bento
- Universal Command Layer
- Narrative Insight Layer
- Role-specific Experience Composition

Where possible, UI components should consume stable adapters/view models rather than embedding Firestore queries and domain calculations directly inside presentation components.

## 4. Revolutionary Design System (RDS)

RDS is a behavioral and visual system, not merely a component library.

### 4.1 Semantic tokens

Map existing brand colors into semantic tokens instead of hard-coded visual colors. Relevant concepts include `surface-primary`, `surface-secondary`, `text-primary`, `text-muted`, `border-subtle`, `primary-emphasis`, `interactive`, `status-positive`, `status-warning`, and `status-danger`. Light and dark themes may map these tokens differently while retaining Smart Tahfidz identity.

### 4.2 Hybrid Material System

Use four material categories:

- **Solid Surface:** forms, tables, dense information, data entry, and critical content.
- **Soft Surface:** subtle neumorphism only where tactile affordance helps, such as quick actions, selectable controls, selected states, and compact interactive elements.
- **Glass Surface:** selectively for Adaptive Focus Hero, floating/navigation surfaces, contextual overlays, and Universal Command Layer. Fall back gracefully to solid elevated surfaces when blur/backdrop performance is unsuitable.
- **Ambient Surface:** very subtle Islamic geometry, gradient, atmosphere, and light/depth; never at the expense of readability.

> Semakin penting informasinya, semakin sedikit dekorasinya.

### 4.3 Typography

Use dual typography: Product Typography for navigation, forms, analytics, numbers, and system UI; Qur'anic Typography for Arabic/Qur'anic content with an appropriate Arabic font, line height, reading width, spacing, directionality, and hierarchy. Qur'anic text must never be treated like ordinary UI text.

### 4.4 Depth model

- Level 0 — Canvas
- Level 1 — Content Surface
- Level 2 — Interactive Surface
- Level 3 — Navigation / Floating Action
- Level 4 — Command Layer / Bottom Sheet / Modal

## 5. Motion & Interaction Grammar

Use **Adaptive Motion**, with five categories:

1. Feedback Motion: ripple, press feedback, and suitable tactile spring.
2. Continuity Motion: expand/collapse, card-to-detail continuity, and state morphing.
3. Data Motion: animated counters, progress transitions, and chart morph/transition.
4. Celebration Motion: only meaningful academic/Qur'anic milestones.
5. Entrance Motion: normalized fade-in-up, restrained stagger, and controlled scroll reveal.

Existing Smart Tahfidz ripple, animated counter, fade/reveal, and chart motion should be consolidated into this grammar rather than discarded. Support reduced motion. Visual luxury is enhancement, not dependency.

> Motion explains state and continuity. It does not exist to show off.

## 6. Adaptive App Shell & Navigation

Do not simply shrink desktop UI into mobile. Use distinct compositions:

- **Expanded:** adaptive collapsible sidebar, command/search surface, multi-column workspace, contextual panels, and richer analytics.
- **Medium:** navigation rail or reduced shell, selective split-view, and intentional tablet composition.
- **Compact:** ergonomic bottom navigation, compact Focus Layer, contextual bottom/action sheets, thumb-friendly interaction, progressive disclosure, and intentional horizontal snap.

Navigation must remain predictable; intelligence must never randomly reorder primary navigation. Permission always overrides convenience.

## 7. Universal Command Layer

Desktop may expose a Ctrl/Cmd+K command/search interaction. Mobile should use a Command Sheet or other mobile-native surface. Permitted capabilities may include finding santri, navigating to a page, triggering permitted actions, finding a program, and opening relevant data. Search and actions must respect role permissions. This accelerates normal navigation; it does not replace it.

## 8. Adaptive Focus Hero

The dashboard has one primary story at a time. The Experience Priority Engine takes Role, Time/context, Current data, Program state, and Attention signals, and outputs Focus Hero, Primary Action, Priority Bento contents, and Narrative Insight.

V1 uses deterministic rules, not generative AI, and has no opaque AI risk score. For Ustadz, examples are: before activity, “Time to begin today’s setoran”; during activity, “18/28 santri have completed setoran”; after completion, “Today’s setoran is complete.” One hero equals one primary priority; there is no rotating multi-priority carousel.

## 9. Experience Priority Engine

Priority signals may include URGENCY, RELEVANCE, TIME, EXCEPTION, PROGRESS, and FREQUENCY. Rules must be deterministic, explainable, testable, and permission-aware.

For example, when role is Ustadz, a setoran session is active, and santri remain, Setoran becomes the Focus Hero priority. When Program Pantauan Liburan is enabled and relevant, its module may rise in Priority Bento without randomly restructuring the dashboard.

## 10. Priority Bento

Use stable spatial slots with adaptive content; avoid random rearrangement that destroys spatial memory. Desktop may use compact multi-column composition. Mobile must not turn every desktop bento card into a long vertical stack. Compact strategies include one attention card, horizontal metric snap, compact narrative insight, expandable detail, and progressive disclosure. The excessive mobile hero/bento height problem must be prevented by system rules, not isolated CSS patches.

## 11. Information Hierarchy

Use **Focus → Action → Insight → Detail** across dashboards, santri detail, forms, reports, and role experiences. Do not expose all possible information at once.

## 12. Role Experience Architecture

Use one shared design system with role-specific information architecture:

- **Admin — Institutional Command Center:** system health, institutional monitoring, program state, configuration, data completeness, activity distribution, and attention signals. Relatively high desktop density; powerful and professional, not overwhelming.
- **Ustadz — Teaching Command Center:** what needs action now, setoran, muroja'ah, attention-needed santri, quick input, and class progress. Focused, fast, and calm during evaluation.
- **Wali — Parent Progress Companion:** answer “Bagaimana perkembangan anak saya?” with warm language, human-readable insights, child progress, consistency, holiday monitoring, and simple summaries; avoid technical analytics language.
- **Santri — Personal Qur'an Journey:** answer “Di mana posisi saya dan apa langkah berikutnya?” with progress, next target, milestone, consistency, and reflective motivation; avoid addictive gamification.

> Celebrate progress, not addiction.

## 13. Shared Components and Role Composition

Conceptual layering is **RDS Primitives → Shared Experience Components → Role Composition**. Shared concepts include FocusHero, PriorityBento, NarrativeInsight, CommandLayer, ProgressJourney, and AttentionCard. Avoid four unrelated applications; role differences primarily belong in composition, adapters/view models, priority rules, copy, and allowed actions.

## 14. Narrative Data Experience

Numbers should communicate what happened, what pattern exists, why it matters, and what action is available next. Compact/mobile experiences should often be narrative-first, chart-second. Example: “Muroja'ah semakin konsisten.” followed by 72% active and +9% from the previous period. Do not use charts merely because data exists.

## 15. Assessment Architecture for Ustadz

This is a **CRITICAL** design constraint: Ustadz workflows must be effortless to access but objective and deliberate during assessment.

> Effortless on navigation, deliberate on assessment.  
> The system accelerates the workflow, not the judgment.

Academic assessment is criterion-referenced: the same academic standards apply consistently. Potential dimensions include fluency, accuracy, and tajwid/makhraj. The official rubric and weighting must be defined separately from visual design before automated scoring. Existing predicates include Mengulang, Kurang, Baik, and Sangat Baik. Any later predicate must be explainable, derived from an approved rubric, and never silently determine the final result; final academic judgment remains with Ustadz.

Personal progress insight is individual-referenced and may show improvement, consistency, decline, and trends. Historical performance must not silently influence today’s academic grade unless an explicit academic specification requires it.

> Different abilities deserve contextual understanding, not different academic standards.

## 16. Ustadz Flagship Workflow

The first Revolutionary vertical slice is the Ustadz experience. Target access is Dashboard → begin Setoran in approximately two interactions or fewer. This measures navigation friction, not assessment speed.

Flow: Dashboard → Start/Continue Setoran → Select/current santri → Evaluation Context → Assessment → Save → Confirmation → Continue to next santri. After save, do not unnecessarily return to the dashboard. Desktop may keep the santri list visible beside the workspace. Mobile uses a focused, touch-friendly workflow with a deliberate assessment moment and fast continuation.

> Fast to reach. Calm to judge. Fast to continue.

## 17. Persistence & Save Feedback

Never show successful persistence before the write is confirmed. UI states are idle, editing, validating, saving, success, and error/retry. On failure, retain entered data, explain the failure near the action, and provide retry; never clear the form. Draft/local recovery may protect input, but a draft must never be represented as successfully stored Firestore data.

## 18. Pantauan Liburan

Pantauan Liburan is conditional. When Admin disables it, Wali must not receive a dead module; remove or demote it appropriately. When enabled, Wali receives the relevant monitoring experience. Intended monitoring includes Al-Waqi'ah, Al-Mulk, Al-Insyirah, and shalat status. Known statuses are Jama'ah, Berhalangan, and Sakit. Admin retains configuration/monitoring context.

## 19. Meaningful Celebration

Use a hierarchy: Level 1 micro action (save/check/toast); Level 2 completed task (summary); Level 3 progress achievement (restrained acknowledgement); Level 4 meaningful milestone (richer but calm celebration). Routine entry must not receive large celebration. Milestones may use subtle ambient illumination, progress completion, and reflective copy; avoid excessive confetti and addictive reward loops.

## 20. Theme System

Support Light, Dark, and System. Dark mode must not simply invert colors. Light should be warm, airy, and natural; Dark should use deep green/charcoal, restrained green illumination, and strong readability. A future Qur'an Reading Surface is optional. Accessibility overrides decoration.

## 21. Responsive Composition

- **Compact:** smartphone-oriented, single-column focus, bottom navigation, progressive disclosure, thumb-first interaction.
- **Medium:** tablet/landscape/narrow workspace, navigation rail, and useful split-view where appropriate.
- **Expanded:** desktop collapsible sidebar, multi-column layout, richer analytics, tables, and bulk operations.

The same feature may use different compositions. Do not merely scale dimensions.

## 22. Responsive Guardrails

The first mobile viewport must expose meaningful value and the primary action. Keep hero compact; prevent endless bento stacking; design tablet intentionally; avoid accidental horizontal page scrolling; allow horizontal scrolling only for intentional snap cards or purpose-built wide tables; do not treat landscape mobile as “desktop mini”; and support long real-world names and data.

Representative widths: approximately 320–360, 390–430, 768, 1024, 1280–1440, and 1600+. Exact breakpoints may follow existing project conventions discovered during implementation.

## 23. Loading, Empty, Error, Offline

Use structural skeletons when structure is known. Empty states explain what is happening, whether it is good/neutral/problematic, and what the user can do; support positive zero states such as “Tidak ada santri yang membutuhkan perhatian.” Differentiate field, action, section, page, and critical/session errors; a failed chart must not destroy the dashboard. V1 does not require full offline-first architecture, but must preserve input, show connectivity where necessary, allow retry, and communicate reconnection.

## 24. Accessibility

Accessibility is a product requirement targeting relevant WCAG 2.2 AA principles: keyboard navigation, visible focus, semantic headings, form labels, useful error association, screen-reader semantics, sufficient touch targets, reduced motion, sufficient contrast, non-color-only status, and readable Arabic/Qur'anic content.

## 25. Performance

Avoid unjustified large animation libraries; lazy-load heavy features where appropriate; use blur selectively; prefer transform/opacity; avoid unnecessary Firestore reads caused by rerendering; avoid expensive charts outside relevant context; optimize assets; prevent layout shift; and keep mid-range phones usable.

> Premium where possible. Reliable everywhere.

## 26. Experience Priority Explainability

If the UI says “3 santri perlu perhatian,” the user must understand why. Approved rule-based signals may include no ziyadah for a defined period, declining muroja'ah consistency, or repeated recent academic outcomes. Exact thresholds belong to domain/business rules. Do not invent unexplained AI risk classifications.

## 27. Security and Permission

UI visibility is not authorization. Role-based hiding improves UX, but protected actions and data must also be enforced by application/domain/Firebase authorization rules. The Universal Command Layer must never expose forbidden actions.

## 28. Quality Architecture

Release priority is: 1) Data Integrity, 2) Functional Correctness, 3) Role/Security Correctness, 4) Accessibility, 5) Performance, 6) Responsive Quality, 7) Visual Quality, 8) Regression Safety. Beautiful but incorrect is a failed release.

## 29. Testing Strategy

Future implementation plans should use TDD where appropriate. Testing layers:

- **Unit:** priority rules; approved assessment calculations; narrative transformation; role/action filtering; domain utilities.
- **Component:** Focus Hero states, Priority Bento, Attention Card, forms, loading/error states, and theme behavior.
- **Integration:** Ustadz Dashboard → Continue Setoran → assess santri → save → confirm → next santri.
- **End-to-End:** login/session, Ustadz setoran, muroja'ah, search, Pantauan Liburan, and role boundaries.
- **Visual regression:** representative responsive widths and Light/Dark themes.

Use realistic long names, zero/100% values, missing/partial data, many santri, long notes, and Arabic content. Test Firestore write failure, offline, expired session, permission denied, missing documents, malformed data, and slow operations.

## 30. Migration / Vertical Slice Order

Recommended delivery order:

1. RDS Foundations
2. Adaptive App Shell
3. Ustadz Revolutionary Dashboard + flagship Setoran flow
4. Validate desktop/mobile/tablet behavior
5. Extract/refine shared experience patterns
6. Shared Intelligence / Priority Engine
7. Admin Revolutionary Experience
8. Wali Revolutionary Experience
9. Santri Revolutionary Experience
10. Secondary pages
11. Legacy retirement
12. Final Revolutionary Release Gate

The first implementation target is the **Ustadz Revolutionary Vertical Slice**, because it exercises Action First, Adaptive Focus Hero, Priority Bento, assessment integrity, quick workflows, attention signals, Narrative Data, mobile input, and desktop workspace.

## 31. Migration Gate

A new experience may replace its legacy counterpart only after functional parity where required, data integrity, role/permission checks, responsive validation, accessibility checks, performance checks, critical-flow tests, and visual verification. Do not delete legacy implementation prematurely.

## 32. Revolutionary Release Gate

Each vertical slice should pass R1 Functional, R2 Data, R3 Role / Security, R4 Responsive, R5 Accessibility, R6 Performance, R7 Visual, and R8 Regression. A slice is not Revolutionary Ready if only visual criteria pass.

## 33. Current Repository Context

The following facts were verified from the repository at document creation time:

- Branch: `claude-9router-test`.
- Latest known commit: `23bc5668 feat: improve Setor icon swap motion`.
- Package identity: `pesmad-smart-tahfidz`.
- Verified stack from `package.json`: React 19 with React DOM, TypeScript 5.8, Vite 6, Firebase 12, Recharts 3, Motion 12, Lucide React, Tailwind CSS 4 with the Vite plugin, `html2canvas`, `jspdf`, and `@google/genai`.
- Available package scripts include `dev` (`vite --port=3000 --host=0.0.0.0`), `build`, `preview`, `clean`, and `lint` (`tsc --noEmit`).
- Relevant source areas include `src/App.tsx`, `src/app-shell.css`, `src/dashboard-experience.css`, `src/components/BottomNav.tsx`, `src/components/DesktopPrimaryNav.tsx`, `src/components/Navbar.tsx`, `src/components/SantriDashboard.tsx`, `src/components/SetoranFormNav.tsx`, `src/components/UstadzDashboard.tsx`, `src/components/WaliDashboard.tsx`, `src/hooks/useActiveTabNavigation.ts`, `src/services/firebase.ts`, `src/services/storageService.ts`, `src/design-system/`, `src/types/`, and `src/utils/`.

No additional architecture is asserted here beyond these verified names and package metadata.

## 34. Explicit Non-Goals for the First Implementation Phase

Do not automatically include rewriting Firebase architecture; changing Firestore schemas without explicit migration design; redesigning every page simultaneously; adding an LLM chatbot; predictive academic judgments; automated academic grading without an approved rubric; full offline-first synchronization; deleting all legacy UI; replacing existing brand colors; introducing gamified points/streak addiction mechanics; or large-scale unrelated refactoring. Use YAGNI.

## 35. Core Design Principles to Preserve

> Revolutionary experience, evolutionary migration.

> Focus → Action → Insight → Detail.

> The system accelerates the workflow, not the judgment.

> Different abilities deserve contextual understanding, not different academic standards.

> Celebrate progress, not addiction.

> Visual luxury is enhancement, not dependency.

> Premium where possible. Reliable everywhere.

> Smart Tahfidz does not try to look intelligent. It reduces the number of small decisions users must make.

## Isolated Sandbox / Live Preview Strategy

This design project is intended for later implementation in a dedicated isolated Git worktree/sandbox so a live preview can be inspected without disturbing the current dirty working tree. No isolated worktree or sandbox location is asserted here because none was verified during this documentation-only task. No implementation changes, merge, or cleanup are authorized now.

After human review and approval of this specification, its commit, and the implementation plan, future implementation should follow the Superpowers worktree workflow in a dedicated worktree. The exact branch and path must be chosen only after inspecting actual Git state.

Future implementation must use the existing development command in `package.json`, run the local server from the isolated worktree, expose it through the supported sandbox/browser preview capability, and verify that the edited and tested files load without build/runtime errors. Do not create a fake demo project or replace the existing build system.

Meaningful preview checkpoints should cover: (1) RDS Foundations—tokens, typography, surfaces, themes, and controls; (2) Adaptive App Shell—desktop sidebar, medium navigation, mobile bottom navigation, and command shell; (3) Ustadz Revolutionary Dashboard—Focus Hero, Priority Bento, Narrative Insight, and responsive composition; (4) Ustadz Setoran flagship flow—Evaluation Context, deliberate assessment, save/error/success, desktop workspace, and mobile workflow; (5) Admin, Wali, and Santri role expansion; and (6) final responsive/theme validation across Compact, Medium, Expanded, Light, and Dark.

Preview does not replace tests. Every checkpoint must still respect TDD where specified, data integrity, role permissions, responsive behavior, accessibility, performance, and regression testing. The live preview is a human visual validation layer, not the source of truth for correctness.

Use the cadence: **Build → Test → Run → Preview → Human Review → Continue**, with meaningful vertical-slice checkpoints rather than approval after every tiny component.

## Self-Review Record

This document was self-reviewed for coverage of the approved architecture, consistency between requirements, explicit Ustadz assessment integrity, distinct mobile composition, preservation of Smart Tahfidz identity, Progressive Reconstruction boundaries, separation of verified repository facts from design intent, absence of generative-AI dependency, and documentation-only scope. No existing source file was modified.
