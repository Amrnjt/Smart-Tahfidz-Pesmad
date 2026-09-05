import React, { useState, useMemo, useEffect } from 'react';
import { User, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord, Santri, PredikatNilai, PREDIKAT_NILAI_OPTIONS } from '../types';
import { storageService } from '../services/storageService';
import { SURAH_LIST } from '../data/quranSurahs';
import {
  Search,
  Trash2,
  BookOpen,
  RotateCw,
  BookOpenCheck,
  Download,
  Calendar,
  CalendarRange,
  Clock,
  FileText,
  MessageCircle,
  SquarePen as Pencil,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Inbox,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { formatTanggalLengkap, formatTanggalRingkas, parseDateSafe } from '../utils/dateFormatter';
import { TableSkeleton } from './SkeletonLoading';
import { UnduhLaporanModal } from './UnduhLaporanModal';
import { getClassGroup } from '../utils/classUtils';

interface EditableItem {
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

interface HistoryTableProps {
  currentUser: User;
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  onDataChanged: () => void;
  isLoading?: boolean;
  santriList?: Santri[];
}

interface CombinedItem {
  id: string;
  type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran';
  timestamp: string;
  idSantri: string;
  namaSantri: string;
  materi: string;
  nilai: string;
  catatan: string;
  inputBy: string;
  surah?: string;
  ayatAwal?: number;
  ayatAkhir?: number;
  surahAtauJuz?: string;
  tipeKelas?: string;
  statusKenaikan?: string;
  hukumTajwid?: string;
  makhrojHuruf?: string;
  kefasihan?: string;
  kelancaran?: string;
  kendalaSantri?: string;
  rekomendasiTindakLanjut?: string;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
  else if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
  return cleaned;
}

function buildWhatsAppMessage(
  namaSantri: string, timestamp: string, jenis: string, materi: string, nilai: string, catatan: string
): string {
  const tanggal = formatTanggalLengkap(timestamp);
  const jenisLabel = jenis === 'Ziyadah'
    ? 'Hafalan Baru (Bil-Ghoib)'
    : jenis === 'Murojaah'
    ? 'Muroja\'ah (Pengulangan)'
    : jenis === 'Pembelajaran'
    ? 'Pembelajaran Non-Tahfidz (Jilid Ummi / Istimewa)'
    : 'Binnadzor (Membaca Al-Qur\'an)';
  return (
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
    `Yth. Bapak/Ibu Wali dari *${namaSantri}*\n` +
    `Berikut laporan perkembangan hafalan dan bacaan al-Qur'an santri:\n` +
    `- *Tanggal:* ${tanggal}\n` +
    `- *Jenis:* ${jenisLabel}\n` +
    `- *Materi:* ${materi}\n` +
    `- *Nilai / Status:* ${nilai}\n` +
    `- *Catatan Ustadz:* ${catatan || '-'}\n` +
    `Jazakumullah khairan.`
  );
}

function getMonthKey(ts: string): string {
  const dateStr = ts.split(' ')[0] || ts.split('T')[0] || ts;
  const parts = dateStr.split('-');
  if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
  return '';
}

function getMonthLabel(key: string): string {
  const [yr, mo] = key.split('-').map(Number);
  if (!yr || !mo) return key;
  return `${NAMA_BULAN[mo - 1]} ${yr}`;
}

export type KategoriFilter = 'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Jilid' | 'Istimewa' | 'Pembelajaran';
export type DateFilterMode = 'bulan' | 'range' | 'all';

interface KategoriOption {
  id: KategoriFilter;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  activeColor: string;
  inactiveColor: string;
}

const KATEGORI_OPTIONS: KategoriOption[] = [
  {
    id: 'ALL',
    label: 'Semua Kategori',
    sublabel: 'Seluruh Setoran',
    icon: Layers,
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-700',
    activeColor: 'bg-slate-900 text-white shadow-xs border-slate-900',
    inactiveColor: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
  },
  {
    id: 'Ziyadah',
    label: 'Ziyadah',
    sublabel: 'Hafalan Baru',
    icon: BookOpen,
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    activeColor: 'bg-emerald-800 text-white shadow-xs border-emerald-800',
    inactiveColor: 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border-emerald-200'
  },
  {
    id: 'Murojaah',
    label: "Muroja'ah",
    sublabel: 'Pengulangan',
    icon: RotateCw,
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    activeColor: 'bg-teal-800 text-white shadow-xs border-teal-800',
    inactiveColor: 'bg-teal-50/70 hover:bg-teal-100/70 text-teal-800 border-teal-200'
  },
  {
    id: 'Binnadzor',
    label: 'Binnadzor',
    sublabel: 'Tilawah Mushaf',
    icon: BookOpenCheck,
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    activeColor: 'bg-indigo-800 text-white shadow-xs border-indigo-800',
    inactiveColor: 'bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-800 border-indigo-200'
  },
  {
    id: 'Jilid',
    label: 'Jilid Ummi',
    sublabel: 'Metode Dewasa',
    icon: GraduationCap,
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    activeColor: 'bg-amber-800 text-white shadow-xs border-amber-800',
    inactiveColor: 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 border-amber-200'
  },
  {
    id: 'Istimewa',
    label: 'Kelas Istimewa',
    sublabel: 'Pendampingan',
    icon: Sparkles,
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    activeColor: 'bg-purple-800 text-white shadow-xs border-purple-800',
    inactiveColor: 'bg-purple-50/70 hover:bg-purple-100/70 text-purple-800 border-purple-200'
  }
];

export const HistoryTable: React.FC<HistoryTableProps> = ({
  currentUser, ziyadahRecords, murojaahRecords, binnadzorRecords, pembelajaranRecords, onDataChanged, isLoading = false, santriList = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<KategoriFilter>('ALL');
  const [nilaiFilter, setNilaiFilter] = useState<string>('ALL');
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeMonthKey, setActiveMonthKey] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hasSetDefaultMonth, setHasSetDefaultMonth] = useState(false);

  // Custom date range state
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('bulan');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('');

  // Inline/modal editing state
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [editSurah, setEditSurah] = useState('');
  const [editAyatAwal, setEditAyatAwal] = useState<number>(1);
  const [editAyatAkhir, setEditAyatAkhir] = useState<number>(1);
  const [editSurahAtauJuz, setEditSurahAtauJuz] = useState('');
  const [editNilai, setEditNilai] = useState<PredikatNilai>('Sangat Baik');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  if (isLoading) return <TableSkeleton rows={7} />;

  const isViewOnly = currentUser.role !== 'Ustadz';
  const targetSantriId = currentUser.idSantri || (currentUser.role === 'Santri' ? currentUser.username : '');

  const actualBinnadzor = binnadzorRecords || storageService.getBinnadzorRecords();
  const actualPembelajaran = pembelajaranRecords || storageService.getPembelajaranRecords();

  const filteredZiyadah = useMemo(
    () => isViewOnly ? ziyadahRecords.filter(r => r.idSantri === targetSantriId) : ziyadahRecords,
    [isViewOnly, ziyadahRecords, targetSantriId]
  );
  const filteredMurojaah = useMemo(
    () => isViewOnly ? murojaahRecords.filter(r => r.idSantri === targetSantriId) : murojaahRecords,
    [isViewOnly, murojaahRecords, targetSantriId]
  );
  const filteredBinnadzor = useMemo(
    () => isViewOnly ? actualBinnadzor.filter(r => r.idSantri === targetSantriId) : actualBinnadzor,
    [isViewOnly, actualBinnadzor, targetSantriId]
  );
  const filteredPembelajaran = useMemo(
    () => isViewOnly ? actualPembelajaran.filter(r => r.idSantri === targetSantriId) : actualPembelajaran,
    [isViewOnly, actualPembelajaran, targetSantriId]
  );

  const combinedItems: CombinedItem[] = useMemo(() => {
    const items: CombinedItem[] = [
      ...filteredZiyadah.map(z => ({
        id: z.id, type: 'Ziyadah' as const, timestamp: z.timestamp, idSantri: z.idSantri,
        namaSantri: z.namaSantri || z.idSantri, materi: `${z.surah} (Ayat ${z.ayatAwal} - ${z.ayatAkhir})`,
        nilai: z.nilai, catatan: z.catatan, inputBy: z.inputBy,
        surah: z.surah, ayatAwal: z.ayatAwal, ayatAkhir: z.ayatAkhir
      })),
      ...filteredMurojaah.map(m => ({
        id: m.id, type: 'Murojaah' as const, timestamp: m.timestamp, idSantri: m.idSantri,
        namaSantri: m.namaSantri || m.idSantri, materi: m.surahAtauJuz,
        nilai: m.nilai, catatan: m.catatan, inputBy: m.inputBy, surahAtauJuz: m.surahAtauJuz
      })),
      ...filteredBinnadzor.map(b => ({
        id: b.id, type: 'Binnadzor' as const, timestamp: b.timestamp, idSantri: b.idSantri,
        namaSantri: b.namaSantri || b.idSantri, materi: b.materi,
        nilai: b.nilai, catatan: b.catatan, inputBy: b.inputBy,
        surah: b.surah, ayatAwal: b.ayatAwal, ayatAkhir: b.ayatAkhir
      })),
      ...filteredPembelajaran.map(p => ({
        id: p.id, type: 'Pembelajaran' as const, timestamp: p.timestamp, idSantri: p.idSantri,
        namaSantri: p.namaSantri || p.idSantri,
        materi: `${p.materi} ${p.statusKenaikan ? `[${p.statusKenaikan}]` : ''}`,
        nilai: p.nilai, catatan: p.catatan, inputBy: p.inputBy,
        tipeKelas: p.tipeKelas, statusKenaikan: p.statusKenaikan,
        hukumTajwid: p.hukumTajwid, makhrojHuruf: p.makhrojHuruf,
        kefasihan: p.kefasihan, kelancaran: p.kelancaran,
        kendalaSantri: p.kendalaSantri, rekomendasiTindakLanjut: p.rekomendasiTindakLanjut
      }))
    ];
    items.sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());
    return items;
  }, [filteredZiyadah, filteredMurojaah, filteredBinnadzor, filteredPembelajaran]);

  // Build month list from data
  const monthKeys = useMemo(() => {
    const keys = new Set<string>();
    combinedItems.forEach(item => {
      const mk = getMonthKey(item.timestamp);
      if (mk) keys.add(mk);
    });
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [combinedItems]);

  // Default to current month on initial load only (not on every monthKeys change)
  useEffect(() => {
    if (hasSetDefaultMonth || monthKeys.length === 0) return;
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    if (monthKeys.includes(currentKey)) {
      setActiveMonthKey(currentKey);
    } else {
      setActiveMonthKey(monthKeys[0]);
    }
    setHasSetDefaultMonth(true);
  }, [monthKeys, hasSetDefaultMonth]);

  // Helper to extract YYYY-MM-DD from timestamp string
  const getItemDateString = (ts: string): string => {
    if (!ts) return '';
    if (ts.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(ts)) {
      return ts.slice(0, 10);
    }
    const d = parseDateSafe(ts);
    const yr = d.getFullYear();
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${yr}-${mo}-${day}`;
  };

  const matchesCategory = (item: CombinedItem, cat: KategoriFilter): boolean => {
    if (cat === 'ALL') return true;
    if (cat === 'Ziyadah') return item.type === 'Ziyadah';
    if (cat === 'Murojaah') return item.type === 'Murojaah';
    if (cat === 'Binnadzor') return item.type === 'Binnadzor';
    if (cat === 'Pembelajaran') return item.type === 'Pembelajaran';
    if (cat === 'Jilid') {
      return item.type === 'Pembelajaran' && (!item.tipeKelas || !item.tipeKelas.toLowerCase().includes('istimewa'));
    }
    if (cat === 'Istimewa') {
      return item.type === 'Pembelajaran' && !!item.tipeKelas && item.tipeKelas.toLowerCase().includes('istimewa');
    }
    return true;
  };

  const matchesDate = (item: CombinedItem): boolean => {
    if (dateFilterMode === 'all') return true;
    if (dateFilterMode === 'bulan') {
      return getMonthKey(item.timestamp) === activeMonthKey;
    }
    if (dateFilterMode === 'range') {
      const itemDate = getItemDateString(item.timestamp);
      if (!itemDate) return true;
      if (customStartDate && itemDate < customStartDate) return false;
      if (customEndDate && itemDate > customEndDate) return false;
      return true;
    }
    return true;
  };

  const applyDatePreset = (preset: 'hari_ini' | '7_hari' | '30_hari' | 'bulan_ini' | 'semua') => {
    setActiveDatePreset(preset);
    const now = new Date();
    const formatYMD = (d: Date) => {
      const yr = d.getFullYear();
      const mo = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${yr}-${mo}-${day}`;
    };

    if (preset === 'semua') {
      setDateFilterMode('all');
      setCustomStartDate('');
      setCustomEndDate('');
      return;
    }

    setDateFilterMode('range');

    if (preset === 'hari_ini') {
      const todayStr = formatYMD(now);
      setCustomStartDate(todayStr);
      setCustomEndDate(todayStr);
      return;
    }

    if (preset === '7_hari') {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      setCustomStartDate(formatYMD(past));
      setCustomEndDate(formatYMD(now));
      return;
    }

    if (preset === '30_hari') {
      const past = new Date();
      past.setDate(now.getDate() - 29);
      setCustomStartDate(formatYMD(past));
      setCustomEndDate(formatYMD(now));
      return;
    }

    if (preset === 'bulan_ini') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setCustomStartDate(formatYMD(startOfMonth));
      setCustomEndDate(formatYMD(now));
      return;
    }
  };

  // Counts per category matching current date filter
  const categoryCounts = useMemo(() => {
    const counts: Record<KategoriFilter, number> = {
      ALL: 0,
      Ziyadah: 0,
      Murojaah: 0,
      Binnadzor: 0,
      Jilid: 0,
      Istimewa: 0,
      Pembelajaran: 0
    };

    combinedItems.forEach(item => {
      if (matchesDate(item)) {
        counts.ALL++;
        if (item.type === 'Ziyadah') counts.Ziyadah++;
        else if (item.type === 'Murojaah') counts.Murojaah++;
        else if (item.type === 'Binnadzor') counts.Binnadzor++;
        else if (item.type === 'Pembelajaran') {
          counts.Pembelajaran++;
          if (item.tipeKelas && item.tipeKelas.toLowerCase().includes('istimewa')) {
            counts.Istimewa++;
          } else {
            counts.Jilid++;
          }
        }
      }
    });

    return counts;
  }, [combinedItems, dateFilterMode, activeMonthKey, customStartDate, customEndDate]);

  // Filter items by active date mode + category + search/filters
  const displayedItems = useMemo(() => {
    return combinedItems.filter(item => {
      if (!matchesDate(item)) return false;
      if (!matchesCategory(item, kategoriFilter)) return false;

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesSearch =
          item.namaSantri.toLowerCase().includes(q) ||
          item.idSantri.toLowerCase().includes(q) ||
          item.materi.toLowerCase().includes(q) ||
          item.catatan.toLowerCase().includes(q) ||
          item.inputBy.toLowerCase().includes(q) ||
          formatTanggalLengkap(item.timestamp).toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      const matchesNilai = nilaiFilter === 'ALL' || item.nilai === nilaiFilter;
      return matchesNilai;
    });
  }, [combinedItems, dateFilterMode, activeMonthKey, customStartDate, customEndDate, kategoriFilter, searchQuery, nilaiFilter]);

  // Active period text for footer and export
  const activePeriodLabel = useMemo(() => {
    if (dateFilterMode === 'bulan') {
      return activeMonthKey ? getMonthLabel(activeMonthKey) : 'Bulan Berjalan';
    }
    if (dateFilterMode === 'range') {
      if (customStartDate && customEndDate) {
        if (customStartDate === customEndDate) {
          return `Tanggal ${formatTanggalRingkas(customStartDate)}`;
        }
        return `${formatTanggalRingkas(customStartDate)} s/d ${formatTanggalRingkas(customEndDate)}`;
      }
      if (customStartDate) return `Sejak ${formatTanggalRingkas(customStartDate)}`;
      if (customEndDate) return `Hingga ${formatTanggalRingkas(customEndDate)}`;
      return 'Rentang Tanggal Khusus';
    }
    return 'Semua Periode Waktu';
  }, [dateFilterMode, activeMonthKey, customStartDate, customEndDate]);

  // Check if any filters are currently active beyond defaults
  const isFilterActive = useMemo(() => {
    return (
      !!searchQuery.trim() ||
      kategoriFilter !== 'ALL' ||
      nilaiFilter !== 'ALL' ||
      dateFilterMode !== 'bulan' ||
      (dateFilterMode === 'range' && (!!customStartDate || !!customEndDate))
    );
  }, [searchQuery, kategoriFilter, nilaiFilter, dateFilterMode, customStartDate, customEndDate]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setKategoriFilter('ALL');
    setNilaiFilter('ALL');
    setDateFilterMode('bulan');
    setCustomStartDate('');
    setCustomEndDate('');
    setActiveDatePreset('');
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    if (monthKeys.includes(currentKey)) {
      setActiveMonthKey(currentKey);
    } else if (monthKeys.length > 0) {
      setActiveMonthKey(monthKeys[0]);
    }
  };

  // Counts per month for tab badges
  const monthCounts = useMemo(() => {
    const map: Record<string, number> = {};
    combinedItems.forEach(item => {
      const mk = getMonthKey(item.timestamp);
      if (mk) map[mk] = (map[mk] || 0) + 1;
    });
    return map;
  }, [combinedItems]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (item: CombinedItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus rekaman setoran ${item.type} untuk ${item.namaSantri}?`)) {
      await storageService.deleteRecord(item.type, item.id);
      onDataChanged();
    }
  };

  const openEditModal = (item: CombinedItem) => {
    setEditingItem(item);
    setEditNilai(item.nilai as PredikatNilai);
    if (item.type === 'Ziyadah') {
      setEditSurah(item.surah || SURAH_LIST[0].nameLatin);
      setEditAyatAwal(item.ayatAwal || 1);
      setEditAyatAkhir(item.ayatAkhir || 1);
    } else {
      setEditSurahAtauJuz(item.surahAtauJuz || item.materi);
    }
  };

  const closeEditModal = () => { setEditingItem(null); setIsSavingEdit(false); };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      if (editingItem.type === 'Ziyadah') {
        const surahMeta = SURAH_LIST.find(s => s.nameLatin === editSurah);
        await storageService.updateRecord('Ziyadah', editingItem.id, {
          surah: editSurah, surahNumber: surahMeta?.number,
          ayatAwal: Number(editAyatAwal), ayatAkhir: Number(editAyatAkhir), nilai: editNilai
        });
      } else if (editingItem.type === 'Binnadzor') {
        await storageService.updateRecord('Binnadzor', editingItem.id, {
          surahAtauHalaman: editSurahAtauJuz.trim(),
          materi: editSurahAtauJuz.trim(),
          nilai: editNilai
        });
      } else if (editingItem.type === 'Pembelajaran') {
        await storageService.updateRecord('Pembelajaran', editingItem.id, {
          materi: editSurahAtauJuz.trim(),
          nilai: editNilai
        });
      } else {
        await storageService.updateRecord('Murojaah', editingItem.id, {
          surahAtauJuz: editSurahAtauJuz.trim(), nilai: editNilai
        });
      }
      onDataChanged();
      closeEditModal();
    } catch (err) {
      console.error('Gagal menyimpan perubahan:', err);
      alert('Terjadi kendala saat menyimpan perubahan. Silakan coba lagi.');
      setIsSavingEdit(false);
    }
  };

  const editSurahMeta = SURAH_LIST.find(s => s.nameLatin === editSurah) || SURAH_LIST[0];

  const getWaliContact = (idSantri: string): string => {
    const santri = santriList.find(s => s.idSantri === idSantri);
    return santri?.waliKontak || '';
  };

  const buildWhatsAppLink = (item: CombinedItem): string | null => {
    const waliKontak = getWaliContact(item.idSantri);
    if (!waliKontak) return null;
    const phone = formatPhoneForWA(waliKontak);
    const pesan = buildWhatsAppMessage(item.namaSantri, item.timestamp, item.type, item.materi, item.nilai, item.catatan);
    return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Keterangan Tanggal & Waktu', 'Timestamp Mentah', 'Kategori / Jenis', 'ID Santri', 'Nama Santri', 'Materi Hafalan', 'Nilai', 'Catatan', 'Input By'];
    const rows = displayedItems.map(i => [
      i.id, `"${formatTanggalLengkap(i.timestamp)}"`, i.timestamp, i.type, i.idSantri,
      `"${i.namaSantri}"`, `"${i.materi}"`, i.nilai,
      `"${i.catatan.replace(/"/g, '""')}"`, `"${i.inputBy}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const periodSlug = dateFilterMode === 'range'
      ? `rentang_${customStartDate || 'awal'}_sd_${customEndDate || 'akhir'}`
      : dateFilterMode === 'all'
      ? 'semua_waktu'
      : (activeMonthKey || 'bulan');
    link.setAttribute('download', `riwayat_setoran_${kategoriFilter.toLowerCase()}_${periodSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderNilaiBadge = (nilai: string) => {
    if (nilai === 'Sangat Baik')
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">🟢 Sangat Baik</span>;
    if (nilai === 'Baik')
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300">🟡 Baik</span>;
    if (nilai === 'Kurang')
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[11px] border border-orange-300">🟠 Kurang</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-300">🔴 Mengulang</span>;
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)' }}>
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            Riwayat Setoran Hafalan
            {isViewOnly && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">View-Only</span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Laporan PDF</span>
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56 min-w-[160px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri, surah, catatan..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value as KategoriFilter)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
            <option value="Murojaah">Muroja'ah (Pengulangan)</option>
            <option value="Binnadzor">Binnadzor (Tilawah)</option>
            <option value="Jilid">Jilid Ummi Dewasa</option>
            <option value="Istimewa">Kelas Istimewa</option>
          </select>
          <select
            value={nilaiFilter}
            onChange={(e) => setNilaiFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Semua Nilai</option>
            {PREDIKAT_NILAI_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Filter Toolbar & Mode Switcher */}
      <div className="flex-shrink-0 pt-3 pb-2 space-y-2 border-b border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Mode Selector Tabs */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setDateFilterMode('bulan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilterMode === 'bulan'
                  ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tab Bulan</span>
            </button>
            <button
              onClick={() => {
                setDateFilterMode('range');
                if (!customStartDate && !customEndDate) {
                  applyDatePreset('bulan_ini');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilterMode === 'range'
                  ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Rentang Tanggal Khusus</span>
            </button>
            <button
              onClick={() => setDateFilterMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateFilterMode === 'all'
                  ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Semua Waktu</span>
            </button>
          </div>

          {/* Quick indicator of current active period */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="hidden sm:inline">Periode Aktif:</span>
            <span className="font-bold text-slate-800 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
              {activePeriodLabel}
            </span>
          </div>
        </div>

        {/* Mode 1: Month Tabs */}
        {dateFilterMode === 'bulan' && (
          <div className="overflow-x-auto pt-1" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex items-center gap-2 min-w-min pb-1">
              {monthKeys.length === 0 ? (
                <span className="text-xs text-slate-400 px-2">Belum ada data setoran</span>
              ) : (
                monthKeys.map(mk => (
                  <button
                    key={mk}
                    onClick={() => setActiveMonthKey(mk)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex-shrink-0 ${
                      activeMonthKey === mk
                        ? 'bg-emerald-800 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{getMonthLabel(mk)}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      activeMonthKey === mk ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                    }`}>
                      {monthCounts[mk] || 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Mode 2: Custom Date Range Form & Quick Presets */}
        {dateFilterMode === 'range' && (
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Date Inputs */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Dari:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setActiveDatePreset('custom');
                    }}
                    className="py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Sampai:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setActiveDatePreset('custom');
                    }}
                    className="py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setActiveDatePreset('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                    title="Kosongkan tanggal"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus Tanggal</span>
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Preset Cepat:</span>
                <button
                  onClick={() => applyDatePreset('hari_ini')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    activeDatePreset === 'hari_ini'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => applyDatePreset('7_hari')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    activeDatePreset === '7_hari'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => applyDatePreset('30_hari')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    activeDatePreset === '30_hari'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  30 Hari
                </button>
                <button
                  onClick={() => applyDatePreset('bulan_ini')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    activeDatePreset === 'bulan_ini'
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Bulan Ini
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode 3: All Time Banner */}
        {dateFilterMode === 'all' && (
          <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>Menampilkan seluruh arsip data setoran tanpa pembatasan tanggal.</span>
            <button
              onClick={() => setDateFilterMode('bulan')}
              className="text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              Kembali ke Tab Bulanan
            </button>
          </div>
        )}
      </div>

      {/* Kategori Setoran Filter Chips */}
      <div className="flex-shrink-0 pt-2.5 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex items-center gap-1.5 min-w-min pb-0.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline flex-shrink-0">
            Kategori:
          </span>
          {KATEGORI_OPTIONS.map((cat) => {
            const Icon = cat.icon;
            const isSelected = kategoriFilter === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setKategoriFilter(cat.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex-shrink-0 ${
                  isSelected ? cat.activeColor : cat.inactiveColor
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                <span className="whitespace-nowrap">{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : cat.badgeBg + ' ' + cat.badgeText
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Indicators & Reset Bar */}
      {isFilterActive && (
        <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 mb-2 flex-shrink-0">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="font-extrabold flex items-center gap-1 text-emerald-900">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Aktif:
            </span>
            {kategoriFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-semibold text-[11px] text-emerald-800 shadow-2xs">
                Kategori: {kategoriFilter}
                <button onClick={() => setKategoriFilter('ALL')} className="hover:text-rose-600 cursor-pointer p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFilterMode === 'range' && (customStartDate || customEndDate) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-semibold text-[11px] text-emerald-800 shadow-2xs">
                Rentang: {activePeriodLabel}
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setDateFilterMode('bulan');
                  }}
                  className="hover:text-rose-600 cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {dateFilterMode === 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-semibold text-[11px] text-emerald-800 shadow-2xs">
                Semua Waktu
                <button onClick={() => setDateFilterMode('bulan')} className="hover:text-rose-600 cursor-pointer p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {nilaiFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-semibold text-[11px] text-emerald-800 shadow-2xs">
                Nilai: {nilaiFilter}
                <button onClick={() => setNilaiFilter('ALL')} className="hover:text-rose-600 cursor-pointer p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-emerald-300 font-semibold text-[11px] text-emerald-800 shadow-2xs">
                Pencarian: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Semua Filter</span>
          </button>
        </div>
      )}

      {/* Scrollable Content Area - fixed height */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-slate-100 bg-slate-50/50">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-400">
            <Inbox className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada data setoran yang cocok</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Coba sesuaikan rentang tanggal, ubah kategori setoran, atau bersihkan kata kunci pencarian.
            </p>
            {isFilterActive && (
              <button
                onClick={resetAllFilters}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedItems.map((item) => {
              const isExpanded = expandedRows.has(item.id);
              const timePart = item.timestamp.includes(' ')
                ? item.timestamp.split(' ')[1]
                : item.timestamp.includes('T')
                ? item.timestamp.split('T')[1]?.slice(0, 5)
                : '';
              const waLink = !isViewOnly ? buildWhatsAppLink(item) : null;
              const santri = santriList.find(s => s.idSantri === item.idSantri);
              const kelasGroup = santri ? getClassGroup(santri.kelas) : '';

              return (
                <div key={item.id} className="bg-white hover:bg-slate-50/60 transition-colors">
                  {/* Compact Row - always visible */}
                  <div
                    className="flex items-center gap-2 px-3 sm:px-4 py-2.5 cursor-pointer"
                    onClick={() => toggleRow(item.id)}
                  >
                    {/* Expand icon */}
                    <div className="flex-shrink-0 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>

                    {/* Date */}
                    <div className="flex-shrink-0 w-[120px] sm:w-[160px]">
                      <div className="text-[11px] font-bold text-slate-700 leading-tight">
                        {formatTanggalLengkap(item.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {timePart ? `${timePart} WIB` : '-'}
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="flex-shrink-0">
                      {item.type === 'Ziyadah' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          <BookOpen className="w-2.5 h-2.5" /> Zyd
                        </span>
                      ) : item.type === 'Murojaah' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px] border border-teal-200">
                          <RotateCw className="w-2.5 h-2.5" /> Mrj
                        </span>
                      ) : item.type === 'Binnadzor' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                          <BookOpenCheck className="w-2.5 h-2.5" /> Bnd
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                          <GraduationCap className="w-2.5 h-2.5" /> Pbl
                        </span>
                      )}
                    </div>

                    {/* Santri name + materi */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{item.namaSantri}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.materi}</div>
                    </div>

                    {/* Nilai badge */}
                    <div className="flex-shrink-0 hidden sm:block">
                      {renderNilaiBadge(item.nilai)}
                    </div>

                    {/* Mobile nilai - compact */}
                    <div className="flex-shrink-0 sm:hidden">
                      {item.nilai === 'Sangat Baik' && <span className="text-base">🟢</span>}
                      {item.nilai === 'Baik' && <span className="text-base">🟡</span>}
                      {item.nilai === 'Kurang' && <span className="text-base">🟠</span>}
                      {item.nilai === 'Mengulang' && <span className="text-base">🔴</span>}
                    </div>
                  </div>

                  {/* Expanded Detail - accordion */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3 pt-1 bg-slate-50/80 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Left column */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Santri</span>
                            <span className="font-bold text-slate-800">{item.namaSantri}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.idSantri}</span>
                          </div>
                          {kelasGroup && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Kelas</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                {kelasGroup}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Materi</span>
                            <span className="font-semibold text-slate-700">{item.materi}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Nilai</span>
                            {renderNilaiBadge(item.nilai)}
                          </div>

                          {/* Non-Tahfidz / Pembelajaran specific details */}
                          {item.tipeKelas && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Program</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                                {item.tipeKelas}
                              </span>
                            </div>
                          )}
                          {item.statusKenaikan && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Status</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {item.statusKenaikan}
                              </span>
                            </div>
                          )}
                          {(item.hukumTajwid || item.makhrojHuruf || item.kefasihan || item.kelancaran) && (
                            <div className="pt-1">
                              <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">4 Aspek Kualitas</span>
                              <div className="grid grid-cols-2 gap-1 text-[10px]">
                                {item.hukumTajwid && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Tajwid: <b>{item.hukumTajwid}</b></span>}
                                {item.makhrojHuruf && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Makhroj: <b>{item.makhrojHuruf}</b></span>}
                                {item.kefasihan && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Fashohah: <b>{item.kefasihan}</b></span>}
                                {item.kelancaran && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Kelancaran: <b>{item.kelancaran}</b></span>}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right column */}
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-400 font-semibold w-16 flex-shrink-0 mt-0.5">Catatan</span>
                            <span className="text-slate-600 italic flex-1">{item.catatan || '-'}</span>
                          </div>
                          {item.kendalaSantri && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-400 font-semibold w-16 flex-shrink-0 mt-0.5">Kendala</span>
                              <span className="text-amber-800 font-medium flex-1">{item.kendalaSantri}</span>
                            </div>
                          )}
                          {item.rekomendasiTindakLanjut && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-400 font-semibold w-16 flex-shrink-0 mt-0.5">Saran</span>
                              <span className="text-emerald-800 font-medium flex-1">{item.rekomendasiTindakLanjut}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-semibold w-16 flex-shrink-0">Dicatat</span>
                            <span className="text-slate-600">{item.inputBy}</span>
                          </div>

                          {/* Action buttons */}
                          {!isViewOnly && (
                            <div className="flex items-center gap-2 pt-1.5">
                              {waLink ? (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-green-600 hover:bg-green-50 transition cursor-pointer border border-green-200 text-xs font-semibold"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 cursor-not-allowed border border-slate-100 text-xs font-semibold">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>No HP wali belum terdaftar</span>
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer border border-emerald-200 text-xs font-semibold"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer border border-rose-200 text-xs font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer - always visible */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2.5 border-t border-slate-100 flex-shrink-0">
        <span>
          Menampilkan <b className="text-slate-800 font-extrabold">{displayedItems.length}</b> setoran
          {' '}(<b className="text-emerald-800">{activePeriodLabel}</b>
          {kategoriFilter !== 'ALL' && <> &bull; Kategori <b className="text-slate-700">{kategoriFilter}</b></>})
          {' '}dari total {combinedItems.length} data rekaman
        </span>
        <span className="text-[11px] text-emerald-800 font-semibold hidden sm:inline">Data Mutaba'ah Terverifikasi</span>
      </div>

      {/* Edit Record Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 p-5 bg-gradient-to-br from-emerald-800 to-teal-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <h3 id="edit-modal-title" className="font-extrabold text-base">Edit Setoran {editingItem.type}</h3>
                  <p className="text-xs text-emerald-100/90">{editingItem.namaSantri}</p>
                </div>
              </div>
              <button onClick={closeEditModal} aria-label="Tutup" className="p-1.5 rounded-lg text-white/80 hover:bg-white/15 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4">
              {editingItem.type === 'Ziyadah' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Materi Hafalan (Surah)</label>
                    <select
                      value={editSurah}
                      onChange={(e) => {
                        setEditSurah(e.target.value);
                        const s = SURAH_LIST.find(x => x.nameLatin === e.target.value);
                        if (s) { setEditAyatAwal(1); setEditAyatAkhir(Math.min(editAyatAkhir, s.numberOfAyahs) || 1); }
                      }}
                      className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {SURAH_LIST.map((s) => (
                        <option key={s.number} value={s.nameLatin}>{s.number}. {s.nameLatin} ({s.nameArabic}) - {s.numberOfAyahs} Ayat</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Maks. {editSurahMeta.numberOfAyahs} ayat &bull; {editSurahMeta.revelationType}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ayat Awal</label>
                      <input type="number" min={1} max={editSurahMeta.numberOfAyahs} required value={editAyatAwal}
                        onChange={(e) => setEditAyatAwal(Number(e.target.value))}
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ayat Akhir</label>
                      <input type="number" min={editAyatAwal} max={editSurahMeta.numberOfAyahs} required value={editAyatAkhir}
                        onChange={(e) => setEditAyatAkhir(Number(e.target.value))}
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {editingItem.type === 'Binnadzor' ? 'Materi Bacaan (Surah / Halaman Mushaf)' : editingItem.type === 'Pembelajaran' ? 'Materi / Pokok Bahasan' : 'Materi Hafalan (Surah / Juz)'}
                  </label>
                  <input type="text" required value={editSurahAtauJuz} onChange={(e) => setEditSurahAtauJuz(e.target.value)}
                    placeholder={editingItem.type === 'Binnadzor' ? 'Contoh: Surah Al-Baqarah hal. 2-5' : editingItem.type === 'Pembelajaran' ? 'Contoh: Jilid 2 Hal 15 atau Pendampingan Khusus' : 'Contoh: Juz 30 atau Surah Al-Mulk'}
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nilai / Kualitas Setoran</label>
                <select value={editNilai} onChange={(e) => setEditNilai(e.target.value as PredikatNilai)}
                  className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {PREDIKAT_NILAI_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={closeEditModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /><span>Batal</span>
                </button>
                <button type="submit" disabled={isSavingEdit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingEdit ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Menyimpan...</span></>
                  ) : (
                    <><Save className="w-4 h-4" /><span>Simpan Perubahan</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unduh Laporan Modal */}
      <UnduhLaporanModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        currentUser={currentUser}
        santriList={santriList}
        ziyadahRecords={ziyadahRecords}
        murojaahRecords={murojaahRecords}
        binnadzorRecords={binnadzorRecords || actualBinnadzor}
        pembelajaranRecords={pembelajaranRecords || actualPembelajaran}
      />
    </div>
  );
};
