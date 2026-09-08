from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    if old not in text:
        raise SystemExit(f'missing replacement anchor in {path}: {old[:100]!r}')
    write(path, text.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    text = read(path)
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f'expected >= {minimum} occurrences in {path}, found {count}: {old!r}')
    write(path, text.replace(old, new))


# 1) Formalize the application-wide icon vocabulary.
contract_path = 'DESIGN_CONTRACT.md'
contract = read(contract_path)
if '## Iconography Contract' not in contract:
    contract += '''\n\n## Iconography Contract\n\nSmart Tahfidz uses Lucide as the single UI icon vocabulary. Icons communicate task, category, navigation, or state; they are not decorative filler. One concept must keep one stable glyph across roles and breakpoints.\n\nCanonical product icons:\n- Ziyadah: `BookPlus` — new memorisation / new setoran category.\n- Muroja'ah: `RotateCw` — repetition/review.\n- Binnadzor: `BookOpenCheck` — reading from the mushaf with evaluation.\n- Pembelajaran: `GraduationCap` — learning/evaluation outside the tahfidz categories.\n- Kelas: `School` — class management/navigation, intentionally distinct from Pembelajaran.\n- Mushaf: `BookOpen`.\n- Edit: `SquarePen`; Save: `Save`; Delete: `Trash2`; Search: `Search`; Add generic item: `Plus`/`CirclePlus` only when the meaning is the action itself.\n\nRules:\n- Do not use an action icon as a category identity; for example a generic plus must not stand for Ziyadah.\n- Do not alias an unrelated glyph merely to preserve an old component name.\n- Status icons must be paired with wording when the state matters; color alone is never sufficient.\n- Use approximately 16–20px icons for ordinary controls and navigation. A primary mobile action may be slightly heavier, but should remain within the Lucide family.\n- Decorative icons should be `aria-hidden`; icon-only controls require an accessible name.\n- Brand marks are not Lucide icons. The Pesmad logo stays visually static by default; interaction belongs to its parent control.\n- Emoji are not UI iconography and must not be used as status/category decoration.\n'''
    write(contract_path, contract)

# 2) Navigation semantics: Kelas must not share Pembelajaran's GraduationCap.
replace_once(
    'src/App.tsx',
    "import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, GraduationCap } from 'lucide-react';",
    "import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, School } from 'lucide-react';"
)
replace_all('src/App.tsx', '<GraduationCap className="w-4 h-4 flex-shrink-0" />', '<School className="w-4 h-4 flex-shrink-0" />')
replace_once(
    'src/components/BottomNav.tsx',
    "import { LayoutDashboard, History, Users, GraduationCap, Plus, BookOpen } from 'lucide-react';",
    "import { LayoutDashboard, History, Users, School, Plus, BookOpen } from 'lucide-react';"
)
replace_all('src/components/BottomNav.tsx', 'icon={GraduationCap}', 'icon={School}')

# 3) Stable category vocabulary across dashboards, History, action sheet and Ziyadah form.
replace_once('src/components/UstadzDashboard.tsx', '  BookOpen,\n  BookOpenCheck,', '  BookOpen,\n  BookPlus,\n  BookOpenCheck,')
replace_once('src/components/UstadzDashboard.tsx', '    icon: BookOpen,\n    onDarkText:', '    icon: BookPlus,\n    onDarkText:')

replace_once('src/components/WaliDashboard.tsx', '  BookOpen,\n  BookOpenCheck,', '  BookOpen,\n  BookPlus,\n  BookOpenCheck,')
replace_once("src/components/WaliDashboard.tsx", "    icon: BookOpen\n  },\n  \"Muroja'ah\":", "    icon: BookPlus\n  },\n  \"Muroja'ah\":")

