import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  KELAS_FORMAL_OPTIONS,
  SATUAN_PENDIDIKAN_FORMAL_OPTIONS,
  SEMESTER_AKADEMIK_OPTIONS,
  Santri,
  User,
  UserRole,
  type ZiyadahRecord,
  type MurojaahRecord,
  type KelasFormal,
  type KenaikanKelasFormalRecord,
  type RiwayatAkademikRecord,
  type SatuanPendidikanFormal,
  type SemesterAkademik
} from '../types';
import { storageService } from '../services/storageService';
import { Users, UserPlus, Target, Trash2, Search, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Shield, Key, SquarePen, UserCheck, Save, Phone, Copy, Share2, Crown, Lock, CalendarRange, History, RefreshCw, ArrowUpCircle, GraduationCap, FileText, FileSpreadsheet } from 'lucide-react';
import { getClassGroup } from '../utils/classUtils';
import type { NotifyFn } from './Snackbar';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import {
  buildStatsBySantri,
  buildUserCredentialText,
  buildWaliCredentialText,
  buildWaliWhatsAppUrl,
  filterSantriList,
  filterUsersList,
  getFormalLabel,
  getSantriStats as resolveSantriStats
} from './santri/santriManagementModel';
const AcademicReportModal = lazy(() =>
  import('./AcademicReportModal').then((module) => ({ default: module.AcademicReportModal }))
);
const CollectiveAcademicReportModal = lazy(() =>
  import('./CollectiveAcademicReportModal').then((module) => ({ default: module.CollectiveAcademicReportModal }))
);


interface SantriManagementProps {
  currentUser: User;
  santriList: Santri[];
  usersList: User[];
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  onDataChanged: () => void;
  onNotify: NotifyFn;
}

