import React from 'react';
import {
  BookPlus,
  RotateCw,
  BookOpenCheck,
  GraduationCap,
  BookOpen,
  History,
  Users,
  CalendarCheck,
  PlusCircle,
  LucideIcon,
} from 'lucide-react';
import { ActiveTab, UserRole } from '../../types';
import { useRipple } from '../../hooks/useRipple';

interface QuickActionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  primary?: boolean;
  color?: string;
  badge?: string;
}

interface CompactQuickActionsProps {
  userRole: UserRole | string;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSetorMenu?: () => void;
  programLiburanActive?: boolean;
  onJumpToPantauanLiburan?: () => void;
  onJumpToAttention?: () => void;
  attentionCount?: number;
}

export const CompactQuickActions: React.FC<CompactQuickActionsProps> = ({
  userRole,
  setActiveTab,
  onOpenSetorMenu,
  programLiburanActive,
  onJumpToPantauanLiburan,
  onJumpToAttention,
  attentionCount = 0,
}) => {
  const roleLower = String(userRole || '').toLowerCase();
  const isWali = roleLower.includes('wali');
  const isSantri = roleLower === 'santri';
  const isUstadzOrAdmin = !isWali && !isSantri;

  const actions: QuickActionItem[] = [];

  if (isUstadzOrAdmin) {
    if (onOpenSetorMenu) {
      actions.push({
        id: 'input-setor',
        label: 'Input Setoran',
        icon: PlusCircle,
        onClick: onOpenSetorMenu,
        primary: true,
      });
    }
    actions.push({
      id: 'ziyadah',
      label: 'Ziyadah',
      icon: BookPlus,
      onClick: () => setActiveTab('ziyadah'),
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    });
    actions.push({
      id: 'murojaah',
      label: "Muroja'ah",
      icon: RotateCw,
      onClick: () => setActiveTab('murojaah'),
      color: 'text-teal-700 bg-teal-50 border-teal-200/80',
    });
    actions.push({
      id: 'binnadzor',
      label: 'Binnadzor',
      icon: BookOpenCheck,
      onClick: () => setActiveTab('binnadzor'),
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
    });
    actions.push({
      id: 'pembelajaran',
      label: 'Pembelajaran',
      icon: GraduationCap,
      onClick: () => setActiveTab('pembelajaran'),
      color: 'text-amber-700 bg-amber-50 border-amber-200/80',
    });
    actions.push({
      id: 'santri',
      label: 'Data Santri',
      icon: Users,
      onClick: () => setActiveTab('santri'),
    });
    actions.push({
      id: 'mushaf',
      label: 'Mushaf 30 Juz',
      icon: BookOpen,
      onClick: () => setActiveTab('mushaf'),
    });
    actions.push({
      id: 'riwayat',
      label: 'Riwayat Setoran',
      icon: History,
      onClick: () => setActiveTab('riwayat'),
    });
  } else if (isWali) {
    if (programLiburanActive && onJumpToPantauanLiburan) {
      actions.push({
        id: 'pantauan-liburan',
        label: 'Pantauan Liburan',
        icon: CalendarCheck,
        onClick: onJumpToPantauanLiburan,
        primary: true,
        badge: 'Aktif',
      });
    }
    actions.push({
      id: 'riwayat',
      label: 'Riwayat Lengkap',
      icon: History,
      onClick: () => setActiveTab('riwayat'),
      primary: !programLiburanActive,
    });
    actions.push({
      id: 'mushaf',
      label: 'Mushaf 30 Juz',
      icon: BookOpen,
      onClick: () => setActiveTab('mushaf'),
    });
  } else {
    // Santri
    actions.push({
      id: 'riwayat',
      label: 'Riwayat Saya',
      icon: History,
      onClick: () => setActiveTab('riwayat'),
      primary: true,
    });
    actions.push({
      id: 'mushaf',
      label: 'Mushaf 30 Juz',
      icon: BookOpen,
      onClick: () => setActiveTab('mushaf'),
    });
  }

  return (
    <div className="ui-bento-card p-3 sm:p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Aksi Cepat
        </p>
        {attentionCount > 0 && onJumpToAttention && (
          <button
            type="button"
            onClick={onJumpToAttention}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {attentionCount} Perlu Tindak Lanjut
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {actions.map((act) => (
          <ActionButton key={act.id} action={act} />
        ))}
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ action: QuickActionItem }> = ({ action }) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();
  const Icon = action.icon;

  if (action.primary) {
    return (
      <button
        ref={elementRef}
        type="button"
        onClick={(e) => {
          createRipple(e);
          action.onClick();
        }}
        className="ripple-container inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{action.label}</span>
        {action.badge && (
          <span className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-200">
            {action.badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      ref={elementRef}
      type="button"
      onClick={(e) => {
        createRipple(e);
        action.onClick();
      }}
      className={`ripple-container inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        action.color || ''
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{action.label}</span>
    </button>
  );
};
