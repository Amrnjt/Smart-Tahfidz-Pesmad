import React from 'react';
import {
  User,
  Santri,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  ActiveTab,
  PredikatNilai
} from '../types';
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  GraduationCap,
  MessageSquareText,
  RotateCw,
  Target,
  UserRound
} from 'lucide-react';
import { ZiyadahProgressChart } from './ZiyadahProgressChart';
import { PesmadLogo } from './PesmadLogo';
import { formatTanggalWaktu } from '../utils/dateFormatter';
import { SantriWaliDashboardSkeleton } from './SkeletonLoading';
import { ScrollReveal } from './ScrollReveal';

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

type ActivityCategory = 'Ziyadah' | "Muroja'ah" | 'Binnadzor' | 'Pembelajaran';

interface SantriActivity {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  material: string;
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
}

const categoryMeta: Record<ActivityCategory, {
  text: string;
  surface: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  Ziyadah: { text: 'text-emerald-800', surface: 'bg-emerald-50', icon: BookOpen },
  "Muroja'ah": { text: 'text-teal-800', surface: 'bg-teal-50', icon: RotateCw },
  Binnadzor: { text: 'text-indigo-800', surface: 'bg-indigo-50', icon: BookOpenCheck },
  Pembelajaran: { text: 'text-amber-800', surface: 'bg-amber-50', icon: GraduationCap }
};

