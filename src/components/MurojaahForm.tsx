import React, { useState } from 'react';
import { User, Santri, PredikatNilai } from '../types';
import { storageService } from '../services/storageService';
import { RotateCw, CheckCircle, Save, RotateCcw } from 'lucide-react';

interface MurojaahFormProps {
  currentUser: User;
  santriList: Santri[];
  selectedSantriId?: string;
  onSuccess: () => void;
}

export const MurojaahForm: React.FC<MurojaahFormProps> = ({
  currentUser,
  santriList,
  selectedSantriId,
  onSuccess
}) => {
  const [idSantri, setIdSantri] = useState(selectedSantriId || (santriList[0]?.idSantri || ''));
  const [surahAtauJuz, setSurahAtauJuz] = useState('Juz 30 (An-Naba - An-Nas)');
  const [nilai, setNilai] = useState<PredikatNilai>('Sangat Lancar');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri || !surahAtauJuz) return;

    setIsSubmitting(true);
    setTimeout(() => {
      storageService.saveMurojaah({
        idSantri,
        surahAtauJuz: surahAtauJuz.trim(),
        nilai,
        catatan: catatan.trim() || 'Murojaah tertib dan mutqin.',
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

  const quickPills = [
    'Juz 30 (Penuh)',
    'Surah Al-Mulk - Al-Qalam',
    'Juz 29 (Setengah Juz)',
    'Surah Yasin & Ar-Rahman',
    'Surah Al-Waqi\'ah & Al-Mulk'
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        {/* Form Header */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-100/90 text-teal-800 flex items-center justify-center flex-shrink-0">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              Form Input Muroja'ah (Pengulangan Hafalan)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Evaluasi kelancaran dan kekokohan hafalan santri yang telah dipelajari
            </p>
          </div>
        </div>

        {showSuccessToast && (
          <div className="p-4 bg-teal-50 border border-teal-300 rounded-2xl text-teal-800 text-sm font-semibold flex items-center gap-2.5 animate-bounce">
            <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <span>Setoran Muroja'ah berhasil disimpan ke Google Sheets!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Santri Selector */}
          <div>
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
              {santriList.map((s) => (
                <option key={s.idSantri} value={s.idSantri}>
                  {s.namaSantri} ({s.kelas})
                </option>
              ))}
            </select>
          </div>

          {/* Surah / Juz Input & Quick Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Surah atau Juz yang Di-Muroja'ah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={surahAtauJuz}
              onChange={(e) => setSurahAtauJuz(e.target.value)}
              placeholder="Contoh: Juz 30 (Surah Ad-Duha - An-Nas) atau Surah Al-Mulk"
              className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 self-center mr-1">Contoh Cepat:</span>
              {quickPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setSurahAtauJuz(pill)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 rounded-lg text-xs font-medium border border-slate-200 transition cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Kualitas Nilai & Catatan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nilai Kelancaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={nilai}
                onChange={(e) => setNilai(e.target.value as PredikatNilai)}
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Sangat Lancar">🟢 Sangat Lancar (Mumtaz)</option>
                <option value="Lancar">🟡 Lancar (Jayyid Jiddan)</option>
                <option value="Perlu Ulang">🔴 Perlu Ulang (Rosib)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Catatan Evaluasi / Rekomendasi
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Sangat lancar, mutqin tanpa bantuan. Pertahankan!"
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="reset"
              onClick={() => {
                setCatatan('');
                setSurahAtauJuz('');
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-700 active:bg-teal-950 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Setoran Muroja'ah</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
