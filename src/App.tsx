import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { auth, db } from './services/firebase';
import { storageService } from './services/storageService';
import { isStaffRole } from './utils/roles';

import {
  User,
  Santri,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  Kelas,
  ActiveTab,
  WiridYaumiyyahRecord,
  ProgramPantauanConfig,
} from './types';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
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
import { Snackbar, SnackbarState } from './components/Snackbar';

import { useSetoranNotifications } from './hooks/useSetoranNotifications';

import {
  LayoutDashboard,
  CirclePlus as PlusCircle,
  RotateCw,
  BookOpenCheck,
  History,
  BookOpen,
  Users,
  Cloud,
  GraduationCap,
} from 'lucide-react';

import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [ziyadahRecords, setZiyadahRecords] = useState<ZiyadahRecord[]>([]);
  const [murojaahRecords, setMurojaahRecords] = useState<MurojaahRecord[]>([]);
  const [binnadzorRecords, setBinnadzorRecords] = useState<BinnadzorRecord[]>([]);
  const [pembelajaranRecords, setPembelajaranRecords] =
    useState<PembelajaranRecord[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [userList, setUserList] = useState<User[]>([]);

  const [wiridRecords, setWiridRecords] =
    useState<WiridYaumiyyahRecord[]>([]);

  const [pantauanConfig, setPantauanConfig] =
    useState<ProgramPantauanConfig>(
      storageService.getProgramPantauanConfig(),
    );

  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [snack, setSnack] = useState<SnackbarState | null>(null);

  const refreshData = () => {
    setSantriList(storageService.getSantriList());
    setZiyadahRecords(storageService.getZiyadahRecords());
    setMurojaahRecords(storageService.getMurojaahRecords());
    setBinnadzorRecords(storageService.getBinnadzorRecords());
    setPembelajaranRecords(storageService.getPembelajaranRecords());
    setKelasList(storageService.getKelasList());
    setUserList(storageService.getUsers());
    setWiridRecords(storageService.getWiridYaumiyyahRecords());
    setPantauanConfig(storageService.getProgramPantauanConfig());
  };

  const handleTogglePantauan = async (enabled: boolean) => {
    const previousConfig = pantauanConfig;

    const updatedConfig: ProgramPantauanConfig = {
      ...previousConfig,
      id: previousConfig?.id || 'pantauan-config-001',
      isEnabled: enabled,
      lastUpdated: new Date().toISOString(),
      updatedBy:
        currentUser?.nama ||
        currentUser?.username ||
        'Admin',
    };

    setPantauanConfig(updatedConfig);

    try {
      await storageService.setPantauanConfig(updatedConfig);

      setSnack({
        id: `pantauan-${Date.now()}`,
        message: enabled
          ? '✓ Program Pantauan Liburan diaktifkan'
          : 'Program Pantauan Liburan dinonaktifkan',
        type: 'success',
      });

      refreshData();
    } catch (error) {
      console.error(
        'Gagal mengubah status Program Pantauan:',
        error,
      );

      setPantauanConfig(previousConfig);

      setSnack({
        id: `pantauan-error-${Date.now()}`,
        message: 'Gagal memperbarui status Program Pantauan.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    setIsLoadingData(true);

    refreshData();

    if (!currentUser) {
      setIsLoadingData(false);
      return;
    }

    const unsubscribe = storageService.initRealtimeSync(() => {
      refreshData();
      setIsLoadingData(false);
    });

    const timer = window.setTimeout(() => {
      setIsLoadingData(false);
    }, 450);

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let stopAccount: (() => void) | undefined;

    const stopAuth = onAuthStateChanged(auth, (identity) => {
      stopAccount?.();

      if (!identity) {
        setCurrentUser(null);
        return;
      }

      stopAccount = onSnapshot(
        doc(db, 'users', identity.uid),

        (snapshot) => {
          if (!snapshot.exists()) {
            storageService.setSession(null);
            setCurrentUser(null);
            return;
          }

          const {
            password: _password,
            ...profile
          } = snapshot.data();

          const user = {
            ...profile,
            id: snapshot.id,
          } as User;

          storageService.setSession(user);
          setCurrentUser(user);
        },

        (error) => {
          console.error(
            'Account listener error:',
            error,
          );

          storageService.setSession(null);
          setCurrentUser(null);
        },
      );
    });

    return () => {
      stopAccount?.();
      stopAuth();
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setIsLoadingData(true);

    setCurrentUser(user);
    setActiveTab('dashboard');

    refreshData();

    window.setTimeout(() => {
      setIsLoadingData(false);
    }, 300);
  };

  const handleLogout = () => {
    storageService.setSession(null);

    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedSantriId('');
  };

  const handleManualRefresh = () => {
    setIsLoadingData(true);

    try {
      refreshData();

      window.setTimeout(() => {
        setIsLoadingData(false);

        setSnack({
          id: `sync-${Date.now()}`,
          message: '✓ Data berhasil diperbarui',
          type: 'success',
        });
      }, 400);
    } catch (error) {
      console.error(
        'Manual refresh gagal:',
        error,
      );

      setIsLoadingData(false);

      setSnack({
        id: `sync-error-${Date.now()}`,
        message: 'Data belum dapat diperbarui.',
        type: 'error',
        actionLabel: 'Coba Lagi',
        onAction: handleManualRefresh,
      });
    }
  };

  const handleSelectSantriForZiyadah = (idSantri: string) => {
    setSelectedSantriId(idSantri);
  };

  const isUstadz = isStaffRole(currentUser?.role);
  const isWali = currentUser?.role === 'Wali';
  const isSantri = currentUser?.role === 'Santri';

  const {
    toasts,
    dismissToast,
  } = useSetoranNotifications(
    currentUser,
    ziyadahRecords,
    murojaahRecords,
    santriList,
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950 pb-28 sm:pb-32 md:pb-12 relative w-full max-w-full">
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 opacity-60"
        style={{
          background:
            'radial-gradient(1100px circle at 50% -120px, rgba(16, 185, 129, 0.07), rgba(20, 184, 166, 0.035) 45%, transparent 75%), radial-gradient(800px circle at 95% 450px, rgba(20, 184, 166, 0.025), transparent 60%)',
        }}
      />

      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onRefresh={handleManualRefresh}
        isRefreshing={isLoadingData}
      />

      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 flex-1 space-y-5 relative z-10 min-w-0">
        {!currentUser ? (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <div className="space-y-5 min-w-0">
            <nav className="hidden md:flex bg-white/85 backdrop-blur-md rounded-2xl p-1.5 shadow-xs border border-slate-200/80 gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />

                <span>
                  {isUstadz && 'Dashboard'}
                  {isWali && 'Pantauan Hafalan Anak'}
                  {isSantri && 'Hafalan Saya'}
                </span>
              </button>

              {isUstadz && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ziyadah')}
                    className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'ziyadah'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Input Ziyadah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('murojaah')}
                    className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'murojaah'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Input Muroja'ah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('binnadzor')}
                    className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'binnadzor'
                        ? 'bg-indigo-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpenCheck className="w-4 h-4" />
                    <span>Input Binnadzor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pembelajaran')}
                    className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'pembelajaran'
                        ? 'bg-amber-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Input Pembelajaran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('kelas')}
                    className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'kelas'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Kelas</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'riwayat'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Setoran</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mushaf')}
                className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'mushaf'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Mushaf Al-Qur'an 30 Juz</span>
              </button>

              {isUstadz && (
                <button
                  type="button"
                  onClick={() => setActiveTab('santri')}
                  className={`press-feedback flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'santri'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Santri & Kelola Akun</span>
                </button>
              )}
            </nav>

            {activeTab === 'dashboard' &&
              (isUstadz ? (
                <UstadzDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  binnadzorRecords={binnadzorRecords}
                  pembelajaranRecords={pembelajaranRecords}
                  kelasList={kelasList}
                  pantauanEnabled={
                    pantauanConfig?.isEnabled ?? false
                  }
                  onTogglePantauan={handleTogglePantauan}
                  setActiveTab={setActiveTab}
                  onSelectSantriForZiyadah={
                    handleSelectSantriForZiyadah
                  }
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
                  wiridRecords={wiridRecords}
                  pantauanEnabled={
                    pantauanConfig?.isEnabled ?? false
                  }
                  onDataChanged={refreshData}
                  setActiveTab={setActiveTab}
                  isLoading={isLoadingData}
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
              ))}

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
              />
            )}

            {activeTab === 'mushaf' && (
              <MushafQuran />
            )}

            {activeTab === 'santri' && isUstadz && (
              <SantriManagement
                currentUser={currentUser}
                santriList={santriList}
                onDataChanged={refreshData}
              />
            )}

            {activeTab === 'kelas' && isUstadz && (
              <KelasManagement
                kelasList={kelasList}
                santriList={santriList}
                userList={userList}
                onDataChanged={refreshData}
              />
            )}

            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

                  <span>
                    Tahfidz al-Qur'an Pesantren Madrasah Darul
                    Fikri • Jl. Budi Utomo No. 190 Kepohbaru
                    Bojonegoro
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] font-semibold">
                  <Cloud className="w-3.5 h-3.5 text-emerald-700" />

                  <span>
                    Cloud Database Firestore Terhubung
                    (Real-Time Multi-Device)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {isWali && (
        <NotificationToastContainer
          toasts={toasts}
          onDismiss={dismissToast}
        />
      )}

      <Snackbar
        snack={snack}
        onDismiss={() => setSnack(null)}
      />

      <Analytics />
    </div>
  );
}