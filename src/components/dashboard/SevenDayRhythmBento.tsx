import React from 'react';
import { Calendar } from 'lucide-react';

export interface DayPulse {
  key: string;
  label: string;
  count: number;
}

interface SevenDayRhythmBentoProps {
  pulse: DayPulse[];
  todayKey: string;
  totalWeekly: number;
  momentumLabel: string;
  className?: string;
}

export const SevenDayRhythmBento: React.FC<SevenDayRhythmBentoProps> = ({
  pulse,
  todayKey,
  totalWeekly,
  momentumLabel,
  className = '',
}) => {
  const maxCount = Math.max(1, ...pulse.map((d) => d.count));

  return (
    <div className={`ui-bento-card p-4 sm:p-5 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
            <Calendar className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              Ritme 7 Hari
            </h2>
            <p className="text-[11px] text-slate-500">
              Total {totalWeekly} setoran minggu ini
            </p>
          </div>
        </div>

        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {momentumLabel}
        </span>
      </div>

      {/* Bar graph */}
      <div
        className="my-3 flex h-20 items-end gap-1.5 sm:gap-2 px-1"
        role="img"
        aria-label={`Aktivitas 7 hari terakhir, total ${totalWeekly} setoran`}
      >
        {pulse.map((day) => {
          const isToday = day.key === todayKey;
          const heightPercent =
            day.count === 0 ? 8 : Math.max(18, Math.round((day.count / maxCount) * 100));

          return (
            <div
              key={day.key}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex h-14 w-full items-end justify-center rounded-lg bg-slate-100/90 p-0.5 sm:p-1">
                <span
                  className={`w-full rounded-md transition-all duration-500 ${
                    isToday
                      ? 'bg-emerald-600 shadow-xs ring-1 ring-emerald-400/50'
                      : day.count > 0
                      ? 'bg-emerald-400/80 hover:bg-emerald-500'
                      : 'bg-slate-200/80'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.label}: ${day.count} setoran`}
                />
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold ${
                  isToday ? 'text-emerald-800 underline' : 'text-slate-500'
                }`}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>Hari ini ditandai hijau tua</span>
        <span className="font-semibold text-slate-700">
          {pulse.find((p) => p.key === todayKey)?.count || 0} setoran hari ini
        </span>
      </div>
    </div>
  );
};
