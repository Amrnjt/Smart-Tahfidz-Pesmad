import type { TipeKelas } from '../types';
import { getClassGroup } from '../utils/classUtils';

export const STORAGE_KEYS = {
  USERS: 'tahfidz_users_db_v2',
  SANTRI: 'tahfidz_santri_db_v2',
  ZIYADAH: 'tahfidz_ziyadah_db_v2',
  MUROJAAH: 'tahfidz_murojaah_db_v2',
  BINNADZOR: 'tahfidz_binnadzor_db_v2',
  PEMBELAJARAN: 'tahfidz_pembelajaran_db_v2',
  KELAS: 'tahfidz_kelas_db_v2',
  SESSION: 'tahfidz_active_session_v2',
  PANTAUAN_LIBURAN: 'tahfidz_pantauan_liburan_v2',
  APP_CONFIG: 'tahfidz_app_config_v2',
  DELETED_RECORDS: 'tahfidz_deleted_records_v2',
  TRASH: 'tahfidz_trash_records_v2'
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  ZIYADAH: 'ziyadah',
  MUROJAAH: 'murojaah',
  BINNADZOR: 'binnadzor',
  PEMBELAJARAN: 'pembelajaran',
  KELAS: 'kelas',
  PANTAUAN_LIBURAN: 'pantauan_liburan',
  APP_CONFIG: 'app_config',
  ACADEMIC_HISTORY: 'academic_history',
  ACADEMIC_PROMOTIONS: 'academic_promotions',
  TRASH: 'trash_records'
} as const;

export function normalizeKelas(kelas: string): string {
  return getClassGroup(kelas);
}

export function normalizeTipeKelas(tipe: string): TipeKelas {
  const normalized = (tipe || '').trim().toLowerCase();
  if (normalized.includes('tahfidz') || normalized.includes('tahfiz')) return 'Tahfidz';
  if (normalized.includes('binnadzor')) return 'Binnadzor';
  if (normalized.includes('jilid') || normalized.includes('ummi')) return 'Jilid';
  if (normalized.includes('istimewa')) return 'Kelas Istimewa';
  return 'Binnadzor';
}

export function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function deduplicateById<T extends { id?: string; idSantri?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = item.id || item.idSantri;
    if (key) {
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

export function readArrayCache<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeArrayCache<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}
