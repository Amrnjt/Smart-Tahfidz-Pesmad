import React, { useState, useEffect } from 'react';
import { PantauanLiburanRecord, Santri, AppConfig } from '../types';
import { storageService } from '../services/storageService';
import { X, Search, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatTanggalIndo } from '../utils/dateFormatter';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import type { NotifyFn } from './Snackbar';

interface PantauanLiburanMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: Santri[];
  onNotify: NotifyFn;
}

export const PantauanLiburanMonitorModal: React.FC<PantauanLiburanMonitorModalProps> = ({
  isOpen,
  onClose,
  santriList,
  onNotify
}) => {
  const [records, setRecords] = useState<PantauanLiburanRecord[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ programLiburanActive: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedTanggal, setSelectedTanggal] = useState<string>('all');
  const [isToggling, setIsToggling] = useState(false);
  const dialogRef = useAccessibleDialog(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const data = storageService.getPantauanLiburanRecords();
    setRecords(data);
    const cfg = storageService.getAppConfig();
    setAppConfig(cfg);
  };

  const handleToggleProgram = async () => {
    setIsToggling(true);
    const newStatus = !appConfig.programLiburanActive;
    try {
      const updated = await storageService.setProgramLiburanActive(newStatus, 'Ustadz / Admin');
      setAppConfig(updated);
      onNotify('success', newStatus ? 'Program Pantauan Liburan aktif dan tersimpan di Cloud.' : 'Program Pantauan Liburan dinonaktifkan dan tersimpan di Cloud.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Status Program Pantauan Liburan gagal diperbarui di Cloud.');
    } finally {
      setIsToggling(false);
    }
  };

  if (!isOpen) return null;

  // Extract unique classes & dates for filtering
  const uniqueClasses: string[] = (Array.from(new Set(santriList.map(s => s.kelas))).filter(Boolean) as string[]);
  const uniqueDates: string[] = (Array.from(new Set(records.map(r => r.tanggal))).filter(Boolean) as string[]).sort((a, b) => b.localeCompare(a));

  const filteredRecords = records.filter(r => {
    const matchSearch =
      r.namaSantri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.idSantri.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.catatanWali && r.catatanWali.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.inputByWali && r.inputByWali.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchKelas = selectedKelas === 'all' || r.kelas === selectedKelas;
    const matchTanggal = selectedTanggal === 'all' || r.tanggal === selectedTanggal;

    return matchSearch && matchKelas && matchTanggal;
  });

  // Calculate statistics
  const totalReports = records.length;
  const totalWaqiah = records.filter(r => r.wiridWaqiah).length;
  const totalMulk = records.filter(r => r.wiridMulk).length;
  const totalInsyirah = records.filter(r => r.wiridInsyirah).length;


  return (
    <div className="ui-dialog-overlay">
      <div className="fixed inset-0 bg-slate-900/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="ui-dialog-frame relative z-10 flex max-w-5xl flex-col overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pantauan-monitor-title"
        aria-describedby="pantauan-monitor-description"
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4 sm:px-6">
          <div className="min-w-0">
            <h3 id="pantauan-monitor-title" className="text-lg font-bold text-slate-900">
              Pantauan Liburan
            </h3>
            <p id="pantauan-monitor-description" className="mt-1 text-sm text-slate-600">
              Rekap amaliyah santri yang diisi oleh Wali.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Tutup rekap Pantauan Liburan"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {/* Keep controls and records in one scroll area on short mobile viewports. */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <section
            aria-labelledby="pantauan-program-title"
            className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${appConfig.programLiburanActive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="min-w-0">
              <h4 id="pantauan-program-title" className="text-base font-semibold text-slate-900">
                Program {appConfig.programLiburanActive ? 'aktif' : 'nonaktif'}
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                {appConfig.programLiburanActive
                  ? 'Wali dapat mengisi laporan wirid dan shalat.'
                  : 'Pengisian Wali ditutup. Laporan sebelumnya tetap dapat dipantau.'}
              </p>
              {isToggling && (
                <p role="status" className="mt-2 text-sm text-slate-700">
                  Menyimpan status ke Cloud...
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={appConfig.programLiburanActive}
              aria-label={appConfig.programLiburanActive ? 'Nonaktifkan Program Pantauan Liburan' : 'Aktifkan Program Pantauan Liburan'}
              aria-busy={isToggling}
              onClick={handleToggleProgram}
              disabled={isToggling}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
            >
              {appConfig.programLiburanActive ? (
                <ToggleRight className="h-6 w-6 text-emerald-700" aria-hidden="true" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-slate-600" aria-hidden="true" />
              )}
              {isToggling
                ? 'Menyimpan...'
                : appConfig.programLiburanActive
                  ? 'Nonaktifkan'
                  : 'Aktifkan'}
            </button>
          </section>

          <section aria-labelledby="pantauan-summary-title" className="space-y-3">
            <h4 id="pantauan-summary-title" className="text-sm font-semibold text-slate-800">
              Ringkasan seluruh laporan
            </h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200 py-4 sm:grid-cols-4">
              <div>
                <dt className="text-sm text-slate-600">Laporan masuk</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{totalReports}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Al-Waqi'ah dibaca</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{totalWaqiah}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Al-Mulk dibaca</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{totalMulk}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Al-Insyirah dibaca</dt>
                <dd className="mt-1 text-xl font-semibold text-slate-900">{totalInsyirah}</dd>
              </div>
            </dl>
          </section>

          <section
            aria-label="Filter laporan"
            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <label
                htmlFor="pantauan-search"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Cari laporan
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="pantauan-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama, ID, wali, atau catatan"
                  className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-base text-slate-900"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label
                htmlFor="pantauan-date-filter"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Tanggal
              </label>
              <select
                id="pantauan-date-filter"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              >
                <option value="all">Semua tanggal</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {formatTanggalIndo(d)}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label
                htmlFor="pantauan-class-filter"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Kelas
              </label>
              <select
                id="pantauan-class-filter"
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
              >
                <option value="all">Semua kelas</option>
                {uniqueClasses.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section aria-labelledby="pantauan-results-title" className="space-y-3">
            <h4
              id="pantauan-results-title"
              role="status"
              className="text-sm font-semibold text-slate-800"
            >
              Menampilkan {filteredRecords.length} dari {totalReports} laporan
            </h4>
            {filteredRecords.length === 0 ? (
              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
                <p className="text-base font-semibold text-slate-800">
                  {records.length === 0
                    ? 'Belum ada laporan liburan'
                    : 'Tidak ada laporan yang cocok'}
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  {records.length === 0
                    ? appConfig.programLiburanActive
                      ? 'Program sudah aktif. Laporan akan muncul setelah Wali mencatat amaliyah ananda.'
                      : 'Aktifkan program agar Wali dapat mengisi laporan amaliyah.'
                    : 'Ubah kata pencarian, tanggal, atau kelas untuk melihat laporan lain.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((r) => (
                  <article key={r.id} className="rounded-xl border border-slate-200 p-4">
                    <header className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-3 sm:flex-row">
                      <div className="min-w-0">
                        <h5 className="break-words text-base font-semibold text-slate-900">
                          {r.namaSantri}
                        </h5>
                        <p className="mt-1 break-words text-sm text-slate-600">
                          {r.idSantri}
                          {r.kelas && <span> · {r.kelas}</span>}
                        </p>
                      </div>
                      <div className="min-w-0 sm:text-right">
                        <p className="text-sm font-semibold text-slate-800">
                          {formatTanggalIndo(r.tanggal)}
                        </p>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          Dicatat: {r.timestamp}
                        </p>
                      </div>
                    </header>
                    <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="min-w-0">
                        <h6 className="mb-3 text-sm font-semibold text-slate-900">
                          Wirid yaumiyyah
                        </h6>
                        <dl className="space-y-2 text-sm">
                          {[
                            { label: "Al-Waqi'ah", done: r.wiridWaqiah },
                            { label: 'Al-Mulk', done: r.wiridMulk },
                            { label: 'Al-Insyirah', done: r.wiridInsyirah }
                          ].map((s) => (
                            <div key={s.label} className="flex flex-wrap justify-between gap-2">
                              <dt className="text-slate-600">{s.label}</dt>
                              <dd
                                className={
                                  s.done ? 'font-medium text-emerald-800' : 'text-slate-600'
                                }
                              >
                                {s.done ? 'Sudah dibaca' : 'Belum dibaca'}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div className="min-w-0">
                        <h6 className="mb-3 text-sm font-semibold text-slate-900">
                          Shalat lima waktu
                        </h6>
                        <dl className="space-y-2 text-sm">
                          {[
                            { waktu: 'Subuh', status: r.shalatSubuh },
                            { waktu: 'Dzuhur', status: r.shalatDzuhur },
                            { waktu: 'Ashar', status: r.shalatAshar },
                            { waktu: 'Maghrib', status: r.shalatMaghrib },
                            { waktu: 'Isya', status: r.shalatIsya }
                          ].map((s) => (
                            <div key={s.waktu} className="flex flex-wrap justify-between gap-2">
                              <dt className="text-slate-600">{s.waktu}</dt>
                              <dd
                                className={
                                  s.status === "Jama'ah"
                                    ? 'font-medium text-emerald-800'
                                    : s.status === 'Berhalangan'
                                      ? 'font-medium text-amber-800'
                                      : 'font-medium text-rose-800'
                                }
                              >
                                {s.status}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                        <h6 className="mb-3 text-sm font-semibold text-slate-900">Catatan Wali</h6>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                          {r.catatanWali || 'Tidak ada catatan.'}
                        </p>
                        <p className="mt-3 break-words text-xs text-slate-600">
                          Diisi oleh: {r.inputByWali || 'Wali Santri'}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <p className="border-t border-slate-200 pt-4 text-sm text-slate-600">
            Ustadz/Admin dapat mengatur program dan melihat rekap. Pengisian dan perubahan laporan
            dilakukan oleh Wali Santri.
          </p>
        </div>
        <footer className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
          >
            Tutup rekap
          </button>
        </footer>
      </div>
    </div>
  );
};
