import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  Download,
  FileSpreadsheet,
  RefreshCw,
  TriangleAlert,
  Users,
} from 'lucide-react';
import {
  KELAS_FORMAL_OPTIONS,
  SEMESTER_AKADEMIK_OPTIONS,
  type KelasFormal,
  type Santri,
  type SemesterAkademik,
  type User,
} from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { storageService } from '../services/storageService';
import {
  fetchCollectiveAcademicReport,
  type CollectiveAcademicReportSummary,
} from '../services/collectiveAcademicReportService';
import type { AcademicReportMode } from '../services/academicReportService';
import { downloadCollectiveAcademicReportPdf } from '../utils/collectiveAcademicReportPdf';
import type { NotifyFn } from './Snackbar';

interface CollectiveAcademicReportModalProps {
  santriList: Santri[];
  currentUser: User;
  onClose: () => void;
  onNotify: NotifyFn;
}

function qualityLabel(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)} / 4`;
}

export const CollectiveAcademicReportModal: React.FC<CollectiveAcademicReportModalProps> = ({
  santriList,
  currentUser,
  onClose,
  onNotify,
}) => {
  const config = storageService.getAppConfig();
  const currentYear = new Date().getFullYear();
  const defaultStartYear = (() => {
    const match = /^(\d{4})\/(\d{4})$/.exec(config.tahunPelajaranAktif || '');
    return match ? Number(match[1]) : currentYear;
  })();

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => {
        const start = defaultStartYear - 4 + index;
        return `${start}/${start + 1}`;
      }).reverse(),
    [defaultStartYear],
  );

  const [kelasFormal, setKelasFormal] = useState<KelasFormal>('VII');
  const [tahunPelajaran, setTahunPelajaran] = useState(
    config.tahunPelajaranAktif || yearOptions[0] || `${currentYear}/${currentYear + 1}`,
  );
  const [mode, setMode] = useState<AcademicReportMode>('semester');
  const [semester, setSemester] = useState<SemesterAkademik>(
    config.semesterAkademikAktif || 'Ganjil',
  );
  const [summary, setSummary] = useState<CollectiveAcademicReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useAccessibleDialog(true, () => {
    if (!isDownloading) onClose();
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const next = await fetchCollectiveAcademicReport({
          santriList,
          kelasFormal,
          tahunPelajaran,
          mode,
          semester: mode === 'semester' ? semester : undefined,
        });
        if (!cancelled) setSummary(next);
      } catch (err) {
        if (!cancelled) {
          setSummary(null);
          setError(err instanceof Error ? err.message : 'Rekap kolektif belum dapat dimuat.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [santriList, kelasFormal, tahunPelajaran, mode, semester]);

  const handleDownload = async () => {
    if (!summary) return;
    setIsDownloading(true);
    try {
      await downloadCollectiveAcademicReportPdf(summary, currentUser.nama || 'Smart Tahfidz');
      onNotify(
        'success',
        `PDF rekap kolektif Kelas ${summary.kelasFormal} ${summary.tahunPelajaran} berhasil dibuat.`,
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'Gagal membuat PDF rekap kolektif.',
      );
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
      aria-labelledby="collective-academic-report-title"
      tabIndex={-1}
    >
      <div className="ui-dialog-panel max-w-6xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3
              id="collective-academic-report-title"
              className="text-base font-extrabold text-slate-900 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              Rekap Kolektif Kelas Formal
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Rekap satu angkatan berdasarkan snapshot akademik historis, bukan kelas formal santri saat ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            aria-label="Tutup rekap kolektif"
            className="ui-dialog-close cursor-pointer text-lg disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-950">
            <CalendarRange className="w-4 h-4 text-emerald-700" />
            Filter Angkatan & Periode
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            <div>
              <label htmlFor="collective-class" className="block text-xs font-bold text-slate-700 mb-1">
                Kelas Formal
              </label>
              <select
                id="collective-class"
                value={kelasFormal}
                onChange={(e) => setKelasFormal(e.target.value as KelasFormal)}
                className="ui-control w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-800"
              >
                {KELAS_FORMAL_OPTIONS.map(value => (
                  <option key={value} value={value}>Kelas {value}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="collective-year" className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Pelajaran
              </label>
              <select
                id="collective-year"
                value={tahunPelajaran}
                onChange={(e) => setTahunPelajaran(e.target.value)}
                className="ui-control w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-800"
              >
                {yearOptions.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="collective-mode" className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Rekap
              </label>
              <select
                id="collective-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as AcademicReportMode)}
                className="ui-control w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-800"
              >
                <option value="semester">Per Semester</option>
                <option value="year">1 Tahun Pelajaran</option>
              </select>
            </div>

            <div>
              <label htmlFor="collective-semester" className="block text-xs font-bold text-slate-700 mb-1">
                Semester
              </label>
              <select
                id="collective-semester"
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
            Alumni tetap masuk bila memiliki snapshot pada kelas dan periode yang dipilih. Santri yang saat ini sudah naik kelas tidak dipindahkan ke kelas baru dalam laporan historis.
          </p>
        </section>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-700" />
            <p className="mt-3 font-semibold">Mengambil rekap kolektif dari Cloud Firestore...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 flex items-start gap-2">
            <TriangleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Rekap kolektif belum dapat dimuat</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {[
                ['Santri', String(summary.totalSantri)],
                ['Aktif Setor', String(summary.santriAktifSetoran)],
                ['Total Setoran', String(summary.totalSetoran)],
                ['Ayat Ziyadah', String(summary.totalZiyadahAyat)],
                ['Indeks Kualitas', qualityLabel(summary.qualityIndex)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    MTs · Kelas {summary.kelasFormal}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-500">{summary.periodLabel}</p>
                </div>
                <span className="self-start sm:self-auto rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  {summary.totalSantri} santri
                </span>
              </div>

              {summary.students.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Users className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Tidak ada snapshot santri pada kelas/periode ini
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Rekap kolektif tidak menggunakan kelas formal saat ini sebagai pengganti riwayat historis.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full min-w-[980px] text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-3 py-2.5 text-left">No.</th>
                        <th className="px-3 py-2.5 text-left">Santri</th>
                        <th className="px-3 py-2.5 text-left">Kelas Al-Qur'an</th>
                        <th className="px-3 py-2.5 text-left">Status</th>
                        <th className="px-3 py-2.5 text-right">Ziyadah</th>
                        <th className="px-3 py-2.5 text-right">Muroja'ah</th>
                        <th className="px-3 py-2.5 text-right">Binnadzor</th>
                        <th className="px-3 py-2.5 text-right">Materi</th>
                        <th className="px-3 py-2.5 text-right">Total</th>
                        <th className="px-3 py-2.5 text-right">Hari</th>
                        <th className="px-3 py-2.5 text-right">Ayat</th>
                        <th className="px-3 py-2.5 text-right">Indeks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.students.map((student, index) => (
                        <tr key={student.idSantri} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-slate-500">{index + 1}</td>
                          <td className="px-3 py-2.5">
                            <p className="font-bold text-slate-800">{student.namaSantri}</p>
                            <p className="mt-0.5 text-[11px] font-mono text-slate-500">{student.idSantri}</p>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{student.kelasAlQuran}</td>
                          <td className="px-3 py-2.5">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-600">
                              {student.academicStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">{student.ziyadahCount}</td>
                          <td className="px-3 py-2.5 text-right">{student.murojaahCount}</td>
                          <td className="px-3 py-2.5 text-right">{student.binnadzorCount}</td>
                          <td className="px-3 py-2.5 text-right">{student.pembelajaranCount}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-800">{student.totalSetoran}</td>
                          <td className="px-3 py-2.5 text-right">{student.activeDays}</td>
                          <td className="px-3 py-2.5 text-right">{student.totalZiyadahAyat}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{qualityLabel(student.qualityIndex)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600">
              Indeks Kualitas memakai skala internal 1–4 dari predikat setoran dan bukan nilai rapor sekolah formal.
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
            disabled={!summary || summary.totalSantri === 0 || isLoading || isDownloading}
            className="ui-control w-full sm:w-auto rounded-lg bg-emerald-800 hover:bg-emerald-700 px-5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? 'Membuat PDF...' : 'Unduh PDF Kolektif'}
          </button>
        </div>
      </div>
    </div>
  );
};
