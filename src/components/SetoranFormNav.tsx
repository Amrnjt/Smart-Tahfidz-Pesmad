import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ActiveTab } from '../types';

type SetoranTab = Extract<ActiveTab, 'ziyadah' | 'murojaah' | 'binnadzor' | 'pembelajaran'>;

interface SetoranFormNavProps {
  activeTab: SetoranTab;
  onBack: () => void;
}

const labels: Record<SetoranTab, string> = {
  ziyadah: 'Ziyadah',
  murojaah: "Muroja'ah",
  binnadzor: 'Binnadzor',
  pembelajaran: 'Non-Tahfidz'
};

export const SetoranFormNav: React.FC<SetoranFormNavProps> = ({ activeTab, onBack }) => {
  return (
    <nav
      aria-label="Navigasi form setoran"
      className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2"
    >
      <button
        type="button"
        onClick={onBack}
        className="press-feedback inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="Batalkan input dan kembali ke Beranda"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Kembali ke Beranda</span>
      </button>

      <div className="flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-600" aria-label={`Setor, ${labels[activeTab]}`}>
        <span>Setor</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        <strong className="text-slate-900">{labels[activeTab]}</strong>
      </div>
    </nav>
  );
};