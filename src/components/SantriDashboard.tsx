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

interface SantriDashboardProps {
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  setActiveTab: (tab: ActiveTab) => void;
}

type ActivityCategory = 'Ziyadah' | "Muroja'ah" | 'Binnadzor' | 'Pembelajaran';
type RecencyKind = 'empty' | 'today' | 'recent' | 'older';
type PrimaryActionTarget = 'feedback' | 'riwayat' | 'mushaf';

interface SantriActivity {
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

interface PrimaryAction {
  target: PrimaryActionTarget;
  label: string;
  description: string;
}

const categoryMeta: Record<ActivityCategory, {
  label: string;
  text: string;
  surface: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  Ziyadah: { label: 'Ziyadah', text: 'text-emerald-800', surface: 'bg-emerald-50', icon: BookPlus },
  "Muroja'ah": { label: "Muroja'ah", text: 'text-teal-800', surface: 'bg-teal-50', icon: RotateCw },
  Binnadzor: { label: 'Binnadzor', text: 'text-indigo-800', surface: 'bg-indigo-50', icon: BookOpenCheck },
  Pembelajaran: { label: 'Pembelajaran', text: 'text-amber-800', surface: 'bg-amber-50', icon: GraduationCap }
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
      description: 'Belum ada aktivitas pembelajaran yang tercatat untuk akun ini.',
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
      description: 'Setoran terakhir tercatat hari ini.',
      kind: 'today'
    };
  }

  if (dayDifference === 1) {
    return {
      label: 'Diperbarui kemarin',
      description: 'Setoran terakhir tercatat kemarin.',
      kind: 'recent'
    };
  }

  if (dayDifference <= 7) {
    return {
      label: `Diperbarui ${dayDifference} hari lalu`,
      description: `Setoran terakhir tercatat ${dayDifference} hari lalu.`,
      kind: 'recent'
    };
  }

  return {
    label: `Terakhir ${dayDifference} hari lalu`,
    description: `Setoran terakhir tercatat ${dayDifference} hari lalu. Buka riwayat untuk melihat konteks lengkapnya.`,
    kind: 'older'
  };
};

