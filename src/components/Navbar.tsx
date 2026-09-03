import React from 'react';
import { User, ActiveTab } from '../types';
import { LogOut, MapPin, RefreshCw } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';
import { useRipple } from '../hooks/useRipple';

interface NavbarProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onRefresh,
  isRefreshing = false
}) => {
  const brandRipple = useRipple<HTMLDivElement>();
  const syncRipple = useRipple<HTMLButtonElement>({ disabled: isRefreshing });
  const logoutRipple = useRipple<HTMLButtonElement>();

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-950/80 fade-in-up" style={{ animationDelay: '0ms' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand / Logo Section */}
        <div
          ref={brandRipple.elementRef}
          id="brand-logo-link"
          className="ripple-container flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group select-none flex-1 min-w-0"
          onClick={(e) => { brandRipple.createRipple(e); if (currentUser) setActiveTab('dashboard'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { brandRipple.createRipple(e); if (currentUser) setActiveTab('dashboard'); } }}
          role="button"
          tabIndex={0}
          aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <PesmadLogo size="md" className="w-full h-full" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white leading-tight truncate">
                Tahfidz al-Qur'an <span className="text-emerald-200 font-semibold hidden sm:inline">Pesantren Madrasah Darul Fikri</span>
                <span className="text-emerald-200 font-semibold sm:hidden">PMDF</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-200 border border-emerald-600 uppercase tracking-wide hidden md:inline-block">
                MTsN 3 Bojonegoro
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-300/90 font-medium flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
            </p>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {onRefresh && (
                <button
                  ref={syncRipple.elementRef}
                  onClick={(e) => { syncRipple.createRipple(e); if (!isRefreshing) onRefresh(); }}
                  disabled={isRefreshing}
                  className={`ripple-container press-feedback p-2 rounded-xl bg-emerald-950/80 text-emerald-200 border border-emerald-800/80 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    isRefreshing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-800/80 hover:text-white transition-colors'
                  }`}
                  title="Sinkronkan & Muat Ulang Data Firestore"
                  aria-label="Sinkronkan Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
                  <span className="hidden xl:inline text-[11px]">
                    {isRefreshing ? 'Memuat...' : 'Sync Data'}
                  </span>
                </button>
              )}

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
                    {currentUser.role === 'Ustadz' && '🛡️ Ustadz'}
                    {currentUser.role === 'Wali' && '👨‍👩‍👧 Wali Santri'}
                    {currentUser.role === 'Santri' && '📖 Santri (View-Only)'}
                  </span>
                </div>
              </div>

              <button
                ref={logoutRipple.elementRef}
                id="btn-header-logout"
                onClick={(e) => { logoutRipple.createRipple(e); onLogout(); }}
                className="ripple-container press-feedback p-2 rounded-xl bg-emerald-950/80 text-emerald-200 border border-emerald-800/80 cursor-pointer hover:bg-rose-900/80 hover:text-rose-200 transition-colors"
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
