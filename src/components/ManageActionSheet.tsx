import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Users, Eye, ChevronRight } from 'lucide-react';
import type { ActiveTab } from '../types';
import { useRipple } from '../hooks/useRipple';

interface ManageActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
  onOpenPantauanLiburan: () => void;
  activeTab?: ActiveTab;
}

export const ManageActionSheet: React.FC<ManageActionSheetProps> = ({
  isOpen,
  onClose,
  onSelect,
  onOpenPantauanLiburan,
  activeTab
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const kelasRipple = useRipple<HTMLButtonElement>();
  const santriRipple = useRipple<HTMLButtonElement>();
  const pantauanRipple = useRipple<HTMLButtonElement>();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // Do nothing if clicking inside the popover
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      // Do nothing if clicking the Kelola trigger button (it handles its own toggle)
      const trigger = document.getElementById('kelola-nav-button');
      if (trigger && trigger.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        const trigger = document.getElementById('kelola-nav-button');
        if (trigger instanceof HTMLElement) {
          trigger.focus();
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const chooseAction = (
    event: React.MouseEvent<HTMLButtonElement>,
    tab: ActiveTab,
    rippleHandler: (e: React.MouseEvent<HTMLButtonElement>) => void
  ) => {
    rippleHandler(event);
    onSelect(tab);
    onClose();
  };

  const handlePantauanClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    pantauanRipple.createRipple(event);
    onOpenPantauanLiburan();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent outside-click capture layer (no dark modal backdrop) */}
          <div
            className="fixed inset-0 z-30 bg-transparent cursor-default select-none pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Anchored Mini Popover */}
          <motion.div
            ref={popoverRef}
            id="manage-popover-menu"
            role="menu"
            aria-label="Pilihan Kelola & Administrasi"
            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 w-[238px] p-1.5 rounded-2xl bg-white/98 backdrop-blur-md border border-slate-200/90 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.05)] flex flex-col pointer-events-auto select-none"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Anchored Caret Arrow pointing to Kelola */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white border-r border-b border-slate-200/90 shadow-[2px_2px_4px_rgba(15,23,42,0.03)]"
              aria-hidden="true"
            />

            {/* Row 1: 2 Kolom (Kelas | Santri) */}
            <div className="flex items-center justify-between w-full h-[44px]">
              {/* Option 1: Kelas */}
              <button
                type="button"
                role="menuitem"
                id="manage-option-kelas"
                ref={kelasRipple.elementRef}
                onClick={(e) => chooseAction(e, 'kelas', kelasRipple.createRipple)}
                className={`ripple-container relative z-10 flex-1 h-full min-h-[42px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  activeTab === 'kelas'
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold active:bg-slate-100'
                }`}
                aria-label="Buka Kelola Kelas"
                tabIndex={0}
              >
                <School
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    activeTab === 'kelas' ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Kelas</span>
              </button>

              {/* Subtle Vertical Divider */}
              <div
                className="relative z-10 w-[1px] h-5 bg-slate-200/80 mx-1 shrink-0"
                aria-hidden="true"
              />

              {/* Option 2: Santri */}
              <button
                type="button"
                role="menuitem"
                id="manage-option-santri"
                ref={santriRipple.elementRef}
                onClick={(e) => chooseAction(e, 'santri', santriRipple.createRipple)}
                className={`ripple-container relative z-10 flex-1 h-full min-h-[42px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  activeTab === 'santri'
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold active:bg-slate-100'
                }`}
                aria-label="Buka Kelola Santri"
                tabIndex={0}
              >
                <Users
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    activeTab === 'santri' ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">Santri</span>
              </button>
            </div>

            {/* Subtle Horizontal Divider */}
            <div className="w-full h-[1px] bg-slate-100 my-1" aria-hidden="true" />

            {/* Row 2: Full Width (Pantauan Liburan) */}
            <button
              type="button"
              role="menuitem"
              id="manage-option-pantauan"
              ref={pantauanRipple.elementRef}
              onClick={handlePantauanClick}
              className="ripple-container relative z-10 w-full min-h-[42px] px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left text-xs transition-all duration-150 cursor-pointer text-slate-700 hover:text-emerald-900 hover:bg-emerald-50/70 active:bg-emerald-100/60 font-semibold group"
              aria-label="Buka Rekap Pantauan Liburan"
              tabIndex={0}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60 group-hover:bg-emerald-100/80 transition-colors">
                  <Eye className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <span className="block font-bold text-slate-800 group-hover:text-emerald-950 text-xs leading-tight truncate">
                    Pantauan Liburan
                  </span>
                  <span className="block text-[10px] text-slate-500 font-normal leading-tight truncate">
                    Monitoring & amaliyah
                  </span>
                </div>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" aria-hidden="true" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