replace_once('src/components/SantriDashboard.tsx', '  BookOpen,\n  BookOpenCheck,', '  BookOpen,\n  BookPlus,\n  BookOpenCheck,')
replace_once('src/components/SantriDashboard.tsx', "  Ziyadah: { text: 'text-emerald-800', surface: 'bg-emerald-50', icon: BookOpen },", "  Ziyadah: { text: 'text-emerald-800', surface: 'bg-emerald-50', icon: BookPlus },")

replace_once('src/components/HistoryTable.tsx', '  BookOpen,\n  RotateCw,', '  BookOpen,\n  BookPlus,\n  RotateCw,')
replace_once('src/components/HistoryTable.tsx', "    icon: BookOpen,\n    badgeBg: 'bg-emerald-100',", "    icon: BookPlus,\n    badgeBg: 'bg-emerald-100',")

replace_once('src/components/SetorActionSheet.tsx', '  CirclePlus as PlusCircle,', '  BookPlus,')
replace_once('src/components/SetorActionSheet.tsx', '      icon: PlusCircle,', '      icon: BookPlus,')

replace_once(
    'src/components/ZiyadahForm.tsx',
    "import { CirclePlus as PlusCircle, BookOpen, Save, RotateCcw, Calendar, Clock } from 'lucide-react';",
    "import { BookPlus, BookOpen, Save, RotateCcw, Calendar, Clock } from 'lucide-react';"
)
replace_all('src/components/ZiyadahForm.tsx', '<PlusCircle className=', '<BookPlus className=')

# 4) Action semantics: Edit is always SquarePen.
replace_once('src/components/SantriManagement.tsx', 'CreditCard as Edit3', 'SquarePen')
replace_all('src/components/SantriManagement.tsx', '<Edit3 className=', '<SquarePen className=')
replace_once('src/components/KelasManagement.tsx', 'CreditCard as Edit3', 'SquarePen')
replace_all('src/components/KelasManagement.tsx', '<Edit3 className=', '<SquarePen className=')
replace_once('src/components/PantauanLiburanWaliSection.tsx', 'Trash2, Edit3, Save', 'Trash2, SquarePen, Save')
replace_all('src/components/PantauanLiburanWaliSection.tsx', '<Edit3 className=', '<SquarePen className=')

# 5) Checkbox and analytics metaphors.
replace_once('src/components/UnduhLaporanModal.tsx', '  CircleCheck as CheckCircle,\n  CircleAlert as AlertCircle,', '  CircleCheck as CheckCircle,\n  Check,\n  CircleAlert as AlertCircle,')
replace_once('src/components/UnduhLaporanModal.tsx', '<CheckCircle className="w-3.5 h-3.5 text-white" />', '<Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />')

replace_once('src/components/TrenHafalanBulananChart.tsx', '  Trophy,\n  Medal\n', '  Trophy,\n  ListOrdered,\n  Gauge\n')
replace_once('src/components/TrenHafalanBulananChart.tsx', '<Award className="w-3.5 h-3.5" />\n          <span>Tingkat Kelancaran (%)</span>', '<Gauge className="w-3.5 h-3.5" />\n          <span>Tingkat Kelancaran (%)</span>')
replace_once('src/components/TrenHafalanBulananChart.tsx', '<Medal className="w-3.5 h-3.5 text-amber-500" />\n                <span>Daftar Peringkat</span>', '<ListOrdered className="w-3.5 h-3.5 text-slate-600" />\n                <span>Daftar Peringkat</span>')

