from pathlib import Path
import re

ROOT = Path('src')


def read(path):
    return (ROOT / path).read_text()


def write(path, text):
    (ROOT / path).write_text(text)


def rep(text, old, new, label, count=1):
    actual = text.count(old)
    if actual < count:
        raise SystemExit(f'{label}: expected at least {count}, got {actual}')
    return text.replace(old, new, count)


def sub(text, pattern, repl, label, count=1):
    out, n = re.subn(pattern, repl, text, count=count, flags=re.S)
    if n != count:
        raise SystemExit(f'{label}: expected {count}, got {n}')
    return out

# Snackbar: shared feedback contract, including neutral info.
p = 'components/Snackbar.tsx'
t = read(p)
t = rep(t, "import { CheckCircle2, AlertCircle, X } from 'lucide-react';", "import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';", 'snackbar icons')
t = rep(t, "export interface SnackbarState {\n  id: string;\n  message: string;\n  type: 'success' | 'error';", "export type SnackbarKind = 'success' | 'error' | 'info';\n\nexport interface SnackbarActionOptions {\n  actionLabel?: string;\n  onAction?: () => void;\n}\n\nexport type NotifyFn = (type: SnackbarKind, message: string, options?: SnackbarActionOptions) => void;\n\nexport interface SnackbarState {\n  id: string;\n  message: string;\n  type: SnackbarKind;", 'snackbar types')
t = rep(t, "          snack.type === 'success'\n            ? 'bg-emerald-800 text-white border-emerald-700'\n            : 'bg-rose-800 text-white border-rose-700'", "          snack.type === 'success'\n            ? 'bg-emerald-800 text-white border-emerald-700'\n            : snack.type === 'error'\n            ? 'bg-rose-800 text-white border-rose-700'\n            : 'bg-slate-800 text-white border-slate-700'", 'snackbar colors')
t = rep(t, "        {snack.type === 'success' ? (\n          <CheckCircle2 className=\"w-5 h-5 text-emerald-200 flex-shrink-0\" />\n        ) : (\n          <AlertCircle className=\"w-5 h-5 text-rose-200 flex-shrink-0\" />\n        )}", "        {snack.type === 'success' ? (\n          <CheckCircle2 className=\"w-5 h-5 text-emerald-200 flex-shrink-0\" />\n        ) : snack.type === 'error' ? (\n          <AlertCircle className=\"w-5 h-5 text-rose-200 flex-shrink-0\" />\n        ) : (\n          <Info className=\"w-5 h-5 text-slate-200 flex-shrink-0\" />\n        )}", 'snackbar icon condition')
write(p, t)

# App: one feedback entry point, correct sync truth, pass notify down.
p = 'App.tsx'
t = read(p)
t = rep(t, "import { Snackbar, SnackbarState } from './components/Snackbar';", "import { Snackbar, SnackbarState, NotifyFn } from './components/Snackbar';", 'app snackbar import')
t = rep(t, "  const [isSetorMenuOpen, setIsSetorMenuOpen] = useState(false);\n", "  const [isSetorMenuOpen, setIsSetorMenuOpen] = useState(false);\n\n  const notify: NotifyFn = (type, message, options = {}) => {\n    setSnack({\n      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,\n      type,\n      message,\n      ...options\n    });\n  };\n", 'app notify helper')
t = rep(t, "      await storageService.syncWithCloud();\n      refreshData();", "      const result = await storageService.syncWithCloud();\n      if (!result.success) {\n        throw new Error(result.message || 'Cloud tidak dapat dijangkau.');\n      }\n      refreshData();", 'app sync truth')
t = rep(t, "message: '✓ Data berhasil disinkronkan dengan Cloud Database',", "message: 'Data berhasil disinkronkan dengan Cloud Firestore.',", 'app sync success text')
t = rep(t, "message: 'Gagal memperbarui data dari Cloud. Memuat cache lokal.',", "message: 'Gagal memperbarui data dari Cloud. Data lokal hanya digunakan sebagai cache.',", 'app sync error text')
t = rep(t, "          <LoginView\n            onLoginSuccess={handleLoginSuccess}\n          />", "          <LoginView\n            onLoginSuccess={handleLoginSuccess}\n            onNotify={notify}\n          />", 'app login notify')
for comp in ['ZiyadahForm', 'MurojaahForm', 'BinnadzorForm', 'PembelajaranForm']:
    anchor = "                onSuccess={() => {\n                  refreshData();\n                  setActiveTab('riwayat');\n                }}"
    replacement = anchor + "\n                onNotify={notify}"
    t = rep(t, anchor, replacement, f'app {comp} notify', 1)
