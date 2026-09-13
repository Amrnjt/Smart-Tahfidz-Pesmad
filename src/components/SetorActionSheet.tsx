import React, { useLayoutEffect } from 'react';
import { ActiveTab } from '../types';
import { X, ChevronRight } from 'lucide-react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { SETOR_ACTIONS } from '../config/setorActions';

interface SetorActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
}

export const SetorActionSheet: React.FC<SetorActionSheetProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const handleSelectTab = (tab: ActiveTab) => {
    onSelect(tab);
    onClose();
  };

  const handleDismiss = () => {
    onClose();
  };

  const dialogRef = useAccessibleDialog(isOpen, handleDismiss);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const root = document.documentElement;
    const previousGutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = 'stable';
    const trigger = document.activeElement;
    const panel = dialogRef.current;
    if (trigger instanceof HTMLElement && panel) {
      const bounds = trigger.getBoundingClientRect();
      panel.style.setProperty('--setor-origin-x', `${(bounds.left + bounds.width / 2) / window.innerWidth * 100}%`);
      panel.style.setProperty('--setor-origin-y', bounds.top < window.innerHeight / 2 ? 'top' : 'bottom');
    }
    return () => { root.style.scrollbarGutter = previousGutter; };
  }, [isOpen, dialogRef]);

  if (!isOpen) return null;

  return (
    <div className="setor-sheet-root fixed inset-0 z-50 flex items-end justify-center md:p-6" data-state="open">
      <div
        className="setor-sheet-backdrop fixed inset-0 bg-slate-950/35"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="setor-sheet-panel relative z-10 w-full max-w-lg overflow-y-auto overscroll-contain bg-white rounded-t-3xl border border-slate-200 ui-sheet-insets pt-3 md:max-w-xl md:rounded-3xl md:pt-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="setor-action-sheet-title"
        aria-describedby="setor-action-sheet-description"
        tabIndex={-1}
      >
        <div className="w-9 h-1 bg-slate-300 rounded-full mx-auto mb-2 md:hidden" />

        <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="min-w-0">
            <h2 id="setor-action-sheet-title" className="text-sm font-bold text-slate-900 leading-5">Input Setoran Santri</h2>
            <p id="setor-action-sheet-description" className="text-xs text-slate-500 leading-4">
              Pilih jenis setoran untuk langsung mulai mengisi
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-11 min-w-11 -mr-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <section aria-labelledby="setor-primary-actions-title" className="py-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {SETOR_ACTIONS.map((act) => {
              const Icon = act.icon;

              return (
                <button
                  type="button"
                  key={act.tab}
                  onClick={() => handleSelectTab(act.tab)}
                  className="setor-sheet-action w-full min-h-[58px] px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2.5 text-left cursor-pointer group md:min-h-[72px] md:p-3"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${act.colorClasses.iconBg}`}
                  >
                    <Icon className="w-[19px] h-[19px]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {act.title}
                      </span>
                      {act.badge && (
                        <span
                          className={`text-xs leading-4 font-semibold px-1.5 rounded-md border whitespace-nowrap flex-shrink-0 ${act.colorClasses.badgeBg} ${act.colorClasses.badgeText} ${act.colorClasses.badgeBorder}`}
                        >
                          {act.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-4">
                      {act.subtitle}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};