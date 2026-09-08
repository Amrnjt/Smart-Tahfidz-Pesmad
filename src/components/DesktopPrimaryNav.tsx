import React from 'react';
import { BookOpen, CirclePlus as PlusCircle, History, LayoutDashboard, School, Users } from 'lucide-react';
import type { ActiveTab } from '../types';

interface DesktopPrimaryNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isUstadz: boolean;
  isSetorMenuOpen: boolean;
  onOpenSetorMenu: () => void;
}

const navButtonBase = 'press-feedback min-h-11 min-w-0 px-3 lg:px-4 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset';

export const DesktopPrimaryNav: React.FC<DesktopPrimaryNavProps> = ({
  activeTab,
  setActiveTab,
  isUstadz,
  isSetorMenuOpen,
  onOpenSetorMenu
}) => {
  const isSetorActive = ['ziyadah', 'murojaah', 'binnadzor', 'pembelajaran'].includes(activeTab);

  const tabClass = (active: boolean) =>
    `${navButtonBase} ${
      active
        ? 'border-emerald-700 bg-emerald-50/60 text-emerald-900'
        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
    }`;

  return (
    <div className="p3-primary-nav-layer hidden md:block" data-app-chrome="primary-navigation">
      <nav
        className="flex items-stretch gap-1 border-b border-slate-200 bg-white px-1"
        aria-label="Navigasi utama"
      >
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          className={tabClass(activeTab === 'dashboard')}
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          aria-current={activeTab === 'riwayat' ? 'page' : undefined}
          className={tabClass(activeTab === 'riwayat')}
        >
          <History className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Riwayat</span>
        </button>

        {isUstadz && (
          <button
            onClick={onOpenSetorMenu}
            aria-haspopup="dialog"
            aria-expanded={isSetorMenuOpen}
            aria-current={isSetorActive ? 'page' : undefined}
            className={tabClass(isSetorActive)}
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Setor</span>
          </button>
        )}

        {isUstadz && (
          <button
            onClick={() => setActiveTab('kelas')}
            aria-current={activeTab === 'kelas' ? 'page' : undefined}
            className={tabClass(activeTab === 'kelas')}
          >
            <School className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Kelas</span>
          </button>
        )}

        {isUstadz && (
          <button
            onClick={() => setActiveTab('santri')}
            aria-current={activeTab === 'santri' ? 'page' : undefined}
            className={tabClass(activeTab === 'santri')}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Santri</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('mushaf')}
          aria-current={activeTab === 'mushaf' ? 'page' : undefined}
          className={tabClass(activeTab === 'mushaf')}
        >
          <BookOpen className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Mushaf</span>
        </button>
      </nav>
    </div>
  );
};
