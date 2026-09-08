import React, { useState, useEffect } from 'react';
import { User, Santri, PantauanLiburanRecord, ShalatJamaahStatus, SHALAT_STATUS_OPTIONS } from '../types';
import { storageService } from '../services/storageService';
import { CircleAlert as AlertCircle, Check, Trash2, SquarePen, Save, Clock, Lock } from 'lucide-react';
import { formatTanggalIndo, getTodayInputFormat } from '../utils/dateFormatter';
import type { NotifyFn } from './Snackbar';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface PantauanLiburanWaliSectionProps {
  currentUser: User;
  targetSantri: Santri;
  isActive: boolean;
  onDataChanged?: () => void;
  onNotify: NotifyFn;
}

const WAKTU_SHALAT: { key: 'shalatSubuh' | 'shalatDzuhur' | 'shalatAshar' | 'shalatMaghrib' | 'shalatIsya'; label: string }[] = [
  { key: 'shalatSubuh', label: 'Subuh' },
  { key: 'shalatDzuhur', label: 'Dzuhur' },
  { key: 'shalatAshar', label: 'Ashar' },
  { key: 'shalatMaghrib', label: 'Maghrib' },
  { key: 'shalatIsya', label: 'Isya' },
];

export const PantauanLiburanWaliSection: React.FC<PantauanLiburanWaliSectionProps> = ({
  currentUser,
  targetSantri,
  isActive,
  onDataChanged,
  onNotify
}) => {
  const todayStr = getTodayInputFormat();

  // Form State
  const [selectedTanggal, setSelectedTanggal] = useState(todayStr);
  const [wiridWaqiah, setWiridWaqiah] = useState(false);
  const [wiridMulk, setWiridMulk] = useState(false);
  const [wiridInsyirah, setWiridInsyirah] = useState(false);

  const [shalatSubuh, setShalatSubuh] = useState<ShalatJamaahStatus | ''>('');
  const [shalatDzuhur, setShalatDzuhur] = useState<ShalatJamaahStatus | ''>('');
  const [shalatAshar, setShalatAshar] = useState<ShalatJamaahStatus | ''>('');
  const [shalatMaghrib, setShalatMaghrib] = useState<ShalatJamaahStatus | ''>('');
  const [shalatIsya, setShalatIsya] = useState<ShalatJamaahStatus | ''>('');

  const [catatanWali, setCatatanWali] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PantauanLiburanRecord | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Local state of records for target santri
  const [records, setRecords] = useState<PantauanLiburanRecord[]>([]);
  const deleteDialogRef = useAccessibleDialog(Boolean(recordToDelete), () => {
    if (!isDeletingRecord) setRecordToDelete(null);
  });

  const loadRecords = () => {
    const all = storageService.getPantauanLiburanRecords();
    const filtered = all.filter(r => r.idSantri === targetSantri.idSantri);
    setRecords(filtered);
  };

  useEffect(() => {
    loadRecords();
  }, [targetSantri.idSantri]);

  // When date changes, check if there is an existing record for this date to preload
  useEffect(() => {
    const existing = records.find(r => r.tanggal === selectedTanggal);
    if (existing) {
      setWiridWaqiah(existing.wiridWaqiah);
      setWiridMulk(existing.wiridMulk);
      setWiridInsyirah(existing.wiridInsyirah);
      setShalatSubuh(existing.shalatSubuh);
      setShalatDzuhur(existing.shalatDzuhur);
      setShalatAshar(existing.shalatAshar);
      setShalatMaghrib(existing.shalatMaghrib);
      setShalatIsya(existing.shalatIsya);
      setCatatanWali(existing.catatanWali || '');
      setEditingRecordId(existing.id);
    } else {
      resetForm();
    }
  }, [selectedTanggal, records]);

  const resetForm = () => {
    setWiridWaqiah(false);
    setWiridMulk(false);
    setWiridInsyirah(false);
    setShalatSubuh('');
    setShalatDzuhur('');
    setShalatAshar('');
    setShalatMaghrib('');
    setShalatIsya('');
    setCatatanWali('');
    setValidationError(null);
    setEditingRecordId(null);
  };

  const handleEditRecord = (r: PantauanLiburanRecord) => {
    setSelectedTanggal(r.tanggal);
    setWiridWaqiah(r.wiridWaqiah);
    setWiridMulk(r.wiridMulk);
    setWiridInsyirah(r.wiridInsyirah);
    setShalatSubuh(r.shalatSubuh);
    setShalatDzuhur(r.shalatDzuhur);
    setShalatAshar(r.shalatAshar);
    setShalatMaghrib(r.shalatMaghrib);
    setShalatIsya(r.shalatIsya);
    setCatatanWali(r.catatanWali || '');
    setEditingRecordId(r.id);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeletingRecord(true);
    try {
      await storageService.deletePantauanLiburan(recordToDelete.id);
      loadRecords();
      if (editingRecordId === recordToDelete.id) resetForm();
      if (onDataChanged) onDataChanged();
      onNotify('success', 'Catatan amaliyah liburan berhasil dihapus dari Cloud.');
      setRecordToDelete(null);
    } catch (err) {
      console.error(err);
      onNotify('error', 'Catatan amaliyah gagal dihapus dari Cloud. Data tidak dinyatakan terhapus.');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shalatSubuh || !shalatDzuhur || !shalatAshar || !shalatMaghrib || !shalatIsya) {
      setValidationError('Pilih status untuk seluruh 5 waktu shalat sebelum menyimpan laporan.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await storageService.savePantauanLiburan({
        id: editingRecordId || undefined,
        tanggal: selectedTanggal,
        idSantri: targetSantri.idSantri,
        namaSantri: targetSantri.namaSantri,
        kelas: targetSantri.kelas,
        wiridWaqiah,
        wiridMulk,
        wiridInsyirah,
        shalatSubuh,
        shalatDzuhur,
        shalatAshar,
        shalatMaghrib,
        shalatIsya,
        catatanWali: catatanWali.trim(),
        inputByWali: currentUser.nama
      });

      loadRecords();
      onNotify('success', `Laporan amaliyah ${formatTanggalIndo(selectedTanggal)} berhasil disimpan ke Cloud.`);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Gagal menyimpan ke Cloud. Data belum terkonfirmasi. Periksa koneksi lalu coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isActive) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Pantauan Liburan</h3>
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            <Lock className="h-4 w-4" aria-hidden="true" /> Nonaktif
          </span>
        </div>
        <div className="border-t border-slate-200 pt-4 space-y-1">
          <p className="text-sm font-semibold text-slate-800">Pengisian laporan belum dibuka.</p>
          <p className="text-sm leading-relaxed text-slate-600">
            Wali dapat mencatat wirid dan shalat ananda setelah Ustadz/Admin mengaktifkan program
            liburan.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-6">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Pantauan Liburan</h3>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
            Aktif
          </span>
        </div>
        <p className="mt-2 break-words text-sm text-slate-600">
          Laporan harian <strong className="text-slate-900">{targetSantri.namaSantri}</strong>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Catat wirid dan status setiap waktu shalat sesuai kegiatan ananda.
        </p>
      </header>

      <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <label
              htmlFor="tanggal-pantauan"
              className="block text-sm font-semibold text-slate-800"
            >
              Tanggal amaliyah
            </label>
            <input
              id="tanggal-pantauan"
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              max={todayStr}
              className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 sm:w-auto"
            />
          </div>
          <p
            role="status"
            className={editingRecordId ? 'text-sm text-amber-800' : 'text-sm text-slate-600'}
          >
            {editingRecordId
              ? 'Mengedit laporan tanggal ini. Simpan untuk memperbarui.'
              : 'Laporan baru untuk tanggal yang dipilih.'}
          </p>
        </div>

        <fieldset className="space-y-3 border-t border-slate-200 pt-4">
          <legend className="pr-3 text-base font-semibold text-slate-900">
            1. Wirid yaumiyyah
          </legend>
          <p className="text-sm text-slate-600">Tandai surah yang sudah dibaca.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "Al-Waqi'ah",
                detail: 'Surah 56 · 96 ayat',
                checked: wiridWaqiah,
                toggle: () => setWiridWaqiah(!wiridWaqiah)
              },
              {
                label: 'Al-Mulk',
                detail: 'Surah 67 · 30 ayat',
                checked: wiridMulk,
                toggle: () => setWiridMulk(!wiridMulk)
              },
              {
                label: 'Al-Insyirah',
                detail: 'Surah 94 · 8 ayat',
                checked: wiridInsyirah,
                toggle: () => setWiridInsyirah(!wiridInsyirah)
              }
            ].map((surah) => (
              <button
                key={surah.label}
                type="button"
                aria-pressed={surah.checked}
                onClick={surah.toggle}
                className={`flex min-h-11 items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                  surah.checked
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{surah.label}</span>
                  <span className="mt-1 block text-xs text-slate-600">{surah.detail}</span>
                  <span className="mt-2 block text-sm">
                    {surah.checked ? 'Sudah dibaca' : 'Belum dibaca'}
                  </span>
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${surah.checked ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-400'}`}
                  aria-hidden="true"
                >
                  {surah.checked && <Check className="h-4 w-4" />}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset
          className="space-y-3 border-t border-slate-200 pt-4"
          aria-describedby={
            validationError ? 'shalat-status-help shalat-status-error' : 'shalat-status-help'
          }
        >
          <legend className="pr-3 text-base font-semibold text-slate-900">
            2. Shalat lima waktu
          </legend>
          <p id="shalat-status-help" className="text-sm text-slate-600">
            Wajib memilih satu status untuk setiap waktu shalat.
          </p>
          <div className="divide-y divide-slate-200">
            {WAKTU_SHALAT.map((waktu) => {
              const currentVal =
                waktu.key === 'shalatSubuh'
                  ? shalatSubuh
                  : waktu.key === 'shalatDzuhur'
                    ? shalatDzuhur
                    : waktu.key === 'shalatAshar'
                      ? shalatAshar
                      : waktu.key === 'shalatMaghrib'
                        ? shalatMaghrib
                        : shalatIsya;

              const setVal = (status: ShalatJamaahStatus) => {
                if (waktu.key === 'shalatSubuh') setShalatSubuh(status);
                else if (waktu.key === 'shalatDzuhur') setShalatDzuhur(status);
                else if (waktu.key === 'shalatAshar') setShalatAshar(status);
                else if (waktu.key === 'shalatMaghrib') setShalatMaghrib(status);
                else setShalatIsya(status);
                setValidationError(null);
              };

              return (
                <div
                  key={waktu.key}
                  role="group"
                  aria-labelledby={`${waktu.key}-label`}
                  aria-describedby={
                    validationError && !currentVal ? 'shalat-status-error' : undefined
                  }
                  className="space-y-3 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:block sm:min-w-28">
                    <span
                      id={`${waktu.key}-label`}
                      className="text-sm font-semibold text-slate-900"
                    >
                      {waktu.label}
                    </span>
                    <span
                      className={`text-xs sm:mt-1 sm:block ${!currentVal && validationError ? 'text-rose-700' : 'text-slate-600'}`}
                    >
                      {currentVal || 'Belum dipilih'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2 sm:w-full sm:max-w-md">
                    {SHALAT_STATUS_OPTIONS.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          aria-pressed={isSelected}
                          onClick={() => setVal(opt.value)}
                          className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                            isSelected
                              ? opt.value === "Jama'ah"
                                ? 'border-emerald-700 bg-emerald-700 text-white'
                                : opt.value === 'Berhalangan'
                                  ? 'border-amber-700 bg-amber-100 text-amber-900'
                                  : 'border-rose-700 bg-rose-100 text-rose-900'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {validationError && (
            <div
              id="shalat-status-error"
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}
        </fieldset>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <label
            htmlFor="catatan-wali-input"
            className="block text-base font-semibold text-slate-900"
          >
            3. Catatan Wali <span className="text-sm font-normal text-slate-600">(opsional)</span>
          </label>
          <textarea
            id="catatan-wali-input"
            rows={3}
            value={catatanWali}
            onChange={(e) => setCatatanWali(e.target.value)}
            placeholder="Keterangan tambahan tentang kegiatan atau kondisi ananda."
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-base leading-relaxed text-slate-900"
          />
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm text-slate-600">
            {isSubmitting
              ? 'Menyimpan ke Cloud. Tunggu konfirmasi.'
              : 'Penyimpanan berhasil setelah ada konfirmasi Cloud.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {editingRecordId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Batal edit
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingRecordId
                    ? 'Perbarui laporan'
                    : 'Simpan laporan'}
              </span>
            </button>
          </div>
        </div>
      </form>

      <section
        className="space-y-4 border-t border-slate-200 pt-6"
        aria-labelledby="pantauan-history-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4
            id="pantauan-history-title"
            className="flex items-center gap-2 text-base font-semibold text-slate-900"
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            Riwayat laporan
          </h4>
          <span className="text-sm text-slate-600">{records.length} laporan</span>
        </div>
        {records.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            Belum ada laporan liburan. Isi kegiatan ananda pada form di atas, lalu simpan.
          </p>
        ) : (
          <div className="space-y-4">
            {records.map((rec) => {
              const wiridCount = [rec.wiridWaqiah, rec.wiridMulk, rec.wiridInsyirah].filter(
                Boolean
              ).length;
              const jamaahCount = [
                rec.shalatSubuh,
                rec.shalatDzuhur,
                rec.shalatAshar,
                rec.shalatMaghrib,
                rec.shalatIsya
              ].filter((s) => s === "Jama'ah").length;
              return (
                <article key={rec.id} className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">
                        {formatTanggalIndo(rec.tanggal)}
                      </h5>
                      <p className="mt-1 text-sm text-slate-600">
                        {wiridCount}/3 wirid dibaca · {jamaahCount}/5 shalat Jama'ah
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRecord(rec)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                        title="Edit laporan ini"
                      >
                        <SquarePen className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        onClick={() => setRecordToDelete(rec)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        title="Hapus laporan ini"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h6 className="mb-2 text-sm font-semibold text-slate-800">Wirid</h6>
                      <dl className="space-y-2 text-sm">
                        {[
                          { label: "Al-Waqi'ah", done: rec.wiridWaqiah },
                          { label: 'Al-Mulk', done: rec.wiridMulk },
                          { label: 'Al-Insyirah', done: rec.wiridInsyirah }
                        ].map((s) => (
                          <div key={s.label} className="flex flex-wrap justify-between gap-2">
                            <dt className="text-slate-600">{s.label}</dt>
                            <dd
                              className={s.done ? 'font-medium text-emerald-800' : 'text-slate-600'}
                            >
                              {s.done ? 'Sudah dibaca' : 'Belum dibaca'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <h6 className="mb-2 text-sm font-semibold text-slate-800">Shalat</h6>
                      <dl className="space-y-2 text-sm">
                        {WAKTU_SHALAT.map((waktu) => (
                          <div key={waktu.key} className="flex flex-wrap justify-between gap-2">
                            <dt className="text-slate-600">{waktu.label}</dt>
                            <dd
                              className={
                                rec[waktu.key] === "Jama'ah"
                                  ? 'font-medium text-emerald-800'
                                  : rec[waktu.key] === 'Berhalangan'
                                    ? 'font-medium text-amber-800'
                                    : 'font-medium text-rose-800'
                              }
                            >
                              {rec[waktu.key]}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                  {rec.catatanWali && (
                    <p className="whitespace-pre-wrap break-words border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-700">
                      <span className="font-semibold">Catatan: </span>
                      {rec.catatanWali}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {recordToDelete && (
        <div className="ui-dialog-overlay">
          <div
            ref={deleteDialogRef}
            className="ui-dialog-panel max-w-sm p-5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pantauan-delete-title"
            aria-describedby="pantauan-delete-description"
            aria-busy={isDeletingRecord}
            tabIndex={-1}
          >
            <div>
              <h4 id="pantauan-delete-title" className="text-base font-semibold text-slate-900">
                Hapus catatan amaliyah?
              </h4>
              <p
                id="pantauan-delete-description"
                className="mt-2 text-sm leading-relaxed text-slate-600"
              >
                Catatan tanggal {formatTanggalIndo(recordToDelete.tanggal)} akan dihapus dari Cloud
                dan tidak dapat dipulihkan dari halaman ini.
              </p>
            </div>
            <div className="ui-dialog-footer">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeletingRecord}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                disabled={isDeletingRecord}
                className="min-h-11 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
              >
                {isDeletingRecord ? 'Menghapus...' : 'Hapus dari Cloud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
