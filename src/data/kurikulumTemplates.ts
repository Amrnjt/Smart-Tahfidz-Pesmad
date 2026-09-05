import { MateriPembelajaran, TipeKelas } from '../types';

export interface KurikulumTemplate {
  id: string;
  nama: string;
  deskripsi: string;
  tipeKelasTarget: TipeKelas;
  materi: Omit<MateriPembelajaran, 'id'>[];
}

export const TEMPLATE_KURIKULUM_UMMI_DEWASA: KurikulumTemplate = {
  id: 'tmpl-ummi-dewasa',
  nama: 'Metode Ummi Jilid Dewasa (Jilid 1, 2, 3 & Tajwid)',
  deskripsi: 'Standar kurikulum Ummi Dewasa untuk santri remaja/dewasa dari dasar makhroj, harakat, sukun, tasydid, hingga hukum nun mati dan mad far\'i.',
  tipeKelasTarget: 'Jilid',
  materi: [
    // Ummi Dewasa Jilid 1
    {
      judul: 'Ummi Dewasa 1: Hal. 1 - 8 (Pengenalan Huruf Tunggal Hijaiyah & Fathah)',
      targetHalaman: 'Hal. 1 - 8',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Pengenalan bunyi huruf hijaiyah tunggal alif sampai ya dengan harakat fathah (a) secara langsung tanpa mengeja.',
      urutan: 1
    },
    {
      judul: 'Ummi Dewasa 1: Hal. 9 - 16 (Harakat Kasrah & Dhammah)',
      targetHalaman: 'Hal. 9 - 16',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Pelafalan vokal i dan u serta kombinasi 3 harakat (a - i - u) secara tartil dan tegas.',
      urutan: 2
    },
    {
      judul: 'Ummi Dewasa 1: Hal. 17 - 24 (Mad Thabi\'i Alif, Ya Sukun, Wawu Sukun)',
      targetHalaman: 'Hal. 17 - 24',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Penguasaan bacaan panjang 2 harakat (ayunan 1 alif) secara konsisten dan tidak berlebihan.',
      urutan: 3
    },
    {
      judul: 'Ummi Dewasa 1: Hal. 25 - 32 (Pemantapan Kelancaran & Evaluasi Jilid 1)',
      targetHalaman: 'Hal. 25 - 32',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Latihan rangkaian kata 3-4 huruf dan evaluasi kesiapan naik ke Jilid 2.',
      urutan: 4
    },
    // Ummi Dewasa Jilid 2
    {
      judul: 'Ummi Dewasa 2: Hal. 1 - 10 (Huruf Sukun & Pelafalan Qalqalah/Hams)',
      targetHalaman: 'Hal. 1 - 10',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Cara membunyikan huruf mati (sukun), pantulan qalqalah (baju di toko), dan hams (fa, tsa, ha, kho, dst).',
      urutan: 5
    },
    {
      judul: 'Ummi Dewasa 2: Hal. 11 - 18 (Tasydid & Tanwin: Fathatain, Kasratain, Dhammatain)',
      targetHalaman: 'Hal. 11 - 18',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Penekanan huruf bertasydid dan bunyi an, in, un pada tanwin.',
      urutan: 6
    },
    {
      judul: 'Ummi Dewasa 2: Hal. 19 - 28 (Alif Lam Syamsiyah & Alif Lam Qamariyah)',
      targetHalaman: 'Hal. 19 - 28',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Pembeda bacaan idzhar qamariyah (al- dibaca jelas) dan idgham syamsiyah (al- lebur ke huruf berikutnya).',
      urutan: 7
    },
    {
      judul: 'Ummi Dewasa 2: Hal. 29 - 38 (Tanda Waqaf & Evaluasi Kenaikan Jilid 2)',
      targetHalaman: 'Hal. 29 - 38',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Pengenalan tanda berhenti (mim, tho, jim, qala, shala, la) dan evaluasi jilid 2.',
      urutan: 8
    },
    // Ummi Dewasa Jilid 3
    {
      judul: 'Ummi Dewasa 3: Hal. 1 - 12 (Hukum Nun Sukun & Tanwin: Idzhar, Idgham)',
      targetHalaman: 'Hal. 1 - 12',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Idzhar Halqi (jelas), Idgham Bighunnah (dengung 2 harakat), dan Idgham Bilaghunnah.',
      urutan: 9
    },
    {
      judul: 'Ummi Dewasa 3: Hal. 13 - 22 (Iqlab & Ikhfa Haqiqi 15 Huruf)',
      targetHalaman: 'Hal. 13 - 22',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Perubahan nun sukun menjadi mim saat bertemu Ba (Iqlab) dan dengung samar ikhfa.',
      urutan: 10
    },
    {
      judul: 'Ummi Dewasa 3: Hal. 23 - 32 (Hukum Mim Mati & Mad Far\'i)',
      targetHalaman: 'Hal. 23 - 32',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Ikhfa syafawi, idgham mimi, idzhar syafawi, mad wajib muttashil, dan mad jaiz munfashil.',
      urutan: 11
    },
    {
      judul: 'Ummi Dewasa 3: Hal. 33 - 40 (Gharib, Musykilat & Munaqosyah Jilid)',
      targetHalaman: 'Hal. 33 - 40',
      kategori: 'Ummi Dewasa',
      deskripsi: 'Bacaan khusus (saktah, imalah, isymam, tashil) dan kelulusan menuju Al-Qur\'an Binnadzor.',
      urutan: 12
    }
  ]
};

