from pathlib import Path

path = Path('src/index.css')
text = path.read_text(encoding='utf-8')

start_marker = '/* === HistoryTable mobile hardening ==='
end_marker = '/* === Safe area === */'

start = text.find(start_marker)
end = text.find(end_marker, start)

if start < 0 or end < 0:
    raise RuntimeError('HistoryTable hardening block markers not found')

removed = text[start:end]
required_fragments = [
    '[class~="min-w-[160px]"]',
    '[class~="space-y-1.5"]',
    '[class~="bg-emerald-50/80"]',
    'input[type="date"],\n  select',
]
for fragment in required_fragments:
    if fragment not in removed:
        raise RuntimeError(f'Expected legacy selector missing: {fragment}')

text = text[:start] + end_marker + text[end + len(end_marker):]
path.write_text(text, encoding='utf-8')
print('Removed legacy HistoryTable utility-selector hardening block')
