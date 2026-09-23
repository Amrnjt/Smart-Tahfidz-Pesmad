import { SURAH_LIST } from '../data/quranSurahs';
import { KURIKULUM_JILID_UMMI_DEWASA, KURIKULUM_KELAS_ISTIMEWA } from '../data/kurikulumTemplates';
import type { BinnadzorRecord, MurojaahRecord, PembelajaranRecord, ZiyadahRecord } from '../types';

export interface QuranContinuation {
  surahName: string;
  surahNumber: number;
  ayatAwal: number;
  reachedQuranEnd: boolean;
}

function resolveSurahIndex(surah?: string, surahNumber?: number): number {
  if (typeof surahNumber === 'number') {
    const byNumber = SURAH_LIST.findIndex(item => item.number === surahNumber);
    if (byNumber >= 0) return byNumber;
  }
  if (surah) {
    const normalized = surah.trim().toLowerCase();
    const byName = SURAH_LIST.findIndex(item => item.nameLatin.trim().toLowerCase() === normalized);
    if (byName >= 0) return byName;
  }
  return 0;
}

export function getNextQuranContinuation(
  record: Pick<ZiyadahRecord, 'surah' | 'surahNumber' | 'ayatAkhir'>
): QuranContinuation {
  const index = resolveSurahIndex(record.surah, record.surahNumber);
  const current = SURAH_LIST[index] || SURAH_LIST[0];
  const lastAyat = Math.max(1, Number(record.ayatAkhir) || 1);

  if (lastAyat < current.numberOfAyahs) {
    return {
      surahName: current.nameLatin,
      surahNumber: current.number,
      ayatAwal: lastAyat + 1,
      reachedQuranEnd: false
    };
  }

  const next = SURAH_LIST[index + 1];
  if (next) {
    return {
      surahName: next.nameLatin,
      surahNumber: next.number,
      ayatAwal: 1,
      reachedQuranEnd: false
    };
  }

  return {
    surahName: current.nameLatin,
    surahNumber: current.number,
    ayatAwal: current.numberOfAyahs,
    reachedQuranEnd: true
  };
}

export function getMurojaahQuranProgress(record: MurojaahRecord): {
  surah: string;
  surahNumber?: number;
  ayatAkhir: number;
} | null {
  if (record.surah && typeof record.ayatAkhir === 'number') {
    return {
      surah: record.surah,
      surahNumber: record.surahNumber,
      ayatAkhir: record.ayatAkhir
    };
  }

  const match = (record.surahAtauJuz || '').match(/^(.+?)\s*\(Ayat\s+(\d+)\s*-\s*(\d+)\)$/i);
  if (!match) return null;

  const surah = match[1].trim();
  const surahMeta = SURAH_LIST.find(item => item.nameLatin.toLowerCase() === surah.toLowerCase());
  return {
    surah,
    surahNumber: surahMeta?.number,
    ayatAkhir: Number(match[3])
  };
}

export function getNextMurojaahContinuation(record: MurojaahRecord): QuranContinuation | null {
  const progress = getMurojaahQuranProgress(record);
  if (!progress) return null;
  return getNextQuranContinuation({
    surah: progress.surah,
    surahNumber: progress.surahNumber,
    ayatAkhir: progress.ayatAkhir
  });
}

export type BinnadzorContinuation =
  | { mode: 'surah'; surahName: string; surahNumber: number; ayatAwal: number }
  | { mode: 'halaman'; halamanAwal: number }
  | { mode: 'juz'; juzNumber: number };

export function getNextBinnadzorContinuation(record: BinnadzorRecord): BinnadzorContinuation {
  if (record.modeInput === 'halaman' || typeof record.halamanAwal === 'number' || typeof record.halamanAkhir === 'number') {
    const lastPage = Number(record.halamanAkhir ?? record.halamanAwal ?? 1);
    return { mode: 'halaman', halamanAwal: Math.min(604, Math.max(1, lastPage + 1)) };
  }

  if (record.modeInput === 'juz' || typeof record.juz === 'number') {
    const lastJuz = Number(record.juz || 1);
    return { mode: 'juz', juzNumber: Math.min(30, Math.max(1, lastJuz + 1)) };
  }

  const quran = getNextQuranContinuation({
    surah: record.surah || SURAH_LIST[0].nameLatin,
    surahNumber: record.surahNumber,
    ayatAkhir: Number(record.ayatAkhir || 1)
  });
  return {
    mode: 'surah',
    surahName: quran.surahName,
    surahNumber: quran.surahNumber,
    ayatAwal: quran.ayatAwal
  };
}

