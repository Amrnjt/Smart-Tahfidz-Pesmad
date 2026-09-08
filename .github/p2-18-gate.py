from pathlib import Path

app = Path('src/App.tsx').read_text()
contract = Path('DESIGN_CONTRACT.md').read_text()
src = '\n'.join(
    p.read_text(errors='ignore')
    for p in Path('src').rglob('*')
    if p.suffix in {'.ts', '.tsx', '.css'}
)

for required in [
    'Final Design Contract v2',
    'performance-proportionate, measured, and maintainable',
    '360px mobile',
    '768px tablet',
    '1440px desktop',
    'Taste Gate',
    'Apakah ini terasa spesifik milik Pesmad?',
    'Data truth',
    'Purposeful motion',
]:
    assert required in contract, f'contract v2 requirement missing: {required}'

for eager in [
    "import { UstadzDashboard }",
    "import { WaliDashboard }",
    "import { SantriDashboard }",
    "import { HistoryTable }",
    "import { MushafQuran }",
    "import { SantriManagement }",
    "import { KelasManagement }",
]:
    assert eager not in app, f'eager route import remains: {eager}'

assert app.count('React.lazy(') >= 11
assert '<React.Suspense fallback={<RouteLoading />}>' in app
assert 'Memuat kode fitur yang diperlukan.' in app

for required in [
    'storageService.initRealtimeSync',
    'storageService.syncWithCloud',
    'setIsSetorMenuOpen(true)',
    '<BottomNav',
    '<Navbar',
    '<Snackbar',
    'useSetoranNotifications',
]:
    assert required in app, f'core App contract missing: {required}'

for forbidden in ['text-[9px]', 'text-[10px]', 'Sparkles', 'bg-gradient-to', 'backdrop-blur']:
    assert forbidden not in src, f'legacy token reintroduced: {forbidden}'

css = Path('src/index.css').read_text()
assert '.fixed.inset-0.z-50' in css
assert 'z-index: 70 !important' in css
assert 'safe-area-inset-bottom' in src
assert 'prefers-reduced-motion' in css

print('P2.18 static gate passed')