# Above repeated anchors are consumed sequentially, matching 4 forms.
t = rep(t, "                santriList={santriList}\n              />\n            )}\n\n            {activeTab === 'mushaf'", "                santriList={santriList}\n                onNotify={notify}\n              />\n            )}\n\n            {activeTab === 'mushaf'", 'app history notify')
t = rep(t, "              <SantriManagement\n                santriList={santriList}\n                onDataChanged={refreshData}\n              />", "              <SantriManagement\n                santriList={santriList}\n                onDataChanged={refreshData}\n                onNotify={notify}\n              />", 'app santri notify')
t = rep(t, "                userList={userList}\n                onDataChanged={refreshData}\n              />", "                userList={userList}\n                onDataChanged={refreshData}\n                onNotify={notify}\n              />", 'app kelas notify')
t = rep(t, "                  setActiveTab={setActiveTab}\n                  isLoading={isLoadingData}\n                />", "                  setActiveTab={setActiveTab}\n                  isLoading={isLoadingData}\n                  onNotify={notify}\n                />", 'app wali notify')
t = rep(t, "          santriList={santriList}\n        />", "          santriList={santriList}\n          onNotify={notify}\n        />", 'app action sheet notify')
t = rep(t, "<span>Cloud Database Firestore Terhubung (Real-Time Multi-Device)</span>", "<span>Cloud Firestore • Sinkronisasi Real-Time Multi-Device</span>", 'app neutral footer')
write(p, t)

# Login: remove native alert, use shared info snackbar.
p = 'components/LoginModal.tsx'
t = read(p)
t = rep(t, "import { PesmadLogo } from './PesmadLogo';", "import { PesmadLogo } from './PesmadLogo';\nimport type { NotifyFn } from './Snackbar';", 'login notify import')
t = rep(t, "interface LoginViewProps {\n  onLoginSuccess: (user: User) => void;\n}", "interface LoginViewProps {\n  onLoginSuccess: (user: User) => void;\n  onNotify: NotifyFn;\n}", 'login props')
t = rep(t, "export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {", "export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNotify }) => {", 'login destructure')
t = sub(t, r"  const handleForgotPassword = \(\) => \{\n    setErrorMsg\(''\);\n    alert\(\n      'Lupa Password\?\\n\\nSilakan hubungi Ustadz/Admin Tahfidz untuk melakukan pengaturan ulang PIN atau kata sandi akun Anda\.'\n    \);\n  \};", "  const handleForgotPassword = () => {\n    setErrorMsg('');\n    onNotify('info', 'Lupa password? Hubungi Ustadz/Admin Tahfidz untuk pengaturan ulang PIN atau kata sandi.');\n  };", 'login forgot alert')
write(p, t)

