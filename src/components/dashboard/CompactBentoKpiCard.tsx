import React from 'react';
import { AnimatedCounter } from '../AnimatedCounter';
import { useRipple } from '../../hooks/useRipple';

export interface CompactBentoKpiCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendPositive?: boolean | null;
  subtitle?: string;
  onClick?: () => void;
  iconTone?: 'emerald' | 'teal' | 'indigo' | 'amber' | 'rose' | 'sky';
  badge?: string;
  progressPercent?: number;
  suffix?: string;
}

const toneStyles: Record<
  string,
  { bg: string; text: string; ring: string; bar: string }
> = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'border-emerald-200/80',
    bar: 'bg-emerald-600',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    ring: 'border-teal-200/80',
    bar: 'bg-teal-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    ring: 'border-indigo-200/80',
    bar: 'bg-indigo-600',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'border-amber-200/80',
    bar: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'border-rose-200/80',
    bar: 'bg-rose-600',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    ring: 'border-sky-200/80',
    bar: 'bg-sky-600',
  },
};

/**
 * Helper to determine if a trend status is neutral (e.g., 'sama dengan kemarin', '0 dari kemarin', 'stagnan', 'tetap', 'stabil')
 * Guarantees neutral status indicators always render in calm slate-based colors instead of red.
 */
export function isNeutralTrendStatus(
  trend?: string,
  trendPositive?: boolean | null
): boolean {
  // Explicitly neutral if trendPositive is null
  if (trendPositive === null) {
    return true;
  }

  if (!trend) {
    return trendPositive === undefined;
  }

  const clean = trend.toLowerCase().trim();

  // Neutral or unchanged phrasing
  if (
    clean.includes('sama') || // 'sama dengan kemarin', 'tetap sama', 'sama seperti kemarin'
    clean.includes('stagnan') ||
    clean.includes('tetap') ||
    clean.includes('stabil') ||
    clean.includes('netral') ||
    clean.includes('seimbang') ||
    clean.includes('imbang') ||
    clean.includes('tidak ada perubahan') ||
    clean.includes('tidak berubah') ||
    clean.includes('tak berubah') ||
    clean.includes('tanpa perubahan') ||
    clean.includes('flat')
  ) {
    return true;
  }

  // Zero delta patterns (e.g., '0 dari kemarin', '+0 dari kemarin', '-0 dari kemarin', '0%', '+0', '-0')
  if (
    /(^|\s)[+-]?0(\.0+)?(\s*(dari|vs|dibanding|kemarin|%|setoran|santri|$))/i.test(clean) ||
    clean === '0' ||
    clean === '+0' ||
    clean === '-0'
  ) {
    return true;
  }

  // Mentions 'kemarin' without any positive or negative non-zero digits
  if (clean.includes('kemarin') && !/[1-9]/.test(clean)) {
    return true;
  }

  // If trendPositive is undefined and text does not clearly indicate a direction
  if (trendPositive === undefined) {
    const hasPositiveSign = clean.startsWith('+') || clean.includes('naik') || clean.includes('meningkat');
    const hasNegativeSign = clean.startsWith('-') || clean.includes('turun') || clean.includes('menurun');
    if (!hasPositiveSign && !hasNegativeSign) {
      return true;
    }
  }

  return false;
}

export const CompactBentoKpiCard: React.FC<CompactBentoKpiCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendPositive,
  subtitle,
  onClick,
  iconTone = 'emerald',
  badge,
  progressPercent,
  suffix,
}) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();
  const tone = toneStyles[iconTone] || toneStyles.emerald;

  const hasProgress = typeof progressPercent === 'number';

  // Neutral status detection: 'sama dengan kemarin', 0 delta, or neutral indicator must always be calm slate
  const isNeutralTrend = isNeutralTrendStatus(trend, trendPositive);

  const trendColorClass = isNeutralTrend
    ? 'text-slate-500 font-medium'
    : trendPositive === true || (trendPositive === undefined && (trend?.trim().startsWith('+') || trend?.toLowerCase().includes('naik') || trend?.toLowerCase().includes('meningkat')))
    ? 'text-emerald-700 font-bold'
    : 'text-rose-600 font-bold';

  const cardContent = (
    <div className="flex h-full flex-col justify-between p-3 md:p-3.5 lg:p-4 overflow-hidden select-none">
      {/* 1. Baris Atas: Grid dengan [Icon], [Label], dan [Badge] yang menyatu rapat */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5 sm:gap-2 min-w-0 w-full">
        <span
          className={`flex h-6 w-6 sm:h-6.5 sm:w-6.5 md:h-7 md:w-7 flex-shrink-0 items-center justify-center rounded-lg border ${tone.ring} ${tone.bg} ${tone.text} shadow-2xs`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 stroke-[2.2]" aria-hidden="true" />
        </span>
        <p className="truncate text-[10px] sm:text-[10.5px] md:text-[11px] font-bold tracking-wider text-slate-500 uppercase leading-none">
          {label}
        </p>

        {badge ? (
          <span className="justify-self-end flex-shrink-0 rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] sm:text-[9.5px] font-semibold text-slate-500 border border-slate-200/50 leading-none">
            {badge}
          </span>
        ) : (
          <span className="w-0" aria-hidden="true" />
        )}
      </div>

      {/* 2. Bagian Tengah: Angka Utama (24-28px) + Info Ringkas / Persentase */}
      <div className="flex items-baseline justify-between gap-1.5 min-w-0 pt-0.5">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-2xl sm:text-[24px] md:text-[26px] lg:text-[28px] font-black tracking-tight text-slate-900 tabular-nums leading-none">
            <AnimatedCounter value={value} duration={700} />
          </span>
          {suffix && (
            <span className="text-xs font-semibold text-slate-500">
              {suffix}
            </span>
          )}
        </div>

        {/* Jika kartu memiliki progress (Ziyadah/Muraja'ah), letakkan subtitle persentase di samping angka */}
        {hasProgress && subtitle && (
          <span className="text-[10px] sm:text-[10.5px] md:text-[11px] font-semibold text-slate-500 tabular-nums truncate max-w-[55%] text-right leading-none">
            {subtitle}
          </span>
        )}
      </div>

      {/* 3. Bagian Bawah: Footer dengan baseline yang seragam dan rapat */}
      <div className="min-w-0 h-3.5 flex items-center">
        {hasProgress ? (
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-100/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        ) : trend ? (
          <p className={`truncate text-[10px] sm:text-[10.5px] md:text-[11px] ${trendColorClass} leading-none`}>
            {trend}
          </p>
        ) : subtitle ? (
          <p className="truncate text-[10px] sm:text-[10.5px] md:text-[11px] text-slate-500 font-medium leading-none">
            {subtitle}
          </p>
        ) : (
          <div className="h-1" aria-hidden="true" />
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        ref={elementRef}
        type="button"
        onClick={(e) => {
          createRipple(e);
          onClick();
        }}
        className="ripple-container ui-bento-card ui-bento-card-interactive group flex flex-col justify-between w-full h-[106px] sm:h-[110px] md:h-[108px] lg:h-[112px] overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 cursor-pointer"
        aria-label={`${label}: ${value}`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="ui-bento-card flex flex-col justify-between w-full h-[106px] sm:h-[110px] md:h-[108px] lg:h-[112px] overflow-hidden">
      {cardContent}
    </div>
  );
};
