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
  ChevronUp
} from 'lucide-react';
import type { NotifyFn } from './Snackbar';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface KelasManagementProps {
  kelasList: Kelas[];
  santriList: Santri[];
  userList: User[];
  onDataChanged: () => void;
  onNotify: NotifyFn;
}

export const KelasManagement: React.FC<KelasManagementProps> = ({
  kelasList,
  santriList,
  userList,
  onDataChanged,
  onNotify
}) => {
  const ustadzList = userList.filter(u => u.role === 'Ustadz' || u.role === 'Superadmin');
  const [showAddModal, setShowAddModal] = useState(false);
  const [kelasToEdit, setKelasToEdit] = useState<Kelas | null>(null);
  const [kelasToDelete, setKelasToDelete] = useState<Kelas | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnassignedList, setShowUnassignedList] = useState(false);

  const addDialogRef = useAccessibleDialog(showAddModal, () => {
    if (!isSaving) setShowAddModal(false);
  });
  const editDialogRef = useAccessibleDialog(Boolean(kelasToEdit), () => {
    if (!isSaving) setKelasToEdit(null);
  });
  const deleteDialogRef = useAccessibleDialog(Boolean(kelasToDelete), () => {
    if (!isDeleting) setKelasToDelete(null);
  });

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

  // Derived metrics for summary section
  const totalSantri = santriList.length;
  const sudahBerkelas = assignedSantriList.length;
  const belumBerkelas = unassignedSantriList.length;
  const placementPercent = totalSantri > 0 ? Math.round((sudahBerkelas / totalSantri) * 100) : 0;

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

  const showToast = (type: 'success' | 'error', message: string) => onNotify(type, message);

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
      showToast('success', `Kelas "${newKelas.namaKelas}" berhasil dibuat di Cloud dengan ${newSantriIds.length} santri.`);
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
      showToast('success', `Kelas "${editNamaKelas.trim()}" berhasil diperbarui di Cloud.`);
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
      showToast('success', `Kelas "${kelasToDelete.namaKelas}" berhasil dihapus dari Cloud.`);
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
    <div className="space-y-6">

      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h3 className="ui-page-title text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Manajemen Kelas Tahfidz
          </h3>
          <p className="text-xs text-slate-500">
            Kelola kelas, musyrif, dan penempatan santri secara terstruktur.
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd()}
          className="ui-control w-full sm:w-auto px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* ================= SECTION RINGKASAN PENEMPATAN SANTRI ================= */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:ui-dialog-body space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h4 className="ui-section-title">Penempatan santri</h4>
            <p className="ui-secondary mt-0.5">Pantau kelengkapan anggota kelas tanpa metrik dekoratif.</p>
          </div>
          <span className="ui-meta">{sudahBerkelas} dari {totalSantri} santri sudah ditempatkan</span>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 divide-x divide-slate-200">
          <div className="p-3 sm:p-4"><p className="ui-meta">Total santri</p><p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">{totalSantri}</p></div>
          <div className="p-3 sm:p-4"><p className="ui-meta">Sudah berkelas</p><p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-800">{sudahBerkelas}</p></div>
          <div className="p-3 sm:p-4"><p className="ui-meta">Belum berkelas</p><p className={`mt-1 text-xl sm:text-2xl font-bold ${belumBerkelas > 0 ? 'text-amber-800' : 'text-slate-700'}`}>{belumBerkelas}</p></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-700">Kelengkapan penempatan</span><span className="font-bold text-emerald-800">{placementPercent}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Kelengkapan penempatan santri" aria-valuemin={0} aria-valuemax={100} aria-valuenow={placementPercent}>
            <div className="h-full rounded-full bg-emerald-700 transition-[width] duration-500" style={{ width: `${placementPercent}%` }} />
          </div>
          {totalSantri > 0 && belumBerkelas === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />Seluruh santri telah memiliki kelas.</div>
          )}
        </div>
      </section>

      {/* Unassigned Santri Alert & Quick Placement Banner (Saat Ada Santri Belum Berkelas) */}
      {unassignedSantriList.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-amber-900">
                  Terdapat {unassignedSantriList.length} santri yang belum ditempatkan ke dalam kelas tahfidz
                </h5>
                <p className="text-xs text-amber-800 mt-1 leading-5">
                  Santri yang sudah dimasukkan kelas otomatis disembunyikan. Anda tinggal memasukkan santri-santri yang belum ditempatkan ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowUnassignedList(!showUnassignedList)}
                aria-expanded={showUnassignedList}
                aria-controls="unassigned-santri-list"
                className="min-h-11 px-3 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{showUnassignedList ? 'Tutup Daftar' : 'Lihat Siapa Saja'}</span>
                {showUnassignedList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => handleOpenAdd(unassignedSantriList.map(s => s.idSantri))}
                className="min-h-11 px-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat kelas baru</span>
              </button>
            </div>
          </div>

          {/* Collapsible Unassigned Santri Grid */}
          {showUnassignedList && (
            <div id="unassigned-santri-list" className="pt-3 border-t border-amber-200/80">
              <p className="text-xs font-bold text-amber-900 mb-2">Daftar Santri yang Belum Memiliki Kelas:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {unassignedSantriList.map(s => (
                  <div key={s.idSantri} className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{s.namaSantri}</p>
                      <p className="text-xs text-slate-500 font-mono">{s.idSantri} • {s.targetHafalan}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-100 text-amber-900 whitespace-nowrap">
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h4 className="ui-section-title">Daftar kelas</h4>
          <p className="ui-secondary mt-0.5">{kelasList.length} kelas terdaftar dalam sistem.</p>
        </div>
      </div>
      {kelasList.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-3">
          <GraduationCap className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Kelas Terdaftar</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Tambahkan kelas baru untuk mengelompokkan santri berdasarkan tingkatan tahfidz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {kelasList.map((kls) => {
            const anggota = (kls.santriIds || []).map(id => santriList.find(s => s.idSantri === id)).filter(Boolean);
            return (
              <div key={kls.id} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{kls.namaKelas}</h4>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">{kls.tipeKelas}</span>
                    </div>
                  </div>
                </div>

                {kls.musyrif && (
                  <p className="text-sm text-slate-700 mb-2">
                    <span className="font-semibold">Musyrif:</span> {kls.musyrif}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-3">
                  <Users className="w-3.5 h-3.5" />
                  <span>{anggota.length} santri</span>
                </div>

                {anggota.length > 0 ? (
                  <div className="space-y-1 mb-4">
                    {anggota.slice(0, 6).map((s) => (
                      <p key={s!.idSantri} className="text-xs text-slate-600 truncate">{s!.namaSantri}</p>
                    ))}
                    {anggota.length > 6 && (
                      <p className="text-xs font-semibold text-slate-500">+{anggota.length - 6} santri lainnya</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mb-4">Belum ada santri di kelas ini</p>
                )}

                <div className="pt-3 mt-auto border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(kls)}
                    className="min-h-11 flex-1 px-3 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit / Tambah Santri</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setKelasToDelete(kls)}
                    aria-label={`Hapus kelas ${kls.namaKelas}`}
                    className="min-h-11 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
        <div
          ref={addDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah kelas baru"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-lg">
            <div className="ui-dialog-header sticky top-0 z-10">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                Tambah Kelas Baru
              </h4>
              <button onClick={() => setShowAddModal(false)} aria-label="Tutup dialog tambah kelas" className="ui-dialog-close cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddKelas} className="ui-dialog-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nama Kelas</label>
                <input
                  type="text"
                  aria-label="Nama Kelas"
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
                  aria-label="Tipe Kelas"
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
                  aria-label="Musyrif atau Pembimbing"
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
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {unassignedSantriList.length} santri belum punya kelas
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {showAlreadyAssignedInAdd
                    ? 'Menampilkan seluruh santri (termasuk yang sudah memiliki kelas).'
                    : 'Santri yang sudah masuk kelas disembunyikan. Tinggal pilih santri yang belum ditempatkan.'}
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
                      className="ui-control w-full pl-9 pr-3 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllAvailableForAdd}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Pilih Semua</span>
                    </button>
                    {newSantriIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSelectionForAdd}
                        className="min-h-11 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
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
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
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
                              <p className="text-xs text-slate-500 font-mono">{s.idSantri} • {s.targetHafalan}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isAssigned ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                Sudah di: {currentClass.namaKelas}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
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
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-800">
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

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ui-control w-full sm:w-auto px-5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
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
        <div
          ref={editDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit kelas"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-lg">
            <div className="ui-dialog-header sticky top-0 z-10">
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                Edit Kelas: {kelasToEdit.namaKelas}
              </h4>
              <button onClick={() => setKelasToEdit(null)} aria-label="Tutup dialog edit kelas" className="ui-dialog-close cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="ui-dialog-body space-y-4">
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
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    +{unassignedSantriList.length} santri belum punya kelas
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {showOtherAssignedInEdit
                    ? 'Menampilkan seluruh santri termasuk dari kelas lain.'
                    : 'Menampilkan anggota kelas ini dan santri yang belum ditempatkan. Santri kelas lain disembunyikan.'}
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
                      className="ui-control w-full pl-9 pr-3 bg-white border border-slate-300 rounded-lg text-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unassignedSantriList.length > 0 && (
                      <button
                        type="button"
                        onClick={selectAllUnassignedForEdit}
                        className="min-h-11 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>+ Masukkan Belum Ada Kelas</span>
                      </button>
                    )}
                    {editSantriIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSelectionForEdit}
                        className="min-h-11 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
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
                              <p className="text-xs text-slate-500 font-mono">{s.idSantri} • {s.targetHafalan}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isCurrentClassMember ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                                Anggota Saat Ini
                              </span>
                            ) : currentClass ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                Di: {currentClass.namaKelas}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
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
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-800">
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

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setKelasToEdit(null)}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ui-control w-full sm:w-auto px-5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
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
        <div
          ref={deleteDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi hapus kelas"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
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
            <div className="ui-dialog-footer">
              <button onClick={() => setKelasToDelete(null)} className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer">Batal</button>
              <button onClick={handleDeleteKelas} disabled={isDeleting} className="ui-control w-full sm:w-auto px-5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60">
                {isDeleting ? 'Menghapus...' : 'Hapus Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
