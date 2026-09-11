import React, { useEffect, useState } from 'react';
import { User, ActiveTab, Santri } from '../types';
import {
  LayoutDashboard,
  History,
  Plus,
  X,
  BookOpen,
  Settings2,
  BookPlus,
  RotateCw,
  BookOpenCheck,
  GraduationCap,
  Eye,
  ChevronDown
} from 'lucide-react';
import { useRipple } from '../hooks/useRipple';
import { ManageActionSheet } from './ManageActionSheet';
import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';
import { storageService } from '../services/storageService';
import type { NotifyFn } from './Snackbar';
import { useDropdownTransition } from '../hooks/useDropdownTransition';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  santriList: Santri[];
  onNotify: NotifyFn;
}

const SETOR_ACTIONS = [
  { tab: 'ziyadah' as ActiveTab, label: 'Ziyadah', icon: BookPlus },
  { tab: 'murojaah' as ActiveTab, label: "Muroja'ah", icon: RotateCw },
  { tab: 'binnadzor' as ActiveTab, label: 'Binnadzor', icon: BookOpenCheck },
  { tab: 'pembelajaran' as ActiveTab, label: 'Non-Tahfidz', icon: GraduationCap }
];

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  santriList,
  onNotify
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [programLiburanActive, setProgramLiburanActive] = useState(false);
  const [isProgramToggling, setIsProgramToggling] = useState(false);
  const fabRipple = useRipple<HTMLButtonElement>();
  const setorTransition = useDropdownTransition(isActionSheetOpen);

  useEffect(() => {
    if (!isActionSheetOpen) return;

    const cfg = storageService.getAppConfig();
    setProgramLiburanActive(Boolean(cfg.programLiburanActive));

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsActionSheetOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isActionSheetOpen]);

  useEffect(() => {
    setIsActionSheetOpen(false);
    setIsManageSheetOpen(false);
  }, [activeTab]);

  if (!currentUser) return null;

  const navigateTo = (tab: ActiveTab) => {
    setIsActionSheetOpen(false);
    setIsManageSheetOpen(false);
    setActiveTab(tab);
  };

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
        <nav aria-label="Navigasi bawah" className="p2-bottom-dock p2-bottom-dock-bedimcode p2-bottom-dock-compact">
          {items.map(item => (
            <NavButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.id}
              onClick={() => navigateTo(item.id)}
            />
          ))}
        </nav>
      </div>
    );
  }

  const chooseSetor = (tab: ActiveTab) => {
    navigateTo(tab);
  };

  const openPantauanMonitor = () => {
    setIsActionSheetOpen(false);
    setShowMonitorModal(true);
  };

  const toggleProgramLiburan = async () => {
    if (isProgramToggling) return;

    const nextStatus = !programLiburanActive;
    setIsProgramToggling(true);

    try {
      const updated = await storageService.setProgramLiburanActive(nextStatus, 'Ustadz / Admin');
      const storedStatus = Boolean(updated.programLiburanActive);
      setProgramLiburanActive(storedStatus);
      onNotify(
        'success',
        storedStatus
          ? 'Program Pantauan Liburan aktif dan tersimpan di Cloud.'
          : 'Program Pantauan Liburan dinonaktifkan dan tersimpan di Cloud.'
      );
    } catch (error) {
      console.error(error);
      onNotify('error', 'Status Program Pantauan Liburan gagal diperbarui di Cloud.');
    } finally {
      setIsProgramToggling(false);
    }
  };

  return (
    <>
      {setorTransition.isMounted && (
        <button
          type="button"
          className={`p2-setor-dropup-backdrop t-dropdown-backdrop ${setorTransition.transitionClassName} md:hidden`}
          aria-label="Tutup menu setoran"
          onClick={() => setIsActionSheetOpen(false)}
          tabIndex={isActionSheetOpen ? 0 : -1}
        />
      )}

      <div className="p2-bottom-shell md:hidden">
        <nav className="p2-bottom-dock p2-bottom-dock-bedimcode p2-bottom-dock-ustadz" aria-label="Navigasi bawah">
          <NavButton
            label="Beranda"
            icon={LayoutDashboard}
            isActive={activeTab === 'dashboard'}
            onClick={() => navigateTo('dashboard')}
          />

          <NavButton
            label="Riwayat"
            icon={History}
            isActive={activeTab === 'riwayat'}
            onClick={() => navigateTo('riwayat')}
          />

          <div className="p2-setor-slot">
            {isSetorActive && <span className="p2-bottom-active-rail" aria-hidden="true" />}

            {setorTransition.isMounted && (
                <div
                  id="setor-dropup-menu"
                  className={`p2-setor-dropup t-dropdown ${setorTransition.transitionClassName}`}
                  data-origin="bottom-center"
                  role="menu"
                  aria-label="Pilih jenis setoran"
                  aria-hidden={!isActionSheetOpen}
                >
                  <div
                    className="p2-setor-dropup-program"
                    role="group"
                    aria-label="Program Pantauan Liburan"
                  >
                    <button
                      type="button"
                      className="p2-setor-program-info"
                      onClick={openPantauanMonitor}
                      aria-haspopup="dialog"
                      aria-label="Buka rekap Program Pantauan Liburan"
                    >
                      <span className="p2-setor-program-icon" aria-hidden="true">
                        <Eye className="ui-icon-md" />
                      </span>
                      <span className="p2-setor-program-copy">
                        <span className="p2-setor-program-title">Pantauan Liburan</span>
                        <span className="p2-setor-program-status">
                          {programLiburanActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={programLiburanActive}
                      aria-busy={isProgramToggling}
                      aria-label={programLiburanActive ? 'Nonaktifkan Program Pantauan Liburan' : 'Aktifkan Program Pantauan Liburan'}
                      className={`p2-setor-program-switch ${programLiburanActive ? 'is-active' : ''}`}
                      onClick={toggleProgramLiburan}
                      disabled={isProgramToggling}
                    >
                      <span className="p2-setor-program-switch-thumb" aria-hidden="true" />
                    </button>
                  </div>

                  {SETOR_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        type="button"
                        role="menuitem"
                        key={action.tab}
                        className="p2-setor-dropup-item"
                        onClick={() => chooseSetor(action.tab)}
                        tabIndex={isActionSheetOpen ? 0 : -1}
                      >
                        <span className="p2-setor-dropup-label">{action.label}</span>
                        <span className="p2-setor-dropup-icon" aria-hidden="true">
                          <Icon className="ui-icon-md" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

            <button
              type="button"
              ref={fabRipple.elementRef}
              onClick={(event) => {
                fabRipple.createRipple(event);
                setIsManageSheetOpen(false);
                setIsActionSheetOpen(open => !open);
              }}
              className={`ripple-container p2-setor-fab ${isSetorActive ? 'is-active' : ''} ${isActionSheetOpen ? 'is-open' : ''}`}
              aria-label={isActionSheetOpen ? 'Tutup pilihan setoran' : 'Tambah Setoran Baru'}
              aria-haspopup="menu"
              aria-expanded={isActionSheetOpen}
              aria-controls="setor-dropup-menu"
              title={isActionSheetOpen ? 'Tutup pilihan setoran' : 'Tambah Setoran Baru'}
            >
              <span className="t-icon-swap" data-state={isActionSheetOpen ? 'b' : 'a'} aria-hidden="true">
                <span className="t-icon" data-icon="a">
                  <Plus className="ui-icon-md stroke-[2.4]" />
                </span>
                <span className="t-icon" data-icon="b">
                  <X className="ui-icon-md stroke-[2.4]" />
                </span>
              </span>
            </button>
            <span className={`p2-setor-label ${isSetorActive || isActionSheetOpen ? 'is-active' : ''}`}>Setor</span>
          </div>

          <div className="p2-manage-slot">
            <ManageNavButton
              isManageSheetOpen={isManageSheetOpen}
              isActive={isManageActive}
              isOpen={isManageSheetOpen}
              showActiveRail={isManageActive}
              onClick={() => {
                setIsActionSheetOpen(false);
                setIsManageSheetOpen(open => !open);
              }}
            />
            <ManageActionSheet
              isOpen={isManageSheetOpen}
              onClose={() => setIsManageSheetOpen(false)}
              onSelect={(tab) => navigateTo(tab)}
            />
          </div>

          <NavButton
            label="Mushaf"
            icon={BookOpen}
            isActive={activeTab === 'mushaf'}
            onClick={() => navigateTo('mushaf')}
          />
        </nav>
      </div>

      <PantauanLiburanMonitorModal
        isOpen={showMonitorModal}
        onClose={() => setShowMonitorModal(false)}
        santriList={santriList}
        onNotify={onNotify}
      />
    </>
  );
};

interface NavButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  showActiveRail?: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon: Icon, isActive, showActiveRail = isActive, onClick }) => {
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      type="button"
      ref={ripple.elementRef}
      onClick={(event) => {
        ripple.createRipple(event);
        onClick();
      }}
      className={`ripple-container p2-bottom-item p2-bottom-item-bedimcode ${isActive ? 'is-active' : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {showActiveRail && <span className="p2-bottom-active-rail" aria-hidden="true" />}
      <span className="p2-bottom-icon-wrap">
        <Icon className="ui-icon-md" />
      </span>
      <span className="p2-bottom-label">{label}</span>
    </button>
  );
};

interface ManageNavButtonProps {
  isManageSheetOpen: boolean;
  isActive: boolean;
  isOpen: boolean;
  showActiveRail: boolean;
  onClick: () => void;
}

const ManageNavButton: React.FC<ManageNavButtonProps> = ({ isManageSheetOpen, isActive, isOpen, showActiveRail, onClick }) => {
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      type="button"
      ref={ripple.elementRef}
      onClick={(event) => {
        ripple.createRipple(event);
        onClick();
      }}
      className={`ripple-container p2-bottom-item p2-bottom-item-bedimcode p2-manage-toggle ${isActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
      aria-label={isManageSheetOpen ? 'Tutup menu Kelola' : 'Buka menu Kelola'}
      aria-haspopup="menu"
      aria-expanded={isManageSheetOpen}
      aria-controls="manage-dropdown-menu"
      aria-current={isActive ? 'page' : undefined}
    >
      {showActiveRail && <span className="p2-bottom-active-rail" aria-hidden="true" />}
      <span className="p2-bottom-icon-wrap">
        <Settings2 className="ui-icon-md" />
      </span>
      <span className="p2-manage-label-row">
        <span className="p2-bottom-label">Kelola</span>
        <ChevronDown className={`p2-manage-toggle-chevron ${isManageSheetOpen ? 'is-open' : ''}`} aria-hidden="true" />
      </span>
    </button>
  );
};
