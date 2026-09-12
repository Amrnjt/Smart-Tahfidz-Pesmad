import React, { useState, useRef, useEffect } from 'react';
import { User, ActiveTab } from '../types';
import {
  LogOut,
  MapPin,
  RefreshCw,
  BookOpen,
  ChevronDown,
  Cloud,
  Check,
  AlertCircle,
  Clock
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PesmadLogo } from './PesmadLogo';
import { useRipple } from '../hooks/useRipple';

interface NavbarProps {
  currentUser: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  syncState?: 'idle' | 'syncing' | 'success' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onRefresh,
  isRefreshing = false,
  syncState = isRefreshing ? 'syncing' : 'idle'
}) => {
  const brandRipple = useRipple<HTMLAnchorElement>();
  const syncTriggerRipple = useRipple<HTMLButtonElement>({ disabled: isRefreshing });
  const profileTriggerRipple = useRipple<HTMLButtonElement>();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Baru saja');

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const syncMenuRef = useRef<HTMLDivElement>(null);
  const syncTriggerRef = useRef<HTMLButtonElement>(null);

  // Update last sync time on success
  useEffect(() => {
    if (syncState === 'success') {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setLastSyncTime(`${hours}:${minutes} WIB`);
    }
  }, [syncState]);

  // Click outside listener for Profile and Sync dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
      if (syncMenuRef.current && !syncMenuRef.current.contains(target)) {
        setShowSyncMenu(false);
      }
    };

    if (showProfileMenu || showSyncMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, showSyncMenu]);

  // Escape key handler for accessible popovers
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (showProfileMenu) {
        event.preventDefault();
        setShowProfileMenu(false);
        window.requestAnimationFrame(() => profileTriggerRef.current?.focus());
      }
      if (showSyncMenu) {
        event.preventDefault();
        setShowSyncMenu(false);
        window.requestAnimationFrame(() => syncTriggerRef.current?.focus());
      }
    };

    if (showProfileMenu || showSyncMenu) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileMenu, showSyncMenu]);

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
      badge: 'bg-amber-50 text-amber-900 border-amber-200/90',
      avatar: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    Ustadz: {
      label: 'Ustadz Musyrif',
      badge: 'bg-emerald-50 text-emerald-900 border-emerald-200/90',
      avatar: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    Wali: {
      label: 'Wali Santri',
      badge: 'bg-teal-50 text-teal-900 border-teal-200/90',
      avatar: 'bg-teal-100 text-teal-900 border-teal-300'
    },
    Santri: {
      label: 'Santri',
      badge: 'bg-cyan-50 text-cyan-900 border-cyan-200/90',
      avatar: 'bg-cyan-100 text-cyan-900 border-cyan-300'
    }
  }[normalizedRole];

  const isSyncingActive = isRefreshing || syncState === 'syncing';
  const isSyncError = syncState === 'error';

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs select-none"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[68px] gap-3">
          
          {/* 1. BRAND AREA (ANCHOR KIRI) */}
          <div className="flex items-center min-w-0">
            <a
              ref={brandRipple.elementRef}
              id="brand-logo-link"
              href="#main-content"
              className="ripple-container group inline-flex items-center gap-2.5 sm:gap-3 rounded-2xl py-1 px-1.5 -ml-1.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={(event) => {
                brandRipple.createRipple(event);
                if (currentUser) setActiveTab('dashboard');
              }}
              aria-current={currentUser && activeTab === 'dashboard' ? 'page' : undefined}
              aria-label="Beranda Smart Tahfidz Pesmad"
            >
              {/* PesmadLogo with Soft Neumorphic Ring */}
              <span
                className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-800 via-emerald-850 to-emerald-950 p-1.5 shadow-[0_3px_10px_rgba(6,78,59,0.18)] border border-emerald-700/40 flex-shrink-0"
                aria-hidden="true"
              >
                <PesmadLogo size="sm" className="w-full h-full" />
              </span>

              {/* Brand Typography */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-baseline gap-1 text-[15px] sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                  <span>Smart</span>
                  <span className="text-emerald-700">Tahfidz</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight">
                  <span className="truncate">Pesmad · MTsN 3 Bojonegoro</span>
                  <span className="hidden xl:inline-flex items-center gap-1 text-slate-400">
                    <span className="text-slate-300">•</span>
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    <span>Kepohbaru</span>
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* 2. USER CONTROLS (KANAN: CLOUD SYNC + PROFILE) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {currentUser ? (
              <>
                {/* CLOUD SYNC COMPACT CONTROL */}
                <div className="relative" ref={syncMenuRef}>
                  <button
                    type="button"
                    ref={syncTriggerRef}
                    onClick={(event) => {
                      syncTriggerRipple.createRipple(event);
                      setShowSyncMenu(prev => !prev);
                      setShowProfileMenu(false);
                    }}
                    className={`ripple-container relative min-h-[42px] inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                      showSyncMenu
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-xs'
                        : isSyncError
                        ? 'bg-rose-50/80 border-rose-200 text-rose-800 hover:bg-rose-100/70'
                        : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50/90 hover:border-slate-300 shadow-2xs'
                    }`}
                    aria-expanded={showSyncMenu}
                    aria-controls="sync-menu-popover"
                    aria-haspopup="dialog"
                    aria-label="Status sinkronisasi data cloud"
                  >
                    <span className="relative flex items-center justify-center">
                      <Cloud className={`w-4 h-4 ${isSyncError ? 'text-rose-600' : 'text-emerald-700'}`} />
                      {isSyncingActive && (
                        <RefreshCw className="w-3 h-3 text-amber-600 animate-spin absolute -bottom-0.5 -right-0.5" />
                      )}
                    </span>

                    {/* Status Dot */}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSyncingActive
                          ? 'bg-amber-500 animate-pulse'
                          : isSyncError
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                      aria-hidden="true"
                    />

                    {/* Compact Label */}
                    <span className="hidden sm:inline font-semibold">
                      {isSyncingActive
                        ? 'Menyinkronkan...'
                        : isSyncError
                        ? 'Gagal Sinkron'
                        : 'Tersinkron'}
                    </span>

                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                        showSyncMenu ? 'rotate-180 text-emerald-700' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* CLOUD SYNC POPOVER */}
                  <AnimatePresence>
                    {showSyncMenu && (
                      <motion.div
                        id="sync-menu-popover"
                        role="dialog"
                        aria-label="Informasi Sinkronisasi Cloud"
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)] p-3.5 sm:p-4 z-50 text-slate-800"
                      >
                        {/* Status Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            {isSyncingActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                                Menyinkronkan Data
                              </span>
                            ) : isSyncError ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/80">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Sinkronisasi Gagal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Cloud Tersinkron
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detail Info Rows */}
                        <div className="py-3 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-500 font-medium">Penyedia Basis Data:</span>
                            <span className="font-bold text-slate-800">Cloud Firestore</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Pembaruan Terakhir:
                            </span>
                            <span className="font-semibold text-slate-700">{lastSyncTime}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="text-slate-500 font-medium">Status Offline Cache:</span>
                            <span className="font-semibold text-emerald-700">Tersedia di Perangkat</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        {onRefresh && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isRefreshing) onRefresh();
                              }}
                              disabled={isRefreshing}
                              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-60 text-white font-bold text-xs py-2 px-3 shadow-xs transition-colors"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                              <span>{isRefreshing ? 'Sedang Memperbarui...' : 'Sinkronkan Sekarang'}</span>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PROFILE CONTROL */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    ref={profileTriggerRef}
                    onClick={(event) => {
                      profileTriggerRipple.createRipple(event);
                      setShowProfileMenu(prev => !prev);
                      setShowSyncMenu(false);
                    }}
                    className={`ripple-container relative min-h-[42px] inline-flex items-center gap-2 sm:gap-2.5 rounded-full border p-1 pr-2 sm:pr-3 text-xs font-bold transition-all cursor-pointer ${
                      showProfileMenu
                        ? 'bg-emerald-50/90 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50/90 hover:border-slate-300 shadow-2xs'
                    }`}
                    aria-expanded={showProfileMenu}
                    aria-controls="profile-menu-popover"
                    aria-haspopup="menu"
                    aria-label="Menu akun pengguna"
                  >
                    {/* Compact Avatar with Neumorphic Rim */}
                    <span
                      className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-extrabold shadow-2xs flex-shrink-0 ${roleStyle.avatar}`}
                    >
                      {userInitials}
                    </span>

                    {/* Name & Role on Desktop/Tablet */}
                    <div className="hidden sm:flex flex-col items-start leading-tight text-left min-w-0">
                      <span className="max-w-[110px] sm:max-w-[135px] truncate text-xs font-extrabold text-slate-900">
                        {currentUser.nama}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {roleStyle.label}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        showProfileMenu ? 'rotate-180 text-emerald-700' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* PROFILE POPOVER */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        id="profile-menu-popover"
                        role="menu"
                        aria-label="Opsi akun pengguna"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-[0_12px_36px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)] overflow-hidden z-50 text-slate-800"
                      >
                        {/* Popover Header with User Details */}
                        <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border-b border-slate-100 flex items-center gap-3">
                          <span
                            className={`w-11 h-11 rounded-full border flex items-center justify-center text-sm font-extrabold shadow-xs flex-shrink-0 ${roleStyle.avatar}`}
                          >
                            {userInitials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-slate-900 leading-tight">
                              {currentUser.nama}
                            </p>
                            <p className="truncate text-xs font-medium text-slate-500 mt-0.5">
                              @{currentUser.username}
                            </p>
                            <span
                              className={`mt-1.5 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${roleStyle.badge}`}
                            >
                              {roleStyle.label}
                            </span>
                          </div>
                        </div>

                        {/* Menu Options List */}
                        <div className="p-2 space-y-1" role="none">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setActiveTab('mushaf');
                              setShowProfileMenu(false);
                            }}
                            className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-900 transition-colors group"
                          >
                            <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                              <BookOpen className="w-4 h-4" />
                            </span>
                            <div className="flex flex-col min-w-0">
                              <strong className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                                Buka Mushaf
                              </strong>
                              <small className="text-[10px] font-medium text-slate-500">
                                Al-Qur'an 30 Juz digital
                              </small>
                            </div>
                          </button>

                          {onRefresh && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                if (!isRefreshing) onRefresh();
                                setShowProfileMenu(false);
                              }}
                              disabled={isRefreshing}
                              className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-900 transition-colors group"
                            >
                              <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                                <Cloud className="w-4 h-4" />
                              </span>
                              <div className="flex flex-col min-w-0">
                                <strong className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                                  Perbarui Data Cloud
                                </strong>
                                <small className="text-[10px] font-medium text-slate-500">
                                  Sinkronkan data dengan Firestore
                                </small>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Logout Footer */}
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50" role="none">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setShowProfileMenu(false);
                              onLogout();
                            }}
                            className="w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-rose-50 text-rose-700 transition-colors group"
                          >
                            <span className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                              <LogOut className="w-4 h-4" />
                            </span>
                            <div className="flex flex-col min-w-0">
                              <strong className="text-xs font-bold text-rose-800">
                                Keluar Akun
                              </strong>
                              <small className="text-[10px] font-medium text-rose-500">
                                Akhiri sesi di perangkat ini
                              </small>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>Sistem Mutaba'ah Tahfidz</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
