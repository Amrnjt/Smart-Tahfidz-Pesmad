import React from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, ActiveTab } from '../types';
import { ZiyadahProgressChart } from './ZiyadahProgressChart';
import { BookOpen, RotateCw, BookOpenCheck, Award, Sparkles, BookMarked, Calendar, GraduationCap } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';
import { formatTanggalWaktu } from '../utils/dateFormatter';
import { SantriWaliDashboardSkeleton } from './SkeletonLoading';
import { AnimatedCounter } from './AnimatedCounter';
import { ScrollReveal } from './ScrollReveal';
import { useRipple } from '../hooks/useRipple';

interface SantriDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  isLoading?: boolean;
}

export const SantriDashboard: React.FC<SantriDashboardProps> = ({
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
    return <SantriWaliDashboardSkeleton role="Santri" />;
  }

  const currentSantri = santriList.find(s => s.idSantri === currentUser.idSantri);

  if (!currentSantri) {
    return (
      <div
        className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xs"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-base font-extrabold text-slate-900">Profil santri belum terhubung</h2>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          Akun ini belum terhubung ke profil santri yang tersedia. Hubungi admin untuk memeriksa relasi ID santri sebelum melihat data hafalan.
        </p>
        <p className="mt-3 text-xs font-semibold text-emerald-800">
          ID terhubung: {currentUser.idSantri || currentUser.username || 'Tidak tersedia'}
        </p>
      </div>
    );
  }

  const santriZiyadah = ziyadahRecords.filter(r => r.idSantri === currentSantri.idSantri);
  const santriMurojaah = murojaahRecords.filter(r => r.idSantri === currentSantri.idSantri);
  const santriBinnadzor = binnadzorRecords.filter(r => r.idSantri === currentSantri.idSantri);
  const santriPembelajaran = pembelajaranRecords.filter(r => r.idSantri === currentSantri.idSantri);

  const lastZiyadah = santriZiyadah[0];
  const lastMurojaah = santriMurojaah[0];
  const lastBinnadzor = santriBinnadzor[0];
  const lastPembelajaran = santriPembelajaran[0];

  const latestRatedRecord = [
    ...santriZiyadah,
    ...santriMurojaah,
    ...santriBinnadzor,
    ...santriPembelajaran
  ]
    .filter(record => Boolean(record.nilai))
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0];

  const fadeDelay = (index: number) => ({ animationDelay: `${100 + index * 80}ms` });

  return (
    <div className="space-y-6">
      {/* Banner Profil Santri - Hero Card */}
      <div className="hero-animated-bg bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-950 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden fade-in-up" style={fadeDelay(0)}>
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-800/80 border border-cyan-500/50 text-cyan-200">
                  Akses Santri • MTsN 3 Bojonegoro
                </span>
                <span className="text-xs text-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Pesantren Madrasah Darul Fikri
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-1.5 tracking-tight">
                Ahlan wa Sahlan, {currentSantri.namaSantri}!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
                Kelas: <span className="font-semibold text-white">{currentSantri.kelas || 'Belum ditetapkan'}</span> • NIS/ID: <span className="font-mono text-amber-300 font-semibold">{currentSantri.idSantri}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center self-start sm:self-auto">
            <span className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
              Target Hafalan Kamu
            </span>
            <p className="text-sm font-extrabold text-amber-300 mt-0.5">
              {currentSantri.targetHafalan || 'Belum ditetapkan'}
            </p>
          </div>
        </div>

      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(1)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Ziyadah Saya</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={santriZiyadah.length} /> Kali
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium">Hafalan ayat baru</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(2)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Muroja'ah Saya</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={santriMurojaah.length} /> Kali
            </h3>
            <span className="text-[10px] text-teal-700 font-medium">Pengulangan hafalan</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(3)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Binnadzor Saya</p>
            <h3 className="text-lg sm:text-2xl font-extrabold text-indigo-900 mt-0.5">
              <AnimatedCounter value={santriBinnadzor.length} /> Kali
            </h3>
            <span className="text-[10px] text-indigo-700 font-medium">Membaca mushaf</span>
          </div>
        </div>

        {santriPembelajaran.length > 0 && (
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(3.5)}>
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Pembelajaran Saya</p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-amber-900 mt-0.5">
                <AnimatedCounter value={santriPembelajaran.length} /> Kali
              </h3>
              <span className="text-[10px] text-amber-700 font-medium">Ummi / Istimewa</span>
            </div>
          </div>
        )}

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 sm:gap-4 fade-in-up" style={fadeDelay(4)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Penilaian Terakhir</p>
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-0.5 truncate">
              {latestRatedRecord?.nilai || 'Belum ada'}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              {latestRatedRecord ? 'Berdasarkan setoran terbaru' : 'Belum ada setoran dinilai'}
            </span>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik */}
      <ScrollReveal>
        <ZiyadahProgressChart
          ziyadahRecords={santriZiyadah}
          santriName={currentSantri.namaSantri}
          isSantriView={true}
        />
      </ScrollReveal>

      {/* Detail Setoran Terakhir */}
      <ScrollReveal delay={100}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ziyadah Terakhir */}
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
                <h4 className="font-bold text-slate-800 text-sm">Muroja'ah Terakhir</h4>
              </div>
              <span className="text-[11px] text-teal-800 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                <Calendar className="w-3 h-3 text-teal-600" />
                {lastMurojaah ? formatTanggalWaktu(lastMurojaah.timestamp) : '-'}
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

          {/* Binnadzor Terakhir */}
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
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-indigo-950">
                    {lastBinnadzor.surahAtauHalaman || lastBinnadzor.materi}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-bold text-[10px]">
                    {lastBinnadzor.nilai}
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic">"{lastBinnadzor.catatan}"</p>
                <div className="text-[10px] text-indigo-800 font-medium pt-1">
                  Disimak oleh: {lastBinnadzor.inputBy}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Belum ada catatan Binnadzor.</p>
            )}
          </div>

          {/* Pembelajaran Terakhir */}
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

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 space-y-2">
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
                <p className="text-xs text-slate-700 italic">"{lastPembelajaran.catatan}"</p>
                <div className="text-[10px] text-amber-800 font-medium pt-1">
                  Disimak oleh: {lastPembelajaran.inputBy}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* CTA Mushaf */}
      <ScrollReveal delay={100}>
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
            ref={mushafRipple.elementRef}
            onClick={(e) => { mushafRipple.createRipple(e); setActiveTab('mushaf'); }}
            className="ripple-container press-feedback px-6 py-3 rounded-2xl bg-white text-emerald-950 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>Buka Mushaf 30 Juz</span>
          </button>
        </div>
      </ScrollReveal>

      {/* Motivational Hadith */}
      <ScrollReveal delay={100}>
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-center space-y-1">
          <p className="font-amiri text-base text-emerald-950 font-bold">
            خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
          </p>
          <p className="text-xs text-emerald-800 font-medium">
            "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)
          </p>
        </div>
      </ScrollReveal>
    </div>
  );
};
