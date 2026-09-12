import React from 'react';
import { AnimatedCounter } from '../AnimatedCounter';
import { useRipple } from '../../hooks/useRipple';

export interface CompactBentoKpiCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendPositive?: boolean;
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

  const cardContent = (
    <div className="flex h-full flex-col justify-between p-3 sm:p-3.5 overflow-hidden">
      {/* Top Header: Icon and Optional Badge */}
      <div className="flex items-center justify-between gap-1.5">
        <span
          className={`flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg sm:rounded-xl border ${tone.ring} ${tone.bg} ${tone.text} shadow-xs`}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        </span>

        {badge && (
          <span className="rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-slate-600 truncate">
            {badge}
          </span>
        )}
      </div>

      {/* Center / Body: Label & Big Counter Number */}
      <div className="my-auto min-w-0 py-0.5">
        <p className="truncate text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-xl sm:text-2xl font-[800] tracking-tight text-slate-900 tabular-nums leading-none">
            <AnimatedCounter value={value} duration={700} />
          </span>
          {suffix && (
            <span className="text-xs font-semibold text-slate-500">
              {suffix}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Trend or Subtitle or Mini Progress */}
      <div className="min-w-0">
        {typeof progressPercent === 'number' && (
          <div className="mb-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}

        {trend ? (
          <p
            className={`truncate text-[10px] sm:text-[11px] font-semibold ${
              trendPositive === true
                ? 'text-emerald-700'
                : trendPositive === false
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {trend}
          </p>
        ) : subtitle ? (
          <p className="truncate text-[10px] sm:text-[11px] text-slate-500">
            {subtitle}
          </p>
        ) : null}
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
        className="ripple-container ui-bento-card ui-bento-card-interactive group flex flex-col justify-between w-full h-[116px] sm:h-[124px] max-h-[124px] sm:max-h-[132px] overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label={`${label}: ${value}`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="ui-bento-card flex flex-col justify-between w-full h-[116px] sm:h-[124px] max-h-[124px] sm:max-h-[132px] overflow-hidden">
      {cardContent}
    </div>
  );
};
