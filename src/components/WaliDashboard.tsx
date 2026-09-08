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
  BookPlus,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  MessageSquareText,
  RotateCw,
  Target,
  UserRound
} from 'lucide-react';
import { ZiyadahProgressChart } from './ZiyadahProgressChart';
import { PesmadLogo } from './PesmadLogo';
import { formatTanggalWaktu } from '../utils/dateFormatter';
import { ScrollReveal } from './ScrollReveal';
import { PantauanLiburanWaliSection } from './PantauanLiburanWaliSection';
import { storageService } from '../services/storageService';
import type { NotifyFn } from './Snackbar';

interface WaliDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  setActiveTab: (tab: ActiveTab) => void;
  onNotify: NotifyFn;
}

type ActivityCategory = 'Ziyadah' | "Muroja'ah" | 'Binnadzor' | 'Pembelajaran';

interface WaliActivity {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  material: string;
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
}

const categoryMeta: Record<ActivityCategory, {
  label: string;
  text: string;
  surface: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  Ziyadah: {
    label: 'Ziyadah',
    text: 'text-emerald-800',
    surface: 'bg-emerald-50',
    icon: BookPlus
  },
  "Muroja'ah": {
    label: "Muroja'ah",
    text: 'text-teal-800',
    surface: 'bg-teal-50',
    icon: RotateCw
  },
  Binnadzor: {
    label: 'Binnadzor',
    text: 'text-indigo-800',
    surface: 'bg-indigo-50',
    icon: BookOpenCheck
  },
  Pembelajaran: {
    label: 'Pembelajaran',
    text: 'text-amber-800',
    surface: 'bg-amber-50',
    icon: GraduationCap
  }
};

const scoreTone: Record<PredikatNilai, string> = {
  'Sangat Baik': 'text-emerald-700',
  Baik: 'text-emerald-700',
  Kurang: 'text-amber-700',
  Mengulang: 'text-rose-700'
};

