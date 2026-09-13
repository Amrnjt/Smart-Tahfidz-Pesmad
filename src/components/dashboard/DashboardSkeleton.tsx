import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-pulse" aria-label="Memuat dashboard...">
      {/* Hero Skeleton (160-200px) */}
      <div className="h-44 sm:h-52 w-full rounded-2xl bg-emerald-900/20 border border-emerald-800/30 p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-800/40" />
            <div className="h-5 w-32 rounded-full bg-emerald-800/30" />
          </div>
          <div className="h-6 w-24 rounded-full bg-emerald-800/30" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-emerald-800/40" />
          <div className="h-7 w-56 rounded bg-emerald-800/50" />
          <div className="h-3 w-80 rounded bg-emerald-800/30" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-xl bg-emerald-800/50" />
          <div className="h-9 w-28 rounded-xl bg-emerald-800/30" />
        </div>
      </div>

      {/* KPI Grid Skeleton (2 cols mobile, 4 cols desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[116px] sm:h-[124px] max-h-[124px] sm:max-h-[132px] rounded-2xl bg-white border border-slate-200/80 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-slate-100" />
              <div className="h-4 w-10 rounded bg-slate-100" />
            </div>
            <div className="space-y-1">
              <div className="h-2.5 w-16 rounded bg-slate-100" />
              <div className="h-6 w-20 rounded bg-slate-200" />
            </div>
            <div className="h-2 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Bento Middle Row Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
        </div>
        <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
        </div>
        <div className="h-44 rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-24 w-full rounded-xl bg-slate-100" />
        </div>
      </div>

      {/* Tren Bulanan + Aktivitas Skeleton (2/3 + 1/3 Bento Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1.2fr)] gap-3 sm:gap-4">
        <div className="h-[280px] rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="h-6 w-24 rounded-lg bg-slate-100" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded bg-slate-100" />
            <div className="h-5 w-20 rounded bg-slate-100" />
          </div>
          <div className="h-44 w-full rounded-xl bg-slate-50" />
        </div>
        <div className="h-[280px] rounded-2xl bg-white border border-slate-200/80 p-4 space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="h-5 w-16 rounded bg-slate-100" />
          </div>
          <div className="space-y-2 flex-1 pt-1">
            {[1, 2, 3, 4].map(k => (
              <div key={k} className="h-10 rounded-xl bg-slate-50 flex items-center p-2 gap-2">
                <div className="h-7 w-7 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-2 w-16 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-8 w-full rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
};
