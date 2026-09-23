import React, { Suspense, lazy, useMemo, useState } from 'react';
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
  BookPlus,
  CalendarCheck,
  ChartBar as BarChart3,
  RotateCw,
  TrendingUp,
  Activity,
  Users
} from 'lucide-react';
import { getTodayInputFormat } from '../utils/dateFormatter';
import { calculateSetoranMomentum, isSetoranActiveDay } from '../utils/scheduleHelper';
import { CompactDashboardHero, HeroAction } from './dashboard/CompactDashboardHero';
import { CompactBentoKpiCard } from './dashboard/CompactBentoKpiCard';
import { CompactAttentionBento, AttentionItem } from './dashboard/CompactAttentionBento';
import { SevenDayRhythmBento } from './dashboard/SevenDayRhythmBento';
import { QualityRingBento } from './dashboard/QualityRingBento';
import { CompactTrenBulananChart } from './dashboard/CompactTrenBulananChart';
import { CompactActivityFeed } from './dashboard/CompactActivityFeed';
import { ScrollReveal } from './ScrollReveal';

const HafalanStatsChart = lazy(() =>
  import('./HafalanStatsChart').then((module) => ({ default: module.HafalanStatsChart }))
);
const AdaptiveDevelopmentTrend = lazy(() =>
  import('./dashboard/AdaptiveDevelopmentTrend').then((module) => ({ default: module.AdaptiveDevelopmentTrend }))
);

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

