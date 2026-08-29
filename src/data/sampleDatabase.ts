import { User, Santri, ZiyadahRecord, MurojaahRecord } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: "USR-001",
    username: "ustadz1",
    password: "123",
    role: "Ustadz",
    nama: "Ustadz Abdullah Robbani, Lc.",
    idSantri: ""
  },
  {
    id: "USR-002",
    username: "ustadz2",
    password: "123",
    role: "Ustadz",
    nama: "Ustadzah Fatimah Azzahra, S.Pd.I",
    idSantri: ""
  },
  {
    id: "USR-003",
    username: "wali_str001",
    password: "123",
    role: "Wali",
    nama: "Bpk. Hendra Wijaya (Wali M. Fatih)",
    idSantri: "STR001"
  },
  {
    id: "USR-004",
    username: "wali_str002",
    password: "123",
    role: "Wali",
    nama: "Ibu Siti Aisyah (Wali Maryam)",
    idSantri: "STR002"
  },
  {
    id: "USR-005",
    username: "STR001",
    password: "123",
    role: "Santri",
    nama: "Muhammad Fatih",
    idSantri: "STR001"
  },
  {
    id: "USR-006",
    username: "STR002",
    password: "123",
    role: "Santri",
    nama: "Maryam Al-Khansa",
    idSantri: "STR002"
  },
  {
    id: "USR-007",
    username: "STR003",
    password: "123",
    role: "Santri",
    nama: "Ahmad Zaidan",
    idSantri: "STR003"
  }
];

export const INITIAL_SANTRI: Santri[] = [
  {
    idSantri: "STR001",
    namaSantri: "Muhammad Fatih",
    kelas: "Tahfidz A (Ikhwan)",
    targetHafalan: "Juz 30 & Juz 29 (60 Surah)",
    totalHafalanSelesai: 28,
    waliNama: "Bpk. Hendra Wijaya",
    waliKontak: "0812-3456-7890"
  },
  {
    idSantri: "STR002",
    namaSantri: "Maryam Al-Khansa",
    kelas: "Tahfidz B (Akhwat)",
    targetHafalan: "Juz 30 (37 Surah)",
    totalHafalanSelesai: 35,
    waliNama: "Ibu Siti Aisyah",
    waliKontak: "0813-9876-5432"
  },
  {
    idSantri: "STR003",
    namaSantri: "Ahmad Zaidan",
    kelas: "Tahfidz A (Ikhwan)",
    targetHafalan: "Juz 30 (37 Surah)",
    totalHafalanSelesai: 19,
    waliNama: "Bpk. Ridwan Fauzi",
    waliKontak: "0856-1122-3344"
  },
  {
    idSantri: "STR004",
    namaSantri: "Zahra Humaira",
    kelas: "Tahfidz B (Akhwat)",
    targetHafalan: "Juz 30 & Juz 1 (40 Surah)",
    totalHafalanSelesai: 32,
    waliNama: "Bpk. Bambang Sutrisno",
    waliKontak: "0878-5544-3322"
  },
  {
    idSantri: "STR005",
    namaSantri: "Bilal Abdul Aziz",
    kelas: "Tahfidz A (Ikhwan)",
    targetHafalan: "Juz 30 (37 Surah)",
    totalHafalanSelesai: 14,
    waliNama: "Ibu Nurhayati",
    waliKontak: "0819-0099-8877"
  }
];

