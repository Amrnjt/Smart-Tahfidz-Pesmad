import React, { useState, useEffect } from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { PimpinanBottomNav } from './components/PimpinanBottomNav';
import { DesktopPrimaryNav } from './components/DesktopPrimaryNav';
import { PantauanLiburanMonitorModal } from './components/PantauanLiburanMonitorModal';
import { SetoranFormNav } from './components/SetoranFormNav';
import { LoginView } from './components/LoginModal';
import { UstadzDashboard } from './components/UstadzDashboard';
import { WaliDashboard } from './components/WaliDashboard';
import { SantriDashboard } from './components/SantriDashboard';
import { ZiyadahForm } from './components/ZiyadahForm';
import { MurojaahForm } from './components/MurojaahForm';
import { BinnadzorForm } from './components/BinnadzorForm';
import { PembelajaranForm } from './components/PembelajaranForm';
import { HistoryTable } from './components/HistoryTable';
import { PimpinanHistoryTable } from './components/PimpinanHistoryTable';
import { MushafQuran } from './components/MushafQuran';
import { SantriManagement } from './components/SantriManagement';
import { KelasManagement } from './components/KelasManagement';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Snackbar, SnackbarState, NotifyFn } from './components/Snackbar';
import { useSetoranNotifications } from './hooks/useSetoranNotifications';
import { useActiveTabNavigation } from './hooks/useActiveTabNavigation';
import {
  canManageKelas,
  canManageSantri,
  canWriteSetoran,
  isGlobalReadOnlyRole,
  normalizeUserRole,
  usesGlobalDashboard,
} from './utils/roles';
import { Cloud } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      return storageService.getSession();
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useActiveTabNavigation(currentUser);
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
  const [showPantauanModal, setShowPantauanModal] = useState(false);

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

  const normalizedRole = normalizeUserRole(currentUser?.role);
  const isWali = normalizedRole === 'Wali';
  const isSantri = normalizedRole === 'Santri';
  const isPimpinan = isGlobalReadOnlyRole(currentUser?.role);
  const hasGlobalDashboard = usesGlobalDashboard(currentUser?.role);
  const canSetor = canWriteSetoran(currentUser?.role);
  const canManageSantriData = canManageSantri(currentUser?.role);
  const canManageKelasData = canManageKelas(currentUser?.role);
  const isSetorActive = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'].includes(activeTab);

  const setDashboardTab = (tab: Parameters<typeof setActiveTab>[0]) => {
    if (!isPimpinan) {
      setActiveTab(tab);
      return;
    }
    setActiveTab(tab === 'mushaf' ? 'mushaf' : 'riwayat');
  };

  const syncStatusCopy =
    syncState === 'syncing'
      ? 'Memeriksa koneksi dan data Cloud...'
      : syncState === 'success'
      ? 'Cloud Firestore • sinkronisasi terakhir berhasil'
      : syncState === 'error'
      ? 'Cloud tidak terjangkau • cache lokal tetap tersedia'
      : 'Cloud belum diperiksa • gunakan Cloud Sync untuk memverifikasi';
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

      {/* Persistent app chrome: stays outside page View Transitions. */}
      <div className="p3-chrome-stack" data-app-chrome="persistent">
        <Navbar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          onRefresh={handleManualRefresh}
          isRefreshing={isSyncing}
          syncState={syncState}
        />

        {currentUser && (
          <DesktopPrimaryNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isUstadz={canSetor}
            isSetorMenuOpen={isSetorMenuOpen}
            onOpenSetorMenu={() => setIsSetorMenuOpen(true)}
            onCloseSetorMenu={() => setIsSetorMenuOpen(false)}
            onOpenPantauanLiburan={canSetor ? () => setShowPantauanModal(true) : undefined}
          />
        )}
      </div>

      {/* Main Container */}
      <main id="main-content" tabIndex={-1} className="max-w-7xl w-full mx-auto ui-page-gutter py-4 sm:py-5 flex-1 space-y-5 relative min-w-0">
        
        {/* If Not Logged In, Show Login View */}
        {!currentUser ? (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNotify={notify}
          />
        ) : (
          <div className="p3-page-content space-y-5 min-w-0 w-full max-w-full">
            
            {/* Content per Tab */}
            {activeTab === 'dashboard' && (
              hasGlobalDashboard ? (
                <UstadzDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  kelasList={kelasList}
                  setActiveTab={setDashboardTab}
                  onSelectSantriForZiyadah={isPimpinan ? undefined : handleSelectSantriForZiyadah}
                  onOpenSetorMenu={isPimpinan ? () => undefined : () => setIsSetorMenuOpen(true)}
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
              ) : isSantri ? (
                <SantriDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  setActiveTab={setActiveTab}
                />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
                  Role akun tidak dikenali. Hubungi administrator untuk memperbaiki akses akun.
                </div>
              )
            )}

            {isSetorActive && canSetor && (
              <SetoranFormNav
                activeTab={activeTab}
                onBack={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'ziyadah' && canSetor && (
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

            {activeTab === 'murojaah' && canSetor && (
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

            {activeTab === 'binnadzor' && canSetor && (
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

            {activeTab === 'pembelajaran' && canSetor && (
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
              isPimpinan ? (
                <PimpinanHistoryTable
                  currentUser={currentUser}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  santriList={santriList}
                />
              ) : (
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
              )
            )}

            {activeTab === 'mushaf' && <MushafQuran />}

            {activeTab === 'santri' && canManageSantriData && (
              <SantriManagement
                santriList={santriList}
                onDataChanged={refreshData}
                onNotify={notify}
              />
            )}

            {activeTab === 'kelas' && canManageKelasData && (
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
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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

      {/* Desktop/Tablet Pantauan Liburan Monitor Modal */}
      {showPantauanModal && canSetor && (
        <PantauanLiburanMonitorModal
          isOpen={showPantauanModal}
          onClose={() => setShowPantauanModal(false)}
          santriList={santriList}
          onNotify={notify}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {isPimpinan ? (
        <PimpinanBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ) : (
        <BottomNav
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          santriList={santriList}
          onNotify={notify}
        />
      )}

      {/* In-app notification toasts for Wali Santri */}
      {isWali && (
        <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} />
      )}

      {/* Snackbar for sync feedback */}
      <Snackbar snack={snack} onDismiss={() => setSnack(null)} />

    </div>
  );
}
