import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  GraduationCap
} from 'lucide-react';
import { useRipple } from '../hooks/useRipple';
import { ManageActionSheet } from './ManageActionSheet';
import type { NotifyFn } from './Snackbar';

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
  setActiveTab
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isManageSheetOpen, setIsManageSheetOpen] = useState(false);
  const fabRipple = useRipple<HTMLButtonElement>();

  useEffect(() => {
    if (!isActionSheetOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsActionSheetOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isActionSheetOpen]);

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

  const chooseSetor = (tab: ActiveTab) => {
    setIsActionSheetOpen(false);
    setActiveTab(tab);
  };

  return (
    <>
      <AnimatePresence>
        {isActionSheetOpen && (
          <motion.button
            type="button"
            className="p2-setor-dropup-backdrop md:hidden"
            aria-label="Tutup menu setoran"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setIsActionSheetOpen(false)}
          />
        )}
      </AnimatePresence>

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
            <AnimatePresence>
              {isActionSheetOpen && (
                <motion.div
                  id="setor-dropup-menu"
                  className="p2-setor-dropup"
                  role="menu"
                  aria-label="Pilih jenis setoran"
                  initial={{ opacity: 0, y: 18, scale: 0.82 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.72 }}
                >
                  {SETOR_ACTIONS.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        type="button"
                        role="menuitem"
                        key={action.tab}
                        className="p2-setor-dropup-item"
                        onClick={() => chooseSetor(action.tab)}
                        initial={{ opacity: 0, y: 14, scale: 0.82 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        transition={{
                          type: 'spring',
                          stiffness: 460,
                          damping: 28,
                          mass: 0.62,
                          delay: index * 0.045
                        }}
                      >
                        <span className="p2-setor-dropup-label">{action.label}</span>
                        <span className="p2-setor-dropup-icon" aria-hidden="true">
                          <Icon className="ui-icon-md" />
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              ref={fabRipple.elementRef}
              onClick={(event) => {
                fabRipple.createRipple(event);
                setIsActionSheetOpen(open => !open);
              }}
              className={`ripple-container p2-setor-fab ${isSetorActive ? 'is-active' : ''} ${isActionSheetOpen ? 'is-open' : ''}`}
              aria-label={isActionSheetOpen ? 'Tutup pilihan setoran' : 'Tambah Setoran Baru'}
              aria-haspopup="menu"
              aria-expanded={isActionSheetOpen}
              aria-controls="setor-dropup-menu"
              title={isActionSheetOpen ? 'Tutup pilihan setoran' : 'Tambah Setoran Baru'}
            >
              {isActionSheetOpen ? <X className="ui-icon-md stroke-[2.4]" /> : <Plus className="ui-icon-md stroke-[2.4]" />}
            </button>
            <span className={`p2-setor-label ${isSetorActive || isActionSheetOpen ? 'is-active' : ''}`}>Setor</span>
          </div>

          <NavButton
            label="Kelola"
            icon={Settings2}
            isActive={isManageActive}
            onClick={() => {
              setIsActionSheetOpen(false);
              setIsManageSheetOpen(true);
            }}
          />

          <NavButton
            label="Mushaf"
            icon={BookOpen}
            isActive={activeTab === 'mushaf'}
            onClick={() => {
              setIsActionSheetOpen(false);
              setActiveTab('mushaf');
            }}
          />
        </nav>
      </div>

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
