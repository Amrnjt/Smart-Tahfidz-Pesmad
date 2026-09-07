# Anti-Slop Audit, Stage 2

Date: 2026-09-07
Scope: source-code and UI-pattern audit of the Smart Tahfidz Pesmad React application.

## Executive Summary

The application already has a strong product identity and substantial role-specific functionality. The main Anti-Slop risks are not missing visual polish, but repeated visual conventions and excessive decoration in some areas. The highest-value work is to make dense information more compact on mobile, reduce repeated rounded-card treatment, and ensure motion is purposeful.

## Findings

### 1. Decorative motion

Status: Fixed in this stage.

The global stylesheet previously included continuously animated hero gradients and floating decorative elements. These effects can make a serious information-management application feel more decorative than necessary and consume attention without communicating application state.

Action taken:

- Removed the infinite hero background animation.
- Kept entry transitions for hierarchy.
- Disabled continuous floating decoration by default.
- Preserved reduced-motion support.

## 2. HistoryTable mobile density

Priority: High.

`HistoryTable.tsx` is one of the largest and most interaction-dense components. The header combines title, report actions, search, category filter, score filter, date mode, and additional date controls. On narrow screens, this creates a high risk of a long vertical control stack and competing visual priorities.

Recommended implementation:

- Keep the primary search visible.
- Move secondary filters into a compact collapsible filter area on mobile.
- Keep the current filter state visible through a small summary or active-filter count.
- Make export actions secondary to browsing and filtering.
- Continue using responsive row expansion instead of forcing every data field into the default row.

## 3. Repeated rounded-card pattern

Priority: Medium.

Multiple large components use `rounded-3xl` containers with similar white backgrounds, borders, and shadows. This is not automatically wrong, but repeated use can flatten hierarchy and create a generic dashboard appearance.

Affected areas observed include forms, management pages, dashboards, modals, and loading states.

Recommended implementation:

- Reserve large radii for primary surfaces and major dialogs.
- Use smaller radii for nested controls and dense data sections.
- Let hierarchy come from spacing and structure rather than giving every section the same card treatment.

## 4. Emoji used inside status UI

Priority: Medium.

`HistoryTable.tsx` includes emoji circles inside score badges while the application already uses a dedicated icon library. Emoji rendering varies by device and can produce inconsistent alignment.

Recommended implementation:

- Replace decorative emoji in status badges with Lucide icons or text-only badges where the color and label already communicate status.
- Never rely on color alone; keep the textual score label.

## 5. Mobile control widths

Priority: High.

The HistoryTable header contains several minimum widths and inline controls. These can be appropriate on larger screens but should be checked at common phone widths with long Indonesian labels and real user data.

Recommended implementation:

- Audit at approximately 320px, 360px, 390px, and 430px widths.
- Prefer full-width controls on small screens when wrapping becomes ambiguous.
- Avoid fixed minimum widths when the control can safely use `w-full` or responsive width rules.

## 6. Dashboard hero treatments

Priority: Medium.

Role dashboards use large gradient hero banners. These can support role orientation, but the visual treatment should remain stable and informational rather than animated or heavily decorated.

Action taken in this stage:

- The global continuous gradient animation was removed while preserving the existing color treatment and entry hierarchy.

## 7. Large component concentration

Priority: Medium.

Several components contain a very large amount of UI and business logic, including HistoryTable, SantriManagement, and KelasManagement. This makes visual iteration harder and increases the risk of unrelated regressions.

Recommended implementation:

- Extract repeated presentational sections only when doing so reduces complexity.
- Avoid a broad rewrite solely for architectural aesthetics.
- Preserve data and business logic while incrementally extracting filters, mobile row views, status badges, and action controls.

## Prioritized Next Steps

1. Refactor the mobile filter experience in `HistoryTable.tsx`.
2. Replace emoji-based status badges with consistent icons or text badges.
3. Audit `KelasManagement.tsx` and `SantriManagement.tsx` for repeated card nesting and mobile density.
4. Standardize surface hierarchy across major pages without forcing a single card style everywhere.
5. Run a manual viewport audit using long names, empty states, loading states, and error states.

## Stage 2 Changes Applied

- Added project-specific Anti-Slop rules in `ANTISLOP.md` during Stage 1.
- Removed continuous decorative hero animation in `src/index.css`.
- Disabled continuous floating decoration by default.
- Preserved purposeful entry, feedback, and reduced-motion behavior.
- Recorded code-level audit findings and the next prioritized implementation work in this file.
