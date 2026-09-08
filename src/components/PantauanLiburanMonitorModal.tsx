import React, { useState, useEffect } from 'react';
import { PantauanLiburanRecord, Santri, AppConfig } from '../types';
import { storageService } from '../services/storageService';
import { X, Search, Calendar, Filter, Sparkles, CheckCircle2, CircleAlert as AlertCircle, BookOpen, Clock, Shield, Eye, FileText, ToggleLeft, ToggleRight, Check, AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden overscroll-contain animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pantauan-monitor-title"
        aria-describedby="pantauan-monitor-description"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Eye className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="pantauan-monitor-title" className="text-base sm:text-lg font-extrabold text-slate-900">
                  Rekapitulasi Program Pantauan Liburan Santri
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800">
                  Mode: Khusus Pantauan Ustadz (View-Only)
                </span>
              </div>
              <p id="pantauan-monitor-description" className="text-xs text-slate-500 mt-0.5">
                Monitoring amaliyah wirid yaumiyyah (al-Waqi'ah, al-Mulk, al-Insyirah) & shalat berjama'ah yang diisi oleh Wali Santri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Remote Switch inside Modal */}
            <div className={`p-2 rounded-2xl border flex items-center gap-2.5 ${
              appConfig.programLiburanActive ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-100 border-slate-300'
            }`}>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 leading-none">Remote Program</div>
                <div className={`text-xs font-extrabold leading-tight ${
                  appConfig.programLiburanActive ? 'text-emerald-800' : 'text-slate-600'
                }`}>
                  {appConfig.programLiburanActive ? '🟢 Sedang Aktif' : '⚪ Sedang Nonaktif'}
                </div>
              </div>
              <button
                onClick={handleToggleProgram}
                disabled={isToggling}
                title={appConfig.programLiburanActive ? 'Nonaktifkan Program' : 'Aktifkan Program'}
                className={`p-1.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
                  appConfig.programLiburanActive
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                }`}
              >
                {appConfig.programLiburanActive ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/60 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-slate-500 font-semibold text-[11px]">Total Laporan Masuk</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{totalReports} Laporan</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-emerald-700 font-semibold text-[11px]">Wirid Al-Waqi'ah</span>
            <div className="text-lg font-black text-emerald-800 mt-0.5">{totalWaqiah} Selesai</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-teal-700 font-semibold text-[11px]">Wirid Al-Mulk</span>
            <div className="text-lg font-black text-teal-800 mt-0.5">{totalMulk} Selesai</div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-indigo-700 font-semibold text-[11px]">Wirid Al-Insyirah</span>
            <div className="text-lg font-black text-indigo-800 mt-0.5">{totalInsyirah} Selesai</div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri, wali, catatan..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Tanggal */}
            <select
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tanggal</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{formatTanggalIndo(d)}</option>
              ))}
            </select>

            {/* Filter Kelas */}
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kelas</option>
              {uniqueClasses.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-400" />
              <div className="text-sm font-bold text-slate-700">Belum Ada Laporan Pantauan Liburan</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {records.length === 0
                  ? 'Pastikan remote program diaktifkan agar para wali santri dapat menginput amaliyah anak selama libur.'
                  : 'Tidak ada laporan yang sesuai dengan filter pencarian.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap">Tanggal & Waktu</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Santri & Kelas</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-center">Wirid Yaumiyyah (3 Surah)</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-center">Shalat 5 Waktu</th>
                    <th className="py-3 px-3.5">Catatan & Input Wali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">{formatTanggalIndo(r.tanggal)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{r.timestamp}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{r.namaSantri}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 rounded">{r.idSantri}</span>
                          {r.kelas && <span className="text-emerald-700 font-semibold">• {r.kelas}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            r.wiridWaqiah ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {r.wiridWaqiah ? '✓' : '✗'} Waqi'ah
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            r.wiridMulk ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {r.wiridMulk ? '✓' : '✗'} Mulk
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            r.wiridInsyirah ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {r.wiridInsyirah ? '✓' : '✗'} Insyirah
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        <div className="grid grid-cols-5 gap-1 text-[10px]">
                          {[
                            { waktu: 'Subuh', status: r.shalatSubuh },
                            { waktu: 'Dzuhur', status: r.shalatDzuhur },
                            { waktu: 'Ashar', status: r.shalatAshar },
                            { waktu: 'Maghrib', status: r.shalatMaghrib },
                            { waktu: 'Isya', status: r.shalatIsya },
                          ].map(s => (
                            <div
                              key={s.waktu}
                              className={`px-1.5 py-1 rounded text-center font-semibold border ${
                                s.status === 'Jama\'ah'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : s.status === 'Berhalangan'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : 'bg-rose-50 text-rose-900 border-rose-300'
                              }`}
                            >
                              <div className="text-[8px] uppercase tracking-tighter opacity-70">{s.waktu}</div>
                              <div className="text-[9px] font-bold leading-tight">{s.status}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        {r.catatanWali ? (
                          <div className="text-xs text-slate-700 italic max-w-xs leading-snug">
                            "{r.catatanWali}"
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                          Wali: {r.inputByWali || 'Wali Santri'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fitur ini bersifat <b>View-Only</b> untuk Ustadz/Admin. Penginputan hanya dapat dilakukan oleh Wali Santri.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
