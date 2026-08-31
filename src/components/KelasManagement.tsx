import React, { useState } from 'react';
import { Kelas, TipeKelas, TIPE_KELAS_OPTIONS, Santri } from '../types';
import { storageService } from '../services/storageService';
import { GraduationCap, Plus, Trash2, CreditCard as Edit3, Save, X, CircleCheck as CheckCircle2, Users, TriangleAlert as AlertTriangle } from 'lucide-react';

interface KelasManagementProps {
  kelasList: Kelas[];
  santriList: Santri[];
  onDataChanged: () => void;
}

export const KelasManagement: React.FC<KelasManagementProps> = ({
  kelasList,
  santriList,
  onDataChanged
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [kelasToEdit, setKelasToEdit] = useState<Kelas | null>(null);
  const [kelasToDelete, setKelasToDelete] = useState<Kelas | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newNamaKelas, setNewNamaKelas] = useState('');
  const [newTipeKelas, setNewTipeKelas] = useState<TipeKelas>(TIPE_KELAS_OPTIONS[0]);
  const [newMusyrif, setNewMusyrif] = useState('');
  const [newSantriIds, setNewSantriIds] = useState<string[]>([]);

  const [editNamaKelas, setEditNamaKelas] = useState('');
  const [editTipeKelas, setEditTipeKelas] = useState<TipeKelas>(TIPE_KELAS_OPTIONS[0]);
  const [editMusyrif, setEditMusyrif] = useState('');
  const [editSantriIds, setEditSantriIds] = useState<string[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNamaKelas.trim()) return;

    setIsSaving(true);
    try {
      const newKelas: Kelas = {
        id: `KLS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        namaKelas: newNamaKelas.trim(),
        tipeKelas: newTipeKelas,
        musyrif: newMusyrif.trim(),
        santriIds: newSantriIds,
        createdAt: new Date().toISOString()
      };
      await storageService.addKelas(newKelas);
      setIsSaving(false);
      setShowAddModal(false);
      setNewNamaKelas('');
      setNewMusyrif('');
      setNewSantriIds([]);
      onDataChanged();
      showToast('success', `Kelas "${newKelas.namaKelas}" berhasil dibuat.`);
    } catch {
      setIsSaving(false);
      showToast('error', 'Gagal membuat kelas baru.');
    }
  };

  const handleOpenEdit = (k: Kelas) => {
    setKelasToEdit(k);
    setEditNamaKelas(k.namaKelas);
    setEditTipeKelas(k.tipeKelas);
    setEditMusyrif(k.musyrif || '');
    setEditSantriIds(k.santriIds || []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasToEdit || !editNamaKelas.trim()) return;

    setIsSaving(true);
    try {
      await storageService.updateKelas(kelasToEdit.id, {
        namaKelas: editNamaKelas.trim(),
        tipeKelas: editTipeKelas,
        musyrif: editMusyrif.trim(),
        santriIds: editSantriIds
      });
      setIsSaving(false);
      setKelasToEdit(null);
      onDataChanged();
      showToast('success', `Kelas "${editNamaKelas.trim()}" berhasil diperbarui.`);
    } catch {
      setIsSaving(false);
      showToast('error', 'Gagal memperbarui kelas.');
    }
  };

  const handleDeleteKelas = async () => {
    if (!kelasToDelete) return;
    setIsDeleting(true);
    try {
      await storageService.deleteKelas(kelasToDelete.id);
      setIsDeleting(false);
      setKelasToDelete(null);
      onDataChanged();
      showToast('success', `Kelas "${kelasToDelete.namaKelas}" berhasil dihapus.`);
    } catch {
      setIsDeleting(false);
      showToast('error', 'Gagal menghapus kelas.');
    }
  };

  const toggleSantriInList = (id: string, list: string[], setter: (ids: string[]) => void) => {
    if (list.includes(id)) {
      setter(list.filter(x => x !== id));
    } else {
      setter([...list, id]);
    }
  };

  const getSantriNama = (id: string) => santriList.find(s => s.idSantri === id)?.namaSantri || id;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      {notification && (
        <div className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Manajemen Kelas Tahfidz
          </h3>
          <p className="text-xs text-slate-500">Kelola kelas tahfidz, musyrif, dan anggota santri per kelas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {kelasList.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
          <GraduationCap className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Kelas Terdaftar</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Tambahkan kelas baru untuk mengelompokkan santri berdasarkan tingkatan tahfidz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kelasList.map((kls) => {
            const anggota = (kls.santriIds || []).map(id => santriList.find(s => s.idSantri === id)).filter(Boolean);
            return (
              <div key={kls.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-400 transition-all flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{kls.namaKelas}</h4>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{kls.tipeKelas}</span>
                    </div>
                  </div>
                </div>

                {kls.musyrif && (
                  <p className="text-xs text-slate-600 mb-2">
                    <span className="font-semibold">Musyrif:</span> {kls.musyrif}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Users className="w-3.5 h-3.5" />
                  <span>{anggota.length} santri</span>
                </div>

                {anggota.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {anggota.slice(0, 5).map((s) => (
                      <span key={s!.idSantri} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {s!.namaSantri}
                      </span>
                    ))}
                    {anggota.length > 5 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 text-slate-500">+{anggota.length - 5} lainnya</span>
                    )}
                  </div>
                )}

                <div className="pt-3 mt-auto border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(kls)}
                    className="flex-1 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setKelasToDelete(kls)}
                    className="py-1.5 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                Tambah Kelas Baru
              </h4>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddKelas} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nama Kelas</label>
                <input
                  type="text"
                  value={newNamaKelas}
                  onChange={(e) => setNewNamaKelas(e.target.value)}
                  placeholder="contoh: Kelas Tahfidz A - Angkatan 2024"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tipe Kelas</label>
                <select
                  value={newTipeKelas}
                  onChange={(e) => setNewTipeKelas(e.target.value as TipeKelas)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TIPE_KELAS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Musyrif / Pembimbing</label>
                <input
                  type="text"
                  value={newMusyrif}
                  onChange={(e) => setNewMusyrif(e.target.value)}
                  placeholder="Nama musyrif kelas"
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Anggota Santri ({newSantriIds.length} dipilih)</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {santriList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">Belum ada santri terdaftar</p>
                  ) : (
                    santriList.map(s => (
                      <label key={s.idSantri} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newSantriIds.includes(s.idSantri)}
                          onChange={() => toggleSantriInList(s.idSantri, newSantriIds, setNewSantriIds)}
                          className="w-4 h-4 rounded accent-emerald-600"
                        />
                        <span className="text-xs font-medium text-slate-700">{s.namaSantri} ({s.idSantri})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {kelasToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                Edit Kelas
              </h4>
              <button onClick={() => setKelasToEdit(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nama Kelas</label>
                <input
                  type="text"
                  value={editNamaKelas}
                  onChange={(e) => setEditNamaKelas(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tipe Kelas</label>
                <select
                  value={editTipeKelas}
                  onChange={(e) => setEditTipeKelas(e.target.value as TipeKelas)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TIPE_KELAS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Musyrif / Pembimbing</label>
                <input
                  type="text"
                  value={editMusyrif}
                  onChange={(e) => setEditMusyrif(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Anggota Santri ({editSantriIds.length} dipilih)</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {santriList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">Belum ada santri terdaftar</p>
                  ) : (
                    santriList.map(s => (
                      <label key={s.idSantri} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editSantriIds.includes(s.idSantri)}
                          onChange={() => toggleSantriInList(s.idSantri, editSantriIds, setEditSantriIds)}
                          className="w-4 h-4 rounded accent-emerald-600"
                        />
                        <span className="text-xs font-medium text-slate-700">{s.namaSantri} ({s.idSantri})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setKelasToEdit(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {kelasToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Hapus Kelas?</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Yakin ingin menghapus kelas <span className="font-bold">{kelasToDelete.namaKelas}</span>? Data santri tidak akan terhapus, hanya pengelompokan kelasnya saja.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setKelasToDelete(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer">Batal</button>
              <button onClick={handleDeleteKelas} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-60">
                {isDeleting ? 'Menghapus...' : 'Hapus Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