export const WaliDashboard: React.FC<WaliDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  setActiveTab,
  onNotify
}) => {

  const targetSantri = santriList.find(santri => santri.idSantri === currentUser.idSantri);

  if (!targetSantri) {
    return (
      <div className="ui-panel p-5 sm:p-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="ui-section-title">Profil santri belum terhubung</h1>
            <p className="ui-secondary mt-1.5 max-w-2xl">
              Akun wali ini belum terhubung ke profil santri yang tersedia. Hubungi admin untuk memeriksa relasi ID santri sebelum melihat perkembangan.
            </p>
            <p className="ui-meta mt-3 font-semibold text-emerald-800">
              ID terhubung: {currentUser.idSantri || 'Tidak tersedia'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const santriZiyadah = ziyadahRecords.filter(record => record.idSantri === targetSantri.idSantri);
  const santriMurojaah = murojaahRecords.filter(record => record.idSantri === targetSantri.idSantri);
  const santriBinnadzor = binnadzorRecords.filter(record => record.idSantri === targetSantri.idSantri);
  const santriPembelajaran = pembelajaranRecords.filter(record => record.idSantri === targetSantri.idSantri);

  const activities: WaliActivity[] = [
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
  const latestNote = activities.find(activity => Boolean(activity.catatan));
  const totalRecords = activities.length;
  const latestByCategory = (category: ActivityCategory) => activities.find(activity => activity.category === category);
  const categoryRowsSource: { category: ActivityCategory; count: number; latest?: WaliActivity }[] = [
    { category: 'Ziyadah', count: santriZiyadah.length, latest: latestByCategory('Ziyadah') },
    { category: "Muroja'ah", count: santriMurojaah.length, latest: latestByCategory("Muroja'ah") },
    { category: 'Binnadzor', count: santriBinnadzor.length, latest: latestByCategory('Binnadzor') },
    { category: 'Pembelajaran', count: santriPembelajaran.length, latest: latestByCategory('Pembelajaran') }
  ];
  const categoryRows = categoryRowsSource.filter(row => row.count > 0 || row.category !== 'Pembelajaran');

  const latestCategory = latestActivity ? categoryMeta[latestActivity.category] : null;
  const LatestIcon = latestCategory?.icon || BookOpen;
  const programLiburanActive = storageService.getAppConfig().programLiburanActive;

  return (
    <div className="p2-dashboard p2-dashboard-wali w-full min-w-0 space-y-6">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="relative overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:p-6 lg:col-span-3 lg:p-7">
          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" aria-hidden="true" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 sm:h-14 sm:w-14">
              <PesmadLogo size="lg" className="h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-emerald-200">Perkembangan Santri · Pesmad</p>
              <h1 className="mt-1 break-words text-xl font-bold tracking-tight sm:text-2xl">{targetSantri.namaSantri}</h1>
              <p className="mt-1 text-sm leading-relaxed text-emerald-100/90">
                {targetSantri.kelas || 'Kelas belum ditetapkan'} · ID {targetSantri.idSantri}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/15 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-emerald-200">
                <Target className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-[0.06em]">Target hafalan</span>
              </div>
              <p className="mt-1 text-base font-bold text-white sm:text-lg">
                {targetSantri.targetHafalan || 'Belum ditetapkan'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-200/90">
                Data target ditampilkan sesuai profil santri yang tersimpan.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Riwayat
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('mushaf')}
                className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-white px-3.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50"
              >
                <BookOpen className="h-4 w-4" />
                Mushaf
              </button>
            </div>
          </div>
        </div>

        <div className="ui-panel p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="ui-meta font-semibold uppercase tracking-[0.06em]">First read</p>
              <h2 className="ui-section-title mt-1">Setoran terbaru</h2>
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

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="ui-meta font-semibold">Penilaian terakhir</p>
                  <p className={`mt-1 text-lg font-bold ${scoreTone[latestActivity.nilai]}`}>{latestActivity.nilai}</p>
                </div>
                <div className="min-w-0 sm:text-right">
                  <p className="ui-meta font-semibold">Dicatat oleh</p>
                  <p className="mt-1 max-w-[11rem] truncate text-sm font-semibold text-slate-700">{latestActivity.inputBy}</p>
                </div>
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
              <p className="ui-meta font-semibold uppercase tracking-[0.06em]">Catatan Ustadz</p>
              {latestNote ? (
                <>
                  <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">“{latestNote.catatan}”</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-slate-700">{latestNote.inputBy}</span>
                    <span className="ui-meta">{latestNote.category}</span>
                    <span className="ui-meta">{formatTanggalWaktu(latestNote.timestamp)}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada catatan khusus dari Ustadz.</p>
                  <p className="ui-secondary mt-1">Catatan yang ditulis pada setoran akan ditampilkan di bagian ini.</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ui-panel p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="ui-meta font-semibold uppercase tracking-[0.06em]">Perkembangan aktual</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{totalRecords} setoran</h2>
            </div>
            <Clock3 className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {categoryRows.map(row => {
              const meta = categoryMeta[row.category];
              return (
                <div key={row.category} className="min-w-0">
                  <p className={`text-xs font-bold ${meta.text}`}>{meta.label}</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-950">{row.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <ScrollReveal delay={40}>
        <PantauanLiburanWaliSection
          currentUser={currentUser}
          targetSantri={targetSantri}
          isActive={programLiburanActive}
          onNotify={onNotify}
        />
      </ScrollReveal>

      <ScrollReveal delay={60}>
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="ui-section-title">Tren Ziyadah</h2>
            <p className="ui-secondary mt-0.5">Grafik hanya menggunakan setoran Ziyadah aktual yang tercatat.</p>
          </div>
          <ZiyadahProgressChart
            ziyadahRecords={santriZiyadah}
            santriName={targetSantri.namaSantri}
            isSantriView={false}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80} className="ui-panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="ui-section-title">Riwayat terakhir per kategori</h2>
            <p className="ui-secondary mt-0.5">Ringkasan terbaru tanpa menyembunyikan kategori yang belum memiliki setoran.</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="ui-control press-feedback self-start px-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 sm:self-auto"
          >
            Lihat semua riwayat
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {categoryRows.map(row => {
            const meta = categoryMeta[row.category];
            const Icon = meta.icon;
            const latest = row.latest;
            return (
              <div key={row.category} className="flex items-start gap-3 py-4">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${meta.surface} ${meta.text}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                    <span className="ui-meta">{row.count} setoran</span>
                  </div>
                  {latest ? (
                    <div className="mt-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">{latest.material}</p>
                        <p className="ui-meta mt-1">{formatTanggalWaktu(latest.timestamp)}</p>
                      </div>
                      <p className={`mt-1 text-sm font-bold sm:mt-0 ${scoreTone[latest.nilai]}`}>{latest.nilai}</p>
                    </div>
                  ) : (
                    <p className="ui-secondary mt-1">Belum ada setoran {meta.label}.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollReveal>
    </div>
  );
};
