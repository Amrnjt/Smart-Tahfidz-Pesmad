from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace(path: str, old: str, new: str, count: int | None = None, required: bool = True) -> None:
    text = read(path)
    if old not in text:
        if required:
            raise SystemExit(f'Pattern not found in {path}: {old[:180]!r}')
        return
    text = text.replace(old, new) if count is None else text.replace(old, new, count)
    write(path, text)


def regex(path: str, pattern: str, repl: str, min_count: int = 1, flags: int = 0) -> None:
    text = read(path)
    updated, count = re.subn(pattern, repl, text, flags=flags)
    if count < min_count:
        raise SystemExit(f'Regex matched {count}, expected >= {min_count} in {path}: {pattern[:160]}')
    write(path, updated)


# -----------------------------------------------------------------------------
# App shell: remove decorative ambient gradient layer; page background already exists.
# -----------------------------------------------------------------------------
path = 'src/App.tsx'
regex(
    path,
    r'\n\s*\{\/\* Soft Ambient mint and teal atmospheric gradient behind glass panels \*\/\}\n\s*<div\n\s*aria-hidden="true"\n\s*className="fixed inset-0 pointer-events-none z-0 opacity-60"\n\s*style=\{\{\n\s*background: \'radial-gradient\([^\n]+\n\s*\}\}\n\s*\/>\n',
    '\n',
    min_count=1,
)

