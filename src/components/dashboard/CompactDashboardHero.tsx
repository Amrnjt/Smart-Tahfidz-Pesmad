import React, { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { PesmadLogo } from '../PesmadLogo';
import { useRipple } from '../../hooks/useRipple';

export interface HeroAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'amber' | 'emerald';
  ariaLabel?: string;
}

export interface HeroStatusNotice {
  text: string;
  type?: 'attention' | 'positive' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

export interface CompactDashboardHeroProps {
  userName: string;
  greeting?: string;
  roleBadge: string;
  subtext?: string;
  summaryPill?: ReactNode;
  statusNotice?: HeroStatusNotice;
  primaryAction?: HeroAction | null;
  secondaryAction?: HeroAction | null;
  actions?: HeroAction[];
  className?: string;
}

export const CompactDashboardHero: React.FC<CompactDashboardHeroProps> = ({
  userName,
  greeting = "Assalamu'alaikum",
  roleBadge,
  subtext,
  summaryPill,
  statusNotice,
  primaryAction,
  secondaryAction,
  actions = [],
  className = '',
}) => {
  // Normalize actions: prefer explicit primary/secondary props, fallback to actions array
  const effectivePrimary = primaryAction !== undefined ? primaryAction : actions[0] || null;
  const effectiveSecondary = secondaryAction !== undefined ? secondaryAction : actions[1] || null;
  const hasActions = Boolean(effectivePrimary || effectiveSecondary);

  const isAttention = statusNotice?.type === 'attention';
  const isPositive = statusNotice?.type === 'positive';

  return (
    <header
      role="banner"
      aria-label="Contextual Daily Command Hero"
      className={`ui-bento-hero relative isolate overflow-hidden text-white transition-colors duration-300 ${
        isAttention ? 'border-b-2 border-amber-400/40' : ''
      } ${className}`}
    >
      {/* Subtle Islamic Geometric Art Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-10 h-44 w-44 opacity-[0.07] sm:h-52 sm:w-52 lg:h-60 lg:w-60"
      >
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full stroke-white stroke-[1.5]">
          <circle cx="100" cy="100" r="90" />
          <polygon points="100,10 163,37 190,100 163,163 100,190 37,163 10,100 37,37" />
          <polygon points="100,30 149,51 170,100 149,149 100,170 51,149 30,100 51,51" />
          <circle cx="100" cy="100" r="40" />
        </svg>
      </div>

      {/* Ambient Radial Accent */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full blur-2xl transition-colors duration-500 ${
          isAttention ? 'bg-amber-400/15' : 'bg-emerald-400/15'
        }`}
      />

      <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5 lg:p-6 min-h-[150px] sm:min-h-[175px] lg:min-h-[205px]">
        {/* 1. Top Header Row: Brand/Role Context & Summary Quick-Glance */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
              <PesmadLogo size="sm" className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold tracking-wide text-emerald-200 uppercase">
                {roleBadge}
              </span>
            </div>
          </div>

          {summaryPill && <div className="flex-shrink-0">{summaryPill}</div>}
        </div>

        {/* 2. Middle Main Row: Greeting, Daily Summary, Contextual Command Status & Action */}
        <div className="my-2.5 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3.5">
          {/* Left: User Greeting & Contextual Command Status */}
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-emerald-200/90 leading-none">
              {greeting},
            </p>
            <h1 className="mt-1 truncate text-xl sm:text-2xl lg:text-[26px] font-[800] tracking-tight text-white leading-tight">
              {userName}
            </h1>

            {/* Daily 1-Sentence Summary */}
            {subtext && (
              <p className="mt-1 text-xs sm:text-sm text-emerald-100/80 leading-snug">
                {subtext}
              </p>
            )}

            {/* Contextual Command Status Panel */}
            {statusNotice && (
              <div className="mt-2.5 inline-flex items-center gap-2 max-w-full">
                {isAttention ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs sm:text-sm font-semibold text-amber-200 shadow-2xs backdrop-blur-xs max-w-full min-w-0">
                    <AlertTriangle className="h-4 w-4 text-amber-300 flex-shrink-0" />
                    <span className="truncate">{statusNotice.text}</span>
                  </div>
                ) : isPositive ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/50 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-200 shadow-2xs backdrop-blur-xs max-w-full min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{statusNotice.text}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-950/40 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-200/90 shadow-2xs backdrop-blur-xs max-w-full min-w-0">
                    <Info className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                    <span className="truncate">{statusNotice.text}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Conditional Hero Action(s) */}
          {hasActions && (
            <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0 lg:flex-shrink-0 max-w-full">
              {effectivePrimary && <HeroActionButton action={effectivePrimary} isPrimary={true} />}
              {effectiveSecondary && <HeroActionButton action={effectiveSecondary} isPrimary={false} />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const HeroActionButton: React.FC<{ action: HeroAction; isPrimary: boolean }> = ({
  action,
  isPrimary,
}) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();
  const Icon = action.icon;

  let btnClasses =
    'ripple-container inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-98 max-w-full';

  if (action.variant === 'amber') {
    btnClasses +=
      ' bg-amber-400 text-amber-950 hover:bg-amber-300 ring-1 ring-amber-300/70 shadow-amber-950/20 focus-visible:ring-amber-200';
  } else if (action.variant === 'secondary') {
    btnClasses +=
      ' border border-emerald-400/35 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/70 hover:text-white focus-visible:ring-emerald-300';
  } else if (action.variant === 'emerald') {
    btnClasses +=
      ' bg-emerald-500 text-white hover:bg-emerald-400 focus-visible:ring-emerald-200';
  } else {
    // primary default
    btnClasses += isPrimary
      ? ' bg-white text-emerald-950 hover:bg-emerald-50 focus-visible:ring-emerald-200'
      : ' border border-emerald-400/35 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/70 focus-visible:ring-emerald-300';
  }

  return (
    <button
      ref={elementRef}
      type="button"
      onClick={(e) => {
        createRipple(e);
        action.onClick();
      }}
      aria-label={action.ariaLabel || action.label}
      className={btnClasses}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
      <span className="truncate">{action.label}</span>
    </button>
  );
};
