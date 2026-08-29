import React from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, ActiveTab } from '../types';
import { ZiyadahProgressChart } from './ZiyadahProgressChart';
import { BookOpen, RotateCw, Award, Target, Calendar, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';
import { formatTanggalWaktu } from '../utils/dateFormatter';
import { SantriWaliDashboardSkeleton } from './SkeletonLoading';

interface WaliDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  isLoading?: boolean;
}

export const WaliDashboard: React.FC<WaliDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  setActiveTab,
  isLoading = false
}) => {
  if (isLoading) {
    return <SantriWaliDashboardSkeleton role="Wali" />;
  }

  const targetSantri = santriList.find(s => s.idSantri === currentUser.idSantri) || {
    idSantri: currentUser.idSantri || 'STR001',
    namaSantri: currentUser.nama.replace('Wali ', ''),
    kelas: 'Tahfidz A (Ikhwan)',
    targetHafalan: 'Juz 30 (37 Surah)'
  };

  const santriZiyadah = ziyadahRecords.filter(r => r.idSantri === targetSantri.idSantri);
  const santriMurojaah = murojaahRecords.filter(r => r.idSantri === targetSantri.idSantri);

  const lastZiyadah = santriZiyadah[0];
  const lastMurojaah = santriMurojaah[0];

  // Hitung persentase progres (perkiraan berdasarkan capaian surah)
  const estimatedProgressPercent = Math.min(100, Math.max(35, santriZiyadah.length * 8));

  return (
    <div className="space-y-6">
      {/* Banner Profil Anak */}
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
                  Laporan Perkembangan Tahfidz • MTsN 3 Bojonegoro
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-1.5 tracking-tight">
                {targetSantri.namaSantri}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                Kelas: <span className="font-semibold text-white">{targetSantri.kelas}</span> • ID Santri: <span className="font-mono text-amber-300 font-semibold">{targetSantri.idSantri}</span> • <span className="text-emerald-300">Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center self-start sm:self-auto">
            <span className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
              Target Kelulusan
            </span>
            <p className="text-sm font-extrabold text-amber-300 mt-0.5">
              {targetSantri.targetHafalan}
            </p>
          </div>
        </div>

        {/* Progres Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-700/60">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-300" />
              Progres Capaian Hafalan Al-Qur'an
            </span>
            <span className="text-amber-300 font-bold">{estimatedProgressPercent}% Selesai</span>
          </div>
          <div className="w-full h-3.5 bg-emerald-950/70 rounded-full overflow-hidden p-0.5 border border-emerald-600/40">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${estimatedProgressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Ringkasan 3 Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ziyadah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Setoran Ziyadah</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              {santriZiyadah.length} Kali
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium">Hafalan baru dicatat</span>
          </div>
        </div>

        {/* Total Muroja'ah */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100/90 text-teal-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Muroja'ah</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              {santriMurojaah.length} Kali
            </h3>
            <span className="text-[10px] text-teal-700 font-medium">Pengulangan hafalan</span>
          </div>
        </div>

        {/* Predikat Kelancaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Kualitas Hafalan</p>
            <h3 className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5">
              🟢 Sangat Baik
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Tajwid & makhraj mantap</span>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Progres Ziyadah Menggunakan Recharts */}
      <ZiyadahProgressChart
        ziyadahRecords={santriZiyadah}
        santriName={targetSantri.namaSantri}
        isSantriView={false}
      />

      {/* Detail Setoran Terakhir */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Setoran Ziyadah Terakhir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-slate-800 text-sm">Setoran Ziyadah Terakhir</h4>
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              <Calendar className="w-3 h-3 text-emerald-600" />
              {lastZiyadah ? formatTanggalWaktu(lastZiyadah.timestamp) : '-'}
            </span>
          </div>

          {lastZiyadah ? (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-emerald-950">
                  {lastZiyadah.surah} (Ayat {lastZiyadah.ayatAwal} - {lastZiyadah.ayatAkhir})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  {lastZiyadah.nilai}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic">"{lastZiyadah.catatan}"</p>
              <div className="text-[10px] text-emerald-800 font-medium pt-1">
                Dicatat oleh: {lastZiyadah.inputBy}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan Ziyadah.</p>
          )}
        </div>

        {/* Setoran Muroja'ah Terakhir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-teal-700" />
              <h4 className="font-bold text-slate-800 text-sm">Setoran Muroja'ah Terakhir</h4>
            </div>
            <span className="text-[11px] text-teal-800 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
              <Calendar className="w-3 h-3 text-teal-600" />
              {lastMurojaah ? formatTanggalWaktu(lastMurojaah.timestamp) : '-'}
            </span>
          </div>

          {lastMurojaah ? (
            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-teal-950">
                  {lastMurojaah.surahAtauJuz}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 font-bold text-[10px]">
                  {lastMurojaah.nilai}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic">"{lastMurojaah.catatan}"</p>
              <div className="text-[10px] text-teal-800 font-medium pt-1">
                Dicatat oleh: {lastMurojaah.inputBy}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan Muroja'ah.</p>
          )}
        </div>
      </div>

      {/* Quick Action to Mushaf */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-base">Ingin menyimak bacaan ananda di rumah?</h4>
          <p className="text-xs text-emerald-200">
            Buka Mushaf Al-Qur'an Digital 30 Juz lengkap dengan teks Arab, Latin, Terjemahan, dan Audio Murattal.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('mushaf')}
          className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow hover:bg-emerald-50 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Buka Mushaf Digital</span>
        </button>
      </div>
    </div>
  );
};
