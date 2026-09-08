import React, { useState } from 'react';
import { User, ActiveTab, Santri } from '../types';
import { LayoutDashboard, History, Users, GraduationCap, Plus, BookOpen } from 'lucide-react';
import { useRipple } from '../hooks/useRipple';
import { SetorActionSheet } from './SetorActionSheet';
import type { NotifyFn } from './Snackbar';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  santriList: Santri[];
  onNotify: NotifyFn;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  santriList,
  onNotify
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const fabRipple = useRipple<HTMLButtonElement>();

  if (!currentUser) return null;

  const roleStr = String(currentUser.role || '').trim().toLowerCase();
  const isWali = roleStr === 'wali' || roleStr.includes('wali');
  const isSantri = roleStr === 'santri';
  const isUstadz = !isWali && !isSantri;
  const isSetorActive = activeTab === 'ziyadah' || activeTab === 'murojaah' || activeTab === 'binnadzor' || activeTab === 'pembelajaran';

  // Wali & Santri view-only bottom nav
  if (!isUstadz) {
    const nonUstadzItems = [
      { id: 'dashboard' as ActiveTab, label: isWali ? 'Anak Saya' : 'Hafalan', icon: LayoutDashboard },
      { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: History },
      { id: 'mushaf' as ActiveTab, label: 'Mushaf 30 Juz', icon: BookOpen }
    ];

    return (
      <nav aria-label="Navigasi bawah" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {nonUstadzItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`press-feedback min-h-14 flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive ? 'text-emerald-900 font-semibold' : 'text-slate-500 font-medium'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs tracking-tight mt-0.5">{item.label}</span>
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
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
          <div className="flex flex-col items-center justify-center relative -top-3 px-0.5">
            <button
              type="button"
              ref={fabRipple.elementRef}
              onClick={(e) => {
                fabRipple.createRipple(e);
                setIsActionSheetOpen(true);
              }}
              className={`ripple-container relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                isSetorActive
                  ? 'bg-emerald-950'
                  : 'bg-emerald-800 hover:bg-emerald-700'
              }`}
              aria-label="Tambah Setoran Baru"
              aria-haspopup="dialog"
              aria-expanded={isActionSheetOpen}
              title="Tambah Setoran Baru"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className={`text-xs tracking-tight font-semibold mt-1 ${isSetorActive ? 'text-emerald-800' : 'text-slate-600'}`}>
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
        santriList={santriList}
        onNotify={onNotify}
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
      type="button"
      ref={ripple.elementRef}
      onClick={(e) => {
        ripple.createRipple(e);
        onClick();
      }}
      className={`ripple-container press-feedback min-h-14 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors cursor-pointer min-w-0 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isActive ? 'text-emerald-900 font-semibold' : 'text-slate-500 font-medium hover:text-slate-700'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs tracking-tight mt-0.5 truncate w-full text-center">{label}</span>
    </button>
  );
};
