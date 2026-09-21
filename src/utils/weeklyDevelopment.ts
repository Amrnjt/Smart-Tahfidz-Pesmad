import type { PredikatNilai } from '../types';
import { addDaysToDateInput } from './dateFormatter';

const LEVELS: PredikatNilai[] = ['Mengulang', 'Kurang', 'Baik', 'Sangat Baik'];

export function getWeekStart(timestamp: string): string | null {
  const datePart = timestamp?.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const date = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== datePart) return null;
  return addDaysToDateInput(datePart, -date.getUTCDay());
}

export interface WeeklyQualityRow extends Record<PredikatNilai, number> {
  weekStart: string;
  total: number;
  counts: Record<PredikatNilai, number>;
}

export function buildWeeklyQuality(
  records: { timestamp: string; nilai: PredikatNilai }[],
  today: string,
  weeks = 6,
): WeeklyQualityRow[] {
  const currentWeek = getWeekStart(today);
  if (!currentWeek || weeks < 1) return [];
  const rows = Array.from({ length: weeks }, (_, index) => {
    const weekStart = addDaysToDateInput(currentWeek, -7 * (weeks - index - 1));
    const counts = { Mengulang: 0, Kurang: 0, Baik: 0, 'Sangat Baik': 0 };
    return { weekStart, counts, total: 0, Mengulang: 0, Kurang: 0, Baik: 0, 'Sangat Baik': 0 } satisfies WeeklyQualityRow;
  });
  const byWeek = new Map(rows.map(row => [row.weekStart, row]));
  for (const record of records) {
    const row = byWeek.get(getWeekStart(record.timestamp) || '');
    if (!row || !LEVELS.includes(record.nilai)) continue;
    row.total++;
    row.counts[record.nilai]++;
  }
  for (const row of rows) {
    if (!row.total) continue;
    let used = 0;
    for (const level of LEVELS.slice(0, -1)) {
      row[level] = Math.round(row.counts[level] / row.total * 100);
      used += row[level];
    }
    row['Sangat Baik'] = 100 - used;
  }
  return rows;
}
