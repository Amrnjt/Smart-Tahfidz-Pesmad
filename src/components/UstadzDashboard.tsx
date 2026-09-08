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
import { DashboardSkeleton } from './SkeletonLoading';
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
  isLoading?: boolean;
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
  onOpenSetorMenu,
  isLoading = false
}) => {
  const [chartView, setChartView] = useState<'tren_hafalan' | 'aktivitas'>('tren_hafalan');

  if (isLoading) {
    return <DashboardSkeleton />;
  }

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

  const dailyBreakdown: { label: ActivityCategory; value: number }[] = [
    { label: 'Ziyadah', value: todayActivities.filter(record => record.category === 'Ziyadah').length },
    { label: "Muroja'ah", value: todayActivities.filter(record => record.category === "Muroja'ah").length },
    { label: 'Binnadzor', value: todayActivities.filter(record => record.category === 'Binnadzor').length },
    { label: 'Pembelajaran', value: todayActivities.filter(record => record.category === 'Pembelajaran').length }
  ];

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <section aria-label="Pusat kerja Ustadz" className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-emerald-900 bg-emerald-950 text-white lg:col-span-3">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-700 bg-white p-1.5">
                  <PesmadLogo size="md" className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-200">Pesmad Smart Tahfidz</p>
                  <p className="mt-0.5 text-sm text-emerald-300">Pesantren Madrasah Darul Fikri</p>
                </div>
              </div>

              <div className="flex items-end gap-2 border-l-2 border-emerald-700 pl-3 sm:flex-col sm:items-end sm:gap-0">
                <span className="text-xs font-semibold text-emerald-300">Setoran hari ini</span>
                <strong className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{todayActivities.length}</strong>
              </div>
            </div>

            <div className="mt-7 max-w-2xl">
              <p className="text-sm font-semibold text-emerald-300">Dashboard Ustadz</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Assalamu'alaikum, {currentUser.nama}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80">
                Catat setoran, pantau aktivitas hari ini, dan temukan santri yang perlu dicermati tanpa berpindah-pindah konteks.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onOpenSetorMenu}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-white px-4 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50"
              >
                <PlusCircle className="h-4 w-4" />
                Mulai Setor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mushaf')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 border border-emerald-700 bg-emerald-900/50 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
              >
                <BookOpen className="h-4 w-4" />
                Buka Mushaf
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 px-3 text-sm font-semibold text-emerald-100 transition-colors hover:text-white"
              >
                Riwayat
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-emerald-800 sm:grid-cols-4">
            {dailyBreakdown.map((item, index) => {
              const style = categoryStyles[item.label];
              const Icon = style.icon;
              return (
                <div
                  key={item.label}
                  className={`${style.onDarkSurface} px-4 py-3.5 ${index % 2 !== 0 ? 'border-l border-emerald-800 sm:border-l' : ''} ${index > 1 ? 'border-t border-emerald-800 sm:border-t-0' : ''} ${index > 0 ? 'sm:border-l sm:border-emerald-800' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${style.onDarkText}`} aria-hidden="true" />
                    <span className={`text-xs font-semibold ${style.onDarkText}`}>{item.label}</span>
                  </div>
                  <p className="mt-1.5 text-xl font-bold tabular-nums text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <aside className={`ui-panel overflow-hidden lg:col-span-2 ${todayAttention.length > 0 ? 'border-t-4 border-t-amber-500' : 'border-t-4 border-t-emerald-600'}`}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="ui-meta font-semibold uppercase tracking-[0.08em]">Perlu dicermati</p>
              <h2 className="ui-section-title mt-1">Tindak lanjut setoran</h2>
              <p className="ui-secondary mt-1">Nilai Kurang atau Mengulang dari data setoran aktual.</p>
            </div>
            <div className={`flex min-w-14 flex-col items-center rounded-xl px-3 py-2 ${todayAttention.length > 0 ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
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
                  className="group flex w-full items-start gap-3 py-3.5 text-left"
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

      <section aria-label="Status operasional" className="ui-panel overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:border-b-0 sm:px-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="ui-meta font-semibold">Santri aktif</p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">{santriList.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:border-b-0 sm:px-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="ui-meta font-semibold">Kualitas Sangat Baik</p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">{sangatBaikPercent === null ? '—' : `${sangatBaikPercent}%`}</p>
              <p className="ui-meta mt-0.5">{activities.length === 0 ? 'Belum ada penilaian' : `${sangatBaikCount} dari ${activities.length} setoran`}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="ui-meta font-semibold">Setoran tersimpan</p>
              <p className="mt-0.5 text-xl font-bold text-slate-950">{activities.length}</p>
              <p className="ui-meta mt-0.5">Seluruh kategori</p>
            </div>
          </div>
        </div>
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
                <div key={`${record.category}-${record.id}`} className="grid gap-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5">
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
                  <div className="flex items-center justify-between gap-3 pl-12 sm:block sm:pl-0 sm:text-right">
                    <span className={`text-xs font-bold ${getNilaiTextClass(record.nilai)}`}>{record.nilai}</span>
                    <span className="ui-meta whitespace-nowrap sm:mt-1 sm:block">{formatTanggalWaktu(record.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal delay={80} className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
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
