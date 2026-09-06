export type UserRole = 'Ustadz' | 'Wali' | 'Santri';

export type PredikatNilai = 'Mengulang' | 'Kurang' | 'Baik' | 'Sangat Baik';

export const PREDIKAT_NILAI_OPTIONS: { value: PredikatNilai; label: string; arab: string; emoji: string }[] = [
  { value: 'Mengulang', label: 'Mengulang (I\'adah)', arab: 'I\'adah', emoji: '🔴' },
  { value: 'Kurang', label: 'Kurang (Naqish)', arab: 'Naqish', emoji: '🟠' },
  { value: 'Baik', label: 'Baik (Jayyid)', arab: 'Jayyid', emoji: '🟡' },
  { value: 'Sangat Baik', label: 'Sangat Baik (Jayyid Jiddan)', arab: 'Jayyid Jiddan', emoji: '🟢' },
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

export interface Santri {
  idSantri: string;
  namaSantri: string;
  kelas: string;
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

export type ActiveTab = 'dashboard' | 'ziyadah' | 'murojaah' | 'binnadzor' | 'pembelajaran' | 'riwayat' | 'mushaf' | 'santri' | 'kelas';

export type StatusJamaah = 'Jamaah' | 'Berhalangan' | 'Sakit';

export const STATUS_JAMAAH_OPTIONS: { value: StatusJamaah; label: string; color: string }[] = [
  { value: 'Jamaah', label: 'Jamaah', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'Berhalangan', label: 'Berhalangan', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'Sakit', label: 'Sakit', color: 'bg-rose-100 text-rose-800 border-rose-200' },
];

export interface PantauanLiburanRecord {
  id: string;
  timestamp: string;
  idSantri: string;
  namaSantri?: string;
  tanggal: string;
  wiridWaqiah: boolean; // Surah al-Waqi'ah
  wiridMulk: boolean; // Surah al-Mulk
  wiridInsyirah: boolean; // Surah al-Insyirah
  statusJamaah: StatusJamaah;
  catatan?: string;
  inputBy: string;
}

export interface ProgramPantauanConfig {
  enabled: boolean;
}
