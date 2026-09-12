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
  GraduationCap,
  Eye,
  ChevronDown
} from 'lucide-react';
import { useRipple } from '../hooks/useRipple';
import { ManageActionSheet } from './ManageActionSheet';
import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';
import { storageService } from '../services/storageService';
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
  const isSetorActive =
    activeTab === 'ziyadah' ||
    activeTab === 'murojaah' ||
    activeTab === 'binnadzor' ||
    activeTab === 'pembelajaran';
  const isManageActive = activeTab === 'kelas' || activeTab === 'santri';

  // 1. Wali & Santri 3-Item Layout
  if (!isUstadz) {
    const items = [
      {
        id: 'dashboard' as ActiveTab,
        label: isWali ? 'Anak Saya' : 'Hafalan',
        icon: LayoutDashboard
      },
      { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: History },
      { id: 'mushaf' as ActiveTab, label: 'Mushaf', icon: BookOpen }
    ];

    return (
      <div className="fixed left-0 right-0 bottom-2.5 sm:bottom-3 z-40 px-3 pointer-events-none md:hidden select-none">
        <nav
          aria-label="Navigasi bawah"
          className="pointer-events-auto w-full max-w-[320px] mx-auto grid grid-cols-3 items-center p-1.5 rounded-[26px] bg-white/98 backdrop-blur-md border border-slate-200/95 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)]"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        >
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

  // 2. Ustadz / Admin 5-Item Layout with Elevated Center Setor Action
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
      const updated = await storageService.setProgramLiburanActive(
        nextStatus,
        'Ustadz / Admin'
      );
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
      {/* Backdrop for Setor Dropup Menu */}
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

      {/* Floating Mobile Navigation Dock */}
      <div className="fixed left-0 right-0 bottom-2.5 sm:bottom-3 z-40 px-3 pointer-events-none md:hidden select-none">
        <nav
          className="pointer-events-auto w-full max-w-[390px] mx-auto grid grid-cols-5 items-center px-1.5 py-1 rounded-[26px] bg-white/98 backdrop-blur-md border border-slate-200/95 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)]"
          aria-label="Navigasi bawah"
          style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
        >
          {/* 1. Beranda */}
          <NavButton
            label="Beranda"
            icon={LayoutDashboard}
            isActive={activeTab === 'dashboard'}
            onClick={() => navigateTo('dashboard')}
          />

          {/* 2. Riwayat */}
          <NavButton
            label="Riwayat"
            icon={History}
            isActive={activeTab === 'riwayat'}
            onClick={() => navigateTo('riwayat')}
          />

          {/* 3. CENTER SETOR (ELEVATED ACTION) */}
          <div className="relative flex flex-col items-center justify-end -mt-5">
            {/* Dropup Action Sheet */}
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
                  {/* Pantauan Liburan Toggle Banner */}
                  <motion.div
                    className="p2-setor-dropup-program"
                    role="group"
                    aria-label="Program Pantauan Liburan"
                    initial={{ opacity: 0, y: 14, scale: 0.82 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 28, mass: 0.62 }}
                  >
                    <button
                      type="button"
                      className="p2-setor-program-info"
                      onClick={openPantauanMonitor}
                      aria-haspopup="dialog"
                      aria-label="Buka rekap Program Pantauan Liburan"
                    >
                      <span className="p2-setor-program-icon" aria-hidden="true">
                        <Eye className="w-4 h-4" />
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
                      aria-label={
                        programLiburanActive
                          ? 'Nonaktifkan Program Pantauan Liburan'
                          : 'Aktifkan Program Pantauan Liburan'
                      }
                      className={`p2-setor-program-switch ${programLiburanActive ? 'is-active' : ''}`}
                      onClick={toggleProgramLiburan}
                      disabled={isProgramToggling}
                    >
                      <span className="p2-setor-program-switch-thumb" aria-hidden="true" />
                    </button>
                  </motion.div>

                  {/* Setor Options (Ziyadah, Muroja'ah, Binnadzor, Non-Tahfidz) */}
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
                          delay: (index + 1) * 0.045
                        }}
                      >
                        <span className="p2-setor-dropup-label">{action.label}</span>
                        <span className="p2-setor-dropup-icon" aria-hidden="true">
                          <Icon className="w-4 h-4" />
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signature Elevated FAB */}
            <button
              type="button"
              ref={fabRipple.elementRef}
              onClick={(event) => {
                fabRipple.createRipple(event);
                setIsManageSheetOpen(false);
                setIsActionSheetOpen(open => !open);
              }}
              className={`ripple-container relative w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white border-[3.5px] border-white transition-transform active:scale-95 cursor-pointer shadow-[0_10px_24px_rgba(4,120,87,0.32),0_2px_6px_rgba(15,23,42,0.08)] ${
                isActionSheetOpen
                  ? 'bg-gradient-to-tr from-emerald-900 to-emerald-800 rotate-90'
                  : isSetorActive
                  ? 'bg-gradient-to-tr from-emerald-800 to-emerald-700'
                  : 'bg-gradient-to-tr from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700'
              }`}
              aria-label={isActionSheetOpen ? 'Tutup pilihan setoran' : 'Tambah Setoran Baru'}
              aria-haspopup="menu"
              aria-expanded={isActionSheetOpen}
              aria-controls="setor-dropup-menu"
              title={isActionSheetOpen ? 'Tutup pilihan setoran' : 'Tambah Setoran Baru'}
            >
              {isActionSheetOpen ? (
                <X className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Plus className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>

            {/* Label below Setor */}
            <span
              className={`mt-1 text-[10px] font-extrabold tracking-tight transition-colors ${
                isSetorActive || isActionSheetOpen ? 'text-emerald-800' : 'text-slate-600'
              }`}
            >
              Setor
            </span>
          </div>

          {/* 4. Kelola (with ManageActionSheet for Kelas & Santri) */}
          <div className="relative">
            <ManageNavButton
              isManageSheetOpen={isManageSheetOpen}
              isActive={isManageActive}
              isOpen={isManageSheetOpen}
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

          {/* 5. Mushaf */}
          <NavButton
            label="Mushaf"
            icon={BookOpen}
            isActive={activeTab === 'mushaf'}
            onClick={() => navigateTo('mushaf')}
          />
        </nav>
      </div>

      {/* Pantauan Liburan Monitor Modal */}
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
      className={`ripple-container relative min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-emerald-50/90 text-emerald-800 font-bold'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-semibold'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex items-center justify-center">
        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-500'}`} />
      </span>
      <span className="text-[10px] leading-tight truncate max-w-[58px] text-center tracking-tight">
        {label}
      </span>
    </button>
  );
};

