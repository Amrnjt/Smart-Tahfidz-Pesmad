import React, { useState } from 'react';
import {
  User,
  Santri,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  ActiveTab,
  Kelas,
  PredikatNilai
} from '../types';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CalendarCheck,
  ChartBar as BarChart3,
  CheckCircle2,
  ChevronRight,
  CirclePlus as PlusCircle,
  GraduationCap,
  RotateCw,
  TrendingUp,
  Users
} from 'lucide-react';
import { getClassGroup, isNonTahfidzClass } from '../utils/classUtils';
import { formatTanggalWaktu, getTodayInputFormat } from '../utils/dateFormatter';
import { HafalanStatsChart } from './HafalanStatsChart';
import { TrenHafalanBulananChart } from './TrenHafalanBulananChart';
import { ScrollReveal } from './ScrollReveal';
import { PesmadLogo } from './PesmadLogo';

interface UstadzDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  kelasList: Kelas[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectSantriForZiyadah?: (idSantri: string) => void;
  onOpenSetorMenu: () => void;
}

type ActivityCategory = 'Ziyadah' | "Muroja'ah" | 'Binnadzor' | 'Pembelajaran';

interface DashboardActivity {
  id: string;
  timestamp: string;
  idSantri: string;
  namaSantri: string;
  category: ActivityCategory;
  material: string;
  nilai: PredikatNilai;
}

const categoryStyles: Record<ActivityCategory, {
  dot: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  onDarkText: string;
  onDarkSurface: string;
}> = {
  Ziyadah: {
    dot: 'bg-emerald-600',
    text: 'text-emerald-800',
    icon: BookOpen,
    onDarkText: 'text-emerald-100',
    onDarkSurface: 'bg-emerald-900/60'
  },
  "Muroja'ah": {
    dot: 'bg-teal-600',
    text: 'text-teal-800',
    icon: RotateCw,
    onDarkText: 'text-teal-100',
    onDarkSurface: 'bg-teal-900/55'
  },
  Binnadzor: {
    dot: 'bg-indigo-600',
    text: 'text-indigo-800',
    icon: BookOpenCheck,
    onDarkText: 'text-indigo-100',
    onDarkSurface: 'bg-indigo-950/45'
  },
  Pembelajaran: {
    dot: 'bg-amber-600',
    text: 'text-amber-800',
    icon: GraduationCap,
    onDarkText: 'text-amber-100',
    onDarkSurface: 'bg-amber-950/35'
  }
};

const getNilaiTextClass = (nilai: PredikatNilai) => {
  if (nilai === 'Mengulang') return 'text-rose-700';
  if (nilai === 'Kurang') return 'text-amber-700';
  if (nilai === 'Sangat Baik') return 'text-emerald-700';
  return 'text-slate-700';
};

