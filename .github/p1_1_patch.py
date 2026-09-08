from pathlib import Path

path = Path('src/App.tsx')
text = path.read_text(encoding='utf-8')
original = text

def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)

replace_once(
    "import { BottomNav } from './components/BottomNav';\n",
    "import { BottomNav } from './components/BottomNav';\nimport { SetorActionSheet } from './components/SetorActionSheet';\n",
    'SetorActionSheet import'
)

replace_once(
    "import { LayoutDashboard, CirclePlus as PlusCircle, RotateCw, BookOpenCheck, History, BookOpen, Users, Cloud, GraduationCap, Award } from 'lucide-react';",
    "import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, GraduationCap } from 'lucide-react';",
    'navigation icon imports'
)

replace_once(
    "  const [snack, setSnack] = useState<SnackbarState | null>(null);\n",
    "  const [snack, setSnack] = useState<SnackbarState | null>(null);\n  const [isSetorMenuOpen, setIsSetorMenuOpen] = useState(false);\n",
    'Setor menu state'
)

replace_once(
    "  const isUstadz = !isWali && !isSantri;\n",
    "  const isUstadz = !isWali && !isSantri;\n  const isSetorActive = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'].includes(activeTab);\n",
    'Setor active state'
)

start_marker = "            {/* Desktop Navigation Tab Bar with Soft Glassmorphism */}"
end_marker = "            {/* Content per Tab */}"
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise RuntimeError('Primary navigation markers not found')

nav = '''            {/* Primary Navigation: same mental model across tablet and desktop */}
            <nav
              className={`hidden md:grid bg-white/85 backdrop-blur-md rounded-2xl p-1.5 shadow-xs border border-slate-200/80 gap-1.5 ${
                isUstadz ? 'grid-cols-6' : 'grid-cols-3'
              }`}
              aria-label="Navigasi utama"
            >
              <button
                onClick={() => setActiveTab('dashboard')}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                className={`press-feedback min-w-0 py-2.5 px-2 lg:px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Beranda</span>
              </button>

              <button
                onClick={() => setActiveTab('riwayat')}
                aria-current={activeTab === 'riwayat' ? 'page' : undefined}
                className={`press-feedback min-w-0 py-2.5 px-2 lg:px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer ${
                  activeTab === 'riwayat'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Riwayat</span>
              </button>

              {isUstadz && (
                <button
                  onClick={() => setIsSetorMenuOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isSetorMenuOpen}
                  aria-current={isSetorActive ? 'page' : undefined}
                  className={`press-feedback min-w-0 py-2.5 px-2 lg:px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer ${
                    isSetorActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Setor</span>
                </button>
              )}

              {isUstadz && (
                <button
                  onClick={() => setActiveTab('kelas')}
                  aria-current={activeTab === 'kelas' ? 'page' : undefined}
                  className={`press-feedback min-w-0 py-2.5 px-2 lg:px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer ${
                    activeTab === 'kelas'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Kelas</span>
                </button>
              )}

              {isUstadz && (
                <button
                  onClick={() => setActiveTab('santri')}
                  aria-current={activeTab === 'santri' ? 'page' : undefined}
                  className={`press-feedback min-w-0 py-2.5 px-2 lg:px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer ${
                    activeTab === 'santri'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Santri</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('mushaf')}
                aria-current={activeTab === 'mushaf' ? 'page' : undefined}
                className={`press-feedback min-w-0 py-2.5 px-2 lg:px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 lg:gap-2 cursor-pointer ${
                  activeTab === 'mushaf'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Mushaf</span>
              </button>
            </nav>

'''
text = text[:start] + nav + text[end:]

insert_marker = "      {/* Mobile Bottom Navigation */}\n"
setor_mount = '''      {/* Tablet/Desktop Setor entry point reuses the compact mobile action sheet */}
      {currentUser && isUstadz && (
        <SetorActionSheet
          isOpen={isSetorMenuOpen}
          onClose={() => setIsSetorMenuOpen(false)}
          onSelect={(tab) => setActiveTab(tab)}
          santriList={santriList}
        />
      )}

'''
if insert_marker not in text:
    raise RuntimeError('Bottom navigation marker not found')
text = text.replace(insert_marker, setor_mount + insert_marker, 1)

if text == original:
    raise RuntimeError('P1.1 patch produced no changes')

path.write_text(text, encoding='utf-8')
print('P1.1 navigation patch applied')
