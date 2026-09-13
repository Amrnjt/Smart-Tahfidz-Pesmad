import React, { useState, useMemo } from 'react';
import { MeasuredChartFrame } from './MeasuredChartFrame';
import { AnimatedCounter } from './AnimatedCounter';
import { ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Santri, Kelas } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, ChartBar as BarChart3, ChartPie as PieIcon, ListFilter as Filter, Calendar, GraduationCap, BookOpenCheck } from 'lucide-react';

interface HafalanStatsChartProps {
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  kelasList?: Kelas[];
}

export const HafalanStatsChart: React.FC<HafalanStatsChartProps> = ({
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = [],
  kelasList = []
}) => {
  const [selectedSantriFilter, setSelectedSantriFilter] = useState<string>('ALL');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6);
  const [activeSubTab, setActiveSubTab] = useState<'tren' | 'kualitas'>('tren');

  // Month names in Indonesian
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  // 0. Filter santri by selected kelas first
  const kelasFilteredSantri = useMemo(() => {
    if (selectedKelasFilter === 'ALL') return santriList;
    const kls = kelasList.find(k => k.id === selectedKelasFilter);
    if (!kls || !kls.santriIds) return santriList;
    return santriList.filter(s => kls.santriIds.includes(s.idSantri));
  }, [santriList, kelasList, selectedKelasFilter]);

  // 1. Filter records by selected santri and kelas
  const filteredZiyadah = useMemo(() => {
    if (selectedSantriFilter !== 'ALL') return ziyadahRecords.filter(r => r.idSantri === selectedSantriFilter);
    if (selectedKelasFilter !== 'ALL') {
      const allowedIds = new Set(kelasFilteredSantri.map(s => s.idSantri));
      return ziyadahRecords.filter(r => allowedIds.has(r.idSantri));
    }
    return ziyadahRecords;
  }, [ziyadahRecords, selectedSantriFilter, selectedKelasFilter, kelasFilteredSantri]);

  const filteredMurojaah = useMemo(() => {
    if (selectedSantriFilter !== 'ALL') return murojaahRecords.filter(r => r.idSantri === selectedSantriFilter);
    if (selectedKelasFilter !== 'ALL') {
      const allowedIds = new Set(kelasFilteredSantri.map(s => s.idSantri));
      return murojaahRecords.filter(r => allowedIds.has(r.idSantri));
    }
    return murojaahRecords;
  }, [murojaahRecords, selectedSantriFilter, selectedKelasFilter, kelasFilteredSantri]);

  const filteredBinnadzor = useMemo(() => {
    if (selectedSantriFilter !== 'ALL') return binnadzorRecords.filter(r => r.idSantri === selectedSantriFilter);
    if (selectedKelasFilter !== 'ALL') {
      const allowedIds = new Set(kelasFilteredSantri.map(s => s.idSantri));
      return binnadzorRecords.filter(r => allowedIds.has(r.idSantri));
    }
    return binnadzorRecords;
  }, [binnadzorRecords, selectedSantriFilter, selectedKelasFilter, kelasFilteredSantri]);

  const filteredPembelajaran = useMemo(() => {
    if (selectedSantriFilter !== 'ALL') return pembelajaranRecords.filter(r => r.idSantri === selectedSantriFilter);
    if (selectedKelasFilter !== 'ALL') {
      const allowedIds = new Set(kelasFilteredSantri.map(s => s.idSantri));
      return pembelajaranRecords.filter(r => allowedIds.has(r.idSantri));
    }
    return pembelajaranRecords;
  }, [pembelajaranRecords, selectedSantriFilter, selectedKelasFilter, kelasFilteredSantri]);

  // 2. Prepare monthly trend data (e.g. past 6 or 12 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const result = [];

    for (let i = timeRangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-indexed
      const yearMonthKey = `${year}-${(month + 1).toString().padStart(2, '0')}`;
      const label = `${monthNames[month]} ${year !== now.getFullYear() ? `'${year.toString().slice(-2)}` : ''}`;

      // Count Ziyadah in this month
      const ziyadahCount = filteredZiyadah.filter(r => {
        const datePart = r.timestamp.split(' ')[0] || r.timestamp;
        return datePart.startsWith(yearMonthKey);
      }).length;

      // Count Murojaah in this month
      const murojaahCount = filteredMurojaah.filter(r => {
        const datePart = r.timestamp.split(' ')[0] || r.timestamp;
        return datePart.startsWith(yearMonthKey);
      }).length;

      // Count Binnadzor in this month
      const binnadzorCount = filteredBinnadzor.filter(r => {
        const datePart = r.timestamp.split(' ')[0] || r.timestamp;
        return datePart.startsWith(yearMonthKey);
      }).length;

      // Count Pembelajaran in this month
      const pembelajaranCount = filteredPembelajaran.filter(r => {
        const datePart = r.timestamp.split(' ')[0] || r.timestamp;
        return datePart.startsWith(yearMonthKey);
      }).length;

      result.push({
        monthKey: yearMonthKey,
        bulan: label,
        Ziyadah: ziyadahCount,
        Murojaah: murojaahCount,
        Binnadzor: binnadzorCount,
        Pembelajaran: pembelajaranCount,
        Total: ziyadahCount + murojaahCount + binnadzorCount + pembelajaranCount
      });
    }

    return result;
  }, [filteredZiyadah, filteredMurojaah, filteredBinnadzor, filteredPembelajaran, timeRangeMonths]);

  // 3. Prepare Nilai / Predikat Distribution Data
  const predikatData = useMemo(() => {
    const all = [...filteredZiyadah, ...filteredMurojaah, ...filteredBinnadzor, ...filteredPembelajaran];
    if (all.length === 0) return [];

    const counts: { [key: string]: number } = {
      'Sangat Baik': 0,
      'Baik': 0,
      'Kurang': 0,
      'Mengulang': 0
    };

    all.forEach(r => {
      if (counts[r.nilai] !== undefined) {
        counts[r.nilai]++;
      } else {
        counts['Mengulang']++;
      }
    });

    const colors: { [key: string]: string } = {
      'Sangat Baik': '#047857', // Emerald 700
      'Baik': '#0284c7',       // Sky 600
      'Kurang': '#d97706',     // Amber 600
      'Mengulang': '#e11d48'   // Rose 600
    };

    return Object.keys(counts)
      .filter(key => counts[key] > 0)
      .map(key => ({
        name: key,
        value: counts[key],
        color: colors[key] || '#64748b'
      }));
  }, [filteredZiyadah, filteredMurojaah, filteredBinnadzor, filteredPembelajaran]);

  // 4. Hitung 4 Aspek Kualitas (Hukum Tajwid, Makhroj Huruf, Kefasihan, Kelancaran)
  const qualityStats = useMemo(() => {
    const qualityRecords = [...filteredBinnadzor, ...filteredPembelajaran].filter(r => (r as any).aspekKualitas);
    if (qualityRecords.length === 0) {
      return null;
    }

    let tajwidTotal = 0, makhrojTotal = 0, fashohahTotal = 0, kelancaranTotal = 0;
    const scoreMap: { [key: string]: number } = {
      'Sangat Baik': 100,
      'Baik': 80,
      'Cukup': 65,
      'Kurang': 50
    };

    qualityRecords.forEach(r => {
      const ak = (r as any).aspekKualitas;
      tajwidTotal += scoreMap[ak?.hukumTajwid] || 75;
      makhrojTotal += scoreMap[ak?.makhrojHuruf] || 75;
      fashohahTotal += scoreMap[ak?.kefasihan] || 75;
      kelancaranTotal += scoreMap[ak?.kelancaran] || 75;
    });

    const count = qualityRecords.length;
    return [
      { name: 'Hukum Tajwid', score: Math.round(tajwidTotal / count), color: '#059669', ket: 'Hukum mad, ghunnah & waqaf' },
      { name: 'Makhroj Huruf', score: Math.round(makhrojTotal / count), color: '#0284c7', ket: 'Titik artikulasi huruf hijaiyah' },
      { name: 'Kefasihan (Fashohah)', score: Math.round(fashohahTotal / count), color: '#d97706', ket: 'Kejelasan lahjah & harakat' },
      { name: 'Kelancaran Bacaan', score: Math.round(kelancaranTotal / count), color: '#8b5cf6', ket: 'Irama ritmik tartil & tempo' },
    ];
  }, [filteredBinnadzor, filteredPembelajaran]);

  const totalFilteredSetoran = filteredZiyadah.length + filteredMurojaah.length + filteredBinnadzor.length + filteredPembelajaran.length;

  return (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs space-y-4 sm:space-y-5 w-full min-w-0 max-w-full">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3.5 sm:pb-4 w-full min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Grafik Tren Perkembangan Setoran
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Visualisasi aktivitas setoran Ziyadah, Muroja'ah, &amp; Binnadzor per bulan
          </p>
        </div>

        {/* Filter Controls with soft glass look */}
        <div className="ui-chart-filters">
          {/* Kelas Filter */}
          {kelasList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 min-w-0">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={selectedKelasFilter}
                onChange={(e) => { setSelectedKelasFilter(e.target.value); setSelectedSantriFilter('ALL'); }}
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
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 min-w-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedSantriFilter}
              onChange={(e) => setSelectedSantriFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer min-w-0 w-full truncate"
            >
              <option value="ALL">Semua Santri ({kelasFilteredSantri.length})</option>
              {kelasFilteredSantri.map((s) => (
                <option key={s.idSantri} value={s.idSantri}>
                  {s.namaSantri} ({s.idSantri})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={timeRangeMonths}
              onChange={(e) => setTimeRangeMonths(Number(e.target.value))}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer"
            >
              <option value={3}>3 Bulan</option>
              <option value={6}>6 Bulan</option>
              <option value={12}>1 Tahun</option>
            </select>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setChartType('bar')}
              title="Grafik Batang (Bar Chart)"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer press-feedback ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Grafik Area / Garis (Area Chart)"
              className={`min-h-11 min-w-11 p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer press-feedback ${
                chartType === 'area'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Monthly chart top, Donut chart underneath on mobile (<1024px) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0">
        
        {/* Monthly Trend Chart (2 cols on large screen, 1 col on mobile) */}
        <div className="lg:col-span-2 space-y-3 min-w-0 w-full max-w-full">
          <div className="flex flex-col justify-between gap-2 min-w-0">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
              <span className="truncate">Aktivitas Setoran Bulanan</span>
              <span className="text-xs font-normal text-slate-400 truncate">
                ({selectedSantriFilter === 'ALL' ? 'Seluruh Santri' : santriList.find(s => s.idSantri === selectedSantriFilter)?.namaSantri || selectedSantriFilter})
              </span>
            </h4>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-xs">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 flex-shrink-0"></span>
                Ziyadah ({filteredZiyadah.length})
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 flex-shrink-0"></span>
                Muroja'ah ({filteredMurojaah.length})
              </span>
              <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 flex-shrink-0"></span>
                Binnadzor ({filteredBinnadzor.length})
              </span>
              <span className="flex items-center gap-1 text-orange-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 flex-shrink-0"></span>
                Pembelajaran ({filteredPembelajaran.length})
              </span>
            </div>
          </div>

          <div className="h-60 sm:h-72 w-full min-w-0 pt-2">
            <MeasuredChartFrame>
              {chartType === 'bar' ? (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    formatter={(value: any, name: any) => [
                      `${value} kali sesi`,
                      name === 'Ziyadah' ? '📖 Ziyadah (Hafalan Baru)' : name === 'Murojaah' ? '🔄 Muroja\'ah (Pengulangan)' : name === 'Binnadzor' ? '📑 Binnadzor (Baca Mushaf)' : '📘 Pembelajaran Non-Tahfidz'
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 font-medium">
                        {value === 'Ziyadah' ? 'Ziyadah' : value === 'Murojaah' ? 'Muroja\'ah' : value === 'Binnadzor' ? 'Binnadzor' : 'Pembelajaran'}
                      </span>
                    )}
                  />
                  <Bar dataKey="Ziyadah" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="Murojaah" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="Binnadzor" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={800} animationEasing="ease-out" />
                  <Bar dataKey="Pembelajaran" fill="#ea580c" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={800} animationEasing="ease-out" />
                </BarChart>
              ) : (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorZiyadah" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorMurojaah" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorBinnadzor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorPembelajaran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
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
                    formatter={(value: any, name: any) => [
                      `${value} kali sesi`,
                      name === 'Ziyadah' ? '📖 Ziyadah (Hafalan Baru)' : name === 'Murojaah' ? '🔄 Muroja\'ah (Pengulangan)' : name === 'Binnadzor' ? '📑 Binnadzor (Baca Mushaf)' : '📘 Pembelajaran Non-Tahfidz'
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 font-medium">
                        {value === 'Ziyadah' ? 'Ziyadah' : value === 'Murojaah' ? 'Muroja\'ah' : value === 'Binnadzor' ? 'Binnadzor' : 'Pembelajaran'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="Ziyadah"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorZiyadah)"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="Murojaah"
                    stroke="#d97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMurojaah)"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="Binnadzor"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBinnadzor)"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="Pembelajaran"
                    stroke="#ea580c"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPembelajaran)"
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              )}
            </MeasuredChartFrame>
          </div>
        </div>

        {/* Quality / Predikat Distribution Donut Chart (Placed underneath on mobile, 1 col) */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 flex flex-col justify-between min-w-0 w-full">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Distribusi Nilai</span>
              </h4>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {totalFilteredSetoran} Total
              </span>
            </div>

            {predikatData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <PieIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Belum ada data setoran</p>
              </div>
            ) : (
              <div className="h-40 sm:h-44 w-full relative mt-2">
                <MeasuredChartFrame>
                  <PieChart>
                    <Pie
                      data={predikatData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {predikatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} kali setoran`, 'Jumlah']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </MeasuredChartFrame>
                
                {/* Center Label with Animated Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base sm:text-lg font-extrabold text-slate-800">
                    <AnimatedCounter value={totalFilteredSetoran} />
                  </span>
                  <span className="text-xs sm:text-xs text-slate-500 font-medium">Setoran</span>
                </div>
              </div>
            )}
          </div>

          {/* Predikat Legend List */}
          <div className="space-y-1.5 pt-3 border-t border-slate-200/70 text-xs">
            {predikatData.map((item) => {
              const percentage = totalFilteredSetoran > 0 ? Math.round((item.value / totalFilteredSetoran) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 font-semibold">
                    <span className="text-slate-800">{item.value}</span>
                    <span className="text-xs text-slate-400">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Panel Analisis 4 Pilar Kualitas Bacaan Non-Tahfidz & Binnadzor */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-emerald-100/90 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-600 text-white flex-shrink-0 shadow-xs">
              <BookOpenCheck className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                Evaluasi 4 Aspek Kualitas Tilawah &amp; Pembelajaran
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Binnadzor &amp; Jilid Ummi
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Standar penilaian capaian santri: Tajwid, Makhroj, Kefasihan (Fashohah), dan Kelancaran
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 font-medium self-start sm:self-auto bg-white px-3 py-1 rounded-xl border border-emerald-200/80">
            Teranalisis dari <span className="font-bold text-emerald-800">{filteredBinnadzor.length + filteredPembelajaran.length}</span> sesi
          </div>
        </div>

        {qualityStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {qualityStats.map((item) => (
              <div key={item.name} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md" style={{ color: item.color, backgroundColor: `${item.color}15` }}>
                    {item.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.score}%`, backgroundColor: item.color }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 truncate">{item.ket}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 text-center text-slate-500 text-xs border border-dashed border-slate-200">
            Belum ada penilaian 4 aspek kualitas pada filter ini. Input setoran Binnadzor atau Pembelajaran (Jilid Ummi/Istimewa) untuk melihat indikator.
          </div>
        )}
      </div>
    </div>
  );
};
