import React, { useEffect } from 'react';
import { ToastNotification } from '../hooks/useSetoranNotifications';
import { BookOpen, RotateCw, X, Bell } from 'lucide-react';

interface NotificationToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  toasts,
  onDismiss
}) => {
  // Auto-dismiss each toast after 15 seconds
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => onDismiss(t.id), 15000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] sm:w-96">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-white rounded-2xl shadow-xl border border-emerald-200 overflow-hidden animate-in slide-in-from-right duration-300"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold">Notifikasi Setoran Baru</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/70 hover:text-white transition cursor-pointer p-0.5"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-200">
                {toast.data.type === 'Ziyadah' ? (
                  <BookOpen className="w-4.5 h-4.5 text-emerald-700" />
                ) : (
                  <RotateCw className="w-4.5 h-4.5 text-teal-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                  {toast.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Diterima 10 menit yang lalu
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-500 w-14 flex-shrink-0">Materi</span>
                <span className="font-semibold text-slate-800">{toast.data.materi}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-500 w-14 flex-shrink-0">Nilai</span>
                <span className="font-semibold text-emerald-700">{toast.data.nilai}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-500 w-14 flex-shrink-0">Catatan</span>
                <span className="text-slate-600 italic flex-1">{toast.data.catatan || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
