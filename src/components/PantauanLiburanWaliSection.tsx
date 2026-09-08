import React, { useState, useEffect } from 'react';
import { User, Santri, PantauanLiburanRecord, ShalatJamaahStatus, SHALAT_STATUS_OPTIONS } from '../types';
import { storageService } from '../services/storageService';
import { Sparkles, Calendar, BookOpen, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Check, Trash2, Edit3, Save, RotateCcw, Clock, Lock } from 'lucide-react';
import { formatTanggalIndo, getTodayInputFormat } from '../utils/dateFormatter';
import type { NotifyFn } from './Snackbar';

interface PantauanLiburanWaliSectionProps {
  currentUser: User;
  targetSantri: Santri;
  isActive: boolean;
  onDataChanged?: () => void;
  onNotify: NotifyFn;
}

const WAKTU_SHALAT: { key: 'shalatSubuh' | 'shalatDzuhur' | 'shalatAshar' | 'shalatMaghrib' | 'shalatIsya'; label: string; icon: string }[] = [
  { key: 'shalatSubuh', label: 'Subuh', icon: '🌅' },
  { key: 'shalatDzuhur', label: 'Dzuhur', icon: '☀️' },
  { key: 'shalatAshar', label: 'Ashar', icon: '🌤️' },
  { key: 'shalatMaghrib', label: 'Maghrib', icon: '🌇' },
  { key: 'shalatIsya', label: 'Isya', icon: '🌌' },
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

  // 1. If Program Liburan is OFF
  if (!isActive) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Program Pantauan Liburan Santri
              </h3>
              <p className="text-xs text-slate-500">
                Mutaba'ah wirid yaumiyyah & keaktifan shalat jama'ah di rumah
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
            ⚪ Saat Ini Nonaktif
          </span>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-700">
            Fitur Pantauan Liburan Sedang Ditutup oleh Ustadz/Admin
          </p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            Form mutaba'ah liburan (Wirid Al-Waqi'ah, Al-Mulk, Al-Insyirah & Shalat 5 Waktu Berjama'ah) hanya dibuka ketika masa liburan pesantren/madrasah telah diaktifkan oleh pihak Ustadz. Saat ini seluruh aktivitas santri terpantau melalui setoran reguler di madrasah.
          </p>
        </div>
      </div>
    );
  }

  // 2. If Program Liburan is ON
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-200 shadow-sm space-y-6">

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Program Pantauan Liburan Santri
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 animate-pulse">
                🟢 Aktif
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Mutaba'ah Yaumiyyah Ananda <b>{targetSantri.namaSantri}</b>: Wirid 3 Surah & Shalat 5 Waktu Berjama'ah
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Input Khusus Wali Santri
          </span>
        </div>
      </div>

      {/* Form Input Amaliyah */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <label htmlFor="tanggal-pantauan" className="text-xs font-bold text-slate-800">
              Pilih Tanggal Amaliyah:
            </label>
            <input
              id="tanggal-pantauan"
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              max={todayStr}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {editingRecordId && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                Mode Edit Laporan Tanggal {selectedTanggal}
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-slate-500 hover:text-slate-700 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
              >
                Batal Edit
              </button>
            </div>
          )}
        </div>

        {/* Section 1: Wirid Yaumiyyah (3 Surah) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              1. Bacaan Wirid Yaumiyyah (3 Surah Pilihan)
            </h4>
            <span className="text-[11px] text-slate-500">Centang surah yang telah dibaca ananda</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Surah Al-Waqi'ah */}
            <button
              type="button"
              onClick={() => setWiridWaqiah(!wiridWaqiah)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                wiridWaqiah
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>Surah Al-Waqi'ah</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${wiridWaqiah ? 'text-emerald-100' : 'text-slate-500'}`}>
                  (Surah ke-56 • 96 Ayat)
                </div>
                <div className={`text-[10px] mt-1 font-semibold ${wiridWaqiah ? 'text-emerald-200' : 'text-emerald-700'}`}>
                  {wiridWaqiah ? '✓ Sudah Dibaca' : '○ Belum Dibaca'}
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                wiridWaqiah ? 'bg-white text-emerald-800 border-white' : 'border-slate-300 bg-slate-50'
              }`}>
                {wiridWaqiah && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>

            {/* Surah Al-Mulk */}
            <button
              type="button"
              onClick={() => setWiridMulk(!wiridMulk)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                wiridMulk
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>Surah Al-Mulk</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${wiridMulk ? 'text-emerald-100' : 'text-slate-500'}`}>
                  (Surah ke-67 • 30 Ayat)
                </div>
                <div className={`text-[10px] mt-1 font-semibold ${wiridMulk ? 'text-emerald-200' : 'text-emerald-700'}`}>
                  {wiridMulk ? '✓ Sudah Dibaca' : '○ Belum Dibaca'}
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                wiridMulk ? 'bg-white text-emerald-800 border-white' : 'border-slate-300 bg-slate-50'
              }`}>
                {wiridMulk && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>

            {/* Surah Al-Insyirah */}
            <button
              type="button"
              onClick={() => setWiridInsyirah(!wiridInsyirah)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                wiridInsyirah
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="text-xs font-extrabold flex items-center gap-1.5">
                  <span>Surah Al-Insyirah</span>
                </div>
                <div className={`text-[11px] mt-0.5 ${wiridInsyirah ? 'text-emerald-100' : 'text-slate-500'}`}>
                  (Surah ke-94 • 8 Ayat)
                </div>
                <div className={`text-[10px] mt-1 font-semibold ${wiridInsyirah ? 'text-emerald-200' : 'text-emerald-700'}`}>
                  {wiridInsyirah ? '✓ Sudah Dibaca' : '○ Belum Dibaca'}
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                wiridInsyirah ? 'bg-white text-emerald-800 border-white' : 'border-slate-300 bg-slate-50'
              }`}>
                {wiridInsyirah && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Keaktifan Shalat 5 Waktu Berjama'ah */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              2. Keaktifan Shalat 5 Waktu Berjama'ah
            </h4>
            <span className="text-[11px] text-slate-500">Pilih satu status untuk setiap waktu shalat</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {WAKTU_SHALAT.map((waktu) => {
              const currentVal =
                waktu.key === 'shalatSubuh' ? shalatSubuh
                : waktu.key === 'shalatDzuhur' ? shalatDzuhur
                : waktu.key === 'shalatAshar' ? shalatAshar
                : waktu.key === 'shalatMaghrib' ? shalatMaghrib
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
                <div key={waktu.key} className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>{waktu.icon}</span>
                      <span>{waktu.label}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      !currentVal ? 'bg-slate-100 text-slate-600'
                      : currentVal === 'Jama\'ah' ? 'bg-emerald-100 text-emerald-800'
                      : currentVal === 'Berhalangan' ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentVal || 'Belum dipilih'}
                    </span>
                  </div>

                  {/* 3 Status Options: Jama'ah | Berhalangan | Sakit */}
                  <div className="grid grid-cols-3 gap-1">
                    {SHALAT_STATUS_OPTIONS.map((opt) => {
                      const isSelected = currentVal === opt.value;
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          aria-pressed={isSelected}
                          onClick={() => setVal(opt.value)}
                          className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                            isSelected
                              ? opt.value === 'Jama\'ah'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : opt.value === 'Berhalangan'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{opt.emoji}</span>
                          <span className="mt-0.5 leading-none">{opt.label}</span>
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
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Section 3: Catatan Wali Santri */}
        <div className="space-y-1.5 pt-1">
          <label htmlFor="catatan-wali-input" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            3. Catatan Wali Santri (Opsional)
          </label>
          <input
            id="catatan-wali-input"
            type="text"
            value={catatanWali}
            onChange={(e) => setCatatanWali(e.target.value)}
            placeholder="Contoh: Ananda rajin muroja'ah ba'da Maghrib & shalat tepat waktu di masjid kampung..."
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {editingRecordId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : editingRecordId ? 'Perbarui Laporan' : 'Simpan Laporan'}</span>
          </button>
        </div>
      </form>

      {/* Riwayat Mutaba'ah Liburan Santri */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            Riwayat Mutaba'ah Liburan Ananda ({records.length} Hari Dicatat)
          </h4>
          <span className="text-[11px] text-slate-500">Riwayat laporan tersimpan</span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            Belum ada laporan liburan yang dicatat. Silakan simpan amaliyah ananda pada form di atas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.map((rec) => {
              const wiridCount = [rec.wiridWaqiah, rec.wiridMulk, rec.wiridInsyirah].filter(Boolean).length;
              const jamaahCount = [rec.shalatSubuh, rec.shalatDzuhur, rec.shalatAshar, rec.shalatMaghrib, rec.shalatIsya].filter(s => s === 'Jama\'ah').length;

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        📅 {formatTanggalIndo(rec.tanggal)}
                      </span>
                      <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {wiridCount}/3 Wirid Selesai
                      </span>
                      <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                        {jamaahCount}/5 Shalat Jama'ah
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleEditRecord(rec)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Edit laporan ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setRecordToDelete(rec)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Hapus laporan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Wirid Badges */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-slate-500 font-medium">Wirid:</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                      rec.wiridWaqiah ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {rec.wiridWaqiah ? '✓' : '✗'} Al-Waqi'ah
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                      rec.wiridMulk ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {rec.wiridMulk ? '✓' : '✗'} Al-Mulk
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                      rec.wiridInsyirah ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {rec.wiridInsyirah ? '✓' : '✗'} Al-Insyirah
                    </span>
                  </div>

                  {/* Shalat Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-500 font-medium">Shalat:</span>
                    {[
                      { waktu: 'Subuh', status: rec.shalatSubuh },
                      { waktu: 'Dzuhur', status: rec.shalatDzuhur },
                      { waktu: 'Ashar', status: rec.shalatAshar },
                      { waktu: 'Maghrib', status: rec.shalatMaghrib },
                      { waktu: 'Isya', status: rec.shalatIsya },
                    ].map(s => (
                      <span
                        key={s.waktu}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          s.status === 'Jama\'ah'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : s.status === 'Berhalangan'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-rose-50 text-rose-900 border-rose-300'
                        }`}
                      >
                        {s.waktu}: {s.status}
                      </span>
                    ))}
                  </div>

                  {/* Catatan */}
                  {rec.catatanWali && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 italic">
                      "{rec.catatanWali}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pantauan-delete-title"
          >
            <div>
              <h4 id="pantauan-delete-title" className="text-sm font-extrabold text-slate-900">Hapus catatan amaliyah?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Catatan tanggal {formatTanggalIndo(recordToDelete.tanggal)} akan dihapus dari Cloud dan tidak dapat dipulihkan dari halaman ini.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeletingRecord}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteRecord}
                disabled={isDeletingRecord}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isDeletingRecord ? 'Menghapus...' : 'Hapus dari Cloud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
