import React from 'react';
import { User, ActiveTab } from '../types';
import { LogOut, MapPin } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';

interface NavbarProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-950/80">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between">
        {/* Brand / Logo Section with Responsive Clean Layout */}
        <div
          id="brand-logo-link"
          className="flex items-center space-x-3 cursor-pointer group select-none"
          onClick={() => currentUser && setActiveTab('dashboard')}
          role="button"
          tabIndex={0}
          aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
        >
          {/* Logo Container - Pure Transparent SVG Icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <PesmadLogo size="md" className="w-full h-full" />
          </div>

          {/* Typography Brand Title & Subtitle */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white leading-tight">
                Tahfidz al-Qur'an <span className="text-emerald-200 font-semibold">Pesantren Madrasah Darul Fikri</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-200 border border-emerald-600 uppercase tracking-wide hidden md:inline-block">
                MTsN 3 Bojonegoro
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
            </p>
          </div>
        </div>

        {/* Right Action Items & User Role Badge */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">{currentUser.nama}</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    currentUser.role === 'Ustadz' 
                      ? 'bg-emerald-700 text-emerald-100 border border-emerald-600' 
                      : currentUser.role === 'Wali'
                      ? 'bg-teal-700 text-teal-100 border border-teal-600'
                      : 'bg-cyan-700 text-cyan-100 border border-cyan-600'
                  }`}>
                    {currentUser.role === 'Ustadz' && '🛡️ Ustadz (Admin)'}
                    {currentUser.role === 'Wali' && '👨‍👩‍👧 Wali Santri'}
                    {currentUser.role === 'Santri' && '📖 Santri (View-Only)'}
                  </span>
                </div>
              </div>

              <button
                id="btn-header-logout"
                onClick={onLogout}
                className="p-2 rounded-xl bg-emerald-950/80 hover:bg-rose-900/80 text-emerald-200 hover:text-rose-200 transition-colors border border-emerald-800/80 cursor-pointer"
                title="Keluar Akun"
                aria-label="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-emerald-200/90 font-medium hidden sm:block px-3 py-1 rounded-lg bg-emerald-800/50 border border-emerald-700/50">
              Sistem Mutaba'ah Tahfidz
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
