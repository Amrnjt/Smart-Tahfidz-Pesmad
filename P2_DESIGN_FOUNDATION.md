# P2.0 — Pesmad Design Foundation

P2.0 is the visual and interaction contract for the P2 redesign of Smart Tahfidz Pesmad.

## Direction

The product should feel calm, contemporary, trustworthy, and distinctly Pesmad — not like a generic SaaS dashboard.

Reference roles:

- INA Digital Design System: usability, accessibility, public-service clarity.
- Art Design Pro: dashboard hierarchy, density, professional application structure.
- Morphin Registry: motion language and state transitions; concepts only unless licensing is explicitly compatible.
- Navbar Gallery / Supaste: compact navigation hierarchy and restrained chrome.
- CTA.gallery: clear action hierarchy and concise CTA copy.
- Landing Love / Saaspo: composition, whitespace, typography, and contemporary product presentation.
- Hugeicons: icon consistency inspiration. The app continues to use Lucide unless a future licensed migration is explicitly approved.

## Core principles

1. **Data before decoration.** Visual treatment may improve hierarchy, but must never imply data or state that does not exist.
2. **One visual system.** Surfaces, controls, states, motion, and icon geometry must use semantic primitives instead of per-screen improvisation.
3. **Motion communicates.** Animate navigation, state change, success/error, expansion, and hierarchy. Avoid permanent decorative animation.
4. **Mid-range first.** Target smooth use on modern Android mid-range devices. Prefer transform/opacity; avoid broad backdrop blur, large continuous filters, shaders, and particle canvases in core workflows.
5. **Touch is primary.** Interactive targets remain at least 44px with clear pressed/focus states.
6. **Accessibility survives the redesign.** Focus visibility, reduced motion, semantic state labels, safe-area handling, and text contrast are non-negotiable.

## Semantic layers

### Surfaces

- `canvas`: page background.
- `surface`: standard content container.
- `surface-soft`: grouped secondary content.
- `surface-raised`: cards that need stronger hierarchy.
- `surface-interactive`: clickable cards and navigation targets.
- `surface-inverse`: dark Pesmad brand areas.

Avoid glassmorphism as the default container style. Translucency is an accent, not the layout system.

### Action hierarchy

- `primary`: one dominant action in a task region.
- `secondary`: normal alternate action.
- `quiet`: low-emphasis navigation or utility action.
- `danger`: destructive action only.
- `icon`: compact 44px icon-only control with accessible label.

### Radius

Use a restrained hierarchy:

- controls: medium radius;
- cards: larger radius;
- major panels / sheets: largest radius;
- pills only for status, chips, and compact segmented navigation.

### Motion

- micro feedback: ~140ms;
- normal state change: ~220ms;
- enter/expand: ~360ms;
- major page transition: ~480ms maximum.

Spring-like easing is allowed for navigation and controlled expansion. Respect `prefers-reduced-motion` globally.

### Icons

Keep one icon family per interface surface. P2 uses Lucide as the implementation baseline while taking consistency cues from premium icon libraries.

Recommended optical sizes:

- 16px: dense metadata/action rows;
- 18px: standard controls;
- 20px: primary navigation;
- 24px+: feature illustration only.

Do not mix solid, duotone, sharp, and rounded icon styles in one navigation system.

## Performance gate

P2 components should prefer:

- CSS transforms and opacity for animation;
- static gradients over animated backgrounds;
- locally scoped shadows;
- no always-on WebGL/shader effects in authenticated application views;
- no large-area continuous `backdrop-filter` on scrolling containers;
- no decorative animation that runs indefinitely when the user is idle.

Any visually expensive component must have a simpler fallback and reduced-motion behavior.

## Migration strategy

P2.0 adds compatible primitives. Existing screens keep working. P2.1+ migrates screens progressively so each PR can be validated and rolled back independently.
