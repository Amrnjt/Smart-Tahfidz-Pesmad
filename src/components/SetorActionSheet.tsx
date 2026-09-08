import React, { useState } from 'react';
import { ActiveTab, Santri } from '../types';
import {
  BookPlus,
  RotateCw,
  BookOpenCheck,
  BookOpen,
  X,
  ChevronRight,
  GraduationCap,
  Eye
} from 'lucide-react';
import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';
import type { NotifyFn } from './Snackbar';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface SetorActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
  santriList?: Santri[];
  onNotify: NotifyFn;
}

export const SetorActionSheet: React.FC<SetorActionSheetProps> = ({
  isOpen,
  onClose,
  onSelect,
  santriList = [],
  onNotify
}) => {
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const actions = [
    {
      tab: 'ziyadah' as ActiveTab,
      title: 'Ziyadah',
      subtitle: 'Hafalan baru',
      badge: 'Bil-Ghoib',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: BookPlus,
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      tab: 'murojaah' as ActiveTab,
      title: "Muroja'ah",
      subtitle: 'Pengulangan hafalan',
      badge: 'Pengulangan',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: RotateCw,
      iconBg: 'bg-teal-600 text-white'
    },
    {
      tab: 'binnadzor' as ActiveTab,
      title: 'Binnadzor',
      subtitle: 'Tilawah, tajwid & makhraj',
      badge: 'Bin-Nadzor',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: BookOpenCheck,
      iconBg: 'bg-indigo-600 text-white'
    },
    {
      tab: 'pembelajaran' as ActiveTab,
      title: 'Non-Tahfidz',
      subtitle: 'Jilid Ummi & kelas istimewa',
      badge: 'Pembelajaran',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: GraduationCap,
      iconBg: 'bg-amber-600 text-white'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <div
        className="fixed inset-0 bg-slate-950/55 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-lg max-h-[88dvh] overflow-y-auto overscroll-contain bg-white rounded-t-2xl border-t border-slate-200 ui-sheet-insets pt-2 animate-in slide-in-from-bottom-5 duration-200 md:max-w-2xl md:max-h-[calc(100dvh-2rem)] md:rounded-2xl md:border md:border-slate-200 md:pt-3 md:shadow-xl"
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
            onClick={onClose}
            className="min-h-11 min-w-11 -mr-1 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <section aria-labelledby="setor-primary-actions-title" className="py-3">
          <div className="mb-2 px-0.5">
            <h3 id="setor-primary-actions-title" className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              Jenis setoran
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {actions.map((act) => {
              const Icon = act.icon;

              return (
                <button
                  type="button"
                  key={act.tab}
                  onClick={() => {
                    onSelect(act.tab);
                    onClose();
                  }}
                  className="w-full min-h-[58px] px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2.5 text-left cursor-pointer group md:min-h-[72px] md:p-3"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${act.iconBg}`}
                  >
                    <Icon className="w-[19px] h-[19px]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {act.title}
                      </span>
                      <span
                        className={`text-xs leading-4 font-semibold px-1.5 rounded-md border whitespace-nowrap flex-shrink-0 ${act.badgeColor}`}
                      >
                        {act.badge}
                      </span>
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

        <section aria-labelledby="setor-supporting-actions-title" className="border-t border-slate-100 py-3">
          <div className="mb-2 px-0.5">
            <h3 id="setor-supporting-actions-title" className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              Fitur pendukung
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowMonitorModal(true)}
            aria-haspopup="dialog"
            aria-expanded={showMonitorModal}
            className="group flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-slate-300 hover:bg-slate-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 border border-slate-200">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">Kelola Pantauan Liburan</span>
              <span className="mt-0.5 block text-xs text-slate-500">Aktif/nonaktifkan program dan lihat rekap Wali</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        </section>

        <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onSelect('mushaf');
              onClose();
            }}
            className="min-h-11 flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mushaf Digital</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {showMonitorModal && (
        <PantauanLiburanMonitorModal
          isOpen={showMonitorModal}
          onClose={() => setShowMonitorModal(false)}
          santriList={santriList}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};