# Four setoran forms: shared snackbar, no duplicate local feedback, success only after awaited Cloud write.
FORM_CONFIG = {
    'components/ZiyadahForm.tsx': ('ZiyadahFormProps', 'Ziyadah', "import { CirclePlus as PlusCircle, BookOpen, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, AlertCircle } from 'lucide-react';", "import { CirclePlus as PlusCircle, BookOpen, Save, RotateCcw, Calendar, Clock } from 'lucide-react';"),
    'components/MurojaahForm.tsx': ('MurojaahFormProps', "Muroja'ah", "import { RotateCw, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';", "import { RotateCw, Save, RotateCcw, Calendar, Clock, BookOpen } from 'lucide-react';"),
    'components/BinnadzorForm.tsx': ('BinnadzorFormProps', 'Binnadzor', "import { BookOpenCheck, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, Layers, Bookmark, Sparkles, Check, AlertCircle } from 'lucide-react';", "import { BookOpenCheck, Save, RotateCcw, Calendar, Clock, BookOpen, Layers, Bookmark, Sparkles, Check } from 'lucide-react';"),
    'components/PembelajaranForm.tsx': ('PembelajaranFormProps', 'Pembelajaran', None, None),
}
for path, (iface, label, old_icon_import, new_icon_import) in FORM_CONFIG.items():
    t = read(path)
    if old_icon_import:
        t = rep(t, old_icon_import, new_icon_import, f'{label} icons')
    # Pembelajaran may still use AlertCircle elsewhere; leave icon import untouched.
    import_anchor = "import { getTodayInputFormat, getCurrentTimeInputFormat, formatTanggalLengkap } from '../utils/dateFormatter';"
    t = rep(t, import_anchor, import_anchor + "\nimport type { NotifyFn } from './Snackbar';", f'{label} notify import')
    t = rep(t, "  onSuccess: () => void;\n}", "  onSuccess: () => void;\n  onNotify: NotifyFn;\n}", f'{label} prop type')
    t = rep(t, "  onSuccess\n}) => {", "  onSuccess,\n  onNotify\n}) => {", f'{label} destructure')
    t = re.sub(r"\n  const \[showSuccessToast, setShowSuccessToast\] = useState\(false\);\n  const \[formError, setFormError\] = useState<string \| null>\(null\);", "", t, count=1)
    t = rep(t, "    setFormError(null);\n    setShowSuccessToast(false);\n    setIsSubmitting(true);", "    setIsSubmitting(true);", f'{label} submit reset feedback')
    # success block differs only blank lines.
    t = sub(t, r"      setIsSubmitting\(false\);\n      setShowSuccessToast\(true\);\n\s*setTimeout\(\(\) => \{\n        setShowSuccessToast\(false\);\n        onSuccess\(\);\n      \}, 900\);", f"      setIsSubmitting(false);\n      onNotify('success', '{label} berhasil disimpan ke Cloud.');\n      onSuccess();", f'{label} success block')
    t = sub(t, r"      setFormError\((?:'|\").*?Cloud.*?(?:'|\")\);\n      setIsSubmitting\(false\);", f"      onNotify('error', '{label} belum tersimpan ke Cloud. Periksa koneksi lalu coba simpan lagi.');\n      setIsSubmitting(false);", f'{label} error block')
    t = t.replace("    setShowSuccessToast(false);\n    setFormError(null);\n", "")
    # Remove the two local feedback JSX blocks between header and next content.
    t = sub(t, r"\n        \{showSuccessToast && \(.*?\n        \)\}\n\n        \{formError && \(.*?\n        \)\}\n", "\n", f'{label} feedback jsx')
    write(path, t)

