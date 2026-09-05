import React from 'react';
import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, ActiveTab, Kelas } from '../types';
import { Users, CalendarCheck, BookOpen, RotateCw, CirclePlus as PlusCircle, BookOpenCheck, ArrowRight, Award, Sparkles } from 'lucide-react';
import { getClassGroup } from '../utils/classUtils';
import { HafalanStatsChart } from './HafalanStatsChart';
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
  kelasList: Kelas[];
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
  kelasList,
  setActiveTab,
  onSelectSantriForZiyadah,
  isLoading = false
}) => {
  const mushafRipple = useRipple<HTMLButtonElement>();
  const ziyadahBtnRipple = useRipple<HTMLButtonElement>();
  const murojaahBtnRipple = useRipple<HTMLButtonElement>();
  const binnadzorBtnRipple = useRipple<HTMLButtonElement>();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayZiyadah = ziyadahRecords.filter(r => r.timestamp.startsWith(today));
  const todayMurojaah = murojaahRecords.filter(r => r.timestamp.startsWith(today));
  const todayBinnadzor = binnadzorRecords.filter(r => r.timestamp.startsWith(today));
  const totalSetoranToday = todayZiyadah.length + todayMurojaah.length + todayBinnadzor.length;

  const allRecords = [...ziyadahRecords, ...murojaahRecords, ...binnadzorRecords];
  const sangatBaikCount = allRecords.filter(r => r.nilai === 'Sangat Baik').length;
  const lancarPercent = allRecords.length > 0 ? Math.round((sangatBaikCount / allRecords.length) * 100) : 100;

  const fadeDelay = (index: number) => ({
    animationDelay: `${100 + index * 80}ms`,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Hero Card */}
      <div className="hero-animated-bg bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden fade-in-up" style={fadeDelay(0)}>
        {/* Decorative Islamic pattern overlay */}
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
              ref={mushafRipple.elementRef}
              onClick={(e) => { mushafRipple.createRipple(e); setActiveTab('mushaf'); }}
              className="ripple-container press-feedback px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition flex items-center gap-2 backdrop-blur-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Buka Mushaf</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Statistik Cards with Animated Counters & High-Contrast Distinct Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Santri - Neutral Slate */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:border-slate-300 transition-all fade-in-up" style={fadeDelay(1)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 truncate">Total Santri</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={santriList.length} />
            </h3>
            <span className="text-[10px] text-slate-600 font-medium">Santri aktif</span>
          </div>
        </div>

        {/* 2. Total Ziyadah - Fresh Emerald Green */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:border-emerald-300 transition-all fade-in-up" style={fadeDelay(2)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 truncate">Total Ziyadah</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={ziyadahRecords.length} />
            </h3>
            <span className="text-[10px] text-emerald-700 font-medium">Hafalan baru</span>
          </div>
        </div>

        {/* 3. Total Muroja'ah - Warm Amber Gold / Orange */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:border-amber-300 transition-all fade-in-up" style={fadeDelay(3)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 truncate">Total Muroja'ah</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={murojaahRecords.length} />
            </h3>
            <span className="text-[10px] text-amber-700 font-medium">Pengulangan</span>
          </div>
        </div>

        {/* 4. Total Binnadzor - Royal Indigo / Violet */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:border-indigo-300 transition-all fade-in-up" style={fadeDelay(4)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 truncate">Total Binnadzor</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-indigo-950 mt-0.5">
              <AnimatedCounter value={binnadzorRecords.length} />
            </h3>
            <span className="text-[10px] text-indigo-700 font-medium">Baca mushaf</span>
          </div>
        </div>

        {/* 5. Setoran Hari Ini - Vibrant Coral Rose / Crimson */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:border-rose-300 transition-all fade-in-up" style={fadeDelay(5)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 truncate">Hari Ini</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={totalSetoranToday} />
            </h3>
            <span className="text-[10px] text-rose-700 font-medium truncate block" title={`${todayZiyadah.length} Zyd • ${todayMurojaah.length} Mrj • ${todayBinnadzor.length} Bnz`}>
              {todayZiyadah.length}Z • {todayMurojaah.length}M • {todayBinnadzor.length}B
            </span>
          </div>
        </div>

        {/* 6. Predikat Mumtaz - Bright Sky / Azure Blue */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3 hover:border-sky-300 transition-all fade-in-up" style={fadeDelay(6)}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 truncate">Mumtaz</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              <AnimatedCounter value={lancarPercent} suffix="%" />
            </h3>
            <span className="text-[10px] text-sky-700 font-medium">Sangat Baik ({sangatBaikCount})</span>
          </div>
        </div>
      </div>

      {/* Action Shortcut Banners with Harmonized Triad Colors */}
      <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Form Ziyadah Shortcut - Emerald */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200">
              <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>Hafalan Baru</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Input Ziyadah</h4>
            <p className="text-xs text-emerald-200/90">Catat surah & ayat hafalan baru</p>
            <button
              ref={ziyadahBtnRipple.elementRef}
              onClick={(e) => { ziyadahBtnRipple.createRipple(e); setActiveTab('ziyadah'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Form Ziyadah</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-200" />
          </div>
        </div>

        {/* Form Muroja'ah Shortcut - Warm Amber / Orange */}
        <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-orange-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
              <RotateCw className="w-3.5 h-3.5 text-amber-300" />
              <span>Pengulangan</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Input Muroja'ah</h4>
            <p className="text-xs text-amber-200/90">Evaluasi kelancaran hafalan lama</p>
            <button
              ref={murojaahBtnRipple.elementRef}
              onClick={(e) => { murojaahBtnRipple.createRipple(e); setActiveTab('murojaah'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-amber-900 rounded-xl text-xs font-bold shadow-xs hover:bg-amber-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Form Muroja'ah</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <RotateCw className="w-6 h-6 text-amber-200" />
          </div>
        </div>

        {/* Form Binnadzor Shortcut - Royal Indigo / Purple */}
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
              <BookOpenCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Melihat Mushaf</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold">Input Binnadzor</h4>
            <p className="text-xs text-indigo-200/90">Setoran tartil & fashohah bacaan</p>
            <button
              ref={binnadzorBtnRipple.elementRef}
              onClick={(e) => { binnadzorBtnRipple.createRipple(e); setActiveTab('binnadzor'); }}
              className="ripple-container press-feedback mt-2.5 px-3.5 py-1.5 bg-white text-indigo-900 rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Form Binnadzor</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <BookOpenCheck className="w-6 h-6 text-indigo-200" />
          </div>
        </div>
      </ScrollReveal>

      {/* Grafik Statistik */}
      <ScrollReveal delay={100}>
        <HafalanStatsChart
          santriList={santriList}
          ziyadahRecords={ziyadahRecords}
          murojaahRecords={murojaahRecords}
          binnadzorRecords={binnadzorRecords}
          kelasList={kelasList}
        />
      </ScrollReveal>

      {/* Santri Quick Overview */}
      <ScrollReveal delay={100}>
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
                Tambahkan data santri baru untuk mulai mencatat setoran hafalan Ziyadah, Muroja'ah, & Binnadzor.
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
                const santriBinnadzorCount = binnadzorRecords.filter(r => r.idSantri === santri.idSantri).length;

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
                        <span className="text-xs text-slate-500 font-medium">{getClassGroup(santri.kelas)}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-1.5">{santri.namaSantri}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Target: {santri.targetHafalan}</p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                          📖 {santriZiyadahCount} Zyd
                        </span>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                          🔄 {santriMurojaahCount} Mrj
                        </span>
                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                          📑 {santriBinnadzorCount} Bnz
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                          setActiveTab('ziyadah');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                      >
                        + Ziyadah
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                          setActiveTab('murojaah');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                      >
                        + Muroja'ah
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                          setActiveTab('binnadzor');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white text-[11px] font-semibold text-center transition cursor-pointer"
                      >
                        + Binnadzor
                      </button>
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
