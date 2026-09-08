# Smart Tahfidz Pesmad — Design Contract

## Product Character

**Pesmad Institutional Modern**: tenang, matang, terpercaya, operasional, Qur'ani secara subtil, mobile-first, dan tidak terasa seperti template SaaS, government UI mentah, atau AI-generated interface.

Visual strength harus datang dari hierarchy, typography, composition, whitespace, semantic color, rhythm, border, subtle elevation, state design, dan data presentation — bukan dari dekorasi berlebih.

## Guardrails

P2 tidak boleh merusak:

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

These mappings are immutable across P2:

- Ziyadah = Emerald
- Muroja'ah = Teal
- Binnadzor = Indigo
- Pembelajaran = Amber

Category color identifies the activity; it must not be confused with system status.

### Status

- Success = Emerald
- Warning / attention = Amber
- Error / destructive = Rose
- Info = Sky/Blue only when useful
- Neutral = Slate

Status must always have wording and/or an icon. Color alone is never sufficient.

## Typography Contract

Use the system sans-serif stack. Do not add a font dependency in P2 unless there is a measured product reason.

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

P2 uses an emerald focus ring with visible offset. Dialog focus trapping / return focus remains governed by the P1 accessibility foundation.

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

## Motion Contract

Motion supports feedback and spatial understanding only.

- use transform/opacity
- short durations
- no continuous decorative motion
- respect `prefers-reduced-motion`
- no bounce/confetti for success

## Anti-Slop Gate

Before adding a card, badge, gradient, icon, animation, shadow, decorative surface, or helper copy, ask:

> Does this improve hierarchy, status, comprehension, brand, or action?

If not, omit or simplify it.

## Finish Gate for Every P2 Screen

A redesign is not complete until it passes:

- first-read is obvious
- primary task is faster or clearer
- displayed data remains factual
- semantic colors are consistent
- text remains readable at mobile density
- mobile and tablet composition are intentional
- state coverage is adequate
- keyboard/focus remains usable
- status is not color-only
- touch targets are adequate
- no unnecessary decorative UI was introduced
- implementation remains lightweight and maintainable
