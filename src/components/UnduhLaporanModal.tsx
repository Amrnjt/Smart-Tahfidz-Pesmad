import React, { useMemo, useState } from 'react';
import {
  User,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  Santri
} from '../types';
import {
  useGeneratePDF,
  NAMA_BULAN,
  ReportOptions,
  ReportPeriod,
  ReportPeriodRange
} from '../hooks/useGeneratePDF';
import { parseDateSafe } from '../utils/dateFormatter';
import {
  X,
  Download,
  FileText,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Loader as Loader2,
  Calendar,
  CalendarRange
} from 'lucide-react';

interface UnduhLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  santriList: Santri[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
}

export const UnduhLaporanModal: React.FC<UnduhLaporanModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  santriList,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords = [],
  pembelajaranRecords = []
}) => {
  const { isGenerating, error, success, generatePDF } = useGeneratePDF();

  const isViewOnly = currentUser.role === 'Wali' || currentUser.role === 'Santri';
  const targetSantriId =
    currentUser.idSantri ||
    (currentUser.role === 'Santri' ? currentUser.username : '');

  const scopedZiyadah = isViewOnly
    ? ziyadahRecords.filter(r => r.idSantri === targetSantriId)
    : ziyadahRecords;
  const scopedMurojaah = isViewOnly
    ? murojaahRecords.filter(r => r.idSantri === targetSantriId)
    : murojaahRecords;
  const scopedBinnadzor = isViewOnly
    ? binnadzorRecords.filter(r => r.idSantri === targetSantriId)
    : binnadzorRecords;
  const scopedPembelajaran = isViewOnly
    ? pembelajaranRecords.filter(r => r.idSantri === targetSantriId)
    : pembelajaranRecords;

  const targetSantri = isViewOnly
    ? santriList.find(s => s.idSantri === targetSantriId) || null
    : null;

  const [selectedSantriId, setSelectedSantriId] = useState<string>('');

  const reportSantri = isViewOnly
    ? targetSantri
    : santriList.find(s => s.idSantri === selectedSantriId) || null;

  const reportZiyadah = isViewOnly
    ? scopedZiyadah
    : ziyadahRecords.filter(r => !selectedSantriId || r.idSantri === selectedSantriId);
  const reportMurojaah = isViewOnly
    ? scopedMurojaah
    : murojaahRecords.filter(r => !selectedSantriId || r.idSantri === selectedSantriId);
  const reportBinnadzor = isViewOnly
    ? scopedBinnadzor
    : binnadzorRecords.filter(r => !selectedSantriId || r.idSantri === selectedSantriId);
  const reportPembelajaran = isViewOnly
    ? scopedPembelajaran
    : pembelajaranRecords.filter(r => !selectedSantriId || r.idSantri === selectedSantriId);

  const availablePeriods = useMemo(() => {
    const allRecords = [
      ...reportZiyadah,
      ...reportMurojaah,
      ...reportBinnadzor,
      ...reportPembelajaran
    ];
    const periodSet = new Set<string>();

    allRecords.forEach(r => {
      const datePart = r.timestamp.split(' ')[0] || r.timestamp;
      const parsed = parseDateSafe(datePart);
      periodSet.add(`${parsed.getFullYear()}-${parsed.getMonth()}`);
    });

    const now = new Date();
    periodSet.add(`${now.getFullYear()}-${now.getMonth()}`);

    return Array.from(periodSet)
      .map(key => {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        return {
          key,
          year,
          month,
          label: `${NAMA_BULAN[month]} ${year}`,
          sortKey: year * 100 + month
        };
      })
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [reportZiyadah, reportMurojaah, reportBinnadzor, reportPembelajaran]);

  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  });

  const [useRange, setUseRange] = useState(false);

  const [rangeStart, setRangeStart] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  });

  const [rangeEnd, setRangeEnd] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  });

  const [options, setOptions] = useState<ReportOptions>({
    includeIdentity: true,
    includeSummary: true,
    includeHistory: true,
    includeChart: true,
    includeNotes: true
  });

  if (!isOpen) return null;

  const [selectedYear, selectedMonth] = period.split('-').map(Number);
  const reportPeriod: ReportPeriod = {
    month: selectedMonth,
    year: selectedYear
  };

  const [rangeStartYear, rangeStartMonth] = rangeStart.split('-').map(Number);
  const [rangeEndYear, rangeEndMonth] = rangeEnd.split('-').map(Number);

  const reportPeriodRange: ReportPeriodRange = {
    startMonth: rangeStartMonth,
    startYear: rangeStartYear,
    endMonth: rangeEndMonth,
    endYear: rangeEndYear
  };

  const rangeValid = (() => {
    const start = new Date(rangeStartYear, rangeStartMonth, 1);
    const end = new Date(rangeEndYear, rangeEndMonth, 1);
    return start.getTime() <= end.getTime();
  })();

  const handleDownload = async () => {
    await generatePDF({
      santri: reportSantri,
      currentUser,
      ziyadahRecords: reportZiyadah,
      murojaahRecords: reportMurojaah,
      binnadzorRecords: reportBinnadzor,
      pembelajaranRecords: reportPembelajaran,
      period: reportPeriod,
      periodRange: useRange && rangeValid ? reportPeriodRange : undefined,
      options
    });
  };

  const toggleOption = (key: keyof ReportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const optionItems: {
    key: keyof ReportOptions;
    label: string;
    desc: string;
  }[] = [
    {
      key: 'includeIdentity',
      label: 'Identitas Santri',
      desc: 'Nama, kelas/halaqah, target hafalan'
    },
    {
      key: 'includeSummary',
      label: 'Ringkasan Hafalan',
      desc: 'Total ayat, surah, distribusi nilai'
    },
    {
      key: 'includeHistory',
      label: 'Daftar Riwayat Setoran',
      desc: 'Tanggal, surah, jenis, nilai'
    },
    {
      key: 'includeChart',
      label: 'Grafik Progres Hafalan',
      desc: 'Visualisasi bar chart setoran'
    },
    {
      key: 'includeNotes',
      label: 'Catatan Ustadz/Pengajar',
      desc: 'Evaluasi dan komentar pembimbing'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-lg bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Unduh Laporan PDF
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Pilih periode dan isi laporan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
          {success && (
            <div className="px-2.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>PDF berhasil diunduh.</span>
            </div>
          )}

          {error && (
            <div className="px-2.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          {!isViewOnly && santriList.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Santri
              </label>
              <select
                value={selectedSantriId}
                onChange={e => setSelectedSantriId(e.target.value)}
                className="w-full min-w-0 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Santri</option>
                {santriList.map(s => (
                  <option key={s.idSantri} value={s.idSantri}>
                    {s.namaSantri} ({s.idSantri})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Periode
            </label>

            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-2">
              <button
                type="button"
                onClick={() => setUseRange(false)}
                className={`min-w-0 h-8 rounded-md text-[11px] font-semibold transition cursor-pointer inline-flex items-center justify-center gap-1 ${
                  !useRange
                    ? 'bg-white text-slate-900 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Satu Bulan</span>
              </button>

              <button
                type="button"
                onClick={() => setUseRange(true)}
                className={`min-w-0 h-8 rounded-md text-[11px] font-semibold transition cursor-pointer inline-flex items-center justify-center gap-1 ${
                  useRange
                    ? 'bg-white text-slate-900 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Rentang Bulan</span>
              </button>
            </div>

            {!useRange ? (
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full min-w-0 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {availablePeriods.map(p => (
                  <option
                    key={`${p.year}-${p.month}`}
                    value={`${p.year}-${p.month}`}
                  >
                    {p.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="min-w-0">
                  <label className="block text-[10px] text-slate-500 mb-1">
                    Dari
                  </label>
                  <select
                    value={rangeStart}
                    onChange={e => setRangeStart(e.target.value)}
                    className="w-full min-w-0 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {availablePeriods.map(p => (
                      <option
                        key={`${p.year}-${p.month}`}
                        value={`${p.year}-${p.month}`}
                      >
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-[10px] text-slate-500 mb-1">
                    Sampai
                  </label>
                  <select
                    value={rangeEnd}
                    onChange={e => setRangeEnd(e.target.value)}
                    className="w-full min-w-0 h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {availablePeriods.map(p => (
                      <option
                        key={`${p.year}-${p.month}`}
                        value={`${p.year}-${p.month}`}
                      >
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {useRange && !rangeValid && (
              <p className="mt-1.5 text-[10px] font-medium text-rose-600">
                Bulan awal tidak boleh melewati bulan akhir.
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              Isi Laporan
            </label>

            <div className="divide-y divide-slate-100 border-y border-slate-100">
              {optionItems.map(item => (
                <label
                  key={item.key}
                  className="flex items-start gap-2 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={options[item.key]}
                    onChange={() => toggleOption(item.key)}
                    className="mt-0.5 w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 flex-shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-800 leading-4">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-4">
                      {item.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 text-[10px] text-slate-500 leading-4">
            {(() => {
              const prefixes =
                useRange && rangeValid
                  ? (() => {
                      const list: string[] = [];
                      let m = rangeStartMonth;
                      let yr = rangeStartYear;

                      while (true) {
                        list.push(
                          `${yr}-${(m + 1).toString().padStart(2, '0')}`
                        );
                        if (yr === rangeEndYear && m === rangeEndMonth) break;
                        m++;
                        if (m > 11) {
                          m = 0;
                          yr++;
                        }
                      }

                      return list;
                    })()
                  : [
                      `${selectedYear}-${(selectedMonth + 1)
                        .toString()
                        .padStart(2, '0')}`
                    ];

              const matchFn = (ts: string) => {
                const dp = ts.split(' ')[0] || ts;
                return prefixes.some(p => dp.startsWith(p));
              };

              return (
                <p>
                  Ziyadah <b>{reportZiyadah.filter(r => matchFn(r.timestamp)).length}</b>
                  {' · '}Muroja'ah <b>{reportMurojaah.filter(r => matchFn(r.timestamp)).length}</b>
                  {' · '}Binnadzor <b>{reportBinnadzor.filter(r => matchFn(r.timestamp)).length}</b>
                </p>
              );
            })()}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-3 sm:px-5 py-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || (useRange && !rangeValid)}
            className="h-9 min-w-0 flex-1 sm:flex-none sm:px-4 rounded-lg bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="truncate">Memproses...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 flex-shrink-0" />
                <span>Unduh PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
