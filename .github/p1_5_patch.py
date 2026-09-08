from pathlib import Path
import re

path = Path('src/components/SantriManagement.tsx')
text = path.read_text()

old_import = "import { Users, UserPlus, Target, Trash2, Search, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Shield, Key, CreditCard as Edit3, UserCheck, Save, Sparkles, Phone, Copy, Share2, ToggleLeft, ToggleRight, Eye, Crown, Lock } from 'lucide-react';"
new_import = "import { Users, UserPlus, Target, Trash2, Search, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Shield, Key, CreditCard as Edit3, UserCheck, Save, Sparkles, Phone, Copy, Share2, Crown, Lock } from 'lucide-react';"
if old_import not in text:
    raise SystemExit('lucide import anchor not found')
text = text.replace(old_import, new_import, 1)

monitor_import = "import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';\n"
if monitor_import not in text:
    raise SystemExit('monitor import anchor not found')
text = text.replace(monitor_import, '', 1)

state_block = """  const [appConfig, setAppConfig] = useState(storageService.getAppConfig());
  const [isTogglingLiburan, setIsTogglingLiburan] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const holidayRecordsCount = storageService.getPantauanLiburanRecords().length;

  const handleToggleLiburan = async () => {
    setIsTogglingLiburan(true);
    const nextState = !appConfig.programLiburanActive;
    try {
      const updated = await storageService.setProgramLiburanActive(nextState, 'Ustadz / Admin');
      setAppConfig(updated);
      showToast('success', nextState
        ? 'Program Pantauan Liburan Santri BERHASIL DIAKTIFKAN! Dasbor Wali kini dapat menginput mutaba\\'ah liburan.'
        : 'Program Pantauan Liburan Santri TELAH DINONAKTIFKAN. Dasbor Wali terkunci.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal mengubah status program liburan.');
    } finally {
      setIsTogglingLiburan(false);
    }
  };

"""
if state_block not in text:
    raise SystemExit('program state block anchor not found')
text = text.replace(state_block, '', 1)

text = text.replace(
"            Manajemen Data Santri & Akun Pengguna",
"            Santri & Akun",
1)
text = text.replace(
"            Pengelolaan data santri, target kelulusan, dan hak akses akun (Ustadz, Wali, Santri)",
"            Kelola identitas santri, data wali, target hafalan, kredensial, dan hak akses pengguna.",
1)

pattern = re.compile(r'''\n      \{/\* Remote Pengendali Program Pantauan Liburan Santri \(Desktop & Mobile\) \*/\}.*?\n      \{/\* Controls: Search & Add Button \*/\}''', re.S)
text, count = pattern.subn("\n      {/* Controls: Search & Add Button */}", text, count=1)
if count != 1:
    raise SystemExit(f'expected one remote controller block, got {count}')

modal_pattern = re.compile(r'''\n      \{/\* Modal Rekapitulasi Program Pantauan Liburan Santri \(Ustadz View-Only\) \*/\}\n      \{showMonitorModal && \(.*?\n      \)\}\n''', re.S)
text, count = modal_pattern.subn('\n', text, count=1)
if count != 1:
    raise SystemExit(f'expected one monitor modal block, got {count}')

# Guardrails: remote control concerns must no longer belong to SantriManagement.
for forbidden in [
    'showMonitorModal',
    'setShowMonitorModal',
    'isTogglingLiburan',
    'handleToggleLiburan',
    'holidayRecordsCount',
    'setProgramLiburanActive',
    'PantauanLiburanMonitorModal',
    'ToggleLeft',
    'ToggleRight',
]:
    if forbidden in text:
        raise SystemExit(f'forbidden P1.5 concern remains: {forbidden}')

path.write_text(text)
print('P1.5 Santri Management IA patch applied')
