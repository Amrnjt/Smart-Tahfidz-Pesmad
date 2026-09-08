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

const categoryStyles: Record<ActivityCategory, { dot: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  Ziyadah: { dot: 'bg-emerald-600', text: 'text-emerald-800', icon: BookOpen },
  "Muroja'ah": { dot: 'bg-teal-600', text: 'text-teal-800', icon: RotateCw },
  Binnadzor: { dot: 'bg-indigo-600', text: 'text-indigo-800', icon: BookOpenCheck },
  Pembelajaran: { dot: 'bg-amber-600', text: 'text-amber-800', icon: GraduationCap }
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
  const santriById = new Map(santriList.map(santri => [santri.idSantri, santri]));
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
  const todayZiyadah = todayActivities.filter(record => record.category === 'Ziyadah').length;
  const todayMurojaah = todayActivities.filter(record => record.category === "Muroja'ah").length;
  const todayBinnadzor = todayActivities.filter(record => record.category === 'Binnadzor').length;
  const todayPembelajaran = todayActivities.filter(record => record.category === 'Pembelajaran').length;
  const attentionActivities = activities.filter(record => record.nilai === 'Kurang' || record.nilai === 'Mengulang');
  const todayAttention = attentionActivities.filter(record => record.timestamp.startsWith(today));
  const sangatBaikCount = activities.filter(record => record.nilai === 'Sangat Baik').length;
  const sangatBaikPercent = activities.length > 0 ? Math.round((sangatBaikCount / activities.length) * 100) : null;
  const latestActivities = activities.slice(0, 6);
  const recentAttention = attentionActivities.slice(0, 4);

  const dailyBreakdown: { label: ActivityCategory; value: number }[] = [
    { label: 'Ziyadah', value: todayZiyadah },
    { label: "Muroja'ah", value: todayMurojaah },
    { label: 'Binnadzor', value: todayBinnadzor },
    { label: 'Pembelajaran', value: todayPembelajaran }
  ];

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <section className="ui-panel p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="ui-meta font-semibold uppercase tracking-[0.08em]">Dashboard Ustadz</p>
            <h1 className="ui-page-title mt-1 break-words">Assalamu'alaikum, {currentUser.nama}</h1>
            <p className="ui-secondary mt-1.5 max-w-2xl">
              Ringkasan operasional tahfidz, setoran hari ini, dan santri yang membutuhkan tindak lanjut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('mushaf')}
              className="ui-control press-feedback inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <BookOpen className="h-4 w-4" />
              Buka Mushaf
            </button>
            <button
              type="button"
              onClick={onOpenSetorMenu}
              className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-emerald-800 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <PlusCircle className="h-4 w-4" />
              Setor
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Ringkasan operasional" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="ui-surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ui-meta font-semibold">Setoran hari ini</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{todayActivities.length}</p>
              <p className="ui-secondary mt-1">Seluruh kategori setoran</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="ui-surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ui-meta font-semibold">Santri aktif</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{santriList.length}</p>
              <p className="ui-secondary mt-1">Terdaftar pada sistem</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className={`ui-surface p-4 sm:p-5 ${todayAttention.length > 0 ? 'border-amber-300 bg-amber-50/40' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ui-meta font-semibold">Perlu perhatian hari ini</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{todayAttention.length}</p>
              <p className="ui-secondary mt-1">Nilai Kurang atau Mengulang</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${todayAttention.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="ui-panel p-4 sm:p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="ui-section-title">Aktivitas hari ini</h2>
              <p className="ui-secondary mt-0.5">Distribusi setoran berdasarkan kategori.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className="ui-control press-feedback inline-flex items-center gap-1 px-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Riwayat
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {dailyBreakdown.map(item => {
              const style = categoryStyles[item.label];
              const Icon = style.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 py-3.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
                  <Icon className={`h-4 w-4 ${style.text}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{item.label}</span>
                  <span className="text-base font-bold tabular-nums text-slate-950">{item.value}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="ui-secondary">
              {activities.length === 0
                ? 'Belum ada setoran tersimpan untuk menghitung kualitas.'
                : `${sangatBaikCount} dari ${activities.length} setoran tercatat Sangat Baik.`}
            </p>
            <span className="text-sm font-bold text-slate-800">
              {sangatBaikPercent === null ? 'Belum tersedia' : `${sangatBaikPercent}% Sangat Baik`}
            </span>
          </div>
        </div>

        <div className="ui-panel p-4 sm:p-5 lg:col-span-2">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="ui-section-title">Perlu perhatian</h2>
            <p className="ui-secondary mt-0.5">Setoran terbaru dengan nilai Kurang atau Mengulang.</p>
          </div>

          {recentAttention.length === 0 ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto h-6 w-6 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada setoran yang perlu ditindaklanjuti.</p>
              <p className="ui-meta mt-1">Daftar ini akan terisi dari penilaian setoran aktual.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
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
                      <span className={`flex-shrink-0 text-xs font-bold ${record.nilai === 'Mengulang' ? 'text-rose-700' : 'text-amber-700'}`}>{record.nilai}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-600">{record.category} · {record.material}</p>
                    <p className="ui-meta mt-1">{formatTanggalWaktu(record.timestamp)}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <ScrollReveal className="ui-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="ui-section-title">Aktivitas terbaru</h2>
            <p className="ui-secondary mt-0.5">Catatan setoran paling baru dari seluruh kategori.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="ui-control press-feedback self-start px-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:self-auto"
          >
            Lihat semua
          </button>
        </div>

        {latestActivities.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada aktivitas setoran.</p>
            <p className="ui-meta mt-1">Setoran yang tersimpan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {latestActivities.map(record => {
              const style = categoryStyles[record.category];
              return (
                <div key={`${record.category}-${record.id}`} className="flex items-start gap-3 py-3.5">
                  <div className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{record.namaSantri}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${style.text}`}>{record.category}</p>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600 sm:mt-0">{record.material}</p>
                    <div className="mt-1 flex items-center gap-3 sm:mt-0 sm:text-right">
                      <span className="text-xs font-semibold text-slate-700">{record.nilai}</span>
                      <span className="ui-meta whitespace-nowrap">{formatTanggalWaktu(record.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal delay={80} className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="ui-section-title">Analitik hafalan</h2>
            <p className="ui-secondary mt-0.5">Gunakan grafik untuk membaca pola, bukan sebagai metrik utama dashboard.</p>
          </div>
          <div className="inline-flex self-start rounded-lg border border-slate-200 bg-slate-50 p-1 sm:self-auto" role="group" aria-label="Pilihan analitik">
            <button
              type="button"
              onClick={() => setChartView('tren_hafalan')}
              aria-pressed={chartView === 'tren_hafalan'}
              className={`ui-control inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors ${
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
              className={`ui-control inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors ${
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

      <ScrollReveal delay={80} className="ui-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="ui-section-title">Santri</h2>
            <p className="ui-secondary mt-0.5">Ringkasan operasional dan akses cepat sesuai kelas santri.</p>
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
          <div className="py-9 text-center">
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
                <div key={santri.idSantri} className="py-3.5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-bold text-slate-900">{santri.namaSantri}</p>
                        <span className="ui-meta">{santri.idSantri}</span>
                      </div>
                      <p className="ui-secondary mt-0.5 truncate">{getClassGroup(santri.kelas)} · Target {santri.targetHafalan || 'belum ditetapkan'}</p>
                    </div>

                    <div className="flex min-w-0 items-center gap-4 md:justify-end">
                      <div className="min-w-0 text-left md:text-right">
                        <p className="text-sm font-semibold text-slate-700">{santriActivities.length} setoran</p>
                        <p className="ui-meta truncate">{lastActivity ? `Terakhir ${lastActivity.category}` : 'Belum ada setoran'}</p>
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
                className="ui-control flex w-full items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
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
