import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveTab } from '../types';
import { LogOut, MapPin, RefreshCw, BookOpen, ChevronDown, UserCheck, Shield, Sparkles } from 'lucide-react';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Compute initials from user name
  const userInitials = currentUser?.nama
    ? currentUser.nama
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const roleBadgeConfig = {
    Ustadz: {
      label: 'Ustadz',
      bg: 'bg-emerald-700/90 text-emerald-100 border-emerald-500/70',
      avatarBg: 'bg-emerald-700 border-emerald-400 text-white'
    },
    Wali: {
      label: 'Wali Santri',
      bg: 'bg-teal-700/90 text-teal-100 border-teal-500/70',
      avatarBg: 'bg-teal-700 border-teal-400 text-white'
    },
    Santri: {
      label: 'Santri',
      bg: 'bg-cyan-700/90 text-cyan-100 border-cyan-500/70',
      avatarBg: 'bg-cyan-700 border-cyan-400 text-white'
    }
  };

  const currentRoleStyle = currentUser ? roleBadgeConfig[currentUser.role] : roleBadgeConfig.Ustadz;

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-emerald-900/95 backdrop-blur-md text-white shadow-sm border-b border-emerald-950/80 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand / Logo Section */}
        <div
          ref={brandRipple.elementRef}
          id="brand-logo-link"
          className="ripple-container flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group flex-1 min-w-0"
          onClick={(e) => { brandRipple.createRipple(e); if (currentUser) setActiveTab('dashboard'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { brandRipple.createRipple(e); if (currentUser) setActiveTab('dashboard'); } }}
          role="button"
          tabIndex={0}
          aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
            <PesmadLogo size="md" className="w-full h-full" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white leading-tight truncate">
                Pesmad <span className="text-emerald-300 font-semibold">Tahfidz</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-800/90 text-emerald-200 border border-emerald-600/70 tracking-tight">
                MTsN 3 Bojonegoro
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-300/80 font-medium hidden sm:flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">Jl. Budi Utomo No. 190 Kepohbaru</span>
            </p>
          </div>
        </div>

        {/* Right Section: Sync + User Profile Dropdown */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2.5" ref={profileMenuRef}>
              {/* Quick Sync Button */}
              {onRefresh && (
                <button
                  ref={syncRipple.elementRef}
                  onClick={(e) => { syncRipple.createRipple(e); if (!isRefreshing) onRefresh(); }}
                  disabled={isRefreshing}
                  className={`ripple-container press-feedback p-2 rounded-xl bg-emerald-950/70 text-emerald-200 border border-emerald-800/70 cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    isRefreshing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-800/80 hover:text-white transition-colors'
                  }`}
                  title="Sinkronkan & Muat Ulang Data Firestore"
                  aria-label="Sinkronkan Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
                  <span className="hidden xl:inline text-[11px]">
                    {isRefreshing ? 'Memuat...' : 'Sync'}
                  </span>
                </button>
              )}

              {/* User Profile Pill / Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-800/80 border border-emerald-800/70 text-white transition-all cursor-pointer group"
                  aria-expanded={showProfileMenu}
                  aria-label="Menu Pengguna"
                >
                  {/* User Avatar Circle */}
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-extrabold text-[11px] sm:text-xs border shadow-xs ${currentRoleStyle.avatarBg}`}>
                    {userInitials}
                  </div>

                  {/* Desktop Name & Role */}
                  <div className="text-left hidden sm:block max-w-[140px] truncate">
                    <p className="text-xs font-bold leading-tight truncate">{currentUser.nama}</p>
                    <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border font-semibold mt-0.5 ${currentRoleStyle.bg}`}>
                      {currentUser.role}
                    </span>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-300 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Popover Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header in dropdown */}
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shadow-xs ${currentRoleStyle.avatarBg}`}>
                          {userInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.nama}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">@{currentUser.username}</p>
                          <div className="mt-1">
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold border ${currentRoleStyle.bg}`}>
                              {currentUser.role === 'Ustadz' && '🛡️ Ustadz Musyrif'}
                              {currentUser.role === 'Wali' && '👨‍👩‍👧 Wali Santri'}
                              {currentUser.role === 'Santri' && '📖 Santri'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Options */}
                    <div className="p-1.5 space-y-0.5 text-xs font-semibold">
                      <button
                        onClick={() => {
                          setActiveTab('mushaf');
                          setShowProfileMenu(false);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span>Buka Mushaf Al-Qur'an</span>
                      </button>

                      {onRefresh && (
                        <button
                          onClick={() => {
                            if (!isRefreshing) onRefresh();
                            setShowProfileMenu(false);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>Perbarui / Sync Data</span>
                        </button>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="p-1.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer text-xs"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Logout Button on Desktop */}
              <button
                onClick={onLogout}
                className="hidden md:flex p-2 rounded-xl bg-emerald-950/70 hover:bg-rose-900/80 text-emerald-200 hover:text-rose-200 border border-emerald-800/70 transition-colors cursor-pointer"
                title="Keluar Akun"
                aria-label="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-emerald-200/90 font-medium px-3 py-1 rounded-lg bg-emerald-800/50 border border-emerald-700/50">
              Sistem Mutaba'ah Tahfidz
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
