from pathlib import Path

path = Path('src/App.tsx')
text = path.read_text()

imports = [
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
for line in imports:
    if line not in text:
        raise SystemExit(f'Missing expected eager import: {line.strip()}')
    text = text.replace(line, '', 1)

anchor = "import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, GraduationCap } from 'lucide-react';\n"
if anchor not in text:
    raise SystemExit('lucide import anchor missing')

lazy = r'''

const UstadzDashboard = React.lazy(() => import('./components/UstadzDashboard').then(m => ({ default: m.UstadzDashboard })));
const WaliDashboard = React.lazy(() => import('./components/WaliDashboard').then(m => ({ default: m.WaliDashboard })));
const SantriDashboard = React.lazy(() => import('./components/SantriDashboard').then(m => ({ default: m.SantriDashboard })));
const ZiyadahForm = React.lazy(() => import('./components/ZiyadahForm').then(m => ({ default: m.ZiyadahForm })));
const MurojaahForm = React.lazy(() => import('./components/MurojaahForm').then(m => ({ default: m.MurojaahForm })));
const BinnadzorForm = React.lazy(() => import('./components/BinnadzorForm').then(m => ({ default: m.BinnadzorForm })));
const PembelajaranForm = React.lazy(() => import('./components/PembelajaranForm').then(m => ({ default: m.PembelajaranForm })));
const HistoryTable = React.lazy(() => import('./components/HistoryTable').then(m => ({ default: m.HistoryTable })));
const MushafQuran = React.lazy(() => import('./components/MushafQuran').then(m => ({ default: m.MushafQuran })));
const SantriManagement = React.lazy(() => import('./components/SantriManagement').then(m => ({ default: m.SantriManagement })));
const KelasManagement = React.lazy(() => import('./components/KelasManagement').then(m => ({ default: m.KelasManagement })));

const RouteLoading = () => (
  <div role="status" aria-live="polite" className="ui-surface flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 px-4 py-5 text-slate-700">
    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
    <div>
      <p className="text-sm font-semibold text-slate-900">Membuka tampilan...</p>
      <p className="text-xs text-slate-500">Memuat fitur yang diperlukan.</p>
    </div>
  </div>
);
'''
text = text.replace(anchor, anchor + lazy, 1)

start = "            {/* Content per Tab */}\n            {activeTab === 'dashboard' && ("
if start not in text:
    raise SystemExit('content start anchor missing')
text = text.replace(start, "            {/* Content per Tab */}\n            <React.Suspense fallback={<RouteLoading />}>\n            {activeTab === 'dashboard' && (", 1)

end = "\n            {/* Production Footer */}"
if end not in text:
    raise SystemExit('footer anchor missing')
text = text.replace(end, "\n            </React.Suspense>\n\n            {/* Production Footer */}", 1)

path.write_text(text)
print('P2.18 route splitting applied')