# History: route all mutation feedback to app snackbar; keep its existing custom confirmation dialogs.
p = 'components/HistoryTable.tsx'
t = read(p)
t = rep(t, "import { getClassGroup } from '../utils/classUtils';", "import { getClassGroup } from '../utils/classUtils';\nimport type { NotifyFn } from './Snackbar';", 'history notify import')
t = rep(t, "  santriList?: Santri[];\n}", "  santriList?: Santri[];\n  onNotify: NotifyFn;\n}", 'history prop type')
t = rep(t, "  currentUser, ziyadahRecords, murojaahRecords, binnadzorRecords, pembelajaranRecords, onDataChanged, isLoading = false, santriList = []\n}) => {", "  currentUser, ziyadahRecords, murojaahRecords, binnadzorRecords, pembelajaranRecords, onDataChanged, isLoading = false, santriList = [], onNotify\n}) => {", 'history destructure')
t = rep(t, "  const [deleteToast, setDeleteToast] = useState<string | null>(null);\n", "", 'history delete toast state')
t = rep(t, "      setDeleteToast(`Data histori ${itemToDelete.type} untuk ${itemToDelete.namaSantri} berhasil dihapus.`);", "      onNotify('success', `Data histori ${itemToDelete.type} untuk ${itemToDelete.namaSantri} berhasil dihapus dari Cloud.`);", 'history single success')
t = rep(t, "      setItemToDelete(null);\n      setTimeout(() => setDeleteToast(null), 4000);\n    } catch (err) {\n      console.error('Failed to delete record:', err);\n    }", "      setItemToDelete(null);\n    } catch (err) {\n      console.error('Failed to delete record:', err);\n      onNotify('error', 'Gagal menghapus histori dari Cloud. Data tidak dinyatakan terhapus.');\n    }", 'history single error')
t = rep(t, "      setDeleteToast(`${itemsToDel.length} data rekaman histori berhasil dihapus.`);", "      onNotify('success', `${itemsToDel.length} data rekaman histori berhasil dihapus dari Cloud.`);", 'history batch success')
t = rep(t, "      setIsBatchDeleteModalOpen(false);\n      setTimeout(() => setDeleteToast(null), 4000);\n    } catch (err) {\n      console.error('Failed to delete batch records:', err);\n    }", "      setIsBatchDeleteModalOpen(false);\n    } catch (err) {\n      console.error('Failed to delete batch records:', err);\n      onNotify('error', 'Gagal menghapus pilihan histori dari Cloud. Tidak ada success palsu.');\n    }", 'history batch error')
t = rep(t, "      onDataChanged();\n      closeEditModal();", "      onDataChanged();\n      onNotify('success', `Perubahan ${editingItem.type} berhasil disimpan ke Cloud.`);\n      closeEditModal();", 'history edit success')
t = rep(t, "      console.error('Gagal menyimpan perubahan:', err);\n      alert('Terjadi kendala saat menyimpan perubahan. Silakan coba lagi.');\n      setIsSavingEdit(false);", "      console.error('Gagal menyimpan perubahan:', err);\n      onNotify('error', 'Perubahan belum tersimpan ke Cloud. Silakan coba lagi.');\n      setIsSavingEdit(false);", 'history edit alert')
t = sub(t, r"\n      \{/\* Floating Success Toast \*/\}\n      \{deleteToast && \(.*?\n      \)\}\n", "\n", 'history floating toast')
write(p, t)

# Santri Management: local notifications become shared Snackbar.
p = 'components/SantriManagement.tsx'
t = read(p)
t = rep(t, "import { getClassGroup } from '../utils/classUtils';", "import { getClassGroup } from '../utils/classUtils';\nimport type { NotifyFn } from './Snackbar';", 'santri notify import')
t = rep(t, "  onDataChanged: () => void;\n}", "  onDataChanged: () => void;\n  onNotify: NotifyFn;\n}", 'santri prop type')
t = rep(t, "  santriList,\n  onDataChanged\n}) => {", "  santriList,\n  onDataChanged,\n  onNotify\n}) => {", 'santri destructure')
t = rep(t, "  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);\n", "", 'santri notification state')
t = sub(t, r"  const showToast = \(type: 'success' \| 'error', message: string\) => \{.*?\n  \};", "  const showToast = (type: 'success' | 'error', message: string) => onNotify(type, message);", 'santri showToast')
t = sub(t, r"\n      \{/\* Toast Notification \*/\}\n      \{notification && \(.*?\n      \)\}\n", "\n", 'santri toast jsx')
t = t.replace('berhasil dihapus.`);', 'berhasil dihapus dari Cloud.`);')
write(p, t)

# Kelas Management: local notifications become shared Snackbar.
p = 'components/KelasManagement.tsx'
t = read(p)
t = rep(t, "} from 'lucide-react';", "} from 'lucide-react';\nimport type { NotifyFn } from './Snackbar';", 'kelas notify import')
t = rep(t, "  onDataChanged: () => void;\n}", "  onDataChanged: () => void;\n  onNotify: NotifyFn;\n}", 'kelas prop type')
t = rep(t, "  userList,\n  onDataChanged\n}) => {", "  userList,\n  onDataChanged,\n  onNotify\n}) => {", 'kelas destructure')
t = rep(t, "  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);\n", "", 'kelas notification state')
t = sub(t, r"  const showToast = \(type: 'success' \| 'error', message: string\) => \{.*?\n  \};", "  const showToast = (type: 'success' | 'error', message: string) => onNotify(type, message);", 'kelas showToast')
t = sub(t, r"\n      \{notification && \(.*?\n      \)\}\n", "\n", 'kelas toast jsx')
t = t.replace('berhasil dibuat dengan ${newSantriIds.length} santri.`', 'berhasil dibuat di Cloud dengan ${newSantriIds.length} santri.`')
t = t.replace('berhasil diperbarui.`', 'berhasil diperbarui di Cloud.`')
t = t.replace('berhasil dihapus.`', 'berhasil dihapus dari Cloud.`')
write(p, t)