export const TEMPLATE_KURIKULUM_KELAS_ISTIMEWA: KurikulumTemplate = {
  id: 'tmpl-kelas-istimewa',
  nama: 'Bimbingan Khusus & Remedial Intensif (Capaian di Bawah Rata-rata)',
  deskripsi: 'Kurikulum pendampingan personal bagi santri yang mengalami hambatan pelafalan huruf, kelancaran lambat, atau kesulitan membedakan harakat dan huruf serupa.',
  tipeKelasTarget: 'Kelas Istimewa',
  materi: [
    {
      judul: 'Modul 1: Terapi Makhroj Huruf Tenggorokan (Halqi: Hamzah, \'Ain, Ha, Kha, Ghoin)',
      targetHalaman: 'Target Personal',
      kategori: 'Kelas Istimewa',
      deskripsi: 'Latihan cermin dan perabaan getaran pita suara untuk membedakan \'Ain dengan Hamzah, serta Ha dada dengan Kha tenggorokan.',
      urutan: 1
    },
    {
      judul: 'Modul 2: Terapi Huruf Lidah & Gigi (Tsa, Sin, Shod, Dzal, Zai, Zho)',
      targetHalaman: 'Target Personal',
      kategori: 'Kelas Istimewa',
      deskripsi: 'Memperbaiki bunyi desis dan letak ujung lidah agar tidak tertukar antara sin (tipis) dengan shod (tebal).',
      urutan: 2
    },
    {
      judul: 'Modul 3: Penguatan Huruf Sambung & Bentuk Awal-Tengah-Akhir',
      targetHalaman: 'Target Personal',
      kategori: 'Kelas Istimewa',
      deskripsi: 'Membiasakan santri mengenali perubahan wujud huruf ketika disambung tanpa ragu.',
      urutan: 3
    },
    {
      judul: 'Modul 4: Konsistensi Ayunan Panjang-Pendek (Mad 2 Harakat)',
      targetHalaman: 'Target Personal',
      kategori: 'Kelas Istimewa',
      deskripsi: 'Menghilangkan kebiasaan membaca terseret atau menahan huruf pendek yang bukan mad.',
      urutan: 4
    },
    {
      judul: 'Modul 5: Talaqqi Perlahan 1 Baris per Sesi (Pencegahan Mengeja Terbata-bata)',
      targetHalaman: 'Target Personal',
      kategori: 'Kelas Istimewa',
      deskripsi: 'Pendampingan ustadz menyimak per baris kalimat secara sabar hingga santri membaca mengalir tanpa mengeja satu per satu.',
      urutan: 5
    },
    {
      judul: 'Modul 6: Pendampingan Mental, Percaya Diri & Remedial Mandiri',
      targetHalaman: 'Target Personal',
      kategori: 'Kelas Istimewa',
      deskripsi: 'Konseling motivasi belajar, penataan target harian realistis, dan apresiasi setiap kemajuan kecil santri.',
      urutan: 6
    }
  ]
};

