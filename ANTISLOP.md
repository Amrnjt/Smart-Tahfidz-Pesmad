# Anti-Slop Rules for Smart Tahfidz Pesmad

This file adapts the Anti-Slop project principles to this application. It is a quality filter, not a visual style guide. Existing product identity, usability, accessibility, and functional requirements take priority.

## Core Principle

Build interfaces that feel intentionally designed for Smart Tahfidz Pesmad, not like generic AI-generated dashboards. Preserve useful existing patterns when they serve a clear purpose. Do not redesign merely for novelty.

## UI Rules

1. Avoid generic AI visual patterns used without a product reason: excessive rounded cards, decorative gradients/glows, fake terminal windows, arbitrary bento grids, excessive glassmorphism, decorative stripes, and repeated icon-card patterns.
2. Do not add visual decoration unless it improves hierarchy, comprehension, branding, or feedback.
3. Use the existing Pesmad visual identity consistently. Do not introduce a new color palette, typography system, or visual language without a clear product reason.
4. Avoid making every section look identical. Vary structure according to the information and task.
5. Do not use animation as decoration by default. Motion must communicate state, hierarchy, transition, or feedback, and must remain comfortable on mobile.
6. Do not use emoji as UI decoration where a meaningful icon, label, or no decoration would be clearer.
7. Prefer meaningful labels over generic calls to action such as "Get Started", "Learn More", "Explore", or "Discover".

## Mobile-First Rules

1. Mobile is a primary design target, not a later adaptation.
2. No horizontal page overflow at common phone widths.
3. Text must remain inside its container and wrap or truncate intentionally.
4. Tables, cards, forms, dialogs, charts, navigation, and action sheets must remain usable on narrow screens.
5. Interactive controls should provide comfortable touch targets, targeting at least 44px where practical.
6. Do not solve mobile problems by simply shrinking everything. Recompose dense interfaces when necessary.
7. Preserve important information while making dense data compact. Prefer progressive disclosure, stacked metadata, horizontal scrolling only when genuinely necessary, or responsive column reduction.
8. Test states with long names, long labels, empty data, loading data, and error messages.

## Copy Rules

1. UI copy must sound natural, specific to the application's context, and useful.
2. Avoid AI marketing buzzwords such as "revolutionary", "seamless", "next-generation", and "AI-powered" unless literally relevant.
3. Avoid exaggerated claims and fabricated metrics.
4. Avoid em dash characters (—) in UI copy. Use commas, periods, colons, or parentheses instead.

## Accessibility & Human Use

1. Maintain readable contrast for text and controls.
2. Focus states must remain visible for keyboard users.
3. Buttons and controls must have clear states: default, hover where applicable, focus, active, disabled, loading, success, and error when relevant.
4. Do not rely on color alone to communicate status.
5. Form labels and error messages must be understandable without visual guesswork.

## Code Quality

1. Do not add generic AI-generated comments that merely restate the code.
2. Keep comments only when they explain non-obvious decisions, constraints, or business rules.
3. Avoid unnecessary abstraction or new dependencies for small UI changes.
4. Preserve existing behavior and data contracts unless the requested change requires otherwise.
5. Do not alter authentication, Firebase rules, data structures, or business logic merely as part of visual cleanup.

## Change Discipline

Before completing UI work:

- Confirm the change solves a real user problem.
- Check desktop and mobile layouts.
- Check long and empty content states.
- Check interactive states and accessibility.
- Remove any decorative element that does not serve a purpose.
- Avoid broad unrelated refactors.

## Smart Tahfidz Pesmad Context

This application manages Qur'an memorization activities for a pesantren environment. Design decisions should prioritize clarity, speed, trust, and information density for santri, ustadz, wali, and administrators. The interface should feel calm, organized, and purposeful rather than promotional or decorative.
