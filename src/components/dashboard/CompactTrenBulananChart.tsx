import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TrendingUp, Calendar, Layers } from 'lucide-react';
import { ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord } from '../../types';
import { MeasuredChartFrame } from '../MeasuredChartFrame';

export interface CompactTrenBulananChartProps {
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords?: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  title?: string;
  subtitle?: string;
  targetSantriId?: string;
  className?: string;
  onTimeRangeMonthsChange?: (months: 6 | 12) => void;
}

interface MonthlyDataPoint {
  monthKey: string;
  label: string;
  fullMonth: string;
  year: number;
  Ziyadah: number;
  Murojaah: number;
  Binnadzor: number;
  Pembelajaran: number;
  Total: number;
}

type SeriesKey = 'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran';

const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const NAMA_BULAN_LENGKAP = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const CompactTrenBulananChart: React.FC<CompactTrenBulananChartProps> = ({
  ziyadahRecords = [],
  murojaahRecords = [],
  binnadzorRecords = [],
  pembelajaranRecords = [],
  title = 'Tren Bulanan',
  subtitle = 'Perkembangan aktivitas tahfidz',
  targetSantriId,
  className = '',
  onTimeRangeMonthsChange,
}) => {
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6);
  const [selectedSeries, setSelectedSeries] = useState<SeriesKey>('ALL');

  // Filter records by santri if targeted
  const filteredZiyadah = useMemo(() => {
    return targetSantriId ? ziyadahRecords.filter(r => r.idSantri === targetSantriId) : ziyadahRecords;
  }, [ziyadahRecords, targetSantriId]);

  const filteredMurojaah = useMemo(() => {
    return targetSantriId ? murojaahRecords.filter(r => r.idSantri === targetSantriId) : murojaahRecords;
  }, [murojaahRecords, targetSantriId]);

  const filteredBinnadzor = useMemo(() => {
    return targetSantriId ? binnadzorRecords.filter(r => r.idSantri === targetSantriId) : binnadzorRecords;
  }, [binnadzorRecords, targetSantriId]);

  const filteredPembelajaran = useMemo(() => {
    return targetSantriId ? pembelajaranRecords.filter(r => r.idSantri === targetSantriId) : pembelajaranRecords;
  }, [pembelajaranRecords, targetSantriId]);

  // Aggregate monthly data for the selected time window
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const now = new Date();
    const result: MonthlyDataPoint[] = [];

    for (let i = timeRangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const yearMonthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const shortLabel = NAMA_BULAN_PENDEK[month];
      const fullMonth = `${NAMA_BULAN_LENGKAP[month]} ${year}`;

      const zCount = filteredZiyadah.filter(r => (r.timestamp || '').split(' ')[0].startsWith(yearMonthKey)).length;
      const mCount = filteredMurojaah.filter(r => (r.timestamp || '').split(' ')[0].startsWith(yearMonthKey)).length;
      const bCount = filteredBinnadzor.filter(r => (r.timestamp || '').split(' ')[0].startsWith(yearMonthKey)).length;
      const pCount = filteredPembelajaran.filter(r => (r.timestamp || '').split(' ')[0].startsWith(yearMonthKey)).length;

      result.push({
        monthKey: yearMonthKey,
        label: shortLabel,
        fullMonth,
        year,
        Ziyadah: zCount,
        Murojaah: mCount,
        Binnadzor: bCount,
        Pembelajaran: pCount,
        Total: zCount + mCount + bCount + pCount
      });
    }

    return result;
  }, [filteredZiyadah, filteredMurojaah, filteredBinnadzor, filteredPembelajaran, timeRangeMonths]);

  // Metric totals for the period summary chips
  const totalPeriod = useMemo(() => {
    return monthlyData.reduce(
      (acc, curr) => ({
        ziyadah: acc.ziyadah + curr.Ziyadah,
        murojaah: acc.murojaah + curr.Murojaah,
        binnadzor: acc.binnadzor + curr.Binnadzor,
        pembelajaran: acc.pembelajaran + curr.Pembelajaran,
        grandTotal: acc.grandTotal + curr.Total
      }),
      { ziyadah: 0, murojaah: 0, binnadzor: 0, pembelajaran: 0, grandTotal: 0 }
    );
  }, [monthlyData]);

  // Check if reduced motion is preferred
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const hasData = totalPeriod.grandTotal > 0;

  const showZiyadah = selectedSeries === 'ALL' || selectedSeries === 'Ziyadah';
  const showMurojaah = selectedSeries === 'ALL' || selectedSeries === 'Murojaah';
  const showBinnadzor = (selectedSeries === 'ALL' || selectedSeries === 'Binnadzor') && (binnadzorRecords.length > 0 || totalPeriod.binnadzor > 0);
  const showPembelajaran = (selectedSeries === 'ALL' || selectedSeries === 'Pembelajaran') && (pembelajaranRecords.length > 0 || totalPeriod.pembelajaran > 0);

  return (
    <div
      className={`ui-bento-card bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col h-full overflow-hidden min-w-0 w-full max-w-full ${className}`}
    >
      {/* 1. Header: Icon + Title + Period Dropdown & Total summary */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-[800] tracking-tight text-slate-900 truncate">
                {title}
              </h3>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 border border-slate-200/60 tabular-nums">
                {totalPeriod.grandTotal} sesi
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Period Selector (3, 6, 12 Bulan) */}
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/70 text-[10px] sm:text-[11px] font-semibold text-slate-600 flex-shrink-0">
          {[3, 6, 12].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setTimeRangeMonths(m);
                onTimeRangeMonthsChange?.(m === 12 ? 12 : 6);
              }}
              aria-pressed={timeRangeMonths === m}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                timeRangeMonths === m
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'hover:text-slate-900 text-slate-500'
              }`}
            >
              {m} Bln
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Filter Chips (Kategori Setoran) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 my-2.5 min-w-0 w-full">
        <button
          type="button"
          onClick={() => setSelectedSeries('ALL')}
          aria-pressed={selectedSeries === 'ALL'}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
            selectedSeries === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3 h-3" />
          Semua
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeries(selectedSeries === 'Ziyadah' ? 'ALL' : 'Ziyadah')}
          aria-pressed={selectedSeries === 'Ziyadah'}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
            selectedSeries === 'Ziyadah'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
              : 'bg-emerald-50/90 text-emerald-800 border-emerald-200/70 hover:bg-emerald-100/80'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${selectedSeries === 'Ziyadah' ? 'bg-white' : 'bg-emerald-600'}`} />
          Ziyadah <span className="tabular-nums font-extrabold">{totalPeriod.ziyadah}</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSeries(selectedSeries === 'Murojaah' ? 'ALL' : 'Murojaah')}
          aria-pressed={selectedSeries === 'Murojaah'}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
            selectedSeries === 'Murojaah'
              ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
              : 'bg-sky-50/90 text-sky-800 border-sky-200/70 hover:bg-sky-100/80'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${selectedSeries === 'Murojaah' ? 'bg-white' : 'bg-sky-600'}`} />
          Muroja'ah <span className="tabular-nums font-extrabold">{totalPeriod.murojaah}</span>
        </button>

        {(binnadzorRecords.length > 0 || totalPeriod.binnadzor > 0) && (
          <button
            type="button"
            onClick={() => setSelectedSeries(selectedSeries === 'Binnadzor' ? 'ALL' : 'Binnadzor')}
            aria-pressed={selectedSeries === 'Binnadzor'}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
              selectedSeries === 'Binnadzor'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-2xs'
                : 'bg-indigo-50/90 text-indigo-800 border-indigo-200/70 hover:bg-indigo-100/80'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${selectedSeries === 'Binnadzor' ? 'bg-white' : 'bg-indigo-600'}`} />
            Binnadzor <span className="tabular-nums font-extrabold">{totalPeriod.binnadzor}</span>
          </button>
        )}

        {(pembelajaranRecords.length > 0 || totalPeriod.pembelajaran > 0) && (
          <button
            type="button"
            onClick={() => setSelectedSeries(selectedSeries === 'Pembelajaran' ? 'ALL' : 'Pembelajaran')}
            aria-pressed={selectedSeries === 'Pembelajaran'}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
              selectedSeries === 'Pembelajaran'
                ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                : 'bg-amber-50/90 text-amber-800 border-amber-200/70 hover:bg-amber-100/80'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${selectedSeries === 'Pembelajaran' ? 'bg-white' : 'bg-amber-600'}`} />
            Kelas <span className="tabular-nums font-extrabold">{totalPeriod.pembelajaran}</span>
          </button>
        )}
      </div>

      {/* 3. Responsive Chart Canvas (Fills available space) */}
      <div className="flex-1 min-h-[210px] sm:min-h-[230px] w-full min-w-0 pt-1 flex flex-col justify-end">
        {!hasData ? (
          <div className="flex h-full min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <Calendar className="h-6 w-6 text-slate-400" />
            <p className="mt-2 text-xs font-semibold text-slate-700">
              Belum ada data aktivitas untuk periode {timeRangeMonths} bulan ini.
            </p>
            <p className="text-[11px] text-slate-500 max-w-[240px] mt-0.5">
              Setoran yang tercatat akan otomatis terangkum secara visual di grafik ini.
            </p>
          </div>
        ) : (
          <MeasuredChartFrame>
            <AreaChart
              data={monthlyData}
              margin={{ top: 12, right: 12, left: 10, bottom: 2 }}
            >
              <defs>
                <linearGradient id="gradientZiyadah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradientMurojaah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.16} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradientBinnadzor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradientPembelajaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval="preserveStartEnd"
                dy={4}
              />

              <YAxis
                allowDecimals={false}
                domain={[0, 'auto']}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickMargin={8}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as MonthlyDataPoint;
                  return (
                    <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-3 shadow-lg shadow-slate-900/5 text-xs min-w-[155px]">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {item.fullMonth}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 tabular-nums">
                          {item.Total} sesi
                        </span>
                      </div>
                      <div className="mt-2 space-y-1.5 text-[11px]">
                        {showZiyadah && (
                          <div className="flex items-center justify-between gap-3 text-emerald-800 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-600" />
                              Ziyadah
                            </span>
                            <span className="font-bold tabular-nums">{item.Ziyadah}</span>
                          </div>
                        )}
                        {showMurojaah && (
                          <div className="flex items-center justify-between gap-3 text-sky-800 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-sky-600" />
                              Muroja'ah
                            </span>
                            <span className="font-bold tabular-nums">{item.Murojaah}</span>
                          </div>
                        )}
                        {showBinnadzor && (
                          <div className="flex items-center justify-between gap-3 text-indigo-800 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-600" />
                              Binnadzor
                            </span>
                            <span className="font-bold tabular-nums">{item.Binnadzor}</span>
                          </div>
                        )}
                        {showPembelajaran && (
                          <div className="flex items-center justify-between gap-3 text-amber-800 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-600" />
                              Kelas
                            </span>
                            <span className="font-bold tabular-nums">{item.Pembelajaran}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />

              {showZiyadah && (
                <Area
                  type="monotone"
                  dataKey="Ziyadah"
                  stroke="#059669"
                  strokeWidth={2.4}
                  fill="url(#gradientZiyadah)"
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#059669' }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={600}
                />
              )}
              {showMurojaah && (
                <Area
                  type="monotone"
                  dataKey="Murojaah"
                  stroke="#0284c7"
                  strokeWidth={2.4}
                  fill="url(#gradientMurojaah)"
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#0284c7' }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={600}
                />
              )}
              {showBinnadzor && (
                <Area
                  type="monotone"
                  dataKey="Binnadzor"
                  stroke="#6366f1"
                  strokeWidth={2.4}
                  fill="url(#gradientBinnadzor)"
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#6366f1' }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={600}
                />
              )}
              {showPembelajaran && (
                <Area
                  type="monotone"
                  dataKey="Pembelajaran"
                  stroke="#d97706"
                  strokeWidth={2.4}
                  fill="url(#gradientPembelajaran)"
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#d97706' }}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={600}
                />
              )}
            </AreaChart>
          </MeasuredChartFrame>
        )}
      </div>
    </div>
  );
};
