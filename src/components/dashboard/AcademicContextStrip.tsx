import React from 'react';
import { BookOpenCheck, CalendarRange, GraduationCap, School } from 'lucide-react';
import type { AppConfig, Santri } from '../../types';

interface AcademicContextStripProps {
  appConfig: AppConfig;
  santri?: Santri | null;
  className?: string;
}

export const AcademicContextStrip: React.FC<AcademicContextStripProps> = ({
  appConfig,
  santri,
  className = '',
}) => {
  const tahunPelajaran = appConfig.tahunPelajaranAktif?.trim() || 'Belum ditetapkan';
  const semester = appConfig.semesterAkademikAktif
    ? `Semester ${appConfig.semesterAkademikAktif}`
    : 'Semester belum ditetapkan';

  const formalLabel = santri
    ? santri.satuanPendidikan && santri.kelasFormal
      ? `${santri.satuanPendidikan} · Kelas ${santri.kelasFormal}`
      : 'Jenjang formal belum lengkap'
    : null;

  const quranClassLabel = santri
    ? santri.kelas?.trim()
      ? `Kelas Al-Qur'an · ${santri.kelas.trim()}`
      : `Kelas Al-Qur'an belum ditetapkan`
    : null;

  const isGraduated = santri && (santri.statusAkademikFormal || 'Aktif') === 'Lulus';

  return (
    <section
      aria-label="Konteks akademik aktif"
      className={`flex flex-col gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/55 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
          <CalendarRange className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800/70">
            Periode Akademik Aktif
          </p>
          <p className="mt-0.5 truncate text-xs font-extrabold text-emerald-950 sm:text-sm">
            {tahunPelajaran} · {semester}
          </p>
        </div>
      </div>

      {santri && (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:justify-end">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700">
            <School className="h-3.5 w-3.5 flex-shrink-0 text-indigo-600" aria-hidden="true" />
            <span className="truncate">{formalLabel}</span>
          </span>
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700">
            <BookOpenCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
            <span className="truncate">{quranClassLabel}</span>
          </span>
          {isGraduated && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
              Alumni
            </span>
          )}
        </div>
      )}
    </section>
  );
};