# Setor action sheet: Cloud toggle feedback no longer silent.
p = 'components/SetorActionSheet.tsx'
t = read(p)
t = rep(t, "import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';", "import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';\nimport type { NotifyFn } from './Snackbar';", 'sheet notify import')
t = rep(t, "  santriList?: Santri[];\n}", "  santriList?: Santri[];\n  onNotify: NotifyFn;\n}", 'sheet props')
t = rep(t, "  onSelect,\n  santriList = []\n}) => {", "  onSelect,\n  santriList = [],\n  onNotify\n}) => {", 'sheet destructure')
t = rep(t, "      await storageService.setProgramLiburanActive(nextState, 'Ustadz / Admin');\n      setIsProgramLiburanActive(nextState);", "      await storageService.setProgramLiburanActive(nextState, 'Ustadz / Admin');\n      setIsProgramLiburanActive(nextState);\n      onNotify('success', nextState ? 'Program Pantauan Liburan aktif dan tersimpan di Cloud.' : 'Program Pantauan Liburan dinonaktifkan dan tersimpan di Cloud.');", 'sheet toggle success')
t = rep(t, "    } catch (err) {\n      console.error('Failed to toggle program liburan:', err);\n    }", "    } catch (err) {\n      console.error('Failed to toggle program liburan:', err);\n      onNotify('error', 'Status Program Pantauan Liburan gagal diperbarui di Cloud.');\n    }", 'sheet toggle error')
write(p, t)

# WaliDashboard passes shared feedback to Pantauan Liburan.
p = 'components/WaliDashboard.tsx'
t = read(p)
t = rep(t, "import { storageService } from '../services/storageService';", "import { storageService } from '../services/storageService';\nimport type { NotifyFn } from './Snackbar';", 'wali notify import')
t = rep(t, "  isLoading?: boolean;\n}", "  isLoading?: boolean;\n  onNotify: NotifyFn;\n}", 'wali prop type')
t = rep(t, "  setActiveTab,\n  isLoading = false\n}) => {", "  setActiveTab,\n  isLoading = false,\n  onNotify\n}) => {", 'wali destructure')
t = rep(t, "          isActive={storageService.getAppConfig().programLiburanActive}\n        />", "          isActive={storageService.getAppConfig().programLiburanActive}\n          onNotify={onNotify}\n        />", 'wali pantauan notify')
write(p, t)

