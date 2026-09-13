import React from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { useRipple } from '../../hooks/useRipple';

interface QualityRingBentoProps {
  percent: number | null;
  count: number;
  total: number;
  onClick: () => void;
  className?: string;
}

export const QualityRingBento: React.FC<QualityRingBentoProps> = ({
  percent,
  count,
  total,
  onClick,
  className = '',
}) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();

  return (
    <button
      ref={elementRef}
      type="button"
      onClick={(e) => {
        createRipple(e);
        onClick();
      }}
      className={`ripple-container ui-bento-card ui-bento-card-interactive flex w-full items-center justify-between p-3.5 sm:p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${className}`}
      aria-label="Kualitas Sangat Baik. Buka analitik kualitas"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${percent ?? 0} 100`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-[800] text-emerald-900">
            {percent === null ? '—' : `${percent}%`}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Kualitas Sangat Baik
          </p>
          <p className="truncate text-sm sm:text-base font-bold text-slate-900 mt-0.5">
            {count} dari {total} setoran
          </p>
          <p className="truncate text-[10px] sm:text-[11px] text-emerald-700 font-medium">
            Ketuk untuk analitik lengkap
          </p>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </button>
  );
};
