import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, FileText, Search, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import type { AppConfig, PantauanLiburanRecord, Santri, ShalatJamaahStatus, User } from '../types';
import { storageService } from '../services/storageService';
import { formatTanggalIndo } from '../utils/dateFormatter';
import type { NotifyFn } from './Snackbar';
import { PantauanLiburanWaliSection } from './PantauanLiburanWaliSection';

interface PantauanLiburanPageProps {
  currentUser: User;
  santriList: Santri[];
  onNotify: NotifyFn;
  onDataChanged?: () => void;
  mode: 'monitor' | 'wali';
}

const prayerRows = [
  { key: 'shalatSubuh', label: 'Subuh' },
  { key: 'shalatDzuhur', label: 'Dzuhur' },
  { key: 'shalatAshar', label: 'Ashar' },
  { key: 'shalatMaghrib', label: 'Maghrib' },
  { key: 'shalatIsya', label: 'Isya' }
] as const;

const statusLabel = (status: ShalatJamaahStatus) =>
  status === 'Berhalangan' ? 'Halangan' : status;

const statusTone = (status: ShalatJamaahStatus) => {
  if (status === "Jama'ah") return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'Berhalangan') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'Sakit') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-slate-300 bg-slate-100 text-slate-900';
};

export const PantauanLiburanPage: React.FC<PantauanLiburanPageProps> = ({
  currentUser,
  santriList,
  onNotify,
  onDataChanged,
  mode
}) => {
  const [records, setRecords] = useState<PantauanLiburanRecord[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>({ programLiburanActive: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [selectedTanggal, setSelectedTanggal] = useState('all');
  const [isToggling, setIsToggling] = useState(false);

  const loadData = () => {
    setRecords(storageService.getPantauanLiburanRecords());
    setAppConfig(storageService.getAppConfig());
  };

  useEffect(() => {
    loadData();
  }, []);

  const targetSantri = useMemo(
    () => santriList.find((santri) => santri.idSantri === currentUser.idSantri),
    [santriList, currentUser.idSantri]
  );

  if (mode === 'wali') {
    return (
      <div className="w-full min-w-0 space-y-4 sm:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Halaman khusus</p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">Pantauan Liburan</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100">
                Catat wirid yaumiyyah dan kondisi shalat lima waktu ananda dalam satu halaman yang fokus.
              </p>
            </div>
          </div>
        </section>

        {targetSantri ? (
          <PantauanLiburanWaliSection
            currentUser={currentUser}
            targetSantri={targetSantri}
            isActive={appConfig.programLiburanActive}
            onDataChanged={() => {
              loadData();
              onDataChanged?.();
            }}
            onNotify={onNotify}
          />
        ) : (
          <section className="ui-bento-card p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Profil santri belum terhubung</h2>
            <p className="mt-2 text-sm text-slate-600">
              Akun wali ini belum memiliki relasi santri yang dapat digunakan untuk mengisi Pantauan Liburan.
            </p>
          </section>
        )}
      </div>
    );
  }

  const uniqueClasses = Array.from(new Set(santriList.map((s) => s.kelas).filter(Boolean))).sort();
  const uniqueDates = Array.from(new Set(records.map((r) => r.tanggal).filter(Boolean))).sort((a, b) => b.localeCompare(a));

  const filteredRecords = records.filter((record) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      record.namaSantri.toLowerCase().includes(query) ||
      record.idSantri.toLowerCase().includes(query) ||
      record.catatanWali?.toLowerCase().includes(query) ||
      record.inputByWali?.toLowerCase().includes(query);

    return (
      matchesSearch &&
      (selectedKelas === 'all' || record.kelas === selectedKelas) &&
      (selectedTanggal === 'all' || record.tanggal === selectedTanggal)
    );
  });

  const prayerStatuses = records.flatMap((record) =>
    prayerRows.map(({ key }) => record[key])
  );

  const statusCounts = {
    jamaah: prayerStatuses.filter((status) => status === "Jama'ah").length,
    sakit: prayerStatuses.filter((status) => status === 'Sakit').length,
    halangan: prayerStatuses.filter((status) => status === 'Berhalangan').length,
    tanpaAlasan: prayerStatuses.filter((status) => status === 'Tanpa Alasan').length
  };

  const handleToggleProgram = async () => {
    setIsToggling(true);
    const nextStatus = !appConfig.programLiburanActive;
    try {
      const updated = await storageService.setProgramLiburanActive(nextStatus, currentUser.nama || 'Ustadz / Admin');
      setAppConfig(updated);
      onNotify(
        'success',
        nextStatus
          ? 'Program Pantauan Liburan aktif dan tersimpan di Cloud.'
          : 'Program Pantauan Liburan dinonaktifkan dan tersimpan di Cloud.'
      );
      onDataChanged?.();
    } catch (error) {
      console.error(error);
      onNotify('error', 'Status Program Pantauan Liburan gagal diperbarui di Cloud.');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Monitoring santri</p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">Pantauan Liburan</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100">
                Rekap amaliyah santri, status shalat, dan catatan Wali dalam halaman khusus tanpa modal mengambang.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={appConfig.programLiburanActive}
            aria-busy={isToggling}
            onClick={handleToggleProgram}
            disabled={isToggling}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
          >
            {appConfig.programLiburanActive ? (
              <ToggleRight className="h-6 w-6 text-emerald-200" aria-hidden="true" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-slate-200" aria-hidden="true" />
            )}
            {isToggling
              ? 'Menyimpan...'
              : appConfig.programLiburanActive
                ? 'Program aktif'
                : 'Program nonaktif'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="ui-bento-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Laporan masuk</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{records.length}</p>
          <p className="mt-1 text-xs text-slate-500">Catatan harian tersimpan</p>
        </article>
        <article className="ui-bento-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Jama'ah</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{statusCounts.jamaah}</p>
          <p className="mt-1 text-xs text-slate-500">Total waktu shalat</p>
        </article>
        <article className="ui-bento-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Sakit / Halangan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{statusCounts.sakit + statusCounts.halangan}</p>
          <p className="mt-1 text-xs text-slate-500">{statusCounts.sakit} sakit · {statusCounts.halangan} halangan</p>
        </article>
        <article className="ui-bento-card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Tanpa Alasan</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{statusCounts.tanpaAlasan}</p>
          <p className="mt-1 text-xs text-slate-500">Perlu tindak lanjut</p>
        </article>
      </section>

      <section className="ui-bento-card p-4 sm:p-5">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="min-w-0 sm:col-span-2 lg:col-span-1">
            <span className="mb-2 block text-sm font-semibold text-slate-800">Cari laporan</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nama, ID, wali, atau catatan"
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-base text-slate-900"
              />
            </span>
          </label>

          <label className="min-w-0">
            <span className="mb-2 block text-sm font-semibold text-slate-800">Tanggal</span>
            <select
              value={selectedTanggal}
              onChange={(event) => setSelectedTanggal(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
            >
              <option value="all">Semua tanggal</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>{formatTanggalIndo(date)}</option>
              ))}
            </select>
          </label>

          <label className="min-w-0">
            <span className="mb-2 block text-sm font-semibold text-slate-800">Kelas</span>
            <select
              value={selectedKelas}
              onChange={(event) => setSelectedKelas(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
            >
              <option value="all">Semua kelas</option>
              {uniqueClasses.map((kelas) => (
                <option key={kelas} value={kelas}>{kelas}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="pantauan-results-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Riwayat pantauan</p>
            <h2 id="pantauan-results-title" className="text-base font-bold text-slate-900">
              {filteredRecords.length} dari {records.length} laporan
            </h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
            appConfig.programLiburanActive
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-slate-100 text-slate-700'
          }`}>
            {appConfig.programLiburanActive ? 'Pengisian dibuka' : 'Pengisian ditutup'}
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="ui-bento-card p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-base font-bold text-slate-800">
              {records.length === 0 ? 'Belum ada laporan liburan' : 'Tidak ada laporan yang cocok'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {records.length === 0
                ? 'Laporan akan muncul setelah Wali menyimpan amaliyah harian.'
                : 'Ubah pencarian, tanggal, atau kelas untuk menampilkan data lain.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <article key={record.id} className="ui-bento-card overflow-hidden">
                <header className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-bold text-slate-900">{record.namaSantri}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {record.idSantri}{record.kelas ? ` · ${record.kelas}` : ''}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm font-semibold text-slate-800">{formatTanggalIndo(record.tanggal)}</p>
                    <p className="mt-1 text-xs text-slate-500">Dicatat oleh {record.inputByWali || 'Wali'}</p>
                  </div>
                </header>

                <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Wirid yaumiyyah</h4>
                    <div className="mt-3 grid gap-2">
                      {[
                        { label: "Al-Waqi'ah", done: record.wiridWaqiah },
                        { label: 'Al-Mulk', done: record.wiridMulk },
                        { label: 'Al-Insyirah', done: record.wiridInsyirah }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="text-slate-700">{item.label}</span>
                          <span className={item.done ? 'font-semibold text-emerald-800' : 'text-slate-500'}>
                            {item.done ? 'Sudah dibaca' : 'Belum dibaca'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Shalat lima waktu</h4>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      {prayerRows.map(({ key, label }) => {
                        const status = record[key];
                        return (
                          <div key={key} className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold text-slate-500">{label}</p>
                            <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone(status)}`}>
                              {statusLabel(status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {record.catatanWali && (
                  <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700 sm:px-5">
                    <span className="font-semibold text-slate-900">Catatan Wali: </span>
                    <span className="whitespace-pre-wrap break-words">{record.catatanWali}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
