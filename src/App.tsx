import React, { useState, useEffect } from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, ActiveTab } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SetorActionSheet } from './components/SetorActionSheet';
import { LoginView } from './components/LoginModal';
import { UstadzDashboard } from './components/UstadzDashboard';
import { WaliDashboard } from './components/WaliDashboard';
import { SantriDashboard } from './components/SantriDashboard';
import { ZiyadahForm } from './components/ZiyadahForm';
import { MurojaahForm } from './components/MurojaahForm';
import { BinnadzorForm } from './components/BinnadzorForm';
import { PembelajaranForm } from './components/PembelajaranForm';
import { HistoryTable } from './components/HistoryTable';
import { MushafQuran } from './components/MushafQuran';
import { SantriManagement } from './components/SantriManagement';
import { KelasManagement } from './components/KelasManagement';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Snackbar, SnackbarState, NotifyFn } from './components/Snackbar';
import { useSetoranNotifications } from './hooks/useSetoranNotifications';
import { LayoutDashboard, CirclePlus as PlusCircle, History, BookOpen, Users, Cloud, GraduationCap } from 'lucide-react';

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
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
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
    setIsSyncing(true);
    try {
      const result = await storageService.syncWithCloud();
      if (!result.success) {
        throw new Error(result.message || 'Cloud tidak dapat dijangkau.');
      }
      refreshData();
      setSnack({
        id: `sync-${Date.now()}`,
        message: 'Data berhasil disinkronkan dengan Cloud Firestore.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      refreshData();
      setSnack({
        id: `sync-err-${Date.now()}`,
        message: 'Gagal memperbarui data dari Cloud. Data lokal hanya digunakan sebagai cache.',
        type: 'error',
        actionLabel: 'Coba Lagi',
        onAction: handleManualRefresh,
      });
    } finally {
      setIsSyncing(false);
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

  // Delayed notification system for Wali Santri role
  const { toasts, dismissToast } = useSetoranNotifications(
    currentUser,
    ziyadahRecords,
    murojaahRecords,
    santriList
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950 pb-28 sm:pb-32 md:pb-12 relative w-full max-w-full">
      
      {/* Soft Ambient mint and teal atmospheric gradient behind glass panels */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 opacity-60"
        style={{
          background: 'radial-gradient(1100px circle at 50% -120px, rgba(16, 185, 129, 0.07), rgba(20, 184, 166, 0.035) 45%, transparent 75%), radial-gradient(800px circle at 95% 450px, rgba(20, 184, 166, 0.025), transparent 60%)'
        }}
      />

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
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 pb-24 sm:pb-8 flex-1 space-y-5 relative z-10 min-w-0">
        
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

            {/* Content per Tab */}
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
                  isLoading={isLoadingData}
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
                  isLoading={isLoadingData}
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
                  isLoading={isLoadingData}
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
                isLoading={isLoadingData}
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

            {/* Production Footer */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Tahfidz al-Qur'an Pesantren Madrasah Darul Fikri • Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] font-semibold">
                  <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cloud Firestore • Sinkronisasi Real-Time Multi-Device</span>
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
