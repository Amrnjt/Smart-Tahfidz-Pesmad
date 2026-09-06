import React, { useEffect, useState } from 'react';
import { ActiveTab, Santri } from '../types';
import { storageService } from '../services/storageService';
import { CirclePlus as PlusCircle, RotateCw, BookOpenCheck, BookOpen, X, ChevronRight, GraduationCap, ToggleLeft, ToggleRight, Sparkles, Eye } from 'lucide-react';
import { PantauanLiburanMonitorModal } from './PantauanLiburanMonitorModal';

interface SetorActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tab: ActiveTab) => void;
  santriList?: Santri[];
}

export const SetorActionSheet: React.FC<SetorActionSheetProps> = ({
  isOpen,
  onClose,
  onSelect,
  santriList = []
}) => {
  const [isProgramLiburanActive, setIsProgramLiburanActive] = useState(false);
  const [isTogglingLiburan, setIsTogglingLiburan] = useState(false);
  const [showMonitorModal, setShowMonitorModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = storageService.getAppConfig();
      setIsProgramLiburanActive(config.programLiburanActive);
    }
  }, [isOpen]);

  const handleToggleLiburan = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTogglingLiburan(true);
    const nextState = !isProgramLiburanActive;
    try {
      await storageService.setProgramLiburanActive(nextState, 'Ustadz / Admin');
      setIsProgramLiburanActive(nextState);
    } catch (err) {
      console.error('Failed to toggle program liburan:', err);
    } finally {
      setIsTogglingLiburan(false);
    }
  };

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
      subtitle: 'Setoran tilawah Al-Qur\'an (Fokus Tajwid & Makhroj)',
      badge: 'Bin-Nadzor (Melihat Mushaf)',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: BookOpenCheck,
      iconBg: 'bg-indigo-600 text-white',
      borderHover: 'hover:border-indigo-500 hover:bg-indigo-50/50'
    },
    {
      tab: 'pembelajaran' as ActiveTab,
      title: 'Pembelajaran Non-Tahfidz',
      subtitle: 'Materi Jilid Ummi Dewasa & Pendampingan Kelas Istimewa',
      badge: 'Jilid Ummi & Kelas Istimewa',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      icon: GraduationCap,
      iconBg: 'bg-amber-600 text-white',
      borderHover: 'hover:border-amber-500 hover:bg-amber-50/50'
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

        {/* Remote Pengendali Program Pantauan Liburan Santri (Mobile) */}
        <div className={`mt-3 p-3.5 rounded-2xl border transition-all ${
          isProgramLiburanActive
            ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-700 shadow-sm'
            : 'bg-slate-100 text-slate-800 border-slate-200'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌴</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold leading-tight">Program Pantauan Liburan</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isProgramLiburanActive
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                      : 'bg-slate-200 text-slate-600 border border-slate-300'
                  }`}>
                    {isProgramLiburanActive ? '🟢 ON (Aktif)' : '⚪ OFF'}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-snug ${isProgramLiburanActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                  {isProgramLiburanActive
                    ? 'Dasbor Wali aktif menginput wirid & shalat jama\'ah'
                    : 'Fitur amaliyah di dasbor wali terkunci / nonaktif'}
                </p>
              </div>
            </div>

            {/* Interactive Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleLiburan}
              disabled={isTogglingLiburan}
              title={isProgramLiburanActive ? 'Matikan Program Liburan' : 'Nyalakan Program Liburan'}
              className={`press-feedback p-1.5 rounded-xl cursor-pointer transition flex items-center justify-center flex-shrink-0 ${
                isProgramLiburanActive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-md ring-2 ring-emerald-300/40'
                  : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
              }`}
            >
              {isProgramLiburanActive ? (
                <ToggleRight className="w-7 h-7" />
              ) : (
                <ToggleLeft className="w-7 h-7" />
              )}
            </button>
          </div>

          {/* View Rekap Quick Button for Ustadz */}
          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between">
            <span className="text-[10px] opacity-80">Ustadz hanya memantau tanpa meng-input</span>
            <button
              type="button"
              onClick={() => setShowMonitorModal(true)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                isProgramLiburanActive
                  ? 'bg-white/15 hover:bg-white/25 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lihat Rekap Liburan</span>
            </button>
          </div>
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

      {/* Monitor Modal */}
      {showMonitorModal && (
        <PantauanLiburanMonitorModal
          isOpen={showMonitorModal}
          onClose={() => setShowMonitorModal(false)}
          santriList={santriList}
        />
      )}
    </div>
  );
};
