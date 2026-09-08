from pathlib import Path

path = Path('src/components/HistoryTable.tsx')
text = path.read_text()
if 'purple-' not in text:
    raise SystemExit('Expected legacy purple History category tokens were not found')
text = text.replace('purple-', 'amber-')
path.write_text(text)

if 'purple-' in path.read_text():
    raise SystemExit('Purple History tokens remain after semantic normalization')

print('P2.15 History category semantics normalized to amber')