# Pantauan Liburan: shared Snackbar + app confirmation dialog, no native confirm.
p = 'components/PantauanLiburanWaliSection.tsx'
t = read(p)
t = rep(t, "import { formatTanggalIndo, getTodayInputFormat } from '../utils/dateFormatter';", "import { formatTanggalIndo, getTodayInputFormat } from '../utils/dateFormatter';\nimport type { NotifyFn } from './Snackbar';", 'pantauan notify import')
t = rep(t, "  onDataChanged?: () => void;\n}", "  onDataChanged?: () => void;\n  onNotify: NotifyFn;\n}", 'pantauan prop type')
t = rep(t, "  isActive,\n  onDataChanged\n}) => {", "  isActive,\n  onDataChanged,\n  onNotify\n}) => {", 'pantauan destructure')
t = rep(t, "  const [toastMessage, setToastMessage] = useState<string | null>(null);\n  const [toastType, setToastType] = useState<'success' | 'error'>('success');\n", "  const [recordToDelete, setRecordToDelete] = useState<PantauanLiburanRecord | null>(null);\n  const [isDeletingRecord, setIsDeletingRecord] = useState(false);\n", 'pantauan toast state')
t = sub(t, r"  const handleDeleteRecord = async \(id: string\) => \{.*?\n  \};\n\n  const handleSubmit", "  const confirmDeleteRecord = async () => {\n    if (!recordToDelete) return;\n    setIsDeletingRecord(true);\n    try {\n      await storageService.deletePantauanLiburan(recordToDelete.id);\n      loadRecords();\n      if (editingRecordId === recordToDelete.id) resetForm();\n      if (onDataChanged) onDataChanged();\n      onNotify('success', 'Catatan amaliyah liburan berhasil dihapus dari Cloud.');\n      setRecordToDelete(null);\n    } catch (err) {\n      console.error(err);\n      onNotify('error', 'Catatan amaliyah gagal dihapus dari Cloud. Data tidak dinyatakan terhapus.');\n    } finally {\n      setIsDeletingRecord(false);\n    }\n  };\n\n  const handleSubmit", 'pantauan delete handler')
t = rep(t, "      setToastType('success');\n      setToastMessage(`Laporan amaliyah ${formatTanggalIndo(selectedTanggal)} berhasil disimpan ke Cloud.`);\n      setTimeout(() => setToastMessage(null), 3500);", "      onNotify('success', `Laporan amaliyah ${formatTanggalIndo(selectedTanggal)} berhasil disimpan ke Cloud.`);", 'pantauan save success')
t = rep(t, "      setToastType('error');\n      setToastMessage('Gagal menyimpan ke Cloud. Data belum terkonfirmasi. Periksa koneksi lalu coba kembali.');", "      onNotify('error', 'Gagal menyimpan ke Cloud. Data belum terkonfirmasi. Periksa koneksi lalu coba kembali.');", 'pantauan save error')
t = sub(t, r"\n      \{/\* Toast \*/\}\n      \{toastMessage && \(.*?\n      \)\}\n", "\n", 'pantauan local toast jsx')
t = rep(t, "                        onClick={() => handleDeleteRecord(rec.id)}", "                        onClick={() => setRecordToDelete(rec)}", 'pantauan delete click')
modal = '''\n\n      {recordToDelete && (\n        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[1px] flex items-center justify-center p-4">\n          <div\n            className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4"\n            role="dialog"\n            aria-modal="true"\n            aria-labelledby="pantauan-delete-title"\n          >\n            <div>\n              <h4 id="pantauan-delete-title" className="text-sm font-extrabold text-slate-900">Hapus catatan amaliyah?</h4>\n              <p className="text-xs text-slate-500 mt-1 leading-relaxed">\n                Catatan tanggal {formatTanggalIndo(recordToDelete.tanggal)} akan dihapus dari Cloud dan tidak dapat dipulihkan dari halaman ini.\n              </p>\n            </div>\n            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">\n              <button\n                type="button"\n                onClick={() => setRecordToDelete(null)}\n                disabled={isDeletingRecord}\n                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"\n              >\n                Batal\n              </button>\n              <button\n                type="button"\n                onClick={confirmDeleteRecord}\n                disabled={isDeletingRecord}\n                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"\n              >\n                {isDeletingRecord ? 'Menghapus...' : 'Hapus dari Cloud'}\n              </button>\n            </div>\n          </div>\n        </div>\n      )}'''
closing = "\n    </div>\n  );\n};"
if closing not in t:
    raise SystemExit('pantauan closing anchor missing')
head, tail = t.rsplit(closing, 1)
t = head + modal + closing + tail
write(p, t)

