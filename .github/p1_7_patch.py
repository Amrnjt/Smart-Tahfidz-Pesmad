from pathlib import Path
import re

ROOT = Path('src')


def read(path: str) -> str:
    return (ROOT / path).read_text()


def write(path: str, text: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)


def rep(text: str, old: str, new: str, label: str, count: int = 1) -> str:
    actual = text.count(old)
    if actual < count:
        raise SystemExit(f'{label}: expected at least {count}, found {actual}')
    return text.replace(old, new, count)


def rep_all(text: str, old: str, new: str, label: str, minimum: int = 1) -> str:
    actual = text.count(old)
    if actual < minimum:
        raise SystemExit(f'{label}: expected at least {minimum}, found {actual}')
    return text.replace(old, new)


def sub(text: str, pattern: str, repl: str, label: str, count: int = 1) -> str:
    out, n = re.subn(pattern, repl, text, count=count, flags=re.S)
    if n != count:
        raise SystemExit(f'{label}: expected {count}, found {n}')
    return out


# Shared accessibility behavior for every modal/dialog.
write('hooks/useAccessibleDialog.ts', '''import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const dialogStack: symbol[] = [];
let bodyLockCount = 0;
let previousBodyOverflow = '';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && !element.hasAttribute('aria-hidden');
  });
}

/**
 * Shared modal behavior: initial focus, Escape, Tab trapping, body scroll lock,
 * and returning focus to the element that opened the dialog. A small stack
 * keeps nested dialogs from competing for keyboard events.
 */
export function useAccessibleDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const tokenRef = useRef(Symbol('accessible-dialog'));

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const token = tokenRef.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogStack.push(token);

    if (bodyLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
    }
    bodyLockCount += 1;
    document.body.style.overflow = 'hidden';

    const focusFrame = window.requestAnimationFrame(() => {
      const focusable = getFocusableElements(dialog);
      (focusable[0] || dialog).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const activeInsideDialog = active instanceof Node && dialog.contains(active);

      if (event.shiftKey && (active === first || !activeInsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !activeInsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);

      const stackIndex = dialogStack.lastIndexOf(token);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);

      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }

      window.requestAnimationFrame(() => {
        if (trigger?.isConnected) trigger.focus();
      });
    };
  }, [isOpen]);

  return dialogRef;
}
''')

# Setor Action Sheet
p = 'components/SetorActionSheet.tsx'
t = read(p)
t = rep(t, "import type { NotifyFn } from './Snackbar';", "import type { NotifyFn } from './Snackbar';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';", 'setor hook import')
t = rep(t, "  const [showMonitorModal, setShowMonitorModal] = useState(false);\n", "  const [showMonitorModal, setShowMonitorModal] = useState(false);\n  const dialogRef = useAccessibleDialog(isOpen, onClose);\n", 'setor dialog ref')
t = sub(t, r"\n  useEffect\(\(\) => \{\n    const handleKeyDown = \(e: KeyboardEvent\) => \{\n      if \(e.key === 'Escape' && isOpen\) \{\n        onClose\(\);\n      \}\n    \};\n\n    window.addEventListener\('keydown', handleKeyDown\);\n    return \(\) => window.removeEventListener\('keydown', handleKeyDown\);\n  \}, \[isOpen, onClose\]\);\n", "\n", 'remove manual Setor Escape')
t = rep(t, "      <div\n        className=\"relative z-10 w-full max-w-lg max-h-[88dvh] overflow-y-auto bg-white rounded-t-2xl border-t border-slate-200 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-5 duration-200\"\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-label=\"Pilih Jenis Setoran\"\n      >", "      <div\n        ref={dialogRef}\n        className=\"relative z-10 w-full max-w-lg max-h-[88dvh] overflow-y-auto overscroll-contain bg-white rounded-t-2xl border-t border-slate-200 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-5 duration-200\"\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-labelledby=\"setor-action-sheet-title\"\n        aria-describedby=\"setor-action-sheet-description\"\n        tabIndex={-1}\n      >", 'setor dialog attrs')
t = rep(t, '<h2 className="text-sm font-bold text-slate-900 leading-5">Input Setoran Santri</h2>', '<h2 id="setor-action-sheet-title" className="text-sm font-bold text-slate-900 leading-5">Input Setoran Santri</h2>', 'setor title id')
t = rep(t, '<p className="text-[11px] text-slate-500 leading-4">\n              Pilih jenis setoran yang akan diinput\n            </p>', '<p id="setor-action-sheet-description" className="text-[11px] text-slate-500 leading-4">\n              Pilih jenis setoran yang akan diinput\n            </p>', 'setor desc id')
t = rep(t, "          santriList={santriList}\n        />", "          santriList={santriList}\n          onNotify={onNotify}\n        />", 'setor monitor notify')
write(p, t)