export const UstadzDashboard: React.FC<UstadzDashboardProps> = ({
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  kelasList,
  setActiveTab,
  onOpenSetorMenu
}) => {
  const [chartView, setChartView] = useState<'tren_setor' | 'tren_perkembangan' | 'analisis_detail'>('tren_setor');

  const normalizedRole = String(currentUser?.role || '').trim().toLowerCase();
  const isPimpinan = normalizedRole === 'pimpinan';
  const hasGlobalClassView = ['pimpinan', 'admin', 'superadmin'].includes(normalizedRole);

  const today = getTodayInputFormat();
  const santriById = useMemo(
    () => new Map<string, Santri>(santriList.map(santri => [santri.idSantri, santri])),
    [santriList]
  );

  const activities = useMemo<DashboardActivity[]>(() => {
    const resolveName = (idSantri: string, fallback?: string) =>
      fallback || santriById.get(idSantri)?.namaSantri || idSantri;
    const rawActivities: DashboardActivity[] = [
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
    ];

    const seenActivityIds = new Set<string>();
    return rawActivities
      .filter(record => {
        const key = `${record.category}-${record.id}`;
        if (seenActivityIds.has(key)) return false;
        seenActivityIds.add(key);
        return true;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [ziyadahRecords, murojaahRecords, binnadzorRecords, pembelajaranRecords, santriById]);

  const todayActivities = useMemo(
    () => activities.filter(record => record.timestamp.startsWith(today)),
    [activities, today]
  );
  const attentionActivities = useMemo(
    () => activities.filter(record => record.nilai === 'Kurang' || record.nilai === 'Mengulang'),
    [activities]
  );
  const todayAttention = useMemo(
    () => attentionActivities.filter(record => record.timestamp.startsWith(today)),
    [attentionActivities, today]
  );
  const sangatBaikCount = useMemo(
    () => activities.filter(record => record.nilai === 'Sangat Baik').length,
    [activities]
  );
  const sangatBaikPercent = activities.length > 0 ? Math.round((sangatBaikCount / activities.length) * 100) : null;

  const classOverview = useMemo(() => {
    const scopedClasses = hasGlobalClassView
      ? kelasList
      : kelasList.filter(kelas =>
          kelas.musyrifId === currentUser.id
          || (!!currentUser.kelasId && kelas.id === currentUser.kelasId)
        );

    const uniqueSantriIds = new Set<string>();
    scopedClasses.forEach(kelas => {
      (kelas.santriIds || []).forEach(idSantri => {
        if (idSantri) uniqueSantriIds.add(idSantri);
      });
    });

    const classNames = scopedClasses
      .map(kelas => kelas.namaKelas)
      .filter(Boolean);

    const todayScopedActivityCount = todayActivities.filter(activity =>
      uniqueSantriIds.has(activity.idSantri)
    ).length;

    const primary = scopedClasses.length === 0
      ? (hasGlobalClassView ? 'Belum ada kelas' : 'Belum ada kelas diampu')
      : hasGlobalClassView
        ? `${uniqueSantriIds.size} Santri · ${scopedClasses.length} Kelas`
        : scopedClasses.length === 1
          ? classNames[0] || '1 Kelas'
          : `${classNames[0] || 'Kelas'} +${scopedClasses.length - 1} lainnya`;

    const secondary = scopedClasses.length === 0
      ? (hasGlobalClassView ? 'Belum ada kelompok pembelajaran' : 'Atur musyrif pada Kelola Kelas')
      : hasGlobalClassView
        ? `${todayScopedActivityCount} Aktivitas Hari Ini`
        : `${uniqueSantriIds.size} Santri • ${todayScopedActivityCount} Aktivitas Hari Ini`;

    return {
      label: hasGlobalClassView ? 'Kelompok Pembelajaran' : 'Kelas Diampu',
      primary,
      secondary,
      classNames: classNames.join(', '),
    };
  }, [kelasList, currentUser.id, currentUser.kelasId, hasGlobalClassView, todayActivities]);

  const todayZiyadahCount = todayActivities.filter(record => record.category === 'Ziyadah').length;
  const todayMurojaahCount = todayActivities.filter(record => record.category === "Muroja'ah").length;

  const sevenDayPulse = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00+07:00`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const count = activities.filter(record => record.timestamp.startsWith(key)).length;
    const label = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(date).replace('.', '');
    const isActiveDay = isSetoranActiveDay(key);
    return { key, label, count, isActiveDay };
  }), [activities, today]);

  const sevenDayTotal = sevenDayPulse.reduce((sum, day) => sum + day.count, 0);
  const todayCount = sevenDayPulse[6]?.count ?? todayActivities.length;
  const { momentumLabel, delta: momentumDelta } = calculateSetoranMomentum(today, todayCount, activities);

  const jumpToAttention = () => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById('ustadz-tindak-lanjut');
    if (!target) return;
    const reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  };

  const openAnalytics = () => {
    setChartView('analisis_detail');
    requestAnimationFrame(() => {
      const target = document.getElementById('dashboard-analytics');
      if (!target) return;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };

  // Daily Command Hero Context
  const todayActiveSantriCount = new Set(todayActivities.map(a => a.idSantri)).size;
  const dailySummary = todayActivities.length > 0
    ? `${todayActivities.length} setoran tercatat hari ini dari ${todayActiveSantriCount} santri aktif.`
    : 'Pantau setoran dan evaluasi perkembangan hafalan santri hari ini.';

  const statusNotice = todayAttention.length > 0
    ? {
        text: `${todayAttention.length} setoran perlu tindak lanjut hari ini.`,
        type: 'attention' as const,
      }
    : {
        text: 'Semua setoran hari ini dalam kondisi baik.',
        type: 'positive' as const,
      };

  // Primary CTA: conditional Tinjau Tindak Lanjut
  const primaryHeroAction: HeroAction | null = todayAttention.length > 0
    ? {
        label: `Tinjau ${todayAttention.length} Tindak Lanjut`,
        onClick: jumpToAttention,
        icon: AlertTriangle,
        variant: 'amber',
        ariaLabel: `Tinjau ${todayAttention.length} setoran yang perlu tindak lanjut`,
      }
    : null;

  // Calm secondary action when all is good
  const secondaryHeroAction: HeroAction | null = todayAttention.length === 0
    ? {
        label: 'Lihat Riwayat',
        onClick: () => setActiveTab('riwayat'),
        icon: CalendarCheck,
        variant: 'secondary',
        ariaLabel: 'Buka riwayat setoran hari ini',
      }
    : null;

  const attentionItems = useMemo<AttentionItem[]>(() => attentionActivities.map(item => ({
    id: item.id,
    idSantri: item.idSantri,
    namaSantri: item.namaSantri,
    category: item.category,
    material: item.material,
    nilai: item.nilai,
    timestamp: item.timestamp,
  })), [attentionActivities]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4 lg:space-y-5">
      {/* 1. DAILY COMMAND HERO (Contextual, Height: Mobile 150-180px, Desktop 205-240px) */}
      <CompactDashboardHero
        userName={currentUser.nama}
        greeting="Assalamu'alaikum"
        roleBadge={`Dashboard ${currentUser.role || 'Ustadz'}`}
        subtext={dailySummary}
        statusNotice={statusNotice}
        primaryAction={primaryHeroAction}
        secondaryAction={secondaryHeroAction}
        summaryPill={
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-950/60 px-2.5 py-1 text-left transition-colors hover:bg-emerald-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            aria-label={`${todayActivities.length} setoran hari ini. Buka riwayat`}
            title="Buka riwayat setoran hari ini"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0" />
            <span className="text-[11px] font-bold text-white leading-none">
              {todayActivities.length}{' '}
              <span className="font-normal text-emerald-200/80">Hari Ini</span>
            </span>
            <ArrowRight className="h-3 w-3 text-emerald-400/80" />
          </button>
        }
      />

      {/* 2. COMPACT BENTO KPI GRID (2 columns on mobile, 4 columns on tablet & desktop) */}
      <section
        aria-label="Statistik Kunci Setoran"
        className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-3.5 w-full min-w-0"
      >
        <CompactBentoKpiCard
          label="Setoran Hari Ini"
          value={todayActivities.length}
          icon={CalendarCheck}
          trend={momentumLabel}
          trendPositive={typeof momentumDelta === 'number' && momentumDelta > 0 ? true : typeof momentumDelta === 'number' && momentumDelta < 0 ? false : null}
          iconTone="emerald"
          badge="Harian"
          onClick={() => setActiveTab('riwayat')}
        />

        <CompactBentoKpiCard
          label="Santri Aktif"
          value={santriList.length}
          icon={Users}
          subtitle="Bina & monitoring"
          iconTone="indigo"
          badge="Total"
          onClick={() => setActiveTab(isPimpinan ? 'riwayat' : 'santri')}
        />

        <CompactBentoKpiCard
          label="Ziyadah Hari Ini"
          value={todayZiyadahCount}
          icon={BookPlus}
          subtitle={`${todayActivities.length > 0 ? Math.round((todayZiyadahCount / todayActivities.length) * 100) : 0}% dari setoran`}
          iconTone="teal"
          progressPercent={todayActivities.length > 0 ? (todayZiyadahCount / todayActivities.length) * 100 : 0}
          onClick={() => setActiveTab(isPimpinan ? 'riwayat' : 'ziyadah')}
        />

        <CompactBentoKpiCard
          label="Muraja'ah Hari Ini"
          value={todayMurojaahCount}
          icon={RotateCw}
          subtitle={`${todayActivities.length > 0 ? Math.round((todayMurojaahCount / todayActivities.length) * 100) : 0}% dari setoran`}
          iconTone="amber"
          progressPercent={todayActivities.length > 0 ? (todayMurojaahCount / todayActivities.length) * 100 : 0}
          onClick={() => setActiveTab(isPimpinan ? 'riwayat' : 'murojaah')}
        />
      </section>

      {/* 3. INSIGHT BENTO ROW: 7-Day Velocity & Quality (5 : 3 desktop ratio) */}
      <section
        aria-label="Ritme dan Kualitas Setoran"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-3 sm:gap-4 items-stretch w-full min-w-0"
      >
        {/* 7-Day Rhythm Pulse (± 5/8 desktop) */}
        <div className="md:col-span-1 lg:col-span-5 min-w-0 w-full">
          <SevenDayRhythmBento
            pulse={sevenDayPulse}
            todayKey={today}
            totalWeekly={sevenDayTotal}
            momentumLabel={momentumLabel}
            className="h-full"
          />
        </div>

        {/* Quality & Additional Summary (± 3/8 desktop) */}
        <div className="md:col-span-1 lg:col-span-3 flex flex-col gap-3 min-w-0 w-full">
          <QualityRingBento
            percent={sangatBaikPercent}
            count={sangatBaikCount}
            total={activities.length}
            onClick={openAnalytics}
            className="flex-1"
          />

          <button
            type="button"
            onClick={() => setActiveTab(isPimpinan ? 'riwayat' : 'kelas')}
            className="ripple-container ui-bento-card ui-bento-card-interactive flex flex-1 items-center justify-between p-3.5 sm:p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={`${classOverview.label}: ${classOverview.primary}. ${classOverview.secondary}`}
            title={classOverview.classNames || undefined}
          >
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {classOverview.label}
              </p>
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {classOverview.primary}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                {classOverview.secondary}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
          </button>
        </div>
      </section>

      {/* 4. PERHATIAN & TINDAK LANJUT EVALUASI */}
      <CompactAttentionBento
        todayAttentionCount={todayAttention.length}
        totalAttentionCount={attentionActivities.length}
        items={attentionItems}
        onViewAll={() => setActiveTab('riwayat')}
      />

      {/* 5. TREN & AKTIVITAS BENTO SECTION */}
      <ScrollReveal delay={50} className="space-y-3">
        <div
          id="dashboard-analytics"
          className="scroll-mt-24 flex flex-col gap-2.5 px-1 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
              Tren & Aktivitas
            </span>
            <h2 className="text-base sm:text-lg font-[800] tracking-tight text-slate-900">
              Perkembangan & Aktivitas Bulanan
            </h2>
          </div>

          <div
            className="grid w-full grid-cols-3 gap-1 rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs sm:w-auto"
            role="group"
            aria-label="Pilihan tampilan analitik"
          >
            <button
              type="button"
              onClick={() => setChartView('tren_setor')}
              aria-pressed={chartView === 'tren_setor'}
              className={`flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer sm:px-3 sm:text-xs ${
                chartView === 'tren_setor'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="hidden h-3.5 w-3.5 sm:block" />
              <span className="sm:hidden">Setor</span><span className="hidden sm:inline">Tren Setor</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('tren_perkembangan')}
              aria-pressed={chartView === 'tren_perkembangan'}
              className={`flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer sm:px-3 sm:text-xs ${
                chartView === 'tren_perkembangan'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="hidden h-3.5 w-3.5 sm:block" />
              <span className="sm:hidden">Perkembangan</span><span className="hidden sm:inline">Tren Perkembangan</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('analisis_detail')}
              aria-pressed={chartView === 'analisis_detail'}
              className={`flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-1.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer sm:px-3 sm:text-xs ${
                chartView === 'analisis_detail'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="hidden h-3.5 w-3.5 sm:block" />
              <span className="sm:hidden">Analisis</span><span className="hidden sm:inline">Analisis Detail</span>
            </button>
          </div>
        </div>

        {chartView === 'tren_setor' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1.2fr)] gap-3 sm:gap-4 items-stretch w-full min-w-0">
            <CompactTrenBulananChart
              ziyadahRecords={ziyadahRecords}
              murojaahRecords={murojaahRecords}
              binnadzorRecords={binnadzorRecords}
              pembelajaranRecords={pembelajaranRecords}
              title="Tren Bulanan"
              subtitle="Perkembangan aktivitas tahfidz"
            />
            <CompactActivityFeed
              activities={activities}
              onViewAll={() => setActiveTab('riwayat')}
              showSantriName={true}
              title="Aktivitas Bulanan"
              subtitle="Aktivitas terbaru santri"
            />
          </div>
        )}

        {chartView === 'tren_perkembangan' && (
          <Suspense fallback={<div className="ui-bento-card p-6 text-sm text-slate-500">Memuat tren perkembangan...</div>}>
            <AdaptiveDevelopmentTrend
              kelasList={kelasList}
              santriList={santriList}
              ziyadahRecords={ziyadahRecords}
              murojaahRecords={murojaahRecords}
              binnadzorRecords={binnadzorRecords}
              pembelajaranRecords={pembelajaranRecords}
            />
          </Suspense>
        )}

        {chartView === 'analisis_detail' && (
          <Suspense fallback={<div className="ui-bento-card p-6 text-sm text-slate-500">Memuat analitik hafalan...</div>}>
            <div className="ui-bento-card overflow-hidden p-3 sm:p-5">
              <HafalanStatsChart
                santriList={santriList}
                ziyadahRecords={ziyadahRecords}
                murojaahRecords={murojaahRecords}
                binnadzorRecords={binnadzorRecords}
                pembelajaranRecords={pembelajaranRecords}
                kelasList={kelasList}
              />
            </div>
          </Suspense>
        )}
      </ScrollReveal>
    </div>
  );
};