export const INITIAL_ZIYADAH: ZiyadahRecord[] = [
  {
    id: "ZYD-101",
    timestamp: "2026-08-28 07:30",
    idSantri: "STR001",
    namaSantri: "Muhammad Fatih",
    surah: "An-Naba'",
    surahNumber: 78,
    ayatAwal: 1,
    ayatAkhir: 20,
    nilai: "Sangat Lancar",
    catatan: "Makhraj huruf ra dan 'ain sangat bersih, tajwid konsisten ghunnah 2 harakat.",
    inputBy: "Ustadz Abdullah Robbani, Lc."
  },
  {
    id: "ZYD-102",
    timestamp: "2026-08-28 08:15",
    idSantri: "STR002",
    namaSantri: "Maryam Al-Khansa",
    surah: "Al-Mulk",
    surahNumber: 67,
    ayatAwal: 1,
    ayatAkhir: 15,
    nilai: "Sangat Lancar",
    catatan: "Masya Allah bacaan tartil dan pengucapan tebal-tipis huruf sudah tepat.",
    inputBy: "Ustadzah Fatimah Azzahra, S.Pd.I"
  },
  {
    id: "ZYD-103",
    timestamp: "2026-08-27 16:00",
    idSantri: "STR003",
    namaSantri: "Ahmad Zaidan",
    surah: "At-Takwir",
    surahNumber: 81,
    ayatAwal: 1,
    ayatAkhir: 29,
    nilai: "Lancar",
    catatan: "Perlu sedikit perhatian pada mad jaiz munfasil di ayat 15-18.",
    inputBy: "Ustadz Abdullah Robbani, Lc."
  },
  {
    id: "ZYD-104",
    timestamp: "2026-08-27 16:45",
    idSantri: "STR001",
    namaSantri: "Muhammad Fatih",
    surah: "An-Nazi'at",
    surahNumber: 79,
    ayatAwal: 1,
    ayatAkhir: 25,
    nilai: "Lancar",
    catatan: "Bagus, lanjutkan setoran ayat 26-46 besok pagi.",
    inputBy: "Ustadz Abdullah Robbani, Lc."
  },
  {
    id: "ZYD-105",
    timestamp: "2026-08-26 07:45",
    idSantri: "STR004",
    namaSantri: "Zahra Humaira",
    surah: "Al-A'la",
    surahNumber: 87,
    ayatAwal: 1,
    ayatAkhir: 19,
    nilai: "Sangat Lancar",
    catatan: "Khatam Surah Al-A'la dengan nilai istimewa.",
    inputBy: "Ustadzah Fatimah Azzahra, S.Pd.I"
  }
];

export const INITIAL_MUROJAAH: MurojaahRecord[] = [
  {
    id: "MRJ-201",
    timestamp: "2026-08-28 09:00",
    idSantri: "STR001",
    namaSantri: "Muhammad Fatih",
    surahAtauJuz: "Surah Ad-Duha s.d An-Nas (Juz 30)",
    nilai: "Sangat Lancar",
    catatan: "Murojaah juz amma bagian akhir lancar tanpa terbata.",
    inputBy: "Ustadz Abdullah Robbani, Lc."
  },
  {
    id: "MRJ-202",
    timestamp: "2026-08-28 09:30",
    idSantri: "STR002",
    namaSantri: "Maryam Al-Khansa",
    surahAtauJuz: "Juz 30 Penuh",
    nilai: "Sangat Lancar",
    catatan: "Ujian kelancaran Juz 30 tuntas, siap lanjut fokus ke Juz 29.",
    inputBy: "Ustadzah Fatimah Azzahra, S.Pd.I"
  },
  {
    id: "MRJ-203",
    timestamp: "2026-08-27 17:15",
    idSantri: "STR003",
    namaSantri: "Ahmad Zaidan",
    surahAtauJuz: "Surah Al-Buruj & At-Tariq",
    nilai: "Perlu Ulang",
    catatan: "Masih tertukar di awalan ayat Surah At-Tariq. Silakan diulang bersama orang tua di rumah.",
    inputBy: "Ustadz Abdullah Robbani, Lc."
  },
  {
    id: "MRJ-204",
    timestamp: "2026-08-26 16:30",
    idSantri: "STR005",
    namaSantri: "Bilal Abdul Aziz",
    surahAtauJuz: "Surah An-Naba' (Ayat 1 - 40)",
    nilai: "Lancar",
    catatan: "Kelancaran cukup bagus, perkuat waqaf dan ibtida'.",
    inputBy: "Ustadz Abdullah Robbani, Lc."
  }
];
