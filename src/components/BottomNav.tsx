import React, { useState } from 'react';
import { User, ActiveTab, Santri } from '../types';
import { LayoutDashboard, History, Plus, BookOpen, Settings2 } from 'lucide-react';
import { useRipple } from '../hooks/useRipple';
import { SetorActionSheet } from './SetorActionSheet';
import { ManageActionSheet } from './ManageActionSheet';
import type { NotifyFn } from './Snackbar';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  santriList: Santri[];
  onNotify: NotifyFn;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  santriList,
  onNotify
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const fabRipple = useRipple<HTMLButtonElement>();

  if (!currentUser) return null;

  const roleStr = String(currentUser.role || '').trim().toLowerCase();
  const isWali = roleStr === 'wali' || roleStr.includes('wali');
  const isSantri = roleStr === 'santri';
  const isUstadz = !isWali && !isSantri;
  const isSetorActive = activeTab === 'ziyadah' || activeTab === 'murojaah' || activeTab === 'binnadzor' || activeTab === 'pembelajaran';
  const isManageActive = activeTab === 'kelas' || activeTab === 'santri';

  if (!isUstadz) {
    const items = [
      { id: 'dashboard' as ActiveTab, label: isWali ? 'Anak Saya' : 'Hafalan', icon: LayoutDashboard },
      { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: History },
      { id: 'mushaf' as ActiveTab, label: 'Mushaf', icon: BookOpen }
    ];

    return (
      <div className="p2-bottom-shell md:hidden">
        <nav aria-label="Navigasi bawah" className="p2-bottom-dock p2-bottom-dock-compact">
          {items.map(item => (
            <NavButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <>
      <div className="p2-bottom-shell md:hidden">
        <nav className="p2-bottom-dock p2-bottom-dock-ustadz" aria-label="Navigasi bawah">
          <NavButton
            label="Beranda"
            icon={LayoutDashboard}
            isActive={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />

          <NavButton
            label="Riwayat"
            icon={History}
            isActive={activeTab === 'riwayat'}
            onClick={() => setActiveTab('riwayat')}
          />

          <div className="p2-setor-slot">
            <button
              type="button"
              ref={fabRipple.elementRef}
              onClick={(event) => {
                fabRipple.createRipple(event);
                setIsActionSheetOpen(true);
              }}
              className={`ripple-container p2-setor-fab ${isSetorActive ? 'is-active' : ''}`}
              aria-label="Tambah Setoran Baru"
              aria-haspopup="dialog"
              aria-expanded={isActionSheetOpen}
              title="Tambah Setoran Baru"
            >
              <Plus className="ui-icon-md stroke-[2.4]" />
            </button>
            <span className={`p2-setor-label ${isSetorActive ? 'is-active' : ''}`}>Setor</span>
          </div>

          <NavButton
            label="Kelola"
            icon={Settings2}
            isActive={isManageActive}
            onClick={() => setIsManageSheetOpen(true)}
          />

          <NavButton
            label="Mushaf"
            icon={BookOpen}
            isActive={activeTab === 'mushaf'}
            onClick={() => setActiveTab('mushaf')}
          />
        </nav>
      </div>

      <SetorActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onSelect={(tab) => setActiveTab(tab)}
        santriList={santriList}
        onNotify={onNotify}
      />

      <ManageActionSheet
        isOpen={isManageSheetOpen}
        onClose={() => setIsManageSheetOpen(false)}
        onSelect={(tab) => setActiveTab(tab)}
      />
    </>
  );
};

interface NavButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon: Icon, isActive, onClick }) => {
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      type="button"
      ref={ripple.elementRef}
      onClick={(event) => {
        ripple.createRipple(event);
        onClick();
      }}
      className={`ripple-container p2-bottom-item ${isActive ? 'is-active' : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="p2-bottom-icon-wrap">
        <Icon className="ui-icon-md" />
      </span>
      <span className="p2-bottom-label">{label}</span>
    </button>
  );
};
