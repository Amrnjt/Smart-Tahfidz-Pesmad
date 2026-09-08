from pathlib import Path

FILES = [
    'src/App.tsx',
    'src/components/LoginModal.tsx',
    'src/components/ZiyadahProgressChart.tsx',
    'src/components/TrenHafalanBulananChart.tsx',
    'src/components/HafalanStatsChart.tsx',
    'src/components/BinnadzorForm.tsx',
    'src/components/PembelajaranForm.tsx',
    'src/components/HistoryTable.tsx',
    'src/components/SetorActionSheet.tsx',
]

# The general P2.15 patch already removes regular two-stop `bg-gradient-to-br`
# surfaces. These six conditional leaderboard/progress strings deliberately use
# exact replacements so quote boundaries in JSX template literals stay intact.
path = Path('src/components/TrenHafalanBulananChart.tsx')
text = path.read_text()
replacements = {
    'bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white': 'bg-amber-50',
    'bg-gradient-to-r from-slate-200/40 via-slate-50/60 to-white': 'bg-slate-50',
    'bg-gradient-to-r from-orange-200/30 via-amber-50/40 to-white': 'bg-orange-50',
    'bg-gradient-to-r from-amber-500 to-emerald-600': 'bg-amber-500',
    'bg-gradient-to-r from-slate-400 to-teal-600': 'bg-slate-400',
    'bg-gradient-to-r from-emerald-500 to-teal-500': 'bg-emerald-500',
}
for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Expected gradient chain missing: {old}')
    text = text.replace(old, new, 1)
path.write_text(text)

remaining = []
for file in FILES:
    if 'bg-gradient-to' in Path(file).read_text():
        remaining.append(file)
if remaining:
    raise SystemExit(f'Unnormalized gradients remain: {remaining}')

print('P2.15 remaining gradients normalized with explicit replacements')
