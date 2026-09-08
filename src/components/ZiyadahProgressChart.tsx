import React, { useState, useMemo } from 'react';
import { ZiyadahRecord } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, ChartBar as BarChart3, Calendar, Layers, BookOpen, Award, CircleCheck as CheckCircle2, Circle as HelpCircle, Clock } from 'lucide-react';

interface ZiyadahProgressChartProps {
  ziyadahRecords: ZiyadahRecord[];
  santriName?: string;
  isSantriView?: boolean;
}

type ChartType = 'bar' | 'area';
type MetricType = 'ayat' | 'setoran';
type TimeRange = '4weeks' | '8weeks' | 'all';

interface WeeklyDataPoint {
  weekKey: string;
  label: string;
  shortLabel: string;
  totalAyat: number;
  totalSetoran: number;
  cumulativeAyat: number;
  surahList: string[];
  sangatBaikCount: number;
  baikCount: number;
  kurangCount: number;
  mengulangCount: number;
  dateRange: string;
}

export const ZiyadahProgressChart: React.FC<ZiyadahProgressChartProps> = ({
  ziyadahRecords,
  santriName = 'Santri',
  isSantriView = false
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [metricType, setMetricType] = useState<MetricType>('ayat');
  const [timeRange, setTimeRange] = useState<TimeRange>('8weeks');

  // Month names in Indonesian
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Helper to parse date from string (e.g., "2026-08-28 14:30" or ISO)
  const parseRecordDate = (timestampStr: string): Date => {
    if (!timestampStr) return new Date();
    // Replace space with T if needed for valid Date parsing
    const isoString = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const parsed = new Date(isoString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Helper to get start of week (Monday)
  const getStartOfWeek = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Process and aggregate weekly data
  const { weeklyData, stats } = useMemo(() => {
    // Sort records oldest to newest for chronological progress
    const sortedRecords = [...ziyadahRecords].sort((a, b) => {
      return parseRecordDate(a.timestamp).getTime() - parseRecordDate(b.timestamp).getTime();
    });

    const now = new Date();
    const currentWeekMonday = getStartOfWeek(now);

    // Determine how many weeks back to generate
    const numberOfWeeks = timeRange === '4weeks' ? 4 : timeRange === '8weeks' ? 8 : 12;

    // Generate timeline buckets (weeks)
    const weeksMap = new Map<string, WeeklyDataPoint>();
    const weekStartDates: Date[] = [];

    for (let i = numberOfWeeks - 1; i >= 0; i--) {
      const monday = new Date(currentWeekMonday);
      monday.setDate(currentWeekMonday.getDate() - i * 7);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekKey = `${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;
      
      // Formatting labels
      const shortLabel = `${monday.getDate()} ${monthNames[monday.getMonth()]}`;
      const fullLabel = `Pekan ${monday.getDate()} ${monthNames[monday.getMonth()]} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]}`;
      const dateRange = `${monday.getDate()} ${monthNames[monday.getMonth()]} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`;

      weeksMap.set(weekKey, {
        weekKey,
        label: fullLabel,
        shortLabel,
        totalAyat: 0,
        totalSetoran: 0,
        cumulativeAyat: 0,
        surahList: [],
        sangatBaikCount: 0,
        baikCount: 0,
        kurangCount: 0,
        mengulangCount: 0,
        dateRange
      });

      weekStartDates.push(monday);
    }

    // Populate data with records
    let totalAllAyat = 0;
    let totalAllSetoran = sortedRecords.length;

    sortedRecords.forEach(record => {
      const rDate = parseRecordDate(record.timestamp);
      const rMonday = getStartOfWeek(rDate);
      const weekKey = `${rMonday.getFullYear()}-${(rMonday.getMonth() + 1).toString().padStart(2, '0')}-${rMonday.getDate().toString().padStart(2, '0')}`;
      
      const ayatCount = Math.max(1, (record.ayatAkhir - record.ayatAwal + 1));
      totalAllAyat += ayatCount;

      if (weeksMap.has(weekKey)) {
        const bucket = weeksMap.get(weekKey)!;
        bucket.totalAyat += ayatCount;
        bucket.totalSetoran += 1;
        
        if (record.surah && !bucket.surahList.includes(record.surah)) {
          bucket.surahList.push(record.surah);
        }

        if (record.nilai === 'Sangat Baik') bucket.sangatBaikCount += 1;
        else if (record.nilai === 'Baik') bucket.baikCount += 1;
        else if (record.nilai === 'Kurang') bucket.kurangCount += 1;
        else bucket.mengulangCount += 1;
      }
    });

    // Calculate cumulative verses across the generated weeks
    let runningCumulative = 0;
    const finalData: WeeklyDataPoint[] = [];

    weeksMap.forEach(point => {
      runningCumulative += point.totalAyat;
      point.cumulativeAyat = runningCumulative;
      finalData.push(point);
    });

    // Find best week
    let maxAyatInAWeek = 0;
    let bestWeekLabel = '-';
    finalData.forEach(d => {
      if (d.totalAyat > maxAyatInAWeek) {
        maxAyatInAWeek = d.totalAyat;
        bestWeekLabel = d.shortLabel;
      }
    });

    const activeWeeksWithSetoran = finalData.filter(d => d.totalSetoran > 0).length;
    const avgAyatPerActiveWeek = activeWeeksWithSetoran > 0 
      ? Math.round(finalData.reduce((acc, d) => acc + d.totalAyat, 0) / activeWeeksWithSetoran)
      : 0;

    return {
      weeklyData: finalData,
      stats: {
        totalAyat: totalAllAyat,
        totalSetoran: totalAllSetoran,
        avgAyatPerActiveWeek,
        maxAyatInAWeek,
        bestWeekLabel,
        activeWeeksCount: activeWeeksWithSetoran
      }
    };
  }, [ziyadahRecords, timeRange]);

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: WeeklyDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-950 text-white p-3.5 rounded-xl shadow-lg border border-slate-800 max-w-xs text-xs space-y-2">
          <div className="border-b border-slate-700 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {data.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Total Ayat</span>
              <span className="text-base font-extrabold text-amber-300">
                {data.totalAyat} <span className="text-xs font-medium text-slate-300">Ayat</span>
              </span>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block">Frekuensi Setoran</span>
              <span className="text-base font-extrabold text-teal-300">
                {data.totalSetoran} <span className="text-xs font-medium text-slate-300">Kali</span>
              </span>
            </div>
          </div>

          {data.surahList.length > 0 ? (
            <div className="pt-1">
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                Surah yang disetor pekan ini:
              </span>
              <div className="flex flex-wrap gap-1">
                {data.surahList.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-200 border border-emerald-700/50 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic pt-0.5">
              Tidak ada setoran hafalan baru pada pekan ini.
            </p>
          )}

          {data.totalSetoran > 0 && (
            <div className="text-xs text-slate-300 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>Sangat Baik: <b className="text-emerald-400">{data.sangatBaikCount}</b></span>
              <span>Baik: <b className="text-teal-400">{data.baikCount}</b></span>
              {data.kurangCount > 0 && <span>Kurang: <b className="text-amber-400">{data.kurangCount}</b></span>}
              {data.mengulangCount > 0 && <span>Mengulang: <b className="text-rose-400">{data.mengulangCount}</b></span>}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const hasData = ziyadahRecords.length > 0;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                <span>Grafik Progres Hafalan Ziyadah</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Per Pekan
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isSantriView
                  ? 'Pantau ritme dan konsistensi penambahan ayat hafalan baru kamu setiap minggu'
                  : `Grafik capaian setoran ayat baru ${santriName} dari pekan ke pekan`}
              </p>
            </div>
          </div>
        </div>

        {/* View & Filter Switches */}
        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
          {/* Time Range Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('4weeks')}
              type="button"
              aria-pressed={timeRange === '4weeks'}
              className={`min-h-11 px-3 py-1 rounded-lg transition cursor-pointer ${
                timeRange === '4weeks'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4 Pekan
            </button>
            <button
              onClick={() => setTimeRange('8weeks')}
              type="button"
              aria-pressed={timeRange === '8weeks'}
              className={`min-h-11 px-3 py-1 rounded-lg transition cursor-pointer ${
                timeRange === '8weeks'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              8 Pekan
            </button>
            <button
              onClick={() => setTimeRange('all')}
              type="button"
              aria-pressed={timeRange === 'all'}
              className={`min-h-11 px-3 py-1 rounded-lg transition cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Pekan
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setMetricType('ayat')}
              type="button"
              aria-pressed={metricType === 'ayat'}
              className={`min-h-11 px-3 py-1 rounded-lg transition cursor-pointer ${
                metricType === 'ayat'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan berdasarkan jumlah ayat disetor"
            >
              Ayat
            </button>
            <button
              onClick={() => setMetricType('setoran')}
              type="button"
              aria-pressed={metricType === 'setoran'}
              className={`min-h-11 px-3 py-1 rounded-lg transition cursor-pointer ${
                metricType === 'setoran'
                  ? 'bg-teal-800 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan frekuensi setoran (kali)"
            >
              Frekuensi
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setChartType('bar')}
              type="button"
              aria-pressed={chartType === 'bar'}
              aria-label="Diagram batang"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg transition cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Diagram Batang"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              type="button"
              aria-pressed={chartType === 'area'}
              aria-label="Grafik area"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Diagram Area Tren"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Mini Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-2xl">
          <span className="text-xs font-semibold text-emerald-800 block">Total Ayat Ziyadah</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-emerald-950">{stats.totalAyat}</span>
            <span className="text-xs font-medium text-emerald-700">Ayat</span>
          </div>
        </div>

        <div className="bg-teal-50/70 border border-teal-200/60 p-3 rounded-2xl">
          <span className="text-xs font-semibold text-teal-800 block">Rata-rata / Pekan Aktif</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-teal-950">{stats.avgAyatPerActiveWeek}</span>
            <span className="text-xs font-medium text-teal-700">Ayat / mgg</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-2xl">
          <span className="text-xs font-semibold text-amber-800 block">Rekor Terbaik Pekanan</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-amber-950">{stats.maxAyatInAWeek}</span>
            <span className="text-xs font-medium text-amber-700">Ayat</span>
          </div>
        </div>

        <div className="bg-sky-50/70 border border-sky-200/60 p-3 rounded-2xl">
          <span className="text-xs font-semibold text-sky-800 block">Total Kali Setoran</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg sm:text-xl font-extrabold text-sky-950">{stats.totalSetoran}</span>
            <span className="text-xs font-medium text-sky-700">Kali</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Chart Container */}
      <div className="w-full h-64 sm:h-72 pt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {metricType === 'ayat' ? (
                  <Bar
                    dataKey="totalAyat"
                    name="Jumlah Ayat"
                    fill="#059669"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                ) : (
                  <Bar
                    dataKey="totalSetoran"
                    name="Frekuensi Setoran"
                    fill="#0d9488"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                )}
              </BarChart>
            ) : (
              <AreaChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAyat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSetoran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {metricType === 'ayat' ? (
                  <Area
                    type="monotone"
                    dataKey="totalAyat"
                    name="Jumlah Ayat"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorAyat)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="totalSetoran"
                    name="Frekuensi Setoran"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSetoran)"
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">
              Belum ada riwayat setoran Ziyadah yang tercatat.
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              Grafik progres mingguan akan otomatis terisi setelah Ustadz mencatatkan setoran ayat baru pertama kali.
            </p>
          </div>
        )}
      </div>

      {/* Chart Legend & Explanatory Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span className="font-medium text-slate-700">Setoran Ziyadah (Ayat Baru)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Dikelompokkan otomatis per siklus 7 hari (Senin - Ahad)</span>
          </div>
        </div>

        <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 self-start sm:self-auto">
          Tersinkronisasi Real-Time
        </span>
      </div>
    </div>
  );
};
