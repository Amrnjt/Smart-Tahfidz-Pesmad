import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  ChartBar as BarChart3,
  Calendar,
  Filter,
  GraduationCap,
  BookOpen,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  RotateCw,
  Users,
  Target,
  Layers,
  ChevronDown,
  Trophy,
  ListOrdered,
  Gauge
} from 'lucide-react';
import { Santri, ZiyadahRecord, MurojaahRecord, Kelas } from '../types';
import { MeasuredChartFrame } from './MeasuredChartFrame';
import { AnimatedCounter } from './AnimatedCounter';

interface TrenHafalanBulananChartProps {
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords?: MurojaahRecord[];
  kelasList?: Kelas[];
}

type MetricMode = 'ayat' | 'kumulatif' | 'komparasi' | 'kelancaran';
type VisualType = 'area' | 'bar' | 'line';

interface MonthlyTrendItem {
  monthKey: string;
  bulan: string;
  fullBulan: string;
  totalAyat: number;
  totalSesiZiyadah: number;
  totalSesiMurojaah: number;
  kumulatifAyat: number;
  sangatBaikCount: number;
  baikCount: number;
  kurangCount: number;
  persenLancar: number;
  surahList: string[];
  topSantriBulanIni?: string;
  topSantriAyat?: number;
}

interface SantriComparisonItem {
  idSantri: string;
  namaSantri: string;
  kelas: string;
  totalAyatBulanIni: number;
  totalAyatPeriode: number;
  totalSesi: number;
}

