import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { PredikatNilai } from '../../types';
import { formatTanggalWaktu } from '../../utils/dateFormatter';
import { useRipple } from '../../hooks/useRipple';

export interface AttentionItem {
  id: string;
  idSantri: string;
  namaSantri: string;
  category: string;
  material: string;
  nilai: PredikatNilai;
  timestamp: string;
}

interface CompactAttentionBentoProps {
  todayAttentionCount: number;
  totalAttentionCount: number;
  items: AttentionItem[];
  onViewAll: () => void;
  className?: string;
}

export const CompactAttentionBento: React.FC<CompactAttentionBentoProps> = ({
  todayAttentionCount,
  totalAttentionCount,
  items,
  onViewAll,
  className = '',
}) => {
  const hasAttention = items.length > 0;

  return (
    <div
      id="ustadz-tindak-lanjut"
      className={`ui-bento-card scroll-mt-24 p-4 sm:p-5 flex flex-col justify-between ${
        todayAttentionCount > 0 ? 'border-amber-200/90' : ''
      } ${className}`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                todayAttentionCount > 0
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {todayAttentionCount > 0 ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Tindak Lanjut Setoran
              </h2>
              <p className="text-[11px] text-slate-500">
                Nilai Kurang / Mengulang aktual
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              todayAttentionCount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {todayAttentionCount > 0 ? `${todayAttentionCount} Hari Ini` : 'Nihil Hari Ini'}
          </span>
        </div>

        {/* Content list */}
        <div className="mt-2.5 divide-y divide-slate-100">
          {!hasAttention ? (
            <div className="flex min-h-[90px] flex-col items-center justify-center py-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <p className="mt-1 text-xs font-bold text-slate-800">
                Semua hafalan berjalan baik
              </p>
              <p className="text-[11px] text-slate-500">
                Tidak ada setoran yang memerlukan evaluasi ulang saat ini.
              </p>
            </div>
          ) : (
            items.slice(0, 3).map((item) => (
              <AttentionRow key={`${item.category}-${item.id}`} item={item} onClick={onViewAll} />
            ))
          )}
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <button
          type="button"
          onClick={onViewAll}
          className="group inline-flex w-full items-center justify-between text-xs font-semibold text-emerald-700 hover:text-emerald-900"
        >
          <span>
            Lihat semua riwayat evaluasi{' '}
            {totalAttentionCount > 0 && `(${totalAttentionCount})`}
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

const AttentionRow: React.FC<{ item: AttentionItem; onClick: () => void }> = ({
  item,
  onClick,
}) => {
  const { elementRef, createRipple } = useRipple<HTMLButtonElement>();
  const isMengulang = item.nilai === 'Mengulang';

  return (
    <button
      ref={elementRef}
      type="button"
      onClick={(e) => {
        createRipple(e);
        onClick();
      }}
      className="ripple-container group -mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${
              isMengulang ? 'bg-rose-500' : 'bg-amber-500'
            }`}
          />
          <p className="truncate text-xs font-bold text-slate-900">
            {item.namaSantri}
          </p>
        </div>
        <p className="truncate text-[11px] text-slate-600 pl-3.5">
          {item.category} • {item.material}
        </p>
        <p className="text-[10px] text-slate-400 pl-3.5">
          {formatTanggalWaktu(item.timestamp)}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            isMengulang
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {item.nilai}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
      </div>
    </button>
  );
};
