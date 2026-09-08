from pathlib import Path

path = Path('src/App.tsx')
text = path.read_text()

eager_imports = [
    "import { UstadzDashboard } from './components/UstadzDashboard';\n",
    "import { WaliDashboard } from './components/WaliDashboard';\n",
    "import { SantriDashboard } from './components/SantriDashboard';\n",
    "import { ZiyadahForm } from './components/ZiyadahForm';\n",
    "import { MurojaahForm } from './components/MurojaahForm';\n",
    "import { BinnadzorForm } from './components/BinnadzorForm';\n",
    "import { PembelajaranForm } from './components/PembelajaranForm';\n",
    "import { HistoryTable } from './components/HistoryTable';\n",
    "import { MushafQuran } from './components/MushafQuran';\n",
    "import { SantriManagement } from './components/SantriManagement';\n",
    "import { KelasManagement } from './components/KelasManagement';\n",
]
for import_line in eager_imports:
    if import_line not in text:
        raise SystemExit(f'Expected eager import missing: {import_line.strip()}')
    text = text.replace(import_line, '', 1)

anchor = "import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, GraduationCap } from 'lucide-react';\n"
if anchor not in text:
    raise SystemExit('Lazy import insertion anchor not found')

lazy_block = """

const UstadzDashboard = React.lazy(() =>
  import('./components/UstadzDashboard').then(({ UstadzDashboard }) => ({ default: UstadzDashboard }))
);
const WaliDashboard = React.lazy(() =>
  import('./components/WaliDashboard').then(({ WaliDashboard }) => ({ default: WaliDashboard }))
);
const SantriDashboard = React.lazy(() =>
  import('./components/SantriDashboard').then(({ SantriDashboard }) => ({ default: SantriDashboard }))
);
const ZiyadahForm = React.lazy(() =>
  import('./components/ZiyadahForm').then(({ ZiyadahForm }) => ({ default: ZiyadahForm }))
);
const MurojaahForm = React.lazy(() =>
  import('./components/MurojaahForm').then(({ MurojaahForm }) => ({ default: MurojaahForm }))
);
const BinnadzorForm = React.lazy(() =>
  import('./components/BinnadzorForm').then(({ BinnadzorForm }) => ({ default: BinnadzorForm }))
);
const PembelajaranForm = React.lazy(() =>
  import('./components/PembelajaranForm').then(({ PembelajaranForm }) => ({ default: PembelajaranForm }))
);
const HistoryTable = React.lazy(() =>
  import('./components/HistoryTable').then(({ HistoryTable }) => ({ default: HistoryTable }))
);
const MushafQuran = React.lazy(() =>
  import('./components/MushafQuran').then(({ MushafQuran }) => ({ default: MushafQuran }))
);
const SantriManagement = React.lazy(() =>
  import('./components/SantriManagement').then(({ SantriManagement }) => ({ default: SantriManagement }))
);
const KelasManagement = React.lazy(() =>
  import('./components/KelasManagement').then(({ KelasManagement }) => ({ default: KelasManagement }))
);

const RouteLoading = () => (
  <div
    role="status"
    aria-live="polite"
    className="ui-surface flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 px-4 py-5 text-slate-700"
  >
    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
    <div>
      <p className="text-sm font-semibold text-slate-900">Membuka tampilan...</p>
      <p className="text-xs text-slate-500">Memuat kode fitur yang diperlukan.</p>
    </div>
  </div>
);
"""
text = text.replace(anchor, anchor + lazy_block, 1)

content_anchor = "            {/* Content per Tab */}\n            {activeTab === 'dashboard' && ("
if content_anchor not in text:
    raise SystemExit('Content Suspense anchor not found')
text = text.replace(
    content_anchor,
    "            {/* Content per Tab */}\n            <React.Suspense fallback={<RouteLoading />}>\n            {activeTab === 'dashboard' && (",
    1,
)

footer_anchor = "\n            {/* Production Footer */}"
if footer_anchor not in text:
    raise SystemExit('Footer Suspense close anchor not found')
text = text.replace(footer_anchor, "\n            </React.Suspense>\n\n            {/* Production Footer */}", 1)

path.write_text(text)
print('P2.18 route code splitting patch applied')
