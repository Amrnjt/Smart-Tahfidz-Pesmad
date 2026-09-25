import React, { Suspense, lazy, useEffect, useState } from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Kelas, AppConfig } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DesktopPrimaryNav } from './components/DesktopPrimaryNav';
import { SetoranFormNav } from './components/SetoranFormNav';
import { LoginView } from './components/LoginModal';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Snackbar, SnackbarState, NotifyFn } from './components/Snackbar';
import { useSetoranNotifications } from './hooks/useSetoranNotifications';
import { useActiveTabNavigation } from './hooks/useActiveTabNavigation';
import { Cloud } from 'lucide-react';
import { addDaysToDateInput, getTodayInputFormat } from './utils/dateFormatter';
import {
  loadBinnadzorForm,
  loadHistoryTable,
  loadKelasManagement,
  loadMurojaahForm,
  loadMushafQuran,
  loadPantauanLiburanPage,
  loadPembelajaranForm,
  loadSantriDashboard,
  loadSantriManagement,
  loadUstadzDashboard,
  loadWaliDashboard,
  loadZiyadahForm,
  preloadDashboardForUser,
  schedulePostLoginPrefetch
} from './routes/routePreloaders';

const PantauanLiburanPage = lazy(loadPantauanLiburanPage);
const UstadzDashboard = lazy(loadUstadzDashboard);
const WaliDashboard = lazy(loadWaliDashboard);
const SantriDashboard = lazy(loadSantriDashboard);
const ZiyadahForm = lazy(loadZiyadahForm);
const MurojaahForm = lazy(loadMurojaahForm);
const BinnadzorForm = lazy(loadBinnadzorForm);
const PembelajaranForm = lazy(loadPembelajaranForm);
const HistoryTable = lazy(loadHistoryTable);
const MushafQuran = lazy(loadMushafQuran);
const SantriManagement = lazy(loadSantriManagement);
const KelasManagement = lazy(loadKelasManagement);

