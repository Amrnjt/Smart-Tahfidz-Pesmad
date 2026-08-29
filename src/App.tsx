import React, { useState, useEffect } from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, ActiveTab } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LoginView } from './components/LoginModal';
import { UstadzDashboard } from './components/UstadzDashboard';
import { WaliDashboard } from './components/WaliDashboard';
import { ZiyadahForm } from './components/ZiyadahForm';
import { MurojaahForm } from './components/MurojaahForm';
import { HistoryTable } from './components/HistoryTable';
import { MushafQuran } from './components/MushafQuran';
import { SantriManagement } from './components/SantriManagement';
import { GasCodeModal } from './components/GasCodeModal';
import { LayoutDashboard, PlusCircle, RotateCw, History, BookOpen, Users, Code, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [ziyadahRecords, setZiyadahRecords] = useState<ZiyadahRecord[]>([]);
  const [murojaahRecords, setMurojaahRecords] = useState<MurojaahRecord[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [isGasModalOpen, setIsGasModalOpen] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    refreshData();
    const session = storageService.getSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  const refreshData = () => {
    setSantriList(storageService.getSantriList());
    setZiyadahRecords(storageService.getZiyadahRecords());
    setMurojaahRecords(storageService.getMurojaahRecords());
  };

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

  const handleSelectSantriForZiyadah = (idSantri: string) => {
    setSelectedSantriId(idSantri);
  };

  const handleResetData = () => {
    if (confirm('Apakah Anda ingin mereset seluruh data santri & riwayat setoran kembali ke default?')) {
      storageService.resetToDefault();
      refreshData();
      alert('Data berhasil direset ke kondisi awal.');
    }
  };

  const isUstadz = currentUser?.role === 'Ustadz';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950 pb-20 md:pb-10">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenGasModal={() => setIsGasModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 flex-1 space-y-5">
        
        {/* If Not Logged In, Show Login View */}
        {!currentUser ? (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onOpenGasModal={() => setIsGasModalOpen(true)}
          />
        ) : (
          <div className="space-y-5">
            
            {/* Desktop Navigation Tab Bar */}
            <nav className="hidden md:flex bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200/90 gap-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isUstadz ? 'Dashboard Ustadz' : 'Dashboard Anak'}</span>
              </button>

              {isUstadz && (
                <>
                  <button
                    onClick={() => setActiveTab('ziyadah')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'ziyadah'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Input Ziyadah</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('murojaah')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'murojaah'
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Input Muroja'ah</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('riwayat')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'riwayat'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Setoran</span>
              </button>

              <button
                onClick={() => setActiveTab('mushaf')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'mushaf'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Mushaf Al-Qur'an</span>
              </button>

              {isUstadz && (
                <button
                  onClick={() => setActiveTab('santri')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'santri'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Data Santri</span>
                </button>
              )}
            </nav>

            {/* Content per Tab */}
            {activeTab === 'dashboard' && (
              isUstadz ? (
                <UstadzDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  setActiveTab={setActiveTab}
                  onSelectSantriForZiyadah={handleSelectSantriForZiyadah}
                />
              ) : (
                <WaliDashboard
                  currentUser={currentUser}
                  santriList={santriList}
                  ziyadahRecords={ziyadahRecords}
                  murojaahRecords={murojaahRecords}
                  setActiveTab={setActiveTab}
                />
              )
            )}

            {activeTab === 'ziyadah' && isUstadz && (
              <ZiyadahForm
                currentUser={currentUser}
                santriList={santriList}
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
                onDataChanged={refreshData}
              />
            )}

            {activeTab === 'mushaf' && <MushafQuran />}

            {activeTab === 'santri' && isUstadz && (
              <SantriManagement
                santriList={santriList}
                onDataChanged={refreshData}
              />
            )}

            {/* Quick Demo Toolbar (Bottom of Page) */}
            <div className="pt-6 border-t border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Tahfidz al-Qur'an Pesantren Madrasah Darul Fikri • Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsGasModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-800 font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Code className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lihat Kode GAS (4 File)</span>
                  </button>

                  <button
                    onClick={handleResetData}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Kembalikan database simulasi ke awal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Data Demo</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGasModal={() => setIsGasModalOpen(true)}
      />

      {/* GAS Code & Deploy Modal */}
      <GasCodeModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />

    </div>
  );
}
