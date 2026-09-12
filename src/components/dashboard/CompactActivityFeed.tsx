import React, { useMemo } from 'react';
import {
  Clock,
  ArrowRight,
  BookOpen,
  RotateCw,
  BookCheck,
  GraduationCap
} from 'lucide-react';
import { PredikatNilai } from '../../types';
import { useRipple } from '../../hooks/useRipple';
import { parseDateSafe } from '../../utils/dateFormatter';

export interface ActivityItem {
  id: string;
  timestamp: string;
  category: 'Ziyadah' | "Muroja'ah" | 'Binnadzor' | 'Pembelajaran';
  material: string;
  nilai?: PredikatNilai | string;
  catatan?: string;
  inputBy?: string;
  idSantri?: string;
  namaSantri?: string;
}

export interface CompactActivityFeedProps {
  activities: ActivityItem[];
  onViewAll: () => void;
  maxItems?: number;
  showSantriName?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

const categoryMeta = {
  Ziyadah: {
    letter: 'Z',
    label: 'Ziyadah',
    badgeTone: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: BookOpen,
    dotColor: 'bg-emerald-500'
  },
  "Muroja'ah": {
    letter: 'M',
    label: "Muroja'ah",
    badgeTone: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: RotateCw,
    dotColor: 'bg-teal-500'
  },
  Binnadzor: {
    letter: 'B',
    label: 'Binnadzor',
    badgeTone: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: BookCheck,
    dotColor: 'bg-indigo-500'
  },
  Pembelajaran: {
    letter: 'P',
    label: 'Kelas',
    badgeTone: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: GraduationCap,
    dotColor: 'bg-amber-500'
  }
};

const scoreTone: Record<string, string> = {
  'Sangat Baik': 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'Baik': 'bg-sky-50 text-sky-700 border-sky-200/80',
  'Kurang': 'bg-amber-50 text-amber-700 border-amber-200/80',
  'Mengulang': 'bg-rose-50 text-rose-700 border-rose-200/80'
};

const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

function formatTimeOnly(d: Date): string {
  const jam = d.getHours().toString().padStart(2, '0');
  const menit = d.getMinutes().toString().padStart(2, '0');
  return `${jam}:${menit}`;
}

export const CompactActivityFeed: React.FC<CompactActivityFeedProps> = ({
  activities = [],
  onViewAll,
  maxItems = 6,
  showSantriName = true,
  title = 'Aktivitas Bulanan',
  subtitle = 'Aktivitas terbaru bulan ini',
  className = ''
}) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();

  // Determine date grouping for activities
  const displayedActivities = useMemo(() => {
    return activities.slice(0, maxItems);
  }, [activities, maxItems]);

  const groupedActivities = useMemo(() => {
    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayDateStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;

    const groups: { dateKey: string; groupLabel: string; items: ActivityItem[] }[] = [];

    displayedActivities.forEach((activity) => {
      const parsed = parseDateSafe(activity.timestamp);
      const datePart = (activity.timestamp || '').split(' ')[0] || parsed.toISOString().slice(0, 10);

      let groupLabel = '';
      if (datePart === todayDateStr) {
        groupLabel = 'HARI INI';
      } else if (datePart === yesterdayDateStr) {
        groupLabel = 'KEMARIN';
      } else {
        groupLabel = `${parsed.getDate()} ${NAMA_BULAN_PENDEK[parsed.getMonth()]}`;
      }

      let existingGroup = groups.find(g => g.groupLabel === groupLabel);
      if (!existingGroup) {
        existingGroup = { dateKey: datePart, groupLabel, items: [] };
        groups.push(existingGroup);
      }
      existingGroup.items.push(activity);
    });

    return groups;
  }, [displayedActivities]);

  return (
    <div
      className={`ui-bento-card bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* 1. Header: Icon + Title + Subtitle and Count Badge */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70 shadow-2xs">
              <Clock className="h-4 w-4 text-emerald-700" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-[800] tracking-tight text-slate-900 truncate">
                {title}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                {subtitle}
              </p>
            </div>
          </div>

          <span className="rounded-md bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/70 flex-shrink-0">
            {activities.length} total
          </span>
        </div>

        {/* 2. Compact Activity Rows with Subtle Timeline */}
        <div className="mt-2 space-y-2">
          {displayedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-6 w-6 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-700">
                Belum ada aktivitas terbaru.
              </p>
              <p className="text-[11px] text-slate-400">
                Setoran yang dicatat akan muncul di daftar ini.
              </p>
            </div>
          ) : (
            groupedActivities.map((group) => (
              <div key={group.groupLabel} className="space-y-1">
                {/* Subtle date separator chip */}
                <div className="flex items-center gap-2 pt-1 pb-0.5">
                  <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase">
                    {group.groupLabel}
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                {/* Rows in this date group */}
                <div className="relative pl-1 space-y-1.5">
                  {/* Very subtle vertical line connecting items */}
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-100" aria-hidden="true" />

                  {group.items.map((activity) => {
                    const meta = categoryMeta[activity.category] || categoryMeta.Ziyadah;
                    const parsedDate = parseDateSafe(activity.timestamp);
                    const timeOnly = formatTimeOnly(parsedDate);
                    const shortDate = `${parsedDate.getDate()} ${NAMA_BULAN_PENDEK[parsedDate.getMonth()]}`;

                    return (
                      <div
                        key={activity.id}
                        className="group relative flex items-center justify-between gap-2.5 p-1.5 sm:p-2 rounded-xl transition-colors hover:bg-emerald-50/40 border border-transparent hover:border-emerald-100/60"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Compact category badge container */}
                          <div
                            className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl border font-black text-[11px] sm:text-xs shadow-2xs ${meta.badgeTone}`}
                            title={meta.label}
                          >
                            {meta.letter}
                          </div>

                          {/* Text content: Title + Metadata */}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-[13px] font-bold text-slate-900 truncate leading-snug">
                              <span className="font-semibold text-slate-700">{meta.label}</span>
                              <span className="text-slate-400 mx-1">·</span>
                              <span>{activity.material}</span>
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              {showSantriName && activity.namaSantri && (
                                <>
                                  <span className="font-medium text-slate-700">{activity.namaSantri}</span>
                                  <span>·</span>
                                </>
                              )}
                              <span>{shortDate}</span>
                              <span>·</span>
                              <span>{timeOnly}</span>
                              {activity.inputBy && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-400">{activity.inputBy}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Right: Score/Status pill */}
                        {activity.nilai && (
                          <span
                            className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold border ${
                              scoreTone[activity.nilai] || 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {activity.nilai}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Footer CTA: Lihat Semua Aktivitas */}
      {displayedActivities.length > 0 && (
        <div className="pt-2 mt-2 border-t border-slate-100">
          <button
            ref={elementRef}
            type="button"
            onClick={(e) => {
              createRipple(e);
              onViewAll();
            }}
            className="ripple-container flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span>Lihat Semua Aktivitas</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-700 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
};
