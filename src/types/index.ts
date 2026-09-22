export type UserRole = 'Superadmin' | 'Ustadz' | 'Pimpinan' | 'Wali' | 'Santri';

export type PredikatNilai = 'Mengulang' | 'Kurang' | 'Baik' | 'Sangat Baik';

export const PREDIKAT_NILAI_OPTIONS: { value: PredikatNilai; label: string; arab: string }[] = [
  { value: 'Mengulang', label: 'Mengulang (I\'adah)', arab: 'I\'adah' },
  { value: 'Kurang', label: 'Kurang (Naqish)', arab: 'Naqish' },
  { value: 'Baik', label: 'Baik (Jayyid)', arab: 'Jayyid' },
  { value: 'Sangat Baik', label: 'Sangat Baik (Jayyid Jiddan)', arab: 'Jayyid Jiddan' },
];

export type TipeKelas =
  | 'Tahfidz'
  | 'Binnadzor'
  | 'Jilid'
  | 'Kelas Istimewa'
  | 'Binnadzor A'
  | 'Binnadzor B';

export const TIPE_KELAS_OPTIONS: TipeKelas[] = [
  'Tahfidz',
  'Binnadzor',
  'Jilid',
  'Kelas Istimewa',
];

export type AspekKualitas = 'Perlu Bimbingan' | 'Cukup' | 'Baik' | 'Sangat Baik' | 'Mutqin';

