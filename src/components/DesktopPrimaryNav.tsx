import React from 'react';
import {
  LayoutDashboard,
  History,
  Plus,
  School,
  Users,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ActiveTab } from '../types';
import { useRipple } from '../hooks/useRipple';

interface DesktopPrimaryNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isUstadz: boolean;
  isSetorMenuOpen: boolean;
  onOpenSetorMenu: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  isSignatureAction?: boolean;
  hasPopup?: boolean;
  isExpanded?: boolean;
}

export const DesktopPrimaryNav: React.FC<DesktopPrimaryNavProps> = ({
  activeTab,
  setActiveTab,
  isUstadz,
  isSetorMenuOpen,
  onOpenSetorMenu
}) => {
  const isSetorActive = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'].includes(activeTab);

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Beranda',
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard')
    },
    {
      id: 'riwayat',
      label: 'Riwayat',
      icon: History,
      isActive: activeTab === 'riwayat',
      onClick: () => setActiveTab('riwayat')
    }
  ];

  if (isUstadz) {
    navItems.push({
      id: 'setor',
      label: 'Setor',
      icon: Plus,
      isActive: isSetorActive,
      onClick: onOpenSetorMenu,
      isSignatureAction: true,
      hasPopup: true,
      isExpanded: isSetorMenuOpen
    });

    navItems.push({
      id: 'kelas',
      label: 'Kelas',
      icon: School,
      isActive: activeTab === 'kelas',
      onClick: () => setActiveTab('kelas')
    });

    navItems.push({
      id: 'santri',
      label: 'Santri',
      icon: Users,
      isActive: activeTab === 'santri',
      onClick: () => setActiveTab('santri')
    });
  }

  navItems.push({
    id: 'mushaf',
    label: 'Mushaf',
    icon: BookOpen,
    isActive: activeTab === 'mushaf',
    onClick: () => setActiveTab('mushaf')
  });

  return (
    <div
      className="hidden md:flex justify-center items-center pt-2.5 pb-2 px-4 w-full select-none"
      data-app-chrome="primary-navigation"
    >
      {/* Floating Segmented Navigation Capsule */}
      <nav
        aria-label="Navigasi utama"
        className="relative inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_4px_16px_-2px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.03)]"
      >
        {navItems.map((item) => (
          <DesktopNavItem
            key={item.id}
            item={item}
          />
        ))}
      </nav>
    </div>
  );
};

interface DesktopNavItemProps {
  item: NavItemConfig;
}

const DesktopNavItem: React.FC<DesktopNavItemProps> = ({ item }) => {
  const ripple = useRipple<HTMLButtonElement>();
  const Icon = item.icon;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    ripple.createRipple(event);
    item.onClick();
  };

  // Signature Setor styling vs Standard Item styling
  const isSignature = item.isSignatureAction;
  const isActive = item.isActive;

  return (
    <button
      type="button"
      ref={ripple.elementRef}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      aria-haspopup={item.hasPopup ? 'dialog' : undefined}
      aria-expanded={item.isExpanded}
      className={`ripple-container relative min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 z-10 ${
        isSignature && !isActive
          ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-100/90 hover:text-emerald-900 shadow-2xs'
          : isActive
          ? 'text-white'
          : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50'
      }`}
    >
      {/* Sliding Active Pill Indicator */}
      {isActive && (
        <motion.span
          layoutId="desktop-active-nav-indicator"
          className="absolute inset-0 rounded-xl bg-emerald-700 shadow-xs border border-emerald-600/30 z-0"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 6px rgba(4, 120, 87, 0.25)'
          }}
          transition={{
            type: 'spring',
            stiffness: 460,
            damping: 34,
            mass: 0.65
          }}
        />
      )}

      {/* Item Icon */}
      <span className="relative z-10 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isSignature ? 'text-emerald-700' : 'text-slate-500'}`} />
      </span>

      {/* Item Label */}
      <span className="relative z-10 truncate tracking-tight">
        {isSignature ? `+ ${item.label}` : item.label}
      </span>
    </button>
  );
};