export const TrenHafalanBulananChart: React.FC<TrenHafalanBulananChartProps> = ({
  santriList,
  ziyadahRecords,
  murojaahRecords = [],
  kelasList = []
}) => {
  const [selectedSantri, setSelectedSantri] = useState<string>('ALL');
  const [selectedKelas, setSelectedKelas] = useState<string>('ALL');
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6);
  const [metricMode, setMetricMode] = useState<MetricMode>('ayat');
  const [visualType, setVisualType] = useState<VisualType>('area');
  const [komparasiViewMode, setKomparasiViewMode] = useState<'cards' | 'chart'>('cards');

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const fullMonthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Helper date parser
  const parseDateSafe = (ts: string): Date => {
    if (!ts) return new Date();
    const iso = ts.includes('T') ? ts : ts.replace(' ', 'T');
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  // 1. Filter Santri by Kelas
  const santriFilteredByKelas = useMemo(() => {
    if (selectedKelas === 'ALL') return santriList;
    const kls = kelasList.find(k => k.id === selectedKelas);
    if (!kls || !kls.santriIds) return santriList;
    return santriList.filter(s => kls.santriIds.includes(s.idSantri));
  }, [santriList, kelasList, selectedKelas]);

  // 2. Filter records based on selected santri and kelas
  const relevantZiyadah = useMemo(() => {
    return ziyadahRecords.filter(r => {
      if (selectedSantri !== 'ALL' && r.idSantri !== selectedSantri) return false;
      if (selectedKelas !== 'ALL') {
        const allowedIds = new Set(santriFilteredByKelas.map(s => s.idSantri));
        if (!allowedIds.has(r.idSantri)) return false;
      }
      return true;
    });
  }, [ziyadahRecords, selectedSantri, selectedKelas, santriFilteredByKelas]);

  const relevantMurojaah = useMemo(() => {
    return murojaahRecords.filter(r => {
      if (selectedSantri !== 'ALL' && r.idSantri !== selectedSantri) return false;
      if (selectedKelas !== 'ALL') {
        const allowedIds = new Set(santriFilteredByKelas.map(s => s.idSantri));
        if (!allowedIds.has(r.idSantri)) return false;
      }
      return true;
    });
  }, [murojaahRecords, selectedSantri, selectedKelas, santriFilteredByKelas]);

  // 3. Compute Monthly Data Points
  const monthlyData: MonthlyTrendItem[] = useMemo(() => {
    const now = new Date();
    const list: MonthlyTrendItem[] = [];
    let runningCumulative = 0;

    // First, let's calculate baseline verses before the start window if kumulatif is requested
    const startWindowDate = new Date(now.getFullYear(), now.getMonth() - timeRangeMonths + 1, 1);
    
    // Sum verses before this window for cumulative baseline
    const priorRecords = relevantZiyadah.filter(r => {
      const d = parseDateSafe(r.timestamp);
      return d < startWindowDate;
    });
    
    priorRecords.forEach(r => {
      const count = Math.max(1, (r.ayatAkhir - r.ayatAwal + 1));
      runningCumulative += count;
    });

    // Generate buckets for each month in the window
    for (let i = timeRangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const label = `${monthNames[month]} ${year !== now.getFullYear() ? `'${year.toString().slice(-2)}` : ''}`;
      const fullLabel = `${fullMonthNames[month]} ${year}`;

      // Ziyadah records in this month
      const monthZiyadah = relevantZiyadah.filter(r => {
        const dateStr = r.timestamp.split(' ')[0] || r.timestamp;
        return dateStr.startsWith(monthKey);
      });

      // Murojaah records in this month
      const monthMurojaah = relevantMurojaah.filter(r => {
        const dateStr = r.timestamp.split(' ')[0] || r.timestamp;
        return dateStr.startsWith(monthKey);
      });

      // Calculate total verses in this month
      let monthAyatTotal = 0;
      const surahSet = new Set<string>();
      let sangatBaik = 0;
      let baik = 0;
      let kurang = 0;

      // Track santri performance in this month for top santri
      const santriAyatMap = new Map<string, number>();

      monthZiyadah.forEach(r => {
        const ayatDiff = Math.max(1, (r.ayatAkhir - r.ayatAwal + 1));
        monthAyatTotal += ayatDiff;
        surahSet.add(`${r.surah} (Ayat ${r.ayatAwal}-${r.ayatAkhir})`);

        if (r.nilai === 'Sangat Baik') sangatBaik++;
        else if (r.nilai === 'Baik') baik++;
        else kurang++;

        const currentSantriAyat = santriAyatMap.get(r.idSantri) || 0;
        santriAyatMap.set(r.idSantri, currentSantriAyat + ayatDiff);
      });

      runningCumulative += monthAyatTotal;

      // Determine top santri in this month
      let topSantriName: string | undefined;
      let topSantriAyatCount = 0;
      santriAyatMap.forEach((ayat, id) => {
        if (ayat > topSantriAyatCount) {
          topSantriAyatCount = ayat;
          const found = santriList.find(s => s.idSantri === id);
          topSantriName = found ? found.namaSantri : id;
        }
      });

      const totalEvaluasi = sangatBaik + baik + kurang;
      const persenLancar = totalEvaluasi > 0
        ? Math.round(((sangatBaik + baik) / totalEvaluasi) * 100)
        : 100;

      list.push({
        monthKey,
        bulan: label,
        fullBulan: fullLabel,
        totalAyat: monthAyatTotal,
        totalSesiZiyadah: monthZiyadah.length,
        totalSesiMurojaah: monthMurojaah.length,
        kumulatifAyat: runningCumulative,
        sangatBaikCount: sangatBaik,
        baikCount: baik,
        kurangCount: kurang,
        persenLancar,
        surahList: Array.from(surahSet),
        topSantriBulanIni: topSantriName,
        topSantriAyat: topSantriAyatCount
      });
    }

    return list;
  }, [relevantZiyadah, relevantMurojaah, timeRangeMonths, santriList]);

  // 4. Comparison Data for all Santri across the selected period or latest month
  const santriComparisonData: SantriComparisonItem[] = useMemo(() => {
    const latestMonth = monthlyData[monthlyData.length - 1]?.monthKey || '';

    return santriFilteredByKelas.map(santri => {
      const santriZiyadah = ziyadahRecords.filter(r => r.idSantri === santri.idSantri);
      
      // Total ayat in the latest month
      const latestMonthAyat = santriZiyadah
        .filter(r => (r.timestamp.split(' ')[0] || r.timestamp).startsWith(latestMonth))
        .reduce((sum, r) => sum + Math.max(1, (r.ayatAkhir - r.ayatAwal + 1)), 0);

      // Total ayat across the entire visible window
      const periodAyat = santriZiyadah
        .filter(r => {
          const d = parseDateSafe(r.timestamp);
          const now = new Date();
          const startWindow = new Date(now.getFullYear(), now.getMonth() - timeRangeMonths + 1, 1);
          return d >= startWindow;
        })
        .reduce((sum, r) => sum + Math.max(1, (r.ayatAkhir - r.ayatAwal + 1)), 0);

      const periodSesi = santriZiyadah.filter(r => {
        const d = parseDateSafe(r.timestamp);
        const now = new Date();
        const startWindow = new Date(now.getFullYear(), now.getMonth() - timeRangeMonths + 1, 1);
        return d >= startWindow;
      }).length;

      return {
        idSantri: santri.idSantri,
        namaSantri: santri.namaSantri,
        kelas: santri.kelas,
        totalAyatBulanIni: latestMonthAyat,
        totalAyatPeriode: periodAyat,
        totalSesi: periodSesi
      };
    })
    .sort((a, b) => b.totalAyatPeriode - a.totalAyatPeriode)
    .slice(0, 10); // Top 10 santri
  }, [santriFilteredByKelas, ziyadahRecords, monthlyData, timeRangeMonths]);

  // 5. Summary Stats for Top KPI Cards
  const stats = useMemo(() => {
    const totalAyatPeriod = monthlyData.reduce((sum, m) => sum + m.totalAyat, 0);
    const totalSesiPeriod = monthlyData.reduce((sum, m) => sum + m.totalSesiZiyadah, 0);
    const avgAyatPerMonth = monthlyData.length > 0 ? Math.round(totalAyatPeriod / monthlyData.length) : 0;

    // Peak Month
    let peakMonth = monthlyData[0];
    monthlyData.forEach(m => {
      if (m.totalAyat > (peakMonth?.totalAyat || 0)) {
        peakMonth = m;
      }
    });

    // Month-over-Month (MoM) Growth
    const currentMonthData = monthlyData[monthlyData.length - 1];
    const prevMonthData = monthlyData[monthlyData.length - 2];
    
    let momGrowthPercent = 0;
    let momDirection: 'up' | 'down' | 'flat' = 'flat';

    if (currentMonthData && prevMonthData) {
      const prev = prevMonthData.totalAyat;
      const curr = currentMonthData.totalAyat;
      if (prev > 0) {
        momGrowthPercent = Math.round(((curr - prev) / prev) * 100);
        momDirection = momGrowthPercent > 0 ? 'up' : momGrowthPercent < 0 ? 'down' : 'flat';
      } else if (curr > 0) {
        momGrowthPercent = 100;
        momDirection = 'up';
      }
    }

    return {
      totalAyatPeriod,
      totalSesiPeriod,
      avgAyatPerMonth,
      peakMonth,
      momGrowthPercent,
      momDirection,
      currentMonthName: currentMonthData?.fullBulan || 'Bulan Ini'
    };
  }, [monthlyData]);

  const selectedSantriObj = selectedSantri !== 'ALL'
    ? santriList.find(s => s.idSantri === selectedSantri)
    : null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-5 w-full min-w-0 max-w-full">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-emerald-700 text-white flex-shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-800 text-base sm:text-lg tracking-tight">
                  Tren Hafalan Santri Setiap Bulan
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {selectedSantriObj
                  ? `Analisis ritme & kecepatan hafalan ayat ${selectedSantriObj.namaSantri} (${selectedSantriObj.idSantri})`
                  : 'Pantau laju hafalan ayat baru (Ziyadah), akumulasi progres, dan produktivitas bulanan santri'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="ui-chart-filters">
          {/* Kelas Filter */}
          {kelasList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 min-w-0">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setSelectedSantri('ALL');
                }}
                className="bg-transparent font-medium focus:outline-hidden cursor-pointer min-w-0 w-full truncate"
              >
                <option value="ALL">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>{k.namaKelas}</option>
                ))}
              </select>
            </div>
          )}

          {/* Santri Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 min-w-0">
            <Filter className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <select
              value={selectedSantri}
              onChange={(e) => setSelectedSantri(e.target.value)}
              className="bg-transparent font-semibold text-emerald-950 focus:outline-hidden cursor-pointer min-w-0 w-full truncate"
            >
              <option value="ALL">Semua Santri ({santriFilteredByKelas.length})</option>
              {santriFilteredByKelas.map((s) => (
                <option key={s.idSantri} value={s.idSantri}>
                  {s.namaSantri} ({s.idSantri})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={timeRangeMonths}
              onChange={(e) => setTimeRangeMonths(Number(e.target.value))}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value={3}>3 Bulan</option>
              <option value={6}>6 Bulan</option>
              <option value={12}>12 Bulan (1 Tahun)</option>
            </select>
          </div>

          {/* Visual Type Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setVisualType('area')}
              title="Area Chart (Kurva Halus)"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                visualType === 'area'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVisualType('bar')}
              title="Bar Chart (Diagram Batang)"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                visualType === 'bar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVisualType('line')}
              title="Line Chart (Garis Titik)"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                visualType === 'line'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Mode Sub-Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 [&>button]:min-h-11 [&>button]:whitespace-normal">
        <button
          onClick={() => setMetricMode('ayat')}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            metricMode === 'ayat'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Total Ayat Hafalan Baru</span>
        </button>

        <button
          onClick={() => setMetricMode('kumulatif')}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            metricMode === 'kumulatif'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Akumulasi Hafalan (Pertumbuhan)</span>
        </button>

        <button
          onClick={() => setMetricMode('kelancaran')}
          className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            metricMode === 'kelancaran'
              ? 'bg-sky-800 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Tingkat Kelancaran (%)</span>
        </button>

        {selectedSantri === 'ALL' && (
          <button
            onClick={() => setMetricMode('komparasi')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              metricMode === 'komparasi'
                ? 'bg-indigo-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Top Capaian Santri</span>
          </button>
        )}
      </div>

      {/* KPI Highlight Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        {/* Card 1: Total Ayat Dihafal */}
        <div className="bg-emerald-50 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-xs font-semibold text-emerald-800">
              Total Ayat Dihafal
            </span>
            <span className="p-1 rounded-lg bg-emerald-200/60 text-emerald-900">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            <AnimatedCounter value={stats.totalAyatPeriod} /> <span className="text-xs sm:text-sm font-bold text-emerald-800">Ayat</span>
          </h4>
          <p className="text-xs sm:text-xs text-emerald-700/90 mt-0.5">
            Dari {stats.totalSesiPeriod} sesi Ziyadah ({timeRangeMonths} bulan)
          </p>
        </div>

        {/* Card 2: Rata-Rata Bulanan */}
        <div className="bg-teal-50 p-3.5 sm:p-4 rounded-2xl border border-teal-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-xs font-semibold text-teal-800">
              Rata-rata Bulanan
            </span>
            <span className="p-1 rounded-lg bg-teal-200/60 text-teal-900">
              <Target className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="text-xl sm:text-2xl font-black text-teal-950 mt-1">
            <AnimatedCounter value={stats.avgAyatPerMonth} /> <span className="text-xs sm:text-sm font-bold text-teal-800">Ayat/Bln</span>
          </h4>
          <p className="text-xs sm:text-xs text-teal-700/90 mt-0.5">
            Target standar: ~30-50 ayat/bln
          </p>
        </div>

        {/* Card 3: Bulan Puncak */}
        <div className="bg-amber-50 p-3.5 sm:p-4 rounded-2xl border border-amber-200/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-xs font-semibold text-amber-800">
              Bulan Terproduktif
            </span>
            <span className="p-1 rounded-lg bg-amber-200/60 text-amber-900">
              <Award className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-black text-amber-950 mt-1 truncate">
            {stats.peakMonth ? stats.peakMonth.fullBulan : '-'}
          </h4>
          <p className="text-xs sm:text-xs text-amber-800 font-semibold mt-0.5">
            Capaian: {stats.peakMonth ? `${stats.peakMonth.totalAyat} Ayat` : '0 Ayat'}
          </p>
        </div>

        {/* Card 4: MoM Growth */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-xs font-semibold text-slate-700">
              Tren vs Bulan Lalu
            </span>
            <span className={`p-1 rounded-lg ${
              stats.momDirection === 'up'
                ? 'bg-emerald-100 text-emerald-800'
                : stats.momDirection === 'down'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {stats.momDirection === 'up' ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : stats.momDirection === 'down' ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <RotateCw className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <h4 className={`text-xl sm:text-2xl font-black ${
              stats.momDirection === 'up'
                ? 'text-emerald-700'
                : stats.momDirection === 'down'
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}>
              {stats.momDirection === 'up' ? `+${stats.momGrowthPercent}%` : `${stats.momGrowthPercent}%`}
            </h4>
            <span className="text-xs font-semibold text-slate-500">MoM</span>
          </div>
          <p className="text-xs sm:text-xs text-slate-500 mt-0.5 truncate">
            Periode {stats.currentMonthName}
          </p>
        </div>
      </div>

      {/* Main Chart Canvas or Top Capaian Santri */}
      {metricMode === 'komparasi' ? (
        <div className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                  <Trophy className="w-4 h-4" />
                </span>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-800">
                  Top Capaian Santri (Peringkat Hafalan)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Urutan santri teratas berdasarkan total capaian ayat baru Ziyadah ({timeRangeMonths} bulan terakhir)
              </p>
            </div>

            {/* View Mode Toggle (Peringkat Cards vs Grafik Batang) */}
            <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setKomparasiViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  komparasiViewMode === 'cards'
                    ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5 text-slate-600" />
                <span>Daftar Peringkat</span>
              </button>
              <button
                type="button"
                onClick={() => setKomparasiViewMode('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  komparasiViewMode === 'chart'
                    ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Grafik Batang</span>
              </button>
            </div>
          </div>

          {/* If no data */}
          {santriComparisonData.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-semibold">Belum ada data capaian santri untuk ditampilkan</p>
            </div>
          ) : komparasiViewMode === 'cards' ? (
            /* Dedicated Mobile & Responsive Leaderboard Cards */
            <div className="space-y-3">
              {santriComparisonData.map((item, index) => {
                const rank = index + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const maxAyat = santriComparisonData[0]?.totalAyatPeriode || 1;
                const pct = Math.min(100, Math.round((item.totalAyatPeriode / maxAyat) * 100));

                return (
                  <div
                    key={item.idSantri}
                    className={`rounded-2xl p-3.5 sm:p-4 border transition-all ${
                      isTop1
                        ? 'bg-amber-50 border-amber-300 shadow-xs ring-1 ring-amber-200/50'
                        : isTop2
                        ? 'bg-slate-50 border-slate-300 shadow-2xs'
                        : isTop3
                        ? 'bg-orange-50 border-amber-200 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Rank Badge & Name & Class */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Rank Badge */}
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${
                            isTop1
                              ? 'bg-amber-400 text-white shadow-sm'
                              : isTop2
                              ? 'bg-slate-300 text-white shadow-xs'
                              : isTop3
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${rank}`}
                        </div>

                        {/* Name & Class */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-extrabold text-slate-900 text-sm leading-tight break-words">
                              {item.namaSantri}
                            </h5>
                            {item.kelas && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                                {item.kelas}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400 block mt-0.5">
                            ID: {item.idSantri}
                          </span>
                        </div>
                      </div>

                      {/* Right: Total Ayat Periode Highlight */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center bg-emerald-50/80 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-emerald-100 sm:border-0 flex-shrink-0">
                        <span className="text-xs font-semibold text-emerald-800 sm:text-slate-500">
                          Total Periode ({timeRangeMonths} Bln)
                        </span>
                        <div className="text-base sm:text-lg font-black text-emerald-800 leading-none">
                          <AnimatedCounter value={item.totalAyatPeriode} /> <span className="text-xs font-bold text-emerald-950">Ayat</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Sub-Metrics */}
                    <div className="mt-3 space-y-2">
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop1
                              ? 'bg-amber-500'
                              : isTop2
                              ? 'bg-slate-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Chips row - fully responsive without hidden info */}
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold border border-sky-200/60">
                            <Calendar className="w-3 h-3 text-sky-600 flex-shrink-0" />
                            <span>Bulan Ini: <b className="text-sky-950">{item.totalAyatBulanIni} Ayat</b></span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200/60">
                            <BookOpen className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span>{item.totalSesi} Sesi Ziyadah</span>
                          </span>
                        </div>
                        <span className="inline-flex items-center self-start xs:self-auto text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {pct}% dari peringkat #1
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Bar Chart View with enhanced mobile and desktop sizes */
            <div className="w-full min-w-0 pt-2 space-y-2">
              <div className="h-96 sm:h-[420px] w-full min-w-0">
                <MeasuredChartFrame>
                  <BarChart
                    data={santriComparisonData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="namaSantri"
                      tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      width={105}
                      tickFormatter={(val: string) => {
                        if (!val) return '';
                        return val.length > 13 ? val.slice(0, 11) + '..' : val;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '11px',
                        color: '#1e293b'
                      }}
                      formatter={(val: any, name: any) => [
                        `${val} Ayat`,
                        name === 'totalAyatPeriode' ? 'Total Ayat Periode' : 'Total Ayat Bulan Ini'
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={32}
                      formatter={(val) => (
                        <span className="text-xs text-slate-600 font-medium">
                          {val === 'totalAyatPeriode' ? `Total Hafalan (${timeRangeMonths} Bln)` : 'Hafalan Bulan Ini'}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="totalAyatPeriode"
                      name="totalAyatPeriode"
                      fill="#059669"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                    />
                    <Bar
                      dataKey="totalAyatBulanIni"
                      name="totalAyatBulanIni"
                      fill="#0ea5e9"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={16}
                    />
                  </BarChart>
                </MeasuredChartFrame>
              </div>
              <p className="text-center text-xs text-slate-500 font-medium pt-1">
                💡 Sentuh bilah grafik untuk detail, atau pilih tab <b>"Daftar Peringkat"</b> untuk tampilan kartu santri yang lengkap.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50/60 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
                {metricMode === 'ayat' && 'Grafik Laju Ayat Baru per Bulan'}
                {metricMode === 'kumulatif' && 'Grafik Pertumbuhan Akumulasi Hafalan'}
                {metricMode === 'kelancaran' && 'Grafik Tingkat Kelancaran Bacaan'}
              </h4>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Periode {timeRangeMonths} bulan terakhir
            </span>
          </div>

          {/* Recharts Render Area */}
          <div className="h-64 sm:h-80 w-full min-w-0 pt-2">
            <MeasuredChartFrame>
              {visualType === 'bar' ? (
                /* Bar Chart View */
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '11px',
                    color: '#1e293b'
                  }}
                  formatter={(value: any) => [
                    metricMode === 'kelancaran' ? `${value}% Sangat Baik & Baik` : `${value} Ayat`,
                    metricMode === 'ayat'
                      ? 'Ayat Baru (Ziyadah)'
                      : metricMode === 'kumulatif'
                      ? 'Kumulatif Total Ayat'
                      : 'Tingkat Kelancaran'
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={() => (
                    <span className="text-xs text-slate-600 font-medium">
                      {metricMode === 'ayat' ? 'Ayat Hafalan Baru' : metricMode === 'kumulatif' ? 'Pertumbuhan Kumulatif' : 'Kelancaran (%)'}
                    </span>
                  )}
                />
                {metricMode === 'ayat' && stats.avgAyatPerMonth > 0 && (
                  <ReferenceLine
                    y={stats.avgAyatPerMonth}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `Rata-rata: ${stats.avgAyatPerMonth} Ayat`,
                      fill: '#b45309',
                      fontSize: 10,
                      position: 'top'
                    }}
                  />
                )}
                <Bar
                  dataKey={metricMode === 'ayat' ? 'totalAyat' : metricMode === 'kumulatif' ? 'kumulatifAyat' : 'persenLancar'}
                  fill={metricMode === 'ayat' ? '#059669' : metricMode === 'kumulatif' ? '#0d9488' : '#0284c7'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </BarChart>
            ) : visualType === 'line' ? (
              /* Line Chart View */
              <LineChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '11px',
                    color: '#1e293b'
                  }}
                  formatter={(value: any) => [
                    metricMode === 'kelancaran' ? `${value}%` : `${value} Ayat`,
                    metricMode === 'ayat'
                      ? 'Ayat Baru (Ziyadah)'
                      : metricMode === 'kumulatif'
                      ? 'Kumulatif Total Ayat'
                      : 'Tingkat Kelancaran'
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={() => (
                    <span className="text-xs text-slate-600 font-medium">
                      {metricMode === 'ayat' ? 'Laju Ayat Baru' : metricMode === 'kumulatif' ? 'Akumulasi Ayat' : 'Kelancaran (%)'}
                    </span>
                  )}
                />
                {metricMode === 'ayat' && stats.avgAyatPerMonth > 0 && (
                  <ReferenceLine
                    y={stats.avgAyatPerMonth}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `Rata-rata: ${stats.avgAyatPerMonth} Ayat`,
                      fill: '#b45309',
                      fontSize: 10,
                      position: 'top'
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={metricMode === 'ayat' ? 'totalAyat' : metricMode === 'kumulatif' ? 'kumulatifAyat' : 'persenLancar'}
                  stroke={metricMode === 'ayat' ? '#059669' : metricMode === 'kumulatif' ? '#0d9488' : '#0284c7'}
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#059669' }}
                  animationDuration={800}
                />
              </LineChart>
            ) : (
              /* Area Chart View (Default) */
              <AreaChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorMonthlyAyat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMonthlyKumulatif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorMonthlyKelancaran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="bulan"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '11px',
                    color: '#1e293b'
                  }}
                  formatter={(value: any) => [
                    metricMode === 'kelancaran' ? `${value}% Sangat Baik & Baik` : `${value} Ayat`,
                    metricMode === 'ayat'
                      ? 'Ayat Baru (Ziyadah)'
                      : metricMode === 'kumulatif'
                      ? 'Kumulatif Total Ayat'
                      : 'Tingkat Kelancaran'
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={() => (
                    <span className="text-xs text-slate-600 font-medium">
                      {metricMode === 'ayat' ? 'Ayat Hafalan Baru' : metricMode === 'kumulatif' ? 'Pertumbuhan Akumulasi' : 'Tingkat Kelancaran'}
                    </span>
                  )}
                />
                {metricMode === 'ayat' && stats.avgAyatPerMonth > 0 && (
                  <ReferenceLine
                    y={stats.avgAyatPerMonth}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `Rata-rata: ${stats.avgAyatPerMonth} Ayat`,
                      fill: '#b45309',
                      fontSize: 10,
                      position: 'top'
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey={metricMode === 'ayat' ? 'totalAyat' : metricMode === 'kumulatif' ? 'kumulatifAyat' : 'persenLancar'}
                  stroke={metricMode === 'ayat' ? '#059669' : metricMode === 'kumulatif' ? '#0d9488' : '#0284c7'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={
                    metricMode === 'ayat'
                      ? 'url(#colorMonthlyAyat)'
                      : metricMode === 'kumulatif'
                      ? 'url(#colorMonthlyKumulatif)'
                      : 'url(#colorMonthlyKelancaran)'
                  }
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            )}
          </MeasuredChartFrame>
        </div>
      </div>
      )}
    </div>
  );
};
