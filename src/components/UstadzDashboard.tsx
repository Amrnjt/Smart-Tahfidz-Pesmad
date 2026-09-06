import React, { useState } from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, ActiveTab, Kelas } from '../types';
import { Users, CalendarCheck, BookOpen, RotateCw, CirclePlus as PlusCircle, BookOpenCheck, ArrowRight, Award, Sparkles, GraduationCap, TrendingUp, ChartBar as BarChart3, Moon } from 'lucide-react';
import { getClassGroup, isNonTahfidzClass } from '../utils/classUtils';
import { HafalanStatsChart } from './HafalanStatsChart';
import { TrenHafalanBulananChart } from './TrenHafalanBulananChart';
import { PesmadLogo } from './PesmadLogo';
import { DashboardSkeleton } from './SkeletonLoading';
import { AnimatedCounter } from './AnimatedCounter';
import { ScrollReveal } from './ScrollReveal';
import { useRipple } from '../hooks/useRipple';

interface UstadzDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  kelasList: Kelas[];
  pantauanEnabled?: boolean;
  onTogglePantauan?: (enabled: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSantriForZiyadah?: (idSantri: string) => void;
  isLoading?: boolean;
}

export const UstadzDashboard: React.FC<UstadzDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  kelasList,
  pantauanEnabled = false,
  onTogglePantauan,
  setActiveTab,
  onSelectSantriForZiyadah,
  isLoading = false
}) => {
  const mushafRipple = useRipple<HTMLButtonElement>();
  const ziyadahBtnRipple = useRipple<HTMLButtonElement>();
  const murojaahBtnRipple = useRipple<HTMLButtonElement>();
  const binnadzorBtnRipple = useRipple<HTMLButtonElement>();
  const pembelajaranBtnRipple = useRipple<HTMLButtonElement>();
  const [chartView, setChartView] = useState<'tren_hafalan' | 'aktivitas'>('tren_hafalan');

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayZiyadah = ziyadahRecords.filter(r => r.timestamp.startsWith(today));
  const todayMurojaah = murojaahRecords.filter(r => r.timestamp.startsWith(today));
  const todayBinnadzor = binnadzorRecords.filter(r => r.timestamp.startsWith(today));
  const todayPembelajaran = pembelajaranRecords.filter(r => r.timestamp.startsWith(today));
  const totalSetoranToday = todayZiyadah.length + todayMurojaah.length + todayBinnadzor.length + todayPembelajaran.length;

  const allRecords = [...ziyadahRecords, ...murojaahRecords, ...binnadzorRecords, ...pembelajaranRecords];
  const sangatBaikCount = allRecords.filter(r => r.nilai === 'Sangat Baik').length;
  const lancarPercent = allRecords.length > 0 ? Math.round((sangatBaikCount / allRecords.length) * 100) : 100;

  const fadeDelay = (index: number) => ({
    animationDelay: `${index * 55}ms`,
  });

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
      {/* Welcome Banner - Hero Card */}
      <div className="hero-animated-bg bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 text-white shadow-md relative overflow-hidden fade-in-up w-full max-w-full min-w-0" style={fadeDelay(0)}>
        {/* Decorative Islamic pattern overlay - kept faint and subtle */}
        <div className="absolute top-0 right-0 w-36 h-36 sm:w-48 sm:h-48 opacity-[0.035] pointer-events-none float-slow overflow-hidden">
          <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.5" />
            <path d="M50 10 L60 40 L90 50 L60 60 L50 90 L40 60 L10 50 L40 40 Z" stroke="white" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 relative z-10 w-full min-w-0">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center border-2 border-emerald-400/80 shadow-lg flex-shrink-0">
              <PesmadLogo size="lg" className="w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap max-w-full">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-emerald-200 truncate max-w-full">
                  Pesantren Madrasah Darul Fikri
                </span>
                <span className="text-[10px] sm:text-xs text-emerald-200 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />
                  <span>Portal Pembimbing Tahfidz</span>
                </span>
              </div>
              <h2 className="text-base sm:text-xl md:text-2xl font-extrabold mt-1 sm:mt-1.5 tracking-tight break-words">
                Ahlan wa Sahlan, {currentUser.nama}
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm text-emerald-200/90 mt-1 max-w-xl leading-relaxed">
                Tahfidz al-Qur'an • MTsN 3 Bojonegoro • Jl. Budi Utomo No. 190 Kepohbaru. Pantau hafalan santri, input setoran Ziyadah &amp; Muroja'ah.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0 pt-0.5 sm:pt-0">
            <button
              ref={mushafRipple.elementRef}
              onClick={(e) => { mushafRipple.createRipple(e); setActiveTab('mushaf'); }}
              className="ripple-container press-feedback px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-2 backdrop-blur-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Buka Mushaf</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistik Cards with Responsive Grid: 7 cols (≥1280px), 4 cols (900–1279px), 2 cols (<900px) */}
      <div className="grid grid-cols-2 min-[768px]:grid-cols-3 min-[1100px]:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3.5 lg:gap-4 w-full min-w-0">
        {/* 1. Total Santri - Neutral Slate */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-slate-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(1)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Total Santri
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              <AnimatedCounter value={santriList.length} />
            </h3>
            <span className="text-[10px] text-slate-500 font-medium block truncate">Santri aktif</span>
          </div>
        </div>

        {/* 2. Total Ziyadah - Fresh Emerald Green */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-emerald-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(2)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Total Ziyadah
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              <AnimatedCounter value={ziyadahRecords.length} />
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium block truncate">Hafalan baru</span>
          </div>
        </div>

        {/* 3. Total Muroja'ah - Warm Amber Gold / Burnt Orange */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-amber-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(3)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Total Muroja'ah
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              <AnimatedCounter value={murojaahRecords.length} />
            </h3>
            <span className="text-[10px] text-amber-700 font-medium block truncate">Pengulangan</span>
          </div>
        </div>

        {/* 4. Total Binnadzor - Royal Indigo / Violet */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-indigo-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(4)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Total Binnadzor
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-indigo-950 tracking-tight mt-0.5">
              <AnimatedCounter value={binnadzorRecords.length} />
            </h3>
            <span className="text-[10px] text-indigo-700 font-medium block truncate">Fokus tajwid</span>
          </div>
        </div>

        {/* 5. Total Pembelajaran Non-Tahfidz - Vibrant Orange */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-orange-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(5)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Pembelajaran
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-orange-950 tracking-tight mt-0.5">
              <AnimatedCounter value={pembelajaranRecords.length} />
            </h3>
            <span className="text-[10px] text-orange-700 font-medium block truncate">Jilid &amp; Istimewa</span>
          </div>
        </div>

        {/* 6. Setoran Hari Ini - Vibrant Coral Rose / Crimson */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-rose-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(6)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Hari Ini
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              <AnimatedCounter value={totalSetoranToday} />
            </h3>
            <span className="text-[10px] text-rose-700 font-medium truncate block" title={`${todayZiyadah.length} Zyd • ${todayMurojaah.length} Mrj • ${todayBinnadzor.length} Bnz • ${todayPembelajaran.length} Pbl`}>
              {todayZiyadah.length}Z • {todayMurojaah.length}M • {todayBinnadzor.length}B • {todayPembelajaran.length}P
            </span>
          </div>
        </div>

        {/* 7. Predikat Mumtaz - Bright Sky / Azure Blue */}
        <div className="bg-white/85 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5 sm:gap-3 hover:border-sky-300 transition-all fade-in-up h-full min-w-0 w-full" style={fadeDelay(7)}>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 leading-snug line-clamp-2">
              Mumtaz
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              <AnimatedCounter value={lancarPercent} suffix="%" />
            </h3>
            <span className="text-[10px] text-sky-700 font-medium block truncate">Sangat Baik ({sangatBaikCount})</span>
          </div>
        </div>
      </div>

      {/* Program Pantauan Liburan Santri - Master Switch */}
      <ScrollReveal>
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${pantauanEnabled ? 'bg-indigo-800 text-amber-300' : 'bg-slate-100 text-slate-400'}`}>
              <Moon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-slate-800">Program Pantauan Liburan Santri</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pantauanEnabled ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                  {pantauanEnabled ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Aktifkan saat libur pesantren agar Wali Santri dapat memantau wirid Yaumiyyah (al-Waqi'ah, al-Mulk, al-Insyirah) &amp; keaktifan shalat berjama'ah ananda. Saat nonaktif, fitur ini tersembunyi di dasbor Wali.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={pantauanEnabled}
            aria-label="Aktifkan Program Pantauan Liburan Santri"
            onClick={() => onTogglePantauan && onTogglePantauan(!pantauanEnabled)}
            className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${pantauanEnabled ? 'bg-indigo-700' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${pantauanEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </ScrollReveal>

      {/* Action Shortcut Banners - 4 Form Cards */}
      <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 w-full min-w-0">
        {/* Form Ziyadah Shortcut - Emerald */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between border border-emerald-700/30">
          <div className="space-y-1 min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <span>Hafalan Baru</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Input Ziyadah</h4>
            <p className="text-xs text-emerald-200/90 leading-relaxed">Catat surah &amp; ayat hafalan baru</p>
            <button
              ref={ziyadahBtnRipple.elementRef}
              onClick={(e) => { ziyadahBtnRipple.createRipple(e); setActiveTab('ziyadah'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-50 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.985]"
            >
              <span>Form Ziyadah</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-200" />
          </div>
        </div>

        {/* Form Muroja'ah Shortcut - Refined Burnt Orange / Warm Amber Gradient with High Contrast */}
        <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-orange-800 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between border border-amber-600/40">
          <div className="space-y-1 min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
              <RotateCw className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <span>Pengulangan</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Input Muroja'ah</h4>
            <p className="text-xs text-amber-100/90 leading-relaxed">Evaluasi kelancaran hafalan lama</p>
            <button
              ref={murojaahBtnRipple.elementRef}
              onClick={(e) => { murojaahBtnRipple.createRipple(e); setActiveTab('murojaah'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-amber-950 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.985]"
            >
              <span>Form Muroja'ah</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/25 flex-shrink-0 text-amber-100">
            <RotateCw className="w-6 h-6" />
          </div>
        </div>

        {/* Form Binnadzor Shortcut - Royal Indigo / Slate */}
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between border border-indigo-700/30">
          <div className="space-y-1 min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
              <BookOpenCheck className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
              <span>Fokus Tajwid</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Input Binnadzor</h4>
            <p className="text-xs text-indigo-200/90 leading-relaxed">Tartil, makhroj &amp; fashohah</p>
            <button
              ref={binnadzorBtnRipple.elementRef}
              onClick={(e) => { binnadzorBtnRipple.createRipple(e); setActiveTab('binnadzor'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-indigo-900 rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-50 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.985]"
            >
              <span>Form Binnadzor</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <BookOpenCheck className="w-6 h-6 text-indigo-200" />
          </div>
        </div>

        {/* Form Pembelajaran Shortcut - Non-Tahfidz: Jilid Ummi Dewasa & Kelas Istimewa */}
        <div className="bg-gradient-to-br from-orange-950 via-amber-900 to-amber-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between border border-orange-700/30">
          <div className="space-y-1 min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-200">
              <GraduationCap className="w-3.5 h-3.5 text-orange-300 flex-shrink-0" />
              <span>Non-Tahfidz</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Pembelajaran</h4>
            <p className="text-xs text-orange-200/90 leading-relaxed">Jilid Ummi &amp; Istimewa</p>
            <button
              ref={pembelajaranBtnRipple.elementRef}
              onClick={(e) => { pembelajaranBtnRipple.createRipple(e); setActiveTab('pembelajaran'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-amber-950 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer active:scale-[0.985]"
            >
              <span>Form Belajar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-orange-200" />
          </div>
        </div>
      </ScrollReveal>

      {/* Visualisasi Data Hafalan & Statistik */}
      <ScrollReveal delay={100} className="w-full min-w-0 max-w-full space-y-3">
        {/* Toggle Pilihan Grafik Visualisasi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight">
              Visualisasi &amp; Analitik Progres Hafalan
            </h3>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/90 self-start sm:self-auto shadow-2xs">
            <button
              onClick={() => setChartView('tren_hafalan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                chartView === 'tren_hafalan'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tren Hafalan Santri (Bulanan)</span>
            </button>
            <button
              onClick={() => setChartView('aktivitas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                chartView === 'aktivitas'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Aktivitas Sesi &amp; Kualitas</span>
            </button>
          </div>
        </div>

        {chartView === 'tren_hafalan' ? (
          <TrenHafalanBulananChart
            santriList={santriList}
            ziyadahRecords={ziyadahRecords}
            murojaahRecords={murojaahRecords}
            kelasList={kelasList}
          />
        ) : (
          <HafalanStatsChart
            santriList={santriList}
            ziyadahRecords={ziyadahRecords}
            murojaahRecords={murojaahRecords}
            binnadzorRecords={binnadzorRecords}
            pembelajaranRecords={pembelajaranRecords}
            kelasList={kelasList}
          />
        )}
      </ScrollReveal>

      {/* Santri Quick Overview */}
      <ScrollReveal delay={100} className="w-full min-w-0">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">Daftar Santri &amp; Quick Setoran</h3>
              <p className="text-xs text-slate-500 truncate">Pilih santri untuk langsung mengisi setoran hafalan</p>
            </div>
            <button
              onClick={() => setActiveTab('santri')}
              className="press-feedback text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <span>Kelola Santri</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {santriList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
              <Users className="w-8 h-8 mx-auto text-slate-400" />
              <h4 className="text-sm font-bold text-slate-700">Belum Ada Data Santri Terdaftar</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tambahkan data santri baru untuk mulai mencatat setoran hafalan Ziyadah, Muroja'ah, &amp; Binnadzor.
              </p>
              <button
                onClick={() => setActiveTab('santri')}
                className="press-feedback px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Santri Baru</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full min-w-0">
              {santriList.map((santri) => {
                const santriZiyadahCount = ziyadahRecords.filter(r => r.idSantri === santri.idSantri).length;
                const santriMurojaahCount = murojaahRecords.filter(r => r.idSantri === santri.idSantri).length;
                const santriBinnadzorCount = binnadzorRecords.filter(r => r.idSantri === santri.idSantri).length;
                const santriPembelajaranCount = pembelajaranRecords.filter(r => r.idSantri === santri.idSantri).length;
                const isNonTahfidz = isNonTahfidzClass(santri.kelas);

                return (
                  <div
                    key={santri.idSantri}
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col justify-between min-w-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex-shrink-0">
                          {santri.idSantri}
                        </span>
                        <span className="text-xs text-slate-500 font-medium truncate">{getClassGroup(santri.kelas)}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-1.5 truncate">{santri.namaSantri}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">Target: {santri.targetHafalan}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                        {isNonTahfidz ? (
                          <>
                            <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md font-semibold">
                              📘 {santriPembelajaranCount} Sesi Belajar
                            </span>
                            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                              📑 {santriBinnadzorCount} Bnz
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                              📖 {santriZiyadahCount} Zyd
                            </span>
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                              🔄 {santriMurojaahCount} Mrj
                            </span>
                            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                              📑 {santriBinnadzorCount} Bnz
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center gap-1.5">
                      {isNonTahfidz ? (
                        <>
                          <button
                            onClick={() => {
                              if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                              setActiveTab('pembelajaran');
                            }}
                            className="press-feedback flex-1 py-1.5 rounded-lg bg-orange-800 hover:bg-orange-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            + Pembelajaran
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                              setActiveTab('binnadzor');
                            }}
                            className="press-feedback flex-1 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            + Binnadzor
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                              setActiveTab('ziyadah');
                            }}
                            className="press-feedback flex-1 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            + Ziyadah
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                              setActiveTab('murojaah');
                            }}
                            className="press-feedback flex-1 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            + Muroja'ah
                          </button>
                          <button
                            onClick={() => {
                              if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                              setActiveTab('binnadzor');
                            }}
                            className="press-feedback flex-1 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                          >
                            + Binnadzor
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
};
