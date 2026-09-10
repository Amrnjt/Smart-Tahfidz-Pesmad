import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveTab } from '../types';
import { LogOut, MapPin, RefreshCw, BookOpen, ChevronDown, Cloud } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';
import { useRipple } from '../hooks/useRipple';
import { useDropdownTransition } from '../hooks/useDropdownTransition';

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
  const profileTransition = useDropdownTransition(showProfileMenu);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const userInitials = currentUser?.nama
    ? currentUser.nama
        .split(' ')
        .map(n => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const normalizedRole: 'Superadmin' | 'Ustadz' | 'Wali' | 'Santri' = (() => {
    if (!currentUser?.role) return 'Ustadz';
    const role = String(currentUser.role).trim().toLowerCase();
    if (role === 'superadmin') return 'Superadmin';
    if (role === 'wali' || role.includes('wali')) return 'Wali';
    if (role === 'santri') return 'Santri';
    return 'Ustadz';
  })();

  const roleStyle = {
    Superadmin: {
      label: 'Superadmin',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      avatar: 'bg-amber-100 text-amber-900 border-amber-200'
    },
    Ustadz: {
      label: 'Ustadz Musyrif',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      avatar: 'bg-emerald-100 text-emerald-900 border-emerald-200'
    },
    Wali: {
      label: 'Wali Santri',
      badge: 'bg-teal-50 text-teal-800 border-teal-200',
      avatar: 'bg-teal-100 text-teal-900 border-teal-200'
    },
    Santri: {
      label: 'Santri',
      badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      avatar: 'bg-cyan-100 text-cyan-900 border-cyan-200'
    }
  }[normalizedRole];

  return (
    <header id="main-header" className="p2-topbar ui-safe-top relative select-none">
      <div className="p2-topbar-wrap max-w-7xl mx-auto ui-page-gutter">
        <div className="p2-topbar-inner">
          <a
            ref={brandRipple.elementRef}
            id="brand-logo-link"
            href="#main-content"
            className="ripple-container p2-brand-link"
            onClick={(event) => {
              brandRipple.createRipple(event);
              if (currentUser) setActiveTab('dashboard');
            }}
            aria-current={currentUser && activeTab === 'dashboard' ? 'page' : undefined}
            aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
          >
            <span className="p2-brand-mark" aria-hidden="true">
              <PesmadLogo size="md" className="w-full h-full" />
            </span>

            <span className="p2-brand-copy">
              <span className="p2-brand-title">
                Pesmad <strong>Tahfidz</strong>
              </span>
              <span className="p2-brand-meta">
                <span>MTsN 3 Bojonegoro</span>
                <span className="hidden lg:inline-flex items-center gap-1">
                  <MapPin className="ui-icon-xs" /> Kepohbaru
                </span>
              </span>
            </span>
          </a>

          <div className="p2-topbar-actions">
            {currentUser ? (
              <div className="flex items-center gap-2" ref={profileMenuRef}>
                {onRefresh && (
                  <button
                    type="button"
                    ref={syncRipple.elementRef}
                    onClick={(event) => {
                      syncRipple.createRipple(event);
                      if (!isRefreshing) onRefresh();
                    }}
                    disabled={isRefreshing}
                    className="ripple-container p2-sync-control"
                    title="Sinkronkan data dengan Cloud Firestore"
                    aria-label={isRefreshing ? 'Sedang menyinkronkan data' : 'Sinkronkan data'}
                    aria-busy={isRefreshing}
                  >
                    <span className="p2-sync-icon-wrap">
                      <RefreshCw className={`ui-icon-sm ${isRefreshing ? 'animate-spin' : ''}`} />
                    </span>
                    <span className="hidden xl:flex flex-col items-start leading-tight">
                      <span className="font-bold text-slate-800">{isRefreshing ? 'Menyinkronkan' : 'Cloud Sync'}</span>
                      <span className="text-[10px] font-medium text-slate-500">Firestore</span>
                    </span>
                  </button>
                )}

                <div className="relative">
                  <button
                    type="button"
                    ref={profileTriggerRef}
                    onClick={() => setShowProfileMenu(prev => !prev)}
                    className="p2-profile-trigger"
                    aria-expanded={showProfileMenu}
                    aria-controls="profile-menu-popover"
                    aria-haspopup="true"
                    aria-label="Menu pengguna"
                  >
                    <span className={`p2-profile-avatar ${roleStyle.avatar}`}>{userInitials}</span>
                    <span className="hidden sm:flex min-w-0 flex-col items-start leading-tight">
                      <span className="max-w-[148px] truncate text-xs font-extrabold text-slate-900">{currentUser.nama}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{roleStyle.label}</span>
                    </span>
                    <ChevronDown className={`ui-icon-xs text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {profileTransition.isMounted && (
                    <div
                      id="profile-menu-popover"
                      role="region"
                      aria-label="Opsi akun pengguna"
                      className={`p2-profile-popover t-dropdown ${profileTransition.transitionClassName}`}
                      data-origin="top-right"
                      aria-hidden={!showProfileMenu}
                    >
                      <div className="p2-profile-popover-head">
                        <span className={`p2-profile-avatar p2-profile-avatar-lg ${roleStyle.avatar}`}>{userInitials}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-slate-950">{currentUser.nama}</p>
                          <p className="truncate text-xs font-medium text-slate-500">@{currentUser.username}</p>
                          <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${roleStyle.badge}`}>
                            {roleStyle.label}
                          </span>
                        </div>
                      </div>

                      <div className="p2-profile-menu-list">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('mushaf');
                            setShowProfileMenu(false);
                          }}
                          className="p2-profile-menu-item"
                        >
                          <span className="p2-menu-icon"><BookOpen className="ui-icon-sm" /></span>
                          <span>
                            <strong>Buka Mushaf</strong>
                            <small>Al-Qur'an 30 Juz</small>
                          </span>
                        </button>

                        {onRefresh && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isRefreshing) onRefresh();
                              setShowProfileMenu(false);
                            }}
                            className="p2-profile-menu-item"
                          >
                            <span className="p2-menu-icon"><Cloud className="ui-icon-sm" /></span>
                            <span>
                              <strong>Perbarui Data</strong>
                              <small>Sinkronkan dengan Cloud</small>
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="p2-profile-popover-foot">
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            onLogout();
                          }}
                          className="p2-profile-menu-item p2-profile-menu-danger"
                        >
                          <span className="p2-menu-icon"><LogOut className="ui-icon-sm" /></span>
                          <span>
                            <strong>Keluar Akun</strong>
                            <small>Akhiri sesi perangkat ini</small>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p2-guest-chip">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Sistem Mutaba'ah Tahfidz
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
