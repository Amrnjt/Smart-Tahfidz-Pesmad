import React from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, ActiveTab } from '../types';
import { ZiyadahProgressChart } from './ZiyadahProgressChart';
import { BookOpen, RotateCw, BookOpenCheck, Award, Target, Calendar, CircleCheck as CheckCircle2, ChevronRight, Sparkles, GraduationCap } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';
import { formatTanggalWaktu } from '../utils/dateFormatter';
import { SantriWaliDashboardSkeleton } from './SkeletonLoading';
import { AnimatedCounter } from './AnimatedCounter';
import { ScrollReveal } from './ScrollReveal';
import { useRipple } from '../hooks/useRipple';
import { PantauanLiburanWaliSection } from './PantauanLiburanWaliSection';
import { storageService } from '../services/storageService';

interface WaliDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  isLoading?: boolean;
}

export const WaliDashboard: React.FC<WaliDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  setActiveTab,
  isLoading = false
}) => {
  const mushafRipple = useRipple<HTMLButtonElement>();

  if (isLoading) {
    return <SantriWaliDashboardSkeleton role="Wali" />;
  }

  const targetSantri = santriList.find(s => s.idSantri === currentUser.idSantri) || {
    idSantri: currentUser.idSantri || 'STR001',
    namaSantri: currentUser.nama.replace('Wali ', ''),
    kelas: 'Tahfidz',
    targetHafalan: 'Juz 30 (37 Surah)'
  };

  const santriZiyadah = ziyadahRecords.filter(r => r.idSantri === targetSantri.idSantri);
  const santriMurojaah = murojaahRecords.filter(r => r.idSantri === targetSantri.idSantri);
  const santriBinnadzor = binnadzorRecords.filter(r => r.idSantri === targetSantri.idSantri);
  const santriPembelajaran = pembelajaranRecords.filter(r => r.idSantri === targetSantri.idSantri);

  const lastZiyadah = santriZiyadah[0];
  const lastMurojaah = santriMurojaah[0];
  const lastBinnadzor = santriBinnadzor[0];
  const lastPembelajaran = santriPembelajaran[0];

  const estimatedProgressPercent = Math.min(100, Math.max(35, santriZiyadah.length * 8));

  const fadeDelay = (index: number) => ({ animationDelay: `${100 + index * 80}ms` });

  return (
    <div className="space-y-6">
      {/* Banner Profil Anak - Hero Card */}
      <div className="hero-animated-bg bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden fade-in-up" style={fadeDelay(0)}>
        {/* Decorative Islamic pattern */}
        <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.04] pointer-events-none float-slow">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.5" />
            <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" stroke="white" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

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
            <span className="text-amber-300 font-bold">
              <AnimatedCounter value={estimatedProgressPercent} suffix="%" /> Selesai
            </span>
          </div>
          <div className="w-full h-3.5 bg-emerald-950/70 rounded-full overflow-hidden p-0.5 border border-emerald-600/40">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-300 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${estimatedProgressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Ringkasan 4 Card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(1)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Setoran Ziyadah</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={santriZiyadah.length} /> Kali
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium">Hafalan baru</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(2)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-100/90 text-teal-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Setoran Muroja'ah</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={santriMurojaah.length} /> Kali
            </h3>
            <span className="text-[10px] text-teal-700 font-medium">Pengulangan</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(3)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100/90 text-indigo-800 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Setoran Binnadzor</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-indigo-900 mt-0.5">
              <AnimatedCounter value={santriBinnadzor.length} /> Kali
            </h3>
            <span className="text-[10px] text-indigo-700 font-medium">Membaca al-Qur'an</span>
          </div>
        </div>

        {santriPembelajaran.length > 0 && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(3.5)}>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pembelajaran</p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-amber-900 mt-0.5">
                <AnimatedCounter value={santriPembelajaran.length} /> Kali
              </h3>
              <span className="text-[10px] text-amber-700 font-medium">Ummi / Istimewa</span>
            </div>
          </div>
        )}

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(4)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Kualitas Hafalan</p>
            <h3 className="text-sm sm:text-lg font-extrabold text-emerald-700 mt-0.5">
              🟢 Sangat Baik
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">Tajwid & makhraj</span>
          </div>
        </div>
      </div>

      {/* Program Pantauan Liburan Santri (Wirid 3 Surah & Shalat 5 Waktu Berjama'ah) */}
      <ScrollReveal delay={50}>
        <PantauanLiburanWaliSection
          currentUser={currentUser}
          targetSantri={targetSantri}
          isActive={storageService.getAppConfig().programLiburanActive}
        />
      </ScrollReveal>

      {/* Visualisasi Grafik */}
      <ScrollReveal>
        <ZiyadahProgressChart
          ziyadahRecords={santriZiyadah}
          santriName={targetSantri.namaSantri}
          isSantriView={false}
        />
      </ScrollReveal>

      {/* Detail Setoran Terakhir */}
      <ScrollReveal delay={100}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Setoran Ziyadah Terakhir */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-800 text-sm">Ziyadah Terakhir</h4>
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
                <h4 className="font-bold text-slate-800 text-sm">Muroja'ah Terakhir</h4>
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

          {/* Setoran Binnadzor Terakhir */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-indigo-700" />
                <h4 className="font-bold text-slate-800 text-sm">Binnadzor Terakhir</h4>
              </div>
              <span className="text-[11px] text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                <Calendar className="w-3 h-3 text-indigo-600" />
                {lastBinnadzor ? formatTanggalWaktu(lastBinnadzor.timestamp) : '-'}
              </span>
            </div>

            {lastBinnadzor ? (
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-indigo-950">
                    {lastBinnadzor.surahAtauHalaman || lastBinnadzor.materi}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-bold text-[10px]">
                    {lastBinnadzor.nilai}
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic">"{lastBinnadzor.catatan}"</p>
                <div className="text-[10px] text-indigo-800 font-medium pt-1">
                  Dicatat oleh: {lastBinnadzor.inputBy}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan Binnadzor.</p>
            )}
          </div>

          {/* Sesi Pembelajaran Terakhir (Ummi / Kelas Khusus) */}
          {lastPembelajaran && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-700" />
                  <h4 className="font-bold text-slate-800 text-sm">Pembelajaran Terakhir</h4>
                </div>
                <span className="text-[11px] text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  {formatTanggalWaktu(lastPembelajaran.timestamp)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-amber-950">
                    {lastPembelajaran.materi} (Hal. {lastPembelajaran.halaman})
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                    {lastPembelajaran.nilai}
                  </span>
                </div>
                {lastPembelajaran.statusKenaikan && (
                  <div className="text-[11px] font-bold text-emerald-700">
                    Status: {lastPembelajaran.statusKenaikan}
                  </div>
                )}
                <p className="text-xs text-slate-600 italic">"{lastPembelajaran.catatan}"</p>
                <div className="text-[10px] text-amber-800 font-medium pt-1">
                  Dicatat oleh: {lastPembelajaran.inputBy}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Quick Action to Mushaf */}
      <ScrollReveal delay={100}>
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-base">Ingin menyimak bacaan ananda di rumah?</h4>
            <p className="text-xs text-emerald-200">
              Buka Mushaf Al-Qur'an Digital 30 Juz lengkap dengan teks Arab, Latin, Terjemahan, dan Audio Murattal.
            </p>
          </div>
          <button
            ref={mushafRipple.elementRef}
            onClick={(e) => { mushafRipple.createRipple(e); setActiveTab('mushaf'); }}
            className="ripple-container press-feedback px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow hover:bg-emerald-50 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>Buka Mushaf Digital</span>
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
};
