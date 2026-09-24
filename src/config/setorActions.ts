import { ActiveTab } from '../types';
import { BookPlus, RotateCw, BookOpenCheck, GraduationCap } from 'lucide-react';
import type React from 'react';

const UMMI_LOGO_DATA_URI = 'data:image/jpeg;base64,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';

export interface SetorActionItem {
  tab: ActiveTab;
  title: string;
  label: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  imageSrc?: string;
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
    iconSurfaceBg: string;
    iconSurfaceText: string;
    iconSurfaceBorder: string;
    tileHoverBorder: string;
    tileActiveBg: string;
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
      badgeBorder: 'border-emerald-200',
      iconSurfaceBg: 'bg-emerald-50',
      iconSurfaceText: 'text-emerald-700',
      iconSurfaceBorder: 'border-emerald-100/90',
      tileHoverBorder: 'hover:border-emerald-200/90',
      tileActiveBg: 'active:bg-emerald-50/50'
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
      badgeBorder: 'border-teal-200',
      iconSurfaceBg: 'bg-teal-50',
      iconSurfaceText: 'text-teal-700',
      iconSurfaceBorder: 'border-teal-100/90',
      tileHoverBorder: 'hover:border-teal-200/90',
      tileActiveBg: 'active:bg-teal-50/50'
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
      badgeBorder: 'border-indigo-200',
      iconSurfaceBg: 'bg-indigo-50',
      iconSurfaceText: 'text-indigo-700',
      iconSurfaceBorder: 'border-indigo-100/90',
      tileHoverBorder: 'hover:border-indigo-200/90',
      tileActiveBg: 'active:bg-indigo-50/50'
    }
  },
  {
    tab: 'pembelajaran',
    title: 'Metode Ummi',
    label: 'Metode Ummi',
    subtitle: 'Jilid & materi',
    imageSrc: UMMI_LOGO_DATA_URI,
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
      badgeBorder: 'border-amber-200',
      iconSurfaceBg: 'bg-amber-50',
      iconSurfaceText: 'text-amber-700',
      iconSurfaceBorder: 'border-amber-100/90',
      tileHoverBorder: 'hover:border-amber-200/90',
      tileActiveBg: 'active:bg-amber-50/50'
    }
  }
];
