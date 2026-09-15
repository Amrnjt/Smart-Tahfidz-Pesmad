import React, { useState, useEffect } from 'react';
import { User, Santri, Kelas } from './types';
import { storageService } from './services/storageService';
import type { SetoranDataset } from './services/setoranQuery.types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
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
import { MushafQuran } from './components/MushafQuran';
import { SantriManagement } from './components/SantriManagement';
import { KelasManagement } from './components/KelasManagement';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { Snackbar, SnackbarState, NotifyFn } from './components/Snackbar';
import { useSetoranNotifications } from './hooks/useSetoranNotifications';
import { useActiveTabNavigation } from './hooks/useActiveTabNavigation';
import { useRecentSetoranRecords } from './hooks/useRecentSetoranRecords';
import { useAnalyticsSetoranRecords } from './hooks/useAnalyticsSetoranRecords';
import { createRecentRange } from './utils/setoranDataset';
import { Cloud } from 'lucide-react';

interface LegacySetoranBootstrap {
  recent: SetoranDataset;
  monthKeys: string[];
}

function readLegacySetoranBootstrap(): LegacySetoranBootstrap {
  try {
    const cached: SetoranDataset = {
      ziyadah: storageService.getZiyadahRecords(),
      murojaah: storageService.getMurojaahRecords(),
      binnadzor: storageService.getBinnadzorRecords(),
      pembelajaran: storageService.getPembelajaranRecords(),
    };
    const range = createRecentRange(new Date(), 30);
    const inRecentRange = (record: { timestamp: string }) =>
      record.timestamp >= range.startInclusive && record.timestamp < range.endExclusive;
    const monthKeys = new Set<string>();
    Object.values(cached).flat().forEach(record => {
      const monthKey = record.timestamp?.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(monthKey)) monthKeys.add(monthKey);
    });

    return {
      recent: {
        ziyadah: cached.ziyadah.filter(inRecentRange),
        murojaah: cached.murojaah.filter(inRecentRange),
        binnadzor: cached.binnadzor.filter(inRecentRange),
        pembelajaran: cached.pembelajaran.filter(inRecentRange),
      },
      monthKeys: [...monthKeys].sort((left, right) => right.localeCompare(left)),
    };
  } catch {
    return {
      recent: { ziyadah: [], murojaah: [], binnadzor: [], pembelajaran: [] },
      monthKeys: [],
    };
  }
}