export const SantriDashboard: React.FC<SantriDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  setActiveTab
}) => {
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
  const latestRecency = getRecencyInfo(latestActivity?.timestamp);

  const categoryRows: { category: ActivityCategory; count: number }[] = [
    { category: 'Ziyadah', count: santriZiyadah.length },
    { category: "Muroja'ah", count: santriMurojaah.length },
    { category: 'Binnadzor', count: santriBinnadzor.length },
    { category: 'Pembelajaran', count: santriPembelajaran.length }
  ];

  const primaryAction: PrimaryAction = latestFeedback
    ? {
        target: 'feedback',
        label: 'Baca feedback Ustadz',
        description: 'Ada catatan Ustadz yang dapat dibaca kembali dari setoran yang tercatat.'
      }
    : latestActivity
      ? {
          target: 'riwayat',
          label: 'Buka riwayat saya',
          description: 'Lihat kembali setoran yang sudah tercatat tanpa mengubah data.'
        }
      : {
          target: 'mushaf',
          label: 'Buka Mushaf',
          description: 'Belum ada setoran tercatat. Mushaf tetap dapat digunakan untuk membaca dan menyiapkan hafalan.'
        };

  const jumpToFeedback = () => {
    if (typeof document === 'undefined') return;

    const destination = document.getElementById('santri-feedback-terbaru');
    if (!destination) return;

    const reduceMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    destination.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center'
    });
  };

  const runPrimaryAction = () => {
    if (primaryAction.target === 'feedback') {
      jumpToFeedback();
      return;
    }

    setActiveTab(primaryAction.target);
  };

  return (
    <div className="p2-dashboard p2-dashboard-santri p3-santri-page w-full min-w-0 space-y-6">
      <section className="p322-briefing-grid grid grid-cols-1 gap-4 lg:grid-cols-5" aria-label="Ringkasan belajar Santri">
        <article className="p322-study-hero relative overflow-hidden p-5 text-white sm:p-6 lg:col-span-3 lg:p-7">
          <div className="p322-hero-accent" aria-hidden="true" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 sm:h-14 sm:w-14">
              <PesmadLogo size="lg" className="h-full w-full" />
            </div>
            <div className="p322-briefing-copy min-w-0 flex-1">
              <p className="p322-kicker text-emerald-200">Ringkasan belajar · Pesmad</p>
              <h1 className="p322-display mt-1 break-words text-white">{currentSantri.namaSantri}</h1>
              <p className="p322-body mt-1 text-emerald-100/90">
                {currentSantri.kelas || 'Kelas belum ditetapkan'} · ID {currentSantri.idSantri}
              </p>
              <div className={`p322-recency mt-3 p322-recency-${latestRecency.kind}`} role="status" aria-label={latestRecency.description}>
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {latestRecency.label}
              </div>
            </div>
          </div>

          <div className="p322-hero-footer mt-6 grid grid-cols-1 gap-4 border-t border-white/15 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-emerald-200">
                <Target className="h-4 w-4" aria-hidden="true" />
                <span className="p322-kicker">Target hafalan saya</span>
              </div>
              <p className="p322-heading mt-1 text-white">
                {currentSantri.targetHafalan || 'Belum ditetapkan'}
              </p>
              <p className="p322-meta mt-1 max-w-2xl text-emerald-100/80">
                Target ditampilkan langsung dari profil santri yang tersimpan.
              </p>
            </div>

            <div className="min-w-0 sm:max-w-xs sm:text-right">
              <p className="p322-meta text-emerald-100/80">{primaryAction.description}</p>
              <button
                type="button"
                onClick={runPrimaryAction}
                className="ui-control press-feedback mt-2 inline-flex w-full items-center justify-center gap-2 bg-white px-4 text-sm font-bold text-emerald-950 transition-colors hover:bg-emerald-50 sm:w-auto"
              >
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>

        <article className="ui-panel p322-surface-secondary p-5 sm:p-6 lg:col-span-2" aria-label="Setoran terakhir">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="min-w-0">
              <p className="p322-kicker text-slate-500">Setoran terakhir</p>
              <h2 className="p322-heading mt-1 text-slate-950">Catatan terbaru saya</h2>
            </div>
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${latestCategory?.surface || 'bg-slate-100'} ${latestCategory?.text || 'text-slate-600'}`}>
              <LatestIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          {latestActivity ? (
            <div className="pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={`text-sm font-bold ${latestCategory?.text}`}>{latestActivity.category}</p>
                <p className="p322-meta text-slate-500">{formatTanggalWaktu(latestActivity.timestamp)}</p>
              </div>
              <p className="mt-2 text-base font-bold leading-snug text-slate-950 sm:text-lg">{latestActivity.material}</p>
              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <p className="p322-meta font-semibold text-slate-500">Penilaian</p>
                  <p className={`mt-1 text-lg font-bold ${scoreTone[latestActivity.nilai]}`}>{latestActivity.nilai}</p>
                </div>
                <div className="min-w-0 sm:text-right">
                  <p className="p322-meta font-semibold text-slate-500">Dicatat oleh</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">{latestActivity.inputBy}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-slate-700">Belum ada setoran tercatat.</p>
              <p className="p322-meta mt-1 text-slate-500">Setoran pertama akan muncul di sini setelah tersimpan.</p>
            </div>
          )}
        </article>
      </section>

      <section className="p322-context-grid grid grid-cols-1 gap-4 lg:grid-cols-5" aria-label="Konteks belajar Santri">
        <article id="santri-feedback-terbaru" className="ui-panel p322-surface-tertiary scroll-mt-32 p-5 sm:p-6 lg:col-span-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
              <MessageSquareText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="p322-kicker text-slate-500">Feedback Ustadz</p>
              {latestFeedback ? (
                <>
                  <p className="p322-body mt-2 font-semibold text-slate-900">“{latestFeedback.catatan}”</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-semibold text-slate-700">{latestFeedback.inputBy}</span>
                    <span className="p322-meta text-slate-500">{latestFeedback.category}</span>
                    <span className="p322-meta text-slate-500">{formatTanggalWaktu(latestFeedback.timestamp)}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada feedback tertulis dari Ustadz.</p>
                  <p className="p322-body mt-1 text-slate-600">Catatan setoran akan ditampilkan di sini ketika tersedia.</p>
                </>
              )}
            </div>
          </div>
        </article>

        <article className="ui-panel p322-surface-tertiary p-5 sm:p-6 lg:col-span-2" aria-label="Jumlah setoran tercatat">
          <p className="p322-kicker text-slate-500">Data pembelajaran saya</p>
          <h2 className="p322-heading mt-1 text-slate-950">{totalRecords} setoran tercatat</h2>
          <p className="p322-meta mt-1 text-slate-500">Jumlah ini berasal dari record yang tersedia, bukan estimasi progres.</p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4">
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

      <ScrollReveal delay={40} className="ui-panel p322-deferred-surface p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="p322-heading text-slate-950">Aktivitas terbaru saya</h2>
            <p className="p322-body mt-0.5 text-slate-600">Lima catatan terbaru dari seluruh jenis setoran yang tersedia.</p>
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
            <p className="p322-meta mt-1 text-slate-500">Aktivitas terbaru akan tampil setelah setoran tersimpan.</p>
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
                        <p className={`text-sm font-bold ${meta.text}`}>{meta.label}</p>
                        <span className="p322-meta text-slate-500">{formatTanggalWaktu(activity.timestamp)}</span>
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

      <ScrollReveal delay={60} className="p322-deferred-surface">
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="p322-heading text-slate-950">Tren Ziyadah saya</h2>
            <p className="p322-body mt-0.5 text-slate-600">Grafik menggunakan setoran Ziyadah aktual yang tercatat.</p>
          </div>
          <ZiyadahProgressChart
            ziyadahRecords={santriZiyadah}
            santriName={currentSantri.namaSantri}
            isSantriView={true}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80} className="p322-deferred-surface">
        <div className="ui-panel p322-surface-tertiary flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2 className="p322-heading text-slate-950">Lanjutkan belajar di Mushaf</h2>
            <p className="p322-body mt-1 max-w-2xl text-slate-600">
              Gunakan Mushaf digital untuk membaca, mengulang, atau menyiapkan hafalan sesuai target dan arahan Ustadz yang tersedia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('mushaf')}
            className="ui-control press-feedback inline-flex flex-shrink-0 items-center justify-center gap-2 bg-emerald-800 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Buka Mushaf 30 Juz
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
};