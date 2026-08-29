import React, { useState } from 'react';
import { Santri } from '../types';
import { storageService } from '../services/storageService';
import { Users, UserPlus, Target, Trash2, Search, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SantriManagementProps {
  santriList: Santri[];
  onDataChanged: () => void;
}

export const SantriManagement: React.FC<SantriManagementProps> = ({
  santriList,
  onDataChanged
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [santriToDelete, setSantriToDelete] = useState<Santri | null>(null);
  const [deleteWithHistory, setDeleteWithHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [newId, setNewId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('Tahfidz A (Ikhwan)');
  const [newTarget, setNewTarget] = useState('Juz 30 (37 Surah)');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleAddSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    setIsSaving(true);
    setTimeout(() => {
      const generatedId = newId.trim() || `STR${(santriList.length + 1).toString().padStart(3, '0')}`;
      storageService.addSantri({
        idSantri: generatedId,
        namaSantri: newNama.trim(),
        kelas: newKelas.trim(),
        targetHafalan: newTarget.trim()
      });

      setIsSaving(false);
      setShowAddModal(false);
      setNewNama('');
      setNewId('');
      onDataChanged();
      showToast('success', `Santri ${newNama.trim()} (${generatedId}) berhasil ditambahkan.`);
    }, 300);
  };

  const handleDeleteSantri = () => {
    if (!santriToDelete) return;

    setIsDeleting(true);
    setTimeout(() => {
      const deletedName = santriToDelete.namaSantri;
      const deletedId = santriToDelete.idSantri;

      storageService.deleteSantri(santriToDelete.idSantri, deleteWithHistory);
      setIsDeleting(false);
      setSantriToDelete(null);
      onDataChanged();
      showToast('success', `Data santri ${deletedName} (${deletedId}) berhasil dihapus.`);
    }, 300);
  };

  const ziyadahRecords = storageService.getZiyadahRecords();
  const murojaahRecords = storageService.getMurojaahRecords();

  const getSantriStats = (idSantri: string) => {
    const totalZiyadah = ziyadahRecords.filter(r => r.idSantri === idSantri).length;
    const totalMurojaah = murojaahRecords.filter(r => r.idSantri === idSantri).length;
    return { totalZiyadah, totalMurojaah, total: totalZiyadah + totalMurojaah };
  };

  const filteredSantri = santriList.filter(s =>
    s.namaSantri.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.idSantri.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          id="santri-toast-notification"
          className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Manajemen Data Santri & Target
          </h3>
          <p className="text-xs text-slate-500">
            Daftar santri tahfidz, kelas bimbingan, pengelolaan akun wali, dan hapus data santri
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="search-santri-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, ID, kelas..."
              className="w-full sm:w-56 pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            id="btn-tambah-santri"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Santri</span>
          </button>
        </div>
      </div>

      {/* Santri Card Grid */}
      {filteredSantri.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
          <Users className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold">Tidak ada santri yang cocok dengan pencarian.</p>
          <p className="text-xs text-slate-400">Silakan periksa kata kunci pencarian atau tambah santri baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSantri.map((santri) => {
            const stats = getSantriStats(santri.idSantri);
            return (
              <div
                key={santri.idSantri}
                id={`santri-card-${santri.idSantri}`}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex flex-col justify-between space-y-4 group relative"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
                      {santri.idSantri}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 truncate max-w-[150px]">{santri.kelas}</span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base leading-snug">{santri.namaSantri}</h4>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Target className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>Target: <b>{santri.targetHafalan}</b></span>
                  </div>

                  {/* Riwayat count summary */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      {stats.totalZiyadah} Ziyadah
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      {stats.totalMurojaah} Muroja'ah
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span>Akun Wali: <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono text-slate-700">{santri.idSantri}</code></span>
                  </div>

                  <button
                    id={`btn-delete-santri-${santri.idSantri}`}
                    onClick={() => {
                      setSantriToDelete(santri);
                      setDeleteWithHistory(true);
                    }}
                    title={`Hapus santri ${santri.namaSantri}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span className="hidden sm:inline text-rose-600">Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Santri */}
      {santriToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Hapus Data Santri?</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Santri:</span>
                <span className="font-bold text-slate-800">{santriToDelete.namaSantri}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Santri:</span>
                <span className="font-mono font-bold text-emerald-800">{santriToDelete.idSantri}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas:</span>
                <span className="font-medium text-slate-700">{santriToDelete.kelas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Hafalan:</span>
                <span className="font-medium text-slate-700">{santriToDelete.targetHafalan}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  checked={deleteWithHistory}
                  onChange={(e) => setDeleteWithHistory(e.target.checked)}
                  className="mt-0.5 text-emerald-700 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="leading-snug">
                  Hapus juga seluruh <b>riwayat setoran Ziyadah & Muroja'ah</b> serta <b>akun login wali</b> santri ini.
                </span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>Akun login wali untuk ID <b className="font-mono">{santriToDelete.idSantri}</b> akan otomatis dihapus.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSantriToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-santri"
                onClick={handleDeleteSantri}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Santri'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Santri */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                Tambah Santri Baru
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSantri} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ID Santri (Opsional)
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="Contoh: STR006 (Kosongkan untuk otomatis)"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Zaid bin Haritsah"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  placeholder="Contoh: Tahfidz A (Ikhwan)"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Hafalan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="Contoh: Juz 30 (37 Surah)"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