interface ManageNavButtonProps {
  isManageSheetOpen: boolean;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const ManageNavButton: React.FC<ManageNavButtonProps> = ({
  isManageSheetOpen,
  isActive,
  isOpen,
  onClick
}) => {
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      type="button"
      ref={ripple.elementRef}
      onClick={(event) => {
        ripple.createRipple(event);
        onClick();
      }}
      className={`ripple-container relative w-full min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
        isActive || isOpen
          ? 'bg-emerald-50/90 text-emerald-800 font-bold'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-semibold'
      }`}
      aria-label={isManageSheetOpen ? 'Tutup menu Kelola' : 'Buka menu Kelola'}
      aria-haspopup="menu"
      aria-expanded={isManageSheetOpen}
      aria-controls="manage-dropdown-menu"
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="flex items-center justify-center">
        <Settings2
          className={`w-5 h-5 ${
            isActive || isOpen ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-500'
          }`}
        />
      </span>
      <span className="flex items-center justify-center gap-0.5 text-[10px] leading-tight truncate max-w-[58px] tracking-tight">
        <span>Kelola</span>
        <ChevronDown
          className={`w-2.5 h-2.5 transition-transform duration-200 ${
            isManageSheetOpen ? 'rotate-180 text-emerald-700' : 'text-slate-400'
          }`}
          aria-hidden="true"
        />
      </span>
    </button>
  );
};
