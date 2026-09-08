import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveTab } from '../types';
import { LogOut, MapPin, RefreshCw, BookOpen, ChevronDown } from 'lucide-react';
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
  const brandRipple = useRipple<HTMLAnchorElement>();
  const syncRipple = useRipple<HTMLButtonElement>({ disabled: isRefreshing });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!showProfileMenu) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setShowProfileMenu(false);
      window.requestAnimationFrame(() => profileTriggerRef.current?.focus());
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
    Superadmin: {
      label: 'Superadmin',
      bg: 'bg-amber-500/90 text-amber-950 font-bold border-amber-300',
      avatarBg: 'bg-amber-500 border-amber-300 text-amber-950 font-extrabold'
    },
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

  const normalizedRole: 'Superadmin' | 'Ustadz' | 'Wali' | 'Santri' = (() => {
    if (!currentUser?.role) return 'Ustadz';
    const r = String(currentUser.role).trim().toLowerCase();
    if (r === 'superadmin') return 'Superadmin';
    if (r === 'wali' || r.includes('wali')) return 'Wali';
    if (r === 'santri') return 'Santri';
    return 'Ustadz';
  })();

  const currentRoleStyle = roleBadgeConfig[normalizedRole] || roleBadgeConfig.Ustadz;

  return (
    <header id="main-header" className="ui-safe-top sticky top-0 z-40 bg-emerald-950 text-white border-b border-emerald-900 select-none">
      <div className="max-w-7xl mx-auto ui-page-gutter min-h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo Section */}
        <a
          ref={brandRipple.elementRef}
          id="brand-logo-link"
          href="#main-content"
          className="ripple-container flex min-h-11 items-center gap-3 cursor-pointer flex-1 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
          onClick={(e) => {
            brandRipple.createRipple(e);
            if (currentUser) setActiveTab('dashboard');
          }}
          aria-current={currentUser && activeTab === 'dashboard' ? 'page' : undefined}
          aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
            <PesmadLogo size="md" className="w-full h-full" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight truncate">
                Pesmad <span className="text-emerald-300 font-semibold">Tahfidz</span>
              </h1>
              <span className="text-xs font-medium text-emerald-200">
                MTsN 3 Bojonegoro
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 font-medium hidden sm:flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="truncate">Jl. Budi Utomo No. 190 Kepohbaru</span>
            </p>
          </div>
        </a>

        {/* Right Section: Sync + User Profile Dropdown */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2.5" ref={profileMenuRef}>
              {/* Quick Sync Button */}
              {onRefresh && (
                <button
                  type="button"
                  ref={syncRipple.elementRef}
                  onClick={(e) => { syncRipple.createRipple(e); if (!isRefreshing) onRefresh(); }}
                  disabled={isRefreshing}
                  className={`ripple-container press-feedback min-h-11 min-w-11 px-3 rounded-xl bg-emerald-900 text-emerald-100 border border-emerald-800 cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                    isRefreshing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-800 hover:text-white transition-colors'
                  }`}
                  title="Sinkronkan & Muat Ulang Data Firestore"
                  aria-label={isRefreshing ? 'Sedang menyinkronkan data' : 'Sinkronkan data'}
                  aria-busy={isRefreshing}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
                  <span className="hidden xl:inline text-xs">
                    {isRefreshing ? 'Memuat...' : 'Sync'}
                  </span>
                </button>
              )}

              {/* User Profile Pill / Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  ref={profileTriggerRef}
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="min-h-11 flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 border border-emerald-800 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                  aria-expanded={showProfileMenu}
                  aria-controls="profile-menu-popover"
                  aria-haspopup="true"
                  aria-label="Menu Pengguna"
                >
                  {/* User Avatar Circle */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs border ${currentRoleStyle.avatarBg}`}>
                    {userInitials}
                  </div>

                  {/* Desktop Name & Role */}
                  <div className="text-left hidden sm:block max-w-[140px] truncate">
                    <p className="text-xs font-bold leading-tight truncate">{currentUser.nama}</p>
                    <span className={`inline-block text-xs px-1.5 py-0.5 rounded border font-semibold mt-0.5 ${currentRoleStyle.bg}`}>
                      {currentUser.role}
                    </span>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-300 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Popover Dropdown */}
                {showProfileMenu && (
                  <div id="profile-menu-popover" role="region" aria-label="Opsi akun pengguna" className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-800 py-2 z-50">
                    {/* Header in dropdown */}
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border shadow-xs ${currentRoleStyle.avatarBg}`}>
                          {userInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.nama}</p>
                          <p className="text-xs text-slate-500 font-mono truncate">@{currentUser.username}</p>
                          <div className="mt-1">
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-md font-semibold border ${currentRoleStyle.bg}`}>
                              {normalizedRole === 'Ustadz' && 'Ustadz Musyrif'}
                              {normalizedRole === 'Wali' && 'Wali Santri'}
                              {normalizedRole === 'Santri' && 'Santri'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Menu Options */}
                    <div className="p-1.5 space-y-0.5 text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('mushaf');
                          setShowProfileMenu(false);
                        }}
                        className="w-full min-h-11 px-3 py-2 rounded-lg text-left flex items-center gap-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                          className="w-full min-h-11 px-3 py-2 rounded-lg text-left flex items-center gap-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>Perbarui / Sync Data</span>
                        </button>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="p-1.5 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full min-h-11 px-3 py-2 rounded-lg text-left flex items-center gap-2.5 text-rose-700 hover:bg-rose-50 font-semibold transition-colors cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
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
                type="button"
                onClick={onLogout}
                className="hidden md:flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-emerald-900 hover:bg-rose-900 text-emerald-100 hover:text-rose-100 border border-emerald-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
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
