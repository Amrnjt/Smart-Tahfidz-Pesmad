import type { LucideIcon } from 'lucide-react';
import { BookOpenCheck, BookPlus, GraduationCap, Layers, RotateCw } from 'lucide-react';
import { formatTanggalLengkap } from '../../utils/dateFormatter';

export interface EditableItem {
  id: string;
  type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran';
  namaSantri: string;
  materi: string;
  nilai: string;
  surah?: string;
  ayatAwal?: number;
  ayatAkhir?: number;
  surahAtauJuz?: string;
}

export type KategoriFilter = 'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Jilid' | 'Istimewa' | 'Pembelajaran';
export type DateFilterMode = 'bulan' | 'range' | 'all';

interface KategoriOption {
  id: KategoriFilter;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  activeColor: string;
  inactiveColor: string;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
  else if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
  return cleaned;
}

export function buildWhatsAppMessage(
  namaSantri: string,
  timestamp: string,
  jenis: string,
  materi: string,
  nilai: string,
  catatan: string
): string {
  const tanggal = formatTanggalLengkap(timestamp);
  const jenisLabel = jenis === 'Ziyadah'
    ? 'Hafalan Baru (Bil-Ghoib)'
    : jenis === 'Murojaah'
      ? "Muroja'ah (Pengulangan)"
      : jenis === 'Pembelajaran'
        ? 'Pembelajaran Non-Tahfidz (Jilid Ummi / Istimewa)'
        : "Binnadzor (Membaca Al-Qur'an)";

  return (
    "Assalamu'alaikum Warahmatullahi Wabarakatuh.\n" +
    `Yth. Bapak/Ibu Wali dari *${namaSantri}*\n` +
    "Berikut laporan perkembangan hafalan dan bacaan al-Qur'an santri:\n" +
    `- *Tanggal:* ${tanggal}\n` +
    `- *Jenis:* ${jenisLabel}\n` +
    `- *Materi:* ${materi}\n` +
    `- *Nilai / Status:* ${nilai}\n` +
    `- *Catatan Ustadz:* ${catatan || '-'}\n` +
    'Jazakumullah khairan.'
  );
}

export function getMonthKey(timestamp: string): string {
  const dateStr = timestamp.split(' ')[0] || timestamp.split('T')[0] || timestamp;
  const parts = dateStr.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : '';
}

export function getMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return `${NAMA_BULAN[month - 1]} ${year}`;
}

export const KATEGORI_OPTIONS: KategoriOption[] = [
  {
    id: 'ALL',
    label: 'Semua Kategori',
    sublabel: 'Seluruh Setoran',
    icon: Layers,
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
    activeColor: 'bg-slate-900 text-white  border-slate-900',
    inactiveColor: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
  },
  {
    id: 'Ziyadah',
    label: 'Ziyadah',
    sublabel: 'Hafalan Baru',
    icon: BookPlus,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    activeColor: 'bg-emerald-800 text-white  border-emerald-800',
    inactiveColor: 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border-emerald-200'
  },
  {
    id: 'Murojaah',
    label: "Muroja'ah",
    sublabel: 'Pengulangan',
    icon: RotateCw,
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    activeColor: 'bg-teal-800 text-white  border-teal-800',
    inactiveColor: 'bg-teal-50/70 hover:bg-teal-100/70 text-teal-800 border-teal-200'
  },
  {
    id: 'Binnadzor',
    label: 'Binnadzor',
    sublabel: 'Tilawah Mushaf',
    icon: BookOpenCheck,
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    activeColor: 'bg-indigo-800 text-white  border-indigo-800',
    inactiveColor: 'bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-800 border-indigo-200'
  },
  {
    id: 'Jilid',
    label: 'Jilid Ummi',
    sublabel: 'Metode Dewasa',
    icon: GraduationCap,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    activeColor: 'bg-amber-800 text-white  border-amber-800',
    inactiveColor: 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 border-amber-200'
  },
  {
    id: 'Istimewa',
    label: 'Kelas Istimewa',
    sublabel: 'Pendampingan',
    icon: GraduationCap,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    activeColor: 'bg-amber-800 text-white  border-amber-800',
    inactiveColor: 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 border-amber-200'
  }
];
