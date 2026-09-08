from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Pattern not found in {path}: {old[:120]!r}')
    text = text.replace(old, new, count)
    p.write_text(text)

# 1. Self-host Plus Jakarta Sans Variable through Fontsource.
replace(
    'package.json',
    '  "dependencies": {\n    "@google/genai": "^2.4.0",',
    '  "dependencies": {\n    "@fontsource-variable/plus-jakarta-sans": "^5.3.0",\n    "@google/genai": "^2.4.0",'
)

replace(
    'src/main.tsx',
    "import App from './App.tsx';\nimport './index.css';",
    "import App from './App.tsx';\nimport '@fontsource-variable/plus-jakarta-sans/wght.css';\nimport './index.css';"
)

# 2. Strengthen the global typography contract without bloating component markup.
replace(
    'src/index.css',
    '  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n\n  --text-meta-size: 0.75rem;\n  --text-meta-line: 1rem;\n  --text-secondary-size: 0.8125rem;\n  --text-secondary-line: 1.125rem;\n  --text-body-size: 0.875rem;\n  --text-body-line: 1.25rem;\n  --text-section-size: 1rem;\n  --text-section-line: 1.5rem;\n  --text-page-size: 1.375rem;\n  --text-page-line: 1.75rem;',
    '  --font-sans: "Plus Jakarta Sans Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n  --font-display: "Plus Jakarta Sans Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;\n\n  --text-meta-size: 0.75rem;\n  --text-meta-line: 1.0625rem;\n  --text-secondary-size: 0.8125rem;\n  --text-secondary-line: 1.1875rem;\n  --text-body-size: 0.875rem;\n  --text-body-line: 1.3125rem;\n  --text-section-size: 1.0625rem;\n  --text-section-line: 1.5rem;\n  --text-page-size: 1.5rem;\n  --text-page-line: 1.875rem;'
)

replace(
    'src/index.css',
    '    --text-meta-size: 0.75rem;\n    --text-meta-line: 1rem;\n    --text-secondary-size: 0.875rem;\n    --text-secondary-line: 1.25rem;\n    --text-body-size: 0.9375rem;\n    --text-body-line: 1.375rem;\n    --text-section-size: 1.125rem;\n    --text-section-line: 1.625rem;\n    --text-page-size: 1.625rem;\n    --text-page-line: 2rem;',
    '    --text-meta-size: 0.75rem;\n    --text-meta-line: 1.0625rem;\n    --text-secondary-size: 0.875rem;\n    --text-secondary-line: 1.3125rem;\n    --text-body-size: 0.9375rem;\n    --text-body-line: 1.4375rem;\n    --text-section-size: 1.1875rem;\n    --text-section-line: 1.75rem;\n    --text-page-size: 1.875rem;\n    --text-page-line: 2.375rem;'
)

replace(
    'src/index.css',
    '  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;',
    '  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  font-kerning: normal;\n  font-synthesis: none;\n  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;'
)

replace(
    'src/index.css',
    '.ui-page-title {\n  color: var(--content-primary);\n  font-size: var(--text-page-size);\n  line-height: var(--text-page-line);\n  font-weight: 700;\n  letter-spacing: -0.02em;\n}\n\n.ui-section-title {\n  color: var(--content-primary);\n  font-size: var(--text-section-size);\n  line-height: var(--text-section-line);\n  font-weight: 700;\n  letter-spacing: -0.01em;\n}',
    '.ui-page-title {\n  color: var(--content-primary);\n  font-family: var(--font-display);\n  font-size: var(--text-page-size);\n  line-height: var(--text-page-line);\n  font-weight: 750;\n  letter-spacing: -0.032em;\n  text-wrap: balance;\n}\n\n.ui-section-title {\n  color: var(--content-primary);\n  font-family: var(--font-display);\n  font-size: var(--text-section-size);\n  line-height: var(--text-section-line);\n  font-weight: 700;\n  letter-spacing: -0.018em;\n  text-wrap: balance;\n}'
)

