import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface SnackbarState {
  id: string;
  message: string;
  type: 'success' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

interface SnackbarProps {
  snack: SnackbarState | null;
  onDismiss: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({ snack, onDismiss, duration = 4000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
      setIsExiting(false);
    }, 150);
  }, [onDismiss]);

  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [snack, duration, dismiss]);

  if (!snack) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md">
      <div
        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border ${
          snack.type === 'success'
            ? 'bg-emerald-800 text-white border-emerald-700'
            : 'bg-rose-800 text-white border-rose-700'
        } ${isExiting ? 'snackbar-exit' : 'snackbar-enter'}`}
      >
        {snack.type === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-200 flex-shrink-0" />
        )}
        <span className="text-sm font-semibold flex-1">{snack.message}</span>
        {snack.actionLabel && snack.onAction && (
          <button
            onClick={() => { snack.onAction?.(); dismiss(); }}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-white/10"
          >
            {snack.actionLabel}
          </button>
        )}
        <button
          onClick={dismiss}
          className="text-white/60 hover:text-white transition cursor-pointer p-0.5"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