export const TEMPLATE_KURIKULUM_BINNADZOR: KurikulumTemplate = {
  id: 'tmpl-binnadzor-kualitas',
  nama: 'Peningkatan Kualitas Tajwid, Makhroj, Fashohah & Kelancaran',
  deskripsi: 'Fokus tilawah mushaf Al-Qur\'an untuk mematangkan hukum tajwid praktis, ketepatan makhroj, kefasihan bacaan (fashohah), serta kelancaran tartil sebelum/mengiringi hafalan.',
  tipeKelasTarget: 'Binnadzor',
  materi: [
    {
      judul: 'Fokus 1: Makharijul Huruf & Sifatul Huruf dalam Tilawah Mushaf',
      targetHalaman: 'Juz 1 - 5',
      kategori: 'Binnadzor',
      deskripsi: 'Menjaga ketepatan sifat hams, jahr, isti\'la, dan kalkalah saat tilawah berkecepatan sedang (tadwir/tartil).',
      urutan: 1
    },
    {
      judul: 'Fokus 2: Ketukan Ghunnah & Hukum Nun/Mim Sukun Terapan',
      targetHalaman: 'Juz 6 - 10',
      kategori: 'Binnadzor',
      deskripsi: 'Penekanan dengung sempurna 2 harakat pada ikhfa, idgham bighunnah, iqlab, dan ikhfa syafawi.',
      urutan: 2
    },
    {
      judul: 'Fokus 3: Fashohah & Konsistensi Mad (2, 4, 5, 6 Harakat)',
      targetHalaman: 'Juz 11 - 20',
      kategori: 'Binnadzor',
      deskripsi: 'Kefasihan pengucapan ayat dan disiplin durasi mad wajib muttashil, mad jaiz munfashil, dan mad lazim.',
      urutan: 3
    },
    {
      judul: 'Fokus 4: Kelancaran, Nafas Panjang, Serta Waqaf & Ibtida yang Benar',
      targetHalaman: 'Juz 21 - 30',
      kategori: 'Binnadzor',
      deskripsi: 'Kecakapan mengatur nafas, berhenti pada tempat yang baik (waqaf hasan/kafi/tamm), dan memulai kembali (ibtida) dengan makna utuh.',
      urutan: 4
    }
  ]
};

export const ALL_KURIKULUM_TEMPLATES = [
  TEMPLATE_KURIKULUM_UMMI_DEWASA,
  TEMPLATE_KURIKULUM_KELAS_ISTIMEWA,
  TEMPLATE_KURIKULUM_BINNADZOR,
];

// Detail Kurikulum terstruktur untuk Form Pembelajaran & Modul Bimbingan
export interface JilidUmmiDewasaDetail {
  id: string;
  tingkat: string;
  deskripsi: string;
  totalHalaman: number;
  pokokBahasan: string[];
  targetCapaian: string;
}

