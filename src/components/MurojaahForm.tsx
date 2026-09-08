import React, { useState, useMemo } from 'react';
import { User, Santri, PredikatNilai, PREDIKAT_NILAI_OPTIONS, Kelas } from '../types';
import { SURAH_LIST } from '../data/quranSurahs';
import { storageService } from '../services/storageService';
import { RotateCw, Save, RotateCcw, Calendar, Clock, BookOpen } from 'lucide-react';
import { getTodayInputFormat, getCurrentTimeInputFormat, formatTanggalLengkap } from '../utils/dateFormatter';
import type { NotifyFn } from './Snackbar';

interface MurojaahFormProps {
  currentUser: User;
  santriList: Santri[];
  kelasList: Kelas[];
  selectedSantriId?: string;
  onSuccess: () => void;
  onNotify: NotifyFn;
}

export const MurojaahForm: React.FC<MurojaahFormProps> = ({
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
  const [ayatAkhir, setAyatAkhir] = useState<number>(20);
  const [nilai, setNilai] = useState<PredikatNilai>('Sangat Baik');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSurah = SURAH_LIST.find(s => s.nameLatin === surahName) || SURAH_LIST[0];

  const handleSurahChange = (name: string) => {
    setSurahName(name);
    const surah = SURAH_LIST.find(s => s.nameLatin === name);
    if (surah) {
      setAyatAwal(1);
      setAyatAkhir(Math.min(20, surah.numberOfAyahs));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri || !surahName) return;

    setIsSubmitting(true);
    try {
      const customTimestamp = `${tanggalSetor} ${waktuSetor || '00:00'}`;
      const surahAtauJuz = `${surahName} (Ayat ${ayatAwal} - ${ayatAkhir})`;
      await storageService.saveMurojaah({
        idSantri,
        timestamp: customTimestamp,
        surahAtauJuz,
        nilai,
        catatan: catatan.trim() || 'Murojaah tertib dan mutqin.',
        inputBy: currentUser.nama
      });

      setIsSubmitting(false);
      onNotify('success', "Muroja'ah berhasil disimpan ke Cloud.");
      onSuccess();
    } catch (err) {
      console.error('Error saving murojaah:', err);
      onNotify('error', "Muroja'ah belum tersimpan ke Cloud. Periksa koneksi lalu coba simpan lagi.");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSurahName(SURAH_LIST[77].nameLatin);
    setAyatAwal(1);
    setAyatAkhir(20);
    setNilai('Sangat Baik');
    setCatatan('');
    setTanggalSetor(getTodayInputFormat());
    setWaktuSetor(getCurrentTimeInputFormat());
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        {/* Form Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Setoran Muroja'ah
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Pengulangan hafalan dengan pencatatan materi dan kualitas kelancaran.
            </p>
          </div>
        </div>


        {mySantriList.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
            <RotateCw className="w-8 h-8 mx-auto text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700">Belum Ada Data Santri</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Silakan daftarkan data santri terlebih dahulu di menu <b>Kelola Santri & Akun</b> sebelum menginput setoran Muroja'ah.
            </p>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Santri & Tanggal Setoran */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pilih Santri <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={idSantri}
                onChange={(e) => setIdSantri(e.target.value)}
                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Pilih Nama Santri --</option>
                {mySantriList.map((s) => (
                  <option key={s.idSantri} value={s.idSantri}>
                    {s.namaSantri} ({s.kelas})
                  </option>
                ))}
              </select>
              {myKelas && (
                <p className="text-[11px] text-teal-700 font-semibold mt-1">
                  Kelas: {myKelas.namaKelas} • {mySantriList.length} santri
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>Tanggal Setoran <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                required
                value={tanggalSetor}
                onChange={(e) => setTanggalSetor(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[11px] text-teal-700 font-semibold mt-1 block truncate">
                {formatTanggalLengkap(tanggalSetor)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                <span>Waktu / Jam <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="time"
                required
                value={waktuSetor}
                onChange={(e) => setWaktuSetor(e.target.value)}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">WIB (Waktu Indonesia Barat)</span>
            </div>
          </div>

          {/* Surah Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Pilih Surah (1 - 114) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={surahName}
              onChange={(e) => handleSurahChange(e.target.value)}
              className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {SURAH_LIST.map((s) => (
                <option key={s.number} value={s.nameLatin}>
                  {s.number}. {s.nameLatin} ({s.nameArabic}) - {s.numberOfAyahs} Ayat
                </option>
              ))}
            </select>
          </div>

          {/* Surah Info Card */}
          <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200/60 flex items-center justify-between text-xs text-teal-900">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>
                Surah <b>{selectedSurah.nameLatin}</b> ({selectedSurah.nameArabic}) • {selectedSurah.revelationType}
              </span>
            </div>
            <span className="font-bold text-teal-800">Maks. {selectedSurah.numberOfAyahs} Ayat</span>
          </div>

          {/* Ayat Awal, Ayat Akhir, Nilai */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Ayat Awal <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedSurah.numberOfAyahs}
                required
                value={ayatAwal}
                onChange={(e) => setAyatAwal(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Ayat Akhir <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={ayatAwal}
                max={selectedSurah.numberOfAyahs}
                required
                value={ayatAkhir}
                onChange={(e) => setAyatAkhir(Number(e.target.value))}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nilai Kelancaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={nilai}
                onChange={(e) => setNilai(e.target.value as PredikatNilai)}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PREDIKAT_NILAI_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Catatan / Evaluasi Ustadz */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Catatan Evaluasi / Rekomendasi
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Sangat lancar, mutqin tanpa bantuan. Pertahankan!"
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 active:bg-teal-950 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
