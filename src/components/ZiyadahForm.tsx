import React, { useState } from 'react';
import { User, Santri, PredikatNilai } from '../types';
import { SURAH_LIST } from '../data/quranSurahs';
import { storageService } from '../services/storageService';
import { PlusCircle, BookOpen, CheckCircle, Save, RotateCcw } from 'lucide-react';

interface ZiyadahFormProps {
  currentUser: User;
  santriList: Santri[];
  selectedSantriId?: string;
  onSuccess: () => void;
}

export const ZiyadahForm: React.FC<ZiyadahFormProps> = ({
  currentUser,
  santriList,
  selectedSantriId,
  onSuccess
}) => {
  const [idSantri, setIdSantri] = useState(selectedSantriId || (santriList[0]?.idSantri || ''));
  const [surahName, setSurahName] = useState(SURAH_LIST[77].nameLatin); // default An-Naba
  const [ayatAwal, setAyatAwal] = useState<number>(1);
  const [ayatAkhir, setAyatAkhir] = useState<number>(10);
  const [nilai, setNilai] = useState<PredikatNilai>('Sangat Lancar');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const selectedSurah = SURAH_LIST.find(s => s.nameLatin === surahName) || SURAH_LIST[0];

  const handleSurahChange = (name: string) => {
    setSurahName(name);
    const surah = SURAH_LIST.find(s => s.nameLatin === name);
    if (surah) {
      setAyatAwal(1);
      setAyatAkhir(Math.min(10, surah.numberOfAyahs));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri || !surahName) return;

    setIsSubmitting(true);
    setTimeout(() => {
      storageService.saveZiyadah({
        idSantri,
        surah: surahName,
        surahNumber: selectedSurah.number,
        ayatAwal: Number(ayatAwal),
        ayatAkhir: Number(ayatAkhir),
        nilai,
        catatan: catatan.trim() || 'Lancar, tajwid dan makhraj baik.',
        inputBy: currentUser.nama
      });

      setIsSubmitting(false);
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        onSuccess();
      }, 1200);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        {/* Form Header */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Form Input Ziyadah (Hafalan Baru)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Simpan rekam setoran penambahan hafalan baru langsung ke database Google Sheets
            </p>
          </div>
        </div>

        {showSuccessToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2.5 animate-bounce">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Setoran Ziyadah berhasil disimpan ke Google Sheets!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Santri & Surah Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pilih Santri <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={idSantri}
                onChange={(e) => setIdSantri(e.target.value)}
                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Nama Santri --</option>
                {santriList.map((s) => (
                  <option key={s.idSantri} value={s.idSantri}>
                    {s.namaSantri} ({s.kelas})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pilih Surah (1 - 114) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={surahName}
                onChange={(e) => handleSurahChange(e.target.value)}
                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {SURAH_LIST.map((s) => (
                  <option key={s.number} value={s.nameLatin}>
                    {s.number}. {s.nameLatin} ({s.nameArabic}) - {s.numberOfAyahs} Ayat
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Surah Info Card */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
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
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Kualitas Hafalan <span className="text-rose-500">*</span>
              </label>
              <select
                value={nilai}
                onChange={(e) => setNilai(e.target.value as PredikatNilai)}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Sangat Lancar">🟢 Sangat Lancar (Mumtaz)</option>
                <option value="Lancar">🟡 Lancar (Jayyid Jiddan)</option>
                <option value="Perlu Ulang">🔴 Perlu Ulang (Rosib)</option>
              </select>
            </div>
          </div>

          {/* Catatan / Evaluasi Ustadz */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Catatan Tajwid / Evaluasi Ustadz
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Makhraj huruf 'Ain dan Ghain sudah tepat, tajwid ghunnah 2 harakat konsisten..."
              className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="reset"
              onClick={() => {
                setCatatan('');
                setAyatAwal(1);
                setAyatAkhir(10);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Setoran Ziyadah</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
