import React, { useState, useEffect } from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, ActiveTab } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SetorActionSheet } from './components/SetorActionSheet';
import { LoginView } from './components/LoginModal';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Snackbar, SnackbarState, NotifyFn } from './components/Snackbar';
import { useSetoranNotifications } from './hooks/useSetoranNotifications';
import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, GraduationCap } from 'lucide-react';


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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      return storageService.getSession();
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [santriList, setSantriList] = useState<Santri[]>(() => {
    try { return storageService.getSantriList(); } catch { return []; }
  });
  const [ziyadahRecords, setZiyadahRecords] = useState<ZiyadahRecord[]>(() => {
    try { return storageService.getZiyadahRecords(); } catch { return []; }
  });
  const [murojaahRecords, setMurojaahRecords] = useState<MurojaahRecord[]>(() => {
    try { return storageService.getMurojaahRecords(); } catch { return []; }
  });
  const [binnadzorRecords, setBinnadzorRecords] = useState<BinnadzorRecord[]>(() => {
    try { return storageService.getBinnadzorRecords(); } catch { return []; }
  });
  const [pembelajaranRecords, setPembelajaranRecords] = useState<PembelajaranRecord[]>(() => {
    try { return storageService.getPembelajaranRecords(); } catch { return []; }
  });
  const [kelasList, setKelasList] = useState<Kelas[]>(() => {
    try { return storageService.getKelasList(); } catch { return []; }
  });
  const [userList, setUserList] = useState<User[]>(() => {
    try { return storageService.getUsers(); } catch { return []; }
  });
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const isSyncing = syncState === 'syncing';
  const [snack, setSnack] = useState<SnackbarState | null>(null);
  const [isSetorMenuOpen, setIsSetorMenuOpen] = useState(false);

  const notify: NotifyFn = (type, message, options = {}) => {
    setSnack({
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      message,
      ...options
    });
  };

  const refreshData = () => {
    setSantriList(storageService.getSantriList());
    setZiyadahRecords(storageService.getZiyadahRecords());
    setMurojaahRecords(storageService.getMurojaahRecords());
    setBinnadzorRecords(storageService.getBinnadzorRecords());
    setPembelajaranRecords(storageService.getPembelajaranRecords());
    setKelasList(storageService.getKelasList());
    setUserList(storageService.getUsers());
  };

  // Setup real-time Firebase Firestore synchronization across all devices
  useEffect(() => {
    refreshData();

    // Subscribe to real-time changes from Firestore database
    const unsubscribe = storageService.initRealtimeSync(() => {
      refreshData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    refreshData();
  };

  const handleLogout = () => {
    storageService.setSession(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleManualRefresh = async () => {
    if (isSyncing) return;
    setSyncState('syncing');
    try {
      const result = await storageService.syncWithCloud();
      if (!result.success) {
        throw new Error(result.message || 'Cloud tidak dapat dijangkau.');
      }
      refreshData();
      setSyncState('success');
      setSnack({
        id: `sync-${Date.now()}`,
        message: 'Data berhasil disinkronkan dengan Cloud Firestore.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      refreshData();
      setSyncState('error');
      setSnack({
        id: `sync-err-${Date.now()}`,
        message: 'Gagal memperbarui data dari Cloud. Data lokal hanya digunakan sebagai cache.',
        type: 'error',
        actionLabel: 'Coba Lagi',
        onAction: handleManualRefresh,
      });
    }
  };

  const handleSelectSantriForZiyadah = (idSantri: string) => {
    setSelectedSantriId(idSantri);
  };

  const userRoleStr = String(currentUser?.role || '').trim().toLowerCase();
  const isWali = userRoleStr === 'wali' || userRoleStr.includes('wali');
  const isSantri = userRoleStr === 'santri';
  const isUstadz = !isWali && !isSantri;
  const isSetorActive = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'].includes(activeTab);

  const syncStatusCopy =
    syncState === 'syncing'
      ? 'Memeriksa koneksi dan data Cloud...'
      : syncState === 'success'
      ? 'Cloud Firestore • sinkronisasi terakhir berhasil'
      : syncState === 'error'
      ? 'Cloud tidak terjangkau • cache lokal tetap tersedia'
      : 'Cloud Firestore • status koneksi belum diverifikasi';
  const syncStatusTone =
    syncState === 'success'
      ? 'ui-state-success'
      : syncState === 'error'
      ? 'ui-state-error'
      : syncState === 'syncing'
      ? 'ui-state-info'
      : 'ui-state-neutral';

  // Delayed notification system for Wali Santri role
  const { toasts, dismissToast } = useSetoranNotifications(
    currentUser,
    ziyadahRecords,
    murojaahRecords,
    santriList
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950 ui-app-shell relative w-full max-w-full">

      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[90] -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-950 shadow-lg transition-transform focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onRefresh={handleManualRefresh}
        isRefreshing={isSyncing}
      />

      {/* Main Container */}
      <main id="main-content" tabIndex={-1} className="max-w-7xl w-full mx-auto ui-page-gutter py-4 sm:py-5 flex-1 space-y-5 relative min-w-0">
        
        {/* If Not Logged In, Show Login View */}
        {!currentUser ? (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNotify={notify}
          />
        ) : (
          <div className="space-y-5 min-w-0">
            
            {/* Primary Navigation: same mental model across tablet and desktop */}
            <nav
              className="hidden md:flex items-stretch gap-1 border-b border-slate-200 bg-white px-1"
              aria-label="Navigasi utama"
            >
              <button
                onClick={() => setActiveTab('dashboard')}
                aria-current={activeTab === 'dashboard' ? 'page' : undefined}
                className={`press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                  activeTab === 'dashboard'
                    ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Beranda</span>
              </button>

              <button
                onClick={() => setActiveTab('riwayat')}
                aria-current={activeTab === 'riwayat' ? 'page' : undefined}
                className={`press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                  activeTab === 'riwayat'
                    ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
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
                  className={`press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                    isSetorActive
                      ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
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
                  className={`press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                    activeTab === 'kelas'
                      ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
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
                  className={`press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                    activeTab === 'santri'
                      ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Santri</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('mushaf')}
                aria-current={activeTab === 'mushaf' ? 'page' : undefined}
                className={`press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${
                  activeTab === 'mushaf'
                    ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
                }`}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Mushaf</span>
              </button>
            </nav>

            {/* Content per Tab */}
            <React.Suspense fallback={<RouteLoading />}>
            {activeTab === 'dashboard' && (
              isUstadz ? (
                <UstadzDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  kelasList={kelasList}
                  setActiveTab={setActiveTab}
                  onSelectSantriForZiyadah={handleSelectSantriForZiyadah}
                  onOpenSetorMenu={() => setIsSetorMenuOpen(true)}
                />
              ) : isWali ? (
                <WaliDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  setActiveTab={setActiveTab}
                  onNotify={notify}
                />
              ) : (
                <SantriDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  setActiveTab={setActiveTab}
                />
              )
            )}

            {activeTab === 'ziyadah' && isUstadz && (
              <ZiyadahForm
                currentUser={currentUser}
                santriList={santriList}
                kelasList={kelasList}
                selectedSantriId={selectedSantriId}
                onSuccess={() => {
                  refreshData();
                  setActiveTab('riwayat');
                }}
                onNotify={notify}
              />
            )}

            {activeTab === 'murojaah' && isUstadz && (
              <MurojaahForm
                currentUser={currentUser}
                santriList={santriList}
                kelasList={kelasList}
                selectedSantriId={selectedSantriId}
                onSuccess={() => {
                  refreshData();
                  setActiveTab('riwayat');
                }}
                onNotify={notify}
              />
            )}

            {activeTab === 'binnadzor' && isUstadz && (
              <BinnadzorForm
                currentUser={currentUser}
                santriList={santriList}
                kelasList={kelasList}
                selectedSantriId={selectedSantriId}
                onSuccess={() => {
                  refreshData();
                  setActiveTab('riwayat');
                }}
                onNotify={notify}
              />
            )}

            {activeTab === 'pembelajaran' && isUstadz && (
              <PembelajaranForm
                currentUser={currentUser}
                santriList={santriList}
                kelasList={kelasList}
                selectedSantriId={selectedSantriId}
                onSuccess={() => {
                  refreshData();
                  setActiveTab('riwayat');
                }}
                onNotify={notify}
              />
            )}

            {activeTab === 'riwayat' && (
              <HistoryTable
                currentUser={currentUser}
                ziyadahRecords={ziyadahRecords}
                murojaahRecords={murojaahRecords}
                binnadzorRecords={binnadzorRecords}
                pembelajaranRecords={pembelajaranRecords}
                onDataChanged={refreshData}
                santriList={santriList}
                onNotify={notify}
              />
            )}

            {activeTab === 'mushaf' && <MushafQuran />}

            {activeTab === 'santri' && isUstadz && (
              <SantriManagement
                santriList={santriList}
                onDataChanged={refreshData}
                onNotify={notify}
              />
            )}

            {activeTab === 'kelas' && isUstadz && (
              <KelasManagement
                kelasList={kelasList}
                santriList={santriList}
                userList={userList}
                onDataChanged={refreshData}
                onNotify={notify}
              />
            )}

            </React.Suspense>

            {/* Production Footer */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Tahfidz al-Qur'an Pesantren Madrasah Darul Fikri • Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
                </div>
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className={`ui-state-surface flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${syncStatusTone}`}
                >
                  <Cloud className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-pulse' : ''}`} aria-hidden="true" />
                  <span>{syncStatusCopy}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Tablet/Desktop Setor entry point reuses the compact mobile action sheet */}
      {currentUser && isUstadz && (
        <SetorActionSheet
          isOpen={isSetorMenuOpen}
          onClose={() => setIsSetorMenuOpen(false)}
          onSelect={(tab) => setActiveTab(tab)}
          santriList={santriList}
          onNotify={notify}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        santriList={santriList}
        onNotify={notify}
      />

      {/* In-app notification toasts for Wali Santri */}
      {isWali && (
        <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />
      )}

      {/* Snackbar for sync feedback */}
      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />

    </div>
  );
}
