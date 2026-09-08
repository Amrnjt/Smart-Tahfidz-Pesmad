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
  HeartHandshake, 
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';
import { getTodayInputFormat, getCurrentTimeInputFormat, formatTanggalLengkap } from '../utils/dateFormatter';
import type { NotifyFn } from './Snackbar';
import { isNonTahfidzClass } from '../utils/classUtils';

interface PembelajaranFormProps {
  currentUser: User;
  santriList: Santri[];
  kelasList: Kelas[];
  selectedSantriId?: string;
  defaultTipeKelas?: TipeKelas;
  onSuccess: () => void;
  onNotify: NotifyFn;
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
  onSuccess,
  onNotify
}) => {
  // Find musyrif's class if any
  const myKelas = useMemo(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'pimpinan' || currentUser.role === 'Superadmin') return undefined;
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
      onNotify('success', 'Pembelajaran berhasil disimpan ke Cloud.');
      onSuccess();
    } catch (err) {
      console.error(err);
      onNotify('error', 'Pembelajaran belum tersimpan ke Cloud. Periksa koneksi lalu coba simpan lagi.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTanggalSetor(getTodayInputFormat());
    setWaktuSetor(getCurrentTimeInputFormat());
    setNilai('Baik');
    setHukumTajwid('Baik');
    setMakhrojHuruf('Baik');
    setKefasihan('Baik');
    setKelancaran('Baik');
    setStatusKenaikan('Lanjut Halaman');
    setCatatan('');
    setKendalaSantri('');
    setRekomendasiTindakLanjut('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-6">
        {/* Form Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="ui-section-title text-slate-900">Setoran Pembelajaran</h3>
            <p className="text-xs sm:text-sm text-slate-500">Jilid Ummi Dewasa dan Kelas Istimewa dengan evaluasi progres materi.</p>
          </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>
          {/* 1. Pemilihan Tipe Kelas Non-Tahfidz */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Program pembelajaran</h4>
            <p className="text-xs text-slate-500">Pilih program yang sesuai dengan kelas dan kebutuhan santri.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Program Kelas Pembelajaran <span className="text-rose-500">*</span></span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card Jilid Ummi Dewasa */}
              <button
                type="button"
                onClick={() => setTipeKelas('Jilid')}
                aria-pressed={tipeKelas === 'Jilid'}
                className={`p-3.5 rounded-2xl border text-left transition-colors cursor-pointer flex items-start gap-3 min-h-24 ${
                  tipeKelas === 'Jilid'
                    ? 'bg-emerald-50/80 border-emerald-600'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${tipeKelas === 'Jilid' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Jilid Ummi Dewasa</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Standar kurikulum Ummi Jilid Dewasa (Jilid 1 s.d. 3) untuk percepatan tartil & makhroj.
                  </p>
                </div>
              </button>

              {/* Card Kelas Istimewa */}
              <button
                type="button"
                onClick={() => setTipeKelas('Kelas Istimewa')}
                aria-pressed={tipeKelas === 'Kelas Istimewa'}
                className={`p-3.5 rounded-2xl border text-left transition-colors cursor-pointer flex items-start gap-3 min-h-24 ${
                  tipeKelas === 'Kelas Istimewa'
                    ? 'bg-amber-50/80 border-amber-600'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${tipeKelas === 'Kelas Istimewa' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900">Kelas Istimewa</h4>
                    <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Pendampingan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Bimbingan personal & intensif untuk santri dengan pemahaman dan capaian di bawah rata-rata.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pilih Santri, Tanggal & Waktu */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Identitas & waktu</h4>
            <p className="text-xs text-slate-500">Pilih santri serta waktu pencatatan pembelajaran.</p>
          </div>
          <div className="ui-form-identity">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Pilih Santri <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Pilih Santri"
                value={idSantri}
                onChange={(e) => handleSantriChange(e.target.value)}
                required
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Pilih Nama Santri --</option>
                {filteredSantriList.map((santri) => (
                  <option key={santri.idSantri} value={santri.idSantri}>
                    {santri.namaSantri} ({santri.kelas || 'Belum ada kelas'})
                  </option>
                ))}
              </select>
              {currentSantri?.kelas && (
                <p className="text-xs text-amber-800 font-semibold mt-1">
                  Kelas: {currentSantri.kelas}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Tanggal Setoran <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                aria-label="Tanggal Setoran"
                value={tanggalSetor}
                onChange={(e) => setTanggalSetor(e.target.value)}
                required
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs text-amber-800 font-semibold mt-1 block truncate">
                {formatTanggalLengkap(tanggalSetor)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Waktu / Jam <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="time"
                aria-label="Waktu Setoran"
                value={waktuSetor}
                onChange={(e) => setWaktuSetor(e.target.value)}
                required
                className="ui-control w-full px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-500 mt-1 block">WIB (Waktu Indonesia Barat)</span>
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
                      aria-pressed={jilidUmmiIndex === idx}
                      className={`min-h-11 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        jilidUmmiIndex === idx
                          ? 'bg-emerald-700 text-white border-emerald-800'
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
                    aria-label="Halaman Jilid Ummi"
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
                    aria-label="Pokok Bahasan atau Kompetensi"
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

              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/60 text-xs text-slate-600">
                <span className="font-bold text-emerald-900">Target Capaian Jilid: </span>
                {KURIKULUM_JILID_UMMI_DEWASA[jilidUmmiIndex]?.targetCapaian}
              </div>
            </div>
          )}

          {tipeKelas === 'Kelas Istimewa' && (
            <div className="p-4.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-semibold text-amber-950">
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
                      aria-pressed={tahapIstimewaIndex === idx}
                      className={`min-h-11 p-2.5 rounded-xl text-left text-xs font-bold transition border cursor-pointer ${
                        tahapIstimewaIndex === idx
                          ? 'bg-amber-700 text-white border-amber-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-extrabold">{t.tingkat}</div>
                      <div className={`text-xs mt-0.5 ${tahapIstimewaIndex === idx ? 'text-amber-200' : 'text-slate-500'}`}>
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
                    aria-label="Halaman atau Lembar Modul"
                value={halamanIstimewa}
                    onChange={(e) => setHalamanIstimewa(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pendampingan
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-slate-200 bg-white/70 text-xs font-semibold text-amber-900">
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
                      className="min-h-11 text-xs font-medium px-3 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
                    >
                      + {kd}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  aria-label="Catatan Observasi Kendala Santri"
                value={kendalaSantri}
                  onChange={(e) => setKendalaSantri(e.target.value)}
                  placeholder="Misal: Kesulitan membedakan huruf Jim, Ha, dan Kha saat disambung..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600"
                />
              </div>

              {/* Rekomendasi Tindak Lanjut Ustadz */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rekomendasi Tindak Lanjut Guru/Ustadz
                </label>
                <input
                  type="text"
                  aria-label="Rekomendasi Tindak Lanjut Guru atau Ustadz"
                value={rekomendasiTindakLanjut}
                  onChange={(e) => setRekomendasiTindakLanjut(e.target.value)}
                  placeholder="Misal: Berikan latihan kartu peraga 10 menit sebelum kelas dimulai..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>
          )}

          {/* 4. Predikat Nilai & Status Kenaikan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Predikat Nilai Pembelajaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PREDIKAT_NILAI_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setNilai(opt.value)}
                    aria-pressed={nilai === opt.value}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      nilai === opt.value
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Status Kenaikan / Progres Materi <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_KENAIKAN_OPTIONS.map((st) => (
                  <button
                    type="button"
                    key={st.value}
                    onClick={() => setStatusKenaikan(st.value)}
                    aria-pressed={statusKenaikan === st.value}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                      statusKenaikan === st.value
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Evaluasi 4 Aspek Kualitas (Tajwid, Makhroj, Fashohah, Kelancaran) */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-slate-200  space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Evaluasi Kualitas Bacaan Santri</span>
                </h4>
                <p className="text-xs text-slate-500">
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
                  className="min-h-11 text-xs font-bold px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition cursor-pointer"
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
                  className="min-h-11 text-xs font-bold px-3 py-1 rounded-md bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-200 transition cursor-pointer"
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
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {hukumTajwid}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setHukumTajwid(l)}
                      aria-pressed={hukumTajwid === l}
                      className={`min-h-11 py-1 text-xs font-bold rounded-lg transition ${
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
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {makhrojHuruf}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setMakhrojHuruf(l)}
                      aria-pressed={makhrojHuruf === l}
                      className={`min-h-11 py-1 text-xs font-bold rounded-lg transition ${
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
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {kefasihan}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setKefasihan(l)}
                      aria-pressed={kefasihan === l}
                      className={`min-h-11 py-1 text-xs font-bold rounded-lg transition ${
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
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {kelancaran}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {(['Perlu Bimbingan', 'Baik', 'Mutqin'] as AspekKualitas[]).map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setKelancaran(l)}
                      aria-pressed={kelancaran === l}
                      className={`min-h-11 py-1 text-xs font-bold rounded-lg transition ${
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
              <label className="block text-sm font-semibold text-slate-800">
                Catatan Ustadz & Rekomendasi Khusus
              </label>
              <span className="text-xs text-slate-500">Opsional</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {(tipeKelas === 'Kelas Istimewa' ? QUICK_NOTES_ISTIMEWA : QUICK_NOTES_JILID).map((qn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCatatan(qn)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                >
                  + {qn}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              aria-label="Catatan Pembelajaran"
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
              disabled={isSubmitting}
              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !idSantri}
              className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 active:bg-amber-950 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
