import React, { useEffect } from 'react';
import { ActiveTab } from '../types';
import { CirclePlus as PlusCircle, RotateCw, BookOpenCheck, BookOpen, X, ChevronRight } from 'lucide-react';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      tab: 'ziyadah' as ActiveTab,
      title: 'Ziyadah',
      subtitle: 'Setoran hafalan baru per ayat & surah',
      badge: 'Bil-Ghoib (Hafalan)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: PlusCircle,
      iconBg: 'bg-emerald-600 text-white',
      borderHover: 'hover:border-emerald-500 hover:bg-emerald-50/50'
    },
    {
      tab: 'murojaah' as ActiveTab,
      title: "Muroja'ah",
      subtitle: 'Pengulangan hafalan agar tetap mutqin & lancar',
      badge: 'Bil-Ghoib (Pengulangan)',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      icon: RotateCw,
      iconBg: 'bg-teal-600 text-white',
      borderHover: 'hover:border-teal-500 hover:bg-teal-50/50'
    },
    {
      tab: 'binnadzor' as ActiveTab,
      title: 'Binnadzor',
      subtitle: 'Setoran membaca al-Qur\'an dengan melihat mushaf',
      badge: 'Bin-Nadzor (Melihat Mushaf)',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: BookOpenCheck,
      iconBg: 'bg-indigo-600 text-white',
      borderHover: 'hover:border-indigo-500 hover:bg-indigo-50/50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Action Sheet Panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/90 z-10 pb-8 pt-3 px-5 animate-in slide-in-from-bottom-5 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Pilih Jenis Setoran"
      >
        {/* Pull bar indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Input Setoran Santri</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pilih jenis setoran hafalan atau tadarrus yang disimak</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action List */}
        <div className="py-3 space-y-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.tab}
                onClick={() => {
                  onSelect(act.tab);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border border-slate-200/90 bg-white transition-all flex items-center justify-between group text-left cursor-pointer shadow-xs ${act.borderHover}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${act.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{act.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${act.badgeColor}`}>
                        {act.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{act.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Quick Mushaf Navigation */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onSelect('mushaf');
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-900 py-1.5 px-2 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Buka Mushaf Digital 30 Juz</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
