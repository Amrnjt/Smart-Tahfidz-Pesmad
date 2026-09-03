import React from 'react';
import { User, ActiveTab } from '../types';
import { LayoutDashboard, CirclePlus as PlusCircle, RotateCw, History, BookOpen, Users, GraduationCap } from 'lucide-react';
import { useRipple } from '../hooks/useRipple';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab
}) => {
  if (!currentUser) return null;

  const role = currentUser.role;

  const ustadzItems: NavItem[] = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'ziyadah', label: 'Ziyadah', icon: PlusCircle },
    { id: 'murojaah', label: "Muroja'ah", icon: RotateCw },
    { id: 'riwayat', label: 'Riwayat', icon: History },
    { id: 'mushaf', label: 'Mushaf', icon: BookOpen },
    { id: 'santri', label: 'Santri & Akun', icon: Users },
    { id: 'kelas', label: 'Kelas', icon: GraduationCap }
  ];

  const waliItems: NavItem[] = [
    { id: 'dashboard', label: 'Anak Saya', icon: LayoutDashboard },
    { id: 'riwayat', label: 'Riwayat', icon: History },
    { id: 'mushaf', label: 'Mushaf', icon: BookOpen }
  ];

  const santriItems: NavItem[] = [
    { id: 'dashboard', label: 'Hafalan Saya', icon: LayoutDashboard },
    { id: 'riwayat', label: 'Riwayat Setoran', icon: History },
    { id: 'mushaf', label: 'Mushaf 30 Juz', icon: BookOpen }
  ];

  const items = role === 'Ustadz' ? ustadzItems : role === 'Wali' ? waliItems : santriItems;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg safe-bottom fade-in-up"
      style={{ animationDelay: '200ms' }}
    >
      <div className="flex justify-around items-center px-1 py-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <BottomNavItem
              key={item.id}
              item={item}
              isActive={isActive}
              onClick={() => setActiveTab(item.id)}
            />
          );
        })}
      </div>
    </nav>
  );
};

const BottomNavItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const ripple = useRipple<HTMLButtonElement>();
  const Icon = item.icon;

  return (
    <button
      ref={ripple.elementRef}
      onClick={(e) => { ripple.createRipple(e); onClick(); }}
      className={`ripple-container press-feedback flex flex-col items-center justify-center py-1.5 px-1 min-w-[48px] min-h-[44px] rounded-xl transition-all duration-200 ${
        isActive
          ? 'text-emerald-800 font-bold'
          : 'text-slate-500 font-medium'
      }`}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-emerald-100/80 text-emerald-800' : ''}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
    </button>
  );
};
