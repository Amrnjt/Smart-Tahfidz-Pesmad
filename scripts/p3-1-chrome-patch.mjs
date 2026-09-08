import fs from 'node:fs';

const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');

app = app.replace(
  "import { BottomNav } from './components/BottomNav';",
  "import { BottomNav } from './components/BottomNav';\nimport { DesktopPrimaryNav } from './components/DesktopPrimaryNav';"
);
app = app.replace(
  "import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, School } from 'lucide-react';",
  "import { Cloud } from 'lucide-react';"
);

const oldChrome = `      {/* Top Navbar */}\n      <Navbar\n        currentUser={currentUser}\n        activeTab={activeTab}\n        setActiveTab={setActiveTab}\n        onLogout={handleLogout}\n        onRefresh={handleManualRefresh}\n        isRefreshing={isSyncing}\n      />\n\n      {/* Main Container */}`;
const newChrome = `      {/* Persistent app chrome: stays outside page View Transitions. */}\n      <div className="p3-chrome-stack" data-app-chrome="persistent">\n        <Navbar\n          currentUser={currentUser}\n          activeTab={activeTab}\n          setActiveTab={setActiveTab}\n          onLogout={handleLogout}\n          onRefresh={handleManualRefresh}\n          isRefreshing={isSyncing}\n        />\n\n        {currentUser && (\n          <DesktopPrimaryNav\n            activeTab={activeTab}\n            setActiveTab={setActiveTab}\n            isUstadz={isUstadz}\n            isSetorMenuOpen={isSetorMenuOpen}\n            onOpenSetorMenu={() => setIsSetorMenuOpen(true)}\n          />\n        )}\n      </div>\n\n      {/* Main Container */}`;
if (!app.includes(oldChrome)) throw new Error('Persistent chrome insertion target not found');
app = app.replace(oldChrome, newChrome);

const navStart = app.indexOf('            {/* Primary Navigation: same mental model across tablet and desktop */}');
const contentStart = app.indexOf('            {/* Content per Tab */}', navStart);
if (navStart < 0 || contentStart < 0) throw new Error('Desktop navigation block boundaries not found');
app = app.slice(0, navStart) + app.slice(contentStart);

app = app.replace(
  "      : 'Cloud Firestore • status koneksi belum diverifikasi';",
  "      : 'Cloud belum diperiksa • gunakan Cloud Sync untuk memverifikasi';"
);
app = app.replace(
  '<div className="space-y-5 min-w-0">',
  '<div className="p3-page-content space-y-5 min-w-0">'
);

fs.writeFileSync(appPath, app);

const navbarPath = 'src/components/Navbar.tsx';
let navbar = fs.readFileSync(navbarPath, 'utf8');
const oldHeader = '<header id="main-header" className="p2-topbar ui-safe-top sticky top-0 z-40 select-none">';
const newHeader = '<header id="main-header" className="p2-topbar ui-safe-top relative select-none">';
if (!navbar.includes(oldHeader)) throw new Error('Navbar sticky target not found');
navbar = navbar.replace(oldHeader, newHeader);
fs.writeFileSync(navbarPath, navbar);

console.log('P3.1 chrome patch applied');
