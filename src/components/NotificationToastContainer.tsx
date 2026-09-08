import React, { useEffect } from 'react';
import { Bell, BookOpen, RotateCw, X } from 'lucide-react';
import { ToastNotification } from '../hooks/useSetoranNotifications';
import { formatTanggalLengkap } from '../utils/dateFormatter';

interface NotificationToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onDismiss
}) => {
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => onDismiss(t.id), 15000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="ui-notification-position fixed z-[60] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-96"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map(toast => {
        const isZiyadah = toast.data.type === 'Ziyadah';
        const TypeIcon = isZiyadah ? BookOpen : RotateCw;
        const typeTone = isZiyadah
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-teal-200 bg-teal-50 text-teal-800';

        return (
          <div
            key={toast.id}
            role="status"
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Notifikasi setoran</p>
                  <h4 className="mt-0.5 text-sm font-bold leading-5 text-slate-900">
                    {toast.title}
                  </h4>
                  <p className="mt-1 text-xs leading-4 text-slate-500">
                    Waktu setoran: {formatTanggalLengkap(toast.data.timestamp)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Tutup notifikasi setoran"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${typeTone}`}>
                <TypeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {toast.data.type}
              </div>

              <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                <dt className="text-slate-500">Materi</dt>
                <dd className="font-semibold text-slate-800 break-words">{toast.data.materi}</dd>
                <dt className="text-slate-500">Nilai</dt>
                <dd className="font-semibold text-slate-800">{toast.data.nilai}</dd>
                <dt className="text-slate-500">Penginput</dt>
                <dd className="text-slate-700 break-words">{toast.data.inputBy || 'Tidak tercatat'}</dd>
                <dt className="text-slate-500">Catatan</dt>
                <dd className="text-slate-700 break-words">{toast.data.catatan || 'Tidak ada catatan.'}</dd>
              </dl>
            </div>
          </div>
        );
      })}
    </div>
  );
};