# Monitor modal: keyboard/focus contract + truthful toggle feedback.
p = 'components/PantauanLiburanMonitorModal.tsx'
t = read(p)
t = rep(t, "import { formatTanggalIndo } from '../utils/dateFormatter';", "import { formatTanggalIndo } from '../utils/dateFormatter';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';\nimport type { NotifyFn } from './Snackbar';", 'monitor imports')
t = rep(t, "  santriList: Santri[];\n}", "  santriList: Santri[];\n  onNotify: NotifyFn;\n}", 'monitor prop type')
t = rep(t, "  onClose,\n  santriList\n}) => {", "  onClose,\n  santriList,\n  onNotify\n}) => {", 'monitor destructure')
t = rep(t, "  const [isToggling, setIsToggling] = useState(false);\n", "  const [isToggling, setIsToggling] = useState(false);\n  const dialogRef = useAccessibleDialog(isOpen, onClose);\n", 'monitor dialog ref')
t = rep(t, "      const updated = await storageService.setProgramLiburanActive(newStatus, 'Ustadz / Admin');\n      setAppConfig(updated);", "      const updated = await storageService.setProgramLiburanActive(newStatus, 'Ustadz / Admin');\n      setAppConfig(updated);\n      onNotify('success', newStatus ? 'Program Pantauan Liburan aktif dan tersimpan di Cloud.' : 'Program Pantauan Liburan dinonaktifkan dan tersimpan di Cloud.');", 'monitor toggle success')
t = rep(t, "    } catch (err) {\n      console.error(err);\n    }", "    } catch (err) {\n      console.error(err);\n      onNotify('error', 'Status Program Pantauan Liburan gagal diperbarui di Cloud.');\n    }", 'monitor toggle error')
t = rep(t, "      <div\n        className=\"relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200\"\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-label=\"Rekap Program Pantauan Liburan Santri\"\n      >", "      <div\n        ref={dialogRef}\n        className=\"relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden overscroll-contain animate-in zoom-in-95 duration-200\"\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-labelledby=\"pantauan-monitor-title\"\n        aria-describedby=\"pantauan-monitor-description\"\n        tabIndex={-1}\n      >", 'monitor dialog attrs')
t = rep(t, '<h3 className="text-base sm:text-lg font-extrabold text-slate-900">\n                  Rekapitulasi Program Pantauan Liburan Santri\n                </h3>', '<h3 id="pantauan-monitor-title" className="text-base sm:text-lg font-extrabold text-slate-900">\n                  Rekapitulasi Program Pantauan Liburan Santri\n                </h3>', 'monitor title id')
t = rep(t, '<p className="text-xs text-slate-500 mt-0.5">\n                Monitoring amaliyah wirid yaumiyyah (al-Waqi\'ah, al-Mulk, al-Insyirah) & shalat berjama\'ah yang diisi oleh Wali Santri\n              </p>', '<p id="pantauan-monitor-description" className="text-xs text-slate-500 mt-0.5">\n                Monitoring amaliyah wirid yaumiyyah (al-Waqi\'ah, al-Mulk, al-Insyirah) & shalat berjama\'ah yang diisi oleh Wali Santri\n              </p>', 'monitor desc id')
write(p, t)

# PDF report modal: it already portals to body; add the same interaction contract.
p = 'components/UnduhLaporanModal.tsx'
t = read(p)
t = rep(t, "} from 'lucide-react';", "} from 'lucide-react';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';", 'report hook import')
t = rep(t, "  const { isGenerating, error, success, generatePDF } = useGeneratePDF();\n", "  const { isGenerating, error, success, generatePDF } = useGeneratePDF();\n  const dialogRef = useAccessibleDialog(isOpen, onClose);\n", 'report dialog ref')
t = rep(t, "      <div className=\"bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-y-auto\">", "      <div\n        ref={dialogRef}\n        className=\"bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain\"\n        role=\"dialog\"\n        aria-modal=\"true\"\n        aria-labelledby=\"report-download-title\"\n        tabIndex={-1}\n      >", 'report dialog attrs')
t = rep(t, '<h3 className="font-bold text-sm sm:text-base truncate">\n                Unduh Laporan Hafalan (PDF)\n              </h3>', '<h3 id="report-download-title" className="font-bold text-sm sm:text-base truncate">\n                Unduh Laporan Hafalan (PDF)\n              </h3>', 'report title id')
write(p, t)

