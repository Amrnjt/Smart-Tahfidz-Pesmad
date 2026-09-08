# Smart Tahfidz Pesmad — Final Design Contract v2

## Product Character

**Pesmad Institutional Modern**: tenang, matang, terpercaya, operasional, Qur'ani secara subtil, mobile-first, dan tidak terasa seperti template SaaS, government UI mentah, atau AI-generated interface.

Visual strength harus datang dari hierarchy, typography, composition, whitespace, semantic color, rhythm, state design, data presentation, purposeful motion, dan brand-specific interaction — bukan dari dekorasi tanpa fungsi.

Final design tidak harus minimalis dan tidak harus selalu ringan. Kompleksitas visual maupun teknis diperbolehkan ketika memberi peningkatan nyata pada task clarity, comprehension, brand, feedback, atau delight, serta tetap terukur, proporsional, dan maintainable.

## Final Quality Priority

Urutan prioritas ketika terjadi trade-off:

1. Data truth
2. Task clarity
3. Accessibility
4. Responsive behavior
5. Visual taste
6. Purposeful motion
7. Performance measurement
8. Maintainability

Tidak ada polish visual yang boleh mengalahkan data truth, alur kerja, atau aksesibilitas.

## Guardrails

Final P2 tidak boleh merusak:

- Data Truth P0
- Firestore reliability P0
- WIB date logic P0
- explicit Pantauan Liburan state P0
- Navigation Architecture P1
- feedback semantics P1
- overlay/focus/accessibility foundation P1
- role-based permissions
- core setoran logic
- PDF functionality
- Mushaf data/API logic
- BottomNav mental model
- SetorActionSheet workflow
- brand Pesmad

## Color Contract

### Foundation

Most interface surfaces are neutral:

- page: off-white / slate-50
- primary surface: white
- secondary surface: slate-50
- muted surface: slate-100
- primary content: slate-900
- secondary content: slate-600
- metadata: slate-500
- border: slate-200 / slate-300

### Brand

Emerald is the dominant brand family. Teal supports the Pesmad identity but does not compete with emerald for primary action.

Use brand color for:

- primary action
- active navigation
- selected state
- important product identity

Do not color every card or section with brand color.

### Tahfidz Categories

These mappings are immutable:

- Ziyadah = Emerald
- Muroja'ah = Teal
- Binnadzor = Indigo
- Pembelajaran = Amber
- Kelas Istimewa = Amber as part of Pembelajaran semantics

Category color identifies the activity; it must not be confused with system status.

### Status

- Success = Emerald
- Warning / attention = Amber
- Error / destructive = Rose
- Info = Sky/Blue only when useful
- Neutral = Slate

Status must always have wording and/or an icon. Color alone is never sufficient.

## Typography Contract

Use the system sans-serif stack by default. A font dependency may only be introduced when there is a measured product/brand reason and the loading cost is understood.

### Mobile

- metadata: 12px / 16px
- secondary: 13px / 18px
- body: 14px / 20px
- section title: 16px / 24px
- page title: 22px / 28px

### Desktop

- metadata: 12px / 16px
- secondary: 14px / 20px
- body: 15px / 22px
- section title: 18px / 26px
- page title: 26px / 32px

Rules:

- 9px text is not acceptable for operational information.
- 10px is reserved for rare microcopy only.
- Do not shrink text to make a layout fit; recompose the layout instead.
- Font weight supports hierarchy; it is not decoration.
- Page title describes the task/page, not generic branding.

## Spacing Contract

Primary rhythm:

- 4px
- 8px
- 12px
- 16px
- 24px
- 32px
- 40px
- 48px

Use arbitrary values only when required by a real technical constraint such as safe-area, viewport math, chart geometry, or pixel-perfect control dimensions.

Default mobile page padding should trend toward 16px. Desktop operational pages should trend toward 24–32px where density permits.

## Radius Contract

- small controls / compact elements: 8px
- normal inputs / buttons: 10px
- normal surfaces: 12px
- major panel / dialog: 16px

`rounded-2xl` / `rounded-3xl` is not a default surface style. Keep larger radii only when the composition truly benefits from them.

## Elevation Contract

Border + surface is the default.

Shadow is reserved for real elevation:

- modal/dialog
- menu/popover
- floating navigation
- FAB
- elevated selected surface
- a purposeful visual focal layer

Avoid layered shadows, glow, and shadow-as-decoration.

## Control Contract

Important interactive controls should target approximately 44px minimum touch height/size.

Controls need clear states:

- default
- hover where relevant
- focus-visible
- active
- disabled
- loading when asynchronous

Primary action must be visually obvious. Destructive action must not visually compete with primary workflow actions.

## Focus Contract

Keyboard focus must be clearly visible. Do not remove the browser outline unless replaced with an equal or stronger focus treatment.

Use an emerald focus ring with visible offset when compatible with the surface. Dialog focus trapping / return focus remains governed by the accessibility foundation.

## Surface & Hierarchy Contract

Default hierarchy:

1. page context / title
2. primary operational information
3. attention / exception state
4. primary action
5. supporting summary
6. secondary metadata

Prefer:

- one strong primary panel plus supporting structures
- list/table for operational density
- whitespace and dividers for grouping
- deliberate visual focal points

Avoid:

- nested cards without a semantic reason
- equal-weight metric cards
- card-per-field layouts
- colored card collections where color has no meaning
- generic dashboard composition copied from SaaS templates

## Forms

Similar setoran forms must share the same architecture and action hierarchy.

- visible labels
- programmatic labels
- helper text only when useful
- inline actionable validation
- group related fields
- `Simpan` is primary CTA
- Reset is tertiary
- steps/progressive disclosure only when they reduce cognitive load
- async save state must be explicit

## Tables & Operational Lists

Structure:

1. page context
2. search/filter
3. bulk action when relevant
4. data
5. pagination/state
6. consistent row actions

Mobile may use a compact row/list hybrid; desktop may use a table or operational grid. They do not need identical composition.

## State Contract

All major data surfaces must account for:

- loading only when real loading exists
- empty
- no filter result
- error
- disabled
- success
- warning/attention
- offline / partial sync where relevant
- syncing / cloud verification where relevant

Wording must be specific to the workflow. Example: `Belum ada setoran bulan ini` is preferable to `Tidak ada data`.

Error copy should explain:

1. what failed
2. what remains safe when relevant
3. what the user can do next

Never fabricate relative time, loading, cloud health, progress, or placeholder metrics.

## Responsive Contract

Responsive behavior is a composition decision, not a shrinking exercise.

Reference viewports for final QA:

- 360px mobile
- 375px mobile
- 390px mobile
- 768px tablet
- 1024px desktop
- 1280px desktop
- 1440px desktop

Rules:

- recompose when density or hierarchy requires it; do not merely scale down desktop UI
- BottomNav and safe-area padding must never obscure actionable content
- modal, sheet, chart, table, form, and dashboard composition must be intentional at each viewport class
- horizontal scroll is allowed only for content that genuinely requires it, never as a default escape hatch
- touch targets remain usable at narrow widths
- mobile may hide/reorder secondary metadata, but never hide critical task/status information
- tablet should not be treated as a stretched phone or compressed desktop

## Motion Contract

Motion supports feedback, spatial understanding, emphasis, and product feel.

Allowed when purposeful:

- transform/opacity transitions
- spring motion
- staggered reveals
- shared or spatial transitions
- progressive chart/data reveals
- tasteful microinteraction

Rules:

- no continuous decorative motion
- no bounce/confetti for success unless a future product decision explicitly justifies it
- avoid motion that delays primary tasks
- respect `prefers-reduced-motion`
- any motion library must earn its bundle/runtime cost through real UX gain

## Performance Contract

The product does **not** optimize for the smallest possible bundle at the expense of quality.

The standard is **performance-proportionate, measured, and maintainable**.

Rules:

- measure before and after material technical/visual additions
- judge cost against UX/product gain
- rich charts, motion, interaction, and libraries are allowed when the application remains healthy
- prefer lazy loading / code splitting for expensive features that are not required for first interaction
- do not ship heavy dependencies to the initial route merely because implementation is convenient
- do not remove valuable capability solely to chase a smaller bundle number
- build warnings and large chunks are signals to investigate, not automatic failures
- performance decisions should consider initial JS, gzip size, loading behavior, runtime responsiveness, Core Web Vitals where measurable, and target-device experience

## Taste Gate

Before accepting a final UI decision, ask:

> Apakah ini terasa spesifik milik Pesmad?

If a composition could be pasted unchanged into a bank, CRM, inventory dashboard, generic school app, or AI template, it is still too generic.

Pesmad-specific taste should come from:

- calm institutional confidence
- Qur'anic learning context expressed subtly
- emerald/teal brand discipline
- meaningful category semantics
- operational language familiar to Ustadz, Wali, and Santri
- hierarchy built around real pesantren workflows

Taste is not ornamental complexity. It is product specificity.

## Anti-Slop Gate

Before adding a card, badge, gradient, icon, animation, shadow, decorative surface, helper copy, or library, ask:

> Does this improve hierarchy, status, comprehension, brand, task execution, or product-specific feel?

If not, omit or simplify it.

Anti-slop does not mean anti-richness. Purposeful richness is allowed; generic or unjustified richness is not.

## Final Finish Gate

A screen or system is not final until it passes:

- first-read is obvious
- primary task is faster or clearer
- displayed data remains factual
- semantic colors are consistent
- text remains readable at mobile density
- mobile, tablet, and desktop composition are intentional
- state coverage is truthful and adequate
- keyboard/focus remains usable
- status is not color-only
- touch targets are adequate
- dialogs/overlays respect focus, stacking, and safe-area contracts
- no unnecessary decorative UI was introduced
- visual decisions pass the Pesmad Taste Gate
- performance impact of material additions is measured
- expensive non-critical capability is code-split when practical and low-risk
- implementation remains maintainable