# -----------------------------------------------------------------------------
# Login: keep strong institutional composition, remove glass/gradient/glow slop.
# -----------------------------------------------------------------------------
path = 'src/components/LoginModal.tsx'
replace(path, 'MoonStar, Sparkles', 'MoonStar, CircleCheck')
replace(path, '<Sparkles className="w-4 h-4" />', '<CircleCheck className="w-4 h-4" />')
replace(path, 'rounded-3xl shadow-2xl shadow-emerald-950/10', 'rounded-2xl shadow-lg shadow-slate-950/10')
replace(path, 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950', 'bg-emerald-950')
replace(path, '        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true"></div>\n        <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true"></div>\n\n', '', required=False)
replace(path, 'rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-700/50 text-[11px] font-bold', 'rounded-lg bg-emerald-900 text-emerald-100 border border-emerald-800 text-xs font-semibold')
replace(path, 'text-[11px] text-emerald-200/80', 'text-xs text-emerald-200/80')
replace(path, 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5', 'block text-sm font-semibold text-slate-800 mb-1.5')
replace(path, 'shadow-md hover:shadow-lg transition-all', 'shadow-sm transition-colors')
replace(path, 'text-[11px] text-slate-500', 'text-xs text-slate-500')
replace(path, 'text-center text-[11px] text-slate-400', 'text-center text-xs text-slate-400')
replace(path, 'bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-950', 'bg-emerald-950')
replace(path, '    {/* Decorative ambient glows */}\n    <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden="true"></div>\n    <div className="pointer-events-none absolute top-40 -left-20 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true"></div>\n\n', '', required=False)
replace(path, '        <div className="absolute inset-0 rounded-3xl bg-emerald-300/30 blur-xl" aria-hidden="true"></div>\n', '', required=False)
replace(path, 'relative w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-3 border-2 border-emerald-300/70 shadow-2xl shadow-emerald-950/40', 'relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 border border-emerald-300 shadow-lg shadow-emerald-950/20')
replace(path, 'rounded-full bg-emerald-950/50 text-emerald-100 border border-emerald-600/40 text-[11px] font-bold mb-4 backdrop-blur-sm', 'rounded-lg bg-emerald-900 text-emerald-100 border border-emerald-800 text-xs font-semibold mb-4')
# Any remaining operational microcopy in this component.
replace(path, 'text-[11px]', 'text-xs', required=False)

# -----------------------------------------------------------------------------
# Ziyadah chart: operational analytics, no glass or decorative sparkle language.
# -----------------------------------------------------------------------------
path = 'src/components/ZiyadahProgressChart.tsx'
replace(path, ', Sparkles,', ',', required=False)
replace(path, '<Sparkles ', '<CheckCircle2 ', required=False)
replace(path, 'bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md', 'bg-slate-950 text-white p-3.5 rounded-xl shadow-lg border border-slate-800')
replace(path, 'bg-white rounded-3xl', 'bg-white rounded-2xl')
replace(path, 'rounded-full bg-emerald-50', 'rounded-md bg-emerald-50', required=False)
replace(path, 'text-[10px]', 'text-xs', required=False)
replace(path, 'text-[11px]', 'text-xs', required=False)

# -----------------------------------------------------------------------------
# Monthly trend chart: remove framework-signature badges/gradients, normalize density.
# -----------------------------------------------------------------------------
path = 'src/components/TrenHafalanBulananChart.tsx'
replace(path, '  Sparkles,\n', '', required=False)
replace(path, '<Sparkles ', '<Award ', required=False)
replace(path, 'bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl', 'bg-white rounded-2xl')
replace(path, 'bg-gradient-to-br from-emerald-600 to-teal-700', 'bg-emerald-700')
regex(path, r'\n\s*<span className="text-\[10px\] font-bold px-2 py-0\.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">\n\s*Recharts Analytics\n\s*</span>', '', min_count=1)
# Replace remaining simple two-stop gradient utility chains with their semantic first surface.
text = read(path)
text = re.sub(r'bg-gradient-to-br from-([a-z]+-\d+)(?:/\d+)? to-[a-z]+-\d+(?:/\d+)?', r'bg-\1', text)
text = text.replace('text-[9px]', 'text-xs').replace('text-[10px]', 'text-xs').replace('text-[11px]', 'text-xs')
text = text.replace('backdrop-blur-md', '')
write(path, text)

# -----------------------------------------------------------------------------
# Aggregate stats chart: remove glass treatment and decorative sparkle framing.
# -----------------------------------------------------------------------------
path = 'src/components/HafalanStatsChart.tsx'
replace(path, ', Sparkles,', ',', required=False)
replace(path, '<Sparkles ', '<BookOpenCheck ', required=False)
replace(path, 'bg-white/90 backdrop-blur-md', 'bg-white')
replace(path, 'bg-white/80', 'bg-white', required=False)
replace(path, 'bg-gradient-to-br from-slate-50 to-emerald-50/40', 'bg-slate-50', required=False)
text = read(path)
text = text.replace('text-[9px]', 'text-xs').replace('text-[10px]', 'text-xs').replace('text-[11px]', 'text-xs')
text = text.replace(' active:scale-[0.985]', '')
write(path, text)

# -----------------------------------------------------------------------------
# Binnadzor: assessment is information, not decoration.
# -----------------------------------------------------------------------------
path = 'src/components/BinnadzorForm.tsx'
replace(path, ', Sparkles, Check', ', Check')
replace(path, '<Sparkles ', '<Check ', required=False)
regex(path, r'\n\s*<span className="text-base">\{opt\.emoji\}</span>', '', min_count=1)
replace(path, 'font-black text-indigo-950 uppercase tracking-wider', 'font-semibold text-indigo-950')
replace(path, 'bg-indigo-50/50 border border-indigo-100/90 shadow-2xs', 'bg-indigo-50 border border-indigo-200')
replace(path, 'bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs', 'bg-white p-3 rounded-xl border border-slate-200', required=False)
replace(path, 'rounded-full bg-indigo-50', 'rounded-md bg-indigo-50', required=False)
replace(path, "'bg-indigo-700 text-white shadow-2xs'", "'bg-indigo-700 text-white'", required=False)

# -----------------------------------------------------------------------------
# Pembelajaran: enforce category semantic amber, remove emoji/Sparkles visual noise.
# -----------------------------------------------------------------------------
path = 'src/components/PembelajaranForm.tsx'
replace(path, '  Sparkles, \n', '', required=False)
replace(path, '<Sparkles ', '<CheckCircle ', required=False)
text = read(path)
text = text.replace('indigo-', 'amber-')
text = text.replace('font-black text-amber-950 uppercase tracking-wider', 'font-semibold text-amber-950')
text = text.replace('font-black text-slate-900 uppercase tracking-wider', 'font-semibold text-slate-900')
text = text.replace('shadow-2xs', '')
# Remove option emoji spans while keeping text/status values.
text = re.sub(r'\n\s*<span>\{opt\.emoji\}</span>', '', text)
text = re.sub(r'\n\s*<span>\{st\.emoji\}</span>', '', text)
# Quick observation chips remain actions but need a proper control height.
text = text.replace('className="text-xs font-medium px-2 py-0.5 rounded-md bg-amber-50', 'className="min-h-11 text-xs font-medium px-3 py-1 rounded-md bg-amber-50')
write(path, text)

# -----------------------------------------------------------------------------
# History: Kelas Istimewa is part of Pembelajaran; use Amber semantics, no sparkle.
# -----------------------------------------------------------------------------
path = 'src/components/HistoryTable.tsx'
replace(path, '  Sparkles,\n', '', required=False)
replace(path, 'icon: Sparkles', 'icon: GraduationCap', required=False)
replace(path, '<Sparkles ', '<GraduationCap ', required=False)
text = read(path)
text = text.replace('bg-purple-100', 'bg-amber-100').replace('bg-purple-50', 'bg-amber-50')
text = text.replace('text-purple-800', 'text-amber-900').replace('text-purple-700', 'text-amber-800')
text = text.replace('border-purple-200', 'border-amber-200')
text = text.replace('bg-white/95 backdrop-blur', 'bg-white')
write(path, text)

# -----------------------------------------------------------------------------
# Bottom action sheet: modal overlay should be depth, not blur.
# -----------------------------------------------------------------------------
path = 'src/components/SetorActionSheet.tsx'
replace(path, 'bg-slate-950/50 backdrop-blur-[1px]', 'bg-slate-950/55')

print('P2.15 anti-slop + taste patch applied successfully')