export const KURIKULUM_JILID_UMMI_DEWASA: JilidUmmiDewasaDetail[] = [
  {
    id: 'ummi-dewasa-1',
    tingkat: 'Ummi Dewasa Jilid 1',
    deskripsi: 'Pengenalan Huruf Tunggal Hijaiyah, Harakat Pokok (Fathah, Kasrah, Dhammah), & Mad Thabi\'i',
    totalHalaman: 32,
    pokokBahasan: [
      'Huruf Tunggal Hijaiyah Berharakat Fathah (A)',
      'Harakat Kasrah (I) & Dhammah (U) & Kombinasi Vokal',
      'Mad Thabi\'i Alif, Ya Sukun, & Wawu Sukun (2 Harakat)',
      'Kelancaran Sambung Huruf 2-4 Karakter & Evaluasi Jilid 1'
    ],
    targetCapaian: 'Membaca huruf hijaiyah berharakat pokok dan mad 2 harakat secara tartil tanpa mengeja'
  },
  {
    id: 'ummi-dewasa-2',
    tingkat: 'Ummi Dewasa Jilid 2',
    deskripsi: 'Sukun, Qalqalah, Tasydid, Tanwin, Alif Lam Syamsiyah/Qamariyah, & Tanda Waqaf',
    totalHalaman: 38,
    pokokBahasan: [
      'Huruf Mati (Sukun) & Pantulan Qalqalah (Baju Di Toko)',
      'Tasydid (Penekanan) & Tanwin (Fathatain, Kasratain, Dhammatain)',
      'Alif Lam Qamariyah (Jelas) vs Alif Lam Syamsiyah (Idgham)',
      'Tanda Waqaf Dasar & Evaluasi Kesiapan Naik Jilid 3'
    ],
    targetCapaian: 'Menguasai huruf sukun, tasydid, pembedaan alif lam, serta jeda tanda waqaf'
  },
  {
    id: 'ummi-dewasa-3',
    tingkat: 'Ummi Dewasa Jilid 3',
    deskripsi: 'Hukum Nun/Mim Sukun, Ikhfa, Idgham, Mad Wajib/Jaiz, Gharib & Munaqosyah',
    totalHalaman: 40,
    pokokBahasan: [
      'Hukum Nun Sukun & Tanwin: Idzhar, Idgham Bighunnah/Bilaghunnah',
      'Iqlab & Ikhfa Haqiqi 15 Huruf Hijaiyah',
      'Hukum Mim Sukun & Mad Far\'i (Mad Wajib/Jaiz/Aridh)',
      'Bacaan Khusus (Gharib & Musykilat) Menuju Al-Qur\'an Binnadzor'
    ],
    targetCapaian: 'Khatam metode Ummi Dewasa, siap membaca Al-Qur\'an 30 Juz secara Binnadzor Tartil'
  }
];

export interface KelasIstimewaDetail {
  id: string;
  tingkat: string;
  deskripsi: string;
  totalHalaman: number;
  targetCapaian: string;
  metodePendampingan: string;
}

export const KURIKULUM_KELAS_ISTIMEWA: KelasIstimewaDetail[] = [
  {
    id: 'istimewa-tahap-1',
    tingkat: 'Tahap 1: Terapi Makhroj & Bunyi Huruf',
    deskripsi: 'Fokus pada santri yang kesulitan melafalkan huruf tenggorokan (Halqi) dan desis gigi.',
    totalHalaman: 20,
    targetCapaian: 'Membedakan bunyi huruf serupa (Ha/Kha, \'Ain/Hamzah, Sin/Shod)',
    metodePendampingan: 'Metode cermin visual & talaqqi perabaan getaran makhroj'
  },
  {
    id: 'istimewa-tahap-2',
    tingkat: 'Tahap 2: Pengenalan Bentuk Sambung Huruf',
    deskripsi: 'Pendampingan membaca huruf ketika berada di awal, tengah, dan akhir kata.',
    totalHalaman: 25,
    targetCapaian: 'Mengenali bentuk huruf sambung tanpa ragu dan terbata-bata',
    metodePendampingan: 'Kartu peraga sambung & pengulangan pola 3 huruf'
  },
  {
    id: 'istimewa-tahap-3',
    tingkat: 'Tahap 3: Disiplin Panjang Pendek (Mad 2 Harakat)',
    deskripsi: 'Menstabilkan tempo ayunan suara agar tidak membaca terseret atau memanjangkan yang pendek.',
    totalHalaman: 25,
    targetCapaian: 'Konsistensi ayunan 2 harakat pada mad thabi\'i',
    metodePendampingan: 'Ketukan jari ustadz sebagai metronom tempo tartil'
  },
  {
    id: 'istimewa-tahap-4',
    tingkat: 'Tahap 4: Kelancaran Kalimat & Kepercayaan Diri',
    deskripsi: 'Bimbingan 1 baris per sesi untuk menghilangkan grogi dan membangun mental santri.',
    totalHalaman: 30,
    targetCapaian: 'Membaca kalimat Al-Qur\'an mengalir tenang tanpa mengeja',
    metodePendampingan: 'Simak-ulang sabar & apresiasi setiap capaian'
  }
];

export const KURIKULUM_BINNADZOR = [
  {
    id: 'bnz-1',
    nama: 'Binnadzor Kualitas Al-Qur\'an',
    fokus: 'Tajwid, Makhroj, Fashohah, dan Kelancaran Mushaf',
    tipe: 'Satu Tipe Terpadu'
  }
];
