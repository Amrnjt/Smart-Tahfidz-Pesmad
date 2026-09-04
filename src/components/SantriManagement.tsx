import React, { useState } from 'react';
import { Santri, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Users, UserPlus, Target, Trash2, Search, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Shield, Key, CreditCard as Edit3, UserCheck, Save, Sparkles, Phone } from 'lucide-react';
import { getClassGroup } from '../utils/classUtils';

interface SantriManagementProps {
  santriList: Santri[];
  onDataChanged: () => void;
}

export const SantriManagement: React.FC<SantriManagementProps> = ({
  santriList,
  onDataChanged
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'santri' | 'users'>('santri');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [santriToDelete, setSantriToDelete] = useState<Santri | null>(null);
  const [santriToEdit, setSantriToEdit] = useState<Santri | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [deleteWithHistory, setDeleteWithHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Santri Form State
  const [newId, setNewId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('Tahfidz');
  const [newTarget, setNewTarget] = useState('Juz 30 (37 Surah)');
  const [newWaliNama, setNewWaliNama] = useState('');
  const [newWaliKontak, setNewWaliKontak] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('123');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Santri Form State
  const [editSantriNama, setEditSantriNama] = useState('');
  const [editSantriKelas, setEditSantriKelas] = useState('');
  const [editSantriTarget, setEditSantriTarget] = useState('');
  const [editSantriWaliNama, setEditSantriWaliNama] = useState('');
  const [editSantriWaliKontak, setEditSantriWaliKontak] = useState('');

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newUserNama, setNewUserNama] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Ustadz');
  const [newUserIdSantri, setNewUserIdSantri] = useState('');

  // Edit User Form State (Save-able role and profile)
  const [editNama, setEditNama] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Ustadz');
  const [editIdSantri, setEditIdSantri] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleOpenEditUser = (u: User) => {
    setUserToEdit(u);
    setEditNama(u.nama);
    setEditUsername(u.username);
    setEditPassword(u.password || '123');
    setEditRole(u.role);
    setEditIdSantri(u.idSantri || '');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit || !editNama.trim() || !editUsername.trim() || !editPassword.trim()) return;

    const cleanUsername = editUsername.trim().toLowerCase();
    const cleanNama = editNama.trim();
    const cleanPassword = editPassword.trim();

    // Check if new username conflicts with another existing user
    const usernameConflict = usersList.find(u => u.id !== userToEdit.id && u.username.toLowerCase() === cleanUsername);
    if (usernameConflict) {
      showToast('error', `Username "${cleanUsername}" sudah digunakan oleh akun ${usernameConflict.nama}.`);
      return;
    }

    setIsSaving(true);
    try {
      await storageService.updateUser(userToEdit.id, {
        nama: cleanNama,
        username: cleanUsername,
        password: cleanPassword,
        role: editRole,
        idSantri: editRole === 'Ustadz' ? '' : editIdSantri.trim()
      });

      setIsSaving(false);
      setUserToEdit(null);
      onDataChanged();
      showToast('success', `Pengaturan akun ${cleanNama} dan role ${editRole} berhasil disimpan ke Cloud!`);
    } catch (err) {
      setIsSaving(false);
      showToast('error', 'Gagal menyimpan perubahan akun pengguna.');
    }
  };

  const handleOpenEditSantri = (s: Santri) => {
    setSantriToEdit(s);
    setEditSantriNama(s.namaSantri);
    setEditSantriKelas(s.kelas);
    setEditSantriTarget(s.targetHafalan);
    setEditSantriWaliNama(s.waliNama || '');
    setEditSantriWaliKontak(s.waliKontak || '');
  };

  const handleSaveEditSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriToEdit || !editSantriNama.trim()) return;

    setIsSaving(true);
    try {
      await storageService.updateSantri(santriToEdit.idSantri, {
        namaSantri: editSantriNama.trim(),
        kelas: editSantriKelas,
        targetHafalan: editSantriTarget.trim() || 'Juz 30 (37 Surah)',
        waliNama: editSantriWaliNama.trim() || '',
        waliKontak: editSantriWaliKontak.trim() || ''
      });

      setIsSaving(false);
      setSantriToEdit(null);
      onDataChanged();
      showToast('success', `Data santri ${editSantriNama.trim()} (${santriToEdit.idSantri}) berhasil diperbarui.`);
    } catch (err) {
      setIsSaving(false);
      showToast('error', 'Gagal memperbarui data santri.');
    }
  };

  const handleAddSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    setIsSaving(true);
    try {
      const generatedId = newId.trim() || `STR${(santriList.length + 1).toString().padStart(3, '0')}`;
      
      const newSantri: Santri = {
        idSantri: generatedId,
        namaSantri: newNama.trim(),
        kelas: newKelas,
        targetHafalan: newTarget.trim() || 'Juz 30 (37 Surah)',
        totalHafalanSelesai: 0,
        waliNama: newWaliNama.trim() || '',
        waliKontak: newWaliKontak.trim() || ''
      };

      await storageService.addSantri(newSantri, defaultPassword.trim() || '123');
      setIsSaving(false);
      setShowAddModal(false);
      setNewNama('');
      setNewId('');
      setNewWaliNama('');
      setNewWaliKontak('');
      onDataChanged();
      showToast('success', `Santri ${newNama.trim()} (${generatedId}) berhasil ditambahkan dan disimpan permanen.`);
    } catch (err) {
      setIsSaving(false);
      showToast('error', 'Gagal menambahkan data santri.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanNama = newUserNama.trim();
    const cleanPassword = newUserPassword.trim();

    if (!cleanUsername || !cleanNama || !cleanPassword) return;

    // Check if username already exists
    const existingUser = usersList.find(u => u.username.toLowerCase() === cleanUsername);
    if (existingUser) {
      showToast('error', `Username "${cleanUsername}" sudah digunakan oleh ${existingUser.nama}. Silakan gunakan username lain.`);
      return;
    }

    setIsSaving(true);
    try {
      const newUser: User = {
        id: `USR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        username: cleanUsername,
        password: cleanPassword,
        role: newUserRole,
        nama: cleanNama,
        idSantri: newUserRole === 'Ustadz' ? '' : newUserIdSantri.trim()
      };

      await storageService.addUser(newUser);
      setIsSaving(false);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewUserNama('');
      setNewUserPassword('123');
      setNewUserIdSantri('');
      onDataChanged();
      showToast('success', `Akun ${cleanNama} (Role: ${newUserRole}) berhasil dibuat & disimpan ke Cloud Firestore.`);
    } catch (err) {
      setIsSaving(false);
      showToast('error', 'Gagal membuat akun baru.');
    }
  };

  const handleDeleteSantri = async () => {
    if (!santriToDelete) return;

    setIsDeleting(true);
    try {
      const deletedName = santriToDelete.namaSantri;
      const deletedId = santriToDelete.idSantri;

      await storageService.deleteSantri(santriToDelete.idSantri, deleteWithHistory);
      setIsDeleting(false);
      setSantriToDelete(null);
      onDataChanged();
      showToast('success', `Data santri ${deletedName} (${deletedId}) berhasil dihapus.`);
    } catch (err) {
      setIsDeleting(false);
      showToast('error', 'Gagal menghapus santri.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const deletedName = userToDelete.nama;
      await storageService.deleteUser(userToDelete.id);
      setIsDeleting(false);
      setUserToDelete(null);
      onDataChanged();
      showToast('success', `Akun ${deletedName} berhasil dihapus.`);
    } catch (err) {
      setIsDeleting(false);
      showToast('error', 'Gagal menghapus akun pengguna.');
    }
  };

  const usersList = storageService.getUsers();
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

  const filteredUsers = usersList.filter(u =>
    u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.idSantri && u.idSantri.toLowerCase().includes(searchQuery.toLowerCase()))
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

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            Manajemen Data Santri & Akun Pengguna
          </h3>
          <p className="text-xs text-slate-500">
            Pengelolaan data santri, target kelulusan, dan hak akses akun (Ustadz, Wali, Santri)
          </p>
        </div>

        {/* Sub Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveSubTab('santri')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'santri'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Santri ({santriList.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Akun Pengguna ({usersList.length})</span>
          </button>
        </div>
      </div>

      {/* Controls: Search & Add Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="search-santri-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSubTab === 'santri' ? 'Cari nama, ID, kelas...' : 'Cari user, nama, role, NIS...'}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {activeSubTab === 'santri' ? (
          <button
            id="btn-tambah-santri"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Santri Baru</span>
          </button>
        ) : (
          <button
            id="btn-tambah-user"
            onClick={() => setShowAddUserModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        )}
      </div>

      {/* Tab 1: Santri Cards Grid */}
      {activeSubTab === 'santri' && (
        <>
          {santriList.length === 0 ? (
            <div className="text-center py-14 px-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-600 space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-8 h-8 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">Belum Ada Data Santri</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Database santri bersih & tersinkronisasi ke Cloud Firestore. Tambahkan santri baru untuk mulai mencatat setoran Ziyadah & Muroja'ah.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 text-left flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>
                  <b>Akses Otomatis Wali & Santri:</b> Ketika Anda mendaftarkan santri, akun login <b>Wali</b> (<code className="font-mono bg-white px-1 rounded border">wali_id</code>) dan <b>Santri</b> (<code className="font-mono bg-white px-1 rounded border">id_santri</code>) akan otomatis dibuat dan langsung tersimpan ke cloud.
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Santri Pertama</span>
              </button>
            </div>
          ) : filteredSantri.length === 0 ? (
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
                        {santri.kelas && santri.kelas !== '-' ? (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            {santri.kelas}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            Belum Ada Kelas
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base leading-snug">{santri.namaSantri}</h4>
                        {santri.waliNama && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Wali: <span className="font-medium text-slate-700">{santri.waliNama}</span>
                            {santri.waliKontak ? ` (${santri.waliKontak})` : ''}
                          </p>
                        )}
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
                      <div className="truncate text-[10px] space-y-0.5">
                        <div>Wali: <code className="bg-slate-200/80 px-1 rounded font-mono text-slate-700">wali_{santri.idSantri.toLowerCase()}</code></div>
                        <div>Santri: <code className="bg-slate-200/80 px-1 rounded font-mono text-slate-700">{santri.idSantri}</code></div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenEditSantri(santri)}
                          title={`Edit data santri ${santri.namaSantri}`}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          id={`btn-delete-santri-${santri.idSantri}`}
                          onClick={() => {
                            setSantriToDelete(santri);
                            setDeleteWithHistory(true);
                          }}
                          title={`Hapus santri ${santri.namaSantri}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span className="hidden sm:inline text-rose-600">Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: User Accounts Table with Save-able Role Editing */}
      {activeSubTab === 'users' && (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                Klik tombol <b>Edit (✏️)</b> pada setiap baris akun untuk <b>mengubah Role (Ustadz/Wali/Santri), Username, Password, dan Kaitan ID Santri</b> secara save-able.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Nama Pengguna</th>
                  <th className="py-3 px-3.5">Username Login</th>
                  <th className="py-3 px-3.5">Password</th>
                  <th className="py-3 px-3.5">Role Hak Akses</th>
                  <th className="py-3 px-3.5">Kaitan ID Santri</th>
                  <th className="py-3 px-3.5 text-center">Aksi / Setting Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada akun yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    let roleBadge = null;
                    if (u.role === 'Ustadz') {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                          <Shield className="w-3 h-3 text-emerald-700" /> Ustadz
                        </span>
                      );
                    } else if (u.role === 'Wali') {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] border border-teal-300">
                          <Users className="w-3 h-3 text-teal-700" /> Wali Santri
                        </span>
                      );
                    } else {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] border border-cyan-300">
                          <UserCheck className="w-3 h-3 text-cyan-700" /> Santri (View-Only)
                        </span>
                      );
                    }

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-slate-800">
                          {u.nama}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {u.username}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {u.password}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">{roleBadge}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">
                          {u.idSantri || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 px-2.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold border border-emerald-200"
                              title="Setting Role & Edit Akun"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Edit Role</span>
                            </button>
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Edit Data Santri */}
      {santriToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                Edit Data Santri ({santriToEdit.idSantri})
              </h4>
              <button
                onClick={() => setSantriToEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSantri} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editSantriNama}
                  onChange={(e) => setEditSantriNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas Bimbingan
                  </label>
                  <select
                    value={editSantriKelas}
                    onChange={(e) => setEditSantriKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="Tahfidz">Tahfidz</option>
                    <option value="Binnadzor A">Binnadzor A</option>
                    <option value="Binnadzor B">Binnadzor B</option>
                    <option value="Jilid">Jilid</option>
                    <option value="Kelas Istimewa">Kelas Istimewa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Hafalan
                  </label>
                  <input
                    type="text"
                    value={editSantriTarget}
                    onChange={(e) => setEditSantriTarget(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Wali Santri
                  </label>
                  <input
                    type="text"
                    value={editSantriWaliNama}
                    onChange={(e) => setEditSantriWaliNama(e.target.value)}
                    placeholder="Contoh: Bpk. Ahmad"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Kontak / WA Wali
                  </label>
                  <input
                    type="text"
                    value={editSantriWaliKontak}
                    onChange={(e) => setEditSantriWaliKontak(e.target.value)}
                    placeholder="08123456789"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSantriToEdit(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Setting Role & Edit User (Save-able) */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-700" />
                Setting Role & Edit Akun Pengguna
              </h4>
              <button
                onClick={() => setUserToEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad Fauzi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password / PIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Save-able Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role Hak Akses (Save-able) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Ustadz">🛡️ Ustadz (Input Setoran, Kelola Santri & Akun)</option>
                  <option value="Wali">👥 Wali Santri (Monitoring Mutaba'ah & Progres Ananda)</option>
                  <option value="Santri">📖 Santri (View-Only: Lihat Progres Pribadi & Mushaf)</option>
                </select>
              </div>

              {/* Kaitan ID Santri jika Wali atau Santri */}
              {editRole !== 'Ustadz' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kaitan ID Santri / NIS <span className="text-rose-500">*</span>
                  </label>
                  {santriList.length > 0 ? (
                    <select
                      value={editIdSantri}
                      onChange={(e) => setEditIdSantri(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Pilih ID Santri Terkait --</option>
                      {santriList.map((s) => (
                        <option key={s.idSantri} value={s.idSantri}>
                          {s.idSantri} - {s.namaSantri} ({getClassGroup(s.kelas)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={editIdSantri}
                      onChange={(e) => setEditIdSantri(e.target.value)}
                      placeholder="Masukkan ID Santri (cth: STR001)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">
                    Akun ini akan menampilkan data mutaba'ah santri dengan ID yang dipilih saat login dari rumah.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Role & Akun'}</span>
                </button>
              </div>
            </form>
          </div>
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
                <span className="font-medium text-slate-700">{getClassGroup(santriToDelete.kelas)}</span>
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
                  Hapus juga seluruh <b>riwayat setoran Ziyadah & Muroja'ah</b> serta <b>akun login wali & santri</b> ini.
                </span>
              </label>
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

      {/* Modal Konfirmasi Hapus User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Hapus Akun Pengguna?</h4>
                <p className="text-xs text-slate-500">Akun ini tidak akan dapat login lagi</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama:</span>
                <span className="font-bold text-slate-800">{userToDelete.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="font-mono font-bold text-emerald-800">{userToDelete.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-bold text-slate-700">{userToDelete.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}</span>
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
                Tambah Data Santri Baru
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSantri} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Santri / NIS (Opsional)
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="Otomatis jika kosong (cth: STR001)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Muhammad Fatih"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas Bimbingan
                  </label>
                  <select
                    value={newKelas}
                    onChange={(e) => setNewKelas(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="Tahfidz">Tahfidz</option>
                    <option value="Binnadzor A">Binnadzor A</option>
                    <option value="Binnadzor B">Binnadzor B</option>
                    <option value="Jilid">Jilid</option>
                    <option value="Kelas Istimewa">Kelas Istimewa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Hafalan
                  </label>
                  <input
                    type="text"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="Contoh: Juz 30 (37 Surah)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Wali Santri
                  </label>
                  <input
                    type="text"
                    value={newWaliNama}
                    onChange={(e) => setNewWaliNama(e.target.value)}
                    placeholder="Contoh: Bpk. Hendra Wijaya"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password Default Akun
                  </label>
                  <input
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    placeholder="Default: 123"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. Kontak / WA Wali Santri (Opsional)
                </label>
                <input
                  type="text"
                  value={newWaliKontak}
                  onChange={(e) => setNewWaliKontak(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-snug">
                Sistem otomatis membuatkan akun login <b>Wali</b> (<code className="font-mono bg-white px-1 rounded">wali_idsantri</code>) dan akun login <b>Santri</b> (<code className="font-mono bg-white px-1 rounded">idsantri</code>) untuk diakses di rumah.
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Data Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah User Akun Baru */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-700" />
                Tambah Akun Pengguna Baru
              </h4>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserNama}
                  onChange={(e) => setNewUserNama(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad Hidayat, S.Pd"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: ustadz2"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Hak Akses
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="Ustadz">Ustadz</option>
                    <option value="Wali">Wali Santri</option>
                    <option value="Santri">Santri (View-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {newUserRole !== 'Ustadz' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kaitan ID Santri / NIS
                  </label>
                  {santriList.length > 0 ? (
                    <select
                      value={newUserIdSantri}
                      onChange={(e) => setNewUserIdSantri(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                    >
                      <option value="">-- Pilih ID Santri --</option>
                      {santriList.map((s) => (
                        <option key={s.idSantri} value={s.idSantri}>
                          {s.idSantri} - {s.namaSantri}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newUserIdSantri}
                      onChange={(e) => setNewUserIdSantri(e.target.value)}
                      placeholder="Masukkan ID Santri (cth: STR001)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Akun Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