# History table: its dialog semantics already exist; add focus management and viewport-safe scroll.
p = 'components/HistoryTable.tsx'
t = read(p)
t = rep(t, "import type { NotifyFn } from './Snackbar';", "import type { NotifyFn } from './Snackbar';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';", 'history hook import')
t = rep(t, "  const [showMobileFilters, setShowMobileFilters] = useState(false);\n", "  const [showMobileFilters, setShowMobileFilters] = useState(false);\n\n  const editDialogRef = useAccessibleDialog(Boolean(editingItem), () => {\n    if (!isSavingEdit) {\n      setEditingItem(null);\n      setIsSavingEdit(false);\n    }\n  });\n  const deleteDialogRef = useAccessibleDialog(Boolean(itemToDelete), () => {\n    if (!isDeleting) setItemToDelete(null);\n  });\n  const batchDeleteDialogRef = useAccessibleDialog(isBatchDeleteModalOpen, () => {\n    if (!isBatchDeleting) setIsBatchDeleteModalOpen(false);\n  });\n", 'history refs')
t = rep(t, "        <div\n          className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm\"\n          onClick={closeEditModal}\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"edit-modal-title\"\n        >", "        <div\n          ref={editDialogRef}\n          className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm\"\n          onClick={closeEditModal}\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"edit-modal-title\"\n          tabIndex={-1}\n        >", 'history edit ref')
t = rep(t, 'className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"', 'className="w-full max-w-lg max-h-[calc(100dvh-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-y-auto overscroll-contain"', 'history edit safe height')
t = rep(t, "        <div\n          className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs\"\n          onClick={() => !isDeleting && setItemToDelete(null)}\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"delete-dialog-title\"\n        >", "        <div\n          ref={deleteDialogRef}\n          className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs\"\n          onClick={() => !isDeleting && setItemToDelete(null)}\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"delete-dialog-title\"\n          tabIndex={-1}\n        >", 'history single delete ref')
t = rep(t, "        <div\n          className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs\"\n          onClick={() => !isBatchDeleting && setIsBatchDeleteModalOpen(false)}\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"batch-delete-dialog-title\"\n        >", "        <div\n          ref={batchDeleteDialogRef}\n          className=\"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs\"\n          onClick={() => !isBatchDeleting && setIsBatchDeleteModalOpen(false)}\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-labelledby=\"batch-delete-dialog-title\"\n          tabIndex={-1}\n        >", 'history batch delete ref')
t = rep_all(t, 'className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"', 'className="w-full max-w-md max-h-[calc(100dvh-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150"', 'history delete safe height', minimum=2)
write(p, t)

# Kelas Management: three modal roots receive dialog semantics and shared focus behavior.
p = 'components/KelasManagement.tsx'
t = read(p)
t = rep(t, "import type { NotifyFn } from './Snackbar';", "import type { NotifyFn } from './Snackbar';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';", 'kelas hook import')
t = rep(t, "  const [showUnassignedList, setShowUnassignedList] = useState(false);\n", "  const [showUnassignedList, setShowUnassignedList] = useState(false);\n\n  const addDialogRef = useAccessibleDialog(showAddModal, () => {\n    if (!isSaving) setShowAddModal(false);\n  });\n  const editDialogRef = useAccessibleDialog(Boolean(kelasToEdit), () => {\n    if (!isSaving) setKelasToEdit(null);\n  });\n  const deleteDialogRef = useAccessibleDialog(Boolean(kelasToDelete), () => {\n    if (!isDeleting) setKelasToDelete(null);\n  });\n", 'kelas refs')
for state, refname, label in [
    ('showAddModal', 'addDialogRef', 'Tambah kelas baru'),
    ('kelasToEdit', 'editDialogRef', 'Edit kelas'),
    ('kelasToDelete', 'deleteDialogRef', 'Konfirmasi hapus kelas'),
]:
    old = f"      {{{state} && (\n        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4\">"
    new = f"      {{{state} && (\n        <div\n          ref={{{refname}}}\n          className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4\"\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-label=\"{label}\"\n          tabIndex={{-1}}\n        >"
    t = rep(t, old, new, f'kelas {state} root')
t = rep_all(t, 'max-h-[92vh] overflow-y-auto', 'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain', 'kelas safe height', minimum=2)
t = rep(t, '<button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">', '<button onClick={() => setShowAddModal(false)} aria-label="Tutup dialog tambah kelas" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">', 'kelas add close label')
t = rep(t, '<button onClick={() => setKelasToEdit(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">', '<button onClick={() => setKelasToEdit(null)} aria-label="Tutup dialog edit kelas" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer">', 'kelas edit close label')
write(p, t)

