import React, { useState, useMemo } from 'react';
import {
  Kelas,
  Santri,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  TipeKelas,
  AspekKualitas,
  StatusKenaikan
} from '../../types';
import { MeasuredChartFrame } from '../MeasuredChartFrame';
import { WeeklyQualityChart } from './WeeklyQualityChart';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  Filter
} from 'lucide-react';
import { formatTanggalRingkas, parseDateSafe } from '../../utils/dateFormatter';
import { getDevelopmentAllowedSantriIds } from '../../utils/developmentScope';

interface AdaptiveDevelopmentTrendProps {
  kelasList: Kelas[];
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords?: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
}

// Numerical mapping for AspekKualitas
const QUALITY_TO_SCORE: Record<AspekKualitas, number> = {
  'Perlu Bimbingan': 1,
  'Cukup': 2,
  'Baik': 3,
  'Sangat Baik': 4,
  'Mutqin': 5
};

const SCORE_TO_QUALITY: Record<number, AspekKualitas> = {
  1: 'Perlu Bimbingan',
  2: 'Cukup',
  3: 'Baik',
  4: 'Sangat Baik',
  5: 'Mutqin'
};

const QUALITY_COLOR_MAP: Record<AspekKualitas, string> = {
  'Perlu Bimbingan': 'text-rose-700 bg-rose-50 border-rose-200',
  'Cukup': 'text-amber-700 bg-amber-50 border-amber-200',
  'Baik': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Sangat Baik': 'text-teal-700 bg-teal-50 border-teal-200',
  'Mutqin': 'text-indigo-700 bg-indigo-50 border-indigo-200'
};

