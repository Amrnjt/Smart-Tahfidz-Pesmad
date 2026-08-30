export type UserRole = 'Ustadz' | 'Wali' | 'Santri';

export type PredikatNilai = 'Sangat Lancar' | 'Lancar' | 'Perlu Ulang';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  nama: string;
  idSantri?: string;
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
  nilai: PredikatNilai;
  catatan: string;
  inputBy: string;
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

export type ActiveTab = 'dashboard' | 'ziyadah' | 'murojaah' | 'binnadzor' | 'riwayat' | 'mushaf' | 'santri';
