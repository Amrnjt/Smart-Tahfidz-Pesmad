import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TrendingUp, Calendar, BookOpen } from 'lucide-react';
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
  className = ''
}) => {
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6);

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

  return (
    <div
      className={`ui-bento-card bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* 1. Header: Compact icon + title + subtext and period dropdown */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-[800] tracking-tight text-slate-900 truncate">
              {title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Period Selector (3, 6, 12 Bulan) */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100/90 p-0.5 border border-slate-200/70 text-[10px] sm:text-[11px] font-semibold text-slate-600 flex-shrink-0">
          {[3, 6, 12].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setTimeRangeMonths(m)}
              className={`px-2 py-1 rounded-md transition-all ${
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

      {/* 2. Summary Metric Chips directly above chart (wrap max 2 lines on mobile) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 my-2.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Ziyadah {totalPeriod.ziyadah}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-teal-800 border border-teal-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
          Muroja'ah {totalPeriod.murojaah}
        </span>
        {binnadzorRecords.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-indigo-800 border border-indigo-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            Binnadzor {totalPeriod.binnadzor}
          </span>
        )}
        {pembelajaranRecords.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50/90 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-800 border border-amber-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Kelas {totalPeriod.pembelajaran}
          </span>
        )}
      </div>

      {/* 3. Compact Chart Canvas */}
      <div className="h-[190px] sm:h-[210px] md:h-[220px] lg:h-[235px] w-full min-w-0 pt-0.5">
        {!hasData ? (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <Calendar className="h-5 w-5 text-slate-400" />
            <p className="mt-1.5 text-xs font-semibold text-slate-600">
              Belum ada data aktivitas untuk periode ini.
            </p>
            <p className="text-[10px] text-slate-500">
              Setoran yang tercatat akan otomatis terangkum di grafik ini.
            </p>
          </div>
        ) : (
          <MeasuredChartFrame>
            <AreaChart
              data={monthlyData}
              margin={{ top: 8, right: 10, left: -22, bottom: 0 }}
            >
              <defs>
                {/* Subtle Area Gradients with 0.05-0.12 opacity */}
                <linearGradient id="gradientZiyadah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradientMurojaah" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradientBinnadzor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.10} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradientPembelajaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.10} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as MonthlyDataPoint;
                  return (
                    <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-sm text-xs min-w-[130px]">
                      <p className="font-bold text-slate-800 pb-1.5 border-b border-slate-100 text-[11px]">
                        {item.fullMonth}
                      </p>
                      <div className="mt-1.5 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between gap-3 text-emerald-700 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            Ziyadah
                          </span>
                          <span>{item.Ziyadah}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-teal-700 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                            Muroja'ah
                          </span>
                          <span>{item.Murojaah}</span>
                        </div>
                        {binnadzorRecords.length > 0 && (
                          <div className="flex items-center justify-between gap-3 text-indigo-700 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                              Binnadzor
                            </span>
                            <span>{item.Binnadzor}</span>
                          </div>
                        )}
                        {pembelajaranRecords.length > 0 && (
                          <div className="flex items-center justify-between gap-3 text-amber-700 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                              Kelas
                            </span>
                            <span>{item.Pembelajaran}</span>
                          </div>
                        )}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-slate-600 font-bold">
                          <span>Total</span>
                          <span>{item.Total}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="Ziyadah"
                stroke="#059669"
                strokeWidth={2.2}
                fill="url(#gradientZiyadah)"
                isAnimationActive={!prefersReducedMotion}
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="Murojaah"
                stroke="#0284c7"
                strokeWidth={2.2}
                fill="url(#gradientMurojaah)"
                isAnimationActive={!prefersReducedMotion}
                animationDuration={600}
              />
              {binnadzorRecords.length > 0 && (
                <Area
                  type="monotone"
                  dataKey="Binnadzor"
                  stroke="#6366f1"
                  strokeWidth={2.2}
                  fill="url(#gradientBinnadzor)"
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={600}
                />
              )}
              {pembelajaranRecords.length > 0 && (
                <Area
                  type="monotone"
                  dataKey="Pembelajaran"
                  stroke="#f59e0b"
                  strokeWidth={2.2}
                  fill="url(#gradientPembelajaran)"
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
