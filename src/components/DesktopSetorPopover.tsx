import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import type { ActiveTab } from '../types';
import { SETOR_ACTIONS, SetorActionItem } from '../config/setorActions';
import { useRipple } from '../hooks/useRipple';

interface DesktopSetorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const DesktopSetorPopover: React.FC<DesktopSetorPopoverProps> = ({
  isOpen,
  onClose,
  onSelect,
  triggerRef
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; arrowOffset: number } | null>(null);

  const updatePosition = () => {
    const trigger = triggerRef?.current || document.getElementById('desktop-setor-button');
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const popoverWidth = Math.min(440, window.innerWidth - 32);
    const triggerCenter = rect.left + rect.width / 2;

    // Center popover on trigger, clamp within viewport edges
    const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, triggerCenter - popoverWidth / 2));
    const top = rect.bottom + 10;
    const arrowOffset = Math.max(20, Math.min(popoverWidth - 20, triggerCenter - left));

    setCoords({ top, left, arrowOffset });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      const trigger = triggerRef?.current || document.getElementById('desktop-setor-button');
      if (trigger && trigger.contains(target)) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        const trigger = triggerRef?.current || document.getElementById('desktop-setor-button');
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
  }, [isOpen, onClose, triggerRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Click-Catcher Layer (No dark backdrop) */}
          <div
            className="fixed inset-0 z-40 bg-transparent cursor-default select-none pointer-events-auto"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Anchored Command Popover */}
          <motion.div
            ref={popoverRef}
            id="desktop-setor-popover"
            role="dialog"
            aria-modal="false"
            aria-labelledby="desktop-setor-popover-title"
            aria-describedby="desktop-setor-popover-desc"
            style={{
              position: 'fixed',
              top: coords ? `${coords.top}px` : '72px',
              left: coords ? `${coords.left}px` : '50%',
              transform: coords ? 'none' : 'translateX(-50%)',
              width: 'min(440px, calc(100vw - 32px))',
              zIndex: 50
            }}
            className="p-4 sm:p-5 rounded-2xl bg-white/98 backdrop-blur-md border border-slate-200/90 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.04)] select-none pointer-events-auto"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Anchored Caret pointing up to trigger */}
            {coords && (
              <div
                className="absolute -top-1.5 w-3 h-3 rotate-45 bg-white border-l border-t border-slate-200/90 shadow-[-2px_-2px_4px_rgba(15,23,42,0.02)]"
                style={{ left: `${coords.arrowOffset}px`, transform: 'translateX(-50%) rotate(45deg)' }}
                aria-hidden="true"
              />
            )}

            {/* Popover Header */}
            <div className="pb-3 mb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3
                  id="desktop-setor-popover-title"
                  className="text-sm font-bold text-slate-900 leading-tight"
                >
                  Input Setoran
                </h3>
                <p
                  id="desktop-setor-popover-desc"
                  className="text-xs text-slate-500 mt-0.5 leading-snug"
                >
                  Pilih jenis pencatatan santri
                </p>
              </div>
            </div>

            {/* 2-Column Action Grid */}
            <div className="grid grid-cols-2 gap-2.5" role="menu" aria-label="Jenis Setoran">
              {SETOR_ACTIONS.map((action) => (
                <DesktopSetorItem
                  key={action.tab}
                  action={action}
                  onSelect={() => {
                    onSelect(action.tab);
                    onClose();
                  }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface DesktopSetorItemProps {
  action: SetorActionItem;
  onSelect: () => void;
}

const DesktopSetorItem: React.FC<DesktopSetorItemProps> = ({ action, onSelect }) => {
  const ripple = useRipple<HTMLButtonElement>();
  const Icon = action.icon;

  return (
    <button
      type="button"
      role="menuitem"
      ref={ripple.elementRef}
      onClick={(e) => {
        ripple.createRipple(e);
        onSelect();
      }}
      className={`ripple-container relative min-h-[68px] p-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-all duration-150 flex items-center gap-3 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${action.colorClasses.hoverBorder}`}
      aria-label={`${action.title}: ${action.subtitle}`}
    >
      {/* Icon Badge */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-150 group-hover:scale-105 ${action.colorClasses.iconBg}`}
      >
        <Icon className="w-5 h-5 text-white stroke-[2.2]" aria-hidden="true" />
      </div>

      {/* Texts */}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 truncate">
          {action.title}
        </div>
        <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
          {action.subtitle}
        </p>
      </div>

      {/* Subtle chevron */}
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
};