function datasetHasRecords(dataset: SetoranDataset): boolean {
  return Object.values(dataset).some(records => records.length > 0);
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
    try { return storageService.getSantriList(); } catch { return []; }
  });
  const [legacyBootstrap] = useState(readLegacySetoranBootstrap);
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
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<string>>(
    () => storageService.getDeletedRecordIds(),
  );
  const [analyticsMonths, setAnalyticsMonths] = useState<6 | 12>(6);
  const [analyticsRefreshToken, setAnalyticsRefreshToken] = useState(0);

  const recentChannel = useRecentSetoranRecords({
    enabled: Boolean(currentUser),
    deletedIds,
    initialData: datasetHasRecords(legacyBootstrap.recent)
      ? legacyBootstrap.recent
      : undefined,
  });
  const analyticsChannel = useAnalyticsSetoranRecords({
    enabled: Boolean(currentUser && activeTab === 'dashboard'),
    months: analyticsMonths,
    refreshToken: analyticsRefreshToken,
    deletedIds,
  });

  const handleSetoranMutationCommitted = () => {
    setDeletedIds(storageService.getDeletedRecordIds());
    recentChannel.retry();
    setAnalyticsRefreshToken(token => token + 1);
  };

  const notify: NotifyFn = (type, message, options = {}) => {
    setSnack({
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      message,
      ...options
    });
  };

  const refreshReferenceData = () => {
    setSantriList(storageService.getSantriList());
    setKelasList(storageService.getKelasList());
    setUserList(storageService.getUsers());
  };

  // Master/reference data stays realtime without subscribing to setoran history.
  useEffect(() => {
    refreshReferenceData();

    const unsubscribe = storageService.initReferenceRealtimeSync(() => {
      refreshReferenceData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    refreshReferenceData();
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
      const result = await storageService.syncReferenceDataWithCloud();
      if (!result.success) {
        throw new Error(result.message || 'Cloud tidak dapat dijangkau.');
      }
      refreshReferenceData();
      setDeletedIds(storageService.getDeletedRecordIds());
      recentChannel.retry();
      setAnalyticsRefreshToken(token => token + 1);
      setSyncState('success');
      setSnack({
        id: `sync-${Date.now()}`,
        message: 'Data berhasil disinkronkan dengan Cloud Firestore.',
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      refreshReferenceData();
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
    recentChannel.data.ziyadah,
    recentChannel.data.murojaah,
    santriList
  );

  useEffect(() => {
    if (!recentChannel.error) return;
    setSnack({
      id: `recent-query-${Date.now()}`,
      type: 'error',
      message: 'Data setoran terbaru tidak dapat diperbarui. Data terakhir tetap ditampilkan.',
      actionLabel: 'Coba Lagi',
      onAction: recentChannel.retry,
    });
  }, [recentChannel.error, recentChannel.retry]);

  useEffect(() => {
    if (!analyticsChannel.error) return;
    setSnack({
      id: `analytics-query-${Date.now()}`,
      type: 'error',
      message: 'Grafik belum dapat diperbarui. Data grafik terakhir tetap ditampilkan.',
      actionLabel: 'Coba Lagi',
      onAction: () => setAnalyticsRefreshToken(token => token + 1),
    });
  }, [analyticsChannel.error]);

  const recentUnavailable = !datasetHasRecords(recentChannel.data)
    && recentChannel.status !== 'success';

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
            isUstadz={isUstadz}
            isSetorMenuOpen={isSetorMenuOpen}
            onOpenSetorMenu={() => setIsSetorMenuOpen(true)}
            onCloseSetorMenu={() => setIsSetorMenuOpen(false)}
            onOpenPantauanLiburan={() => setShowPantauanModal(true)}
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
              recentUnavailable ? (
                <section
                  className="ui-bento-card p-5 sm:p-6"
                  role={recentChannel.status === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  <h1 className="text-base font-bold text-slate-900">
                    {recentChannel.status === 'error'
                      ? 'Data setoran belum tersedia'
                      : 'Memuat data setoran terbaru…'}
                  </h1>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {recentChannel.status === 'error'
                      ? 'Statistik tidak ditampilkan sebagai nol karena sumber Cloud belum berhasil dimuat.'
                      : 'Menyiapkan statistik hari ini dan aktivitas 30 hari terakhir.'}
                  </p>
                  {recentChannel.status === 'error' && (
                    <button
                      type="button"
                      onClick={recentChannel.retry}
                      className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      Coba Lagi
                    </button>
                  )}
                </section>
              ) : isUstadz ? (
                <UstadzDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  recentRecords={recentChannel.data}
                  analyticsRecords={analyticsChannel.data}
                  analyticsStatus={analyticsChannel.status}
                  onAnalyticsMonthsChange={setAnalyticsMonths}
                  kelasList={kelasList}
                  setActiveTab={setActiveTab}
                  onSelectSantriForZiyadah={handleSelectSantriForZiyadah}
                  onOpenSetorMenu={() => setIsSetorMenuOpen(true)}
                />
              ) : isWali ? (
                <WaliDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  recentRecords={recentChannel.data}
                  analyticsRecords={analyticsChannel.data}
                  analyticsStatus={analyticsChannel.status}
                  onAnalyticsMonthsChange={setAnalyticsMonths}
                  setActiveTab={setActiveTab}
                  onNotify={notify}
                />
              ) : (
                <SantriDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  recentRecords={recentChannel.data}
                  analyticsRecords={analyticsChannel.data}
                  analyticsStatus={analyticsChannel.status}
                  onAnalyticsMonthsChange={setAnalyticsMonths}
                  setActiveTab={setActiveTab}
                />
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
                  refreshReferenceData();
                  handleSetoranMutationCommitted();
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
                  refreshReferenceData();
                  handleSetoranMutationCommitted();
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
                  refreshReferenceData();
                  handleSetoranMutationCommitted();
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
                  refreshReferenceData();
                  handleSetoranMutationCommitted();
                  setActiveTab('riwayat');
                }}
                onNotify={notify}
              />
            )}

            {activeTab === 'riwayat' && (
              <HistoryTable
                currentUser={currentUser}
                onMutationCommitted={handleSetoranMutationCommitted}
                santriList={santriList}
                onNotify={notify}
                legacyMonthKeys={legacyBootstrap.monthKeys}
              />
            )}

            {activeTab === 'mushaf' && <MushafQuran />}

            {activeTab === 'santri' && isUstadz && (
              <SantriManagement
                santriList={santriList}
                onDataChanged={refreshReferenceData}
                onNotify={notify}
              />
            )}

            {activeTab === 'kelas' && isUstadz && (
              <KelasManagement
                kelasList={kelasList}
                santriList={santriList}
                userList={userList}
                onDataChanged={refreshReferenceData}
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
      {showPantauanModal && isUstadz && (
        <PantauanLiburanMonitorModal
          isOpen={showPantauanModal}
          onClose={() => setShowPantauanModal(false)}
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
