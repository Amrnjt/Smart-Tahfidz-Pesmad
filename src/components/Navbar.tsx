import React from 'react';
import { User, ActiveTab } from '../types';
import { BookOpen, LogOut, MapPin } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-950/80">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => currentUser && setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-600/40 shadow-inner flex-shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-white leading-tight">
                Tahfidz al-Qur'an <span className="text-emerald-200 font-semibold">Pesantren Madrasah Darul Fikri</span>
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-800 text-emerald-200 border border-emerald-600 uppercase tracking-wide hidden md:inline-block">
                Smart Tahfidz
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-amber-300 flex-shrink-0" />
              <span>Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</span>
            </p>
          </div>
        </div>

        {/* Right Action Items */}
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
                onClick={onLogout}
                className="p-2 rounded-xl bg-emerald-950/80 hover:bg-rose-900/80 text-emerald-200 hover:text-rose-200 transition-colors border border-emerald-800/80 cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-emerald-300 font-medium hidden sm:block">
              Sistem Mutaba'ah Tahfidz
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

