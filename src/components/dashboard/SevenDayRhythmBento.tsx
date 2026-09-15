import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { isSetoranActiveDay } from '../../utils/scheduleHelper';

export interface DayPulse {
  key: string;
  label: string;
  count: number;
  isActiveDay?: boolean;
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
  const shouldReduceMotion = useReducedMotion();
  const maxCount = useMemo(() => Math.max(1, ...pulse.map((d) => d.count)), [pulse]);

  const todayCount = useMemo(
    () => pulse.find((p) => p.key === todayKey)?.count ?? 0,
    [pulse, todayKey]
  );

  const mostActiveDay = useMemo(() => {
    let top = pulse[0];
    for (const d of pulse) {
      if (d.count > (top?.count ?? 0)) {
        top = d;
      }
    }
    return top && top.count > 0 ? top : null;
  }, [pulse]);

  // Rata-rata dihitung per hari aktif dalam rentang 7 hari (Minggu, Senin, Selasa, Rabu = 4 hari)
  // Total mingguan tetap menghitung seluruh aktivitas riil termasuk setoran di luar jadwal
  const activeDaysCount = useMemo(() => {
    const count = pulse.filter((d) => d.isActiveDay ?? isSetoranActiveDay(d.key)).length;
    return count > 0 ? count : 4;
  }, [pulse]);

  const avgPerActiveDay = useMemo(() => {
    return (totalWeekly / activeDaysCount).toFixed(1).replace('.0', '');
  }, [totalWeekly, activeDaysCount]);

  // Momentum pill styling & icon
  const momentumMeta = useMemo(() => {
    const text = momentumLabel.toLowerCase().trim();
    if (text.includes('nonaktif') || text.includes('kembali') || text.includes('libur') || text.includes('jadwal')) {
      return {
        icon: Calendar,
        tone: 'bg-slate-100 text-slate-700 border-slate-200/90',
        iconColor: 'text-slate-600',
      };
    }
    if (text.includes('+') || text.includes('meningkat') || text.includes('naik') || text.includes('tinggi')) {
      return {
        icon: TrendingUp,
        tone: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
        iconColor: 'text-emerald-600',
      };
    }
    if (text.startsWith('-') || text.includes('menurun') || text.includes('turun') || text.includes('rendah')) {
      return {
        icon: TrendingDown,
        tone: 'bg-amber-50 text-amber-800 border-amber-200/90',
        iconColor: 'text-amber-600',
      };
    }
    return {
      icon: Minus,
      tone: 'bg-slate-50 text-slate-700 border-slate-200/90',
      iconColor: 'text-slate-500',
    };
  }, [momentumLabel]);

  const MomentumIcon = momentumMeta.icon;

  // Format short 3-letter day name
  const formatShortDay = (label: string) => {
    const trimmed = label.trim();
    if (trimmed.length <= 3) return trimmed;
    return trimmed.slice(0, 3);
  };

