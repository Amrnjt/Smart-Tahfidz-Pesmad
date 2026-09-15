import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  X,
  Search,
  AlertTriangle,
  Clock,
  BookOpen,
  RotateCw,
  BookOpenCheck,
  GraduationCap,
  Calendar,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { TrashRecord, User } from '../types';
import { storageService } from '../services/storageService';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  currentUser: User;
}

function formatTanggalLengkap(isoString?: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function getRecoveryDaysRemaining(expiresAt?: string): { days: number; hours: number; isExpired: boolean; label: string } {
  if (!expiresAt) return { days: 0, hours: 0, isExpired: true, label: 'Kedaluwarsa' };
  try {
    const expTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const diffMs = expTime - now;

    if (diffMs <= 0) {
      return { days: 0, hours: 0, isExpired: true, label: 'Kedaluwarsa' };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days >= 1) {
      return { days, hours, isExpired: false, label: `${days} hari lagi` };
    }
    return { days: 0, hours: Math.max(1, hours), isExpired: false, label: `< 24 jam lagi (${Math.max(1, hours)}j)` };
  } catch {
    return { days: 0, hours: 0, isExpired: true, label: 'Kedaluwarsa' };
  }
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
  onNotify
}) => {
  const [trashList, setTrashList] = useState<TrashRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Confirmation dialogs inside the modal
  const [itemToPermanentDelete, setItemToPermanentDelete] = useState<TrashRecord | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState<boolean>(false);

  const loadTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await storageService.fetchTrashRecords();
      setTrashList(records);
    } catch (e) {
      console.error('Failed to load trash records:', e);
      onNotify('error', 'Gagal memuat data Tempat Sampah.');
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    if (isOpen) {
      loadTrash();
    }
  }, [isOpen, loadTrash]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (itemToPermanentDelete) {
          setItemToPermanentDelete(null);
        } else if (showEmptyConfirm) {
          setShowEmptyConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, itemToPermanentDelete, showEmptyConfirm, onClose]);

  const filteredTrash = useMemo(() => {
    return trashList.filter(item => {
      if (filterType !== 'ALL' && item.recordType !== filterType) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const santriName = (item.payload?.santriName || item.payload?.namaSantri || item.payload?.santri?.nama || '').toLowerCase();
      const santriId = (item.payload?.santriId || item.payload?.idSantri || item.payload?.santri?.id || '').toLowerCase();
      const materi = (
        item.payload?.surah ||
        item.payload?.surahAtauJuz ||
        item.payload?.materi ||
        item.payload?.pokokBahasan ||
        ''
      ).toLowerCase();
      const deletedBy = (item.deletedBy || '').toLowerCase();

      return santriName.includes(q) || santriId.includes(q) || materi.includes(q) || deletedBy.includes(q);
    });
  }, [trashList, filterType, searchQuery]);

  const handleRestore = async (item: TrashRecord) => {
    setActionLoadingId(item.id);
    try {
      const res = await storageService.restoreTrashRecord(item.id);
      if (res.success) {
        onNotify('success', `Data ${item.recordType} berhasil dipulihkan ke Riwayat.`);
        setTrashList(prev => prev.filter(t => t.id !== item.id));
        onRestoreSuccess();
      } else {
        onNotify('error', res.message || 'Gagal memulihkan data.');
      }
    } catch (e) {
      console.error('Failed to restore trash record:', e);
      onNotify('error', 'Terjadi kesalahan saat memulihkan data.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!itemToPermanentDelete) return;
    setActionLoadingId(itemToPermanentDelete.id);
    try {
      const ok = await storageService.permanentlyDeleteTrashRecord(itemToPermanentDelete.id);
      if (ok) {
        onNotify('success', 'Data berhasil dihapus permanen.');
        setTrashList(prev => prev.filter(t => t.id !== itemToPermanentDelete.id));
        setItemToPermanentDelete(null);
      } else {
        onNotify('error', 'Gagal menghapus data secara permanen.');
      }
    } catch (e) {
      console.error('Failed to delete permanently:', e);
      onNotify('error', 'Terjadi kesalahan saat menghapus permanen.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmEmptyTrash = async () => {
    setIsLoading(true);
    try {
      const ok = await storageService.emptyTrash();
      if (ok) {
        onNotify('success', 'Tempat Sampah berhasil dikosongkan.');
        setTrashList([]);
        setShowEmptyConfirm(false);
      } else {
        onNotify('error', 'Gagal mengosongkan Tempat Sampah.');
      }
    } catch (e) {
      console.error('Failed to empty trash:', e);
      onNotify('error', 'Terjadi kesalahan saat mengosongkan Tempat Sampah.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ui-dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trash-modal-title"
    >
      <div
        className="ui-dialog-panel max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/40 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="trash-modal-title" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Tempat Sampah Setoran</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Retensi 15 Hari
                </span>
              </h2>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                Data yang dihapus tersimpan selama 15 hari sebelum dihapus permanen oleh sistem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={loadTrash}
              disabled={isLoading}
              className="min-h-11 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              title="Perbarui data Tempat Sampah"
              aria-label="Segarkan data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Tutup dialog Tempat Sampah"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Category Filter */}
        <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-200 flex-shrink-0 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama santri, materi, atau penghapus..."
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Cari rekaman di tempat sampah"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                aria-label="Filter kategori tempat sampah"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Ziyadah">Ziyadah</option>
                <option value="Murojaah">Muroja'ah</option>
                <option value="Binnadzor">Binnadzor</option>
                <option value="Pembelajaran">Pembelajaran</option>
              </select>

              {trashList.length > 0 && (
                <button
                  onClick={() => setShowEmptyConfirm(true)}
                  className="min-h-11 px-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                  title="Kosongkan seluruh tempat sampah"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Kosongkan</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <b>{filteredTrash.length}</b> dari {trashList.length} rekaman di Tempat Sampah
            </span>
            <span className="text-amber-800 font-medium">
              * Rekaman yang dipulihkan akan kembali menggunakan ID aslinya
            </span>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-600">Memeriksa Tempat Sampah dan membersihkan rekaman kedaluwarsa...</p>
            </div>
          ) : filteredTrash.length === 0 ? (
            <div className="py-16 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  {trashList.length === 0 ? 'Tempat Sampah Kosong' : 'Tidak Ada Data yang Cocok'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {trashList.length === 0
                    ? 'Tidak ada rekaman setoran yang dihapus dalam 15 hari terakhir. Data yang melewati 15 hari dibersihkan otomatis.'
                    : 'Coba ubah kata kunci pencarian atau ganti filter kategori.'}
                </p>
              </div>
            </div>
          ) : (
            filteredTrash.map((item) => {
              const payload = item.payload || {};
              const santriName = payload.santriName || payload.namaSantri || payload.santri?.nama || 'Santri';
              const santriId = payload.santriId || payload.idSantri || payload.santri?.id || '';
              const materi =
                item.recordType === 'Ziyadah'
                  ? `${payload.surah || 'Surah'} (Ayat ${payload.ayatAwal || 1}-${payload.ayatAkhir || 1})`
                  : item.recordType === 'Binnadzor'
                  ? payload.surahAtauJuz || payload.materi || 'Tilawah Mushaf'
                  : item.recordType === 'Pembelajaran'
                  ? payload.pokokBahasan || payload.materi || 'Materi Pembelajaran'
                  : payload.surahAtauJuz || payload.materi || 'Muroja\'ah';

              const nilai = payload.nilai || payload.predikatNilai || '-';
              const tanggalSetor = payload.tanggal || payload.timestamp;
              const remaining = getRecoveryDaysRemaining(item.expiresAt);
              const isActionBusy = actionLoadingId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 transition-colors shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Category & Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.recordType === 'Ziyadah' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-xs">
                          <BookOpen className="w-3 h-3" /> Ziyadah
                        </span>
                      ) : item.recordType === 'Murojaah' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200 text-xs">
                          <RotateCw className="w-3 h-3" /> Muroja'ah
                        </span>
                      ) : item.recordType === 'Binnadzor' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold border border-indigo-200 text-xs">
                          <BookOpenCheck className="w-3 h-3" /> Binnadzor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 font-bold border border-amber-200 text-xs">
                          <GraduationCap className="w-3 h-3" /> Pembelajaran
                        </span>
                      )}

                      <span className="font-extrabold text-slate-900 text-sm">
                        {santriName} {santriId && <span className="font-normal text-slate-500 text-xs">({santriId})</span>}
                      </span>
                    </div>

                    {/* Sisa Masa Pemulihan Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          remaining.isExpired
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : remaining.days <= 3
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        title={`Akan kedaluwarsa permanen pada: ${formatTanggalLengkap(item.expiresAt)}`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Sisa: {remaining.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium block">Materi Setoran:</span>
                      <span className="font-semibold text-slate-800 truncate block">{materi}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Nilai / Predikat:</span>
                      <span className="font-semibold text-slate-700">{nilai}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Tanggal Setoran Asli:</span>
                      <span className="text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatTanggalLengkap(tanggalSetor)}
                      </span>
                    </div>
                  </div>

                  {/* Soft Delete Metadata and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="w-3 h-3 text-slate-400" />
                        Dihapus oleh: <b className="text-slate-700 font-semibold">{item.deletedBy || 'Ustadz'}</b>
                      </span>
                      <span>&bull;</span>
                      <span>Pada: {formatTanggalLengkap(item.deletedAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        disabled={isActionBusy}
                        className="min-h-11 px-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:bg-emerald-200 transition cursor-pointer disabled:opacity-50"
                        title="Pulihkan record ini ke riwayat aktif"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isActionBusy ? 'animate-spin' : ''}`} />
                        <span>Pulihkan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToPermanentDelete(item)}
                        disabled={isActionBusy}
                        className="min-h-11 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-rose-700 text-xs font-semibold hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer disabled:opacity-50"
                        title="Hapus record ini secara permanen"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Permanen</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cloud Firestore Trash Collection: <code>trash_records</code></span>
          </div>
          <button
            onClick={onClose}
            className="ui-control px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Delete Permanently Single Item */}
      {itemToPermanentDelete && (
        <div
          className="ui-dialog-overlay"
          onClick={() => setItemToPermanentDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ui-dialog-panel max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-dialog-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight text-slate-900">
                    Hapus Permanen?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data tidak dapat dikembalikan lagi setelah dihapus permanen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setItemToPermanentDelete(null)}
                className="ui-dialog-close cursor-pointer"
                aria-label="Batal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="ui-dialog-body space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <p><b>Jenis Data:</b> {itemToPermanentDelete.recordType}</p>
                <p><b>Santri:</b> {itemToPermanentDelete.payload?.santriName || itemToPermanentDelete.payload?.namaSantri || 'Santri'}</p>
                <p><b>ID Record Asli:</b> <code>{itemToPermanentDelete.recordId}</code></p>
              </div>
              <p className="text-xs text-rose-700 font-medium">
                Tindakan ini akan menghapus dokumen dari Firestore secara permanen tanpa masa pemulihan 15 hari.
              </p>
            </div>

            <div className="ui-dialog-footer">
              <button
                onClick={() => setItemToPermanentDelete(null)}
                className="ui-control px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                className="ui-control px-5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Empty All Trash */}
      {showEmptyConfirm && (
        <div
          className="ui-dialog-overlay"
          onClick={() => setShowEmptyConfirm(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="ui-dialog-panel max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ui-dialog-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight text-slate-900">
                    Kosongkan Tempat Sampah?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menghapus seluruh {trashList.length} item secara permanen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="ui-dialog-close cursor-pointer"
                aria-label="Batal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="ui-dialog-body space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh rekaman di Tempat Sampah ({trashList.length} dokumen) akan dihapus secara permanen dari Cloud Firestore. Rekaman-rekaman ini tidak akan dapat dipulihkan lagi.
              </p>
            </div>

            <div className="ui-dialog-footer">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="ui-control px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmEmptyTrash}
                className="ui-control px-5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Semua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