replace(
    'src/index.css',
    '.ui-body {\n  color: var(--content-primary);\n  font-size: var(--text-body-size);\n  line-height: var(--text-body-line);\n}\n\n.ui-secondary {\n  color: var(--content-secondary);\n  font-size: var(--text-secondary-size);\n  line-height: var(--text-secondary-line);\n}\n\n.ui-meta {\n  color: var(--content-tertiary);\n  font-size: var(--text-meta-size);\n  line-height: var(--text-meta-line);\n}',
    '.ui-body {\n  color: var(--content-primary);\n  font-size: var(--text-body-size);\n  line-height: var(--text-body-line);\n  letter-spacing: -0.004em;\n}\n\n.ui-secondary {\n  color: var(--content-secondary);\n  font-size: var(--text-secondary-size);\n  line-height: var(--text-secondary-line);\n  letter-spacing: -0.003em;\n}\n\n.ui-meta {\n  color: var(--content-tertiary);\n  font-size: var(--text-meta-size);\n  line-height: var(--text-meta-line);\n  font-weight: 500;\n  letter-spacing: 0.002em;\n}\n\n.ui-eyebrow {\n  font-size: var(--text-meta-size);\n  line-height: var(--text-meta-line);\n  font-weight: 700;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n\n.ui-display-title {\n  font-family: var(--font-display);\n  font-size: clamp(1.625rem, 1.3rem + 1vw, 2.25rem);\n  line-height: 1.14;\n  font-weight: 750;\n  letter-spacing: -0.038em;\n  text-wrap: balance;\n}\n\n.ui-number {\n  font-variant-numeric: tabular-nums lining-nums;\n  font-feature-settings: "tnum" 1, "lnum" 1;\n  letter-spacing: -0.035em;\n}'
)

# 3. Document the typeface decision and updated scale.
replace(
    'DESIGN_CONTRACT.md',
    'Use the system sans-serif stack by default. A font dependency may be introduced only when it materially strengthens identity/readability and has a measured product reason.',
    'Primary interface typeface: **Plus Jakarta Sans Variable**, self-hosted through the application bundle with system sans-serif fallbacks. It is the default UI and display family because it materially strengthens Pesmad\'s modern Indonesian institutional identity while preserving strong screen readability. Use one variable family rather than stacking decorative font families. New font dependencies still require a measured product reason.'
)
replace(
    'DESIGN_CONTRACT.md',
    '- metadata: 12px / 16px\n- secondary: 13px / 18px\n- body: 14px / 20px\n- section title: 16px / 24px\n- page title: 22px / 28px',
    '- metadata: 12px / 17px\n- secondary: 13px / 19px\n- body: 14px / 21px\n- section title: 17px / 24px\n- page title: 24px / 30px'
)
replace(
    'DESIGN_CONTRACT.md',
    '- metadata: 12px / 16px\n- secondary: 14px / 20px\n- body: 15px / 22px\n- section title: 18px / 26px\n- page title: 26px / 32px',
    '- metadata: 12px / 17px\n- secondary: 14px / 21px\n- body: 15px / 23px\n- section title: 19px / 28px\n- page title: 30px / 38px'
)

# 4. Apply the typography primitives to the Ustadz command-center where the visual gain is most visible.
path = Path('src/components/UstadzDashboard.tsx')
text = path.read_text()
replacements = [
    ('className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-200"', 'className="ui-eyebrow text-emerald-200"'),
    ('className="text-sm font-semibold text-emerald-300">Dashboard Ustadz', 'className="ui-eyebrow text-emerald-300">Dashboard Ustadz'),
    ('className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] lg:leading-tight"', 'className="ui-display-title mt-1 max-w-xl text-white"'),
    ('className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80"', 'className="mt-3 max-w-xl text-sm leading-6 tracking-[-0.006em] text-emerald-100/85 sm:text-[15px]"'),
    ('className="mt-0.5 block text-2xl font-bold leading-none tabular-nums text-white"', 'className="ui-number mt-0.5 block text-2xl font-[750] leading-none text-white"'),
    ('className="mt-1 text-sm font-bold text-white">{sevenDayTotal} setoran', 'className="ui-number mt-1 text-base font-[750] text-white">{sevenDayTotal} setoran'),
    ('className="mt-1.5 block text-xl font-bold tabular-nums text-white"', 'className="ui-number mt-1.5 block text-xl font-[750] text-white"'),
    ('className="text-2xl font-bold leading-none">{todayAttention.length}', 'className="ui-number text-2xl font-[750] leading-none">{todayAttention.length}'),
    ('className="mt-0.5 block text-2xl font-bold text-slate-950">{santriList.length}', 'className="ui-number mt-0.5 block text-2xl font-[750] text-slate-950">{santriList.length}'),
    ('className="mt-0.5 block text-2xl font-bold text-slate-950">{activities.length}', 'className="ui-number mt-0.5 block text-2xl font-[750] text-slate-950">{activities.length}'),
    ('className="ui-meta font-semibold uppercase tracking-[0.08em]"', 'className="ui-eyebrow"'),
]
for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Ustadz typography pattern not found: {old}')
    text = text.replace(old, new)
path.write_text(text)
