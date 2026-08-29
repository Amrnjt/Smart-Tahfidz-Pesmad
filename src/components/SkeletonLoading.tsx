import React from 'react';

/**
 * Shimmer element dasar untuk efek visual loading yang halus dan elegan
 */
export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />
);

/**
 * Skeleton Loading untuk Tabel Riwayat Setoran (Ziyadah & Muroja'ah)
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-56 rounded-xl" />
          <SkeletonBox className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-28 rounded-xl" />
          <SkeletonBox className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Filter & Search Bar Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SkeletonBox className="h-10 w-full rounded-xl sm:col-span-1" />
        <SkeletonBox className="h-10 w-full rounded-xl" />
        <SkeletonBox className="h-10 w-full rounded-xl" />
      </div>

      {/* Table Skeleton Container */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        {/* Table Head */}
        <div className="bg-slate-100/90 px-4 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
          <SkeletonBox className="h-4 w-28 rounded" />
          <SkeletonBox className="h-4 w-24 rounded hidden sm:block" />
          <SkeletonBox className="h-4 w-20 rounded hidden md:block" />
          <SkeletonBox className="h-4 w-32 rounded" />
          <SkeletonBox className="h-4 w-20 rounded" />
          <SkeletonBox className="h-4 w-28 rounded hidden lg:block" />
          <SkeletonBox className="h-4 w-12 rounded" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="px-4 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              {/* Tanggal & Waktu */}
              <div className="space-y-1.5 w-36 sm:w-44 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-3.5 w-3.5 rounded-full" />
                  <SkeletonBox className="h-4 w-28 sm:w-32 rounded" />
                </div>
                <SkeletonBox className="h-3 w-20 rounded ml-5" />
              </div>

              {/* Santri */}
              <div className="hidden sm:block space-y-1 w-32 flex-shrink-0">
                <SkeletonBox className="h-4 w-24 rounded" />
                <SkeletonBox className="h-3 w-16 rounded" />
              </div>

              {/* Jenis Setoran Badge */}
              <div className="hidden md:block w-24 flex-shrink-0">
                <SkeletonBox className="h-6 w-20 rounded-full" />
              </div>

              {/* Materi Hafalan */}
              <div className="flex-1 space-y-1 min-w-[120px]">
                <SkeletonBox className="h-4 w-36 rounded" />
                <SkeletonBox className="h-3 w-24 rounded" />
              </div>

              {/* Predikat Nilai */}
              <div className="w-24 flex-shrink-0">
                <SkeletonBox className="h-6 w-22 rounded-full" />
              </div>

              {/* Catatan / Pembimbing */}
              <div className="hidden lg:block w-36 flex-shrink-0 space-y-1">
                <SkeletonBox className="h-3.5 w-32 rounded" />
                <SkeletonBox className="h-3 w-20 rounded" />
              </div>

              {/* Action Button */}
              <div className="w-8 flex-shrink-0 flex justify-end">
                <SkeletonBox className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <SkeletonBox className="h-4 w-44 rounded-lg" />
        <SkeletonBox className="h-4 w-32 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Skeleton Loading untuk Dashboard Utama Pembimbing (Ustadz)
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner Skeleton */}
      <div className="bg-emerald-900/90 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-800/80 animate-pulse border-2 border-emerald-500/50 flex-shrink-0" />
            <div className="space-y-2.5 flex-1 max-w-lg">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-5 w-40 bg-emerald-700/60 rounded-full" />
                <SkeletonBox className="h-4 w-32 bg-emerald-700/40 rounded-full" />
              </div>
              <SkeletonBox className="h-7 w-64 bg-emerald-700/70 rounded-xl" />
              <SkeletonBox className="h-4 w-full bg-emerald-700/40 rounded-lg" />
            </div>
          </div>
          <SkeletonBox className="h-10 w-32 bg-emerald-700/60 rounded-xl self-start sm:self-center" />
        </div>
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5"
          >
            <SkeletonBox className="w-12 h-12 rounded-2xl flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <SkeletonBox className="h-3 w-16 rounded" />
              <SkeletonBox className="h-6 w-12 rounded" />
              <SkeletonBox className="h-2.5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Bar Skeleton */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-5 w-36 rounded-lg" />
          <SkeletonBox className="h-4 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SkeletonBox className="h-12 w-full rounded-xl" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Chart and Activity Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <SkeletonBox className="h-5 w-48 rounded-lg" />
              <SkeletonBox className="h-3.5 w-64 rounded" />
            </div>
            <SkeletonBox className="h-8 w-28 rounded-xl" />
          </div>
          <div className="h-64 sm:h-72 w-full bg-slate-50 rounded-2xl flex items-end p-4 gap-4 justify-around">
            <SkeletonBox className="h-1/3 w-8 rounded-t-lg" />
            <SkeletonBox className="h-1/2 w-8 rounded-t-lg" />
            <SkeletonBox className="h-3/4 w-8 rounded-t-lg" />
            <SkeletonBox className="h-2/3 w-8 rounded-t-lg" />
            <SkeletonBox className="h-4/5 w-8 rounded-t-lg" />
            <SkeletonBox className="h-1/2 w-8 rounded-t-lg" />
            <SkeletonBox className="h-full w-8 rounded-t-lg" />
          </div>
        </div>

        {/* Side Leaderboard / Activity Skeleton */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <SkeletonBox className="h-5 w-36 rounded-lg" />
            <SkeletonBox className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <SkeletonBox className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="space-y-1">
                    <SkeletonBox className="h-3.5 w-24 rounded" />
                    <SkeletonBox className="h-2.5 w-16 rounded" />
                  </div>
                </div>
                <SkeletonBox className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loading untuk Dashboard Santri & Wali
 */
export const SantriWaliDashboardSkeleton: React.FC<{ role?: 'Santri' | 'Wali' }> = ({ role = 'Santri' }) => {
  return (
    <div className="space-y-6">
      {/* Banner Profile Skeleton */}
      <div className="bg-emerald-900/90 rounded-3xl p-6 sm:p-7 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-800/80 animate-pulse border-2 border-emerald-500/50 flex-shrink-0" />
            <div className="space-y-2.5 flex-1">
              <SkeletonBox className="h-5 w-32 bg-emerald-700/60 rounded-full" />
              <SkeletonBox className="h-7 w-56 bg-emerald-700/70 rounded-xl" />
              <SkeletonBox className="h-4 w-72 bg-emerald-700/40 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-9 w-28 bg-emerald-700/60 rounded-xl" />
            <SkeletonBox className="h-9 w-28 bg-emerald-700/60 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Target & Progress Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-32 rounded" />
            <SkeletonBox className="h-5 w-24 rounded-full" />
          </div>
          <SkeletonBox className="h-8 w-24 rounded-xl" />
          <SkeletonBox className="h-3 w-full rounded-full" />
          <div className="flex justify-between">
            <SkeletonBox className="h-3 w-20 rounded" />
            <SkeletonBox className="h-3 w-20 rounded" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-32 rounded" />
            <SkeletonBox className="h-5 w-24 rounded-full" />
          </div>
          <SkeletonBox className="h-8 w-24 rounded-xl" />
          <SkeletonBox className="h-3 w-full rounded-full" />
          <div className="flex justify-between">
            <SkeletonBox className="h-3 w-20 rounded" />
            <SkeletonBox className="h-3 w-20 rounded" />
          </div>
        </div>
      </div>

      {/* Recent Setoran Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <SkeletonBox className="h-4 w-36 rounded" />
            <SkeletonBox className="h-4 w-28 rounded" />
          </div>
          <SkeletonBox className="h-5 w-48 rounded" />
          <SkeletonBox className="h-3.5 w-64 rounded" />
          <SkeletonBox className="h-6 w-20 rounded-full" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <SkeletonBox className="h-4 w-36 rounded" />
            <SkeletonBox className="h-4 w-28 rounded" />
          </div>
          <SkeletonBox className="h-5 w-48 rounded" />
          <SkeletonBox className="h-3.5 w-64 rounded" />
          <SkeletonBox className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Surah Progress Grid Skeleton */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <SkeletonBox className="h-5 w-44 rounded-lg" />
            <SkeletonBox className="h-3 w-56 rounded" />
          </div>
          <SkeletonBox className="h-7 w-20 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <SkeletonBox key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