export const ASPEK_KUALITAS_OPTIONS: { value: AspekKualitas; label: string; color: string }[] = [
  { value: 'Perlu Bimbingan', label: 'Perlu Bimbingan', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { value: 'Cukup', label: 'Cukup (Maqbul)', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'Baik', label: 'Baik (Jayyid)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'Sangat Baik', label: 'Sangat Baik (Jayyid Jiddan)', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'Mutqin', label: 'Mutqin / Mumtaz', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
];

export interface MateriPembelajaran {
  id: string;
  judul: string;
  targetHalaman?: string;
  kategori?: 'Ummi Dewasa' | 'Kelas Istimewa' | 'Binnadzor' | 'Tajwid & Makhroj' | 'Lainnya';
  deskripsi?: string;
  urutan?: number;
}

export interface Kelas {
  id: string;
  namaKelas: string;
  tipeKelas: TipeKelas;
  musyrif?: string;
  musyrifId?: string;
  santriIds: string[];
  silabusMateri?: MateriPembelajaran[];
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  nama: string;
  idSantri?: string;
  kelasId?: string;
  notificationPermission?: 'default' | 'granted' | 'denied';
}

export type SatuanPendidikanFormal = 'MTs';
export const SATUAN_PENDIDIKAN_FORMAL_OPTIONS: SatuanPendidikanFormal[] = ['MTs'];

export type KelasFormal = 'VII' | 'VIII' | 'IX';
export const KELAS_FORMAL_OPTIONS: KelasFormal[] = ['VII', 'VIII', 'IX'];

export type SemesterAkademik = 'Ganjil' | 'Genap';
export const SEMESTER_AKADEMIK_OPTIONS: SemesterAkademik[] = ['Ganjil', 'Genap'];

export interface RiwayatAkademikRecord {
  id: string;
  idSantri: string;
  namaSantri: string;
  satuanPendidikan: SatuanPendidikanFormal;
  kelasFormal: KelasFormal;
  kelasAlQuran?: string;
  tahunPelajaran: string;
  semester: SemesterAkademik;
  recordedAt: string;
  recordedBy: string;
}

export interface Santri {
  idSantri: string;
  namaSantri: string;
  /**
   * Kelompok pembelajaran Al-Qur'an berdasarkan kemampuan/kecakapan santri.
   * Bukan jenjang kelas formal.
   */
  kelas: string;
  /** Satuan pendidikan formal. Tahap awal Smart Tahfidz menggunakan MTs. */
  satuanPendidikan?: SatuanPendidikanFormal;
  /** Kelas formal MTs. Terpisah dari kelas kemampuan Al-Qur'an. */
  kelasFormal?: KelasFormal;
  targetHafalan: string;
  totalHafalanSelesai?: number;
  waliNama?: string;
  waliKontak?: string;
}

export interface ZiyadahRecord {
  id: string;
  timestamp: string;
  idSantri: string;
  namaSantri?: string;
  surah: string;
  surahNumber?: number;
  ayatAwal: number;
  ayatAkhir: number;
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
}

export interface MurojaahRecord {
  id: string;
  timestamp: string;
  idSantri: string;
  namaSantri?: string;
  surahAtauJuz: string;
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
}

export interface BinnadzorRecord {
  id: string;
  timestamp: string;
  idSantri: string;
  namaSantri?: string;
  modeInput?: 'surah' | 'halaman' | 'juz';
  surah?: string;
  surahNumber?: number;
  juz?: number;
  halamanAwal?: number;
  halamanAkhir?: number;
  ayatAwal?: number;
  ayatAkhir?: number;
  materi: string;
  surahAtauHalaman?: string;
  nilai: PredikatNilai;
  // 4 Aspek Kualitas Fokus Binnadzor (Tajwid, Makhroj, Kefasihan/Fashohah, Kelancaran)
  hukumTajwid?: AspekKualitas;
  makhrojHuruf?: AspekKualitas;
  kefasihan?: AspekKualitas;
  kelancaran?: AspekKualitas;
  catatan: string;
  inputBy: string;
}

export type StatusKenaikan = 'Lanjut Halaman' | 'Ulang Halaman' | 'Naik Jilid' | 'Perlu Pendampingan Khusus';

export interface StatusKenaikanOption {
  value: StatusKenaikan;
  label: string;
  emoji: string;
}

export const STATUS_KENAIKAN_OPTIONS: StatusKenaikanOption[] = [
  { value: 'Lanjut Halaman', label: 'Lanjut Halaman', emoji: '➡️' },
  { value: 'Ulang Halaman', label: 'Ulang Halaman', emoji: '🔁' },
  { value: 'Naik Jilid', label: 'Naik Jilid', emoji: '🎉' },
  { value: 'Perlu Pendampingan Khusus', label: 'Perlu Pendampingan', emoji: '🤝' },
];

export interface PembelajaranRecord {
  id: string;
  timestamp: string;
  idSantri: string;
  namaSantri?: string;
  kelasId?: string;
  namaKelas?: string;
  tipeKelas: TipeKelas;
  jilidAtauKategori?: string; // e.g. "Ummi Dewasa Jilid 1", "Ummi Dewasa Jilid 2", "Kelas Istimewa (Remedial)"
  materiPokok?: string;      // e.g. "Hal. 12 - Mad Thabi'i" atau "Terapi Makhroj 'Ain & Ha"
  halamanAwal?: number;
  halamanAkhir?: number;
  barisAwal?: number;
  barisAkhir?: number;
  nilai: PredikatNilai;
  makhroj?: AspekKualitas;
  tajwid?: AspekKualitas;
  kelancaran?: AspekKualitas;
  fashohah?: AspekKualitas;
  catatanBimbingan?: string;
  statusKenaikan?: StatusKenaikan;
  inputBy: string;
  // Field fleksibel kompatibilitas lintas komponen
  materi?: string;
  catatan?: string;
  jilid?: string;
  halaman?: number;
  pokokBahasan?: string;
  tahapIstimewa?: string;
  kendalaSantri?: string;
  rekomendasiTindakLanjut?: string;
  hukumTajwid?: AspekKualitas;
  makhrojHuruf?: AspekKualitas;
  kefasihan?: AspekKualitas;
}

export interface SurahMeta {
  number: number;
  nameArabic: string;
  nameLatin: string;
  translation: string;
  numberOfAyahs: number;
  revelationType: 'Makkiyyah' | 'Madaniyyah';
}

export interface AyahDetail {
  number: {
    inQuran: number;
    inSurah: number;
  };
  arab: string;
  latin: string;
  translation: string;
  audio?: string;
}

export interface SurahFullDetail extends SurahMeta {
  ayahs: AyahDetail[];
  audioFull?: string;
}

export type ShalatJamaahStatus = 'Jama\'ah' | 'Berhalangan' | 'Sakit' | 'Tanpa Alasan';

export const SHALAT_STATUS_OPTIONS: { value: ShalatJamaahStatus; label: string; color: string; emoji: string }[] = [
  { value: 'Jama\'ah', label: 'Jama\'ah', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', emoji: '🕌' },
  { value: 'Berhalangan', label: 'Halangan', color: 'bg-amber-100 text-amber-800 border-amber-300', emoji: '⏳' },
  { value: 'Sakit', label: 'Sakit', color: 'bg-rose-100 text-rose-800 border-rose-300', emoji: '🩺' },
  { value: 'Tanpa Alasan', label: 'Tanpa Alasan', color: 'bg-slate-200 text-slate-900 border-slate-400', emoji: '—' },
];

export interface PantauanLiburanRecord {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm atau ISO
  tanggal: string;   // YYYY-MM-DD
  idSantri: string;
  namaSantri: string;
  kelas?: string;
  // Wirid Yaumiyyah (al-Waqi'ah, al-Mulk, al-Insyirah)
  wiridWaqiah: boolean;
  wiridMulk: boolean;
  wiridInsyirah: boolean;
  // Keaktifan Shalat Jama'ah 5 Waktu (Jama'ah | Berhalangan/Halangan | Sakit | Tanpa Alasan)
  shalatSubuh: ShalatJamaahStatus;
  shalatDzuhur: ShalatJamaahStatus;
  shalatAshar: ShalatJamaahStatus;
  shalatMaghrib: ShalatJamaahStatus;
  shalatIsya: ShalatJamaahStatus;
  catatanWali?: string;
  inputByWali?: string;
}

export interface AppConfig {
  programLiburanActive: boolean;
  programLiburanJudul?: string;
  tahunPelajaranAktif?: string;
  semesterAkademikAktif?: SemesterAkademik;
  updatedAt?: string;
  updatedBy?: string;
}

export type ActiveTab = 'dashboard' | 'ziyadah' | 'murojaah' | 'binnadzor' | 'pembelajaran' | 'riwayat' | 'mushaf' | 'santri' | 'kelas' | 'pantauan';

export type TrashRecordType = 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran';

export interface TrashRecord {
  id: string;
  recordId: string;
  recordType: TrashRecordType;
  sourceCollection: string;
  payload: Record<string, any>;
  deletedAt: string;
  deletedBy: string;
  expiresAt: string;
}

export interface CombinedHistoryItem {
  id: string;
  type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran';
  timestamp: string;
  idSantri: string;
  namaSantri: string;
  materi: string;
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
  surah?: string;
  ayatAwal?: number;
  ayatAkhir?: number;
  surahAtauJuz?: string;
  tipeKelas?: TipeKelas;
  statusKenaikan?: StatusKenaikan;
  hukumTajwid?: AspekKualitas;
  makhrojHuruf?: AspekKualitas;
  kefasihan?: AspekKualitas;
  kelancaran?: AspekKualitas;
  kendalaSantri?: string;
  rekomendasiTindakLanjut?: string;
}