const scoreTone: Record<PredikatNilai, string> = {
  'Sangat Baik': 'text-emerald-700',
  Baik: 'text-emerald-700',
  Kurang: 'text-amber-700',
  Mengulang: 'text-rose-700'
};

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
  if (isLoading) {
    return <SantriWaliDashboardSkeleton role="Santri" />;
  }

  const currentSantri = santriList.find(santri => santri.idSantri === currentUser.idSantri);

  if (!currentSantri) {
    return (
      <div className="ui-panel p-5 sm:p-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="ui-section-title">Profil santri belum terhubung</h1>
            <p className="ui-secondary mt-1.5 max-w-2xl">
              Akun ini belum terhubung ke profil santri yang tersedia. Hubungi admin untuk memeriksa relasi ID santri sebelum melihat data hafalan.
            </p>
            <p className="ui-meta mt-3 font-semibold text-emerald-800">
              ID terhubung: {currentUser.idSantri || currentUser.username || 'Tidak tersedia'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const santriZiyadah = ziyadahRecords.filter(record => record.idSantri === currentSantri.idSantri);
  const santriMurojaah = murojaahRecords.filter(record => record.idSantri === currentSantri.idSantri);
  const santriBinnadzor = binnadzorRecords.filter(record => record.idSantri === currentSantri.idSantri);
  const santriPembelajaran = pembelajaranRecords.filter(record => record.idSantri === currentSantri.idSantri);

  const activities: SantriActivity[] = [
    ...santriZiyadah.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      category: 'Ziyadah' as const,
      material: `${record.surah} · Ayat ${record.ayatAwal}-${record.ayatAkhir}`,
      nilai: record.nilai,
      catatan: record.catatan?.trim() || '',
      inputBy: record.inputBy
    })),
    ...santriMurojaah.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      category: "Muroja'ah" as const,
      material: record.surahAtauJuz,
      nilai: record.nilai,
      catatan: record.catatan?.trim() || '',
      inputBy: record.inputBy
    })),
    ...santriBinnadzor.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      category: 'Binnadzor' as const,
      material: record.surahAtauHalaman || record.materi || 'Materi Binnadzor',
      nilai: record.nilai,
      catatan: record.catatan?.trim() || '',
      inputBy: record.inputBy
    })),
    ...santriPembelajaran.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      category: 'Pembelajaran' as const,
      material: record.materiPokok || record.materi || record.jilidAtauKategori || record.namaKelas || 'Pembelajaran',
      nilai: record.nilai,
      catatan: (record.catatanBimbingan || record.catatan || '').trim(),
      inputBy: record.inputBy
    }))
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const latestActivity = activities[0];
  const latestFeedback = activities.find(activity => Boolean(activity.catatan));
  const recentActivities = activities.slice(0, 5);
  const totalRecords = activities.length;
  const latestCategory = latestActivity ? categoryMeta[latestActivity.category] : null;
  const LatestIcon = latestCategory?.icon || BookOpen;

  const categoryRowsSource: { category: ActivityCategory; count: number }[] = [
    { category: 'Ziyadah', count: santriZiyadah.length },
    { category: "Muroja'ah", count: santriMurojaah.length },
    { category: 'Binnadzor', count: santriBinnadzor.length },
    { category: 'Pembelajaran', count: santriPembelajaran.length }
  ];
  const categoryRows = categoryRowsSource.filter(row => row.count > 0 || row.category !== 'Pembelajaran');

  return (
    <div className="w-full min-w-0 space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:p-6 lg:col-span-3 lg:p-7">
          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" aria-hidden="true" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 sm:h-14 sm:w-14">
              <PesmadLogo size="lg" className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-200">Ruang Belajar · Pesmad</p>
              <h1 className="mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl">{currentSantri.namaSantri}</h1>
              <p className="mt-1 text-sm leading-relaxed text-emerald-100/90">
                {currentSantri.kelas || 'Kelas belum ditetapkan'} · ID {currentSantri.idSantri}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/15 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-emerald-200">
                <Target className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.06em]">Target hafalan saya</span>
              </div>
              <p className="mt-1 text-base font-bold text-white sm:text-lg">
                {currentSantri.targetHafalan || 'Belum ditetapkan'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-200/90">
                Gunakan data setoran terakhir sebagai acuan belajar berikutnya.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Riwayat saya
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mushaf')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-white px-3.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50"
              >
                <BookOpen className="h-4 w-4" />
                Buka Mushaf
              </button>
            </div>
          </div>
        </div>

        <div className="ui-panel p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="ui-meta font-semibold uppercase tracking-[0.06em]">Setoran terakhir</p>
              <h2 className="ui-section-title mt-1">Fokus belajar berikutnya</h2>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${latestCategory?.surface || 'bg-slate-100'} ${latestCategory?.text || 'text-slate-600'}`}>
              <LatestIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          {latestActivity ? (
            <div className="pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={`text-sm font-bold ${latestCategory?.text}`}>{latestActivity.category}</p>
                <p className="ui-meta">{formatTanggalWaktu(latestActivity.timestamp)}</p>
              </div>
              <p className="mt-2 text-base font-bold leading-snug text-slate-950 sm:text-lg">{latestActivity.material}</p>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="ui-meta font-semibold">Penilaian</p>
                <p className={`mt-1 text-lg font-bold ${scoreTone[latestActivity.nilai]}`}>{latestActivity.nilai}</p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-slate-700">Belum ada setoran tercatat.</p>
              <p className="ui-meta mt-1">Setoran pertama akan muncul di sini setelah tersimpan.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="ui-panel p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="ui-meta font-semibold uppercase tracking-[0.06em]">Feedback terbaru</p>
              {latestFeedback ? (
                <>
                  <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">“{latestFeedback.catatan}”</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-slate-700">{latestFeedback.inputBy}</span>
                    <span className="ui-meta">{latestFeedback.category}</span>
                    <span className="ui-meta">{formatTanggalWaktu(latestFeedback.timestamp)}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada feedback tertulis dari Ustadz.</p>
                  <p className="ui-secondary mt-1">Catatan setoran akan ditampilkan di sini ketika tersedia.</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ui-panel p-5 sm:p-6 lg:col-span-2">
          <p className="ui-meta font-semibold uppercase tracking-[0.06em]">Aktivitas saya</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{totalRecords} setoran</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
            {categoryRows.map(row => {
              const meta = categoryMeta[row.category];
              return (
                <div key={row.category} className="min-w-0">
                  <p className={`text-xs font-bold ${meta.text}`}>{row.category}</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-950">{row.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ScrollReveal delay={40} className="ui-panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="ui-section-title">Aktivitas terbaru saya</h2>
            <p className="ui-secondary mt-0.5">Lima catatan terbaru dari seluruh jenis setoran.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="ui-control press-feedback self-start px-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:self-auto"
          >
            Buka riwayat lengkap
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-slate-700">Belum ada aktivitas setoran.</p>
            <p className="ui-meta mt-1">Aktivitas terbaru akan tampil setelah setoran tersimpan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.map(activity => {
              const meta = categoryMeta[activity.category];
              const Icon = meta.icon;
              return (
                <div key={`${activity.category}-${activity.id}`} className="flex items-start gap-3 py-4">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${meta.surface} ${meta.text}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className={`text-sm font-bold ${meta.text}`}>{activity.category}</p>
                        <span className="ui-meta">{formatTanggalWaktu(activity.timestamp)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-700">{activity.material}</p>
                    </div>
                    <p className={`mt-1 text-sm font-bold sm:mt-0 ${scoreTone[activity.nilai]}`}>{activity.nilai}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="ui-section-title">Tren Ziyadah saya</h2>
            <p className="ui-secondary mt-0.5">Grafik menggunakan setoran Ziyadah aktual yang tercatat.</p>
          </div>
          <ZiyadahProgressChart
            ziyadahRecords={santriZiyadah}
            santriName={currentSantri.namaSantri}
            isSantriView={true}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <div className="ui-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="ui-section-title">Lanjutkan belajar di Mushaf</h2>
            <p className="ui-secondary mt-1 max-w-2xl">
              Gunakan Mushaf digital untuk membaca, mengulang, atau menyiapkan hafalan berikutnya sesuai arahan Ustadz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('mushaf')}
            className="ui-control press-feedback inline-flex flex-shrink-0 items-center justify-center gap-2 bg-emerald-800 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <BookOpen className="h-4 w-4" />
            Buka Mushaf 30 Juz
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
};
