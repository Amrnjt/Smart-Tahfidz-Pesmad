import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

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
  const dialogRef = useAccessibleDialog(isOpen, onClose);

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

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-download-title"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 sm:px-6 py-4 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="report-download-title" className="font-bold text-sm sm:text-base truncate">
                Unduh Laporan Hafalan (PDF)
              </h3>
              <p className="text-[11px] text-emerald-100">
                Pilih periode dan konten laporan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/15 transition cursor-pointer flex-shrink-0"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>PDF berhasil diunduh! Periksa folder Unduhan Anda.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          {!isViewOnly && santriList.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Santri
              </label>

              <select
                value={selectedSantriId}
                onChange={e => setSelectedSantriId(e.target.value)}
                className="w-full min-w-0 py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Santri (Gabungan)</option>
                {santriList.map(s => (
                  <option key={s.idSantri} value={s.idSantri}>
                    {s.namaSantri} ({s.idSantri})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Period Selector */}
          <div>
            <div className="flex items-center gap-2 mb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setUseRange(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  !useRange
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Satu Bulan
              </button>

              <button
                type="button"
                onClick={() => setUseRange(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  useRange
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Beberapa Bulan
              </button>
            </div>

            {!useRange ? (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Periode Laporan
                </label>

                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="w-full min-w-0 py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    Dari Bulan
                  </label>

                  <select
                    value={rangeStart}
                    onChange={e => setRangeStart(e.target.value)}
                    className="w-full min-w-0 py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    Sampai Bulan
                  </label>

                  <select
                    value={rangeEnd}
                    onChange={e => setRangeEnd(e.target.value)}
                    className="w-full min-w-0 py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <p className="text-[11px] text-rose-600 font-semibold mt-1.5">
                Bulan awal harus sebelum atau sama dengan bulan akhir.
              </p>
            )}
          </div>

          {/* Content Options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Konten Laporan
            </label>

            <div className="space-y-2">
              {optionItems.map(item => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    options[item.key]
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                      options[item.key]
                        ? 'bg-emerald-600 border-emerald-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {options[item.key] && (
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>

                  <input
                    type="checkbox"
                    checked={options[item.key]}
                    onChange={() => toggleOption(item.key)}
                    className="sr-only"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preview Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-600">
                Pratinjau Data
              </span>
            </div>

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
                <>
                  <p>
                    Ziyadah pada periode ini:{' '}
                    <b>
                      {
                        reportZiyadah.filter(r => matchFn(r.timestamp)).length
                      }
                    </b>{' '}
                    setoran
                  </p>
                  <p>
                    Muroja'ah pada periode ini:{' '}
                    <b>
                      {
                        reportMurojaah.filter(r => matchFn(r.timestamp)).length
                      }
                    </b>{' '}
                    setoran
                  </p>
                  <p>
                    Binnadzor pada periode ini:{' '}
                    <b>
                      {
                        reportBinnadzor.filter(r => matchFn(r.timestamp)).length
                      }
                    </b>{' '}
                    setoran
                  </p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-10 bg-white border-t border-slate-100 px-5 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] flex items-center justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating || (useRange && !rangeValid)}
            className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
