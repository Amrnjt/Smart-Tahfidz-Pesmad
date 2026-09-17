export type UserRole = 'Superadmin' | 'Pimpinan' | 'Ustadz' | 'Wali' | 'Santri';

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