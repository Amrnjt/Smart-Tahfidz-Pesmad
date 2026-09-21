import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import type { PredikatNilai } from '../../types';
import { formatTanggalRingkas, getTodayInputFormat } from '../../utils/dateFormatter';
import { buildWeeklyQuality } from '../../utils/weeklyDevelopment';
import { MeasuredChartFrame } from '../MeasuredChartFrame';

const LEVELS: { key: PredikatNilai; color: string }[] = [
  { key: 'Mengulang', color: '#F43F5E' },
  { key: 'Kurang', color: '#F59E0B' },
  { key: 'Baik', color: '#10B981' },
  { key: 'Sangat Baik', color: '#0F766E' },
];

interface Props {
  records: { timestamp: string; nilai: PredikatNilai }[];
  label: string;
}

export const WeeklyQualityChart: React.FC<Props> = ({ records, label }) => {
  const rows = useMemo(() => buildWeeklyQuality(records, getTodayInputFormat(), 6), [records]);
  const hasData = rows.some(row => row.total > 0);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600">
        Proporsi penilaian {label} per pekan (Ahad–Sabtu). Jumlah setoran tiap pekan tercantum di bawah grafik.
      </p>
      {!hasData ? (
        <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
          Belum ada setoran pada enam pekan terakhir.
        </div>
      ) : (
        <div className="h-64 w-full">
          <MeasuredChartFrame>
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="weekStart" tickFormatter={formatTanggalRingkas} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={value => `${value}%`} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof rows)[number];
                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-md">
                    <div className="font-bold text-slate-900">Pekan {formatTanggalRingkas(row.weekStart)} · {row.total} setoran</div>
                    {LEVELS.map(({ key, color }) => <div key={key} className="mt-1 flex justify-between gap-5"><span style={{ color }}>{key}</span><strong>{row.counts[key]} ({row[key]}%)</strong></div>)}
                  </div>
                );
              }} />
              {LEVELS.map(({ key, color }) => <Bar key={key} dataKey={key} stackId="penilaian" fill={color} maxBarSize={52} />)}
            </BarChart>
          </MeasuredChartFrame>
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] text-slate-500 sm:grid-cols-6" aria-label="Jumlah setoran per pekan">
        {rows.map(row => <div key={row.weekStart} className="rounded-md bg-slate-50 px-1 py-1.5"><span className="block">{formatTanggalRingkas(row.weekStart)}</span><span className="font-semibold text-slate-700">{row.total} setoran</span></div>)}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        {LEVELS.map(({ key, color }) => <span key={key} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />{key}</span>)}
      </div>
      <p className="text-[11px] text-slate-500">Pekan tanpa setoran ditampilkan kosong; persentase dihitung hanya dari setoran yang tercatat.</p>
    </div>
  );
};