export type PembelajaranContinuation =
  | { tipeKelas: 'Jilid'; index: number; halaman: number; pokokBahasan: string }
  | { tipeKelas: 'Kelas Istimewa'; index: number; halaman: number };

function shouldRepeatPage(status?: PembelajaranRecord['statusKenaikan']): boolean {
  return status === 'Ulang Halaman' || status === 'Perlu Pendampingan Khusus';
}

export function getNextPembelajaranContinuation(record: PembelajaranRecord): PembelajaranContinuation | null {
  if (record.tipeKelas === 'Jilid') {
    const currentIndex = Math.max(
      0,
      KURIKULUM_JILID_UMMI_DEWASA.findIndex(item =>
        item.tingkat.toLowerCase() === String(record.jilid || '').trim().toLowerCase()
      )
    );
    const current = KURIKULUM_JILID_UMMI_DEWASA[currentIndex] || KURIKULUM_JILID_UMMI_DEWASA[0];
    const currentPage = Math.max(1, Number(record.halaman || 1));

    if (record.statusKenaikan === 'Naik Jilid' && KURIKULUM_JILID_UMMI_DEWASA[currentIndex + 1]) {
      const nextIndex = currentIndex + 1;
      const next = KURIKULUM_JILID_UMMI_DEWASA[nextIndex];
      return { tipeKelas: 'Jilid', index: nextIndex, halaman: 1, pokokBahasan: next.pokokBahasan[0] || '' };
    }

    if (shouldRepeatPage(record.statusKenaikan)) {
      return {
        tipeKelas: 'Jilid',
        index: currentIndex,
        halaman: currentPage,
        pokokBahasan: record.pokokBahasan || current.pokokBahasan[0] || ''
      };
    }

    const nextPage = currentPage + 1;
    if (nextPage > current.totalHalaman && KURIKULUM_JILID_UMMI_DEWASA[currentIndex + 1]) {
      const nextIndex = currentIndex + 1;
      const next = KURIKULUM_JILID_UMMI_DEWASA[nextIndex];
      return { tipeKelas: 'Jilid', index: nextIndex, halaman: 1, pokokBahasan: next.pokokBahasan[0] || '' };
    }

    return {
      tipeKelas: 'Jilid',
      index: currentIndex,
      halaman: Math.min(current.totalHalaman, nextPage),
      pokokBahasan: record.pokokBahasan || current.pokokBahasan[0] || ''
    };
  }

  if (record.tipeKelas === 'Kelas Istimewa') {
    const currentIndex = Math.max(
      0,
      KURIKULUM_KELAS_ISTIMEWA.findIndex(item =>
        item.tingkat.toLowerCase() === String(record.tahapIstimewa || '').trim().toLowerCase()
      )
    );
    const current = KURIKULUM_KELAS_ISTIMEWA[currentIndex] || KURIKULUM_KELAS_ISTIMEWA[0];
    const currentPage = Math.max(1, Number(record.halaman || 1));

    if (record.statusKenaikan === 'Naik Jilid' && KURIKULUM_KELAS_ISTIMEWA[currentIndex + 1]) {
      return { tipeKelas: 'Kelas Istimewa', index: currentIndex + 1, halaman: 1 };
    }

    if (shouldRepeatPage(record.statusKenaikan)) {
      return { tipeKelas: 'Kelas Istimewa', index: currentIndex, halaman: currentPage };
    }

    const nextPage = currentPage + 1;
    if (nextPage > current.totalHalaman && KURIKULUM_KELAS_ISTIMEWA[currentIndex + 1]) {
      return { tipeKelas: 'Kelas Istimewa', index: currentIndex + 1, halaman: 1 };
    }

    return {
      tipeKelas: 'Kelas Istimewa',
      index: currentIndex,
      halaman: Math.min(current.totalHalaman, nextPage)
    };
  }

  return null;
}