# 6) Dead icon/emoji debt.
replace_once('src/components/ZiyadahProgressChart.tsx', ', Circle as HelpCircle, Clock', ', Clock')
replace_once('src/components/HistoryTable.tsx', '  AlertTriangle,\n  CheckSquare,\n  Square\n', '  AlertTriangle\n')
replace_once(
    'src/types/index.ts',
    "export const PREDIKAT_NILAI_OPTIONS: { value: PredikatNilai; label: string; arab: string; emoji: string }[] = [\n  { value: 'Mengulang', label: 'Mengulang (I\\'adah)', arab: 'I\\'adah', emoji: '🔴' },\n  { value: 'Kurang', label: 'Kurang (Naqish)', arab: 'Naqish', emoji: '🟠' },\n  { value: 'Baik', label: 'Baik (Jayyid)', arab: 'Jayyid', emoji: '🟡' },\n  { value: 'Sangat Baik', label: 'Sangat Baik (Jayyid Jiddan)', arab: 'Jayyid Jiddan', emoji: '🟢' },\n];",
    "export const PREDIKAT_NILAI_OPTIONS: { value: PredikatNilai; label: string; arab: string }[] = [\n  { value: 'Mengulang', label: 'Mengulang (I\\'adah)', arab: 'I\\'adah' },\n  { value: 'Kurang', label: 'Kurang (Naqish)', arab: 'Naqish' },\n  { value: 'Baik', label: 'Baik (Jayyid)', arab: 'Jayyid' },\n  { value: 'Sangat Baik', label: 'Sangat Baik (Jayyid Jiddan)', arab: 'Jayyid Jiddan' },\n];"
)

# 7) Brand mark should not animate independently from its parent control.
replace_once(
    'src/components/PesmadLogo.tsx',
    'className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 hover:scale-105"',
    'className="w-full h-full object-contain"'
)

# 8) Switch accessibility label must describe the action in the current state.
replace_once(
    'src/components/PantauanLiburanMonitorModal.tsx',
    'aria-label="Aktifkan Program Pantauan Liburan"',
    "aria-label={appConfig.programLiburanActive ? 'Nonaktifkan Program Pantauan Liburan' : 'Aktifkan Program Pantauan Liburan'}"
)

# 9) Remove unreferenced legacy PWA/app icon generations. v4 remains canonical.
legacy_assets = [
    'public/pesmad-app-icon-v2-32.png',
    'public/pesmad-app-icon-v2-180.png',
    'public/pesmad-app-icon-v2-192.png',
    'public/pesmad-app-icon-v2-512.png',
    'public/pesmad-app-icon-v3-32.png',
    'public/pesmad-app-icon-v3-180.png',
    'public/pesmad-app-icon-v3-192.png',
    'public/pesmad-app-icon-v3-512.png',
    'public/pesmad-icon-32.png',
    'public/pesmad-icon-180.png',
    'public/pesmad-icon-192.png',
    'public/pesmad-icon-512.png',
    'public/pesmad-icon.svg',
]
for asset in legacy_assets:
    p = Path(asset)
    if not p.exists():
        raise SystemExit(f'legacy asset missing before cleanup: {asset}')
    p.unlink()

# Safety assertions: canonical vocabulary and no stale aliases/references.
checks = {
    'src/components/SantriManagement.tsx': ['SquarePen'],
    'src/components/KelasManagement.tsx': ['SquarePen'],
    'src/components/UstadzDashboard.tsx': ['BookPlus'],
    'src/components/WaliDashboard.tsx': ['BookPlus'],
    'src/components/SantriDashboard.tsx': ['BookPlus'],
    'src/components/SetorActionSheet.tsx': ['BookPlus'],
    'src/components/ZiyadahForm.tsx': ['BookPlus'],
    'src/App.tsx': ['School'],
    'src/components/BottomNav.tsx': ['School'],
}
for path, tokens in checks.items():
    text = read(path)
    for token in tokens:
        if token not in text:
            raise SystemExit(f'{token} missing in {path}')

for path in ['src/components/SantriManagement.tsx', 'src/components/KelasManagement.tsx']:
    text = read(path)
    if 'CreditCard as Edit3' in text or '<Edit3' in text:
        raise SystemExit(f'stale Edit3 alias remains in {path}')

if 'emoji:' in read('src/types/index.ts'):
    raise SystemExit('emoji property remains in PREDIKAT_NILAI_OPTIONS')
