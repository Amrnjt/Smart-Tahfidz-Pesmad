import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  User,
  ZiyadahRecord,
  MurojaahRecord,
  BinnadzorRecord,
  PembelajaranRecord,
  Santri,
  PredikatNilai,
  PREDIKAT_NILAI_OPTIONS,
  CombinedHistoryItem
} from '../types';
import { storageService } from '../services/storageService';
import { SURAH_LIST } from '../data/quranSurahs';
import {
  Search,
  Trash2,
  BookOpen,
  BookPlus,
  RotateCw,
  BookOpenCheck,
  Download,
  Calendar,
  CalendarRange,
  FileText,
  MessageCircle,
  SquarePen as Pencil,
  X,
  Save,
  ChevronDown,
  ChevronRight,
  Inbox,
  GraduationCap,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  AlertTriangle,
  Clock,
  HeartHandshake
} from 'lucide-react';
import {
  addDaysToDateInput,
  formatTanggalLengkap,
  formatTanggalRingkas,
  getTodayInputFormat,
  parseDateSafe
} from '../utils/dateFormatter';
import { UnduhLaporanModal } from './UnduhLaporanModal';
import { TrashBinModal } from './TrashBinModal';
import type { NotifyFn } from './Snackbar';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface HistoryTableProps {
  currentUser: User;
  ziyadahRecords?: ZiyadahRecord[];
  murojaahRecords?: MurojaahRecord[];
  binnadzorRecords?: BinnadzorRecord[];
  pembelajaranRecords?: PembelajaranRecord[];
  onDataChanged: () => void;
  santriList?: Santri[];
  onNotify: NotifyFn;
}

export type PeriodPreset = 'hari_ini' | '7_hari' | '30_hari' | 'bulan_ini' | 'rentang_tanggal';
export type KategoriFilter = 'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Jilid' | 'Istimewa';

function formatPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
  else if (cleaned.startsWith('8')) cleaned = '62' + cleaned;
  return cleaned;
}

function buildWhatsAppMessage(
  namaSantri: string,
  timestamp: string,
  jenis: string,
  materi: string,
  nilai: string,
  catatan: string,
  aspek?: { hukumTajwid?: string; makhrojHuruf?: string; kefasihan?: string; kelancaran?: string }
): string {
  const tanggal = formatTanggalLengkap(timestamp);
  const jenisLabel = jenis === 'Ziyadah'
    ? 'Hafalan Baru (Bil-Ghoib)'
    : jenis === 'Murojaah'
    ? "Muroja'ah (Pengulangan)"
    : jenis === 'Pembelajaran'
    ? 'Pembelajaran Non-Tahfidz (Jilid Ummi / Istimewa)'
    : "Binnadzor (Membaca Al-Qur'an)";

  const aspekLines: string[] = [];
  if (aspek?.hukumTajwid) aspekLines.push(`  • Tajwid: ${aspek.hukumTajwid}`);
  if (aspek?.makhrojHuruf) aspekLines.push(`  • Makhroj: ${aspek.makhrojHuruf}`);
  if (aspek?.kefasihan) aspekLines.push(`  • Fashohah: ${aspek.kefasihan}`);
  if (aspek?.kelancaran) aspekLines.push(`  • Kelancaran: ${aspek.kelancaran}`);
  const aspekText = aspekLines.length > 0 ? `\n- *Aspek Penilaian:*\n${aspekLines.join('\n')}` : '';

  return (
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
    `Yth. Bapak/Ibu Wali dari *${namaSantri}*\n` +
    `Berikut laporan perkembangan hafalan dan bacaan al-Qur'an santri:\n` +
    `- *Tanggal:* ${tanggal}\n` +
    `- *Jenis:* ${jenisLabel}\n` +
    `- *Materi:* ${materi}\n` +
    `- *Nilai / Status:* ${nilai}` +
    `${aspekText}\n` +
    `- *Catatan Ustadz:* ${catatan || '-'}\n` +
    `Jazakumullah khairan.`
  );
}

const KATEGORI_OPTIONS: { id: KategoriFilter; label: string; icon: React.ElementType }[] = [
  { id: 'ALL', label: 'Semua', icon: Layers },
  { id: 'Ziyadah', label: 'Ziyadah', icon: BookPlus },
  { id: 'Murojaah', label: "Muroja'ah", icon: RotateCw },
  { id: 'Binnadzor', label: 'Binnadzor', icon: BookOpenCheck },
  { id: 'Jilid', label: 'Jilid Ummi', icon: GraduationCap },
  { id: 'Istimewa', label: 'Kelas Istimewa', icon: HeartHandshake }
];

