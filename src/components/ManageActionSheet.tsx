import React from 'react';
import { ChevronRight, School, Users, X } from 'lucide-react';
import type { ActiveTab } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface ManageActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
}

const actions: Array<{
  tab: ActiveTab;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    tab: 'kelas',
    title: 'Kelola Kelas',
    subtitle: 'Atur kelas, musyrif, dan pembagian santri',
    icon: School
  },
  {
    tab: 'santri',
    title: 'Kelola Santri',
    subtitle: 'Data santri dan akun terkait',
    icon: Users
  }
];

export const ManageActionSheet: React.FC<ManageActionSheetProps> = ({ isOpen, onClose, onSelect }) => {
  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
      <div
        className="fixed inset-0 bg-slate-950/55 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-lg rounded-t-2xl border-t border-slate-200 bg-white ui-sheet-insets pt-2 animate-in slide-in-from-bottom-5 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-action-sheet-title"
        aria-describedby="manage-action-sheet-description"
        tabIndex={-1}
      >
        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-slate-300" />

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
          <div className="min-w-0">
            <h2 id="manage-action-sheet-title" className="text-sm font-bold leading-5 text-slate-900">
              Kelola Data
            </h2>
            <p id="manage-action-sheet-description" className="text-xs leading-4 text-slate-500">
              Pilih data operasional yang ingin dikelola
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup menu kelola"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 py-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                type="button"
                key={action.tab}
                onClick={() => {
                  onSelect(action.tab);
                  onClose();
                }}
                className="group flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">{action.title}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-slate-500">{action.subtitle}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};