export const UstadzDashboard: React.FC<UstadzDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  kelasList,
  setActiveTab,
  onSelectSantriForZiyadah,
  onOpenSetorMenu
}) => {
  const [chartView, setChartView] = useState<'tren_hafalan' | 'aktivitas'>('tren_hafalan');


  const today = getTodayInputFormat();
  const santriById = new Map<string, Santri>(santriList.map(santri => [santri.idSantri, santri]));
  const resolveName = (idSantri: string, fallback?: string) => fallback || santriById.get(idSantri)?.namaSantri || idSantri;

  const activities: DashboardActivity[] = [
    ...ziyadahRecords.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: resolveName(record.idSantri, record.namaSantri),
      category: 'Ziyadah' as const,
      material: `${record.surah} • ayat ${record.ayatAwal}-${record.ayatAkhir}`,
      nilai: record.nilai
    })),
    ...murojaahRecords.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: resolveName(record.idSantri, record.namaSantri),
      category: "Muroja'ah" as const,
      material: record.surahAtauJuz,
      nilai: record.nilai
    })),
    ...binnadzorRecords.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: resolveName(record.idSantri, record.namaSantri),
      category: 'Binnadzor' as const,
      material: record.materi || record.surahAtauHalaman || 'Materi Binnadzor',
      nilai: record.nilai
    })),
    ...pembelajaranRecords.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: resolveName(record.idSantri, record.namaSantri),
      category: 'Pembelajaran' as const,
      material: record.materiPokok || record.materi || record.jilidAtauKategori || record.namaKelas || 'Pembelajaran',
      nilai: record.nilai
    }))
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const todayActivities = activities.filter(record => record.timestamp.startsWith(today));
  const attentionActivities = activities.filter(record => record.nilai === 'Kurang' || record.nilai === 'Mengulang');
  const todayAttention = attentionActivities.filter(record => record.timestamp.startsWith(today));
  const sangatBaikCount = activities.filter(record => record.nilai === 'Sangat Baik').length;
  const sangatBaikPercent = activities.length > 0 ? Math.round((sangatBaikCount / activities.length) * 100) : null;
  const latestActivities = activities.slice(0, 6);
  const recentAttention = attentionActivities.slice(0, 4);
  const latestTodayActivity = todayActivities[0] ?? null;

  const dailyBreakdown: { label: ActivityCategory; value: number }[] = [
    { label: 'Ziyadah', value: todayActivities.filter(record => record.category === 'Ziyadah').length },
    { label: "Muroja'ah", value: todayActivities.filter(record => record.category === "Muroja'ah").length },
    { label: 'Binnadzor', value: todayActivities.filter(record => record.category === 'Binnadzor').length },
    { label: 'Pembelajaran', value: todayActivities.filter(record => record.category === 'Pembelajaran').length }
  ];

  const dailyBreakdownWithShare = dailyBreakdown.map(item => ({
    ...item,
    share: todayActivities.length > 0 ? Math.round((item.value / todayActivities.length) * 100) : 0
  }));

  const categoryTargetTabs: Record<ActivityCategory, ActiveTab> = {
    Ziyadah: 'ziyadah',
    "Muroja'ah": 'murojaah',
    Binnadzor: 'binnadzor',
    Pembelajaran: 'pembelajaran'
  };

  const sevenDayPulse = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00+07:00`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const count = activities.filter(record => record.timestamp.startsWith(key)).length;
    const label = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(date).replace('.', '');
    return { key, label, count };
  });
  const sevenDayMax = Math.max(1, ...sevenDayPulse.map(day => day.count));
  const sevenDayTotal = sevenDayPulse.reduce((sum, day) => sum + day.count, 0);
  const yesterdayCount = sevenDayPulse[5]?.count ?? 0;
  const todayCount = sevenDayPulse[6]?.count ?? todayActivities.length;
  const momentumDelta = todayCount - yesterdayCount;
  const momentumLabel = momentumDelta > 0
    ? `+${momentumDelta} dari kemarin`
    : momentumDelta < 0
      ? `${momentumDelta} dari kemarin`
      : 'sama dengan kemarin';
  const todayKurangCount = todayAttention.filter(record => record.nilai === 'Kurang').length;
  const todayMengulangCount = todayAttention.filter(record => record.nilai === 'Mengulang').length;

  const openAnalytics = () => {
    setChartView('aktivitas');
    requestAnimationFrame(() => {
      const target = document.getElementById('dashboard-analytics');
      if (!target) return;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <section aria-label="Pusat kerja Ustadz" className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-800 bg-emerald-950 text-white shadow-[0_18px_48px_-32px_rgba(6,78,59,0.8)] lg:col-span-3">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-12 hidden h-60 w-48 rounded-t-[999px] border border-emerald-700/50 lg:block" />
          <div className="absolute right-5 top-20 hidden w-60 rounded-2xl border border-emerald-800 bg-emerald-900/60 p-4 shadow-[0_16px_34px_-28px_rgba(0,0,0,0.7)] lg:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300">Ritme 7 hari</p>
                <p className="mt-1 text-sm font-bold text-white">{sevenDayTotal} setoran</p>
              </div>
              <span className="rounded-lg border border-emerald-700 bg-emerald-950/70 px-2 py-1 text-xs font-semibold text-emerald-200">{momentumLabel}</span>
            </div>

            <div className="mt-4 flex h-20 items-end gap-2" role="img" aria-label={`Aktivitas tujuh hari terakhir, total ${sevenDayTotal} setoran`}>
              {sevenDayPulse.map(day => (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-14 w-full items-end justify-center rounded-md bg-emerald-950/55 px-1">
                    <span
                      className={`w-full rounded-sm ${day.key === today ? 'bg-emerald-300' : 'bg-emerald-600'}`}
                      style={{ height: `${day.count === 0 ? 8 : Math.max(18, Math.round((day.count / sevenDayMax) * 100))}%` }}
                      title={`${day.label}: ${day.count} setoran`}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${day.key === today ? 'text-white' : 'text-emerald-300'}`}>{day.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-emerald-800 pt-3">
              {latestTodayActivity ? (
                <>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Terakhir hari ini</div>
                  <p className="mt-1.5 truncate text-sm font-bold text-white">{latestTodayActivity.namaSantri}</p>
                  <p className="mt-0.5 truncate text-xs text-emerald-200">{latestTodayActivity.category} · {latestTodayActivity.material}</p>
                </>
              ) : (
                <p className="text-xs leading-5 text-emerald-200">Belum ada setoran hari ini. Aktivitas pertama akan muncul di sini.</p>
              )}
            </div>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-8 h-40 w-40 rounded-full border border-emerald-800/70" />

          <div className="relative z-10 p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-700 bg-white p-1.5 shadow-sm">
                  <PesmadLogo size="md" className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-200">Pesmad Smart Tahfidz</p>
                  <p className="mt-0.5 text-sm text-emerald-300">Pesantren Madrasah Darul Fikri</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="group flex min-h-14 items-center gap-3 self-start rounded-xl border border-emerald-700 bg-emerald-900/70 px-3.5 py-2.5 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 sm:self-auto"
                aria-label={`${todayActivities.length} setoran hari ini. Buka riwayat setoran`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-700 bg-emerald-950 text-emerald-200">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-emerald-300">Setoran hari ini</span>
                  <strong className="mt-0.5 block text-2xl font-bold leading-none tabular-nums text-white">{todayActivities.length}</strong>
                  <span className="mt-1 block text-xs text-emerald-300">{momentumLabel}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-emerald-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-7 max-w-2xl lg:max-w-[72%]">
              <p className="text-sm font-semibold text-emerald-300">Dashboard Ustadz</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
                Assalamu'alaikum, {currentUser.nama}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80">
                Catat setoran, pantau aktivitas hari ini, dan temukan santri yang perlu dicermati tanpa berpindah-pindah konteks.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 ${todayAttention.length > 0 ? 'border-amber-700/70 bg-amber-950/30 text-amber-200' : 'border-emerald-700 bg-emerald-900/60 text-emerald-200'}`}>
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  {todayAttention.length > 0 ? `${todayAttention.length} perlu tindak lanjut hari ini` : 'Tidak ada tindak lanjut hari ini'}
                </span>
                <span className="inline-flex min-h-8 items-center rounded-lg border border-emerald-800 bg-emerald-900/45 px-2.5 text-emerald-200">
                  {activities.length} setoran tersimpan
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onOpenSetorMenu}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-100"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Mulai Setor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mushaf')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 border border-emerald-600 bg-emerald-900/55 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Buka Mushaf
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="ui-control press-feedback group inline-flex items-center justify-center gap-2 px-3 text-sm font-semibold text-emerald-100 transition-colors hover:text-white"
              >
                Riwayat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-px border-t border-emerald-800 bg-emerald-800 sm:grid-cols-4">
            {dailyBreakdownWithShare.map((item) => {
              const style = categoryStyles[item.label];
              const Icon = style.icon;
              return (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setActiveTab(categoryTargetTabs[item.label])}
                  className={`${style.onDarkSurface} group flex min-h-[82px] items-center justify-between gap-3 px-4 py-3.5 text-left transition-[filter,transform] duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300`}
                  aria-label={`${item.label}: ${item.value} setoran hari ini. Buka form ${item.label}`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${style.onDarkText}`} aria-hidden="true" />
                      <span className={`truncate text-xs font-semibold ${style.onDarkText}`}>{item.label}</span>
                    </span>
                    <strong className="mt-1.5 block text-xl font-bold tabular-nums text-white">{item.value}</strong>
                    <span className={`mt-0.5 block text-xs ${style.onDarkText}`}>setoran hari ini</span>
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                      <span className="block h-full rounded-full bg-white/70 transition-[width] duration-300" style={{ width: `${item.share}%` }} />
                    </span>
                  </span>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/10">
                    <ChevronRight className="h-4 w-4 text-white/70 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className={`ui-panel overflow-hidden shadow-[0_16px_42px_-34px_rgba(15,23,42,0.35)] lg:col-span-2 ${todayAttention.length > 0 ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-emerald-600'}`}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="ui-meta font-semibold uppercase tracking-[0.08em]">Perlu dicermati</p>
              <h2 className="ui-section-title mt-1">Tindak lanjut setoran</h2>
              <p className="ui-secondary mt-1">Nilai Kurang atau Mengulang dari data setoran aktual.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800"><strong>{todayKurangCount}</strong> Kurang</span>
                <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-800"><strong>{todayMengulangCount}</strong> Mengulang</span>
              </div>
              <button type="button" onClick={() => setActiveTab('riwayat')} className="group mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950">
                Lihat semua
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
            <div className={`flex min-w-14 flex-col items-center rounded-xl border px-3 py-2 ${todayAttention.length > 0 ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              <span className="text-2xl font-bold leading-none">{todayAttention.length}</span>
              <span className="mt-1 text-xs font-semibold">hari ini</span>
            </div>
          </div>

          {recentAttention.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="mt-3 text-sm font-bold text-slate-800">Belum ada nilai yang perlu dicermati.</p>
              <p className="ui-secondary mt-1 max-w-sm">Setoran bernilai Kurang atau Mengulang akan tampil di bagian ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 px-4 sm:px-5">
              {recentAttention.map(record => (
                <button
                  type="button"
                  key={`${record.category}-${record.id}`}
                  onClick={() => setActiveTab('riwayat')}
                  className="group -mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-lg px-2 py-3.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${record.nilai === 'Mengulang' ? 'bg-rose-600' : 'bg-amber-600'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{record.namaSantri}</p>
                      <span className={`flex-shrink-0 text-xs font-bold ${getNilaiTextClass(record.nilai)}`}>{record.nilai}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-600">{record.category} · {record.material}</p>
                    <p className="ui-meta mt-1">{formatTanggalWaktu(record.timestamp)}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section aria-label="Status operasional" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => setActiveTab('santri')} className="ui-panel group flex min-h-24 items-center gap-3 px-4 py-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:px-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Users className="h-5 w-5" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="ui-meta block font-semibold">Santri aktif</span><strong className="mt-0.5 block text-2xl font-bold text-slate-950">{santriList.length}</strong><span className="ui-meta mt-0.5 block">Lihat data santri</span></span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>

        <button type="button" onClick={openAnalytics} className="ui-panel group flex min-h-24 items-center gap-3 px-4 py-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:px-5" aria-label="Buka analitik aktivitas dan kualitas">
          <div className="relative h-12 w-12 flex-shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#d1fae5" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray={`${sangatBaikPercent ?? 0} 100`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-900">{sangatBaikPercent === null ? '—' : `${sangatBaikPercent}%`}</span>
          </div>
          <span className="min-w-0 flex-1"><span className="ui-meta block font-semibold">Kualitas Sangat Baik</span><strong className="mt-0.5 block text-base font-bold text-slate-950">{sangatBaikPercent === null ? 'Belum ada nilai' : `${sangatBaikPercent}% dari seluruh setoran`}</strong><span className="ui-meta mt-0.5 block">{activities.length === 0 ? 'Belum ada penilaian' : `${sangatBaikCount} dari ${activities.length} setoran · buka analitik`}</span></span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>

        <button type="button" onClick={() => setActiveTab('riwayat')} className="ui-panel group flex min-h-24 items-center gap-3 px-4 py-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><CalendarCheck className="h-5 w-5" aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><span className="ui-meta block font-semibold">Setoran tersimpan</span><strong className="mt-0.5 block text-2xl font-bold text-slate-950">{activities.length}</strong><span className="ui-meta mt-0.5 block">Seluruh kategori</span></span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </section>

      <ScrollReveal className="ui-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="ui-meta font-semibold uppercase tracking-[0.08em]">Arus kegiatan</p>
            <h2 className="ui-section-title mt-1">Aktivitas terbaru</h2>
            <p className="ui-secondary mt-0.5">Setoran paling baru dari seluruh kategori.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="ui-control press-feedback inline-flex self-start items-center gap-1.5 px-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:self-auto"
          >
            Lihat semua
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {latestActivities.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <BookOpen className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada aktivitas setoran.</p>
            <p className="ui-secondary mt-1">Setoran yang tersimpan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {latestActivities.map(record => {
              const style = categoryStyles[record.category];
              const Icon = style.icon;
              return (
                <button
                  type="button"
                  key={`${record.category}-${record.id}`}
                  onClick={() => setActiveTab('riwayat')}
                  className="group grid w-full gap-2 px-4 py-3.5 text-left transition-[background-color,transform] duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5"
                  aria-label={`${record.namaSantri}, ${record.category}, ${record.nilai}. Buka riwayat`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-50 ${style.text}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{record.namaSantri}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${style.text}`}>{record.category}</p>
                    </div>
                  </div>
                  <p className="truncate pl-12 text-sm text-slate-600 sm:pl-0">{record.material}</p>
                  <div className="flex items-center justify-between gap-3 pl-12 sm:flex sm:items-center sm:justify-end sm:pl-0 sm:text-right">
                    <span>
                      <span className={`text-xs font-bold ${getNilaiTextClass(record.nilai)}`}>{record.nilai}</span>
                      <span className="ui-meta whitespace-nowrap sm:mt-1 sm:block">{formatTanggalWaktu(record.timestamp)}</span>
                    </span>
                    <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal delay={80} className="space-y-3">
        <div id="dashboard-analytics" className="scroll-mt-24 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="ui-meta font-semibold uppercase tracking-[0.08em]">Insight</p>
            <h2 className="ui-section-title mt-1">Analitik hafalan</h2>
            <p className="ui-secondary mt-0.5">Gunakan grafik untuk membaca pola perkembangan setelah melihat kondisi operasional hari ini.</p>
          </div>
          <div className="inline-flex self-start rounded-xl border border-slate-200 bg-slate-50 p-1 sm:self-auto" role="group" aria-label="Pilihan analitik">
            <button
              type="button"
              onClick={() => setChartView('tren_hafalan')}
              aria-pressed={chartView === 'tren_hafalan'}
              className={`ui-control inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                chartView === 'tren_hafalan' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Tren bulanan
            </button>
            <button
              type="button"
              onClick={() => setChartView('aktivitas')}
              aria-pressed={chartView === 'aktivitas'}
              className={`ui-control inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                chartView === 'aktivitas' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Aktivitas & kualitas
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

      <ScrollReveal delay={80} className="ui-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="ui-meta font-semibold uppercase tracking-[0.08em]">Operasional santri</p>
            <h2 className="ui-section-title mt-1">Santri & setoran berikutnya</h2>
            <p className="ui-secondary mt-0.5">Lihat target, aktivitas terakhir, lalu masuk ke form sesuai kelas.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('santri')}
            className="ui-control press-feedback self-start px-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:self-auto"
          >
            Kelola santri
          </button>
        </div>

        {santriList.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <Users className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-700">Belum ada santri terdaftar.</p>
            <p className="ui-secondary mx-auto mt-1 max-w-md">Tambahkan santri untuk mulai mencatat setoran dan target hafalan.</p>
            <button
              type="button"
              onClick={() => setActiveTab('santri')}
              className="ui-control press-feedback mt-4 inline-flex items-center gap-2 bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah santri
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {santriList.slice(0, 8).map(santri => {
              const isNonTahfidz = isNonTahfidzClass(santri.kelas);
              const santriActivities = activities.filter(record => record.idSantri === santri.idSantri);
              const lastActivity = santriActivities[0];

              return (
                <div key={santri.idSantri} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-bold text-slate-900">{santri.namaSantri}</p>
                        <span className="ui-meta">{santri.idSantri}</span>
                      </div>
                      <p className="ui-secondary mt-0.5 truncate">{getClassGroup(santri.kelas)} · Target {santri.targetHafalan || 'belum ditetapkan'}</p>
                    </div>

                    <div className="flex min-w-0 items-center gap-3 md:justify-end">
                      <div className="min-w-0 flex-1 text-left md:flex-none md:text-right">
                        <p className="text-sm font-semibold text-slate-700">{santriActivities.length} setoran</p>
                        <p className="ui-meta truncate">
                          {lastActivity ? `Terakhir ${lastActivity.category} · ${lastActivity.nilai}` : 'Belum ada setoran'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectSantriForZiyadah) onSelectSantriForZiyadah(santri.idSantri);
                          setActiveTab(isNonTahfidz ? 'pembelajaran' : 'ziyadah');
                        }}
                        className={`ui-control press-feedback inline-flex flex-shrink-0 items-center justify-center px-3 text-xs font-bold text-white ${isNonTahfidz ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-800 hover:bg-emerald-700'}`}
                      >
                        {isNonTahfidz ? 'Pembelajaran' : 'Ziyadah'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {santriList.length > 8 && (
              <button
                type="button"
                onClick={() => setActiveTab('santri')}
                className="ui-control flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-4 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
              >
                Lihat {santriList.length - 8} santri lainnya
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </ScrollReveal>
    </div>
  );
};