# Storage service: destructive operations are Cloud-first and throw on Cloud failure.
p = 'services/storageService.ts'
t = read(p)
new_delete_record = '''  async deleteRecord(type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran', id: string): Promise<boolean> {\n    if (!id) return false;\n\n    const collectionName = type === 'Ziyadah' ? COLLECTIONS.ZIYADAH\n      : type === 'Murojaah' ? COLLECTIONS.MUROJAAH\n      : type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN\n      : COLLECTIONS.BINNADZOR;\n\n    // Cloud is the commit gate: do not hide local data if Firestore delete fails.\n    await deleteDoc(doc(db, collectionName, id));\n    this.markRecordDeleted(id);\n\n    if (type === 'Ziyadah') {\n      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(this.getZiyadahRecords().filter(r => r.id !== id)));\n    } else if (type === 'Murojaah') {\n      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(this.getMurojaahRecords().filter(r => r.id !== id)));\n    } else if (type === 'Pembelajaran') {\n      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(this.getPembelajaranRecords().filter(r => r.id !== id)));\n    } else {\n      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(this.getBinnadzorRecords().filter(r => r.id !== id)));\n    }\n    return true;\n  },\n'''
t = sub(t, r"  async deleteRecord\(type: 'Ziyadah' \| 'Murojaah' \| 'Binnadzor' \| 'Pembelajaran', id: string\): Promise<boolean> \{.*?\n  \},\n\n  async deleteRecordsBatch", new_delete_record + "\n  async deleteRecordsBatch", 'storage deleteRecord')
new_batch = '''  async deleteRecordsBatch(items: { type: 'Ziyadah' | 'Murojaah' | 'Binnadzor' | 'Pembelajaran'; id: string }[]): Promise<boolean> {\n    if (!items || items.length === 0) return true;\n\n    // Commit all Cloud deletes first so UI/local cache only change after Firestore confirms.\n    const batch = writeBatch(db);\n    items.forEach(item => {\n      const coll = item.type === 'Ziyadah' ? COLLECTIONS.ZIYADAH\n        : item.type === 'Murojaah' ? COLLECTIONS.MUROJAAH\n        : item.type === 'Pembelajaran' ? COLLECTIONS.PEMBELAJARAN\n        : COLLECTIONS.BINNADZOR;\n      batch.delete(doc(db, coll, item.id));\n    });\n    await batch.commit();\n\n    items.forEach(item => {\n      if (item.id) this.markRecordDeleted(item.id);\n    });\n\n    const ziyadahIds = new Set(items.filter(i => i.type === 'Ziyadah').map(i => i.id));\n    const murojaahIds = new Set(items.filter(i => i.type === 'Murojaah').map(i => i.id));\n    const binnadzorIds = new Set(items.filter(i => i.type === 'Binnadzor').map(i => i.id));\n    const pembelajaranIds = new Set(items.filter(i => i.type === 'Pembelajaran').map(i => i.id));\n\n    if (ziyadahIds.size > 0) localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(this.getZiyadahRecords().filter(r => !ziyadahIds.has(r.id))));\n    if (murojaahIds.size > 0) localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(this.getMurojaahRecords().filter(r => !murojaahIds.has(r.id))));\n    if (binnadzorIds.size > 0) localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(this.getBinnadzorRecords().filter(r => !binnadzorIds.has(r.id))));\n    if (pembelajaranIds.size > 0) localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(this.getPembelajaranRecords().filter(r => !pembelajaranIds.has(r.id))));\n\n    return true;\n  },\n'''
t = sub(t, r"  async deleteRecordsBatch\(items: \{ type: 'Ziyadah' \| 'Murojaah' \| 'Binnadzor' \| 'Pembelajaran'; id: string \}\[\]\): Promise<boolean> \{.*?\n  \},\n\n  // Full manual sync", new_batch + "\n  // Full manual sync", 'storage batch delete')
new_pantauan_delete = '''  async deletePantauanLiburan(id: string): Promise<boolean> {\n    await deleteDoc(doc(db, COLLECTIONS.PANTAUAN_LIBURAN, id));\n    const records = this.getPantauanLiburanRecords().filter(r => r.id !== id);\n    localStorage.setItem(STORAGE_KEYS.PANTAUAN_LIBURAN, JSON.stringify(records));\n    return true;\n  },'''
t = sub(t, r"  async deletePantauanLiburan\(id: string\): Promise<boolean> \{.*?\n  \},", new_pantauan_delete, 'storage pantauan delete')
new_santri_delete = '''  async deleteSantri(idSantri: string, deleteRelatedHistory = true): Promise<boolean> {\n    const usersToDelete = this.getUsers().filter(u => u.idSantri === idSantri || u.username.toLowerCase() === idSantri.toLowerCase());\n    const ziyadahToDelete = deleteRelatedHistory ? this.getZiyadahRecords().filter(r => r.idSantri === idSantri) : [];\n    const murojaahToDelete = deleteRelatedHistory ? this.getMurojaahRecords().filter(r => r.idSantri === idSantri) : [];\n    const binnadzorToDelete = deleteRelatedHistory ? this.getBinnadzorRecords().filter(r => r.idSantri === idSantri) : [];\n    const pembelajaranToDelete = deleteRelatedHistory ? this.getPembelajaranRecords().filter(r => r.idSantri === idSantri) : [];\n\n    const operationCount = 1 + usersToDelete.length + ziyadahToDelete.length + murojaahToDelete.length + binnadzorToDelete.length + pembelajaranToDelete.length;\n    if (operationCount > 450) {\n      throw new Error('Data terkait santri terlalu banyak untuk satu operasi hapus Cloud.');\n    }\n\n    const batch = writeBatch(db);\n    batch.delete(doc(db, COLLECTIONS.SANTRI, idSantri));\n    usersToDelete.forEach(u => batch.delete(doc(db, COLLECTIONS.USERS, u.id)));\n    ziyadahToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.ZIYADAH, r.id)));\n    murojaahToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.MUROJAAH, r.id)));\n    binnadzorToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.BINNADZOR, r.id)));\n    pembelajaranToDelete.forEach(r => batch.delete(doc(db, COLLECTIONS.PEMBELAJARAN, r.id)));\n    await batch.commit();\n\n    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(this.getSantriList().filter(s => s.idSantri !== idSantri)));\n    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.getUsers().filter(u => u.idSantri !== idSantri && u.username.toLowerCase() !== idSantri.toLowerCase())));\n\n    if (deleteRelatedHistory) {\n      ziyadahToDelete.forEach(r => this.markRecordDeleted(r.id));\n      murojaahToDelete.forEach(r => this.markRecordDeleted(r.id));\n      binnadzorToDelete.forEach(r => this.markRecordDeleted(r.id));\n      pembelajaranToDelete.forEach(r => this.markRecordDeleted(r.id));\n      localStorage.setItem(STORAGE_KEYS.ZIYADAH, JSON.stringify(this.getZiyadahRecords().filter(r => r.idSantri !== idSantri)));\n      localStorage.setItem(STORAGE_KEYS.MUROJAAH, JSON.stringify(this.getMurojaahRecords().filter(r => r.idSantri !== idSantri)));\n      localStorage.setItem(STORAGE_KEYS.BINNADZOR, JSON.stringify(this.getBinnadzorRecords().filter(r => r.idSantri !== idSantri)));\n      localStorage.setItem(STORAGE_KEYS.PEMBELAJARAN, JSON.stringify(this.getPembelajaranRecords().filter(r => r.idSantri !== idSantri)));\n    }\n\n    return true;\n  },'''
t = sub(t, r"  async deleteSantri\(idSantri: string, deleteRelatedHistory = true\): Promise<boolean> \{.*?\n  \},\n\n  async addUser", new_santri_delete + "\n\n  async addUser", 'storage santri delete')
new_user_delete = '''  async deleteUser(id: string): Promise<boolean> {\n    await deleteDoc(doc(db, COLLECTIONS.USERS, id));\n    const users = this.getUsers().filter(u => u.id !== id);\n    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));\n    return true;\n  },'''
t = sub(t, r"  async deleteUser\(id: string\): Promise<boolean> \{.*?\n  \},", new_user_delete, 'storage user delete')
new_kelas_delete = '''  async deleteKelas(id: string): Promise<boolean> {\n    const list = this.getKelasList();\n    const deletedKelas = list.find(k => k.id === id);\n    const affectedSantriIds = new Set(deletedKelas?.santriIds || []);\n    const allSantri = this.getSantriList();\n    const updatedSantri = allSantri.map(s => affectedSantriIds.has(s.idSantri) ? { ...s, kelas: '' } : s);\n\n    const batch = writeBatch(db);\n    batch.delete(doc(db, COLLECTIONS.KELAS, id));\n    updatedSantri.filter(s => affectedSantriIds.has(s.idSantri)).forEach(s => {\n      batch.set(doc(db, COLLECTIONS.SANTRI, s.idSantri), cleanForFirestore(s), { merge: true });\n    });\n    await batch.commit();\n\n    localStorage.setItem(STORAGE_KEYS.KELAS, JSON.stringify(list.filter(k => k.id !== id)));\n    if (affectedSantriIds.size > 0) {\n      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(updatedSantri));\n    }\n    return true;\n  },'''
t = sub(t, r"  async deleteKelas\(id: string\): Promise<boolean> \{.*?\n  \},\n\n  async resetToDefault", new_kelas_delete + "\n\n  async resetToDefault", 'storage kelas delete')
write(p, t)

print('P1.6 unified feedback + Cloud-truth patch applied')