function RouteLoadingFallback() {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowMessage(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="ui-bento-card flex min-h-56 items-center justify-center p-6 text-sm font-semibold text-slate-500"
      role={showMessage ? 'status' : undefined}
      aria-live={showMessage ? 'polite' : undefined}
      aria-hidden={showMessage ? undefined : true}
    >
      {showMessage ? 'Memuat halaman...' : null}
    </div>
  );
}

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
    if (!currentUser) return [];
    try { return storageService.getSantriList(); } catch { return []; }
  });
  const [ziyadahRecords, setZiyadahRecords] = useState<ZiyadahRecord[]>([]);
  const [murojaahRecords, setMurojaahRecords] = useState<MurojaahRecord[]>([]);
  const [binnadzorRecords, setBinnadzorRecords] = useState<BinnadzorRecord[]>([]);
  const [pembelajaranRecords, setPembelajaranRecords] = useState<PembelajaranRecord[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>(() => {
    if (!currentUser) return [];
    try { return storageService.getKelasList(); } catch { return []; }
  });
  const [userList, setUserList] = useState<User[]>(() => {
    if (!currentUser) return [];
    try { return storageService.getUsers(); } catch { return []; }
  });
  const [appConfig, setAppConfig] = useState<AppConfig>(() => {
    try { return storageService.getAppConfig(); }
    catch { return { programLiburanActive: false }; }
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

  const refreshMasterData = () => {
    setSantriList(storageService.getSantriList());
    setKelasList(storageService.getKelasList());
    setUserList(storageService.getUsers());
    setAppConfig(storageService.getAppConfig());
  };

  const refreshRecentSetoran = () => {
    setZiyadahRecords(storageService.getZiyadahRecords());
    setMurojaahRecords(storageService.getMurojaahRecords());
    setBinnadzorRecords(storageService.getBinnadzorRecords());
    setPembelajaranRecords(storageService.getPembelajaranRecords());
  };

  const refreshData = () => {
    refreshMasterData();
    refreshRecentSetoran();
  };

  useEffect(() => {
    if (!currentUser) return undefined;
    return schedulePostLoginPrefetch(currentUser);
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const normalizedRole = String(currentUser.role || '').trim().toLowerCase();
    if (normalizedRole !== 'superadmin') return undefined;

    let cancelled = false;
    void storageService.consolidateLegacyBinnadzorClasses()
      .then(result => {
        if (cancelled || !result.changed) return;
        refreshMasterData();
        notify(
          'success',
          `Kelas Binnadzor berhasil disatukan. ${result.normalizedSantriCount} data santri dinormalisasi.`
        );
      })
      .catch(error => {
        if (cancelled) return;
        console.error('Binnadzor class consolidation failed:', error);
        notify('error', 'Gagal menyatukan data kelas Binnadzor lama.');
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role]);

  // Keep the login shell light: master-data listeners start only after a valid
  // session exists. Existing sessions still subscribe immediately on app mount.
  useEffect(() => {
    if (!currentUser) return undefined;

    refreshMasterData();
    const unsubscribe = storageService.subscribeMasterData(refreshMasterData);
    return unsubscribe;
  }, [currentUser?.id]);

  // Dashboard consumers receive a bounded 12-month operational window. This keeps
  // the existing 3/6/12-month charts accurate without downloading lifetime history.
  useEffect(() => {
    if (!currentUser) {
      setZiyadahRecords([]);
      setMurojaahRecords([]);
      setBinnadzorRecords([]);
      setPembelajaranRecords([]);
      return;
    }

    const today = getTodayInputFormat();
    const startDate = addDaysToDateInput(today, -364);
    const normalizedRole = String(currentUser.role || '').trim().toLowerCase();
    const isPersonal = normalizedRole === 'santri' || normalizedRole === 'wali' || normalizedRole.includes('wali');
    const idSantri = currentUser.idSantri || (normalizedRole === 'santri' ? currentUser.username : '');

    if (isPersonal && !idSantri) {
      setZiyadahRecords([]);
      setMurojaahRecords([]);
      setBinnadzorRecords([]);
      setPembelajaranRecords([]);
      return;
    }

    setZiyadahRecords([]);
    setMurojaahRecords([]);
    setBinnadzorRecords([]);
    setPembelajaranRecords([]);

    const unsubscribe = storageService.subscribeRecentSetoran({
      startDate,
      endDate: today,
      scope: isPersonal ? { kind: 'student', idSantri } : { kind: 'staff' },
    }, (update) => {
      if (update.type === 'ziyadah') setZiyadahRecords(update.records);
      else if (update.type === 'murojaah') setMurojaahRecords(update.records);
      else if (update.type === 'binnadzor') setBinnadzorRecords(update.records);
      else setPembelajaranRecords(update.records);
    });

    return unsubscribe;
  }, [currentUser?.id, currentUser?.role, currentUser?.idSantri, currentUser?.username]);

  const handleLoginSuccess = (user: User) => {
    void preloadDashboardForUser(user).catch(() => undefined);
    setCurrentUser(user);
    setActiveTab('dashboard');
    refreshMasterData();
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
      refreshMasterData();
      setSyncState('success');
      setSnack({
        id: `sync-${Date.now()}`,
        message: 'Data berhasil disinkronkan dengan Cloud Firestore.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      refreshMasterData();
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
  const isPimpinan = userRoleStr === 'pimpinan';
  const isWali = userRoleStr === 'wali' || userRoleStr.includes('wali');
  const isSantri = userRoleStr === 'santri';
  const isUstadz = userRoleStr === 'ustadz' || userRoleStr === 'superadmin';
  const isKnownRole = isUstadz || isPimpinan || isWali || isSantri;
  const isSetorActive = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'].includes(activeTab);

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

        {currentUser && isKnownRole && (
          <DesktopPrimaryNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isUstadz={isUstadz}
            showPantauan={isUstadz || isWali}
            isSetorMenuOpen={isSetorMenuOpen}
            onOpenSetorMenu={() => setIsSetorMenuOpen(true)}
            onCloseSetorMenu={() => setIsSetorMenuOpen(false)}
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
          <Suspense fallback={<RouteLoadingFallback />}>
            <div className="p3-page-content space-y-5 min-w-0 w-full max-w-full">
            
            {/* Content per Tab */}
            {activeTab === 'dashboard' && (
              (isUstadz || isPimpinan) ? (
                <UstadzDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  kelasList={kelasList}
                  userList={userList}
                  appConfig={appConfig}
                  setActiveTab={setActiveTab}
                  onSelectSantriForZiyadah={handleSelectSantriForZiyadah}
                  onOpenSetorMenu={() => setIsSetorMenuOpen(true)}
                  onNotify={notify}
                />
              ) : isWali ? (
                <WaliDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  appConfig={appConfig}
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
                  appConfig={appConfig}
                  setActiveTab={setActiveTab}
                  onNotify={notify}
                />
              ) : (
                <div className="ui-bento-card p-5 sm:p-6" role="alert">
                  <h1 className="text-base font-bold text-slate-900">Role akun tidak dikenali</h1>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Akses operasional dinonaktifkan untuk sesi ini. Hubungi Superadmin untuk memperbaiki role akun sebelum melanjutkan.
                  </p>
                </div>
              )
            )}

            {isSetorActive && isUstadz && (
              <SetoranFormNav
                activeTab={activeTab}
                onBack={() => setActiveTab('dashboard')}
              />
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

            {activeTab === 'pantauan' && (isUstadz || isWali) && (
              <PantauanLiburanPage
                currentUser={currentUser}
                santriList={santriList}
                mode={isWali ? 'wali' : 'monitor'}
                onNotify={notify}
                onDataChanged={refreshData}
              />
            )}

            {activeTab === 'mushaf' && <MushafQuran />}

            {activeTab === 'santri' && isUstadz && (
              <SantriManagement
                currentUser={currentUser}
                santriList={santriList}
                usersList={userList}
                ziyadahRecords={ziyadahRecords}
                murojaahRecords={murojaahRecords}
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
          </Suspense>
        )}
      </main>

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
