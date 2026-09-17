import React, { useState } from 'react';
import { Santri, User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { Users, UserPlus, Target, Trash2, Search, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Shield, Key, SquarePen, UserCheck, Save, Phone, Copy, Share2, Crown, Lock } from 'lucide-react';
import { getClassGroup } from '../utils/classUtils';
import type { NotifyFn } from './Snackbar';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface SantriManagementProps {
  santriList: Santri[];
  onDataChanged: () => void;
  onNotify: NotifyFn;
}

export const SantriManagement: React.FC<SantriManagementProps> = ({
  santriList,
  onDataChanged,
  onNotify
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

  const [newId, setNewId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('Tahfidz');
  const [newTarget, setNewTarget] = useState('Juz 30 (37 Surah)');
  const [newWaliNama, setNewWaliNama] = useState('');
  const [newWaliKontak, setNewWaliKontak] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('123');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const addSantriDialogRef = useAccessibleDialog(showAddModal, () => { if (!isSaving) setShowAddModal(false); });
  const addUserDialogRef = useAccessibleDialog(showAddUserModal, () => { if (!isSaving) setShowAddUserModal(false); });
  const editSantriDialogRef = useAccessibleDialog(Boolean(santriToEdit), () => { if (!isSaving) setSantriToEdit(null); });
  const editUserDialogRef = useAccessibleDialog(Boolean(userToEdit), () => { if (!isSaving) setUserToEdit(null); });
  const deleteSantriDialogRef = useAccessibleDialog(Boolean(santriToDelete), () => { if (!isDeleting) setSantriToDelete(null); });
  const deleteUserDialogRef = useAccessibleDialog(Boolean(userToDelete), () => { if (!isDeleting) setUserToDelete(null); });

  const [editSantriNama, setEditSantriNama] = useState('');
  const [editSantriKelas, setEditSantriKelas] = useState('');
  const [editSantriTarget, setEditSantriTarget] = useState('');
  const [editSantriWaliNama, setEditSantriWaliNama] = useState('');
  const [editSantriWaliKontak, setEditSantriWaliKontak] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newUserNama, setNewUserNama] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Ustadz');
  const [newUserIdSantri, setNewUserIdSantri] = useState('');

  const [editNama, setEditNama] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Ustadz');
  const [editIdSantri, setEditIdSantri] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => onNotify(type, message);

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
    if (!userToEdit || !editNama.trim()) return;

    const isSuper = userToEdit.role === 'Superadmin';
    if (!isSuper && (!editUsername.trim() || !editPassword.trim())) return;

    const cleanUsername = isSuper ? userToEdit.username : editUsername.trim().toLowerCase();
    const cleanNama = editNama.trim();
    const cleanPassword = isSuper ? userToEdit.password : editPassword.trim();

    if (!isSuper) {
      const usernameConflict = usersList.find(u => u.id !== userToEdit.id && u.username.toLowerCase() === cleanUsername);
      if (usernameConflict) {
        showToast('error', `Username "${cleanUsername}" sudah digunakan oleh akun ${usernameConflict.nama}.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await storageService.updateUser(userToEdit.id, {
        nama: cleanNama,
        username: cleanUsername,
        password: cleanPassword,
        role: editRole,
        idSantri: (editRole === 'Ustadz' || editRole === 'Superadmin' || editRole === 'Pimpinan') ? '' : editIdSantri.trim()
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
        idSantri: (newUserRole === 'Ustadz' || newUserRole === 'Superadmin' || newUserRole === 'Pimpinan') ? '' : newUserIdSantri.trim()
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
      showToast('success', `Data santri ${deletedName} (${deletedId}) berhasil dihapus dari Cloud.`);
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
      showToast('success', `Akun ${deletedName} berhasil dihapus dari Cloud.`);
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

  const getWaliCredentialText = (santri: Santri) => {
    const waliUsername = `wali_${santri.idSantri.toLowerCase()}`;
    const userAcc = usersList.find(u => u.role === 'Wali' && (u.idSantri === santri.idSantri || u.username.toLowerCase() === waliUsername));
    const waliPassword = userAcc ? userAcc.password : '123';
    const appUrl = 'https://tahfidzpesmad.my.id';

    return `Assalamu'alaikum Warahmatullahi Wabarakatuh,
Yth. Bapak/Ibu Wali dari Ananda *${santri.namaSantri}* (Kelas: ${santri.kelas}),

Berikut informasi akses akun Portal Wali Santri Madrasah Darul Fikri:
🌐 *Link Portal:* ${appUrl}
👤 *Username:* ${waliUsername}
🔑 *Password:* ${waliPassword}

Fasilitas Portal Wali Santri:
1. Memantau capaian hafalan Ziyadah & Muroja'ah ananda secara real-time
2. Membaca Mushaf Digital 30 Juz & audio murattal
3. Mengisi Program Pantauan Liburan Santri (Wirid Yaumiyyah al-Waqi'ah, al-Mulk, al-Insyirah & Shalat 5 Waktu Berjama'ah) ketika liburan diaktifkan oleh Ustadz

Jazakumullah Khairan Katsiran.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;
  };

  const handleCopyWaliCredentials = async (santri: Santri) => {
    const text = getWaliCredentialText(santri);
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `Kredensial login Wali untuk ${santri.namaSantri} berhasil disalin! Siap dibagikan ke WhatsApp.`);
    } catch (err) {
      showToast('error', 'Gagal menyalin ke clipboard.');
    }
  };

  const getWaliWhatsAppUrl = (santri: Santri) => {
    const text = getWaliCredentialText(santri);
    let phone = (santri.waliKontak || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyUserCredentials = async (u: User) => {
    if (u.role === 'Superadmin') {
      showToast('error', 'Kredensial akun Superadmin bersifat rahasia dan tidak dapat disalin.');
      return;
    }
    const appUrl = 'https://tahfidzpesmad.my.id';
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh,
Informasi Akun ${u.nama} (${u.role}):
🌐 *Link Portal:* ${appUrl}
👤 *Username:* ${u.username}
🔑 *Password:* ${u.password}
Role: ${u.role}${u.idSantri ? ` (ID Santri: ${u.idSantri})` : ''}

Silakan buka Link Portal di atas untuk masuk ke sistem.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `Kredensial akun ${u.nama} (${u.username}) berhasil disalin! Siap dibagikan.`);
    } catch (err) {
      showToast('error', 'Gagal menyalin ke clipboard.');
    }
  };

  const handleShareUserCredentials = (u: User) => {
    if (u.role === 'Superadmin') {
      showToast('error', 'Kredensial akun Superadmin bersifat rahasia dan tidak dapat dibagikan.');
      return;
    }
    const appUrl = 'https://tahfidzpesmad.my.id';
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh,
Informasi Akun ${u.nama} (${u.role}):
🌐 *Link Portal:* ${appUrl}
👤 *Username:* ${u.username}
🔑 *Password:* ${u.password}
Role: ${u.role}${u.idSantri ? ` (ID Santri: ${u.idSantri})` : ''}

Silakan buka Link Portal di atas untuk masuk ke sistem.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getRoleTone = (role: UserRole) => {
    if (role === 'Superadmin') return 'border-amber-200 bg-amber-50 text-amber-900';
    if (role === 'Pimpinan') return 'border-violet-200 bg-violet-50 text-violet-900';
    if (role === 'Ustadz') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (role === 'Wali') return 'border-teal-200 bg-teal-50 text-teal-800';
    return 'border-cyan-200 bg-cyan-50 text-cyan-800';
  };

  return (
    <div className="p3-management-page p3-santri-management space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h3 className="ui-page-title text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            Santri & Akun
          </h3>
          <p className="text-xs text-slate-500">Kelola identitas santri, data wali, target hafalan, kredensial, dan hak akses pengguna.</p>
        </div>
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full lg:w-auto">
          <button type="button" onClick={() => setActiveSubTab('santri')} aria-pressed={activeSubTab === 'santri'} className={`ui-control px-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'santri' ? 'bg-white text-emerald-900 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
            <Users className="w-3.5 h-3.5" /><span>Data Santri ({santriList.length})</span>
          </button>
          <button type="button" onClick={() => setActiveSubTab('users')} aria-pressed={activeSubTab === 'users'} className={`ui-control px-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${activeSubTab === 'users' ? 'bg-white text-emerald-900 border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
            <Key className="w-3.5 h-3.5" /><span>Akun Pengguna ({usersList.length})</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input id="search-santri-input" type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={activeSubTab === 'santri' ? 'Cari nama, ID, kelas...' : 'Cari user, nama, role, NIS...'} aria-label={activeSubTab === 'santri' ? 'Cari data santri' : 'Cari akun pengguna'} className="ui-control w-full pl-10 pr-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400" />
        </div>
        {activeSubTab === 'santri' ? (
          <button id="btn-tambah-santri" onClick={() => setShowAddModal(true)} className="ui-control w-full sm:w-auto px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"><UserPlus className="w-4 h-4" /><span>Tambah Santri Baru</span></button>
        ) : (
          <button id="btn-tambah-user" onClick={() => setShowAddUserModal(true)} className="ui-control w-full sm:w-auto px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"><UserPlus className="w-4 h-4" /><span>Tambah Akun Baru</span></button>
        )}
      </div>

      {activeSubTab === 'santri' && (
        <>
          <div className="flex items-end justify-between gap-3"><div><h4 className="ui-section-title">Daftar santri</h4><p className="ui-secondary mt-0.5">{filteredSantri.length} dari {santriList.length} santri ditampilkan.</p></div></div>
          {santriList.length === 0 ? (
            <div className="text-center py-14 px-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-600 space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner"><Users className="w-8 h-8 text-emerald-700" /></div>
              <div><h4 className="font-extrabold text-slate-800 text-base">Belum ada santri</h4><p className="text-xs text-slate-500 mt-1 leading-relaxed">Database santri bersih & tersinkronisasi ke Cloud Firestore. Tambahkan santri baru untuk mulai mencatat setoran Ziyadah & Muroja'ah.</p></div>
              <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition inline-flex items-center gap-2 cursor-pointer"><UserPlus className="w-4 h-4" /><span>Tambah Santri Pertama</span></button>
            </div>
          ) : filteredSantri.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2"><Users className="w-8 h-8 mx-auto text-slate-400" /><p className="text-sm font-semibold">Tidak ada santri yang cocok dengan pencarian.</p></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSantri.map((santri) => {
                const stats = getSantriStats(santri.idSantri);
                return (
                  <div key={santri.idSantri} id={`santri-card-${santri.idSantri}`} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4 group relative">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">{santri.idSantri}</span><span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md truncate max-w-[150px]">{santri.kelas || 'Belum Ada Kelas'}</span></div>
                      <div><h4 className="font-extrabold text-slate-800 text-base leading-snug">{santri.namaSantri}</h4>{santri.waliNama && <p className="text-xs text-slate-500 mt-0.5">Wali: <span className="font-medium text-slate-700">{santri.waliNama}</span>{santri.waliKontak ? ` (${santri.waliKontak})` : ''}</p>}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600"><Target className="w-4 h-4 text-emerald-700 flex-shrink-0" /><span>Target: <b>{santri.targetHafalan}</b></span></div>
                      <div className="flex items-center gap-2 pt-1"><span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">{stats.totalZiyadah} Ziyadah</span><span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800">{stats.totalMurojaah} Muroja'ah</span></div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleCopyWaliCredentials(santri)} className="min-h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"><Copy className="w-3.5 h-3.5 text-emerald-700" /><span>Salin Akun Wali</span></button>
                        {santri.waliKontak && <a href={getWaliWhatsAppUrl(santri)} target="_blank" rel="noopener noreferrer" className="min-h-9 min-w-9 p-2 text-teal-700 hover:bg-teal-100 bg-teal-50 border border-teal-200 rounded-lg transition-colors flex items-center justify-center cursor-pointer"><Share2 className="w-3.5 h-3.5" /></a>}
                        <button onClick={() => handleOpenEditSantri(santri)} className="min-h-9 px-3 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"><SquarePen className="w-3.5 h-3.5" /><span>Edit</span></button>
                        <button onClick={() => { setSantriToDelete(santri); setDeleteWithHistory(true); }} className="min-h-9 px-3 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"><Trash2 className="w-3.5 h-3.5" /><span>Hapus</span></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3"><div><h4 className="ui-section-title">Daftar akun pengguna</h4><p className="ui-secondary mt-0.5">{filteredUsers.length} dari {usersList.length} akun ditampilkan.</p></div></div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-700 flex-shrink-0" /><span>Gunakan tombol <b>Edit</b> untuk mengubah Role (Pimpinan/Ustadz/Wali/Santri), Username, Password, dan Kaitan ID Santri.</span></div></div>

          <div className="lg:hidden space-y-3">
            {filteredUsers.map((u) => {
              const isSuperadmin = u.role === 'Superadmin';
              return (
                <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h5 className="text-sm font-bold text-slate-900 truncate">{u.nama}</h5><p className="mt-1 text-xs text-slate-500">{u.idSantri ? `Terkait santri ${u.idSantri}` : 'Tidak terkait ID santri'}</p></div><span className={`flex-shrink-0 rounded-lg border px-2 py-1 text-xs font-semibold ${getRoleTone(u.role)}`}>{u.role}</span></div>
                  <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs"><dt className="text-slate-500">Username</dt><dd className="font-mono text-slate-700 break-all">{isSuperadmin ? 'Dirahasiakan' : u.username}</dd><dt className="text-slate-500">Password</dt><dd className="font-mono text-slate-700 break-all">{isSuperadmin ? 'Dirahasiakan' : u.password}</dd></dl>
                  {!isSuperadmin && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => handleCopyUserCredentials(u)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Salin</button><button type="button" onClick={() => handleShareUserCredentials(u)} className="min-h-11 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Bagikan</button><button type="button" onClick={() => handleOpenEditUser(u)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"><SquarePen className="w-3.5 h-3.5" /> Edit</button><button type="button" onClick={() => setUserToDelete(u)} className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Hapus</button></div>}
                </article>
              );
            })}
          </div>

          <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-2xl bg-white">
            <table className="w-full text-left text-xs"><caption className="sr-only">Daftar akun pengguna dan hak akses</caption><thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200"><tr><th className="py-3 px-3.5">Nama Pengguna</th><th className="py-3 px-3.5">Username Login</th><th className="py-3 px-3.5">Password</th><th className="py-3 px-3.5">Role Hak Akses</th><th className="py-3 px-3.5">Kaitan ID Santri</th><th className="py-3 px-3.5 text-center">Aksi</th></tr></thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => {
                  const isSuperadmin = u.role === 'Superadmin';
                  const roleBadge = u.role === 'Superadmin' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300"><Crown className="w-3 h-3" /> Superadmin</span> : u.role === 'Pimpinan' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-violet-100 text-violet-900 font-bold text-xs border border-violet-300"><Shield className="w-3 h-3" /> Pimpinan</span> : u.role === 'Ustadz' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300"><Shield className="w-3 h-3" /> Ustadz</span> : u.role === 'Wali' ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs border border-teal-300"><Users className="w-3 h-3" /> Wali Santri</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-100 text-cyan-800 font-bold text-xs border border-cyan-300"><UserCheck className="w-3 h-3" /> Santri</span>;
                  return <tr key={u.id}><td className="py-3 px-3.5 font-bold">{u.nama}</td><td className="py-3 px-3.5 font-mono">{isSuperadmin ? 'Dirahasiakan' : u.username}</td><td className="py-3 px-3.5 font-mono">{isSuperadmin ? 'Dirahasiakan' : u.password}</td><td className="py-3 px-3.5">{roleBadge}</td><td className="py-3 px-3.5 font-mono">{u.idSantri || '-'}</td><td className="py-3 px-3.5 text-center">{!isSuperadmin && <div className="flex items-center justify-center gap-1.5"><button onClick={() => handleCopyUserCredentials(u)}><Copy className="w-3.5 h-3.5" /></button><button onClick={() => handleShareUserCredentials(u)}><Share2 className="w-3.5 h-3.5" /></button><button onClick={() => handleOpenEditUser(u)}><SquarePen className="w-3.5 h-3.5" /></button><button onClick={() => setUserToDelete(u)}><Trash2 className="w-3.5 h-3.5" /></button></div>}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {santriToEdit && (
        <div ref={editSantriDialogRef} className="ui-dialog-overlay" role="dialog" aria-modal="true" tabIndex={-1}>
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5"><div className="flex items-start justify-between gap-3 pb-4 border-b"><h4 className="font-extrabold">Edit Data Santri ({santriToEdit.idSantri})</h4><button onClick={() => setSantriToEdit(null)}>✕</button></div><form onSubmit={handleSaveEditSantri} className="space-y-3.5"><input value={editSantriNama} onChange={(e) => setEditSantriNama(e.target.value)} className="w-full p-2.5 border rounded-xl" /><input value={editSantriTarget} onChange={(e) => setEditSantriTarget(e.target.value)} className="w-full p-2.5 border rounded-xl" /><input value={editSantriWaliNama} onChange={(e) => setEditSantriWaliNama(e.target.value)} className="w-full p-2.5 border rounded-xl" /><input value={editSantriWaliKontak} onChange={(e) => setEditSantriWaliKontak(e.target.value)} className="w-full p-2.5 border rounded-xl" /><div className="ui-dialog-footer"><button type="button" onClick={() => setSantriToEdit(null)}>Batal</button><button type="submit" disabled={isSaving}><Save className="w-4 h-4" /> Simpan</button></div></form></div>
        </div>
      )}

      {userToEdit && (
        <div ref={editUserDialogRef} className="ui-dialog-overlay" role="dialog" aria-modal="true" aria-label="Edit akun pengguna" tabIndex={-1}>
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b"><h4 className="font-extrabold">Setting Role & Edit Akun Pengguna</h4><button onClick={() => setUserToEdit(null)}>✕</button></div>
            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <input type="text" required value={editNama} onChange={(e) => setEditNama(e.target.value)} className="w-full p-2.5 border rounded-xl" />
              {userToEdit.role !== 'Superadmin' && <><input type="text" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full p-2.5 border rounded-xl" /><input type="text" required value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="w-full p-2.5 border rounded-xl" /></>}
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold">
                <option value="Superadmin">Superadmin (Akses Penuh Seluruh Sistem & Manajemen)</option>
                <option value="Pimpinan">Pimpinan (Monitoring Global • View-Only)</option>
                <option value="Ustadz">Ustadz (Input Setoran, Kelola Santri & Akun)</option>
                <option value="Wali">Wali Santri (Monitoring Mutaba'ah & Progres Ananda)</option>
                <option value="Santri">Santri (View-Only: Lihat Progres Pribadi & Mushaf)</option>
              </select>
              {(editRole === 'Wali' || editRole === 'Santri') && <select value={editIdSantri} onChange={(e) => setEditIdSantri(e.target.value)} className="w-full p-2.5 border rounded-xl"><option value="">-- Pilih ID Santri Terkait --</option>{santriList.map((s) => <option key={s.idSantri} value={s.idSantri}>{s.idSantri} - {s.namaSantri}</option>)}</select>}
              {editRole === 'Pimpinan' && <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-xl p-3">Role Pimpinan bersifat monitoring global dan tidak memerlukan kaitan ID santri.</p>}
              <div className="ui-dialog-footer"><button type="button" onClick={() => setUserToEdit(null)}>Batal</button><button type="submit" disabled={isSaving}><Save className="w-4 h-4" /> Simpan Perubahan</button></div>
            </form>
          </div>
        </div>
      )}

      {santriToDelete && <div ref={deleteSantriDialogRef} className="ui-dialog-overlay" role="dialog" aria-modal="true" tabIndex={-1}><div className="ui-dialog-panel max-w-md p-5 space-y-5"><h4 className="font-extrabold">Hapus Data Santri?</h4><label className="flex gap-2"><input type="checkbox" checked={deleteWithHistory} onChange={(e) => setDeleteWithHistory(e.target.checked)} /> Hapus juga riwayat dan akun terkait</label><div className="ui-dialog-footer"><button onClick={() => setSantriToDelete(null)}>Batal</button><button onClick={handleDeleteSantri} disabled={isDeleting}>Hapus</button></div></div></div>}
      {userToDelete && <div ref={deleteUserDialogRef} className="ui-dialog-overlay" role="dialog" aria-modal="true" tabIndex={-1}><div className="ui-dialog-panel max-w-md p-5 space-y-5"><h4 className="font-extrabold">Hapus Akun Pengguna?</h4><p>{userToDelete.nama} · {userToDelete.role}</p><div className="ui-dialog-footer"><button onClick={() => setUserToDelete(null)}>Batal</button><button onClick={handleDeleteUser} disabled={isDeleting}>Hapus</button></div></div></div>}

      {showAddModal && (
        <div ref={addSantriDialogRef} className="ui-dialog-overlay" role="dialog" aria-modal="true" tabIndex={-1}>
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5"><h4 className="font-extrabold">Tambah Data Santri Baru</h4><form onSubmit={handleAddSantri} className="space-y-3.5"><input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="ID Santri" className="w-full p-2.5 border rounded-xl" /><input required value={newNama} onChange={(e) => setNewNama(e.target.value)} placeholder="Nama Santri" className="w-full p-2.5 border rounded-xl" /><input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="w-full p-2.5 border rounded-xl" /><input value={newWaliNama} onChange={(e) => setNewWaliNama(e.target.value)} placeholder="Nama Wali" className="w-full p-2.5 border rounded-xl" /><input value={newWaliKontak} onChange={(e) => setNewWaliKontak(e.target.value)} placeholder="Kontak Wali" className="w-full p-2.5 border rounded-xl" /><input value={defaultPassword} onChange={(e) => setDefaultPassword(e.target.value)} className="w-full p-2.5 border rounded-xl" /><div className="ui-dialog-footer"><button type="button" onClick={() => setShowAddModal(false)}>Batal</button><button type="submit" disabled={isSaving}>Simpan Data Santri</button></div></form></div>
        </div>
      )}

      {showAddUserModal && (
        <div ref={addUserDialogRef} className="ui-dialog-overlay" role="dialog" aria-modal="true" aria-label="Tambah akun pengguna" tabIndex={-1}>
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
            <h4 className="font-extrabold">Tambah Akun Pengguna Baru</h4>
            <form onSubmit={handleAddUser} className="space-y-3.5">
              <input type="text" required value={newUserNama} onChange={(e) => setNewUserNama(e.target.value)} placeholder="Nama lengkap" className="w-full p-2.5 border rounded-xl" />
              <input type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Username" className="w-full p-2.5 border rounded-xl" />
              <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)} className="w-full p-2.5 border rounded-xl">
                <option value="Superadmin">Superadmin</option>
                <option value="Pimpinan">Pimpinan (Monitoring Global • View-Only)</option>
                <option value="Ustadz">Ustadz</option>
                <option value="Wali">Wali Santri</option>
                <option value="Santri">Santri (View-Only)</option>
              </select>
              <input type="password" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Password" className="w-full p-2.5 border rounded-xl" />
              {(newUserRole === 'Wali' || newUserRole === 'Santri') && <select value={newUserIdSantri} onChange={(e) => setNewUserIdSantri(e.target.value)} className="w-full p-2.5 border rounded-xl"><option value="">-- Pilih ID Santri --</option>{santriList.map((s) => <option key={s.idSantri} value={s.idSantri}>{s.idSantri} - {s.namaSantri}</option>)}</select>}
              {newUserRole === 'Pimpinan' && <p className="text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-xl p-3">Akun Pimpinan dapat memantau data global secara view-only dan tidak ditautkan ke santri tertentu.</p>}
              <div className="ui-dialog-footer"><button type="button" onClick={() => setShowAddUserModal(false)}>Batal</button><button type="submit" disabled={isSaving}>Simpan Akun Pengguna</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
