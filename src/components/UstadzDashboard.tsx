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
  BookPlus,
  CalendarCheck,
  ChartBar as BarChart3,
  CirclePlus as PlusCircle,
  RotateCw,
  TrendingUp,
  Users
} from 'lucide-react';
import { getTodayInputFormat } from '../utils/dateFormatter';
import { HafalanStatsChart } from './HafalanStatsChart';
import { CompactDashboardHero, HeroAction } from './dashboard/CompactDashboardHero';
import { CompactBentoKpiCard } from './dashboard/CompactBentoKpiCard';
import { CompactQuickActions } from './dashboard/CompactQuickActions';
import { CompactAttentionBento, AttentionItem } from './dashboard/CompactAttentionBento';
import { SevenDayRhythmBento } from './dashboard/SevenDayRhythmBento';
import { QualityRingBento } from './dashboard/QualityRingBento';
import { CompactTrenBulananChart } from './dashboard/CompactTrenBulananChart';
import { CompactActivityFeed } from './dashboard/CompactActivityFeed';
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
  const [chartView, setChartView] = useState<'ringkasan' | 'analisis_detail'>('ringkasan');

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

  const todayZiyadahCount = todayActivities.filter(record => record.category === 'Ziyadah').length;
  const todayMurojaahCount = todayActivities.filter(record => record.category === "Muroja'ah").length;
  const todayBinnadzorCount = todayActivities.filter(record => record.category === 'Binnadzor').length;
  const todayPembelajaranCount = todayActivities.filter(record => record.category === 'Pembelajaran').length;

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

  const sevenDayTotal = sevenDayPulse.reduce((sum, day) => sum + day.count, 0);
  const yesterdayCount = sevenDayPulse[5]?.count ?? 0;
  const todayCount = sevenDayPulse[6]?.count ?? todayActivities.length;
  const momentumDelta = todayCount - yesterdayCount;
  const momentumLabel = momentumDelta > 0
    ? `+${momentumDelta} dari kemarin`
    : momentumDelta < 0
      ? `${momentumDelta} dari kemarin`
      : 'sama dengan kemarin';

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

  // Prepare Hero Actions (1-2 primary CTAs)
  const heroActions: HeroAction[] = todayAttention.length > 0
    ? [
        {
          label: `Tinjau ${todayAttention.length} Tindak Lanjut`,
          onClick: jumpToAttention,
          icon: AlertTriangle,
          variant: 'amber'
        },
        {
          label: 'Mulai Setor',
          onClick: onOpenSetorMenu,
          icon: PlusCircle,
          variant: 'secondary'
        }
      ]
    : [
        {
          label: 'Mulai Setor',
          onClick: onOpenSetorMenu,
          icon: PlusCircle,
          variant: 'primary'
        },
        {
          label: 'Buka Mushaf',
          onClick: () => setActiveTab('mushaf'),
          icon: BookOpen,
          variant: 'secondary'
        }
      ];

  const attentionItems: AttentionItem[] = attentionActivities.map(item => ({
    id: item.id,
    idSantri: item.idSantri,
    namaSantri: item.namaSantri,
    category: item.category,
    material: item.material,
    nilai: item.nilai,
    timestamp: item.timestamp,
  }));

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4 lg:space-y-5">
      {/* 1. COMPACT DASHBOARD HERO (Contextual, Height: Mobile 150-185px, Desktop 210-250px) */}
      <CompactDashboardHero
        userName={currentUser.nama}
        greeting="Assalamu'alaikum"
        roleBadge={`Dashboard ${currentUser.role || 'Ustadz'}`}
        subtext="Catat setoran & pantau perkembangan hafalan santri hari ini."
        summaryPill={
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-1 text-left transition-colors hover:bg-emerald-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            aria-label={`${todayActivities.length} setoran hari ini. Buka riwayat`}
          >
            <CalendarCheck className="h-4 w-4 text-emerald-300" />
            <div className="min-w-0">
              <span className="block text-[10px] text-emerald-300 font-medium leading-none">
                Hari Ini
              </span>
              <strong className="text-sm font-[800] text-white leading-tight">
                {todayActivities.length}
              </strong>
            </div>
            <ArrowRight className="h-3 w-3 text-emerald-400" />
          </button>
        }
        actions={heroActions}
      />

      {/* 2. COMPACT BENTO KPI GRID (2 columns on mobile, 4 columns on desktop) */}
      <section
        aria-label="Statistik Kunci Setoran"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      >
        <CompactBentoKpiCard
          label="Setoran Hari Ini"
          value={todayActivities.length}
          icon={CalendarCheck}
          trend={momentumLabel}
          trendPositive={momentumDelta > 0}
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
          onClick={() => setActiveTab('santri')}
        />

        <CompactBentoKpiCard
          label="Ziyadah Hari Ini"
          value={todayZiyadahCount}
          icon={BookPlus}
          subtitle={`${todayActivities.length > 0 ? Math.round((todayZiyadahCount / todayActivities.length) * 100) : 0}% dari setoran`}
          iconTone="teal"
          progressPercent={todayActivities.length > 0 ? (todayZiyadahCount / todayActivities.length) * 100 : 0}
          onClick={() => setActiveTab('ziyadah')}
        />

        <CompactBentoKpiCard
          label="Muraja'ah Hari Ini"
          value={todayMurojaahCount}
          icon={RotateCw}
          subtitle={`${todayActivities.length > 0 ? Math.round((todayMurojaahCount / todayActivities.length) * 100) : 0}% dari setoran`}
          iconTone="amber"
          progressPercent={todayActivities.length > 0 ? (todayMurojaahCount / todayActivities.length) * 100 : 0}
          onClick={() => setActiveTab('murojaah')}
        />
      </section>

      {/* 3. QUICK ACTIONS BENTO STRIP */}
      <CompactQuickActions
        userRole={currentUser.role || 'Ustadz'}
        setActiveTab={setActiveTab}
        onOpenSetorMenu={onOpenSetorMenu}
        onJumpToAttention={jumpToAttention}
        attentionCount={todayAttention.length}
      />

      {/* 4. MIDDLE BENTO ROW: 7-Day Velocity & Attention & Quality */}
      <section
        aria-label="Operasional & Evaluasi"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4"
      >
        {/* 7-Day Rhythm Pulse */}
        <div className="lg:col-span-5">
          <SevenDayRhythmBento
            pulse={sevenDayPulse}
            todayKey={today}
            totalWeekly={sevenDayTotal}
            momentumLabel={momentumLabel}
            className="h-full"
          />
        </div>

        {/* Attention / Tindak Lanjut Card */}
        <div className="lg:col-span-4">
          <CompactAttentionBento
            todayAttentionCount={todayAttention.length}
            totalAttentionCount={attentionActivities.length}
            items={attentionItems}
            onViewAll={() => setActiveTab('riwayat')}
            className="h-full"
          />
        </div>

        {/* Quality & Additional Summary */}
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
          <QualityRingBento
            percent={sangatBaikPercent}
            count={sangatBaikCount}
            total={activities.length}
            onClick={openAnalytics}
            className="flex-1"
          />

          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className="ripple-container ui-bento-card ui-bento-card-interactive flex flex-1 items-center justify-between p-3.5 sm:p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Binnadzor & Kelas
              </p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {todayBinnadzorCount} Binnadzor · {todayPembelajaranCount} Kelas
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                Total {activities.length} setoran tersimpan
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </section>

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
            className="inline-flex rounded-xl border border-slate-200/90 bg-white p-1 shadow-2xs self-start sm:self-auto"
            role="group"
            aria-label="Pilihan tampilan"
          >
            <button
              type="button"
              onClick={() => setChartView('ringkasan')}
              aria-pressed={chartView === 'ringkasan'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                chartView === 'ringkasan'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Tren & Aktivitas
            </button>
            <button
              type="button"
              onClick={() => setChartView('analisis_detail')}
              aria-pressed={chartView === 'analisis_detail'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                chartView === 'analisis_detail'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analisis Detail
            </button>
          </div>
        </div>

        {chartView === 'ringkasan' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1.2fr)] gap-3 sm:gap-4 items-stretch">
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
        ) : (
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
        )}
      </ScrollReveal>
    </div>
  );
};
