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
import { formatTanggalWaktu } from '../utils/dateFormatter';
import { ScrollReveal } from './ScrollReveal';
import { CompactDashboardHero, HeroAction } from './dashboard/CompactDashboardHero';
import { CompactBentoKpiCard } from './dashboard/CompactBentoKpiCard';
import { CompactQuickActions } from './dashboard/CompactQuickActions';
import { CompactTrenBulananChart } from './dashboard/CompactTrenBulananChart';
import { CompactActivityFeed } from './dashboard/CompactActivityFeed';

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
  'Sangat Baik': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Baik: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Kurang: 'text-amber-700 bg-amber-50 border-amber-200',
  Mengulang: 'text-rose-700 bg-rose-50 border-rose-200'
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
      <div className="ui-bento-card p-5 sm:p-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-900">Profil santri belum terhubung</h1>
            <p className="mt-1.5 text-xs text-slate-600">
              Akun ini belum terhubung ke profil santri yang tersedia. Hubungi admin untuk memeriksa relasi ID santri sebelum melihat data hafalan.
            </p>
            <p className="mt-3 text-xs font-semibold text-emerald-800">
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

  const heroActions: HeroAction[] = [
    {
      label: primaryAction.label,
      onClick: runPrimaryAction,
      icon: primaryAction.target === 'mushaf' ? BookOpen : ArrowRight,
      variant: 'primary'
    }
  ];

  if (primaryAction.target !== 'mushaf') {
    heroActions.push({
      label: 'Buka Mushaf',
      onClick: () => setActiveTab('mushaf'),
      icon: BookOpen,
      variant: 'secondary'
    });
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4 lg:space-y-5">
      {/* 1. COMPACT DASHBOARD HERO */}
      <CompactDashboardHero
        userName={currentSantri.namaSantri}
        greeting="Assalamu'alaikum"
        roleBadge={`Santri · ${currentSantri.kelas || 'Pesmad'}`}
        subtext={
          currentSantri.targetHafalan
            ? `Target hafalan: ${currentSantri.targetHafalan}`
            : 'Tingkatkan kualitas & kelancaran hafalan setiap hari.'
        }
        summaryPill={
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-1 text-emerald-200">
            <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
            <span className="text-[11px] font-semibold">{latestRecency.label}</span>
          </div>
        }
        actions={heroActions}
      />

      {/* 2. COMPACT BENTO KPI GRID (2 columns mobile, 4 columns desktop) */}
      <section
        aria-label="Statistik Belajar Santri"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        <CompactBentoKpiCard
          label="Total Setoran"
          value={totalRecords}
          icon={BookOpenCheck}
          subtitle="Tercatat di sistem"
          iconTone="emerald"
          badge="Total"
          onClick={() => setActiveTab('riwayat')}
        />

        <CompactBentoKpiCard
          label="Ziyadah"
          value={santriZiyadah.length}
          icon={BookPlus}
          subtitle="Hafalan baru"
          iconTone="teal"
          badge="Hafalan"
          onClick={() => setActiveTab('riwayat')}
        />

        <CompactBentoKpiCard
          label="Muraja'ah"
          value={santriMurojaah.length}
          icon={RotateCw}
          subtitle="Pengulangan"
          iconTone="amber"
          badge="Kelancaran"
          onClick={() => setActiveTab('riwayat')}
        />

        <CompactBentoKpiCard
          label="Binnadzor & Kelas"
          value={santriBinnadzor.length + santriPembelajaran.length}
          icon={GraduationCap}
          subtitle="Tilawah & materi"
          iconTone="indigo"
          badge="Kelas"
          onClick={() => setActiveTab('riwayat')}
        />
      </section>

      {/* 3. QUICK ACTIONS BENTO STRIP */}
      <CompactQuickActions
        userRole="Santri"
        setActiveTab={setActiveTab}
      />

      {/* 4. MIDDLE BENTO ROW: Setoran Terakhir & Feedback Ustadz */}
      <section
        aria-label="Konteks Belajar Santri"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4"
      >
        {/* Setoran Terakhir Card */}
        <article
          className="ui-bento-card p-4 sm:p-5 flex flex-col justify-between lg:col-span-6"
          aria-label="Setoran terakhir"
        >
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Setoran Terakhir
                </p>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Catatan terbaru saya
                </h2>
              </div>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl border ${latestCategory?.surface || 'bg-slate-50'} ${latestCategory?.text || 'text-slate-600'}`}
              >
                <LatestIcon className="h-4 w-4" />
              </div>
            </div>

            {latestActivity ? (
              <div className="pt-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${latestCategory?.text}`}>
                    {latestActivity.category}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatTanggalWaktu(latestActivity.timestamp)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-900">
                  {latestActivity.material}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500">Penilaian:</span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-bold border ${scoreTone[latestActivity.nilai]}`}
                      >
                        {latestActivity.nilai}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Dicatat oleh:</span>
                    <p className="mt-0.5 truncate font-semibold text-slate-700">
                      {latestActivity.inputBy}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <BookOpen className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1.5 text-xs font-bold text-slate-700">
                  Belum ada setoran tercatat.
                </p>
                <p className="text-[11px] text-slate-500">
                  Setoran pertama akan muncul di sini setelah tersimpan.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className="group inline-flex w-full items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              <span>Buka seluruh riwayat</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </article>

        {/* Feedback Ustadz Card */}
        <article
          id="santri-feedback-terbaru"
          className="ui-bento-card scroll-mt-24 p-4 sm:p-5 flex flex-col justify-between lg:col-span-6"
          aria-label="Feedback Ustadz"
        >
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-800">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Catatan Pembina
                  </p>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    Feedback Ustadz
                  </h2>
                </div>
              </div>
            </div>

            {latestFeedback ? (
              <div className="pt-3">
                <p className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs sm:text-sm font-medium italic text-slate-800 leading-relaxed">
                  “{latestFeedback.catatan}”
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {latestFeedback.inputBy} ({latestFeedback.category})
                  </span>
                  <span>{formatTanggalWaktu(latestFeedback.timestamp)}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <MessageSquareText className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-1.5 text-xs font-bold text-slate-700">
                  Belum ada catatan tertulis dari Ustadz.
                </p>
                <p className="text-[11px] text-slate-500">
                  Catatan setoran akan otomatis ditampilkan saat Ustadz menyematkan pesan evaluasi.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-emerald-600" />
                Target: {currentSantri.targetHafalan || 'Belum ditetapkan'}
              </span>
            </div>
          </div>
        </article>
      </section>

      {/* 5. TREN & AKTIVITAS BENTO SECTION */}
      <ScrollReveal delay={50} className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1.2fr)] gap-3 sm:gap-4 items-stretch">
          <CompactTrenBulananChart
            ziyadahRecords={santriZiyadah}
            murojaahRecords={santriMurojaah}
            binnadzorRecords={santriBinnadzor}
            pembelajaranRecords={santriPembelajaran}
            targetSantriId={currentSantri.idSantri}
            title="Tren Hafalan"
            subtitle="Perkembangan aktivitas tahfidz Anda"
          />
          <CompactActivityFeed
            activities={activities}
            onViewAll={() => setActiveTab('riwayat')}
            showSantriName={false}
            title="Aktivitas Bulanan"
            subtitle="Catatan setoran terbaru Anda"
          />
        </div>
      </ScrollReveal>
    </div>
  );
};
