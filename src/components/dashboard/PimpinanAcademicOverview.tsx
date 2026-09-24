import React, { useMemo } from 'react';
import {
  Eye,
  FileSpreadsheet,
  GraduationCap,
  School,
  Users,
} from 'lucide-react';
import type { Santri } from '../../types';

interface PimpinanAcademicOverviewProps {
  santriList: Santri[];
  onOpenCollectiveReport: () => void;
}

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, icon: Icon, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-2xs">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </div>
    <p className="mt-2 text-2xl font-black tabular-nums tracking-tight text-slate-900">{value}</p>
  </div>
);

export const PimpinanAcademicOverview: React.FC<PimpinanAcademicOverviewProps> = ({
  santriList,
  onOpenCollectiveReport,
}) => {
  const summary = useMemo(() => {
    const active = santriList.filter(santri => (santri.statusAkademikFormal || 'Aktif') === 'Aktif');
    const alumni = santriList.filter(santri => santri.statusAkademikFormal === 'Lulus');

    const countClass = (kelas: 'VII' | 'VIII' | 'IX') =>
      active.filter(santri => santri.kelasFormal === kelas).length;

    return {
      active: active.length,
      alumni: alumni.length,
      vii: countClass('VII'),
      viii: countClass('VIII'),
      ix: countClass('IX'),
    };
  }, [santriList]);

  return (
    <section
      aria-label="Ringkasan akademik formal pimpinan"
      className="ui-bento-card overflow-hidden p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700">
              <Eye className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                Mode Pimpinan · View-only
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
                Ringkasan Akademik Formal
              </h2>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
            Gambaran posisi akademik santri saat ini. Perubahan kelas, kelulusan, dan data santri tetap dikelola dari akses operasional yang berwenang.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCollectiveReport}
          className="inline-flex min-h-[42px] flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:text-sm"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          Rekap Kolektif
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3">
        <StatTile
          label="Santri Aktif"
          value={summary.active}
          icon={Users}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatTile
          label="Kelas VII"
          value={summary.vii}
          icon={School}
          tone="bg-sky-50 text-sky-700"
        />
        <StatTile
          label="Kelas VIII"
          value={summary.viii}
          icon={School}
          tone="bg-indigo-50 text-indigo-700"
        />
        <StatTile
          label="Kelas IX"
          value={summary.ix}
          icon={School}
          tone="bg-amber-50 text-amber-700"
        />
        <StatTile
          label="Alumni"
          value={summary.alumni}
          icon={GraduationCap}
          tone="bg-violet-50 text-violet-700"
        />
      </div>
    </section>
  );
};
