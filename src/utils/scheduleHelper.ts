import { addDaysToDateInput, APP_TIME_ZONE } from './dateFormatter';

/**
 * Konfigurasi Jadwal Setoran Tahfidz:
 * - Hari Aktif: Minggu (0), Senin (1), Selasa (2), Rabu (3) (Konteks operasional: Minggu malam - Rabu malam)
 * - Hari Nonaktif: Kamis (4), Jumat (5), Sabtu (6)
 * - Zona Waktu: Asia/Jakarta
 */
export const SCHEDULE_TIMEZONE = APP_TIME_ZONE; // 'Asia/Jakarta'

export const ACTIVE_SETORAN_WEEKDAYS = [0, 1, 2, 3] as const; // 0=Ahad/Minggu, 1=Senin, 2=Selasa, 3=Rabu
export const INACTIVE_SETORAN_WEEKDAYS = [4, 5, 6] as const; // 4=Kamis, 5=Jumat, 6=Sabtu

/**
 * Mengambil indeks hari (0=Minggu, 1=Senin, ..., 6=Sabtu) berdasarkan zona waktu Asia/Jakarta.
 * Menjamin tidak mengandalkan parsing label teks UI.
 */
export function getJakartaWeekday(dateInput: string | Date): number {
  let date: Date;
  if (typeof dateInput === 'string') {
    // String format: 'YYYY-MM-DD' atau 'YYYY-MM-DD HH:mm' atau ISO
    const clean = dateInput.trim().slice(0, 10);
    const [year, month, day] = clean.split('-').map(Number);
    // Jam 12:00 UTC pada tanggal tersebut memastikan di zona Asia/Jakarta (+07:00) jatuh pada tanggal yang sama (19:00 WIB)
    date = new Date(Date.UTC(year, month - 1, day, 5, 0, 0));
  } else {
    date = dateInput;
  }

  // Gunakan 'en-US' dengan timeZone 'Asia/Jakarta' untuk memetakan nama hari ke angka 0-6
  const weekdayShort = new Intl.DateTimeFormat('en-US', {
    timeZone: SCHEDULE_TIMEZONE,
    weekday: 'short',
  }).format(date);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekdayMap[weekdayShort] ?? 0;
}

/**
 * Menentukan apakah tanggal tertentu merupakan hari aktif setor (Minggu, Senin, Selasa, Rabu)
 * Berdasarkan zona waktu Asia/Jakarta.
 */
export function isSetoranActiveDay(dateInput: string | Date): boolean {
  const weekday = getJakartaWeekday(dateInput);
  return weekday === 0 || weekday === 1 || weekday === 2 || weekday === 3;
}

/**
 * Mengembalikan tanggal (YYYY-MM-DD) hari aktif sebelumnya.
 * - Senin (1) -> Minggu (0) (1 hari sebelumnya)
 * - Selasa (2) -> Senin (1) (1 hari sebelumnya)
 * - Rabu (3) -> Selasa (2) (1 hari sebelumnya)
 * - Minggu (0) -> Rabu siklus sebelumnya (4 hari sebelumnya)
 * - Kamis (4) -> Rabu (1 hari sebelumnya)
 * - Jumat (5) -> Rabu (2 hari sebelumnya)
 * - Sabtu (6) -> Rabu (3 hari sebelumnya)
 */
export function getPreviousActiveDayKey(dateKey: string): string {
  const weekday = getJakartaWeekday(dateKey);
  let daysBack = 1;
  if (weekday === 0) {
    daysBack = 4; // Minggu mundur ke Rabu sebelumnya
  } else if (weekday === 4) {
    daysBack = 1; // Kamis mundur ke Rabu
  } else if (weekday === 5) {
    daysBack = 2; // Jumat mundur ke Rabu
  } else if (weekday === 6) {
    daysBack = 3; // Sabtu mundur ke Rabu
  }
  return addDaysToDateInput(dateKey, -daysBack);
}

export interface MomentumResult {
  momentumLabel: string;
  isInactiveDay: boolean;
  delta?: number;
  prevActiveKey?: string;
  prevActiveCount?: number;
  status: 'increased' | 'decreased' | 'equal' | 'inactive';
}

/**
 * Menghitung momentum ritme setoran:
 * - Untuk hari aktif: membandingkan dengan hari aktif sebelumnya
 *   (Senin vs Minggu, Selasa vs Senin, Rabu vs Selasa, Minggu vs Rabu sebelumnya).
 *   Format: "+8 dari hari aktif sebelumnya", "-3 dari hari aktif sebelumnya", "Sama dengan hari aktif sebelumnya".
 * - Untuk hari nonaktif (Kamis-Sabtu): tidak menampilkan penurunan performa,
 *   melainkan status netral seperti "Hari nonaktif setor" atau "Aktif kembali Minggu malam".
 */
export function calculateSetoranMomentum(
  todayKey: string,
  todayCount: number,
  activities: { timestamp: string }[]
): MomentumResult {
  const weekday = getJakartaWeekday(todayKey);
  const isActive = isSetoranActiveDay(todayKey);

  if (!isActive) {
    // Kamis (4), Jumat (5), Sabtu (6)
    const label = weekday === 6 ? 'Aktif kembali Minggu malam' : 'Hari nonaktif setor';
    return {
      momentumLabel: label,
      isInactiveDay: true,
      status: 'inactive',
    };
  }

  // Hari aktif setor (Minggu, Senin, Selasa, Rabu)
  const prevActiveKey = getPreviousActiveDayKey(todayKey);
  const prevActiveCount = activities.filter((a) => a.timestamp.startsWith(prevActiveKey)).length;
  const delta = todayCount - prevActiveCount;

  let momentumLabel = 'Sama dengan hari aktif sebelumnya';
  let status: 'increased' | 'decreased' | 'equal' = 'equal';

  if (delta > 0) {
    momentumLabel = `+${delta} dari hari aktif sebelumnya`;
    status = 'increased';
  } else if (delta < 0) {
    momentumLabel = `${delta} dari hari aktif sebelumnya`;
    status = 'decreased';
  }

  return {
    momentumLabel,
    isInactiveDay: false,
    delta,
    prevActiveKey,
    prevActiveCount,
    status,
  };
}
