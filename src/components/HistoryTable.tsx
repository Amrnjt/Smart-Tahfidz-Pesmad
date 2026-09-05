import React, { useState, useMemo, useEffect } from 'react';
import { User, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, Santri, PredikatNilai, PREDIKAT_NILAI_OPTIONS } from '../types';
import { storageService } from '../services/storageService';
import { SURAH_LIST } from '../data/quranSurahs';
import { Search, Trash2, BookOpen, RotateCw, BookOpenCheck, Download, Calendar, Clock, FileText, MessageCircle, SquarePen as Pencil, X, Save, ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import { formatTanggalLengkap, parseDateSafe } from '../utils/dateFormatter';
import { TableSkeleton } from './SkeletonLoading';
import { UnduhLaporanModal } from './UnduhLaporanModal';
import { getClassGroup } from '../utils/classUtils';

interface EditableItem {
  id: string;
  type: 'Ziyadah' | 'Murojaah' | 'Binnadzor';
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
  onDataChanged: () => void;
  isLoading?: boolean;
  santriList?: Santri[];
}

interface CombinedItem {
  id: string;
  type: 'Ziyadah' | 'Murojaah' | 'Binnadzor';
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

export const HistoryTable: React.FC<HistoryTableProps> = ({
  currentUser, ziyadahRecords, murojaahRecords, binnadzorRecords, onDataChanged, isLoading = false, santriList = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor'>('ALL');
  const [nilaiFilter, setNilaiFilter] = useState<string>('ALL');
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeMonthKey, setActiveMonthKey] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hasSetDefaultMonth, setHasSetDefaultMonth] = useState(false);

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
      }))
    ];
    items.sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());
    return items;
  }, [filteredZiyadah, filteredMurojaah, filteredBinnadzor]);

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

  // Filter items by active month + search/filters
  const displayedItems = useMemo(() => {
    return combinedItems.filter(item => {
      const inMonth = getMonthKey(item.timestamp) === activeMonthKey;
      if (!inMonth) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.namaSantri.toLowerCase().includes(q) ||
        item.idSantri.toLowerCase().includes(q) ||
        item.materi.toLowerCase().includes(q) ||
        item.catatan.toLowerCase().includes(q) ||
        item.inputBy.toLowerCase().includes(q) ||
        formatTanggalLengkap(item.timestamp).toLowerCase().includes(q);
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchesNilai = nilaiFilter === 'ALL' || item.nilai === nilaiFilter;

      return matchesSearch && matchesType && matchesNilai;
    });
  }, [combinedItems, activeMonthKey, searchQuery, typeFilter, nilaiFilter]);

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
    const headers = ['ID', 'Keterangan Tanggal & Waktu', 'Timestamp Mentah', 'Jenis', 'ID Santri', 'Nama Santri', 'Materi Hafalan', 'Nilai', 'Catatan', 'Input By'];
    const rows = displayedItems.map(i => [
      i.id, `"${formatTanggalLengkap(i.timestamp)}"`, i.timestamp, i.type, i.idSantri,
      `"${i.namaSantri}"`, `"${i.materi}"`, i.nilai,
      `"${i.catatan.replace(/"/g, '""')}"`, `"${i.inputBy}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_tahfidz_${currentUser.role.toLowerCase()}_${activeMonthKey || 'all'}.csv`);
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
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="Ziyadah">Ziyadah</option>
            <option value="Murojaah">Muroja'ah</option>
            <option value="Binnadzor">Binnadzor</option>
          </select>
          <select
            value={nilaiFilter}
            onChange={(e) => setNilaiFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Nilai</option>
            {PREDIKAT_NILAI_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Tabs - horizontally scrollable */}
      <div className="flex-shrink-0 py-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
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

      {/* Scrollable Content Area - fixed height */}
      <div className="flex-1 overflow-y-auto min-h-0 rounded-xl border border-slate-100 bg-slate-50/50">
        {displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Inbox className="w-10 h-10 mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Tidak ada setoran pada bulan ini</p>
            <p className="text-xs text-slate-400 mt-0.5">Pilih bulan lain atau ubah filter pencarian</p>
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
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                          <BookOpenCheck className="w-2.5 h-2.5" /> Bnd
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
                        </div>

                        {/* Right column */}
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-400 font-semibold w-16 flex-shrink-0 mt-0.5">Catatan</span>
                            <span className="text-slate-600 italic flex-1">{item.catatan || '-'}</span>
                          </div>
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
          Menampilkan <b className="text-slate-700">{displayedItems.length}</b> setoran
          {activeMonthKey && <> di <b className="text-slate-700">{getMonthLabel(activeMonthKey)}</b></>}
          {' '}dari total {combinedItems.length} setoran
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Materi Hafalan (Surah / Juz)</label>
                  <input type="text" required value={editSurahAtauJuz} onChange={(e) => setEditSurahAtauJuz(e.target.value)}
                    placeholder="Contoh: Juz 30 atau Surah Al-Mulk"
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nilai / Kualitas Hafalan</label>
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
      />
    </div>
  );
};
