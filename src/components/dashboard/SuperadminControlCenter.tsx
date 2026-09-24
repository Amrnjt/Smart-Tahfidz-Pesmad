import React, { useMemo } from 'react';
import {
  CircleAlert,
  Database,
  FileSpreadsheet,
  GraduationCap,
  School,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import type { Santri, User } from '../../types';

interface SuperadminControlCenterProps {
  santriList: Santri[];
  userList: User[];
  onOpenSantri: () => void;
  onOpenKelas: () => void;
  onOpenCollectiveReport: () => void;
}

interface MetricProps {
  label: string;
  value: number;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const Metric: React.FC<MetricProps> = ({ label, value, note, icon: Icon, tone }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-black tabular-nums tracking-tight text-slate-900">{value}</p>
      </div>
      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
    <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{note}</p>
  </div>
);

interface DistributionProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

const Distribution: React.FC<DistributionProps> = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
    <div className="flex min-w-0 items-center gap-2">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-slate-200">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="truncate text-xs font-bold text-slate-700">{label}</span>
    </div>
    <span className="text-sm font-black tabular-nums text-slate-900">{value}</span>
  </div>
);

export const SuperadminControlCenter: React.FC<SuperadminControlCenterProps> = ({
  santriList,
  userList,
  onOpenSantri,
  onOpenKelas,
  onOpenCollectiveReport,
}) => {
  const health = useMemo(() => {
    const activeSantri = santriList.filter(
      santri => (santri.statusAkademikFormal || 'Aktif') === 'Aktif',
    );
    const alumni = santriList.filter(santri => santri.statusAkademikFormal === 'Lulus');

    const formalIncomplete = activeSantri.filter(
      santri => !santri.satuanPendidikan || !santri.kelasFormal,
    );

    const knownSantriIds = new Set(
      santriList.map(santri => santri.idSantri?.trim()).filter(Boolean),
    );
    const personalAccounts = userList.filter(user => {
      const role = String(user.role || '').trim().toLowerCase();
      return role === 'wali' || role === 'santri';
    });
    const unlinkedPersonalAccounts = personalAccounts.filter(user => {
      const idSantri = user.idSantri?.trim();
      return !idSantri || !knownSantriIds.has(idSantri);
    });

    const idFrequency = new Map<string, number>();
    santriList.forEach(santri => {
      const id = santri.idSantri?.trim();
      if (!id) return;
      idFrequency.set(id, (idFrequency.get(id) || 0) + 1);
    });
    const duplicateIds = Array.from(idFrequency.values()).filter(count => count > 1).length;

    const countFormalClass = (kelas: 'VII' | 'VIII' | 'IX') =>
      activeSantri.filter(santri => santri.kelasFormal === kelas).length;

    const issueCount =
      formalIncomplete.length + unlinkedPersonalAccounts.length + duplicateIds;

    return {
      activeSantri: activeSantri.length,
      formalIncomplete: formalIncomplete.length,
      unlinkedPersonalAccounts: unlinkedPersonalAccounts.length,
      duplicateIds,
      totalAccounts: userList.length,
      vii: countFormalClass('VII'),
      viii: countFormalClass('VIII'),
      ix: countFormalClass('IX'),
      alumni: alumni.length,
      issueCount,
    };
  }, [santriList, userList]);

  const isHealthy = health.issueCount === 0;

  return (
    <section
      aria-label="Control Center Superadmin"
      className="ui-bento-card overflow-hidden p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isHealthy
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {isHealthy ? (
                <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
              ) : (
                <CircleAlert className="h-4.5 w-4.5" aria-hidden="true" />
              )}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Superadmin Control Center
              </p>
              <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
                Kesehatan Data & Siklus Akademik
              </h2>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {isHealthy
              ? 'Data inti santri dan relasi akun personal dalam kondisi lengkap.'
              : `${health.issueCount} temuan perlu ditinjau pada data formal, relasi akun, atau identitas santri.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenSantri}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <UserCog className="h-4 w-4" aria-hidden="true" />
            Kelola Santri & Akun
          </button>
          <button
            type="button"
            onClick={onOpenKelas}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <School className="h-4 w-4" aria-hidden="true" />
            Kelola Kelas Al-Qur'an
          </button>
          <button
            type="button"
            onClick={onOpenCollectiveReport}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Rekap Kolektif
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-5">
        <Metric
          label="Santri Aktif"
          value={health.activeSantri}
          note="Status akademik formal Aktif"
          icon={Users}
          tone="bg-emerald-50 text-emerald-700"
        />
        <Metric
          label="Formal Belum Lengkap"
          value={health.formalIncomplete}
          note="Belum memiliki MTs dan/atau kelas VII–IX"
          icon={CircleAlert}
          tone={health.formalIncomplete > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}
        />
        <Metric
          label="Akun Belum Terhubung"
          value={health.unlinkedPersonalAccounts}
          note="Akun Wali/Santri tanpa relasi ID santri yang valid"
          icon={UserCog}
          tone={health.unlinkedPersonalAccounts > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}
        />
        <Metric
          label="ID Santri Ganda"
          value={health.duplicateIds}
          note="Jumlah ID yang muncul lebih dari satu kali"
          icon={Database}
          tone={health.duplicateIds > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'}
        />
        <Metric
          label="Total Akun"
          value={health.totalAccounts}
          note="Seluruh akun role di sistem"
          icon={ShieldCheck}
          tone="bg-indigo-50 text-indigo-700"
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Siklus Akademik
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Distribusi formal aktif dan alumni
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Data saat ini
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Distribution label="Kelas VII" value={health.vii} icon={School} />
          <Distribution label="Kelas VIII" value={health.viii} icon={School} />
          <Distribution label="Kelas IX" value={health.ix} icon={School} />
          <Distribution label="Alumni" value={health.alumni} icon={GraduationCap} />
        </div>
      </div>
    </section>
  );
};