# Santri & account management: six dialogs become keyboard/focus safe and mobile-scroll safe.
p = 'components/SantriManagement.tsx'
t = read(p)
t = rep(t, "import type { NotifyFn } from './Snackbar';", "import type { NotifyFn } from './Snackbar';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';", 'santri hook import')
t = rep(t, "  const [isDeleting, setIsDeleting] = useState(false);\n", "  const [isDeleting, setIsDeleting] = useState(false);\n\n  const addSantriDialogRef = useAccessibleDialog(showAddModal, () => { if (!isSaving) setShowAddModal(false); });\n  const addUserDialogRef = useAccessibleDialog(showAddUserModal, () => { if (!isSaving) setShowAddUserModal(false); });\n  const editSantriDialogRef = useAccessibleDialog(Boolean(santriToEdit), () => { if (!isSaving) setSantriToEdit(null); });\n  const editUserDialogRef = useAccessibleDialog(Boolean(userToEdit), () => { if (!isSaving) setUserToEdit(null); });\n  const deleteSantriDialogRef = useAccessibleDialog(Boolean(santriToDelete), () => { if (!isDeleting) setSantriToDelete(null); });\n  const deleteUserDialogRef = useAccessibleDialog(Boolean(userToDelete), () => { if (!isDeleting) setUserToDelete(null); });\n", 'santri refs')
modal_map = [
    ('santriToEdit', 'editSantriDialogRef', 'Edit data santri'),
    ('userToEdit', 'editUserDialogRef', 'Edit akun pengguna'),
    ('santriToDelete', 'deleteSantriDialogRef', 'Konfirmasi hapus santri'),
    ('userToDelete', 'deleteUserDialogRef', 'Konfirmasi hapus akun pengguna'),
    ('showAddModal', 'addSantriDialogRef', 'Tambah data santri'),
    ('showAddUserModal', 'addUserDialogRef', 'Tambah akun pengguna'),
]
for state, refname, label in modal_map:
    old = f"      {{{state} && (\n        <div className=\"fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4\">"
    new = f"      {{{state} && (\n        <div\n          ref={{{refname}}}\n          className=\"fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4\"\n          role=\"dialog\"\n          aria-modal=\"true\"\n          aria-label=\"{label}\"\n          tabIndex={{-1}}\n        >"
    t = rep(t, old, new, f'santri {state} root')
inner = 'bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150'
inner_new = 'bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 sm:p-7 border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150'
t = rep_all(t, inner, inner_new, 'santri modal safe height', minimum=6)
for setter, label in [
    ('setSantriToEdit(null)', 'Tutup dialog edit santri'),
    ('setUserToEdit(null)', 'Tutup dialog edit akun'),
    ('setShowAddModal(false)', 'Tutup dialog tambah santri'),
    ('setShowAddUserModal(false)', 'Tutup dialog tambah akun'),
]:
    old = f"              <button\n                onClick={{() => {setter}}}\n                className=\"text-slate-400 hover:text-slate-600 text-lg cursor-pointer\""
    new = f"              <button\n                onClick={{() => {setter}}}\n                aria-label=\"{label}\"\n                className=\"text-slate-400 hover:text-slate-600 text-lg cursor-pointer\""
    t = rep(t, old, new, f'santri close {setter}')
write(p, t)

# Wali holiday delete confirmation uses the same focus stack.
p = 'components/PantauanLiburanWaliSection.tsx'
t = read(p)
t = rep(t, "import type { NotifyFn } from './Snackbar';", "import type { NotifyFn } from './Snackbar';\nimport { useAccessibleDialog } from '../hooks/useAccessibleDialog';", 'wali pantauan hook import')
t = rep(t, "  const [records, setRecords] = useState<PantauanLiburanRecord[]>([]);\n", "  const [records, setRecords] = useState<PantauanLiburanRecord[]>([]);\n  const deleteDialogRef = useAccessibleDialog(Boolean(recordToDelete), () => {\n    if (!isDeletingRecord) setRecordToDelete(null);\n  });\n", 'wali pantauan dialog ref')
t = rep(t, "          <div\n            className=\"w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4\"\n            role=\"dialog\"\n            aria-modal=\"true\"\n            aria-labelledby=\"pantauan-delete-title\"\n          >", "          <div\n            ref={deleteDialogRef}\n            className=\"w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4\"\n            role=\"dialog\"\n            aria-modal=\"true\"\n            aria-labelledby=\"pantauan-delete-title\"\n            tabIndex={-1}\n          >", 'wali pantauan delete attrs')
write(p, t)

print('P1.7 accessibility patch applied')
