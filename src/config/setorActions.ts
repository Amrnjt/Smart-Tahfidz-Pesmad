import { ActiveTab } from '../types';
import { BookPlus, RotateCw, BookOpenCheck, GraduationCap } from 'lucide-react';
import type React from 'react';

export interface SetorActionItem {
  tab: ActiveTab;
  title: string;
  label: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'emerald' | 'teal' | 'indigo' | 'amber';
  colorClasses: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    hoverBorder: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
}

export const SETOR_ACTIONS: SetorActionItem[] = [
  {
    tab: 'ziyadah',
    title: 'Ziyadah',
    label: 'Ziyadah',
    subtitle: 'Hafalan baru',
    badge: 'Bil-Ghoib',
    icon: BookPlus,
    tone: 'emerald',
    colorClasses: {
      bg: 'bg-white',
      text: 'text-slate-900',
      border: 'border-slate-200/90',
      hoverBg: 'hover:bg-emerald-50/60',
      hoverBorder: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-600 text-white',
      iconColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200'
    }
  },
  {
    tab: 'murojaah',
    title: "Muroja'ah",
    label: "Muroja'ah",
    subtitle: 'Pengulangan',
    badge: 'Pengulangan',
    icon: RotateCw,
    tone: 'teal',
    colorClasses: {
      bg: 'bg-white',
      text: 'text-slate-900',
      border: 'border-slate-200/90',
      hoverBg: 'hover:bg-teal-50/60',
      hoverBorder: 'hover:border-teal-300',
      iconBg: 'bg-teal-600 text-white',
      iconColor: 'text-teal-700',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      badgeBorder: 'border-teal-200'
    }
  },
  {
    tab: 'binnadzor',
    title: 'Binnadzor',
    label: 'Binnadzor',
    subtitle: 'Tilawah & tajwid',
    badge: 'Bin-Nadzor',
    icon: BookOpenCheck,
    tone: 'indigo',
    colorClasses: {
      bg: 'bg-white',
      text: 'text-slate-900',
      border: 'border-slate-200/90',
      hoverBg: 'hover:bg-indigo-50/60',
      hoverBorder: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-600 text-white',
      iconColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      badgeBorder: 'border-indigo-200'
    }
  },
  {
    tab: 'pembelajaran',
    title: 'Non-Tahfidz',
    label: 'Non-Tahfidz',
    subtitle: 'Jilid & materi',
    badge: 'Pembelajaran',
    icon: GraduationCap,
    tone: 'amber',
    colorClasses: {
      bg: 'bg-white',
      text: 'text-slate-900',
      border: 'border-slate-200/90',
      hoverBg: 'hover:bg-amber-50/60',
      hoverBorder: 'hover:border-amber-300',
      iconBg: 'bg-amber-600 text-white',
      iconColor: 'text-amber-700',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200'
    }
  }
];
