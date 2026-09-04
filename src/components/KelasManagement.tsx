import React, { useState, useMemo } from 'react';
import { Kelas, TipeKelas, TIPE_KELAS_OPTIONS, Santri, User } from '../types';
import { storageService } from '../services/storageService';
import {
  GraduationCap,
  Plus,
  Trash2,
  CreditCard as Edit3,
  Save,
  X,
  CircleCheck as CheckCircle2,
  Users,
  TriangleAlert as AlertTriangle,
  Search,
  UserCheck,
  UserX,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface KelasManagementProps {
  kelasList: Kelas[];
  santriList: Santri[];
  userList: User[];
  onDataChanged: () => void;
}

export const KelasManagement: React.FC<KelasManagementProps> = ({
  kelasList,
  santriList,
  userList,
  onDataChanged
}) => {
  const ustadzList = userList.filter(u => u.role === 'Ustadz');
  const [showAddModal, setShowAddModal] = useState(false);
  const [kelasToEdit, setKelasToEdit] = useState<Kelas | null>(null);
  const [kelasToDelete, setKelasToDelete] = useState<Kelas | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnassignedList, setShowUnassignedList] = useState(false);

  // Add Form State
  const [newNamaKelas, setNewNamaKelas] = useState('');
  const [newTipeKelas, setNewTipeKelas] = useState<TipeKelas>(TIPE_KELAS_OPTIONS[0]);
  const [newMusyrifId, setNewMusyrifId] = useState('');
  const [newSantriIds, setNewSantriIds] = useState<string[]>([]);
  const [newSearchQuery, setNewSearchQuery] = useState('');
  const [showAlreadyAssignedInAdd, setShowAlreadyAssignedInAdd] = useState(false);

  // Edit Form State
  const [editNamaKelas, setEditNamaKelas] = useState('');
  const [editTipeKelas, setEditTipeKelas] = useState<TipeKelas>(TIPE_KELAS_OPTIONS[0]);
  const [editMusyrifId, setEditMusyrifId] = useState('');
  const [editSantriIds, setEditSantriIds] = useState<string[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [showOtherAssignedInEdit, setShowOtherAssignedInEdit] = useState(false);

  // Mapping santri to class info
  const santriClassMap = useMemo(() => {
    const map = new Map<string, { kelasId: string; namaKelas: string; musyrif?: string }>();
    kelasList.forEach(k => {
      (k.santriIds || []).forEach(id => {
        map.set(id, { kelasId: k.id, namaKelas: k.namaKelas, musyrif: k.musyrif });
      });
    });
    return map;
  }, [kelasList]);

  // Santri without any class assignment
  const unassignedSantriList = useMemo(() => {
    return santriList.filter(s => !santriClassMap.has(s.idSantri));
  }, [santriList, santriClassMap]);

  // Santri with class assignment
  const assignedSantriList = useMemo(() => {
    return santriList.filter(s => santriClassMap.has(s.idSantri));
  }, [santriList, santriClassMap]);

  // Filtered santri for Add Modal: By default only show unassigned santri!
  const santriOptionsForAdd = useMemo(() => {
    let list = showAlreadyAssignedInAdd
      ? santriList
      : unassignedSantriList;

    if (newSearchQuery.trim()) {
      const q = newSearchQuery.trim().toLowerCase();
      list = list.filter(
        s => s.namaSantri.toLowerCase().includes(q) || s.idSantri.toLowerCase().includes(q)
      );
    }
    return list;
  }, [showAlreadyAssignedInAdd, santriList, unassignedSantriList, newSearchQuery]);

  // Filtered santri for Edit Modal:
  // Shows santri already in this class + unassigned santri.
  // Santri from OTHER classes are hidden unless toggle is enabled.
  const santriOptionsForEdit = useMemo(() => {
    if (!kelasToEdit) return [];
    const currentClassSantriIds = new Set(kelasToEdit.santriIds || []);

    let list = santriList.filter(s => {
      // Always show santri currently in this class
      if (currentClassSantriIds.has(s.idSantri)) return true;
      // Show unassigned santri
      if (!santriClassMap.has(s.idSantri)) return true;
      // If user toggles to show santri from other classes
      if (showOtherAssignedInEdit) return true;
      // Otherwise hide santri who are already in other classes
      return false;
    });

    if (editSearchQuery.trim()) {
      const q = editSearchQuery.trim().toLowerCase();
      list = list.filter(
        s => s.namaSantri.toLowerCase().includes(q) || s.idSantri.toLowerCase().includes(q)
      );
    }
    return list;
  }, [kelasToEdit, santriList, santriClassMap, showOtherAssignedInEdit, editSearchQuery]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = (preselectedIds?: string[]) => {
    setNewNamaKelas('');
    setNewTipeKelas(TIPE_KELAS_OPTIONS[0]);
    setNewMusyrifId('');
    setNewSantriIds(preselectedIds || []);
    setNewSearchQuery('');
    setShowAlreadyAssignedInAdd(false);
    setShowAddModal(true);
  };

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNamaKelas.trim()) return;

    setIsSaving(true);
    try {
      const musyrifUser = ustadzList.find(u => u.id === newMusyrifId);
      const newKelas: Kelas = {
        id: `KLS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        namaKelas: newNamaKelas.trim(),
        tipeKelas: newTipeKelas,
        musyrif: musyrifUser?.nama || '',
        musyrifId: newMusyrifId || undefined,
        santriIds: newSantriIds,
        createdAt: new Date().toISOString()
      };
      await storageService.addKelas(newKelas);
      setIsSaving(false);
      setShowAddModal(false);
      setNewNamaKelas('');
      setNewMusyrifId('');
      setNewSantriIds([]);
      onDataChanged();
      showToast('success', `Kelas "${newKelas.namaKelas}" berhasil dibuat dengan ${newSantriIds.length} santri.`);
    } catch {
      setIsSaving(false);
      showToast('error', 'Gagal membuat kelas baru.');
    }
  };

  const handleOpenEdit = (k: Kelas) => {
    setKelasToEdit(k);
    setEditNamaKelas(k.namaKelas);
    setEditTipeKelas(k.tipeKelas);
    setEditMusyrifId(k.musyrifId || '');
    setEditSantriIds(k.santriIds || []);
    setEditSearchQuery('');
    setShowOtherAssignedInEdit(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelasToEdit || !editNamaKelas.trim()) return;

    setIsSaving(true);
    try {
      const musyrifUser = ustadzList.find(u => u.id === editMusyrifId);
      await storageService.updateKelas(kelasToEdit.id, {
        namaKelas: editNamaKelas.trim(),
        tipeKelas: editTipeKelas,
        musyrif: musyrifUser?.nama || '',
        musyrifId: editMusyrifId || undefined,
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

  const selectAllAvailableForAdd = () => {
    const ids = santriOptionsForAdd.map(s => s.idSantri);
    setNewSantriIds(Array.from(new Set([...newSantriIds, ...ids])));
  };

  const clearSelectionForAdd = () => {
    setNewSantriIds([]);
  };

  const selectAllUnassignedForEdit = () => {
    const unassignedIds = unassignedSantriList.map(s => s.idSantri);
    setEditSantriIds(Array.from(new Set([...editSantriIds, ...unassignedIds])));
  };

  const clearSelectionForEdit = () => {
    setEditSantriIds([]);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      {notification && (
        <div className={`p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-sm ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Manajemen Kelas Tahfidz
          </h3>
          <p className="text-xs text-slate-500">
            Kelola kelas tahfidz, musyrif, dan penempatan santri per kelas
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd()}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Summary KPI Cards: Penempatan Santri */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Santri</p>
            <h4 className="text-xl font-black text-slate-800 mt-0.5">{santriList.length}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Terdaftar dalam sistem</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Sudah Ada Kelas</p>
            <h4 className="text-xl font-black text-emerald-900 mt-0.5">{assignedSantriList.length}</h4>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              {santriList.length > 0 ? `${Math.round((assignedSantriList.length / santriList.length) * 100)}% santri ditempatkan` : '0%'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          unassignedSantriList.length > 0
            ? 'bg-amber-50/90 border-amber-300 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${unassignedSantriList.length > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
              Belum Ada Kelas
            </p>
            <h4 className={`text-xl font-black mt-0.5 ${unassignedSantriList.length > 0 ? 'text-amber-900' : 'text-slate-800'}`}>
              {unassignedSantriList.length}
            </h4>
            <p className={`text-[10px] mt-0.5 ${unassignedSantriList.length > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
              {unassignedSantriList.length > 0 ? 'Tinggal diinput ke kelas' : 'Semua sudah punya kelas'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            unassignedSantriList.length > 0 ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-200/80 text-slate-600'
          }`}>
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Unassigned Santri Alert & Quick Placement Banner */}
      {unassignedSantriList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-900">
                  Terdapat {unassignedSantriList.length} santri yang belum ditempatkan ke dalam kelas tahfidz
                </h5>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Santri yang sudah dimasukkan kelas otomatis disembunyikan. Anda tinggal memasukkan santri-santri yang belum ditempatkan ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowUnassignedList(!showUnassignedList)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{showUnassignedList ? 'Tutup Daftar' : 'Lihat Siapa Saja'}</span>
                {showUnassignedList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => handleOpenAdd(unassignedSantriList.map(s => s.idSantri))}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Kelas Baru</span>
              </button>
            </div>
          </div>

          {/* Collapsible Unassigned Santri Grid */}
          {showUnassignedList && (
            <div className="pt-3 border-t border-amber-200/80">
              <p className="text-[11px] font-bold text-amber-900 mb-2">Daftar Santri yang Belum Memiliki Kelas:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {unassignedSantriList.map(s => (
                  <div key={s.idSantri} className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{s.namaSantri}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.idSantri} • {s.targetHafalan}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 whitespace-nowrap">
                      Belum Ada Kelas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Kelas List */}
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

                {anggota.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {anggota.slice(0, 6).map((s) => (
                      <span key={s!.idSantri} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {s!.namaSantri}
                      </span>
                    ))}
                    {anggota.length > 6 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 text-slate-500">+{anggota.length - 6} lainnya</span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic mb-3">Belum ada santri di kelas ini</p>
                )}

                <div className="pt-3 mt-auto border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(kls)}
                    className="flex-1 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit / Tambah Santri</span>
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

      {/* ================= MODAL TAMBAH KELAS ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
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
                  placeholder="contoh: Kelas Tahfidz - Angkatan 2024"
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
                <select
                  value={newMusyrifId}
                  onChange={(e) => setNewMusyrifId(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Ustadz Musyrif --</option>
                  {ustadzList.map(u => (
                    <option key={u.id} value={u.id}>{u.nama} ({u.username})</option>
                  ))}
                </select>
              </div>

              {/* SELEKSI SANTRI: HANYA YANG BELUM DITEMPATKAN KELAS (DEFAULT) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Pilih Anggota Santri ({newSantriIds.length} dipilih)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {unassignedSantriList.length} santri belum punya kelas
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  {showAlreadyAssignedInAdd
                    ? 'Menampilkan seluruh santri (termasuk yang sudah memiliki kelas).'
                    : '✨ Santri yang sudah masuk kelas disembunyikan. Tinggal pilih santri yang belum ditempatkan.'}
                </p>

                {/* Search Bar & Fast Select Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={newSearchQuery}
                      onChange={(e) => setNewSearchQuery(e.target.value)}
                      placeholder="Cari nama atau ID santri..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllAvailableForAdd}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Pilih Semua</span>
                    </button>
                    {newSantriIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSelectionForAdd}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {/* List Santri Box */}
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {santriOptionsForAdd.length === 0 ? (
                    <div className="text-center py-6 px-3 text-slate-500 space-y-1.5">
                      <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600" />
                      <p className="text-xs font-bold text-slate-700">
                        {unassignedSantriList.length === 0
                          ? 'Semua santri sudah ditempatkan ke dalam kelas!'
                          : 'Tidak ada santri yang cocok dengan pencarian.'}
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                        {unassignedSantriList.length === 0
                          ? 'Tidak ada santri yang tersisa untuk dimasukkan ke kelas baru.'
                          : 'Coba ubah kata kunci pencarian Anda.'}
                      </p>
                    </div>
                  ) : (
                    santriOptionsForAdd.map(s => {
                      const currentClass = santriClassMap.get(s.idSantri);
                      const isAssigned = !!currentClass;
                      const isChecked = newSantriIds.includes(s.idSantri);

                      return (
                        <label
                          key={s.idSantri}
                          className={`flex items-center justify-between gap-2 p-2 rounded-lg transition cursor-pointer border ${
                            isChecked
                              ? 'bg-emerald-50/90 border-emerald-300'
                              : 'hover:bg-white bg-slate-50/60 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSantriInList(s.idSantri, newSantriIds, setNewSantriIds)}
                              className="w-4 h-4 rounded accent-emerald-600 flex-shrink-0 cursor-pointer"
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{s.namaSantri}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{s.idSantri} • {s.targetHafalan}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isAssigned ? (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                Sudah di: {currentClass.namaKelas}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                Belum Ada Kelas
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Option to reveal already assigned santri (if user intentionally wants to move a student) */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 hover:text-slate-800">
                    <input
                      type="checkbox"
                      checked={showAlreadyAssignedInAdd}
                      onChange={(e) => setShowAlreadyAssignedInAdd(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-700"
                    />
                    <span>Tampilkan juga santri yang sudah ada di kelas lain (opsi pindah kelas)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT KELAS ================= */}
      {kelasToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                Edit Kelas: {kelasToEdit.namaKelas}
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
                <select
                  value={editMusyrifId}
                  onChange={(e) => setEditMusyrifId(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Ustadz Musyrif --</option>
                  {ustadzList.map(u => (
                    <option key={u.id} value={u.id}>{u.nama} ({u.username})</option>
                  ))}
                </select>
              </div>

              {/* SELEKSI SANTRI EDIT: ANGGOTA KELAS INI + SANTRI BELUM PUNYA KELAS */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Anggota Santri ({editSantriIds.length} dipilih)
                  </label>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    +{unassignedSantriList.length} santri belum punya kelas
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  {showOtherAssignedInEdit
                    ? 'Menampilkan seluruh santri termasuk dari kelas lain.'
                    : '✨ Menampilkan anggota kelas ini dan santri yang belum ditempatkan (santri kelas lain disembunyikan).'}
                </p>

                {/* Search Bar & Fast Select Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={editSearchQuery}
                      onChange={(e) => setEditSearchQuery(e.target.value)}
                      placeholder="Cari nama atau ID santri..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unassignedSantriList.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllUnassignedForEdit}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>+ Masukkan Belum Ada Kelas</span>
                      </button>
                    )}
                    {editSantriIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSelectionForEdit}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>

                {/* List Santri Box */}
                <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {santriOptionsForEdit.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Tidak ada santri yang sesuai</p>
                  ) : (
                    santriOptionsForEdit.map(s => {
                      const currentClass = santriClassMap.get(s.idSantri);
                      const isCurrentClassMember = currentClass?.kelasId === kelasToEdit.id;
                      const isChecked = editSantriIds.includes(s.idSantri);

                      return (
                        <label
                          key={s.idSantri}
                          className={`flex items-center justify-between gap-2 p-2 rounded-lg transition cursor-pointer border ${
                            isChecked
                              ? 'bg-emerald-50/90 border-emerald-300'
                              : 'hover:bg-white bg-slate-50/60 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSantriInList(s.idSantri, editSantriIds, setEditSantriIds)}
                              className="w-4 h-4 rounded accent-emerald-600 flex-shrink-0 cursor-pointer"
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{s.namaSantri}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{s.idSantri} • {s.targetHafalan}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isCurrentClassMember ? (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                                Anggota Saat Ini
                              </span>
                            ) : currentClass ? (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                Di: {currentClass.namaKelas}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                Belum Ada Kelas
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                {/* Option to reveal other classes */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 hover:text-slate-800">
                    <input
                      type="checkbox"
                      checked={showOtherAssignedInEdit}
                      onChange={(e) => setShowOtherAssignedInEdit(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-700"
                    />
                    <span>Tampilkan juga santri dari kelas lain (opsi pindah kelas)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKelasToEdit(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
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
              Yakin ingin menghapus kelas <span className="font-bold">{kelasToDelete.namaKelas}</span>? Data santri dan riwayat setoran tidak akan terhapus, santri akan kembali berstatus belum ditempatkan ke kelas.
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