export const AdaptiveDevelopmentTrend: React.FC<AdaptiveDevelopmentTrendProps> = ({
  kelasList,
  santriList,
  ziyadahRecords = [],
  murojaahRecords = [],
  binnadzorRecords = [],
  pembelajaranRecords = []
}) => {
  // Determine selected class
  const [selectedKelasId, setSelectedKelasId] = useState<string>('ALL');
  const [selectedTipeFilter, setSelectedTipeFilter] = useState<TipeKelas>('Tahfidz');
  const [selectedSantriId, setSelectedSantriId] = useState<string>('ALL');

  const selectedKelas = useMemo(() => {
    if (selectedKelasId === 'ALL') return null;
    return kelasList.find(k => k.id === selectedKelasId) || null;
  }, [kelasList, selectedKelasId]);

  // Active tipe kelas is either derived from the selected class or user choice
  const activeTipeKelas: TipeKelas = useMemo(() => {
    if (selectedKelas?.tipeKelas) {
      return selectedKelas.tipeKelas;
    }
    return selectedTipeFilter;
  }, [selectedKelas, selectedTipeFilter]);

  // Allowed santri IDs for current filter. Aggregate Binnadzor intentionally
  // keeps all Binnadzor records even when class membership arrays are incomplete.
  const allowedSantriIds = useMemo(() => getDevelopmentAllowedSantriIds({
    selectedKelas,
    kelasList,
    santriList,
    activeTipeKelas,
  }), [selectedKelas, kelasList, santriList, activeTipeKelas]);

  const availableSantri = useMemo(() => santriList
    .filter(s => !allowedSantriIds || allowedSantriIds.has(s.idSantri))
    .sort((a, b) => a.namaSantri.localeCompare(b.namaSantri)), [santriList, allowedSantriIds]);

  // Santri name resolver
  const santriMap = useMemo(() => {
    return new Map<string, string>(santriList.map(s => [s.idSantri, s.namaSantri]));
  }, [santriList]);

  const resolveSantriName = (id: string, fallback?: string) => {
    return santriMap.get(id) || fallback || id;
  };

  // Convert PredikatNilai fallback to AspekKualitas
  const nilaiToQuality = (nilai: string): AspekKualitas => {
    if (nilai === 'Sangat Baik') return 'Sangat Baik';
    if (nilai === 'Baik') return 'Baik';
    if (nilai === 'Kurang') return 'Cukup';
    return 'Perlu Bimbingan';
  };

  // 1. TAHFIDZ: Tren Kelancaran Hafalan dari kualitas Ziyadah
  const tahfidzData = useMemo(() => {
    let records = ziyadahRecords;
    if (allowedSantriIds) {
      records = records.filter(r => allowedSantriIds.has(r.idSantri));
    }
    if (selectedSantriId !== 'ALL') records = records.filter(r => r.idSantri === selectedSantriId);

    const sorted = [...records].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    // Group or sample recent 15 data points
    const points = sorted.slice(-20).map((r, idx) => {
      const quality: AspekKualitas = r.kelancaran || nilaiToQuality(r.nilai);
      const score = QUALITY_TO_SCORE[quality] || 3;
      const datePart = r.timestamp ? r.timestamp.slice(0, 10) : '';
      return {
        id: r.id || `pt-${idx}`,
        dateStr: datePart ? formatTanggalRingkas(datePart) : `#${idx + 1}`,
        rawDate: datePart,
        santri: resolveSantriName(r.idSantri, r.namaSantri),
        surah: `${r.surah || 'Surah'} (${r.ayatAwal}-${r.ayatAkhir})`,
        quality,
        score
      };
    });

    // Aggregates
    const total = records.length;
    let sumScore = 0;
    let mutqinCount = 0;
    records.forEach(r => {
      const q = r.kelancaran || nilaiToQuality(r.nilai);
      const s = QUALITY_TO_SCORE[q] || 3;
      sumScore += s;
      if (q === 'Mutqin' || q === 'Sangat Baik') mutqinCount++;
    });

    const avgScore = total > 0 ? (sumScore / total) : 0;
    const roundedAvg = Math.min(5, Math.max(1, Math.round(avgScore)));
    const avgQualityLabel = total > 0 ? SCORE_TO_QUALITY[roundedAvg] : '-';
    const mutqinRatio = total > 0 ? Math.round((mutqinCount / total) * 100) : 0;

    return { points, total, avgScore: avgScore.toFixed(1), avgQualityLabel, mutqinRatio };
  }, [ziyadahRecords, allowedSantriIds, selectedSantriId, santriMap]);

  // 2. BINNADZOR: Tren Kelancaran dari kualitas Binnadzor
  const binnadzorData = useMemo(() => {
    let records = binnadzorRecords;
    if (allowedSantriIds) {
      records = records.filter(r => allowedSantriIds.has(r.idSantri));
    }
    if (selectedSantriId !== 'ALL') records = records.filter(r => r.idSantri === selectedSantriId);

    const sorted = [...records].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    const points = sorted.slice(-20).map((b, idx) => {
      const quality: AspekKualitas = b.kelancaran || nilaiToQuality(b.nilai);
      const score = QUALITY_TO_SCORE[quality] || 3;
      const datePart = b.timestamp ? b.timestamp.slice(0, 10) : '';
      return {
        id: b.id || `bnd-${idx}`,
        dateStr: datePart ? formatTanggalRingkas(datePart) : `#${idx + 1}`,
        santri: resolveSantriName(b.idSantri, b.namaSantri),
        materi: b.materi || b.surahAtauHalaman || 'Tilawah',
        quality,
        score,
        tajwid: b.hukumTajwid || 'Baik',
        makhroj: b.makhrojHuruf || 'Baik',
        fashohah: b.kefasihan || 'Baik'
      };
    });

    const total = records.length;
    let mutqinKelancaran = 0;
    let mutqinTajwid = 0;
    records.forEach(b => {
      const q = b.kelancaran || nilaiToQuality(b.nilai);
      if (q === 'Mutqin' || q === 'Sangat Baik') mutqinKelancaran++;
      if (b.hukumTajwid === 'Mutqin' || b.hukumTajwid === 'Sangat Baik' || b.hukumTajwid === 'Baik') mutqinTajwid++;
    });

    const kelancaranRatio = total > 0 ? Math.round((mutqinKelancaran / total) * 100) : 0;
    const tajwidRatio = total > 0 ? Math.round((mutqinTajwid / total) * 100) : 0;

    return { points, total, kelancaranRatio, tajwidRatio };
  }, [binnadzorRecords, allowedSantriIds, selectedSantriId, santriMap]);

  const weeklyQualityRecords = useMemo(() => {
    const records = activeTipeKelas === 'Tahfidz' ? ziyadahRecords : binnadzorRecords;
    return records.filter(r => (!allowedSantriIds || allowedSantriIds.has(r.idSantri)) &&
      (selectedSantriId === 'ALL' || r.idSantri === selectedSantriId));
  }, [activeTipeKelas, ziyadahRecords, binnadzorRecords, allowedSantriIds, selectedSantriId]);

  // 3. JILID / MATERI PEMBELAJARAN: Tren Progres Pembelajaran
  const jilidData = useMemo(() => {
    let records = pembelajaranRecords.filter(p => !p.tipeKelas || !p.tipeKelas.toLowerCase().includes('istimewa'));
    if (allowedSantriIds) {
      records = records.filter(r => allowedSantriIds.has(r.idSantri));
    }

    const sorted = [...records].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

    // Breakdown status kenaikan
    const statusCounts: Record<StatusKenaikan, number> = {
      'Lanjut Halaman': 0,
      'Ulang Halaman': 0,
      'Naik Jilid': 0,
      'Perlu Pendampingan Khusus': 0
    };

    sorted.forEach(p => {
      if (p.statusKenaikan && statusCounts[p.statusKenaikan] !== undefined) {
        statusCounts[p.statusKenaikan]++;
      } else {
        statusCounts['Lanjut Halaman']++;
      }
    });

    const points = sorted.slice(-15).map((p, idx) => {
      const datePart = p.timestamp ? p.timestamp.slice(0, 10) : '';
      const hal = p.halaman || p.halamanAkhir || 1;
      return {
        id: p.id || `pbl-${idx}`,
        dateStr: datePart ? formatTanggalRingkas(datePart) : `#${idx + 1}`,
        santri: resolveSantriName(p.idSantri, p.namaSantri),
        jilid: p.jilid || p.jilidAtauKategori || 'Jilid Ummi',
        halaman: hal,
        materi: p.pokokBahasan || p.materiPokok || p.materi || `Hal. ${hal}`,
        statusKenaikan: p.statusKenaikan || 'Lanjut Halaman'
      };
    });

    return { points, total: sorted.length, statusCounts };
  }, [pembelajaranRecords, allowedSantriIds, santriMap]);

  // 4. KELAS ISTIMEWA: Tren Pendampingan
  const istimewaData = useMemo(() => {
    let records = pembelajaranRecords.filter(p => p.tipeKelas && p.tipeKelas.toLowerCase().includes('istimewa'));
    if (allowedSantriIds) {
      records = records.filter(r => allowedSantriIds.has(r.idSantri));
    }

    const sorted = [...records].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    const sessions = sorted.slice(0, 10).map(p => ({
      id: p.id,
      timestamp: p.timestamp,
      santri: resolveSantriName(p.idSantri, p.namaSantri),
      tahap: p.tahapIstimewa || p.jilidAtauKategori || 'Terapi Makhroj & Fashohah',
      statusKenaikan: p.statusKenaikan || 'Perlu Pendampingan Khusus',
      kendala: p.kendalaSantri || 'Penguatan makhroj dan ketepatan panjang-pendek',
      rekomendasi: p.rekomendasiTindakLanjut || p.catatanBimbingan || p.catatan || 'Latihan talaqqi mandiri 15 menit ba\'da Subuh'
    }));

    return { sessions, total: sorted.length };
  }, [pembelajaranRecords, allowedSantriIds, santriMap]);

  return (
    <div className="ui-bento-card overflow-hidden p-4 sm:p-5 space-y-4">
      {/* Top Header: Adaptive Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Activity className="w-3 h-3 text-emerald-700" />
              <span>Tren Perkembangan Adaptif</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Konteks: <strong className="text-slate-900">{activeTipeKelas}</strong>
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            {activeTipeKelas === 'Tahfidz' && (selectedSantriId === 'ALL' ? 'Perkembangan Nilai Setoran Ziyadah' : 'Kelancaran Hafalan Santri')}
            {(activeTipeKelas === 'Binnadzor' || activeTipeKelas === 'Binnadzor A' || activeTipeKelas === 'Binnadzor B') && (selectedSantriId === 'ALL' ? 'Perkembangan Nilai Setoran Binnadzor' : 'Kelancaran Bacaan Santri')}
            {activeTipeKelas === 'Jilid' && 'Tren Progres Pembelajaran Jilid'}
            {activeTipeKelas === 'Kelas Istimewa' && 'Tren Pendampingan Santri Istimewa'}
          </h3>
        </div>

        {/* Class Filter Dropdown or Type Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {kelasList.length > 0 && (
            <div className="relative">
              <select
                aria-label="Pilih kelas untuk analisis perkembangan"
                value={selectedKelasId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedKelasId(val);
                  setSelectedSantriId('ALL');
                  if (val !== 'ALL') {
                    const k = kelasList.find(c => c.id === val);
                    if (k) setSelectedTipeFilter(k.tipeKelas);
                  }
                }}
                className="ui-control px-2.5 py-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Kelas ({activeTipeKelas})</option>
                {kelasList.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.namaKelas} ({k.tipeKelas})
                  </option>
                ))}
              </select>
            </div>
          )}

          {(activeTipeKelas === 'Tahfidz' || activeTipeKelas.startsWith('Binnadzor')) && (
            <select
              aria-label="Pilih santri untuk melihat perkembangan individu"
              value={selectedSantriId}
              onChange={e => setSelectedSantriId(e.target.value)}
              className="ui-control px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Semua santri</option>
              {availableSantri.map(s => <option key={s.idSantri} value={s.idSantri}>{s.namaSantri}</option>)}
            </select>
          )}

          {/* If ALL is selected, allow explicit switching of context */}
          {selectedKelasId === 'ALL' && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              {(['Tahfidz', 'Binnadzor', 'Jilid', 'Kelas Istimewa'] as TipeKelas[]).map(tipe => (
                <button
                  key={tipe}
                  type="button"
                  onClick={() => { setSelectedTipeFilter(tipe); setSelectedSantriId('ALL'); }}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    activeTipeKelas === tipe
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tipe === 'Jilid' ? 'Jilid Ummi' : tipe}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ADAPTIVE VIEW CONTENT */}

      {/* CASE 1: TAHFIDZ (Kelancaran Hafalan dari Aspek Kualitas Ziyadah) */}
      {activeTipeKelas === 'Tahfidz' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-800">Rata-rata Kelancaran</span>
              <div className="text-lg font-extrabold text-emerald-950 mt-0.5 flex items-baseline gap-1.5">
                <span>{tahfidzData.avgQualityLabel}</span>
                <span className="text-xs font-medium text-emerald-700">({tahfidzData.avgScore} / 5)</span>
              </div>
            </div>
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-teal-800">Mutqin & Sangat Baik</span>
              <div className="text-lg font-extrabold text-teal-950 mt-0.5">
                {tahfidzData.mutqinRatio}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-600">Setoran Dinilai (12 Bln)</span>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                {tahfidzData.total}
              </div>
            </div>
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-indigo-800">Skala Mutu</span>
              <div className="text-xs font-bold text-indigo-900 mt-1">
                Mutqin • Jayyid Jiddan
              </div>
            </div>
          </div>

          {/* Class view compares weekly distributions; the original line remains for one santri. */}
          {selectedSantriId === 'ALL' ? (
            <WeeklyQualityChart records={weeklyQualityRecords} label="Ziyadah" />
          ) : (
            <div className="h-64 w-full pt-2">
              {tahfidzData.points.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
                  Belum ada data setoran Ziyadah untuk kelas/tipe ini.
                </div>
              ) : (
                <MeasuredChartFrame>
                  <AreaChart
                    data={tahfidzData.points}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="tahfidzGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="dateStr"
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val: number) => {
                        const q = SCORE_TO_QUALITY[Math.round(val)];
                        if (q === 'Perlu Bimbingan') return 'Bimbingan';
                        if (q === 'Sangat Baik') return 'Sgt Baik';
                        return q || '';
                      }}
                      tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                            <div className="font-bold text-slate-900">{data.santri}</div>
                            <div className="text-slate-500 text-[11px]">{data.surah}</div>
                            <div className="mt-1.5 flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                              <span className="text-slate-600">Kelancaran:</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${QUALITY_COLOR_MAP[data.quality as AspekKualitas] || 'text-slate-800'}`}>
                                {data.quality}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">{data.rawDate}</div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#tahfidzGrad)"
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#047857' }}
                    />
                  </AreaChart>
                </MeasuredChartFrame>
            )}
          </div>
          )}
        </div>
      )}

      {/* CASE 2: BINNADZOR (Kelancaran & Kualitas Tilawah) */}
      {(activeTipeKelas === 'Binnadzor' || activeTipeKelas === 'Binnadzor A' || activeTipeKelas === 'Binnadzor B') && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-indigo-800">Kelancaran Jayyid+</span>
              <div className="text-lg font-extrabold text-indigo-950 mt-0.5">
                {binnadzorData.kelancaranRatio}%
              </div>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-800">Tajwid Sesuai Kaidah</span>
              <div className="text-lg font-extrabold text-emerald-950 mt-0.5">
                {binnadzorData.tajwidRatio}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-600">Tilawah Dievaluasi (12 Bln)</span>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                {binnadzorData.total}
              </div>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-800">4 Aspek Fokus</span>
              <div className="text-xs font-bold text-amber-900 mt-1">
                Tajwid • Makhroj • Fashohah
              </div>
            </div>
          </div>

          {selectedSantriId === 'ALL' ? (
            <WeeklyQualityChart records={weeklyQualityRecords} label="Binnadzor" />
          ) : (
            <div className="h-64 w-full pt-2">
              {binnadzorData.points.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
                  Belum ada data setoran Binnadzor untuk kelas/tipe ini.
                </div>
              ) : (
                <MeasuredChartFrame>
                  <LineChart
                    data={binnadzorData.points}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="dateStr"
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val: number) => {
                        const q = SCORE_TO_QUALITY[Math.round(val)];
                        if (q === 'Perlu Bimbingan') return 'Bimbingan';
                        if (q === 'Sangat Baik') return 'Sgt Baik';
                        return q || '';
                      }}
                      tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-md text-xs space-y-1">
                            <div className="font-bold text-slate-900">{data.santri}</div>
                            <div className="text-slate-500 text-[11px]">{data.materi}</div>
                            <div className="pt-1.5 border-t border-slate-100 space-y-1">
                              <div className="flex justify-between gap-3">
                                <span className="text-slate-600">Kelancaran:</span>
                                <span className="font-bold text-indigo-700">{data.quality}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[11px]">
                                <span className="text-slate-500">Tajwid:</span>
                                <span className="font-semibold text-slate-700">{data.tajwid}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[11px]">
                                <span className="text-slate-500">Makhroj:</span>
                                <span className="font-semibold text-slate-700">{data.makhroj}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4338CA"
                      strokeWidth={2.5}
                      dot={{ fill: '#4338CA', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3730A3' }}
                    />
                  </LineChart>
                </MeasuredChartFrame>
            )}
          </div>
          )}
        </div>
      )}

      {/* CASE 3: JILID / PEMBELAJARAN (Progres Kenaikan Halaman & Jilid) */}
      {activeTipeKelas === 'Jilid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-800">🎉 Naik Jilid</span>
              <div className="text-lg font-extrabold text-emerald-950 mt-0.5">
                {jilidData.statusCounts['Naik Jilid']} kali
              </div>
            </div>
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-teal-800">➡️ Lanjut Halaman</span>
              <div className="text-lg font-extrabold text-teal-950 mt-0.5">
                {jilidData.statusCounts['Lanjut Halaman']} kali
              </div>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-800">🔁 Ulang Halaman</span>
              <div className="text-lg font-extrabold text-amber-950 mt-0.5">
                {jilidData.statusCounts['Ulang Halaman']} kali
              </div>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl">
              <span className="text-[11px] font-semibold text-rose-800">🤝 Perlu Pendampingan</span>
              <div className="text-lg font-extrabold text-rose-950 mt-0.5">
                {jilidData.statusCounts['Perlu Pendampingan Khusus']} kali
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {jilidData.points.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
                Belum ada data pembelajaran Jilid untuk kelas ini.
              </div>
            ) : (
              <MeasuredChartFrame>
                <BarChart
                  data={jilidData.points}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="dateStr"
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                    tickFormatter={(val: number) => `Hal ${val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-md text-xs space-y-1">
                          <div className="font-bold text-slate-900">{data.santri}</div>
                          <div className="text-slate-500 text-[11px]">{data.jilid} • {data.materi}</div>
                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-slate-600">Status Kenaikan:</span>
                            <span className="font-bold text-emerald-800 px-1.5 py-0.5 bg-emerald-50 rounded">
                              {data.statusKenaikan}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="halaman"
                    fill="#0D9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </MeasuredChartFrame>
            )}
          </div>
        </div>
      )}

      {/* CASE 4: KELAS ISTIMEWA (Tren Pendampingan & Intervensi) */}
      {activeTipeKelas === 'Kelas Istimewa' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-800 flex-shrink-0" />
              <span className="text-xs font-bold text-amber-950">
                Pendampingan Terfokus ({istimewaData.total} Sesi Tercatat)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              Evaluasi Berkelanjutan
            </span>
          </div>

          {istimewaData.sessions.length === 0 ? (
            <div className="flex h-36 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-500">
              Belum ada catatan pendampingan untuk Kelas Istimewa.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {istimewaData.sessions.map((sess, idx) => (
                <div
                  key={sess.id || `ist-${idx}`}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-300 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{sess.santri}</span>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                      {sess.tahap}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-rose-50/70 border border-rose-100 p-2 rounded-lg">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-800">
                        Kendala Santri:
                      </span>
                      <p className="text-slate-700 mt-0.5 text-[11px] leading-relaxed">
                        {sess.kendala}
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-100 p-2 rounded-lg">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Rekomendasi Tindak Lanjut:
                      </span>
                      <p className="text-slate-700 mt-0.5 text-[11px] leading-relaxed">
                        {sess.rekomendasi}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>Status: <strong className="text-slate-600 font-semibold">{sess.statusKenaikan}</strong></span>
                    <span>{sess.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
