from pathlib import Path


def replace(path, old, new, label):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'{label}: pattern not found')
    p.write_text(text.replace(old, new, 1))

# BottomNav should consume App state and shared feedback contract rather than
# reaching into storage directly. This also repairs the P1.7 required prop.
replace(
    'src/components/BottomNav.tsx',
    "import { User, ActiveTab } from '../types';",
    "import { User, ActiveTab, Santri } from '../types';",
    'bottom nav Santri import'
)
replace(
    'src/components/BottomNav.tsx',
    "import { SetorActionSheet } from './SetorActionSheet';\nimport { storageService } from '../services/storageService';",
    "import { SetorActionSheet } from './SetorActionSheet';\nimport type { NotifyFn } from './Snackbar';",
    'bottom nav notify import'
)
replace(
    'src/components/BottomNav.tsx',
    "  setActiveTab: (tab: ActiveTab) => void;\n}",
    "  setActiveTab: (tab: ActiveTab) => void;\n  santriList: Santri[];\n  onNotify: NotifyFn;\n}",
    'bottom nav props'
)
replace(
    'src/components/BottomNav.tsx',
    "  currentUser,\n  activeTab,\n  setActiveTab\n}) => {",
    "  currentUser,\n  activeTab,\n  setActiveTab,\n  santriList,\n  onNotify\n}) => {",
    'bottom nav destructure'
)
replace(
    'src/components/BottomNav.tsx',
    "        santriList={storageService.getSantriList()}\n      />",
    "        santriList={santriList}\n        onNotify={onNotify}\n      />",
    'bottom nav action sheet props'
)
replace(
    'src/App.tsx',
    "      <BottomNav\n        currentUser={currentUser}\n        activeTab={activeTab}\n        setActiveTab={setActiveTab}\n      />",
    "      <BottomNav\n        currentUser={currentUser}\n        activeTab={activeTab}\n        setActiveTab={setActiveTab}\n        santriList={santriList}\n        onNotify={notify}\n      />",
    'app bottom nav props'
)

print('P1.8 regression fixes applied')
