import React, { useState } from 'react';
import { User, ActiveTab } from '../types';
import { LayoutDashboard, History, Users, GraduationCap, Plus, BookOpen } from 'lucide-react';
import { useRipple } from '../hooks/useRipple';
import { SetorActionSheet } from './SetorActionSheet';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const fabRipple = useRipple<HTMLButtonElement>();

  if (!currentUser) return null;

  const role = currentUser.role;
  const isSetorActive = activeTab === 'ziyadah' || activeTab === 'murojaah' || activeTab === 'binnadzor';

  // Wali & Santri view-only bottom nav
  if (role !== 'Ustadz') {
    const isWali = role === 'Wali';
    const nonUstadzItems = [
      { id: 'dashboard' as ActiveTab, label: isWali ? 'Anak Saya' : 'Hafalan', icon: LayoutDashboard },
      { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: History },
      { id: 'mushaf' as ActiveTab, label: 'Mushaf 30 Juz', icon: BookOpen }
    ];

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-[18px] border-t border-slate-200/80 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {nonUstadzItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`press-feedback flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 active:scale-[0.985] ${
                  isActive ? 'text-emerald-800 font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Ustadz: Option 1 (4 Compact Items + 1 Central Floating Action Button)
  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-[18px] border-t border-slate-200/80 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] px-1 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
        aria-label="Navigasi Bawah"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center">
          {/* 1. Beranda */}
          <NavButton
            label="Beranda"
            icon={LayoutDashboard}
            isActive={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />

          {/* 2. Riwayat */}
          <NavButton
            label="Riwayat"
            icon={History}
            isActive={activeTab === 'riwayat'}
            onClick={() => setActiveTab('riwayat')}
          />

          {/* 3. Central FAB: + Setor */}
          <div className="flex flex-col items-center justify-center relative -top-3.5 px-0.5">
            <button
              ref={fabRipple.elementRef}
              onClick={(e) => {
                fabRipple.createRipple(e);
                setIsActionSheetOpen(true);
              }}
              className={`ripple-container relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-150 cursor-pointer active:scale-[0.985] ${
                isSetorActive
                  ? 'bg-gradient-to-tr from-emerald-700 to-teal-600 ring-4 ring-emerald-200/80 shadow-emerald-700/25'
                  : 'bg-gradient-to-tr from-emerald-800 to-emerald-600 hover:from-emerald-700 hover:to-emerald-500 shadow-emerald-900/25'
              }`}
              aria-label="Tambah Setoran Baru"
              title="Tambah Setoran Baru"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className={`text-[10px] tracking-tight font-bold mt-1 ${isSetorActive ? 'text-emerald-800' : 'text-slate-600'}`}>
              Setor
            </span>
          </div>

          {/* 4. Kelas */}
          <NavButton
            label="Kelas"
            icon={GraduationCap}
            isActive={activeTab === 'kelas'}
            onClick={() => setActiveTab('kelas')}
          />

          {/* 5. Santri */}
          <NavButton
            label="Santri"
            icon={Users}
            isActive={activeTab === 'santri'}
            onClick={() => setActiveTab('santri')}
          />
        </div>
      </nav>

      {/* Action Sheet Setoran */}
      <SetorActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        onSelect={(tab) => setActiveTab(tab)}
      />
    </>
  );
};

interface NavButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon: Icon, isActive, onClick }) => {
  const ripple = useRipple<HTMLButtonElement>();

  return (
    <button
      ref={ripple.elementRef}
      onClick={(e) => {
        ripple.createRipple(e);
        onClick();
      }}
      className={`ripple-container press-feedback flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 cursor-pointer min-w-0 w-full active:scale-[0.985] ${
        isActive ? 'text-emerald-800 font-bold' : 'text-slate-500 font-medium hover:text-slate-700'
      }`}
      aria-label={label}
    >
      <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-emerald-100/90 text-emerald-800' : ''}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] tracking-tight mt-0.5 truncate w-full text-center">{label}</span>
    </button>
  );
};