  return (
    <div
      className={`ui-bento-card p-3.5 sm:p-4 md:p-5 flex flex-col justify-between select-none overflow-hidden min-w-0 w-full ${className}`}
      style={{ minHeight: '205px' }}
    >
      {/* 1. Header Row */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/90 text-emerald-700 shadow-2xs">
            <Activity className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
              Ritme 7 Hari
            </h2>
            <p className="text-[11px] text-slate-500 leading-tight truncate">
              Aktivitas setoran 7 hari terakhir (Jadwal: Min–Rab)
            </p>
          </div>
        </div>

        {/* Momentum Status Pill */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold flex-shrink-0 transition-colors max-w-[170px] sm:max-w-none ${momentumMeta.tone}`}
          title={momentumLabel}
        >
          <MomentumIcon className={`h-3 w-3 ${momentumMeta.iconColor} stroke-[2.5] flex-shrink-0`} />
          <span className="truncate">{momentumLabel}</span>
        </span>
      </div>

      {/* 2. Main Analytics & Bar Chart Grid */}
      <div className="my-2.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 w-full overflow-hidden">
        {/* Compact Summary Block (Desktop/Tablet left column) */}
        <div className="hidden sm:flex flex-col justify-center sm:w-28 md:w-32 flex-shrink-0 pr-2 border-r border-slate-100">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-[26px] font-extrabold text-slate-900 tracking-tight leading-none">
              {totalWeekly}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Setoran
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">
            minggu ini
          </p>
          <div
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200/70 rounded-md px-1.5 py-0.5 w-fit"
            title="Rata-rata dihitung per hari aktif setoran (Minggu - Rabu)"
          >
            <span>Rata-rata: {avgPerActiveDay}/hari aktif</span>
          </div>
        </div>

        {/* Unified 7-Day Chart Area */}
        <div
          className="relative flex-1 flex flex-col justify-end"
          style={{ height: '115px' }}
          role="img"
          aria-label={`Aktivitas 7 hari terakhir, total ${totalWeekly} setoran. Hari ini ${todayCount} setoran.`}
        >
          {/* Subtle horizontal guidelines */}
          <div className="absolute inset-x-0 top-3 border-b border-dashed border-slate-100/90 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100/80 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-[22px] border-b border-slate-200 pointer-events-none" />

          {/* 7 Bars Container */}
          <div className="relative z-10 grid grid-cols-7 gap-1 sm:gap-2.5 h-full items-end pb-[22px]">
            {pulse.map((day, index) => {
              const isToday = day.key === todayKey;
              const isActiveDay = day.isActiveDay ?? isSetoranActiveDay(day.key);
              const shortDay = formatShortDay(day.label);

              // 3 Kondisi Spesifik Sesuai Pedoman:
              // 1. Hari aktif dengan setoran (isActiveDay && count > 0): solid / normal
              // 2. Hari aktif tanpa setoran (isActiveDay && count === 0): tetap menampilkan "0" dengan visual netral
              // 3. Hari nonaktif (Kamis - Sabtu):
              //    a. count === 0 -> tampil muted dengan "—" atau "Libur", bukan "0"
              //    b. count > 0 -> tampilkan datanya dan beri konteks "Di luar jadwal"
              const isOffScheduleData = !isActiveDay && day.count > 0;
              const isOffScheduleEmpty = !isActiveDay && day.count === 0;

              // Hitung persentase tinggi bar
              let heightPercent = 6;
              if (day.count > 0) {
                heightPercent = Math.max(18, Math.min(92, Math.round((day.count / maxCount) * 92)));
              } else if (isActiveDay) {
                heightPercent = 7;
              } else {
                heightPercent = 5;
              }

              // Text di atas bar
              let countDisplay: React.ReactNode = day.count;
              let countClass = 'font-semibold text-slate-700';

              if (isToday) {
                countClass = 'font-extrabold text-emerald-800';
              }

              if (isActiveDay && day.count === 0) {
                countDisplay = '0';
                countClass = 'font-medium text-slate-400';
              } else if (isOffScheduleEmpty) {
                countDisplay = '—';
                countClass = 'font-normal text-slate-300';
              } else if (isOffScheduleData) {
                countDisplay = day.count;
                countClass = 'font-bold text-amber-700';
              }

              // Tooltip text
              let tooltipText = `${day.label} · ${day.count} setoran`;
              if (isOffScheduleData) {
                tooltipText = `${day.label} · ${day.count} setoran (Di luar jadwal)`;
              } else if (isOffScheduleEmpty) {
                tooltipText = `${day.label} · Hari nonaktif setor (Libur)`;
              } else if (isActiveDay && day.count === 0) {
                tooltipText = `${day.label} · 0 setoran (Hari aktif)`;
              }
              if (isToday) {
                tooltipText += ' · Hari Ini';
              }

              // Bar color & style
              let barColorClass = 'bg-slate-200/85';
              if (isToday) {
                if (isOffScheduleData) {
                  barColorClass = 'bg-amber-600 ring-2 ring-amber-400/40 shadow-xs';
                } else if (isOffScheduleEmpty) {
                  barColorClass = 'bg-slate-200 ring-2 ring-slate-300/60';
                } else if (day.count > 0) {
                  barColorClass = 'bg-emerald-700 ring-2 ring-emerald-400/40 shadow-xs';
                } else {
                  barColorClass = 'bg-slate-300 ring-2 ring-slate-400/30';
                }
              } else if (day.count > 0) {
                if (isOffScheduleData) {
                  barColorClass = 'bg-amber-400/90 group-hover:bg-amber-500';
                } else {
                  barColorClass = 'bg-emerald-400/85 group-hover:bg-emerald-500';
                }
              } else if (isOffScheduleEmpty) {
                barColorClass = 'bg-slate-100 border-t border-dashed border-slate-300/80';
              } else {
                barColorClass = 'bg-slate-200/80 group-hover:bg-slate-300';
              }

              return (
                <div
                  key={day.key}
                  className="group relative flex h-full flex-col items-center justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap rounded bg-slate-900 text-white text-[10px] font-medium px-2 py-0.5 shadow-sm flex items-center gap-1">
                    <span>{tooltipText}</span>
                  </div>

                  {/* Count / Indicator above bar */}
                  <span
                    className={`mb-1 text-[10px] sm:text-[11px] leading-none transition-colors ${countClass}`}
                  >
                    {countDisplay}
                  </span>

                  {/* Animated Bar */}
                  <motion.div
                    className={`w-full max-w-[28px] sm:max-w-[32px] rounded-t-md origin-bottom transition-colors ${barColorClass}`}
                    style={{ height: `${heightPercent}%`, transformOrigin: 'bottom' }}
                    initial={shouldReduceMotion ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 0.45,
                            delay: index * 0.035,
                            ease: [0.16, 1, 0.3, 1],
                          }
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Day labels below baseline */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2.5 pt-1">
            {pulse.map((day) => {
              const isToday = day.key === todayKey;
              const isActiveDay = day.isActiveDay ?? isSetoranActiveDay(day.key);
              const shortDay = formatShortDay(day.label);

              return (
                <div key={`label-${day.key}`} className="flex flex-col items-center">
                  <span
                    className={`text-[10px] sm:text-[11px] tracking-tight leading-none ${
                      isToday
                        ? 'font-extrabold text-emerald-800'
                        : isActiveDay
                        ? 'font-medium text-slate-600'
                        : 'font-normal text-slate-400'
                    }`}
                  >
                    {shortDay}
                  </span>
                  {/* Status Indicator below label */}
                  {isToday ? (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-emerald-600" />
                  ) : !isActiveDay ? (
                    <span className="mt-0.5 text-[8px] text-slate-300 font-medium leading-none">
                      off
                    </span>
                  ) : (
                    <span className="mt-0.5 h-1 w-1 opacity-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Footer Info Row */}
      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 min-w-0 w-full overflow-hidden">
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <span className="font-bold text-slate-700 flex-shrink-0">Hari ini:</span>
          <span className="text-emerald-800 font-semibold truncate">
            {todayCount} setoran
            {!isSetoranActiveDay(todayKey) && todayCount > 0 ? ' (Di luar jadwal)' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 truncate pl-2 min-w-0">
          {mostActiveDay ? (
            <>
              <span className="hidden xs:inline text-slate-400 flex-shrink-0">·</span>
              <span className="font-medium text-slate-500 hidden sm:inline flex-shrink-0">Hari teraktif:</span>
              <span className="font-bold text-slate-800 truncate">
                {mostActiveDay.label} ({mostActiveDay.count})
              </span>
            </>
          ) : (
            <span className="text-slate-400 italic">Belum ada aktivitas</span>
          )}
        </div>
      </div>
    </div>
  );
};
