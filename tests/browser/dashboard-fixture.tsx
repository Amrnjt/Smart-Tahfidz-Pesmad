import React from 'react';
import { createRoot } from 'react-dom/client';
import { UstadzDashboard } from '../../src/components/UstadzDashboard';
import { useActiveTabNavigation } from '../../src/hooks/useActiveTabNavigation';
import { BottomNav } from '../../src/components/BottomNav';
import { DesktopPrimaryNav } from '../../src/components/DesktopPrimaryNav';
import '../../src/index.css';
import '../../src/design-foundation.css';
import '../../src/app-shell.css';
import '../../src/dashboard-experience.css';
import '../../src/input-workflow.css';
import '../../src/history-experience.css';
import '../../src/motion-finish.css';
import '../../src/release-polish.css';
import '../../src/responsive-accessibility.css';
import '../../src/santri-experience-finish.css';
import '../../src/chrome-transition-fix.css';
import '../../src/ustadz-experience-finish.css';
import '../../src/setoran-workflow-finish.css';
import '../../src/setor-dropup.css';

const user = { id: 'test', nama: 'Ustadz Pengujian', role: 'ustadz' } as any;
const today = new Date().toISOString().slice(0, 10);
const santri = [{ idSantri: 'S001', namaSantri: 'Santri Uji', kelas: 'A' }] as any;
const records = [{ id: 'z1', idSantri: 'S001', timestamp: today + 'T08:00:00', surah: 'Al-Fatihah', ayatAwal: 1, ayatAkhir: 7, nilai: 'Sangat Baik' }] as any;
function Fixture() {
  const [tab, navigate] = useActiveTabNavigation(user);
  return <div className="ui-app-shell">
    <div className="p3-chrome-stack">
      <DesktopPrimaryNav activeTab={tab} setActiveTab={navigate} isUstadz isSetorMenuOpen={false} onOpenSetorMenu={() => {}} />
    </div>
    <BottomNav currentUser={user} activeTab={tab} setActiveTab={navigate} santriList={santri} onNotify={() => {}} />
    <nav aria-label="Test navigation" style={{ position: 'fixed', top: 0, zIndex: 999, background: 'white' }}>
      <button onClick={() => navigate('dashboard')}>Beranda uji</button>
      <button onClick={() => navigate('riwayat')}>Riwayat uji</button>
    </nav>
    <main id="main-content" style={{ padding: '60px 24px', maxWidth: 1440, margin: 'auto' }}>
      <div className="p3-page-content" data-tab={tab}>
        {tab === 'dashboard' ? <UstadzDashboard currentUser={user} santriList={santri} ziyadahRecords={records} murojaahRecords={[]} kelasList={[]} setActiveTab={navigate} onOpenSetorMenu={() => {}} /> : <div style={{ minHeight: 1600 }}>Riwayat pengujian</div>}
      </div>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
