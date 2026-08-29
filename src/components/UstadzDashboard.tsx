import React from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, ActiveTab } from '../types';
import { Users, CalendarCheck, BookOpen, RotateCw, PlusCircle, ArrowRight, Award, Sparkles } from 'lucide-react';
import { HafalanStatsChart } from './HafalanStatsChart';
import { PesmadLogo } from './PesmadLogo';
import { DashboardSkeleton } from './SkeletonLoading';

interface UstadzDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSantriForZiyadah?: (idSantri: string) => void;
  isLoading?: boolean;
}

export const UstadzDashboard: React.FC<UstadzDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  setActiveTab,
  onSelectSantriForZiyadah,
  isLoading = false
}) => {
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Hitung setoran hari ini
  const today = new Date().toISOString().split('T')[0];
  const todayZiyadah = ziyadahRecords.filter(r => r.timestamp.startsWith(today));
  const todayMurojaah = murojaahRecords.filter(r => r.timestamp.startsWith(today));
  const totalSetoranToday = todayZiyadah.length + todayMurojaah.length;

  // Hitung nilai Sangat Lancar %
  const allRecords = [...ziyadahRecords, ...murojaahRecords];
  const sangatLancarCount = allRecords.filter(r => r.nilai === 'Sangat Lancar').length;
  const lancarPercent = allRecords.length > 0 ? Math.round((sangatLancarCount / allRecords.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center border-2 border-emerald-400/80 shadow-lg flex-shrink-0">
              <PesmadLogo size="lg" className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-emerald-200">
                  Pesantren Madrasah Darul Fikri
                </span>
                <span className="text-xs text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Portal Pembimbing Tahfidz
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-1.5 tracking-tight">
                Ahlan wa Sahlan, {currentUser.nama}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-xl">
                Tahfidz al-Qur'an • MTsN 3 Bojonegoro • Jl. Budi Utomo No. 190 Kepohbaru. Pantau hafalan santri, input setoran Ziyadah & Muroja'ah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setActiveTab('mushaf')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-2 backdrop-blur-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Buka Mushaf</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Statistik Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Santri */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Santri</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">{santriList.length}</h3>
            <span className="text-[10px] text-emerald-700 font-medium">Santri aktif</span>
          </div>
        </div>

        {/* Setoran Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-100/80 text-teal-800 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Setoran Hari Ini</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">{totalSetoranToday}</h3>
            <span className="text-[10px] text-teal-700 font-medium">
              {todayZiyadah.length} Zyd • {todayMurojaah.length} Mrj
            </span>
          </div>
        </div>

        {/* Total Ziyadah */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Ziyadah</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">{ziyadahRecords.length}</h3>
            <span className="text-[10px] text-amber-700 font-medium">Hafalan Baru</span>
          </div>
        </div>

        {/* Kelancaran Rata-rata */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-100/80 text-sky-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Predikat Mumtaz</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">{lancarPercent}%</h3>
            <span className="text-[10px] text-sky-700 font-medium">Sangat Lancar</span>
          </div>
        </div>
      </div>

      {/* Action Shortcut Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form Ziyadah Shortcut */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-800 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
              <PlusCircle className="w-4 h-4 text-emerald-300" />
              <span>Hafalan Baru</span>
            </div>
            <h4 className="text-lg font-bold">Input Setoran Ziyadah</h4>
            <p className="text-xs text-emerald-200/90">Catat surah 1-114, ayat awal & akhir santri</p>
            <button
              onClick={() => setActiveTab('ziyadah')}
              className="mt-3 px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow hover:bg-emerald-50 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Buka Form Ziyadah</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <BookOpen className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        {/* Form Muroja'ah Shortcut */}
        <div className="bg-gradient-to-br from-teal-800 to-cyan-900 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-200">
              <RotateCw className="w-4 h-4 text-teal-300" />
              <span>Pengulangan Hafalan</span>
            </div>
            <h4 className="text-lg font-bold">Input Setoran Muroja'ah</h4>
            <p className="text-xs text-teal-200/90">Evaluasi kelancaran surah / juz yang telah dihafal</p>
            <button
              onClick={() => setActiveTab('murojaah')}
              className="mt-3 px-4 py-2 bg-white text-teal-900 rounded-xl text-xs font-bold shadow hover:bg-teal-50 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Buka Form Muroja'ah</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <RotateCw className="w-8 h-8 text-teal-200" />
          </div>
        </div>
      </div>

      {/* Grafik Statistik Perkembangan Hafalan Recharts */}
      <HafalanStatsChart
        santriList={santriList}
        ziyadahRecords={ziyadahRecords}
        murojaahRecords={murojaahRecords}
      />

      {/* Santri Quick Overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Daftar Santri & Quick Setoran</h3>
            <p className="text-xs text-slate-500">Pilih santri untuk langsung mengisi setoran hafalan</p>
          </div>
          <button
            onClick={() => setActiveTab('santri')}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Kelola Santri</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {santriList.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
            <Users className="w-8 h-8 mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700">Belum Ada Data Santri Terdaftar</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tambahkan data santri baru untuk mulai mencatat setoran hafalan Ziyadah & Muroja'ah.
            </p>
            <button
              onClick={() => setActiveTab('santri')}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Santri Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {santriList.map((santri) => {
              const santriZiyadahCount = ziyadahRecords.filter(r => r.idSantri === santri.idSantri).length;
              const santriMurojaahCount = murojaahRecords.filter(r => r.idSantri === santri.idSantri).length;

              return (
                <div
                  key={santri.idSantri}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {santri.idSantri}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{santri.kelas}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mt-1.5">{santri.namaSantri}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Target: {santri.targetHafalan}</p>
                    
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        📖 {santriZiyadahCount} Ziyadah
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        🔄 {santriMurojaahCount} Muroja'ah
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                        setActiveTab('ziyadah');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold text-center transition cursor-pointer"
                    >
                      + Ziyadah
                    </button>
                    <button
                      onClick={() => {
                        if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                        setActiveTab('murojaah');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold text-center transition cursor-pointer"
                    >
                      + Muroja'ah
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
