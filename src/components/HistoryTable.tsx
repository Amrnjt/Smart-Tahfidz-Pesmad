import React, { useState } from 'react';
import { User, ZiyadahRecord, MurojaahRecord, Santri } from '../types';
import { storageService } from '../services/storageService';
import { Search, Filter, Trash2, BookOpen, RotateCw, CheckCircle, AlertTriangle, Download, Shield, Calendar, Clock, FileText, MessageCircle } from 'lucide-react';
import { formatTanggalLengkap, parseDateSafe } from '../utils/dateFormatter';
import { TableSkeleton } from './SkeletonLoading';
import { UnduhLaporanModal } from './UnduhLaporanModal';

interface HistoryTableProps {
  currentUser: User;
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  onDataChanged: () => void;
  isLoading?: boolean;
  santriList?: Santri[];
}

// Format phone number: convert leading "0" to "62", strip non-digits
function formatPhoneForWA(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('62')) {
    // already correct
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Build the WhatsApp message text
function buildWhatsAppMessage(
  namaSantri: string,
  timestamp: string,
  jenis: string,
  materi: string,
  nilai: string,
  catatan: string
): string {
  const tanggal = formatTanggalLengkap(timestamp);
  const pesan =
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
    `Yth. Bapak/Ibu Wali dari *${namaSantri}*\n` +
    `Berikut laporan perkembangan hafalan dan murojaah santri:\n` +
    `- *Tanggal:* ${tanggal}\n` +
    `- *Jenis:* ${jenis === 'Ziyadah' ? 'Hafalan Baru' : 'Murojaah'}\n` +
    `- *Surah & Ayat:* ${materi}\n` +
    `- *Nilai / Status:* ${nilai}\n` +
    `- *Catatan Ustadz:* ${catatan || '-'}\n` +
    `Jazakumullah khairan.`;
  return pesan;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  currentUser,
  ziyadahRecords,
  murojaahRecords,
  onDataChanged,
  isLoading = false,
  santriList = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Ziyadah' | 'Murojaah'>('ALL');
  const [nilaiFilter, setNilaiFilter] = useState<string>('ALL');
  const [showReportModal, setShowReportModal] = useState(false);

  if (isLoading) {
    return <TableSkeleton rows={7} />;
  }

  // Determine if user has view-only access (Wali & Santri) vs Admin access (Ustadz)
  const isViewOnly = currentUser.role !== 'Ustadz';
  const targetSantriId = currentUser.idSantri || (currentUser.role === 'Santri' ? currentUser.username : '');

  const filteredZiyadah = isViewOnly
    ? ziyadahRecords.filter(r => r.idSantri === targetSantriId)
    : ziyadahRecords;
  const filteredMurojaah = isViewOnly
    ? murojaahRecords.filter(r => r.idSantri === targetSantriId)
    : murojaahRecords;

  // Combine into single timeline
  interface CombinedItem {
    id: string;
    type: 'Ziyadah' | 'Murojaah';
    timestamp: string;
    idSantri: string;
    namaSantri: string;
    materi: string;
    nilai: string;
    catatan: string;
    inputBy: string;
  }

  const combinedItems: CombinedItem[] = [
    ...filteredZiyadah.map(z => ({
      id: z.id,
      type: 'Ziyadah' as const,
      timestamp: z.timestamp,
      idSantri: z.idSantri,
      namaSantri: z.namaSantri || z.idSantri,
      materi: `${z.surah} (Ayat ${z.ayatAwal} - ${z.ayatAkhir})`,
      nilai: z.nilai,
      catatan: z.catatan,
      inputBy: z.inputBy
    })),
    ...filteredMurojaah.map(m => ({
      id: m.id,
      type: 'Murojaah' as const,
      timestamp: m.timestamp,
      idSantri: m.idSantri,
      namaSantri: m.namaSantri || m.idSantri,
      materi: m.surahAtauJuz,
      nilai: m.nilai,
      catatan: m.catatan,
      inputBy: m.inputBy
    }))
  ];

  // Sort by newest timestamp
  combinedItems.sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());

  // Filter based on search query and type
  const displayedItems = combinedItems.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.namaSantri.toLowerCase().includes(q) ||
      item.idSantri.toLowerCase().includes(q) ||
      item.materi.toLowerCase().includes(q) ||
      item.catatan.toLowerCase().includes(q) ||
      item.inputBy.toLowerCase().includes(q) ||
      item.timestamp.toLowerCase().includes(q) ||
      formatTanggalLengkap(item.timestamp).toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    const matchesNilai = nilaiFilter === 'ALL' || item.nilai === nilaiFilter;

    return matchesSearch && matchesType && matchesNilai;
  });

  const handleDelete = async (item: CombinedItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus rekaman setoran ${item.type} untuk ${item.namaSantri}?`)) {
      await storageService.deleteRecord(item.type, item.id);
      onDataChanged();
    }
  };

  // Get wali contact for a santri
  const getWaliContact = (idSantri: string): string => {
    const santri = santriList.find(s => s.idSantri === idSantri);
    return santri?.waliKontak || '';
  };

  // Build WhatsApp link
  const buildWhatsAppLink = (item: CombinedItem): string | null => {
    const waliKontak = getWaliContact(item.idSantri);
    if (!waliKontak) return null;

    const phone = formatPhoneForWA(waliKontak);
    const pesan = buildWhatsAppMessage(
      item.namaSantri,
      item.timestamp,
      item.type,
      item.materi,
      item.nilai,
      item.catatan
    );
    return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Keterangan Tanggal & Waktu', 'Timestamp Mentah', 'Jenis', 'ID Santri', 'Nama Santri', 'Materi Hafalan', 'Nilai', 'Catatan', 'Input By'];
    const rows = displayedItems.map(i => [
      i.id,
      `"${formatTanggalLengkap(i.timestamp)}"`,
      i.timestamp,
      i.type,
      i.idSantri,
      `"${i.namaSantri}"`,
      `"${i.materi}"`,
      i.nilai,
      `"${i.catatan.replace(/"/g, '""')}"`,
      `"${i.inputBy}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_tahfidz_${currentUser.role.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            Riwayat Setoran Hafalan Santri
            {isViewOnly && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Mode View-Only
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'Wali'
              ? 'Laporan lengkap mutaba\'ah setoran Ziyadah & Muroja\'ah ananda'
              : currentUser.role === 'Santri'
              ? 'Riwayat lengkap mutaba\'ah setoran Ziyadah & Muroja\'ah hafalan saya'
              : 'Database mutaba\'ah setoran Ziyadah & Muroja\'ah seluruh kelas (Ustadz)'}
          </p>
          {/* Unduh Laporan Button - Primary */}
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Unduh Laporan (PDF)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tanggal, santri, surah..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="Ziyadah">Ziyadah</option>
            <option value="Murojaah">Muroja'ah</option>
          </select>

          {/* Nilai Filter */}
          <select
            value={nilaiFilter}
            onChange={(e) => setNilaiFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
          >
            <option value="ALL">Semua Nilai</option>
            <option value="Sangat Lancar">🟢 Sangat Lancar</option>
            <option value="Lancar">🟡 Lancar</option>
            <option value="Perlu Ulang">🔴 Perlu Ulang</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={exportToCSV}
            className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Keterangan Tanggal</th>
              <th className="py-3 px-3.5">Santri</th>
              <th className="py-3 px-3.5">Jenis</th>
              <th className="py-3 px-3.5">Materi Hafalan</th>
              <th className="py-3 px-3.5">Nilai</th>
              <th className="py-3 px-3.5">Catatan Ustadz</th>
              {!isViewOnly && <th className="py-3 px-3.5 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={isViewOnly ? 6 : 7} className="py-10 text-center text-slate-400">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Tidak ada data setoran yang sesuai dengan filter.</p>
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                let badgeNilai = null;
                if (item.nilai === 'Sangat Lancar') {
                  badgeNilai = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">
                      🟢 Sangat Lancar
                    </span>
                  );
                } else if (item.nilai === 'Lancar') {
                  badgeNilai = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300">
                      🟡 Lancar
                    </span>
                  );
                } else {
                  badgeNilai = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-300">
                      🔴 Perlu Ulang
                    </span>
                  );
                }

                // Split time part if available
                const timePart = item.timestamp.includes(' ')
                  ? item.timestamp.split(' ')[1]
                  : item.timestamp.includes('T')
                  ? item.timestamp.split('T')[1]?.slice(0, 5)
                  : '';

                // WhatsApp link for this row
                const waLink = !isViewOnly ? buildWhatsAppLink(item) : null;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span>{formatTanggalLengkap(item.timestamp)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 ml-5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{timePart ? `${timePart} WIB` : item.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{item.namaSantri}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.idSantri}</span>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {item.type === 'Ziyadah' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          <BookOpen className="w-3 h-3" /> Ziyadah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[11px] border border-teal-200">
                          <RotateCw className="w-3 h-3" /> Muroja'ah
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {item.materi}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">{badgeNilai}</td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate" title={item.catatan}>
                      {item.catatan || '-'}
                      <div className="text-[10px] text-slate-400">Oleh: {item.inputBy}</div>
                    </td>
                    {!isViewOnly && (
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Kirim WA Button */}
                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition cursor-pointer border border-green-200"
                              title={`Kirim laporan ke wali via WhatsApp`}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed border border-slate-100"
                              title="Nomor HP wali santri belum terdaftar"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </span>
                          )}
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Rekaman Setoran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Menampilkan <b>{displayedItems.length}</b> dari {combinedItems.length} total setoran</span>
        <span className="text-[11px] text-emerald-800 font-semibold">Data Mutaba'ah Terverifikasi</span>
      </div>

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
