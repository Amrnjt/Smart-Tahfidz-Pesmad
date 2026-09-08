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
type RecencyKind = 'empty' | 'today' | 'recent' | 'older';

interface WaliActivity {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  material: string;
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
}

interface RecencyInfo {
  label: string;
  description: string;
  kind: RecencyKind;
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

const getRecencyInfo = (timestamp?: string): RecencyInfo => {
  if (!timestamp) {
    return {
      label: 'Belum ada setoran',
      description: 'Belum ada aktivitas pembelajaran yang tercatat untuk santri ini.',
      kind: 'empty'
    };
  }

  const activityDate = new Date(timestamp);
  if (Number.isNaN(activityDate.getTime())) {
    return {
      label: 'Waktu belum tersedia',
      description: 'Timestamp aktivitas terakhir tidak dapat dibaca.',
      kind: 'empty'
    };
  }

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const activityUtc = Date.UTC(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
  const dayDifference = Math.max(0, Math.floor((todayUtc - activityUtc) / 86_400_000));

  if (dayDifference === 0) {
    return {
      label: 'Diperbarui hari ini',
      description: 'Aktivitas terakhir tercatat hari ini.',
      kind: 'today'
    };
  }

  if (dayDifference === 1) {
    return {
      label: 'Diperbarui kemarin',
      description: 'Aktivitas terakhir tercatat kemarin.',
      kind: 'recent'
    };
  }

  if (dayDifference <= 7) {
    return {
      label: `Diperbarui ${dayDifference} hari lalu`,
      description: `Aktivitas terakhir tercatat ${dayDifference} hari lalu.`,
      kind: 'recent'
    };
  }

  return {
    label: `Terakhir ${dayDifference} hari lalu`,
    description: `Aktivitas terakhir tercatat ${dayDifference} hari lalu. Buka riwayat untuk melihat konteks lengkapnya.`,
    kind: 'older'
  };
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
  const categoryRows: { category: ActivityCategory; count: number; latest?: WaliActivity }[] = [
    { category: 'Ziyadah', count: santriZiyadah.length, latest: latestByCategory('Ziyadah') },
    { category: "Muroja'ah", count: santriMurojaah.length, latest: latestByCategory("Muroja'ah") },
    { category: 'Binnadzor', count: santriBinnadzor.length, latest: latestByCategory('Binnadzor') },
    { category: 'Pembelajaran', count: santriPembelajaran.length, latest: latestByCategory('Pembelajaran') }
  ];

  const latestCategory = latestActivity ? categoryMeta[latestActivity.category] : null;
  const LatestIcon = latestCategory?.icon || BookOpen;
  const latestRecency = getRecencyInfo(latestActivity?.timestamp);
  const programLiburanActive = storageService.getAppConfig().programLiburanActive;

  const jumpToPantauanLiburan = () => {
    if (typeof document === 'undefined') return;

    const dateControl = document.getElementById('tanggal-pantauan');
    const destination = dateControl?.closest('section') || dateControl;
    if (!destination) return;

    const reduceMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    destination.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  const primaryAction = programLiburanActive
    ? {
        label: 'Isi pantauan liburan',
        description: 'Program pantauan liburan sedang aktif.',
        icon: ArrowRight,
        onClick: jumpToPantauanLiburan
      }
    : latestActivity
      ? {
          label: 'Lihat riwayat',
          description: 'Buka detail aktivitas yang benar-benar tercatat.',
          icon: ArrowRight,
          onClick: () => setActiveTab('riwayat')
        }
      : {
          label: 'Buka Mushaf',
          description: 'Belum ada setoran; Mushaf tetap tersedia untuk dibaca.',
          icon: BookOpen,
          onClick: () => setActiveTab('mushaf')
        };

  const secondaryAction = programLiburanActive
    ? latestActivity
      ? { label: 'Lihat riwayat', onClick: () => setActiveTab('riwayat') }
      : { label: 'Buka Mushaf', onClick: () => setActiveTab('mushaf') }
    : latestActivity
      ? { label: 'Buka Mushaf', onClick: () => setActiveTab('mushaf') }
      : null;

  const PrimaryActionIcon = primaryAction.icon;

  return (
    <div className="p2-dashboard p2-dashboard-wali p3-wali-page w-full min-w-0 space-y-6">
      <section
        className="p321-briefing-grid grid grid-cols-1 gap-4 lg:grid-cols-5"
        aria-label={`Briefing wali untuk ${targetSantri.namaSantri}`}
      >
        <article className="p321-parent-hero relative overflow-hidden p-5 text-white sm:p-6 lg:col-span-3 lg:p-7">
          <div className="p321-hero-accent" aria-hidden="true" />

          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 sm:h-14 sm:w-14">
                  <PesmadLogo size="lg" className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="p321-kicker text-emerald-100">Briefing Wali · Pesmad</p>
                  <h1 className="p321-display mt-1 break-words text-white">{targetSantri.namaSantri}</h1>
                  <p className="p321-body mt-1 text-emerald-100/90">
                    {targetSantri.kelas || 'Kelas belum ditetapkan'} · ID {targetSantri.idSantri}
                  </p>
                </div>
              </div>

              <div className={`p321-recency p321-recency-${latestRecency.kind}`} title={latestRecency.description}>
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{latestRecency.label}</span>
              </div>
            </div>

            <div className="p321-briefing-copy">
              <p className="p321-kicker text-emerald-100">Ringkasan saat ini</p>
              {latestActivity ? (
                <p className="p321-body mt-1.5 text-white">
                  Setoran terakhir berupa <strong>{latestActivity.category}</strong> dengan penilaian{' '}
                  <strong>{latestActivity.nilai}</strong>. Detail lengkap tetap tersedia di riwayat.
                </p>
              ) : (
                <p className="p321-body mt-1.5 text-white">
                  Belum ada setoran yang tercatat. Tidak ada progres estimasi atau angka pengganti yang ditampilkan.
                </p>
              )}
            </div>

            <div className="p321-hero-footer grid grid-cols-1 gap-4 border-t border-white/15 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Target className="h-4 w-4" aria-hidden="true" />
                  <span className="p321-kicker">Target hafalan</span>
                </div>
                <p className="p321-heading mt-1 text-white">
                  {targetSantri.targetHafalan || 'Belum ditetapkan'}
                </p>
                <p className="p321-meta mt-1 text-emerald-100/85">
                  Ditampilkan persis dari profil santri yang tersimpan.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {secondaryAction && (
                  <button
                    type="button"
                    onClick={secondaryAction.onClick}
                    className="ui-control press-feedback inline-flex items-center justify-center border border-white/20 bg-white/10 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                  >
                    {secondaryAction.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  aria-label={`${primaryAction.label}. ${primaryAction.description}`}
                  className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-white px-3.5 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50"
                >
                  <PrimaryActionIcon className="h-4 w-4" aria-hidden="true" />
                  {primaryAction.label}
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="ui-panel p321-surface-secondary p-5 sm:p-6 lg:col-span-2" aria-labelledby="wali-latest-title">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="p321-kicker text-slate-500">Setoran aktual</p>
              <h2 id="wali-latest-title" className="p321-heading mt-1 text-slate-950">Setoran terbaru</h2>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${latestCategory?.surface || 'bg-slate-100'} ${latestCategory?.text || 'text-slate-600'}`}>
              <LatestIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          {latestActivity ? (
            <div className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-sm font-bold ${latestCategory?.text}`}>{latestActivity.category}</p>
                <span className={`p321-recency p321-recency-${latestRecency.kind}`}>
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {latestRecency.label}
                </span>
              </div>
              <p className="p321-heading mt-2 text-slate-950">{latestActivity.material}</p>
              <p className="p321-meta mt-1 text-slate-500">{formatTanggalWaktu(latestActivity.timestamp)}</p>

              <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="p321-meta font-semibold text-slate-500">Penilaian terakhir</p>
                  <p className={`mt-1 text-lg font-bold ${scoreTone[latestActivity.nilai]}`}>{latestActivity.nilai}</p>
                </div>
                <div className="min-w-0 sm:text-right">
                  <p className="p321-meta font-semibold text-slate-500">Dicatat oleh</p>
                  <p className="mt-1 max-w-[11rem] truncate text-sm font-semibold text-slate-700 sm:ml-auto">{latestActivity.inputBy}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-slate-700">Belum ada setoran tercatat.</p>
              <p className="p321-meta mt-1 text-slate-500">Setoran pertama akan muncul di sini setelah benar-benar tersimpan.</p>
            </div>
          )}
        </article>
      </section>

      <section className="p321-context-grid grid grid-cols-1 gap-4 lg:grid-cols-5" aria-label="Konteks perkembangan santri">
        <article className="ui-panel p321-surface-tertiary p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="p321-kicker text-slate-500">Catatan Ustadz</p>
              {latestNote ? (
                <>
                  <p className="p321-body mt-2 font-semibold text-slate-900">“{latestNote.catatan}”</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-slate-700">{latestNote.inputBy}</span>
                    <span className="p321-meta text-slate-500">{latestNote.category}</span>
                    <span className="p321-meta text-slate-500">{getRecencyInfo(latestNote.timestamp).label}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada catatan khusus dari Ustadz.</p>
                  <p className="p321-body mt-1 text-slate-600">Catatan yang ditulis pada setoran akan ditampilkan di bagian ini.</p>
                </>
              )}
            </div>
          </div>
        </article>

        <article className="ui-panel p321-surface-tertiary p-5 sm:p-6 lg:col-span-2" aria-labelledby="wali-activity-title">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="p321-kicker text-slate-500">Aktivitas tersimpan</p>
              <h2 id="wali-activity-title" className="p321-heading mt-1 text-slate-950">{totalRecords} setoran tercatat</h2>
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
        </article>
      </section>

      <ScrollReveal delay={40} className="p321-deferred-surface">
        <PantauanLiburanWaliSection
          currentUser={currentUser}
          targetSantri={targetSantri}
          isActive={programLiburanActive}
          onNotify={onNotify}
        />
      </ScrollReveal>

      <ScrollReveal delay={60} className="p321-deferred-surface">
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="p321-heading text-slate-950">Tren Ziyadah</h2>
            <p className="p321-body mt-0.5 text-slate-600">Grafik hanya menggunakan setoran Ziyadah aktual yang tercatat.</p>
          </div>
          <ZiyadahProgressChart
            ziyadahRecords={santriZiyadah}
            santriName={targetSantri.namaSantri}
            isSantriView={false}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80} className="ui-panel p321-surface-tertiary p321-deferred-surface p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="p321-heading text-slate-950">Riwayat terakhir per kategori</h2>
            <p className="p321-body mt-0.5 text-slate-600">Semua kategori ditampilkan, termasuk yang belum memiliki setoran.</p>
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
            const rowRecency = getRecencyInfo(latest?.timestamp);

            return (
              <div key={row.category} className="flex items-start gap-3 py-4">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${meta.surface} ${meta.text}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                    <span className="p321-meta text-slate-500">{row.count} setoran</span>
                  </div>
                  {latest ? (
                    <div className="mt-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700">{latest.material}</p>
                        <p className="p321-meta mt-1 text-slate-500">
                          {rowRecency.label} · {formatTanggalWaktu(latest.timestamp)}
                        </p>
                      </div>
                      <p className={`mt-1 text-sm font-bold sm:mt-0 ${scoreTone[latest.nilai]}`}>{latest.nilai}</p>
                    </div>
                  ) : (
                    <p className="p321-body mt-1 text-slate-600">Belum ada setoran {meta.label}.</p>
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