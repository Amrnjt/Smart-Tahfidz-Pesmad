import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Download,
  FileText,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import type {
  Santri,
  SemesterAkademik,
  User,
} from '../types';
import { SEMESTER_AKADEMIK_OPTIONS } from '../types';
import {
  fetchAcademicReport,
  type AcademicReportMode,
  type AcademicReportSummary,
} from '../services/academicReportService';
import { storageService } from '../services/storageService';
import { downloadAcademicReportPdf } from '../utils/academicReportPdf';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import type { NotifyFn } from './Snackbar';

interface AcademicReportModalProps {
  santri: Santri;
  currentUser: User;
  onClose: () => void;
  onNotify: NotifyFn;
}

function qualityLabel(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)} / 4`;
}

function categoryLabel(type: string): string {
  if (type === 'Murojaah') return "Muroja'ah";
  if (type === 'Pembelajaran') return 'Pembelajaran/Materi';
  return type;
}

export const AcademicReportModal: React.FC<AcademicReportModalProps> = ({
  santri,
  currentUser,
  onClose,
  onNotify,
}) => {
  const config = storageService.getAppConfig();
  const [mode, setMode] = useState<AcademicReportMode>('semester');
  const [semester, setSemester] = useState<SemesterAkademik>(config.semesterAkademikAktif || 'Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState(config.tahunPelajaranAktif || '');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [summary, setSummary] = useState<AcademicReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useAccessibleDialog(true, () => {
    if (!isDownloading) onClose();
  });

  useEffect(() => {
    let cancelled = false;

    const loadYears = async () => {
      try {
        const history = await storageService.fetchAcademicHistory(santri.idSantri);
        if (cancelled) return;

        const years = Array.from(new Set([
          config.tahunPelajaranAktif || '',
          ...history.map(record => record.tahunPelajaran),
        ].filter(Boolean))).sort((a, b) => b.localeCompare(a));

        setAvailableYears(years);
        if (!tahunPelajaran && years[0]) {
          setTahunPelajaran(years[0]);
        }
      } catch {
        if (!cancelled) {
          const fallback = config.tahunPelajaranAktif ? [config.tahunPelajaranAktif] : [];
          setAvailableYears(fallback);
        }
      }
    };

    void loadYears();
    return () => {
      cancelled = true;
    };
  }, [santri.idSantri]);

  useEffect(() => {
    if (!tahunPelajaran) return;
    let cancelled = false;

    const loadReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const next = await fetchAcademicReport({
          santri,
          tahunPelajaran,
          mode,
          semester: mode === 'semester' ? semester : undefined,
        });
        if (!cancelled) setSummary(next);
      } catch (err) {
        if (!cancelled) {
          setSummary(null);
          setError(err instanceof Error ? err.message : 'Rekap akademik belum dapat dimuat.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [santri.idSantri, tahunPelajaran, mode, semester]);

  const totalNilai = useMemo(() => {
    if (!summary) return 0;
    return (['Mengulang', 'Kurang', 'Baik', 'Sangat Baik'] as const)
      .reduce((sum, key) => sum + summary.nilaiCounts[key], 0);
  }, [summary]);

  const handleDownload = async () => {
    if (!summary) return;
    setIsDownloading(true);
    try {
      await downloadAcademicReportPdf(summary, currentUser.nama || 'Smart Tahfidz');
      onNotify('success', `PDF rekap akademik ${santri.namaSantri} berhasil dibuat.`);
    } catch {
      onNotify('error', 'Gagal membuat PDF rekap akademik.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      className="ui-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="academic-report-title"
      tabIndex={-1}
    >
      <div className="ui-dialog-panel max-w-3xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 id="academic-report-title" className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              Rekap Akademik & PDF
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {santri.namaSantri} · {santri.idSantri}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            aria-label="Tutup rekap akademik"
            className="ui-dialog-close cursor-pointer text-lg disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
            <CalendarRange className="w-4 h-4 text-emerald-700" />
            Periode Laporan
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="report-year">
                Tahun Pelajaran
              </label>
              <select
                id="report-year"
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                className="ui-control w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-800"
              >
                {availableYears.length === 0 && tahunPelajaran && (
                  <option value={tahunPelajaran}>{tahunPelajaran}</option>
                )}
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="report-mode">
                Jenis Rekap
              </label>
              <select
                id="report-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as AcademicReportMode)}
                className="ui-control w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-800"
              >
                <option value="semester">Per Semester</option>
                <option value="year">1 Tahun Pelajaran</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="report-semester">
                Semester
              </label>
              <select
                id="report-semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value as SemesterAkademik)}
                disabled={mode === 'year'}
                className="ui-control w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
              >
                {SEMESTER_AKADEMIK_OPTIONS.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-emerald-900/70">
            Semester Ganjil menggunakan rentang Juli–Desember dan Semester Genap Januari–Juni.
            Rekap tahunan menggunakan Juli–Juni sesuai Tahun Pelajaran.
          </p>
        </section>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-700" />
            <p className="mt-3 font-semibold">Mengambil rekap dari Cloud Firestore...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 flex items-start gap-2">
            <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Rekap belum dapat dimuat</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{summary.periodLabel}</p>
                  <h4 className="mt-1 text-base font-extrabold text-slate-900">{santri.namaSantri}</h4>
                  <p className="mt-1 text-xs text-slate-600">
                    MTs · {summary.formalClassLabel} · Kelas Al-Qur'an {summary.quranClassLabel}
                  </p>
                </div>
                <span className="self-start rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  {summary.academicStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                ['Total Setoran', String(summary.totalSetoran)],
                ['Hari Aktif', String(summary.activeDays)],
                ['Ayat Ziyadah', String(summary.totalZiyadahAyat)],
                ['Indeks Kualitas', qualityLabel(summary.qualityIndex)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h5 className="text-sm font-extrabold text-slate-900">Rekap per Jenis</h5>
                <div className="mt-3 space-y-2">
                  {summary.categories.map(category => (
                    <div key={category.type} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-700">{categoryLabel(category.type)}</span>
                      <span className="text-slate-500">
                        <b className="text-slate-900">{category.count}</b> setoran · {qualityLabel(category.qualityIndex)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h5 className="text-sm font-extrabold text-slate-900">Distribusi Nilai</h5>
                <p className="mt-1 text-[11px] text-slate-500">{totalNilai} penilaian pada periode terpilih.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ['Sangat Baik', summary.nilaiCounts['Sangat Baik'], 'bg-emerald-50 border-emerald-200 text-emerald-800'],
                    ['Baik', summary.nilaiCounts.Baik, 'bg-indigo-50 border-indigo-200 text-indigo-800'],
                    ['Kurang', summary.nilaiCounts.Kurang, 'bg-amber-50 border-amber-200 text-amber-800'],
                    ['Mengulang', summary.nilaiCounts.Mengulang, 'bg-rose-50 border-rose-200 text-rose-800'],
                  ].map(([label, value, tone]) => (
                    <div key={String(label)} className={`rounded-xl border p-3 ${tone}`}>
                      <p className="text-[11px] font-semibold">{label}</p>
                      <p className="mt-1 text-lg font-extrabold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
              Indeks Kualitas adalah skala internal 1–4 dari predikat Mengulang, Kurang, Baik, dan Sangat Baik.
              Indeks ini bukan nilai rapor sekolah formal.
            </div>
          </div>
        ) : null}

        <div className="ui-dialog-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="ui-control w-full sm:w-auto rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!summary || isLoading || isDownloading}
            className="ui-control w-full sm:w-auto rounded-lg bg-emerald-800 hover:bg-emerald-700 px-5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? 'Membuat PDF...' : 'Unduh PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
