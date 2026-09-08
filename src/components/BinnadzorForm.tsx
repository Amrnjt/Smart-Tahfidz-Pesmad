import React, { useState, useMemo } from 'react';
import { User, Santri, PredikatNilai, PREDIKAT_NILAI_OPTIONS, Kelas, AspekKualitas, ASPEK_KUALITAS_OPTIONS } from '../types';
import { SURAH_LIST } from '../data/quranSurahs';
import { storageService } from '../services/storageService';
import { BookOpenCheck, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, Layers, Bookmark, Sparkles, Check, AlertCircle } from 'lucide-react';
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
  
  // 4 Aspek Kualitas Fokus Binnadzor
  const [hukumTajwid, setHukumTajwid] = useState<AspekKualitas>('Baik');
  const [makhrojHuruf, setMakhrojHuruf] = useState<AspekKualitas>('Baik');
  const [kefasihan, setKefasihan] = useState<AspekKualitas>('Baik');
  const [kelancaran, setKelancaran] = useState<AspekKualitas>('Sangat Baik');

  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

    setFormError(null);
    setShowSuccessToast(false);
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
        hukumTajwid,
        makhrojHuruf,
        kefasihan,
        kelancaran,
        catatan: catatan.trim() || 'Lancar, tartil, dan fashohah baik.',
        inputBy: currentUser.nama
      });

      setIsSubmitting(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        onSuccess();
      }, 900);
    } catch (err) {
      console.error(err);
      setFormError('Binnadzor belum tersimpan ke Cloud. Periksa koneksi lalu coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTanggalSetor(getTodayInputFormat());
    setWaktuSetor(getCurrentTimeInputFormat());
    setModeInput('surah');
    setSurahName(SURAH_LIST[0].nameLatin);
    setAyatAwal(1);
    setAyatAkhir(7);
    setHalamanAwal(1);
    setHalamanAkhir(1);
    setJuzNumber(1);
    setNilai('Sangat Baik');
    setHukumTajwid('Baik');
    setMakhrojHuruf('Baik');
    setKefasihan('Baik');
    setKelancaran('Sangat Baik');
    setCatatan('');
    setShowSuccessToast(false);
    setFormError(null);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        {/* Form Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Setoran Binnadzor</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Melihat Mushaf</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">Bacaan tartil dengan penilaian tajwid, makhraj, fashohah, dan kelancaran.</p>
          </div>
        </div>

        {showSuccessToast && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-xs font-semibold flex items-center gap-2" role="status">
            <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Binnadzor berhasil disimpan ke Cloud.</span>
          </div>
        )}

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2" role="alert">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Santri, Tanggal & Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Pilih Santri <span className="text-rose-500">*</span>
              </label>
              <select
                value={idSantri}
                onChange={(e) => setIdSantri(e.target.value)}
                required
                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Nama Santri --</option>
                {mySantriList.map((s) => (
                  <option key={s.idSantri} value={s.idSantri}>
                    {s.namaSantri} ({s.kelas})
                  </option>
                ))}
              </select>
              {myKelas && (
                <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                  Kelas: {myKelas.namaKelas} • {mySantriList.length} santri
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                <span>Tanggal Setoran <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                value={tanggalSetor}
                onChange={(e) => setTanggalSetor(e.target.value)}
                required
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-indigo-700 font-semibold mt-1 block truncate">
                {formatTanggalLengkap(tanggalSetor)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                <span>Waktu / Jam <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="time"
                value={waktuSetor}
                onChange={(e) => setWaktuSetor(e.target.value)}
                required
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">WIB (Waktu Indonesia Barat)</span>
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

          {/* 4.5. Fokus Penilaian 4 Aspek Kualitas Binnadzor */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/90 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-100/80 pb-2.5">
              <div>
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Fokus Kualitas Bacaan Binnadzor</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Evaluasi mendalam 4 pilar kualitas tilawah Al-Qur'an santri
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold">Preset Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    setHukumTajwid('Baik');
                    setMakhrojHuruf('Baik');
                    setKefasihan('Baik');
                    setKelancaran('Baik');
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition cursor-pointer"
                >
                  Semua Baik
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHukumTajwid('Sangat Baik');
                    setMakhrojHuruf('Sangat Baik');
                    setKefasihan('Sangat Baik');
                    setKelancaran('Sangat Baik');
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-200 transition cursor-pointer"
                >
                  Sangat Baik
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHukumTajwid('Mutqin');
                    setMakhrojHuruf('Mutqin');
                    setKefasihan('Mutqin');
                    setKelancaran('Mutqin');
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200 transition cursor-pointer"
                >
                  Mutqin
                </button>
              </div>
            </div>

            {/* The 4 Aspect Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Hukum Tajwid */}
              <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">1. Hukum Tajwid</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {hukumTajwid}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Ikhfa, idgham, ghunnah, mad far'i & tanda waqaf</p>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setHukumTajwid(level)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        hukumTajwid === level
                          ? 'bg-indigo-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level === 'Perlu Bimbingan' ? 'Bimbingan' : level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Makhroj Huruf */}
              <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">2. Makharijul Huruf</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {makhrojHuruf}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Ketepatan artikulasi bunyi huruf hijaiyah</p>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setMakhrojHuruf(level)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        makhrojHuruf === level
                          ? 'bg-indigo-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level === 'Perlu Bimbingan' ? 'Bimbingan' : level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Kefasihan (Fashohah) */}
              <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">3. Kefasihan (Fashohah)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {kefasihan}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Kefasihan dialek Arab & kesempurnaan sifat huruf</p>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setKefasihan(level)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        kefasihan === level
                          ? 'bg-indigo-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level === 'Perlu Bimbingan' ? 'Bimbingan' : level}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Kelancaran & Tartil */}
              <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">4. Kelancaran & Tartil</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                    {kelancaran}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Irama tilawah, aliran tanpa terbata & nafas</p>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setKelancaran(level)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        kelancaran === level
                          ? 'bg-indigo-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level === 'Perlu Bimbingan' ? 'Bimbingan' : level}
                    </button>
                  ))}
                </div>
              </div>
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
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-950 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
