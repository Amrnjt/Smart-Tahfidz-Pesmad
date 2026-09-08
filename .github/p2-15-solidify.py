from pathlib import Path
import re

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

pattern = re.compile(r'bg-gradient-to-\S+\s+from-([^\s]+)\s+(?:via-[^\s]+\s+)?to-[^\s]+')

for file in FILES:
    p = Path(file)
    text = p.read_text()
    text, count = pattern.subn(lambda m: f'bg-{m.group(1)}', text)
    p.write_text(text)
    if count:
        print(f'{file}: normalized {count} gradient chain(s)')

remaining = []
for file in FILES:
    if 'bg-gradient-to' in Path(file).read_text():
        remaining.append(file)
if remaining:
    raise SystemExit(f'Unnormalized gradients remain: {remaining}')
