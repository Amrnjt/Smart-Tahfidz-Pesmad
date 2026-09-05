import React, { useState, useMemo } from 'react';
import { User, Santri, PredikatNilai, PREDIKAT_NILAI_OPTIONS, Kelas } from '../types';
import { SURAH_LIST } from '../data/quranSurahs';
import { storageService } from '../services/storageService';
import { BookOpenCheck, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, Layers, Bookmark } from 'lucide-react';
import { getTodayInputFormat, getCurrentTimeInputFormat, formatTanggalLengkap } from '../utils/dateFormatter';

interface BinnadzorFormProps {
  currentUser: User;
  santriList: Santri[];
  kelasList: Kelas[];
  selectedSantriId?: string;
  onSuccess: () => void;
}

type ModeInput = 'surah' | 'halaman' | 'juz';

const QUICK_NOTES = [
  'Lancar, tartil, tajwid sangat baik.',
  'Perhatikan panjang mad (mad thabi\'i & mad wajib).',
  'Tingkatkan kejelasan makharijul huruf dan ghunnah.',
  'Tartil dan fashohah sudah bagus, pertahankan.',
  'Perhatikan waqaf dan ibtida\' (tanda berhenti membaca).'
];

export const BinnadzorForm: React.FC<BinnadzorFormProps> = ({
  currentUser,
  santriList,
  kelasList,
  selectedSantriId,
  onSuccess
}) => {
  const myKelas = useMemo(() => kelasList.find(k => k.musyrifId === currentUser.id), [kelasList, currentUser.id]);
  const mySantriList = useMemo(() => {
    if (!myKelas || !myKelas.santriIds || myKelas.santriIds.length === 0) return santriList;
    return santriList.filter(s => myKelas.santriIds.includes(s.idSantri));
  }, [santriList, myKelas]);

  const [idSantri, setIdSantri] = useState(selectedSantriId || (mySantriList[0]?.idSantri || ''));
  const [tanggalSetor, setTanggalSetor] = useState(getTodayInputFormat());
  const [waktuSetor, setWaktuSetor] = useState(getCurrentTimeInputFormat());
  const [modeInput, setModeInput] = useState<ModeInput>('surah');

  // Mode Surah
  const [surahName, setSurahName] = useState(SURAH_LIST[0].nameLatin); // default Al-Fatihah
  const [ayatAwal, setAyatAwal] = useState<number>(1);
  const [ayatAkhir, setAyatAkhir] = useState<number>(7);

  // Mode Halaman
  const [halamanAwal, setHalamanAwal] = useState<number>(1);
  const [halamanAkhir, setHalamanAkhir] = useState<number>(1);

  // Mode Juz
  const [juzNumber, setJuzNumber] = useState<number>(1);

  const [nilai, setNilai] = useState<PredikatNilai>('Sangat Baik');
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

  const getMateriString = (): string => {
    if (modeInput === 'surah') {
      return `${surahName} (Ayat ${ayatAwal} - ${ayatAkhir})`;
    } else if (modeInput === 'halaman') {
      return halamanAwal === halamanAkhir
        ? `Halaman ${halamanAwal}`
        : `Halaman ${halamanAwal} - ${halamanAkhir}`;
    } else {
      return `Juz ${juzNumber}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri) return;

    setIsSubmitting(true);
    try {
      const customTimestamp = `${tanggalSetor} ${waktuSetor || '00:00'}`;
      const materi = getMateriString();

      await storageService.saveBinnadzor({
        idSantri,
        timestamp: customTimestamp,
        modeInput,
        surah: modeInput === 'surah' ? surahName : undefined,
        surahNumber: modeInput === 'surah' ? selectedSurah.number : undefined,
        ayatAwal: modeInput === 'surah' ? Number(ayatAwal) : undefined,
        ayatAkhir: modeInput === 'surah' ? Number(ayatAkhir) : undefined,
        halamanAwal: modeInput === 'halaman' ? Number(halamanAwal) : undefined,
        halamanAkhir: modeInput === 'halaman' ? Number(halamanAkhir) : undefined,
        juz: modeInput === 'juz' ? Number(juzNumber) : undefined,
        materi,
        nilai,
        catatan: catatan.trim() || 'Lancar, tartil, dan fashohah baik.',
        inputBy: currentUser.nama
      });

      setIsSubmitting(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTanggalSetor(getTodayInputFormat());
    setWaktuSetor(getCurrentTimeInputFormat());
    setSurahName(SURAH_LIST[0].nameLatin);
    setAyatAwal(1);
    setAyatAkhir(7);
    setHalamanAwal(1);
    setHalamanAkhir(1);
    setJuzNumber(1);
    setNilai('Sangat Baik');
    setCatatan('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Toast Notifikasi Sukses */}
      {showSuccessToast && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Alhamdulillah! Setoran Binnadzor Berhasil Disimpan</p>
            <p className="text-xs text-indigo-100">Data telah tercatat dan tersinkronisasi ke Cloud Database.</p>
          </div>
        </div>
      )}

      {/* Card Form */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        {/* Header Form */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-700/60 border border-indigo-500/50 text-indigo-200">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Input Setoran Binnadzor</h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-700/80 text-indigo-200 border border-indigo-500/40">
                  Melihat Mushaf
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Setoran membaca al-Qur'an secara tartil, fashohah, dan makhorijul huruf
              </p>
            </div>
          </div>
        </div>

        {/* Form Isi */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Disclaimer Info */}
          <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-xl p-3 flex items-start gap-2.5 text-xs text-indigo-900">
            <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-950">Tentang Setoran Binnadzor:</p>
              <p className="text-indigo-800/90 text-[11px] mt-0.5 leading-relaxed">
                Binnadzor adalah setoran santri dengan membaca langsung mushaf al-Qur'an (bukan hafalan bil-ghoib). Fokus penilaian terletak pada kelancaran, ketepatan tajwid, waqaf/ibtida', serta makhraj huruf.
              </p>
            </div>
          </div>

          {/* 1. Pilih Santri */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Santri <span className="text-rose-500">*</span>
            </label>
            <select
              value={idSantri}
              onChange={(e) => setIdSantri(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700 text-sm font-medium text-slate-800"
            >
              <option value="" disabled>-- Pilih Santri --</option>
              {mySantriList.map((s) => (
                <option key={s.idSantri} value={s.idSantri}>
                  {s.idSantri} - {s.namaSantri} (Kelas: {s.kelas})
                </option>
              ))}
            </select>
            {myKelas && (
              <p className="text-[11px] text-slate-500 mt-1">
                Menampilkan santri binaan kelas: <span className="font-semibold text-indigo-800">{myKelas.namaKelas}</span>
              </p>
            )}
          </div>

          {/* 2. Tanggal & Waktu Setor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Tanggal Setor <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalSetor}
                onChange={(e) => setTanggalSetor(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700 text-sm font-medium text-slate-800"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {formatTanggalLengkap(tanggalSetor)}
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Waktu Setor <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={waktuSetor}
                onChange={(e) => setWaktuSetor(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700 text-sm font-medium text-slate-800"
              />
            </div>
          </div>

          {/* 3. Pilihan Mode Materi Binnadzor */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Metode Input Materi Binnadzor <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModeInput('surah')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                  modeInput === 'surah'
                    ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Per Surah</span>
              </button>
              <button
                type="button"
                onClick={() => setModeInput('halaman')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                  modeInput === 'halaman'
                    ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Per Halaman</span>
              </button>
              <button
                type="button"
                onClick={() => setModeInput('juz')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                  modeInput === 'juz'
                    ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Per Juz</span>
              </button>
            </div>
          </div>

          {/* Form Dinamis Berdasarkan Mode */}
          {modeInput === 'surah' && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Surah Al-Qur'an <span className="text-rose-500">*</span>
                </label>
                <select
                  value={surahName}
                  onChange={(e) => handleSurahChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-700"
                >
                  {SURAH_LIST.map((s) => (
                    <option key={s.number} value={s.nameLatin}>
                      {s.number}. {s.nameLatin} ({s.nameArabic}) - {s.numberOfAyahs} Ayat
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ayat Awal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurah.numberOfAyahs}
                    value={ayatAwal}
                    onChange={(e) => setAyatAwal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ayat Akhir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={ayatAwal}
                    max={selectedSurah.numberOfAyahs}
                    value={ayatAkhir}
                    onChange={(e) => setAyatAkhir(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-700"
                  />
                </div>
              </div>
            </div>
          )}

          {modeInput === 'halaman' && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Halaman Awal (1 - 604) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={604}
                    value={halamanAwal}
                    onChange={(e) => setHalamanAwal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Halaman Akhir (1 - 604) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={halamanAwal}
                    max={604}
                    value={halamanAkhir}
                    onChange={(e) => setHalamanAkhir(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-700"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Format standar mushaf Madinah rasm Utsmani (1 sampai 604 halaman).
              </p>
            </div>
          )}

          {modeInput === 'juz' && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Juz Al-Qur'an (1 - 30) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={juzNumber}
                  onChange={(e) => setJuzNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-700"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                    <option key={j} value={j}>
                      Juz {j} {j === 30 ? "(Juz 'Amma)" : j === 29 ? "(Juz Tabarak)" : j === 1 ? "(Alif Lam Mim)" : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 4. Predikat Nilai */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Predikat Penilaian Kelancaran & Tartil <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PREDIKAT_NILAI_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setNilai(opt.value)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    nilai === opt.value
                      ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className="text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Rekomendasi Catatan Cepat & Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Catatan Ustadz / Evaluasi Bacaan
              </label>
              <span className="text-[10px] text-slate-500">Opsional</span>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_NOTES.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCatatan(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Bacaan tartil, makhraj huruf 'ain dan ghain sudah tepat, perlu diperhatikan mad shilah..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700 text-sm font-medium text-slate-800"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Setoran Binnadzor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
