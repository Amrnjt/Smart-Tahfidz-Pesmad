import React, { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  BookPlus,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  GraduationCap,
  Layers,
  RotateCw,
  Search,
} from 'lucide-react';
import type {
  BinnadzorRecord,
  CombinedHistoryItem,
  MurojaahRecord,
  PembelajaranRecord,
  Santri,
  User,
  ZiyadahRecord,
} from '../types';
import { parseDateSafe, formatTanggalLengkap } from '../utils/dateFormatter';
import {
  deduplicateHistoryItems,
  getHistoryItemKey,
  groupHistoryItemsByDate,
} from '../utils/historyUtils';
import { UnduhLaporanModal } from './UnduhLaporanModal';

interface PimpinanHistoryTableProps {
  currentUser: User;
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  binnadzorRecords: BinnadzorRecord[];
  pembelajaranRecords: PembelajaranRecord[];
  santriList: Santri[];
}

type Category = 'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran';

const CATEGORY_OPTIONS: Array<{
  id: Category;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'ALL', label: 'Semua', icon: Layers },
  { id: 'Ziyadah', label: 'Ziyadah', icon: BookPlus },
  { id: 'Murojaah', label: "Muroja'ah", icon: RotateCw },
  { id: 'Binnadzor', label: 'Binnadzor', icon: BookOpenCheck },
  { id: 'Pembelajaran', label: 'Pembelajaran', icon: GraduationCap },
];

function toHistoryItems(
  ziyadahRecords: ZiyadahRecord[],
  murojaahRecords: MurojaahRecord[],
  binnadzorRecords: BinnadzorRecord[],
  pembelajaranRecords: PembelajaranRecord[],
): CombinedHistoryItem[] {
  const items: CombinedHistoryItem[] = [
    ...ziyadahRecords.map(record => ({
      id: record.id,
      type: 'Ziyadah' as const,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: record.namaSantri || record.idSantri,
      materi: `${record.surah} (Ayat ${record.ayatAwal} - ${record.ayatAkhir})`,
      nilai: record.nilai,
      catatan: record.catatan,
      inputBy: record.inputBy,
      surah: record.surah,
      ayatAwal: record.ayatAwal,
      ayatAkhir: record.ayatAkhir,
    })),
    ...murojaahRecords.map(record => ({
      id: record.id,
      type: 'Murojaah' as const,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: record.namaSantri || record.idSantri,
      materi: record.surahAtauJuz,
      nilai: record.nilai,
      catatan: record.catatan,
      inputBy: record.inputBy,
      surahAtauJuz: record.surahAtauJuz,
    })),
    ...binnadzorRecords.map(record => ({
      id: record.id,
      type: 'Binnadzor' as const,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: record.namaSantri || record.idSantri,
      materi: record.materi,
      nilai: record.nilai,
      catatan: record.catatan,
      inputBy: record.inputBy,
      surah: record.surah,
      ayatAwal: record.ayatAwal,
      ayatAkhir: record.ayatAkhir,
    })),
    ...pembelajaranRecords.map(record => ({
      id: record.id,
      type: 'Pembelajaran' as const,
      timestamp: record.timestamp,
      idSantri: record.idSantri,
      namaSantri: record.namaSantri || record.idSantri,
      materi: record.materiPokok || record.materi || record.jilidAtauKategori || record.namaKelas || 'Pembelajaran',
      nilai: record.nilai,
      catatan: record.catatan || record.catatanBimbingan || '',
      inputBy: record.inputBy,
      tipeKelas: record.tipeKelas,
      statusKenaikan: record.statusKenaikan,
      hukumTajwid: record.hukumTajwid,
      makhrojHuruf: record.makhrojHuruf,
      kefasihan: record.kefasihan,
      kelancaran: record.kelancaran,
      kendalaSantri: record.kendalaSantri,
      rekomendasiTindakLanjut: record.rekomendasiTindakLanjut,
    })),
  ];

  items.sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());
  return deduplicateHistoryItems(items);
}

export const PimpinanHistoryTable: React.FC<PimpinanHistoryTableProps> = ({
  currentUser,
  ziyadahRecords,
  murojaahRecords,
  binnadzorRecords,
  pembelajaranRecords,
  santriList,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<Category>('ALL');
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const allItems = useMemo(
    () => toHistoryItems(ziyadahRecords, murojaahRecords, binnadzorRecords, pembelajaranRecords),
    [ziyadahRecords, murojaahRecords, binnadzorRecords, pembelajaranRecords],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allItems.filter(item => {
      if (category !== 'ALL' && item.type !== category) return false;
      if (!query) return true;
      return [
        item.namaSantri,
        item.idSantri,
        item.materi,
        item.nilai,
        item.catatan,
        item.inputBy,
        formatTanggalLengkap(item.timestamp),
      ].some(value => String(value || '').toLowerCase().includes(query));
    });
  }, [allItems, category, searchQuery]);

  const groups = useMemo(() => groupHistoryItemsByDate(filteredItems), [filteredItems]);

  const effectiveExpandedDateKey =
    expandedDateKey && groups.some(group => group.dateKey === expandedDateKey)
      ? expandedDateKey
      : groups[0]?.dateKey || null;

  return (
    <section className="space-y-4" aria-label="Riwayat global Pimpinan">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <FileText className="h-3.5 w-3.5" />
              View-only global
            </div>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">Riwayat Seluruh Santri</h1>
            <p className="mt-1 text-sm text-slate-500">
              Akses monitoring untuk Pimpinan. Tidak tersedia aksi edit, hapus, atau input setoran.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Download className="h-4 w-4" />
            Unduh Laporan
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Cari riwayat</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Cari santri, materi, nilai, penginput..."
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="flex flex-wrap gap-2" aria-label="Filter kategori">
            {CATEGORY_OPTIONS.map(option => {
              const Icon = option.icon;
              const active = category === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
            Tidak ada riwayat yang sesuai dengan filter saat ini.
          </div>
        ) : (
          groups.map(group => {
            const isExpanded = effectiveExpandedDateKey === group.dateKey;
            return (
              <article key={group.dateKey} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedDateKey(current => current === group.dateKey ? null : group.dateKey)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
                  aria-expanded={isExpanded}
                >
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{formatTanggalLengkap(`${group.dateKey} 00:00`)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{group.items.length} rekaman</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {group.items.map(item => (
                      <div
                        key={getHistoryItemKey(item)}
                        className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_auto] sm:items-center sm:px-5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{item.namaSantri}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{item.idSantri} · {item.type}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">{item.materi}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{item.catatan || 'Tanpa catatan'} · oleh {item.inputBy}</p>
                        </div>
                        <span className="inline-flex w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {item.nilai}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

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
    </section>
  );
};
