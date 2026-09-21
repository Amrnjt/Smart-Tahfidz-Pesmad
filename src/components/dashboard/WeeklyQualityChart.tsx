import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import type { PredikatNilai } from '../../types';
import { addDaysToDateInput, formatTanggalRingkas, getTodayInputFormat } from '../../utils/dateFormatter';
import { buildWeeklyQuality } from '../../utils/weeklyDevelopment';
import { MeasuredChartFrame } from '../MeasuredChartFrame';

const LEVELS: { key: PredikatNilai; color: string; shortLabel: string }[] = [
  { key: 'Mengulang', color: '#F43F5E', shortLabel: 'Mengulang' },
  { key: 'Kurang', color: '#F59E0B', shortLabel: 'Kurang' },
  { key: 'Baik', color: '#10B981', shortLabel: 'Baik' },
  { key: 'Sangat Baik', color: '#0F766E', shortLabel: 'Sangat Baik' },
];

interface Props {
  records: { timestamp: string; nilai: PredikatNilai }[];
  label: string;
}

function formatWeekRange(weekStart: string): string {
  const weekEnd = addDaysToDateInput(weekStart, 6);
  const start = formatTanggalRingkas(weekStart).replace(/\s\d{4}$/, '');
  const end = formatTanggalRingkas(weekEnd).replace(/\s\d{4}$/, '');
  return `${start}–${end}`;
}

export const WeeklyQualityChart: React.FC<Props> = ({ records, label }) => {
  const rows = useMemo(() => buildWeeklyQuality(records, getTodayInputFormat(), 6), [records]);
  const hasData = rows.some(row => row.total > 0);
  const totalSetoran = useMemo(() => rows.reduce((sum, row) => sum + row.total, 0), [rows]);
  const activeWeeks = useMemo(() => rows.filter(row => row.total > 0).length, [rows]);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">Distribusi mutu {label}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            Perbandingan kualitas setoran per pekan, dihitung dari seluruh setoran yang tercatat pada Ahad–Sabtu.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right shadow-sm">
            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Pekan aktif</span>
            <span className="text-sm font-extrabold text-slate-800">{activeWeeks}<span className="ml-0.5 text-[10px] font-semibold text-slate-400">/6</span></span>
          </div>
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1.5 text-right">
            <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700/70">Setoran</span>
            <span className="text-sm font-extrabold text-emerald-900">{totalSetoran}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5 text-[11px] font-medium text-slate-600" aria-label="Legenda kualitas setoran">
        {LEVELS.map(({ key, color, shortLabel }) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] shadow-sm" style={{ backgroundColor: color }} />
            {shortLabel}
          </span>
        ))}
      </div>

      {!hasData ? (
        <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
          <span className="text-xs font-semibold text-slate-600">Belum ada setoran pada enam pekan terakhir.</span>
          <span className="mt-1 text-[11px] text-slate-400">Grafik akan terisi otomatis setelah data setoran tersedia.</span>
        </div>
      ) : (
        <div className="h-72 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-1.5 pb-1 pt-3 shadow-sm sm:h-80 sm:px-3">
          <MeasuredChartFrame>
            <BarChart
              data={rows}
              margin={{ top: 4, right: 10, left: -10, bottom: 8 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#E2E8F0" strokeOpacity={0.75} />
              <XAxis
                dataKey="weekStart"
                tickFormatter={formatWeekRange}
                tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={8}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={value => `${value}%`}
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <Tooltip
                cursor={{ fill: '#F8FAFC', opacity: 0.8 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as (typeof rows)[number];
                  return (
                    <div className="min-w-[190px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur">
                      <div className="border-b border-slate-100 pb-2">
                        <div className="font-extrabold text-slate-900">{formatWeekRange(row.weekStart)}</div>
                        <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{row.total} setoran tercatat</div>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {LEVELS.map(({ key, color }) => (
                          <div key={key} className="flex items-center justify-between gap-5">
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: color }} />
                              {key}
                            </span>
                            <strong className="tabular-nums text-slate-800">{row.counts[key]} <span className="font-semibold text-slate-400">({row[key]}%)</span></strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              {LEVELS.map(({ key, color }, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="penilaian"
                  fill={color}
                  maxBarSize={58}
                  radius={index === LEVELS.length - 1 ? [7, 7, 0, 0] : index === 0 ? [0, 0, 7, 7] : 0}
                  isAnimationActive
                  animationDuration={650}
                  animationBegin={index * 70}
                />
              ))}
            </BarChart>
          </MeasuredChartFrame>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] sm:grid-cols-3 lg:grid-cols-6" aria-label="Jumlah setoran per pekan">
        {rows.map(row => (
          <div
            key={row.weekStart}
            className={`rounded-lg border px-1.5 py-2 transition-colors ${row.total > 0 ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/70'}`}
          >
            <span className="block truncate font-medium text-slate-500">{formatWeekRange(row.weekStart)}</span>
            <span className={`mt-0.5 block font-bold tabular-nums ${row.total > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
              {row.total} setoran
            </span>
          </div>
        ))}
      </div>

      <p className="px-0.5 text-[10px] leading-relaxed text-slate-400">
        Pekan tanpa setoran tetap ditampilkan sebagai konteks waktu. Persentase hanya dihitung dari setoran yang tercatat pada pekan tersebut.
      </p>
    </div>
  );
};
