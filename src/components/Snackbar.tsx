import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type SnackbarKind = 'success' | 'error' | 'info';

export interface SnackbarActionOptions {
  actionLabel?: string;
  onAction?: () => void;
}

export type NotifyFn = (type: SnackbarKind, message: string, options?: SnackbarActionOptions) => void;

export interface SnackbarState {
  id: string;
  message: string;
  type: SnackbarKind;
  actionLabel?: string;
  onAction?: () => void;
}

interface SnackbarProps {
  snack: SnackbarState | null;
  onDismiss: () => void;
  duration?: number;
}

const toneByType: Record<SnackbarKind, { state: string; icon: string }> = {
  success: { state: 'ui-state-success', icon: 'text-emerald-700' },
  error: { state: 'ui-state-error', icon: 'text-rose-700' },
  info: { state: 'ui-state-info', icon: 'text-sky-700' }
};

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
    const effectiveDuration = snack.type === 'error' || snack.actionLabel ? Math.max(duration, 7000) : duration;
    const timer = setTimeout(dismiss, effectiveDuration);
    return () => clearTimeout(timer);
  }, [snack, duration, dismiss]);

  if (!snack) return null;

  const tone = toneByType[snack.type];
  const Icon = snack.type === 'success' ? CheckCircle2 : snack.type === 'error' ? AlertCircle : Info;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-lg pointer-events-none">
      <div
        role={snack.type === 'error' ? 'alert' : 'status'}
        aria-live={snack.type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={`ui-state-surface pointer-events-auto flex items-center gap-3 px-3 py-2 rounded-xl shadow-lg ${tone.state} ${isExiting ? 'snackbar-exit' : 'snackbar-enter'}`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${tone.icon}`} aria-hidden="true" />
        <span className="text-sm font-medium leading-5 flex-1">{snack.message}</span>
        {snack.actionLabel && snack.onAction && (
          <button
            type="button"
            onClick={() => { snack.onAction?.(); dismiss(); }}
            className="min-h-11 px-3 rounded-lg border border-current/20 bg-white/70 text-sm font-semibold hover:bg-white transition-colors cursor-pointer flex-shrink-0"
          >
            {snack.actionLabel}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg hover:bg-white/70 transition-colors cursor-pointer flex-shrink-0"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
