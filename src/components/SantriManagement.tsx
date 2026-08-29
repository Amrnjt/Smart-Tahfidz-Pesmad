import React, { useState } from 'react';
import { Santri, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Users, UserPlus, Target, Trash2, Search, AlertTriangle, CheckCircle2, Shield, Key, Edit3, UserCheck } from 'lucide-react';

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
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteWithHistory, setDeleteWithHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Santri Form State
  const [newId, setNewId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('Tahfidz A (Ikhwan)');
  const [newTarget, setNewTarget] = useState('Juz 30 (37 Surah)');
  const [newWaliNama, setNewWaliNama] = useState('');
  const [newWaliKontak, setNewWaliKontak] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('123');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Ustadz / User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newUserNama, setNewUserNama] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Ustadz');

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
      
      const newSantri: Santri = {
        idSantri: generatedId,
        namaSantri: newNama.trim(),
        kelas: newKelas,
        targetHafalan: newTarget,
        totalHafalanSelesai: 0,
        waliNama: newWaliNama.trim() || undefined,
        waliKontak: newWaliKontak.trim() || undefined
      };

      storageService.addSantri(newSantri, defaultPassword.trim() || '123');
      setIsSaving(false);
      setShowAddModal(false);
      setNewNama('');
      setNewId('');
      setNewWaliNama('');
      setNewWaliKontak('');
      onDataChanged();
      showToast('success', `Santri ${newNama.trim()} (${generatedId}) berhasil ditambahkan beserta akun Wali & Santri.`);
    }, 300);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserNama.trim() || !newUserPassword.trim()) return;

    setIsSaving(true);
    setTimeout(() => {
      const newUser: User = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        username: newUsername.trim(),
        password: newUserPassword.trim(),
        role: newUserRole,
        nama: newUserNama.trim(),
        idSantri: ''
      };

      storageService.addUser(newUser);
      setIsSaving(false);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewUserNama('');
      setNewUserPassword('123');
      onDataChanged();
      showToast('success', `Akun ${newUserNama.trim()} (${newUserRole}) berhasil dibuat.`);
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

  const handleDeleteUser = () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setTimeout(() => {
      const deletedName = userToDelete.nama;
      storageService.deleteUser(userToDelete.id);
      setIsDeleting(false);
      setUserToDelete(null);
      onDataChanged();
      showToast('success', `Akun ${deletedName} berhasil dihapus.`);
    }, 300);
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
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
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
            Manajemen Data Santri & Akun Pengguna (Admin)
          </h3>
          <p className="text-xs text-slate-500">
            Pengelolaan data santri, target kelulusan, dan hak akses akun (Ustadz Admin, Wali, Santri)
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
            placeholder={activeSubTab === 'santri' ? 'Cari nama, ID, kelas...' : 'Cari user, nama, role...'}
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
            <span>Tambah Akun Ustadz / User</span>
          </button>
        )}
      </div>

      {/* Tab 1: Santri Cards Grid */}
      {activeSubTab === 'santri' && (
        <>
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
                      <div className="truncate text-[10px] space-y-0.5">
                        <div>Wali: <code className="bg-slate-200/80 px-1 rounded font-mono text-slate-700">wali_{santri.idSantri.toLowerCase()}</code></div>
                        <div>Santri: <code className="bg-slate-200/80 px-1 rounded font-mono text-slate-700">{santri.idSantri}</code></div>
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
        </>
      )}

      {/* Tab 2: User Accounts Table */}
      {activeSubTab === 'users' && (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Nama Pengguna</th>
                <th className="py-3 px-3.5">Username Login</th>
                <th className="py-3 px-3.5">Role Hak Akses</th>
                <th className="py-3 px-3.5">Kaitan ID Santri</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada akun yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  let roleBadge = null;
                  if (u.role === 'Ustadz') {
                    roleBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                        <Shield className="w-3 h-3 text-emerald-700" /> Ustadz (Admin)
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
                      <td className="py-3 px-3.5">{roleBadge}</td>
                      <td className="py-3 px-3.5 font-mono text-slate-500">
                        {u.idSantri || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
                  placeholder="Otomatis jika kosong (cth: STR006)"
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
                  placeholder="Contoh: Farhan Al-Ghazi"
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
                    <option value="Tahfidz A (Ikhwan)">Tahfidz A (Ikhwan)</option>
                    <option value="Tahfidz B (Akhwat)">Tahfidz B (Akhwat)</option>
                    <option value="Tahfidz Reguler">Tahfidz Reguler</option>
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
                    placeholder="Contoh: Bpk. Ahmad"
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

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-snug">
                Sistem akan otomatis membuatkan akun login <b>Wali</b> (<code className="font-mono">wali_id</code>) dan akun login <b>Santri</b> (<code className="font-mono">id_santri</code>).
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

      {/* Modal Tambah User Akun */}
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
                  placeholder="Contoh: ustadz3"
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
                    <option value="Ustadz">Ustadz (Admin)</option>
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
