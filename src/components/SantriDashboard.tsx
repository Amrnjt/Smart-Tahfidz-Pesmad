import React from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, ActiveTab } from '../types';
import { BookOpen, RotateCw, Award, Target, Sparkles, CheckCircle2, ChevronRight, BookMarked, Heart, Volume2 } from 'lucide-react';

interface SantriDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  setActiveTab: (tab: ActiveTab) => void;
}

export const SantriDashboard: React.FC<SantriDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  setActiveTab
}) => {
  const currentSantri = santriList.find(s => s.idSantri === currentUser.idSantri) || {
    idSantri: currentUser.idSantri || currentUser.username,
    namaSantri: currentUser.nama,
    kelas: 'Tahfidz Al-Qur\'an',
    targetHafalan: 'Juz 30 (37 Surah)'
  };

  const santriZiyadah = ziyadahRecords.filter(r => r.idSantri === currentSantri.idSantri);
  const santriMurojaah = murojaahRecords.filter(r => r.idSantri === currentSantri.idSantri);

  const lastZiyadah = santriZiyadah[0];
  const lastMurojaah = santriMurojaah[0];

  // Hitung persentase progres (perkiraan berdasarkan capaian surah)
  const estimatedProgressPercent = Math.min(100, Math.max(30, santriZiyadah.length * 9));

  return (
    <div className="space-y-6">
      {/* Banner Profil Santri */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-950 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-800/80 border border-cyan-500/50 text-cyan-200">
                Akses Santri • View-Only
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Pesantren Madrasah Darul Fikri
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-2 tracking-tight">
              Ahlan wa Sahlan, {currentSantri.namaSantri}!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
              Kelas: <span className="font-semibold text-white">{currentSantri.kelas}</span> • NIS/ID: <span className="font-mono text-amber-300 font-semibold">{currentSantri.idSantri}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center self-start sm:self-auto">
            <span className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
              Target Hafalan Kamu
            </span>
            <p className="text-sm font-extrabold text-amber-300 mt-0.5">
              {currentSantri.targetHafalan}
            </p>
          </div>
        </div>

        {/* Progres Bar Capaian Santri */}
        <div className="mt-6 pt-5 border-t border-teal-700/60">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-300" />
              Progres Capaian Setoran Hafalan
            </span>
            <span className="text-amber-300 font-bold">{estimatedProgressPercent}% Menuju Target</span>
          </div>
          <div className="w-full h-3.5 bg-emerald-950/80 rounded-full overflow-hidden p-0.5 border border-emerald-600/40">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-300 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${estimatedProgressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Setoran Ziyadah Saya */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Setoran Ziyadah Saya</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              {santriZiyadah.length} Kali
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium">Hafalan ayat baru</span>
          </div>
        </div>

        {/* Setoran Muroja'ah Saya */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Setoran Muroja'ah Saya</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              {santriMurojaah.length} Kali
            </h3>
            <span className="text-[10px] text-teal-700 font-medium">Pengulangan hafalan</span>
          </div>
        </div>

        {/* Predikat Kelancaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Predikat Terakhir</p>
            <h3 className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5">
              {lastZiyadah?.nilai ? `🟢 ${lastZiyadah.nilai}` : '🟢 Aktif Menghafal'}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Istiqomah & semangat!</span>
          </div>
        </div>
      </div>

      {/* Detail Setoran Terakhir & Evaluasi Ustadz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ziyadah Terakhir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h4 className="font-bold text-slate-800 text-sm">Ziyadah Terakhir Kamu</h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {lastZiyadah ? lastZiyadah.timestamp : '-'}
            </span>
          </div>

          {lastZiyadah ? (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-emerald-950">
                  {lastZiyadah.surah} (Ayat {lastZiyadah.ayatAwal} - {lastZiyadah.ayatAkhir})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                  {lastZiyadah.nilai}
                </span>
              </div>
              <p className="text-xs text-slate-700 italic">"{lastZiyadah.catatan}"</p>
              <div className="text-[10px] text-emerald-800 font-medium pt-1">
                Disimak oleh: {lastZiyadah.inputBy}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan Ziyadah.</p>
          )}
        </div>

        {/* Muroja'ah Terakhir */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-teal-700" />
              <h4 className="font-bold text-slate-800 text-sm">Muroja'ah Terakhir Kamu</h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {lastMurojaah ? lastMurojaah.timestamp : '-'}
            </span>
          </div>

          {lastMurojaah ? (
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-teal-950">
                  {lastMurojaah.surahAtauJuz}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 font-bold text-[10px]">
                  {lastMurojaah.nilai}
                </span>
              </div>
              <p className="text-xs text-slate-700 italic">"{lastMurojaah.catatan}"</p>
              <div className="text-[10px] text-teal-800 font-medium pt-1">
                Disimak oleh: {lastMurojaah.inputBy}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan Muroja'ah.</p>
          )}
        </div>
      </div>

      {/* CTA Mushaf Al-Quran & Muraja'ah Mandiri */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-amber-300" />
            <h4 className="font-extrabold text-base sm:text-lg">Mau muroja'ah atau menghafal surah berikutnya?</h4>
          </div>
          <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
            Buka Mushaf Al-Qur'an 30 Juz lengkap dengan teks Arab resmi Kemenag, transliterasi Latin, terjemahan bahasa Indonesia, dan audio murattal per ayat.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('mushaf')}
          className="px-6 py-3 rounded-2xl bg-white text-emerald-950 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <span>Buka Mushaf 30 Juz</span>
        </button>
      </div>

      {/* Motivational Hadith */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-1">
        <p className="font-amiri text-base text-emerald-950 font-bold">
          خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
        </p>
        <p className="text-xs text-emerald-800 font-medium">
          "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)
        </p>
      </div>
    </div>
  );
};
