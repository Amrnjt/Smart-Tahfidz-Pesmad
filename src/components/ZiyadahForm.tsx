import React, { useState, useMemo } from 'react';
import { User, Santri, PredikatNilai, PREDIKAT_NILAI_OPTIONS, Kelas } from '../types';
import { SURAH_LIST } from '../data/quranSurahs';
import { storageService } from '../services/storageService';
import { CirclePlus as PlusCircle, BookOpen, Save, RotateCcw, Calendar, Clock } from 'lucide-react';
import { getTodayInputFormat, getCurrentTimeInputFormat, formatTanggalLengkap } from '../utils/dateFormatter';
import type { NotifyFn } from './Snackbar';

interface ZiyadahFormProps {
  currentUser: User;
  santriList: Santri[];
  kelasList: Kelas[];
  selectedSantriId?: string;
  onSuccess: () => void;
  onNotify: NotifyFn;
}

export const ZiyadahForm: React.FC<ZiyadahFormProps> = ({
  currentUser,
  santriList,
  kelasList,
  selectedSantriId,
  onSuccess,
  onNotify
}) => {
  const myKelas = useMemo(() => kelasList.find(k => k.musyrifId === currentUser.id), [kelasList, currentUser.id]);
  const mySantriList = useMemo(() => {
    if (!myKelas || !myKelas.santriIds || myKelas.santriIds.length === 0) return santriList;
    return santriList.filter(s => myKelas.santriIds.includes(s.idSantri));
  }, [santriList, myKelas]);

  const [idSantri, setIdSantri] = useState(selectedSantriId || (mySantriList[0]?.idSantri || ''));
  const [tanggalSetor, setTanggalSetor] = useState(getTodayInputFormat());
  const [waktuSetor, setWaktuSetor] = useState(getCurrentTimeInputFormat());
  const [surahName, setSurahName] = useState(SURAH_LIST[77].nameLatin); // default An-Naba
  const [ayatAwal, setAyatAwal] = useState<number>(1);
  const [ayatAkhir, setAyatAkhir] = useState<number>(10);
  const [nilai, setNilai] = useState<PredikatNilai>('Sangat Baik');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSurah = SURAH_LIST.find(s => s.nameLatin === surahName) || SURAH_LIST[0];

  const handleSurahChange = (name: string) => {
    setSurahName(name);
    const surah = SURAH_LIST.find(s => s.nameLatin === name);
    if (surah) {
      setAyatAwal(1);
      setAyatAkhir(Math.min(10, surah.numberOfAyahs));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri || !surahName) return;

    setIsSubmitting(true);
    try {
      const customTimestamp = `${tanggalSetor} ${waktuSetor || '00:00'}`;
      await storageService.saveZiyadah({
        idSantri,
        timestamp: customTimestamp,
        surah: surahName,
        surahNumber: selectedSurah.number,
        ayatAwal: Number(ayatAwal),
        ayatAkhir: Number(ayatAkhir),
        nilai,
        catatan: catatan.trim() || 'Lancar, tajwid dan makhraj baik.',
        inputBy: currentUser.nama
      });

      setIsSubmitting(false);
      onNotify('success', 'Ziyadah berhasil disimpan ke Cloud.');
      onSuccess();
    } catch (err) {
      console.error('Error saving ziyadah:', err);
      onNotify('error', 'Ziyadah belum tersimpan ke Cloud. Periksa koneksi lalu coba simpan lagi.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSurahName(SURAH_LIST[77].nameLatin);
    setAyatAwal(1);
    setAyatAkhir(10);
    setNilai('Sangat Baik');
    setCatatan('');
    setTanggalSetor(getTodayInputFormat());
    setWaktuSetor(getCurrentTimeInputFormat());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-6">
        {/* Form Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="ui-section-title text-slate-900">
              Setoran Ziyadah
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Hafalan baru (bil-ghoib) dengan catatan materi dan kualitas setoran.
            </p>
          </div>
        </div>


        {mySantriList.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700">Belum Ada Data Santri</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Silakan daftarkan data santri terlebih dahulu di menu <b>Kelola Santri & Akun</b> sebelum menginput setoran Ziyadah.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>
          {/* Santri & Tanggal Setoran */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Identitas & waktu</h4>
            <p className="text-xs text-slate-500">Pilih santri serta waktu setoran yang benar.</p>
          </div>
          <div className="ui-form-identity">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Pilih Santri <span className="text-rose-500">*</span>
              </label>
              <select
                required
                aria-label="Pilih Santri"
                value={idSantri}
                onChange={(e) => setIdSantri(e.target.value)}
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Nama Santri --</option>
                {mySantriList.map((s) => (
                  <option key={s.idSantri} value={s.idSantri}>
                    {s.namaSantri} ({s.kelas})
                  </option>
                ))}
              </select>
              {myKelas && (
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Kelas: {myKelas.namaKelas} • {mySantriList.length} santri
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tanggal Setoran <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                aria-label="Tanggal Setoran"
                value={tanggalSetor}
                onChange={(e) => setTanggalSetor(e.target.value)}
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-700 font-semibold mt-1 block truncate">
                {formatTanggalLengkap(tanggalSetor)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Waktu / Jam <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="time"
                required
                aria-label="Waktu Setoran"
                value={waktuSetor}
                onChange={(e) => setWaktuSetor(e.target.value)}
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-500 mt-1 block">WIB (Waktu Indonesia Barat)</span>
            </div>
          </div>

          {/* Surah Selector */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Materi setoran</h4>
            <p className="text-xs text-slate-500">Tentukan surah dan rentang ayat yang disetorkan.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Pilih Surah (1 - 114) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              aria-label="Pilih Surah"
                value={surahName}
              onChange={(e) => handleSurahChange(e.target.value)}
              className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SURAH_LIST.map((s) => (
                <option key={s.number} value={s.nameLatin}>
                  {s.number}. {s.nameLatin} ({s.nameArabic}) - {s.numberOfAyahs} Ayat
                </option>
              ))}
            </select>
          </div>

          {/* Surah Info Card */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>
                Surah <b>{selectedSurah.nameLatin}</b> ({selectedSurah.nameArabic}) • {selectedSurah.revelationType}
              </span>
            </div>
            <span className="font-bold text-emerald-800">Maks. {selectedSurah.numberOfAyahs} Ayat</span>
          </div>

          {/* Ayat Awal, Ayat Akhir, Nilai */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Ayat Awal <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedSurah.numberOfAyahs}
                required
                aria-label="Ayat Awal"
                value={ayatAwal}
                onChange={(e) => setAyatAwal(Number(e.target.value))}
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Ayat Akhir <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={ayatAwal}
                max={selectedSurah.numberOfAyahs}
                required
                aria-label="Ayat Akhir"
                value={ayatAkhir}
                onChange={(e) => setAyatAkhir(Number(e.target.value))}
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Kualitas Hafalan <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Kualitas Hafalan"
                value={nilai}
                onChange={(e) => setNilai(e.target.value as PredikatNilai)}
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PREDIKAT_NILAI_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catatan / Evaluasi Ustadz */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Catatan Tajwid / Evaluasi Ustadz
            </label>
            <textarea
              rows={3}
              aria-label="Catatan Tajwid atau Evaluasi Ustadz"
                value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Makhraj huruf 'Ain dan Ghain sudah tepat, tajwid ghunnah 2 harakat konsisten..."
              className="w-full min-h-28 py-3 px-3.5 bg-white border border-slate-300 rounded-xl text-sm leading-6 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="ui-control w-full sm:w-auto px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-11 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

