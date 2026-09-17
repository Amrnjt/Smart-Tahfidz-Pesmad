import React from 'react';
import { BookOpen, History, LayoutDashboard } from 'lucide-react';
import type { ActiveTab } from '../types';
import { useRipple } from '../hooks/useRipple';

interface PimpinanBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const ITEMS: Array<{
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
  { id: 'riwayat', label: 'Riwayat', icon: History },
  { id: 'mushaf', label: 'Mushaf', icon: BookOpen },
];

export const PimpinanBottomNav: React.FC<PimpinanBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="fixed left-0 right-0 bottom-2.5 sm:bottom-3 z-40 px-3 pointer-events-none md:hidden select-none">
      <nav
        aria-label="Navigasi bawah Pimpinan"
        className="pointer-events-auto w-full max-w-[320px] mx-auto grid grid-cols-3 items-center p-1.5 rounded-[26px] bg-white/98 backdrop-blur-md border border-slate-200/95 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)]"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {ITEMS.map(item => (
          <PimpinanNavButton
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
};

interface PimpinanNavButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

const PimpinanNavButton: React.FC<PimpinanNavButtonProps> = ({
  label,
  icon: Icon,
  isActive,
  onClick,
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
      className={`ripple-container relative min-h-[48px] py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-emerald-50/90 text-emerald-800 font-bold'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 font-semibold'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700 stroke-[2.2]' : 'text-slate-500'}`} />
      <span className="text-[10px] leading-tight truncate max-w-[58px] text-center tracking-tight">
        {label}
      </span>
    </button>
  );
};