export const SantriManagement: React.FC<SantriManagementProps> = ({
  currentUser,
  santriList,
  usersList,
  ziyadahRecords,
  murojaahRecords,
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
  const [satuanPendidikanFilter, setSatuanPendidikanFilter] = useState<SatuanPendidikanFormal | ''>('');
  const [kelasFormalFilter, setKelasFormalFilter] = useState<KelasFormal | ''>('');

  const appConfig = storageService.getAppConfig();
  const [academicYear, setAcademicYear] = useState(appConfig.tahunPelajaranAktif || '');
  const [academicSemester, setAcademicSemester] = useState<SemesterAkademik>(appConfig.semesterAkademikAktif || 'Ganjil');
  const [isSavingAcademicPeriod, setIsSavingAcademicPeriod] = useState(false);
  const [historySantri, setHistorySantri] = useState<Santri | null>(null);
  const [academicHistoryRecords, setAcademicHistoryRecords] = useState<RiwayatAkademikRecord[]>([]);
  const [isLoadingAcademicHistory, setIsLoadingAcademicHistory] = useState(false);
  const [isSavingAcademicSnapshot, setIsSavingAcademicSnapshot] = useState(false);
  const [promotionPreviewClass, setPromotionPreviewClass] = useState<KelasFormal | null>(null);
  const [promotionRuns, setPromotionRuns] = useState<Partial<Record<KelasFormal, KenaikanKelasFormalRecord>>>({});
  const [isLoadingPromotionRuns, setIsLoadingPromotionRuns] = useState(false);
  const [isProcessingPromotion, setIsProcessingPromotion] = useState(false);
  const [reportSantri, setReportSantri] = useState<Santri | null>(null);
  const [showCollectiveReport, setShowCollectiveReport] = useState(false);

  // New Santri Form State
  const [newId, setNewId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelas, setNewKelas] = useState('Tahfidz');
  const [newSatuanPendidikan, setNewSatuanPendidikan] = useState<SatuanPendidikanFormal>('MTs');
  const [newKelasFormal, setNewKelasFormal] = useState<KelasFormal | ''>('');
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
  const academicHistoryDialogRef = useAccessibleDialog(Boolean(historySantri), () => { if (!isSavingAcademicSnapshot) setHistorySantri(null); });
  const promotionPreviewDialogRef = useAccessibleDialog(Boolean(promotionPreviewClass), () => { if (!isProcessingPromotion) setPromotionPreviewClass(null); });

  useEffect(() => {
    setAcademicYear(appConfig.tahunPelajaranAktif || '');
    setAcademicSemester(appConfig.semesterAkademikAktif || 'Ganjil');
  }, [appConfig.tahunPelajaranAktif, appConfig.semesterAkademikAktif]);

  // Edit Santri Form State
  const [editSantriNama, setEditSantriNama] = useState('');
  const [editSantriKelas, setEditSantriKelas] = useState('');
  const [editSantriSatuanPendidikan, setEditSantriSatuanPendidikan] = useState<SatuanPendidikanFormal | ''>('');
  const [editSantriKelasFormal, setEditSantriKelasFormal] = useState<KelasFormal | ''>('');
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

  const showToast = (type: 'success' | 'error', message: string) => onNotify(type, message);
  const canManageAccounts = currentUser.role === 'Superadmin';

  const currentCalendarYear = new Date().getFullYear();
  const savedAcademicYear = appConfig.tahunPelajaranAktif || academicYear;
  const savedAcademicSemester = appConfig.semesterAkademikAktif || academicSemester;
  const savedAcademicYearMatch = /^(\d{4})\/(\d{4})$/.exec(savedAcademicYear);
  const nextAcademicYear = savedAcademicYearMatch
    ? `${savedAcademicYearMatch[2]}/${Number(savedAcademicYearMatch[2]) + 1}`
    : 'Tahun berikutnya';

  const academicYearOptions = Array.from(new Set([
    academicYear,
    ...Array.from({ length: 7 }, (_, index) => {
      const start = currentCalendarYear - 3 + index;
      return `${start}/${start + 1}`;
    })
  ].filter(Boolean))).sort((a, b) => a.localeCompare(b));

  const handleSaveAcademicPeriod = async () => {
    if (!academicYear) return;
    setIsSavingAcademicPeriod(true);
    try {
      await storageService.setAcademicPeriod(academicYear, academicSemester, currentUser.nama || 'Ustadz / Admin');
      onDataChanged();
      showToast('success', `Periode akademik aktif disimpan: ${academicYear} · Semester ${academicSemester}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan periode akademik.');
    } finally {
      setIsSavingAcademicPeriod(false);
    }
  };

  const loadAcademicHistory = async (santri: Santri) => {
    setHistorySantri(santri);
    setIsLoadingAcademicHistory(true);
    try {
      const records = await storageService.fetchAcademicHistory(santri.idSantri);
      setAcademicHistoryRecords(records);
    } catch {
      setAcademicHistoryRecords([]);
      showToast('error', 'Gagal memuat riwayat akademik santri.');
    } finally {
      setIsLoadingAcademicHistory(false);
    }
  };

  const loadPromotionRuns = async () => {
    const savedYear = storageService.getAppConfig().tahunPelajaranAktif;
    if (!savedYear) {
      setPromotionRuns({});
      return;
    }

    setIsLoadingPromotionRuns(true);
    try {
      const kelasList: KelasFormal[] = ['VII', 'VIII', 'IX'];
      const entries = await Promise.all(
        kelasList.map(async kelas => [kelas, await storageService.getFormalPromotionRun(savedYear, kelas)] as const)
      );
      setPromotionRuns(Object.fromEntries(entries.filter(([, record]) => Boolean(record))) as Partial<Record<KelasFormal, KenaikanKelasFormalRecord>>);
    } catch (error) {
      console.error('Failed to load formal promotion runs:', error);
      setPromotionRuns({});
      showToast('error', 'Gagal memeriksa status kenaikan kelas formal.');
    } finally {
      setIsLoadingPromotionRuns(false);
    }
  };

  useEffect(() => {
    void loadPromotionRuns();
  }, [appConfig.tahunPelajaranAktif, appConfig.semesterAkademikAktif]);

  const getPromotionCandidates = (kelas: KelasFormal) =>
    santriList.filter(santri =>
      santri.satuanPendidikan === 'MTs' &&
      santri.kelasFormal === kelas &&
      (santri.statusAkademikFormal || 'Aktif') === 'Aktif'
    );

  const handleProcessPromotion = async () => {
    if (!promotionPreviewClass) return;
    setIsProcessingPromotion(true);
    try {
      const result = await storageService.promoteFormalCohort(
        promotionPreviewClass,
        currentUser.nama || 'Ustadz / Admin'
      );
      await loadPromotionRuns();
      setPromotionPreviewClass(null);
      onDataChanged();
      showToast(
        'success',
        result.kelasTujuan === 'Lulus'
          ? `${result.jumlahSantri} santri kelas IX berhasil diluluskan.`
          : `${result.jumlahSantri} santri kelas ${result.kelasAsal} berhasil naik ke kelas ${result.kelasTujuan}.`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memproses kenaikan kelas formal.');
    } finally {
      setIsProcessingPromotion(false);
    }
  };

  const handleSaveCurrentAcademicSnapshot = async () => {
    if (!historySantri) return;
    const currentSantri = santriList.find(s => s.idSantri === historySantri.idSantri) || historySantri;
    if (!currentSantri.satuanPendidikan || !currentSantri.kelasFormal) {
      showToast('error', 'Lengkapi Satuan Pendidikan dan Kelas Formal terlebih dahulu.');
      return;
    }

    setIsSavingAcademicSnapshot(true);
    try {
      await storageService.upsertAcademicHistory(currentSantri, currentUser.nama || 'Ustadz / Admin');
      const records = await storageService.fetchAcademicHistory(currentSantri.idSantri);
      setAcademicHistoryRecords(records);
      setHistorySantri(currentSantri);
      showToast('success', `Snapshot ${currentSantri.kelasFormal} untuk ${academicYear} · ${academicSemester} tersimpan.`);
    } catch {
      showToast('error', 'Gagal menyimpan snapshot riwayat akademik.');
    } finally {
      setIsSavingAcademicSnapshot(false);
    }
  };

  const requireAccountManager = () => {
    if (canManageAccounts) return true;
    showToast('error', 'Hanya Superadmin yang dapat mengubah pengaturan akun.');
    return false;
  };

  const handleOpenEditUser = (u: User) => {
    if (!requireAccountManager()) return;
    setUserToEdit(u);
    setEditNama(u.nama);
    setEditUsername(u.username);
    setEditPassword(u.password || '123');
    setEditRole(u.role);
    setEditIdSantri(u.idSantri || '');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAccountManager()) return;
    if (!userToEdit || !editNama.trim()) return;

    const isSuper = userToEdit.role === 'Superadmin';
    if (!isSuper && (!editUsername.trim() || !editPassword.trim())) return;

    const cleanUsername = isSuper ? userToEdit.username : editUsername.trim().toLowerCase();
    const cleanNama = editNama.trim();
    const cleanPassword = isSuper ? userToEdit.password : editPassword.trim();

    // Check if new username conflicts with another existing user
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
    setEditSantriSatuanPendidikan(s.satuanPendidikan || '');
    setEditSantriKelasFormal(s.kelasFormal || '');
    setEditSantriTarget(s.targetHafalan);
    setEditSantriWaliNama(s.waliNama || '');
    setEditSantriWaliKontak(s.waliKontak || '');
  };

  const handleSaveEditSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriToEdit || !editSantriNama.trim()) return;

    const updatedSantri: Santri = {
      ...santriToEdit,
      namaSantri: editSantriNama.trim(),
      kelas: editSantriKelas,
      satuanPendidikan: editSantriSatuanPendidikan || undefined,
      kelasFormal: editSantriKelasFormal || undefined,
      targetHafalan: editSantriTarget.trim() || 'Juz 30 (37 Surah)',
      waliNama: editSantriWaliNama.trim() || '',
      waliKontak: editSantriWaliKontak.trim() || ''
    };

    setIsSaving(true);
    try {
      await storageService.updateSantri(santriToEdit.idSantri, updatedSantri);

      try {
        await storageService.upsertAcademicHistory(updatedSantri, currentUser.nama || 'Ustadz / Admin');
      } catch {
        showToast('error', 'Data santri tersimpan, tetapi snapshot riwayat akademik gagal disimpan.');
      }

      setSantriToEdit(null);
      onDataChanged();
      showToast('success', `Data santri ${updatedSantri.namaSantri} (${updatedSantri.idSantri}) berhasil diperbarui.`);
    } catch (err) {
      showToast('error', 'Gagal memperbarui data santri.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    const generatedId = newId.trim() || `STR${(santriList.length + 1).toString().padStart(3, '0')}`;
    const normalizedGeneratedId = generatedId.trim().toLowerCase();
    const existingSantri = santriList.find(
      santri => santri.idSantri.trim().toLowerCase() === normalizedGeneratedId
    );
    if (existingSantri) {
      showToast(
        'error',
        `ID/username "${generatedId}" sudah digunakan oleh santri ${existingSantri.namaSantri}. Gunakan ID lain.`
      );
      return;
    }

    const existingSantriAccount = usersList.find(
      user => user.username.trim().toLowerCase() === normalizedGeneratedId
    );
    if (existingSantriAccount) {
      showToast(
        'error',
        `Username "${generatedId}" sudah digunakan oleh akun ${existingSantriAccount.nama}. Penambahan santri dibatalkan.`
      );
      return;
    }

    const waliUsername = `wali_${normalizedGeneratedId}`;
    const existingWaliAccount = usersList.find(
      user => user.username.trim().toLowerCase() === waliUsername
    );
    if (existingWaliAccount) {
      showToast(
        'error',
        `Username wali "${waliUsername}" sudah digunakan oleh akun ${existingWaliAccount.nama}. Gunakan ID santri lain.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const newSantri: Santri = {
        idSantri: generatedId,
        namaSantri: newNama.trim(),
        kelas: newKelas,
        satuanPendidikan: newSatuanPendidikan,
        kelasFormal: newKelasFormal || undefined,
        targetHafalan: newTarget.trim() || 'Juz 30 (37 Surah)',
        totalHafalanSelesai: 0,
        waliNama: newWaliNama.trim() || '',
        waliKontak: newWaliKontak.trim() || ''
      };

      await storageService.addSantri(newSantri, defaultPassword.trim() || '123');

      try {
        await storageService.upsertAcademicHistory(newSantri, currentUser.nama || 'Ustadz / Admin');
      } catch {
        showToast('error', 'Santri berhasil ditambahkan, tetapi snapshot riwayat akademik awal gagal disimpan.');
      }

      setShowAddModal(false);
      setNewNama('');
      setNewId('');
      setNewSatuanPendidikan('MTs');
      setNewKelasFormal('');
      setNewWaliNama('');
      setNewWaliKontak('');
      onDataChanged();
      showToast('success', `Santri ${newNama.trim()} (${generatedId}) berhasil ditambahkan dan disimpan permanen.`);
    } catch (err) {
      showToast('error', 'Gagal menambahkan data santri.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAccountManager()) return;
    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanNama = newUserNama.trim();
    const cleanPassword = newUserPassword.trim();

    if (!cleanUsername || !cleanNama || !cleanPassword) return;

    // Check if username already exists
    const existingUser = usersList.find(u => u.username.trim().toLowerCase() === cleanUsername);
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
    if (!requireAccountManager()) return;
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

  const statsBySantri = useMemo(
    () => buildStatsBySantri(ziyadahRecords, murojaahRecords),
    [ziyadahRecords, murojaahRecords]
  );

  const getSantriStats = (idSantri: string) => resolveSantriStats(statsBySantri, idSantri);

  const satuanPendidikanOptions = SATUAN_PENDIDIKAN_FORMAL_OPTIONS;
  const kelasFormalOptions = KELAS_FORMAL_OPTIONS;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredSantri = useMemo(
    () => filterSantriList(
      santriList,
      normalizedSearchQuery,
      satuanPendidikanFilter,
      kelasFormalFilter
    ),
    [santriList, normalizedSearchQuery, satuanPendidikanFilter, kelasFormalFilter]
  );

  const filteredUsers = useMemo(
    () => filterUsersList(usersList, normalizedSearchQuery),
    [usersList, normalizedSearchQuery]
  );

  const handleCopyWaliCredentials = async (santri: Santri) => {
    const text = buildWaliCredentialText(santri, usersList);
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `Kredensial login Wali untuk ${santri.namaSantri} berhasil disalin! Siap dibagikan ke WhatsApp.`);
    } catch (err) {
      showToast('error', 'Gagal menyalin ke clipboard.');
    }
  };

  const handleCopyUserCredentials = async (u: User) => {
    if (u.role === 'Superadmin') {
      showToast('error', 'Kredensial akun Superadmin bersifat rahasia dan tidak dapat disalin.');
      return;
    }

    try {
      await navigator.clipboard.writeText(buildUserCredentialText(u));
      showToast('success', `Kredensial akun ${u.nama} (${u.username}) berhasil disalin! Siap dibagikan.`);
    } catch {
      showToast('error', 'Gagal menyalin ke clipboard.');
    }
  };

  const handleShareUserCredentials = (u: User) => {
    if (u.role === 'Superadmin') {
      showToast('error', 'Kredensial akun Superadmin bersifat rahasia dan tidak dapat dibagikan.');
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(buildUserCredentialText(u))}`, '_blank');
  };

  return (
    <div className="p3-management-page p3-santri-management space-y-6">

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h3 className="ui-page-title text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            Santri & Akun
          </h3>
          <p className="text-xs text-slate-500">
            Kelola data santri serta salin dan bagikan kredensial. Pengaturan akun hanya untuk Superadmin.
          </p>
        </div>

        {/* Sub Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('santri')}
            aria-pressed={activeSubTab === 'santri'}
            className={`ui-control px-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'santri'
                ? 'bg-white text-emerald-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Santri ({santriList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            aria-pressed={activeSubTab === 'users'}
            className={`ui-control px-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'users'
                ? 'bg-white text-emerald-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Akun Pengguna ({usersList.length})</span>
          </button>
        </div>
      </div>

      {/* Controls: Search, formal filters & Add Button */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md sm:flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="search-santri-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSubTab === 'santri' ? "Cari nama, ID, Kelas Al-Qur'an, atau jenjang formal..." : 'Cari user, nama, role, NIS...'}
              aria-label={activeSubTab === 'santri' ? 'Cari data santri' : 'Cari akun pengguna'}
              className="ui-control w-full pl-10 pr-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400"
            />
          </div>

          {activeSubTab === 'santri' ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowCollectiveReport(true)}
                className="ui-control w-full sm:w-auto px-4 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Rekap Kolektif</span>
              </button>
              <button
                id="btn-tambah-santri"
                onClick={() => setShowAddModal(true)}
                className="ui-control w-full sm:w-auto px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Santri Baru</span>
              </button>
            </div>
          ) : canManageAccounts ? (
            <button
              id="btn-tambah-user"
              onClick={() => setShowAddUserModal(true)}
              className="ui-control w-full sm:w-auto px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Akun Baru</span>
            </button>
          ) : null}
        </div>

        {activeSubTab === 'santri' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="sr-only" htmlFor="filter-satuan-pendidikan">Filter satuan pendidikan</label>
            <select
              id="filter-satuan-pendidikan"
              value={satuanPendidikanFilter}
              onChange={(e) => setSatuanPendidikanFilter(e.target.value as SatuanPendidikanFormal | '')}
              className="ui-control w-full px-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="">Semua satuan pendidikan</option>
              {satuanPendidikanOptions.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-kelas-formal">Filter kelas formal</label>
            <select
              id="filter-kelas-formal"
              value={kelasFormalFilter}
              onChange={(e) => setKelasFormalFilter(e.target.value as KelasFormal | '')}
              className="ui-control w-full px-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="">Semua kelas formal</option>
              {kelasFormalOptions.map(value => (
                <option key={value} value={value}>Kelas {value}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeSubTab === 'santri' && (
        <section id="academic-period-card" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-emerald-700" />
                Periode Akademik Aktif
              </h4>
              <p className="mt-1 text-xs text-emerald-900/70">
                Periode ini menjadi identitas snapshot riwayat formal. Mengubah periode tidak otomatis menaikkan kelas santri.
              </p>
            </div>
            <span className="inline-flex self-start rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-800">
              {academicYear} · {academicSemester}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
            <div>
              <label htmlFor="academic-year-select" className="block text-xs font-bold text-slate-700 mb-1">Tahun Pelajaran</label>
              <select
                id="academic-year-select"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="ui-control w-full px-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-slate-800"
              >
                {academicYearOptions.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="academic-semester-select" className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
              <select
                id="academic-semester-select"
                value={academicSemester}
                onChange={(e) => setAcademicSemester(e.target.value as SemesterAkademik)}
                className="ui-control w-full px-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-slate-800"
              >
                {SEMESTER_AKADEMIK_OPTIONS.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSaveAcademicPeriod}
              disabled={isSavingAcademicPeriod}
              className="ui-control self-end w-full sm:w-auto px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingAcademicPeriod ? 'Menyimpan...' : 'Simpan Periode'}
            </button>
          </div>
        </section>
      )}

      {activeSubTab === 'santri' && (
        <section id="formal-promotion-card" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-indigo-700" />
                Kenaikan Kelas Formal
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Proses per angkatan dengan preview. Kelas IX diproses sebagai kelulusan dan tetap tersimpan sebagai alumni.
              </p>
            </div>
            <span className={`inline-flex self-start rounded-lg border px-2.5 py-1 text-xs font-bold ${
              savedAcademicSemester === 'Genap'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              {savedAcademicYear} · {savedAcademicSemester}
            </span>
          </div>

          {savedAcademicSemester !== 'Genap' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Mode audit aktif. Preview kandidat tetap dapat dibuka, tetapi eksekusi kenaikan/kelulusan dikunci sampai periode aktif disimpan sebagai Semester Genap.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['VII', 'VIII', 'IX'] as KelasFormal[]).map(kelas => {
              const candidates = getPromotionCandidates(kelas);
              const processed = promotionRuns[kelas];
              const destination = kelas === 'VII' ? 'VIII' : kelas === 'VIII' ? 'IX' : 'Lulus';
              const isGraduation = kelas === 'IX';
              const previewDisabled = Boolean(processed) || candidates.length === 0 || isLoadingPromotionRuns;

              return (
                <article key={kelas} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">MTs · Kelas {kelas}</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{candidates.length} santri aktif</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isGraduation ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isGraduation ? <GraduationCap className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    {kelas} <span className="mx-1 text-slate-400">→</span> <span className="font-bold text-slate-800">{destination}</span>
                    {!isGraduation && <span className="text-slate-400"> · {nextAcademicYear}</span>}
                  </div>

                  {processed ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs text-emerald-800">
                      <span className="font-bold">Sudah diproses.</span> {processed.jumlahSantri} santri · {new Date(processed.processedAt).toLocaleDateString('id-ID')}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPromotionPreviewClass(kelas)}
                      disabled={previewDisabled}
                      className="ui-control w-full px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savedAcademicSemester !== 'Genap'
                        ? (isGraduation ? 'Preview Audit Kelulusan' : 'Preview Audit Kenaikan')
                        : (isGraduation ? 'Preview Kelulusan' : 'Preview Kenaikan')}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Tab 1: Santri Cards Grid */}
      {activeSubTab === 'santri' && (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h4 className="ui-section-title">Daftar santri</h4>
              <p className="ui-secondary mt-0.5">{filteredSantri.length} dari {santriList.length} santri ditampilkan.</p>
            </div>
          </div>
          {santriList.length === 0 ? (
            <div className="text-center py-14 px-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-600 space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-8 h-8 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">Belum ada santri</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Database santri bersih & tersinkronisasi ke Cloud Firestore. Tambahkan santri baru untuk mulai mencatat setoran Ziyadah & Muroja'ah.
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 text-left flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSantri.map((santri) => {
                const stats = getSantriStats(santri.idSantri);
                return (
                  <div
                    key={santri.idSantri}
                    id={`santri-card-${santri.idSantri}`}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between space-y-4 group relative"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono">
                          {santri.idSantri}
                        </span>
                        {santri.kelas && santri.kelas !== '-' ? (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                            Al-Qur'an · {santri.kelas}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
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

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-2">
                        <span><span className="font-semibold text-slate-700">Jenjang formal:</span> {getFormalLabel(santri)}</span>
                        {(santri.statusAkademikFormal || 'Aktif') === 'Lulus' && (
                          <span className="flex-shrink-0 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                            Lulus{santri.tahunLulus ? ` · ${santri.tahunLulus}` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Target className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>Target: <b>{santri.targetHafalan}</b></span>
                      </div>

                      {/* Aktivitas setoran dalam cache operasional 12 bulan */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                          {stats.totalZiyadah} Ziyadah · 12 bln
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800">
                          {stats.totalMurojaah} Muroja'ah · 12 bln
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col gap-3">
                      <div className="text-xs space-y-1">
                        <div>Wali: <code className="bg-slate-200/80 px-1 rounded font-mono text-slate-700">wali_{santri.idSantri.toLowerCase()}</code></div>
                        <div>Santri: <code className="bg-slate-200/80 px-1 rounded font-mono text-slate-700">{santri.idSantri}</code></div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Salin Kredensial Wali */}
                        <button
                          onClick={() => handleCopyWaliCredentials(santri)}
                          title={`Salin info login akun wali ananda ${santri.namaSantri}`}
                          className="min-h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Salin Akun Wali</span>
                        </button>

                        {/* WhatsApp Share Button if contact is available */}
                        {santri.waliKontak && (
                          <a
                            href={buildWaliWhatsAppUrl(santri, usersList)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Kirim kredensial via WhatsApp ke ${santri.waliNama || 'Wali'}`}
                            className="min-h-9 min-w-9 p-2 text-teal-700 hover:bg-teal-100 bg-teal-50 border border-teal-200 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setReportSantri(santri)}
                          title={`Buka rekap akademik dan PDF ${santri.namaSantri}`}
                          className="min-h-9 px-3 text-emerald-800 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Rekap & PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void loadAcademicHistory(santri)}
                          title={`Lihat riwayat formal ${santri.namaSantri}`}
                          className="min-h-9 px-3 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Riwayat Formal</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditSantri(santri)}
                          title={`Edit data santri ${santri.namaSantri}`}
                          className="min-h-9 px-3 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <SquarePen className="w-3.5 h-3.5 text-slate-700" />
                          <span>Edit</span>
                        </button>
                        <button
                          id={`btn-delete-santri-${santri.idSantri}`}
                          onClick={() => {
                            setSantriToDelete(santri);
                            setDeleteWithHistory(true);
                          }}
                          title={`Hapus santri ${santri.namaSantri}`}
                          className="min-h-9 px-3 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Hapus</span>
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
          <div className="flex items-end justify-between gap-3">
            <div>
              <h4 className="ui-section-title">Daftar akun pengguna</h4>
              <p className="ui-secondary mt-0.5">{filteredUsers.length} dari {usersList.length} akun ditampilkan.</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                {canManageAccounts
                  ? 'Superadmin dapat membuat, mengedit, dan menghapus akun. Kredensial akun selain Superadmin dapat disalin atau dibagikan.'
                  : 'Ustadz dapat menyalin dan membagikan kredensial akun selain Superadmin. Perubahan pengaturan akun hanya dapat dilakukan oleh Superadmin.'}
              </span>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Tidak ada akun yang sesuai pencarian.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSuperadmin = u.role === 'Superadmin';
                const roleTone = u.role === 'Superadmin'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : u.role === 'Pimpinan'
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                  : u.role === 'Ustadz'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : u.role === 'Wali'
                  ? 'border-teal-200 bg-teal-50 text-teal-800'
                  : 'border-cyan-200 bg-cyan-50 text-cyan-800';

                return (
                  <article key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h5 className="text-sm font-bold text-slate-900 truncate">{u.nama}</h5>
                        <p className="mt-1 text-xs text-slate-500">{u.idSantri ? `Terkait santri ${u.idSantri}` : 'Tidak terkait ID santri'}</p>
                      </div>
                      <span className={`flex-shrink-0 rounded-lg border px-2 py-1 text-xs font-semibold ${roleTone}`}>
                        {u.role}
                      </span>
                    </div>

                    <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
                      <dt className="text-slate-500">Username</dt>
                      <dd className="font-mono text-slate-700 break-all">{isSuperadmin ? 'Dirahasiakan' : u.username}</dd>
                      <dt className="text-slate-500">Password</dt>
                      <dd className="font-mono text-slate-700 break-all">{isSuperadmin ? 'Dirahasiakan' : u.password}</dd>
                    </dl>

                    {isSuperadmin ? (
                      <div className="min-h-11 rounded-lg border border-amber-200 bg-amber-50 px-3 flex items-center gap-2 text-xs font-semibold text-amber-900">
                        <Shield className="w-4 h-4" />
                        Akun terproteksi
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => handleCopyUserCredentials(u)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                          <Copy className="w-3.5 h-3.5" /> Salin
                        </button>
                        <button type="button" onClick={() => handleShareUserCredentials(u)} className="min-h-11 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5" /> Bagikan
                        </button>
                        {canManageAccounts && (
                          <>
                            <button type="button" onClick={() => handleOpenEditUser(u)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                              <SquarePen className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button type="button" onClick={() => setUserToDelete(u)} className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-2xl bg-white">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Daftar akun pengguna dan hak akses</caption>
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-3.5">Nama Pengguna</th>
                  <th scope="col" className="py-3 px-3.5">Username Login</th>
                  <th scope="col" className="py-3 px-3.5">Password</th>
                  <th scope="col" className="py-3 px-3.5">Role Hak Akses</th>
                  <th scope="col" className="py-3 px-3.5">Kaitan ID Santri</th>
                  <th scope="col" className="py-3 px-3.5 text-center">Aksi Akun</th>
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
                    if (u.role === 'Superadmin') {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300 shadow-xs">
                          <Crown className="w-3 h-3 text-amber-600" /> Superadmin
                        </span>
                      );
                    } else if (u.role === 'Pimpinan') {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 font-extrabold text-xs border border-indigo-300 shadow-xs">
                          <Shield className="w-3 h-3 text-indigo-700" /> Pimpinan (View-Only)
                        </span>
                      );
                    } else if (u.role === 'Ustadz') {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300">
                          <Shield className="w-3 h-3 text-emerald-700" /> Ustadz
                        </span>
                      );
                    } else if (u.role === 'Wali') {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs border border-teal-300">
                          <Users className="w-3 h-3 text-teal-700" /> Wali Santri
                        </span>
                      );
                    } else {
                      roleBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-100 text-cyan-800 font-bold text-xs border border-cyan-300">
                          <UserCheck className="w-3 h-3 text-cyan-700" /> Santri (View-Only)
                        </span>
                      );
                    }

                    const isSuperadmin = u.role === 'Superadmin';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-slate-800">
                          {u.nama}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-700">
                          {isSuperadmin ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-sans italic text-xs">
                              <Lock className="w-3 h-3 text-amber-500" /> Dirahasiakan
                            </span>
                          ) : (
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {u.username}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">
                          {isSuperadmin ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-sans italic text-xs">
                              <Lock className="w-3 h-3 text-amber-500" /> Dirahasiakan
                            </span>
                          ) : (
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {u.password}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">{roleBadge}</td>
                        <td className="py-3 px-3.5 font-mono text-slate-500">
                          {u.idSantri || '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {isSuperadmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 shadow-2xs">
                              <Shield className="w-3.5 h-3.5 text-amber-600" /> Akun Terproteksi
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyUserCredentials(u)}
                                className="p-1.5 text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold border border-slate-200"
                                title="Salin username & password akun"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Salin</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareUserCredentials(u)}
                                className="p-1.5 px-2 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold border border-emerald-200"
                                title="Bagikan Kredensial via WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span className="hidden sm:inline">Bagikan</span>
                              </button>
                              {canManageAccounts && <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 px-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold border border-emerald-200"
                                title="Setting Role & Edit Akun"
                              >
                                <SquarePen className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Edit</span>
                              </button>}
                              {canManageAccounts && <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                aria-label={`Hapus akun ${u.nama}`}
                                className="min-h-11 min-w-11 inline-flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>}
                            </div>
                          )}
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

      {reportSantri && (
        <Suspense fallback={null}>
          <AcademicReportModal
            santri={reportSantri}
            currentUser={currentUser}
            onClose={() => setReportSantri(null)}
            onNotify={onNotify}
          />
        </Suspense>
      )}

      {showCollectiveReport && (
        <Suspense fallback={null}>
          <CollectiveAcademicReportModal
            santriList={santriList}
            currentUser={currentUser}
            onClose={() => setShowCollectiveReport(false)}
            onNotify={onNotify}
          />
        </Suspense>
      )}

      {/* Modal Preview Kenaikan / Kelulusan Formal */}
      {promotionPreviewClass && (() => {
        const candidates = getPromotionCandidates(promotionPreviewClass);
        const destination = promotionPreviewClass === 'VII' ? 'VIII' : promotionPreviewClass === 'VIII' ? 'IX' : 'Lulus';
        const isGraduation = promotionPreviewClass === 'IX';

        return (
          <div
            ref={promotionPreviewDialogRef}
            className="ui-dialog-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={isGraduation ? 'Preview kelulusan kelas IX' : `Preview kenaikan kelas ${promotionPreviewClass}`}
            tabIndex={-1}
          >
            <div className="ui-dialog-panel max-w-lg p-5 sm:p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    {isGraduation
                      ? <GraduationCap className="w-5 h-5 text-indigo-700" />
                      : <ArrowUpCircle className="w-5 h-5 text-emerald-700" />}
                    {isGraduation ? 'Preview Kelulusan Kelas IX' : `Preview Kenaikan ${promotionPreviewClass} → ${destination}`}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Tahun Pelajaran {savedAcademicYear} · Semester {savedAcademicSemester}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPromotionPreviewClass(null)}
                  disabled={isProcessingPromotion}
                  aria-label="Tutup preview kenaikan kelas"
                  className="ui-dialog-close cursor-pointer text-lg disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              {savedAcademicSemester !== 'Genap' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-bold">Mode audit.</span> Daftar kandidat dapat diperiksa sekarang, tetapi tombol eksekusi tetap terkunci sampai periode aktif disimpan sebagai Semester Genap.
                  </span>
                </div>
              )}

              <div className={`rounded-xl border px-3 py-3 text-xs ${
                isGraduation
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}>
                <p className="font-bold">
                  {isGraduation
                    ? `${candidates.length} santri akan diubah menjadi status Lulus/Alumni.`
                    : `${candidates.length} santri akan naik dari kelas ${promotionPreviewClass} ke kelas ${destination}.`}
                </p>
                <p className="mt-1 leading-relaxed opacity-80">
                  Riwayat Semester Genap {savedAcademicYear} akan disimpan terlebih dahulu.
                  {!isGraduation && ` Sistem juga menyiapkan snapshot kelas ${destination} untuk Semester Ganjil ${nextAcademicYear}.`}
                  {isGraduation && ' Data setoran dan Kelas Al-Qur’an tidak dihapus.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700">Santri yang akan diproses</span>
                  <span className="text-xs font-semibold text-slate-500">{candidates.length} santri</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {candidates.map((santri, index) => (
                    <div key={santri.idSantri} className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{index + 1}. {santri.namaSantri}</p>
                        <p className="mt-0.5 text-slate-500 font-mono">{santri.idSantri}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-600">
                        {santri.kelas || 'Kelas Al-Qur’an —'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Proses ini dicatat untuk {savedAcademicYear} dan tidak dapat dijalankan ulang pada angkatan kelas {promotionPreviewClass} yang sama.
                </span>
              </div>

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setPromotionPreviewClass(null)}
                  disabled={isProcessingPromotion}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessPromotion}
                  disabled={isProcessingPromotion || candidates.length === 0 || savedAcademicSemester !== 'Genap'}
                  className={`ui-control w-full sm:w-auto px-5 rounded-lg text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isGraduation ? 'bg-indigo-700 hover:bg-indigo-600' : 'bg-emerald-800 hover:bg-emerald-700'
                  }`}
                >
                  {isProcessingPromotion ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isGraduation ? (
                    <GraduationCap className="w-4 h-4" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4" />
                  )}
                  {isProcessingPromotion
                    ? 'Memproses...'
                    : isGraduation
                    ? `Luluskan ${candidates.length} Santri`
                    : `Naikkan ${candidates.length} Santri ke ${destination}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Riwayat Akademik Formal */}
      {historySantri && (
        <div
          ref={academicHistoryDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Riwayat akademik ${historySantri.namaSantri}`}
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-lg p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-700" />
                  Riwayat Akademik Formal
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  {historySantri.namaSantri} · {historySantri.idSantri}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistorySantri(null)}
                aria-label="Tutup riwayat akademik"
                className="ui-dialog-close cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
              Periode aktif: <span className="font-bold">{academicYear} · Semester {academicSemester}</span>
            </div>

            <button
              type="button"
              onClick={handleSaveCurrentAcademicSnapshot}
              disabled={isSavingAcademicSnapshot || !historySantri.satuanPendidikan || !historySantri.kelasFormal}
              className="ui-control w-full px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSavingAcademicSnapshot ? 'animate-spin' : ''}`} />
              {isSavingAcademicSnapshot ? 'Menyimpan Snapshot...' : 'Simpan Snapshot Periode Aktif'}
            </button>

            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {isLoadingAcademicHistory ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  Memuat riwayat akademik...
                </div>
              ) : academicHistoryRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <History className="w-7 h-7 mx-auto text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">Belum ada riwayat akademik</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Simpan snapshot periode aktif atau edit data formal santri untuk membuat catatan pertama.
                  </p>
                </div>
              ) : (
                academicHistoryRecords.map(record => (
                  <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {record.satuanPendidikan} · Kelas {record.kelasFormal}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-indigo-700">
                          {record.tahunPelajaran} · Semester {record.semester}
                        </p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        {record.kelasAlQuran ? `Al-Qur'an · ${record.kelasAlQuran}` : 'Kelas Al-Qur’an —'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>Dicatat oleh {record.recordedBy || 'Sistem'}</span>
                      <span>
                        {new Date(record.recordedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="ui-dialog-footer">
              <button
                type="button"
                onClick={() => setHistorySantri(null)}
                className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Data Santri */}
      {santriToEdit && (
        <div
          ref={editSantriDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit data santri"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <SquarePen className="w-5 h-5 text-emerald-700" />
                Edit Data Santri ({santriToEdit.idSantri})
              </h4>
              <button
                onClick={() => setSantriToEdit(null)}
                aria-label="Tutup dialog edit santri"
                className="ui-dialog-close cursor-pointer text-lg"
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
                    Kelas Al-Qur'an
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan Pendidikan
                  </label>
                  <select
                    value={editSantriSatuanPendidikan}
                    onChange={(e) => setEditSantriSatuanPendidikan(e.target.value as SatuanPendidikanFormal | '')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="">Belum ditetapkan</option>
                    {SATUAN_PENDIDIKAN_FORMAL_OPTIONS.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas Formal
                  </label>
                  <select
                    value={editSantriKelasFormal}
                    onChange={(e) => setEditSantriKelasFormal(e.target.value as KelasFormal | '')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="">Belum ditetapkan</option>
                    {KELAS_FORMAL_OPTIONS.map(value => (
                      <option key={value} value={value}>Kelas {value}</option>
                    ))}
                  </select>
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

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setSantriToEdit(null)}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ui-control w-full sm:w-auto px-5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
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
      {canManageAccounts && userToEdit && (
        <div
          ref={editUserDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit akun pengguna"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <SquarePen className="w-5 h-5 text-emerald-700" />
                Setting Role & Edit Akun Pengguna
              </h4>
              <button
                onClick={() => setUserToEdit(null)}
                aria-label="Tutup dialog edit akun"
                className="ui-dialog-close cursor-pointer text-lg"
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

              {userToEdit.role === 'Superadmin' ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                  <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Username Login dan Password Superadmin dirahasiakan demi keamanan sistem.</span>
                </div>
              ) : (
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
              )}

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
                  <option value="Superadmin">Superadmin (Akses Penuh Seluruh Sistem & Manajemen)</option>
                  <option value="Pimpinan">Pimpinan (View-Only: Dashboard, Riwayat & Mushaf)</option>
                  <option value="Ustadz">Ustadz (Input Setoran, Kelola Santri & Bagikan Kredensial)</option>
                  <option value="Wali">Wali Santri (Monitoring Mutaba'ah & Progres Ananda)</option>
                  <option value="Santri">Santri (View-Only: Lihat Progres Pribadi & Mushaf)</option>
                </select>
              </div>

              {/* Kaitan ID Santri jika Wali atau Santri */}
              {(editRole === 'Wali' || editRole === 'Santri') && (
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
                  <p className="text-xs text-slate-500 mt-1">
                    Akun ini akan menampilkan data mutaba'ah santri dengan ID yang dipilih saat login dari rumah.
                  </p>
                </div>
              )}

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ui-control w-full sm:w-auto px-5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
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
        <div
          ref={deleteSantriDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi hapus santri"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
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
                <span className="text-slate-500">Kelas Al-Qur'an:</span>
                <span className="font-medium text-slate-700">{getClassGroup(santriToDelete.kelas)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Jenjang Formal:</span>
                <span className="font-medium text-slate-700 text-right">{getFormalLabel(santriToDelete)}</span>
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

            <div className="ui-dialog-footer">
              <button
                type="button"
                onClick={() => setSantriToDelete(null)}
                disabled={isDeleting}
                className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-santri"
                onClick={handleDeleteSantri}
                disabled={isDeleting}
                className="ui-control w-full sm:w-auto px-5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Santri'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus User */}
      {canManageAccounts && userToDelete && (
        <div
          ref={deleteUserDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi hapus akun pengguna"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
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

            <div className="ui-dialog-footer">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors disabled:opacity-50"
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
        <div
          ref={addSantriDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah data santri"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                Tambah Data Santri Baru
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup dialog tambah santri"
                className="ui-dialog-close cursor-pointer text-lg"
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
                    Kelas Al-Qur'an
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan Pendidikan
                  </label>
                  <select
                    value={newSatuanPendidikan}
                    onChange={(e) => setNewSatuanPendidikan(e.target.value as SatuanPendidikanFormal)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    {SATUAN_PENDIDIKAN_FORMAL_OPTIONS.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelas Formal
                  </label>
                  <select
                    required
                    value={newKelasFormal}
                    onChange={(e) => setNewKelasFormal(e.target.value as KelasFormal | '')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Pilih Kelas Formal --</option>
                    {KELAS_FORMAL_OPTIONS.map(value => (
                      <option key={value} value={value}>Kelas {value}</option>
                    ))}
                  </select>
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

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-snug">
                Sistem otomatis membuatkan akun login <b>Wali</b> (<code className="font-mono bg-white px-1 rounded">wali_idsantri</code>) dan akun login <b>Santri</b> (<code className="font-mono bg-white px-1 rounded">idsantri</code>) untuk diakses di rumah.
              </div>

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ui-control w-full sm:w-auto px-5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Data Santri'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah User Akun Baru */}
      {canManageAccounts && showAddUserModal && (
        <div
          ref={addUserDialogRef}
          className="ui-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah akun pengguna"
          tabIndex={-1}
        >
          <div className="ui-dialog-panel max-w-md p-5 sm:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-700" />
                Tambah Akun Pengguna Baru
              </h4>
              <button
                onClick={() => setShowAddUserModal(false)}
                aria-label="Tutup dialog tambah akun"
                className="ui-dialog-close cursor-pointer text-lg"
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
                    <option value="Superadmin">Superadmin</option>
                    <option value="Pimpinan">Pimpinan</option>
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

              {(newUserRole === 'Wali' || newUserRole === 'Santri') && (
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

              <div className="ui-dialog-footer">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="ui-control w-full sm:w-auto px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="ui-control w-full sm:w-auto px-5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
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
