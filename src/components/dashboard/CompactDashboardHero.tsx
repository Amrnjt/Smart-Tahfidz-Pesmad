import React, { ReactNode } from 'react';
import { PesmadLogo } from '../PesmadLogo';
import { useRipple } from '../../hooks/useRipple';

export interface HeroAction {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'amber';
  ariaLabel?: string;
}

interface CompactDashboardHeroProps {
  userName: string;
  greeting?: string;
  roleBadge: string;
  subtext?: string;
  summaryPill?: ReactNode;
  actions?: HeroAction[];
  className?: string;
}

export const CompactDashboardHero: React.FC<CompactDashboardHeroProps> = ({
  userName,
  greeting = "Assalamu'alaikum",
  roleBadge,
  subtext = 'Semoga hafalan dan ikhtiar hari ini penuh berkah.',
  summaryPill,
  actions = [],
  className = '',
}) => {
  return (
    <header
      role="banner"
      aria-label="Contextual Dashboard Hero"
      className={`ui-bento-hero relative isolate overflow-hidden text-white ${className}`}
    >
      {/* Subtle Islamic Geometric Art Watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-10 h-48 w-48 opacity-[0.08] sm:h-56 sm:w-56 lg:h-64 lg:w-64"
      >
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full stroke-white stroke-[1.5]">
          <circle cx="100" cy="100" r="90" />
          <polygon points="100,10 163,37 190,100 163,163 100,190 37,163 10,100 37,37" />
          <polygon points="100,30 149,51 170,100 149,149 100,170 51,149 30,100 51,51" />
          <circle cx="100" cy="100" r="40" />
        </svg>
      </div>

      {/* Soft Glow Radial Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/15 blur-2xl"
      />

      <div className="relative z-10 flex flex-col justify-between p-4 sm:p-5 lg:p-6 min-h-[155px] sm:min-h-[185px] lg:min-h-[210px]">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
              <PesmadLogo size="sm" className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-950/50 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold tracking-wide text-emerald-200 uppercase">
                {roleBadge}
              </span>
            </div>
          </div>

          {summaryPill && <div className="flex-shrink-0">{summaryPill}</div>}
        </div>

        {/* Central Contextual Greeting & Subtext */}
        <div className="my-2 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-emerald-200/90">
            {greeting},
          </p>
          <h1 className="truncate text-lg sm:text-2xl font-[800] tracking-tight text-white leading-tight">
            {userName}
          </h1>
          {subtext && (
            <p className="mt-0.5 max-w-xl truncate text-[11px] sm:text-xs text-emerald-100/75 leading-normal">
              {subtext}
            </p>
          )}
        </div>

        {/* Action Row - Mobile friendly, 1-2 CTA buttons */}
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {actions.map((act, idx) => (
              <HeroActionButton key={idx} action={act} />
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

const HeroActionButton: React.FC<{ action: HeroAction }> = ({ action }) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();
  const Icon = action.icon;

  let btnClasses =
    'ripple-container inline-flex min-h-[40px] sm:min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 active:scale-95';

  if (action.variant === 'amber') {
    btnClasses +=
      ' bg-amber-400 text-amber-950 hover:bg-amber-300 focus-visible:ring-amber-200';
  } else if (action.variant === 'secondary') {
    btnClasses +=
      ' border border-emerald-500/40 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/70 hover:text-white focus-visible:ring-emerald-300';
  } else {
    // primary default
    btnClasses +=
      ' bg-white text-emerald-950 hover:bg-emerald-50 focus-visible:ring-emerald-200';
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
      <span>{action.label}</span>
    </button>
  );
};
