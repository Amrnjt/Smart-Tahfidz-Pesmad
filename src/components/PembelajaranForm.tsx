import React, { useState, useMemo } from 'react';
import { 
  User, 
  Santri, 
  Kelas, 
  PredikatNilai, 
  PREDIKAT_NILAI_OPTIONS,
  AspekKualitas,
  StatusKenaikan,
  STATUS_KENAIKAN_OPTIONS,
  TipeKelas
} from '../types';
import { 
  KURIKULUM_JILID_UMMI_DEWASA, 
  KURIKULUM_KELAS_ISTIMEWA,
  KURIKULUM_BINNADZOR 
} from '../data/kurikulumTemplates';
import { storageService } from '../services/storageService';
import { 
  GraduationCap, 
  CircleCheck as CheckCircle, 
  Save, 
  RotateCcw, 
  Calendar, 
  Clock, 
  BookOpen, 
  Layers, 
  Sparkles, 
  HeartHandshake, 
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { getTodayInputFormat, getCurrentTimeInputFormat, formatTanggalLengkap } from '../utils/dateFormatter';
import { isNonTahfidzClass } from '../utils/classUtils';

interface PembelajaranFormProps {
  currentUser: User;
  santriList: Santri[];
  kelasList: Kelas[];
  selectedSantriId?: string;
  defaultTipeKelas?: TipeKelas;
  onSuccess: () => void;
}

const QUICK_NOTES_JILID = [
  'Makhroj dan harakat sudah jelas, lanjut ke pokok bahasan berikutnya.',
  "Perhatikan panjang mad thabi'i (harus 2 harakat pas).",
  "Latih pembedaan huruf mirip seperti Ha & Kha, 'Ain & Hamzah.",
  'Kelancaran membaca meningkat, siap diuji kenaikan jilid.'
];

const QUICK_NOTES_ISTIMEWA = [
  'Perlu pengulangan huruf mirip dengan metode kartu peraga visual.',
  'Fokus pada ketenangan santri saat mengeja huruf berharakat sambung.',
  'Daya tangkap meningkat saat dibimbing secara perlahan dan sabar.',
  'Berikan apresiasi dan motivasi lebih agar tidak minder dalam belajar.'
];

export const PembelajaranForm: React.FC<PembelajaranFormProps> = ({
  currentUser,
  santriList,
  kelasList,
  selectedSantriId,
  defaultTipeKelas,
  onSuccess
}) => {
  // Find musyrif's class if any
  const myKelas = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'pimpinan') return undefined;
    return kelasList.find(k => k.musyrifId === currentUser.id);
  }, [kelasList, currentUser]);

  // Determine available classes that are non-tahfidz or all
  const filteredSantriList = useMemo(() => {
    if (!myKelas || !myKelas.santriIds || myKelas.santriIds.length === 0) {
      return santriList;
    }
    return santriList.filter(s => myKelas.santriIds.includes(s.idSantri));
  }, [santriList, myKelas]);

  // Selected santri object
  const [idSantri, setIdSantri] = useState(selectedSantriId || (filteredSantriList[0]?.idSantri || ''));
  const currentSantri = useMemo(() => santriList.find(s => s.idSantri === idSantri), [santriList, idSantri]);

  // Infer initial class type from santri's class or defaultTipeKelas
  const santriKelasObj = useMemo(() => {
    if (!currentSantri?.kelas) return undefined;
    return kelasList.find(k => k.namaKelas.toLowerCase() === currentSantri.kelas.toLowerCase());
  }, [currentSantri, kelasList]);

  const [tipeKelas, setTipeKelas] = useState<TipeKelas>(() => {
    if (defaultTipeKelas) return defaultTipeKelas;
    if (santriKelasObj?.tipeKelas && isNonTahfidzClass(santriKelasObj.tipeKelas)) {
      return santriKelasObj.tipeKelas;
    }
    return 'Jilid';
  });

  // Date & Time
  const [tanggalSetor, setTanggalSetor] = useState(getTodayInputFormat());
  const [waktuSetor, setWaktuSetor] = useState(getCurrentTimeInputFormat());

  // Ummi Dewasa State
  const [jilidUmmiIndex, setJilidUmmiIndex] = useState(0); // 0 = Jilid Dewasa 1, etc.
  const [halamanUmmi, setHalamanUmmi] = useState<number>(1);
  const [pokokBahasanUmmi, setPokokBahasanUmmi] = useState(KURIKULUM_JILID_UMMI_DEWASA[0]?.pokokBahasan[0] || '');

  // Kelas Istimewa State
  const [tahapIstimewaIndex, setTahapIstimewaIndex] = useState(0);
  const [halamanIstimewa, setHalamanIstimewa] = useState<number>(1);
  const [kendalaSantri, setKendalaSantri] = useState('');
  const [rekomendasiTindakLanjut, setRekomendasiTindakLanjut] = useState('');

  // Penilaian & Aspek Kualitas
  const [nilai, setNilai] = useState<PredikatNilai>('Baik');
  const [hukumTajwid, setHukumTajwid] = useState<AspekKualitas>('Baik');
  const [makhrojHuruf, setMakhrojHuruf] = useState<AspekKualitas>('Baik');
  const [kefasihan, setKefasihan] = useState<AspekKualitas>('Baik');
  const [kelancaran, setKelancaran] = useState<AspekKualitas>('Baik');

  // Status Kenaikan
  const [statusKenaikan, setStatusKenaikan] = useState<StatusKenaikan>('Lanjut Halaman');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Switch santri
  const handleSantriChange = (newSantriId: string) => {
    setIdSantri(newSantriId);
    const target = santriList.find(s => s.idSantri === newSantriId);
    if (target?.kelas) {
      const k = kelasList.find(c => c.namaKelas.toLowerCase() === target.kelas.toLowerCase());
      if (k && isNonTahfidzClass(k.tipeKelas)) {
        setTipeKelas(k.tipeKelas);
      }
    }
  };

  const getMateriString = (): string => {
    if (tipeKelas === 'Jilid') {
      const selectedJilid = KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex] || KURIKULUM_JILID_UMMI_DEWASA[0];
      return `${selectedJilid.tingkat} - Hal. ${halamanUmmi} (${pokokBahasanUmmi || selectedJilid.targetCapaian})`;
    } else if (tipeKelas === 'Kelas Istimewa') {
      const selectedTahap = KURIKULUM_KELAS_ISTIMEWA[tahapIstimewaIndex] || KURIKULUM_KELAS_ISTIMEWA[0];
      return `Kelas Istimewa: ${selectedTahap.tingkat} - Hal. ${halamanIstimewa}`;
    } else {
      return `Binnadzor: Tilawah & Pemantapan Kualitas Tajwid & Makhroj`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri) return;

    setIsSubmitting(true);
    try {
      const customTimestamp = `${tanggalSetor} ${waktuSetor || '00:00'}`;
      const materi = getMateriString();

      const selectedJilid = KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex];
      const selectedTahap = KURIKULUM_KELAS_ISTIMEWA[tahapIstimewaIndex];

      await storageService.savePembelajaran({
        idSantri,
        timestamp: customTimestamp,
        tipeKelas,
        materi,
        jilid: tipeKelas === 'Jilid' ? selectedJilid?.tingkat : undefined,
        halaman: tipeKelas === 'Jilid' ? halamanUmmi : tipeKelas === 'Kelas Istimewa' ? halamanIstimewa : undefined,
        pokokBahasan: tipeKelas === 'Jilid' ? pokokBahasanUmmi : selectedTahap?.targetCapaian,
        tahapIstimewa: tipeKelas === 'Kelas Istimewa' ? selectedTahap?.tingkat : undefined,
        kendalaSantri: tipeKelas === 'Kelas Istimewa' ? kendalaSantri.trim() : undefined,
        rekomendasiTindakLanjut: tipeKelas === 'Kelas Istimewa' ? rekomendasiTindakLanjut.trim() : undefined,
        nilai,
        hukumTajwid,
        makhrojHuruf,
        kefasihan,
        kelancaran,
        statusKenaikan,
        catatan: catatan.trim() || 'Pembelajaran berjalan dengan baik.',
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
    setNilai('Baik');
    setStatusKenaikan('Lanjut Halaman');
    setCatatan('');
    setKendalaSantri('');
    setRekomendasiTindakLanjut('');
  };

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Toast Notifikasi Sukses */}
      {showSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span>Alhamdulillah! Data Pembelajaran berhasil disimpan.</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header Form */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner">
              <GraduationCap className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Form Pembelajaran Non-Tahfidz</h2>
              <p className="text-xs text-emerald-100/90 font-medium">
                Pencatatan materi Jilid Ummi Dewasa, Binnadzor & Kelas Pendampingan Istimewa
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Pemilihan Tipe Kelas Non-Tahfidz */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Program Kelas Pembelajaran <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card Jilid Ummi Dewasa */}
              <button
                type="button"
                onClick={() => setTipeKelas('Jilid')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  tipeKelas === 'Jilid'
                    ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${tipeKelas === 'Jilid' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Jilid Ummi Dewasa</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Standar kurikulum Ummi Jilid Dewasa (Jilid 1 s.d. 3) untuk percepatan tartil & makhroj.
                  </p>
                </div>
              </button>

              {/* Card Kelas Istimewa */}
              <button
                type="button"
                onClick={() => setTipeKelas('Kelas Istimewa')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  tipeKelas === 'Kelas Istimewa'
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${tipeKelas === 'Kelas Istimewa' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900">Kelas Istimewa</h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Pendampingan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Bimbingan personal & intensif untuk santri dengan pemahaman dan capaian di bawah rata-rata.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pilih Santri & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Santri <span className="text-rose-500">*</span>
              </label>
              <select
                value={idSantri}
                onChange={(e) => handleSantriChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-semibold text-slate-800"
              >
                {filteredSantriList.map((santri) => (
                  <option key={santri.idSantri} value={santri.idSantri}>
                    {santri.namaSantri} ({santri.nis || santri.idSantri}) - {santri.kelas || 'Belum ada kelas'}
                  </option>
                ))}
              </select>
              {currentSantri?.kelas && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Kelas Santri saat ini: <span className="font-semibold text-slate-800">{currentSantri.kelas}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalSetor}
                onChange={(e) => setTanggalSetor(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium text-slate-800"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {formatTanggalLengkap(tanggalSetor)}
              </p>
            </div>
          </div>

          {/* 3. Panel Materi Berdasarkan Tipe Kelas */}
          {tipeKelas === 'Jilid' && (
            <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  Materi Kurikulum Ummi Dewasa
                </h4>
              </div>

              {/* Pilihan Jilid Dewasa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tingkat Jilid Dewasa <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {KURIKULUM_JILID_UMMI_DEWASA.map((j, idx) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => {
                        setJilidUmmiIndex(idx);
                        setHalamanUmmi(1);
                        setPokokBahasanUmmi(j.pokokBahasan[0] || '');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        jilidUmmiIndex === idx
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {j.tingkat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail Pokok Bahasan & Halaman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Halaman Jilid (1 - {KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex]?.totalHalaman || 40}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex]?.totalHalaman || 40}
                    value={halamanUmmi}
                    onChange={(e) => setHalamanUmmi(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pokok Bahasan / Kompetensi
                  </label>
                  <select
                    value={pokokBahasanUmmi}
                    onChange={(e) => setPokokBahasanUmmi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600"
                  >
                    {KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex]?.pokokBahasan.map((pb, idx) => (
                      <option key={idx} value={pb}>
                        {pb}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/60 text-[11px] text-slate-600">
                <span className="font-bold text-emerald-900">Target Capaian Jilid: </span>
                {KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex]?.targetCapaian}
              </div>
            </div>
          )}

          {tipeKelas === 'Kelas Istimewa' && (
            <div className="p-4.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                  Materi & Pendampingan Kelas Istimewa
                </h4>
              </div>

              {/* Pilihan Tahap Kelas Istimewa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tahapan Kemampuan Santri <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KURIKULUM_KELAS_ISTIMEWA.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTahapIstimewaIndex(idx);
                        setHalamanIstimewa(1);
                      }}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold transition border cursor-pointer ${
                        tahapIstimewaIndex === idx
                          ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-extrabold">{t.tingkat}</div>
                      <div className={`text-[10px] mt-0.5 ${tahapIstimewaIndex === idx ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {t.targetCapaian}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Halaman / Materi Modul */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Halaman / Lembar Modul <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={KURIKULUM_KELAS_ISTIMEWA[tahapIstimewaIndex]?.totalHalaman || 30}
                    value={halamanIstimewa}
                    onChange={(e) => setHalamanIstimewa(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pendampingan
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-slate-200 bg-white/70 text-xs font-semibold text-indigo-900">
                    {KURIKULUM_KELAS_ISTIMEWA[tahapIstimewaIndex]?.metodePendampingan}
                  </div>
                </div>
              </div>

              {/* Observasi Kendala Spesifik Santri */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Catatan Observasi Kendala Santri (Khusus Kelas Istimewa)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {["Pembedaan huruf mirip (Ha/Kha, 'Ain/Hamzah)", 'Panjang pendek / Mad belum konsisten', 'Konsentrasi cepat terdistraksi', 'Pengucapan makhroj berat / cadel', 'Perlu tempo sangat lambat'].map((kd, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setKendalaSantri(prev => prev ? `${prev}, ${kd}` : kd)}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
                    >
                      + {kd}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={kendalaSantri}
                  onChange={(e) => setKendalaSantri(e.target.value)}
                  placeholder="Misal: Kesulitan membedakan huruf Jim, Ha, dan Kha saat disambung..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Rekomendasi Tindak Lanjut Ustadz */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rekomendasi Tindak Lanjut Guru/Ustadz
                </label>
                <input
                  type="text"
                  value={rekomendasiTindakLanjut}
                  onChange={(e) => setRekomendasiTindakLanjut(e.target.value)}
                  placeholder="Misal: Berikan latihan kartu peraga 10 menit sebelum kelas dimulai..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          )}

          {/* 4. Predikat Nilai & Status Kenaikan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Predikat Nilai Pembelajaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PREDIKAT_NILAI_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setNilai(opt.value)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      nilai === opt.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Status Kenaikan / Progres Materi <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_KENAIKAN_OPTIONS.map((st) => (
                  <button
                    type="button"
                    key={st.value}
                    onClick={() => setStatusKenaikan(st.value)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                      statusKenaikan === st.value
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{st.emoji}</span>
                    <span className="truncate">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Evaluasi 4 Aspek Kualitas (Tajwid, Makhroj, Fashohah, Kelancaran) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Evaluasi Kualitas Bacaan Santri</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Pemantauan 4 pilar kualitas bacaan Al-Qur'an / materi
                </p>
              </div>
              <div className="flex items-center gap-1.5">
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
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tajwid */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>1. Hukum Tajwid</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {hukumTajwid}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setHukumTajwid(l)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition ${
                        hukumTajwid === l ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {l === 'Perlu Bimbingan' ? 'Bimbingan' : l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Makhroj */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>2. Makharijul Huruf</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {makhrojHuruf}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setMakhrojHuruf(l)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition ${
                        makhrojHuruf === l ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {l === 'Perlu Bimbingan' ? 'Bimbingan' : l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fashohah */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>3. Kefasihan (Fashohah)</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {kefasihan}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setKefasihan(l)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition ${
                        kefasihan === l ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {l === 'Perlu Bimbingan' ? 'Bimbingan' : l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kelancaran */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>4. Kelancaran & Tartil</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {kelancaran}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setKelancaran(l)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition ${
                        kelancaran === l ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {l === 'Perlu Bimbingan' ? 'Bimbingan' : l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Catatan Ustadz */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Catatan Ustadz & Rekomendasi Khusus
              </label>
              <span className="text-[10px] text-slate-500">Opsional</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {(tipeKelas === 'Kelas Istimewa' ? QUICK_NOTES_ISTIMEWA : QUICK_NOTES_JILID).map((qn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCatatan(qn)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                >
                  + {qn}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan evaluasi detail santri untuk materi hari ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium text-slate-800"
            ></textarea>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !idSantri}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelajaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