export const HistoryTable: React.FC<HistoryTableProps> = ({
  currentUser,
  ziyadahRecords = [],
  murojaahRecords = [],
  binnadzorRecords = [],
  pembelajaranRecords = [],
  onDataChanged,
  santriList = [],
  onNotify
}) => {
  const isViewOnly = currentUser.role === 'wali' || currentUser.role === 'santri';
  const today = getTodayInputFormat();

  // 1. Filter states
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('hari_ini');
  const [customStartDate, setCustomStartDate] = useState<string>(today);
  const [customEndDate, setCustomEndDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<KategoriFilter>('ALL');
  const [nilaiFilter, setNilaiFilter] = useState('ALL');
  const [extraDaysCount, setExtraDaysCount] = useState<number>(0);

  // 2. Accordion & Selection states
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set([today]));
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 3. Modals
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CombinedHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<CombinedHistoryItem | null>(null);
  const [editNilai, setEditNilai] = useState<PredikatNilai>('Baik');
  const [editSurah, setEditSurah] = useState<string>(SURAH_LIST[0].nameLatin);
  const [editAyatAwal, setEditAyatAwal] = useState<number>(1);
  const [editAyatAkhir, setEditAyatAkhir] = useState<number>(1);
  const [editSurahAtauJuz, setEditSurahAtauJuz] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Accessible dialog refs
  const deleteDialogRef = useAccessibleDialog(
    !!itemToDelete,
    () => !isDeleting && setItemToDelete(null)
  );
  const batchDeleteDialogRef = useAccessibleDialog(
    isBatchDeleteModalOpen,
    () => !isBatchDeleting && setIsBatchDeleteModalOpen(false)
  );
  const editDialogRef = useAccessibleDialog(
    !!editingItem,
    () => !isSavingEdit && setEditingItem(null)
  );

  // 4. Lazy-loaded records cache per day: Record<YYYY-MM-DD, CombinedHistoryItem[]>
  const [dayCache, setDayCache] = useState<Record<string, CombinedHistoryItem[]>>({});
  const [loadingDays, setLoadingDays] = useState<Record<string, boolean>>({});
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Helper: fetch single day and store in cache
  const loadDayRecords = useCallback(async (dateKey: string) => {
    if (dayCache[dateKey] !== undefined) return;
    setLoadingDays(prev => ({ ...prev, [dateKey]: true }));
    try {
      const records = await storageService.fetchRecordsForDate(dateKey);
      setDayCache(prev => ({ ...prev, [dateKey]: records }));
    } catch (err) {
      console.error(`Failed to load records for date ${dateKey}:`, err);
    } finally {
      setLoadingDays(prev => ({ ...prev, [dateKey]: false }));
    }
  }, [dayCache]);

  // Helper: fetch range of dates in batch
  const loadDateRange = useCallback(async (start: string, end: string) => {
    try {
      const records = await storageService.fetchRecordsForDateRange(start, end);
      const grouped: Record<string, CombinedHistoryItem[]> = {};
      records.forEach(r => {
        const d = (r.timestamp || '').slice(0, 10);
        if (d) {
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(r);
        }
      });
      setDayCache(prev => ({ ...prev, ...grouped }));
    } catch (err) {
      console.error(`Failed to load date range ${start} to ${end}:`, err);
    }
  }, []);

  // Initial load: fetch today's data immediately
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsInitialLoading(true);
      try {
        const records = await storageService.fetchRecordsForDate(today);
        if (isMounted) {
          setDayCache(prev => ({ ...prev, [today]: records }));
        }
      } catch (err) {
        console.error('Failed to load initial day:', err);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [today]);

  // Calculate the list of date strings to render based on active period preset
  const { dateList, periodStartDate, periodEndDate } = useMemo(() => {
    let start = today;
    let end = today;

    if (periodPreset === 'hari_ini') {
      start = today;
      end = today;
    } else if (periodPreset === '7_hari') {
      start = addDaysToDateInput(today, -6);
      end = today;
    } else if (periodPreset === '30_hari') {
      start = addDaysToDateInput(today, -29);
      end = today;
    } else if (periodPreset === 'bulan_ini') {
      start = `${today.slice(0, 7)}-01`;
      end = today;
    } else if (periodPreset === 'rentang_tanggal') {
      start = customStartDate || today;
      end = customEndDate || today;
      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }
    }

    // If user requested extra days through "Muat Riwayat Hari Sebelumnya"
    if (extraDaysCount > 0) {
      start = addDaysToDateInput(start, -extraDaysCount);
    }

    // Generate days array descending
    const dates: string[] = [];
    let current = end;
    while (current >= start) {
      dates.push(current);
      current = addDaysToDateInput(current, -1);
      // Safety guard against infinite loops
      if (dates.length > 365) break;
    }

    return { dateList: dates, periodStartDate: start, periodEndDate: end };
  }, [periodPreset, today, customStartDate, customEndDate, extraDaysCount]);

  // Load date range whenever period changes
  useEffect(() => {
    if (periodPreset === 'hari_ini') return;
    loadDateRange(periodStartDate, periodEndDate);
  }, [periodPreset, periodStartDate, periodEndDate, loadDateRange]);

  // Toggle Day Accordion
  const toggleDayAccordion = (dateStr: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
        // If data not loaded yet, fetch it on expansion
        if (dayCache[dateStr] === undefined) {
          loadDayRecords(dateStr);
        }
      }
      return next;
    });
  };

  // Toggle Single Row Detail
  const toggleRowDetail = (id: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Check matching category
  const matchesCategory = (item: CombinedHistoryItem): boolean => {
    if (kategoriFilter === 'ALL') return true;
    if (kategoriFilter === 'Ziyadah') return item.type === 'Ziyadah';
    if (kategoriFilter === 'Murojaah') return item.type === 'Murojaah';
    if (kategoriFilter === 'Binnadzor') return item.type === 'Binnadzor';
    if (kategoriFilter === 'Jilid') {
      return item.type === 'Pembelajaran' && (!item.tipeKelas || !item.tipeKelas.toLowerCase().includes('istimewa'));
    }
    if (kategoriFilter === 'Istimewa') {
      return item.type === 'Pembelajaran' && !!item.tipeKelas && item.tipeKelas.toLowerCase().includes('istimewa');
    }
    return true;
  };

  // Filter items in a single day
  const filterDayItems = useCallback((items: CombinedHistoryItem[] = []): CombinedHistoryItem[] => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(item => {
      if (!matchesCategory(item)) return false;
      if (nilaiFilter !== 'ALL' && item.nilai !== nilaiFilter) return false;
      if (q) {
        const matchesQuery =
          (item.namaSantri || '').toLowerCase().includes(q) ||
          (item.idSantri || '').toLowerCase().includes(q) ||
          (item.materi || '').toLowerCase().includes(q) ||
          (item.catatan || '').toLowerCase().includes(q) ||
          (item.inputBy || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [searchQuery, kategoriFilter, nilaiFilter]);

  // Aggregate stats across all currently loaded dates matching filter
  const { totalMatchingRecords, allMatchingItems, categoryCounts } = useMemo(() => {
    let total = 0;
    const items: CombinedHistoryItem[] = [];
    const counts: Record<KategoriFilter, number> = {
      ALL: 0,
      Ziyadah: 0,
      Murojaah: 0,
      Binnadzor: 0,
      Jilid: 0,
      Istimewa: 0
    };

    dateList.forEach(d => {
      const raw = dayCache[d] || [];
      raw.forEach(item => {
        counts.ALL++;
        if (item.type === 'Ziyadah') counts.Ziyadah++;
        else if (item.type === 'Murojaah') counts.Murojaah++;
        else if (item.type === 'Binnadzor') counts.Binnadzor++;
        else if (item.type === 'Pembelajaran') {
          if (item.tipeKelas && item.tipeKelas.toLowerCase().includes('istimewa')) {
            counts.Istimewa++;
          } else {
            counts.Jilid++;
          }
        }
      });

      const filtered = filterDayItems(raw);
      total += filtered.length;
      items.push(...filtered);
    });

    return { totalMatchingRecords: total, allMatchingItems: items, categoryCounts: counts };
  }, [dateList, dayCache, filterDayItems]);

  // Active filter status
  const isFilterActive = useMemo(() => {
    return (
      !!searchQuery.trim() ||
      kategoriFilter !== 'ALL' ||
      nilaiFilter !== 'ALL' ||
      periodPreset !== 'hari_ini'
    );
  }, [searchQuery, kategoriFilter, nilaiFilter, periodPreset]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (kategoriFilter !== 'ALL') count++;
    if (nilaiFilter !== 'ALL') count++;
    if (periodPreset !== 'hari_ini') count++;
    return count;
  }, [searchQuery, kategoriFilter, nilaiFilter, periodPreset]);

  const resetFilters = () => {
    setSearchQuery('');
    setKategoriFilter('ALL');
    setNilaiFilter('ALL');
    setPeriodPreset('hari_ini');
    setCustomStartDate(today);
    setCustomEndDate(today);
    setExtraDaysCount(0);
  };

  // Period label text
  const activePeriodLabel = useMemo(() => {
    if (periodPreset === 'hari_ini') return 'Hari Ini';
    if (periodPreset === '7_hari') return '7 Hari Terakhir';
    if (periodPreset === '30_hari') return '30 Hari Terakhir';
    if (periodPreset === 'bulan_ini') return 'Bulan Ini';
    if (periodPreset === 'rentang_tanggal') {
      if (customStartDate === customEndDate) return `Tanggal ${formatTanggalRingkas(customStartDate)}`;
      return `${formatTanggalRingkas(customStartDate)} – ${formatTanggalRingkas(customEndDate)}`;
    }
    return 'Hari Ini';
  }, [periodPreset, customStartDate, customEndDate]);

  // Batch actions
  const toggleSelectAllVisible = () => {
    if (selectedIds.size === allMatchingItems.length && allMatchingItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allMatchingItems.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete Single Record (Soft Delete 15 hari)
  const confirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const deleterName = currentUser.name || currentUser.username || 'Ustadz / Admin';
    try {
      await storageService.deleteRecord(itemToDelete.type, itemToDelete.id, deleterName);
      // Remove from local dayCache
      const d = (itemToDelete.timestamp || '').slice(0, 10);
      setDayCache(prev => ({
        ...prev,
        [d]: (prev[d] || []).filter(i => i.id !== itemToDelete.id)
      }));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemToDelete.id);
        return next;
      });
      onDataChanged();
      onNotify('success', `Data setoran untuk ${itemToDelete.namaSantri} dipindahkan ke Tempat Sampah (dapat dipulihkan dalam 15 hari).`);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to soft delete:', err);
      onNotify('error', 'Gagal memindahkan rekaman ke Tempat Sampah.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete Batch Records (Soft Delete 15 hari)
  const confirmBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchDeleting(true);
    const deleterName = currentUser.name || currentUser.username || 'Ustadz / Admin';
    try {
      const itemsToDel = allMatchingItems
        .filter(i => selectedIds.has(i.id))
        .map(i => ({ type: i.type, id: i.id }));
      await storageService.deleteRecordsBatch(itemsToDel, deleterName);

      // Remove from local dayCache
      setDayCache(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(date => {
          updated[date] = (updated[date] || []).filter(i => !selectedIds.has(i.id));
        });
        return updated;
      });
      setSelectedIds(new Set());
      setIsBatchDeleteModalOpen(false);
      onDataChanged();
      onNotify('success', `${itemsToDel.length} rekaman berhasil dipindahkan ke Tempat Sampah (dapat dipulihkan dalam 15 hari).`);
    } catch (err) {
      console.error('Failed to batch delete:', err);
      onNotify('error', 'Gagal memindahkan rekaman ke Tempat Sampah.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Edit Modal Handlers
  const openEditModal = (item: CombinedHistoryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setEditNilai(item.nilai);
    if (item.type === 'Ziyadah') {
      setEditSurah(item.surah || SURAH_LIST[0].nameLatin);
      setEditAyatAwal(item.ayatAwal || 1);
      setEditAyatAkhir(item.ayatAkhir || 1);
    } else {
      setEditSurahAtauJuz(item.surahAtauJuz || item.materi);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      if (editingItem.type === 'Ziyadah') {
        const surahMeta = SURAH_LIST.find(s => s.nameLatin === editSurah);
        await storageService.updateRecord('Ziyadah', editingItem.id, {
          surah: editSurah,
          surahNumber: surahMeta?.number,
          ayatAwal: Number(editAyatAwal),
          ayatAkhir: Number(editAyatAkhir),
          nilai: editNilai
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
          surahAtauJuz: editSurahAtauJuz.trim(),
          nilai: editNilai
        });
      }

      // Update in local dayCache
      const d = (editingItem.timestamp || '').slice(0, 10);
      setDayCache(prev => ({
        ...prev,
        [d]: (prev[d] || []).map(item => {
          if (item.id !== editingItem.id) return item;
          return {
            ...item,
            nilai: editNilai,
            materi: editingItem.type === 'Ziyadah'
              ? `${editSurah} • ayat ${editAyatAwal}-${editAyatAkhir}`
              : editSurahAtauJuz.trim(),
            surah: editSurah,
            ayatAwal: Number(editAyatAwal),
            ayatAkhir: Number(editAyatAkhir),
            surahAtauJuz: editSurahAtauJuz.trim()
          };
        })
      }));

      onDataChanged();
      onNotify('success', 'Perubahan berhasil disimpan.');
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to save edit:', err);
      onNotify('error', 'Gagal menyimpan perubahan.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // WhatsApp Link
  const buildWhatsAppLink = (item: CombinedHistoryItem): string | null => {
    const santri = santriList.find(s => s.idSantri === item.idSantri);
    if (!santri?.waliKontak) return null;
    const phone = formatPhoneForWA(santri.waliKontak);
    const msg = buildWhatsAppMessage(
      item.namaSantri,
      item.timestamp,
      item.type,
      item.materi,
      item.nilai,
      item.catatan,
      {
        hukumTajwid: item.hukumTajwid,
        makhrojHuruf: item.makhrojHuruf,
        kefasihan: item.kefasihan,
        kelancaran: item.kelancaran
      }
    );
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // CSV Export
  const exportToCSV = async () => {
    // If range is broader than cached, query the full active period first
    let itemsToExport = allMatchingItems;
    if (periodPreset !== 'hari_ini') {
      try {
        const fullRange = await storageService.fetchRecordsForDateRange(periodStartDate, periodEndDate);
        itemsToExport = filterDayItems(fullRange);
      } catch (err) {
        console.warn('Using cached records for CSV export:', err);
      }
    }

    const headers = [
      'ID', 'Waktu', 'Kategori', 'ID Santri', 'Nama Santri',
      'Materi', 'Nilai', 'Tajwid', 'Makhroj', 'Fashohah', 'Kelancaran', 'Catatan', 'Input By'
    ];

    const rows = itemsToExport.map(i => [
      i.id,
      i.timestamp,
      i.type,
      i.idSantri,
      `"${(i.namaSantri || '').replace(/"/g, '""')}"`,
      `"${(i.materi || '').replace(/"/g, '""')}"`,
      i.nilai,
      i.hukumTajwid || '-',
      i.makhrojHuruf || '-',
      i.kefasihan || '-',
      i.kelancaran || '-',
      `"${(i.catatan || '').replace(/"/g, '""')}"`,
      `"${(i.inputBy || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `riwayat-setoran-${periodPreset}-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('success', 'Data riwayat berhasil diexport ke CSV.');
  };

  // Helper for category breakdown text in accordion header
  const getCategoryBreakdown = (items: CombinedHistoryItem[]): string => {
    if (items.length === 0) return '';
    const counts: Record<string, number> = {};
    items.forEach(i => {
      const label = i.type === 'Murojaah' ? "Muroja'ah" : i.type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cat, cnt]) => `${cnt} ${cat}`)
      .join(' · ');
  };

  const editSurahMeta = SURAH_LIST.find(s => s.nameLatin === editSurah) || SURAH_LIST[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. TOP AREA: Judul + Ringkasan Periode & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Riwayat Setoran
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span>Periode:</span>
            <strong className="text-emerald-900">{activePeriodLabel}</strong>
            <span>·</span>
            <span>{totalMatchingRecords} setoran tercatat</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => setShowTrashModal(true)}
              className="ui-control inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Tempat Sampah (Pemulihan dalam 15 hari)"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Tempat Sampah</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="ui-control inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unduh Laporan PDF</span>
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="ui-control inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER BAR: [Search] [Kategori] [Nilai] */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search */}
          <div className="sm:col-span-6 lg:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri, surah, materi, ustadz..."
              aria-label="Cari riwayat setoran"
              className="ui-control w-full pl-9 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Kategori Select */}
          <div className="sm:col-span-3 lg:col-span-3">
            <select
              aria-label="Filter kategori setoran"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value as KategoriFilter)}
              className="ui-control w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
              <option value="Murojaah">Muroja'ah (Pengulangan)</option>
              <option value="Binnadzor">Binnadzor (Tilawah)</option>
              <option value="Jilid">Jilid Ummi Dewasa</option>
              <option value="Istimewa">Kelas Istimewa</option>
            </select>
          </div>

          {/* Nilai Select */}
          <div className="sm:col-span-3 lg:col-span-3">
            <select
              aria-label="Filter predikat nilai setoran"
              value={nilaiFilter}
              onChange={(e) => setNilaiFilter(e.target.value)}
              className="ui-control w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="ALL">Semua Nilai</option>
              {PREDIKAT_NILAI_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. SATU SEGMENTED PERIOD SELECTOR */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div
            className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-semibold overflow-x-auto max-w-full"
            role="group"
            aria-label="Segmented period selector"
          >
            {[
              ['hari_ini', 'Hari Ini'],
              ['7_hari', '7 Hari'],
              ['30_hari', '30 Hari'],
              ['bulan_ini', 'Bulan Ini'],
              ['rentang_tanggal', 'Rentang Tanggal']
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPeriodPreset(val as PeriodPreset)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                  periodPreset === val
                    ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if Rentang Tanggal selected */}
          {periodPreset === 'rentang_tanggal' && (
            <div className="flex items-center gap-2 flex-wrap bg-emerald-50/70 border border-emerald-200 p-1.5 rounded-xl text-xs animate-in fade-in">
              <span className="font-semibold text-emerald-900 text-[11px]">Dari:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 text-xs"
              />
              <span className="font-semibold text-emerald-900 text-[11px]">Sampai:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md font-bold text-slate-800 text-xs"
              />
            </div>
          )}
        </div>

        {/* 4. CATEGORY CHIPS */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {KATEGORI_OPTIONS.map(cat => {
            const isSelected = kategoriFilter === cat.id;
            const count = categoryCounts[cat.id] || 0;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setKategoriFilter(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 5. ACTIVE FILTER SUMMARY CHIP (Only shown if active) */}
        {isFilterActive && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-900 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {activeFilterCount} filter aktif
                {searchQuery.trim() ? ` · Pencarian: "${searchQuery}"` : ''}
              </span>
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* BATCH SELECTION BAR (Sticky or floating when items are checked) */}
      {!isViewOnly && selectedIds.size > 0 && (
        <div className="sticky top-2 z-20 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[11px]">
              {selectedIds.size}
            </span>
            <span>rekaman dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.size} Rekaman (Tempat Sampah)</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. ACCORDION PER HARI */}
      <div className="space-y-3">
        {dateList.map((dateStr) => {
          const isToday = dateStr === today;
          const isExpanded = expandedDays.has(dateStr);
          const rawItems = dayCache[dateStr] || [];
          const filteredItems = filterDayItems(rawItems);
          const isDayLoading = loadingDays[dateStr] || (isToday && isInitialLoading);
          const breakdown = getCategoryBreakdown(filteredItems);

          // If filter is active and this day has 0 matches, skip past days (keep today visible)
          if (isFilterActive && filteredItems.length === 0 && !isToday) {
            return null;
          }

          return (
            <div
              key={dateStr}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
            >
              {/* ACCORDION HEADER */}
              <button
                type="button"
                onClick={() => toggleDayAccordion(dateStr)}
                className={`w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                  isExpanded ? 'bg-slate-50/80 border-b border-slate-200/80' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-slate-500 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-emerald-800" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs sm:text-sm font-black tracking-tight ${
                        isToday ? 'text-emerald-900' : 'text-slate-900'
                      }`}>
                        {isToday ? 'HARI INI' : formatTanggalLengkap(dateStr).toUpperCase()}
                      </span>
                      {isToday && (
                        <span className="text-xs font-semibold text-slate-500">
                          · {formatTanggalLengkap(dateStr)}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200/70 text-slate-700">
                        {isDayLoading ? 'Memuat...' : `${filteredItems.length} setoran`}
                      </span>
                    </div>
                    {/* Breakdown subline */}
                    {breakdown && (
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                        {breakdown}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-400 hidden sm:block flex-shrink-0">
                  {isExpanded ? 'Tutup' : 'Buka'}
                </div>
              </button>

              {/* ACCORDION CONTENT */}
              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {isDayLoading ? (
                    <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                      <div className="w-5 h-5 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <span className="text-xs font-semibold text-slate-500">
                        {isToday ? 'Memuat riwayat hari ini...' : 'Memuat setoran...'}
                      </span>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="py-7 px-4 flex flex-col items-center justify-center text-center">
                      <Inbox className="w-6 h-6 text-slate-300 mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">
                        {isToday ? 'Belum ada setoran hari ini.' : 'Tidak ada data setoran untuk tanggal ini.'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isFilterActive
                          ? 'Tidak ada rekaman yang sesuai dengan filter aktif.'
                          : 'Setoran santri pada hari ini akan muncul di sini.'}
                      </p>
                    </div>
                  ) : (
                    filteredItems.map(item => {
                      const isRowExpanded = expandedRowIds.has(item.id);
                      const isChecked = selectedIds.has(item.id);
                      const timeOnly = (item.timestamp || '').split(' ')[1] || (item.timestamp || '').split('T')[1]?.slice(0, 5) || '00:00';
                      const waLink = !isViewOnly ? buildWhatsAppLink(item) : null;

                      // Type badge meta
                      const typeBadge =
                        item.type === 'Ziyadah'
                          ? { short: 'Zyd', label: 'Ziyadah', color: 'bg-emerald-100 text-emerald-800' }
                          : item.type === 'Murojaah'
                          ? { short: 'Mrj', label: "Muroja'ah", color: 'bg-teal-100 text-teal-800' }
                          : item.type === 'Binnadzor'
                          ? { short: 'Bnd', label: 'Binnadzor', color: 'bg-indigo-100 text-indigo-800' }
                          : item.tipeKelas && item.tipeKelas.toLowerCase().includes('istimewa')
                          ? { short: 'Ist', label: 'Istimewa', color: 'bg-purple-100 text-purple-800' }
                          : { short: 'Ummi', label: 'Jilid Ummi', color: 'bg-amber-100 text-amber-800' };

                      // Nilai badge color
                      const nilaiColor =
                        item.nilai === 'Sangat Baik'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.nilai === 'Baik'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : item.nilai === 'Kurang'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200';

                      return (
                        <div
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* ROW SUMMARY: Waktu | Jenis | Santri + Materi | Nilai | Expand */}
                          <div
                            onClick={() => toggleRowDetail(item.id)}
                            className="px-4 py-2.5 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Checkbox (batch actions) */}
                              {!isViewOnly && (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onClick={(e) => toggleSelectItem(item.id, e)}
                                  onChange={() => {}}
                                  aria-label={`Pilih setoran ${item.namaSantri}`}
                                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer flex-shrink-0"
                                />
                              )}

                              {/* Waktu */}
                              <span className="text-[11px] font-mono font-bold text-slate-500 flex-shrink-0">
                                {timeOnly}
                              </span>

                              {/* Jenis Badge */}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${typeBadge.color}`}
                                title={typeBadge.label}
                              >
                                {typeBadge.short}
                              </span>

                              {/* Santri + Materi */}
                              <div className="min-w-0 flex-1 truncate text-xs">
                                <span className="font-extrabold text-slate-900 mr-1.5">
                                  {item.namaSantri}
                                </span>
                                <span className="text-slate-400 mr-1.5">·</span>
                                <span className="text-slate-600 font-medium truncate">
                                  {item.materi}
                                </span>
                              </div>
                            </div>

                            {/* Nilai + Expand Icon */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${nilaiColor}`}>
                                {item.nilai}
                              </span>
                              <div className="text-slate-400">
                                {isRowExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-emerald-800" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* EXPANDED ROW DETAIL */}
                          {isRowExpanded && (
                            <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 text-xs space-y-2.5 animate-in fade-in">
                              {/* Meta: Input By & Timestamp */}
                              <div className="flex items-center justify-between gap-2 text-slate-500 text-[11px]">
                                <span>Diinput oleh: <strong className="text-slate-700">{item.inputBy || 'Ustadz'}</strong></span>
                                <span>{item.timestamp}</span>
                              </div>

                              {/* Quality reading aspects */}
                              {(item.hukumTajwid || item.makhrojHuruf || item.kefasihan || item.kelancaran) && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                  {item.hukumTajwid && (
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                      <span className="text-[10px] font-bold uppercase text-slate-400">Tajwid</span>
                                      <p className="text-xs font-bold text-slate-800 mt-0.5">{item.hukumTajwid}</p>
                                    </div>
                                  )}
                                  {item.makhrojHuruf && (
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                      <span className="text-[10px] font-bold uppercase text-slate-400">Makhroj</span>
                                      <p className="text-xs font-bold text-slate-800 mt-0.5">{item.makhrojHuruf}</p>
                                    </div>
                                  )}
                                  {item.kefasihan && (
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                      <span className="text-[10px] font-bold uppercase text-slate-400">Fashohah</span>
                                      <p className="text-xs font-bold text-slate-800 mt-0.5">{item.kefasihan}</p>
                                    </div>
                                  )}
                                  {item.kelancaran && (
                                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                                      <span className="text-[10px] font-bold uppercase text-slate-400">Kelancaran</span>
                                      <p className="text-xs font-bold text-slate-800 mt-0.5">{item.kelancaran}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Kenaikan / Pendampingan */}
                              {(item.statusKenaikan || item.kendalaSantri || item.rekomendasiTindakLanjut) && (
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                                  {item.statusKenaikan && (
                                    <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                                      <span>Status Kenaikan:</span>
                                      <span className="px-1.5 py-0.5 bg-emerald-50 rounded font-bold">{item.statusKenaikan}</span>
                                    </div>
                                  )}
                                  {item.kendalaSantri && (
                                    <p className="text-slate-700">
                                      <strong className="text-rose-700">Kendala: </strong>{item.kendalaSantri}
                                    </p>
                                  )}
                                  {item.rekomendasiTindakLanjut && (
                                    <p className="text-slate-700">
                                      <strong className="text-emerald-700">Tindak Lanjut: </strong>{item.rekomendasiTindakLanjut}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Catatan */}
                              {item.catatan && (
                                <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-200/60 text-[11px] text-amber-950">
                                  <strong>Catatan: </strong>{item.catatan}
                                </div>
                              )}

                              {/* Actions inside expanded row */}
                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Kirim WA ke Wali</span>
                                  </a>
                                )}
                                {!isViewOnly && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => openEditModal(item, e)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setItemToDelete(item);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Hapus</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 7. MUAT RIWAYAT HARI SEBELUMNYA */}
        {dateList.length > 0 && (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setExtraDaysCount(prev => prev + 7)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Muat Riwayat Hari Sebelumnya (+7 Hari)</span>
            </button>
          </div>
        )}
      </div>

      {/* 8. MODALS */}

      {/* Unduh Laporan Modal */}
      <UnduhLaporanModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        currentUser={currentUser}
        santriList={santriList}
        ziyadahRecords={ziyadahRecords}
        murojaahRecords={murojaahRecords}
        binnadzorRecords={binnadzorRecords}
        pembelajaranRecords={pembelajaranRecords}
      />

      {/* Tempat Sampah Modal (15 Hari Soft Delete Retention) */}
      <TrashBinModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        onRestoreSuccess={() => {
          onDataChanged();
          // Reload current active range
          loadDateRange(periodStartDate, periodEndDate);
        }}
        onNotify={onNotify}
        currentUser={currentUser}
      />

      {/* Single Item Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          ref={deleteDialogRef}
          className="ui-dialog-overlay"
          onClick={() => !isDeleting && setItemToDelete(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="ui-dialog-panel max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-dialog-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Hapus Rekaman Histori
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data dapat dipulihkan dari Tempat Sampah dalam 15 hari.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setItemToDelete(null)}
                disabled={isDeleting}
                className="ui-dialog-close cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <div>Santri: <strong className="text-slate-900">{itemToDelete.namaSantri}</strong></div>
                <div>Kategori: <strong className="text-emerald-900">{itemToDelete.type}</strong></div>
                <div>Materi: <span className="text-slate-700">{itemToDelete.materi}</span></div>
                <div>Waktu: <span className="text-slate-500">{itemToDelete.timestamp}</span></div>
              </div>
              <p className="text-slate-600">
                Apakah Anda yakin ingin memindahkan rekaman ini ke Tempat Sampah? Rekaman akan otomatis dihapus permanen setelah 15 hari.
              </p>
            </div>

            <div className="ui-dialog-footer">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="ui-dialog-button-cancel cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSingleDelete}
                disabled={isDeleting}
                className="ui-dialog-button-confirm bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {isDeleting ? 'Memindahkan...' : 'Pindahkan ke Tempat Sampah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <div
          ref={batchDeleteDialogRef}
          className="ui-dialog-overlay"
          onClick={() => !isBatchDeleting && setIsBatchDeleteModalOpen(false)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="ui-dialog-panel max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-dialog-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Hapus {selectedIds.size} Rekaman Terpilih
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data dapat dipulihkan dalam 15 hari melalui Tempat Sampah.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isBatchDeleting && setIsBatchDeleteModalOpen(false)}
                disabled={isBatchDeleting}
                className="ui-dialog-close cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-600">
              <p>
                Anda akan memindahkan <strong className="text-rose-900">{selectedIds.size} rekaman setoran</strong> ke Tempat Sampah.
              </p>
              <p className="text-slate-500">
                Semua rekaman yang dipindahkan dapat dipulihkan kapan saja sebelum masa retensi 15 hari berakhir.
              </p>
            </div>

            <div className="ui-dialog-footer">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                disabled={isBatchDeleting}
                className="ui-dialog-button-cancel cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmBatchDelete}
                disabled={isBatchDeleting}
                className="ui-dialog-button-confirm bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {isBatchDeleting ? 'Memindahkan...' : `Hapus ${selectedIds.size} Rekaman`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingItem && (
        <div
          ref={editDialogRef}
          className="ui-dialog-overlay"
          onClick={() => !isSavingEdit && setEditingItem(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div
            className="ui-dialog-panel max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-dialog-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-800">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight text-slate-900">
                    Edit Rekaman {editingItem.type}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingItem.namaSantri} · {editingItem.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingEdit && setEditingItem(null)}
                disabled={isSavingEdit}
                className="ui-dialog-close cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 space-y-4 text-xs">
              {editingItem.type === 'Ziyadah' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Surah
                    </label>
                    <select
                      value={editSurah}
                      onChange={(e) => {
                        setEditSurah(e.target.value);
                        setEditAyatAwal(1);
                        setEditAyatAkhir(1);
                      }}
                      className="ui-control w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs"
                    >
                      {SURAH_LIST.map(s => (
                        <option key={s.number} value={s.nameLatin}>
                          {s.number}. {s.nameLatin} ({s.numberOfAyahs} ayat)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ayat Awal
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={editSurahMeta.numberOfAyahs}
                        value={editAyatAwal}
                        onChange={(e) => setEditAyatAwal(Number(e.target.value))}
                        className="ui-control w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ayat Akhir
                      </label>
                      <input
                        type="number"
                        min={editAyatAwal}
                        max={editSurahMeta.numberOfAyahs}
                        value={editAyatAkhir}
                        onChange={(e) => setEditAyatAkhir(Number(e.target.value))}
                        className="ui-control w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Materi / Surah / Halaman
                  </label>
                  <input
                    type="text"
                    value={editSurahAtauJuz}
                    onChange={(e) => setEditSurahAtauJuz(e.target.value)}
                    className="ui-control w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Predikat Nilai
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PREDIKAT_NILAI_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditNilai(opt.value as PredikatNilai)}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        editNilai === opt.value
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ui-dialog-footer pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSavingEdit}
                  className="ui-dialog-button-cancel cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="ui-dialog-button-confirm bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
