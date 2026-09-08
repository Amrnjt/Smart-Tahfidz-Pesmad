# Smart Tahfidz Pesmad — Final Design Contract v2

## Product Character

**Pesmad Institutional Modern**: tenang, matang, terpercaya, operasional, Qur'ani secara subtil, mobile-first, dan tidak terasa seperti template SaaS, government UI mentah, atau AI-generated interface.

Visual strength harus datang dari hierarchy, typography, composition, whitespace, semantic color, rhythm, state design, data presentation, dan interaction quality — bukan dari dekorasi tanpa tujuan.

Pesmad tidak wajib minimalis. Pesmad boleh tampil kaya, ekspresif, premium, dan memorable selama setiap keputusan visual atau interaksi punya alasan produk yang jelas dan tidak mengganggu tugas utama.

## Quality Priority

Urutan prioritas kualitas final adalah:

1. Data truth
2. Task clarity
3. Accessibility
4. Responsive behavior
5. Visual taste
6. Motion and interaction quality
7. Measured performance
8. Maintainability

Jika dua tujuan saling bertentangan, urutan di atas menjadi dasar keputusan.

## Guardrails

Final polish tidak boleh merusak:

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

Business logic, Firebase schema/auth/storage contract, data semantics, dan permission model bukan wilayah redesign kecuali diaudit secara khusus dan disetujui sebagai perubahan fungsi.

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
- Pembelajaran / Kelas Istimewa = Amber

Category color identifies the activity; it must not be confused with system status.

### Status

- Success = Emerald
- Warning / attention = Amber
- Error / destructive = Rose
- Info = Sky/Blue only when useful
- Neutral = Slate

Status must always have wording and/or an icon. Color alone is never sufficient.

## Typography Contract

Use the system sans-serif stack by default. A font dependency may be introduced only when it materially strengthens identity/readability and has a measured product reason.

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

`rounded-2xl` / `rounded-3xl` is not a default surface style. Larger radii are allowed only when they materially strengthen composition or interaction.

## Elevation Contract

Border + surface is the default.

Shadow is reserved for real elevation:

- modal/dialog
- menu/popover
- floating navigation
- FAB
- elevated selected surface

Layered depth is allowed when it clearly explains hierarchy or spatial relationship. Avoid glow or shadow-as-decoration.

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

Pesmad uses an emerald focus ring with visible offset. Dialog focus trapping / return focus remains governed by the established accessibility foundation.

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

Avoid:

- nested cards without a semantic reason
- equal-weight metric cards
- card-per-field layouts
- colored card collections where color has no meaning

Rich visual composition is allowed when it improves first-read, brand recognition, status comprehension, or task flow.

## Forms

Similar setoran forms must share the same architecture and action hierarchy.

- visible labels
- helper text only when useful
- inline actionable validation
- group related fields
- `Simpan` is primary CTA
- Reset is tertiary
- steps/progressive disclosure only when they reduce cognitive load

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

- loading
- empty
- no filter result
- error
- disabled
- success
- warning/attention
- offline / partial sync where relevant

Wording must be specific to the workflow. Example: `Belum ada setoran bulan ini` is preferable to `Tidak ada data`.

Error copy should explain:

1. what failed
2. what remains safe when relevant
3. what the user can do next

## Responsive Contract

Reference viewport classes for final QA:

- 360px mobile
- 375px mobile
- 390px mobile
- 768px tablet
- 1024px compact desktop
- 1280px standard desktop
- 1440px wide desktop

Responsive design means **recomposition, not shrinkage**.

Rules:

- mobile and desktop may use different composition when the task benefits from it
- tablet is a first-class layout state, not an accidental midpoint
- BottomNav, safe-area, sticky/floating controls, modals, tables, charts, and forms must be intentionally checked at their relevant breakpoints
- horizontal scrolling is acceptable only when the content model genuinely requires it
- operational controls must not be clipped by viewport edges, browser chrome, or safe-area
- chart legends, filters, and summaries may stack/reorder on smaller viewports instead of shrinking typography

## Motion Contract

Motion supports feedback, hierarchy, and spatial understanding.

Allowed when useful:

- transform/opacity transitions
- staged reveal
- spring motion
- shared/spatial transitions
- contextual microinteraction
- richer motion libraries when they materially improve the product

Rules:

- no continuous decorative motion
- no bounce/confetti for routine success
- motion must not delay primary task completion
- motion must respect `prefers-reduced-motion`
- motion complexity must be justified by product value, not novelty

## Performance Contract

The final target is **performance-proportionate, measured, and maintainable** — not "smallest possible bundle".

A richer interaction, visualization, motion library, font, or component dependency may be added when:

1. the user-facing value is material
2. baseline and final performance are measured
3. the cost is proportional to the benefit
4. mobile runtime remains acceptable
5. loading behavior is intentional
6. the change remains maintainable

Measure before optimizing. Prefer code splitting, lazy loading, route/component-level dynamic import, and deferred loading for heavy features that are not required for first interaction.

Large bundle size is not automatically a blocker, but unexplained growth is.

Do not suppress build warnings merely to make validation green; understand or document them first.

## Taste Contract

Before finalizing any major visual or interaction decision, ask:

1. Does this improve hierarchy, comprehension, feedback, action, or brand?
2. Does this feel specific to Pesmad rather than a generic SaaS/dashboard template?
3. Does it remain calm and mature even when visually expressive?
4. Is the detail intentional at mobile, tablet, and desktop sizes?
5. Would removing it make the product less understandable, less memorable, or less usable?

If the answer is no, simplify or remove it.

Pesmad may be visually distinctive. Distinctiveness should come from composition, type hierarchy, data storytelling, motion, rhythm, Qur'anic/educational cues, and disciplined brand use — not random decoration.

## Anti-Slop Gate

Before adding a card, badge, gradient, icon, animation, shadow, decorative surface, or helper copy, ask:

> Does this improve hierarchy, status, comprehension, brand, or action?

If not, omit or simplify it.

Anti-slop is not equivalent to flat minimalism. Expressive UI is allowed when it earns its place.

## Final Finish Gate

A screen is not complete until it passes:

- first-read is obvious
- primary task is faster or clearer
- displayed data remains factual
- semantic colors are consistent
- text remains readable at mobile density
- mobile, tablet, and desktop composition are intentional
- state coverage is adequate
- keyboard/focus remains usable
- status is not color-only
- touch targets are adequate
- no unnecessary decorative UI was introduced
- motion, if present, has a product purpose
- visual character feels specific to Pesmad
- performance impact has been measured when material
- implementation remains maintainable

## P2.18 Final Gate Order

P2.18 must validate in this order:

1. data/business regression
2. navigation/role regression
3. accessibility regression
4. responsive integrity
5. state truth and feedback
6. semantic color/category consistency
7. anti-slop/taste consistency
8. bundle/chunk/performance review
9. build/type/static checks
10. readiness for actual browser/device Final Polish

Passing static/build checks does not equal passing browser/device visual QA. Final visual inspection remains a separate explicit phase.
