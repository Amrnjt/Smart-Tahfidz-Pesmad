import React from 'react';
import { User, ActiveTab } from '../types';
import { LayoutDashboard, PlusCircle, RotateCw, History, BookOpen, Users } from 'lucide-react';

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
  if (!currentUser) return null;

  const role = currentUser.role;

  const ustadzItems = [
    { id: 'dashboard' as ActiveTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'ziyadah' as ActiveTab, label: 'Ziyadah', icon: PlusCircle },
    { id: 'murojaah' as ActiveTab, label: "Muroja'ah", icon: RotateCw },
    { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: History },
    { id: 'mushaf' as ActiveTab, label: 'Mushaf', icon: BookOpen },
    { id: 'santri' as ActiveTab, label: 'Santri & Akun', icon: Users }
  ];

  const waliItems = [
    { id: 'dashboard' as ActiveTab, label: 'Anak Saya', icon: LayoutDashboard },
    { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: History },
    { id: 'mushaf' as ActiveTab, label: 'Mushaf', icon: BookOpen }
  ];

  const santriItems = [
    { id: 'dashboard' as ActiveTab, label: 'Hafalan Saya', icon: LayoutDashboard },
    { id: 'riwayat' as ActiveTab, label: 'Riwayat Setoran', icon: History },
    { id: 'mushaf' as ActiveTab, label: 'Mushaf 30 Juz', icon: BookOpen }
  ];

  const items = role === 'Ustadz' ? ustadzItems : role === 'Wali' ? waliItems : santriItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 shadow-lg safe-bottom">
      <div className="flex justify-around items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-800 font-bold scale-105'
                  : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100/80 text-emerald-800' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
