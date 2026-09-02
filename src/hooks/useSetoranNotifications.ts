import { useState, useEffect, useRef, useCallback } from 'react';
import { ZiyadahRecord, MurojaahRecord, User, Santri } from '../types';
import { storageService } from '../services/storageService';
import { formatTanggalLengkap } from '../utils/dateFormatter';

export interface SetoranNotificationData {
  id: string;
  type: 'Ziyadah' | 'Murojaah';
  namaSantri: string;
  materi: string;
  nilai: string;
  catatan: string;
  timestamp: string;
  inputBy: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  body: string;
  data: SetoranNotificationData;
  timestamp: number;
}

const NOTIFICATION_DELAY_MS = 10 * 60 * 1000;
const STORAGE_KEY = 'tahfidz_pending_notifications_v1';

interface PendingNotification {
  recordId: string;
  fireAt: number;
  data: SetoranNotificationData;
}

function loadPending(): PendingNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePending(items: PendingNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function buildNotificationData(
  record: ZiyadahRecord | MurojaahRecord,
  type: 'Ziyadah' | 'Murojaah'
): SetoranNotificationData {
  const materi = type === 'Ziyadah'
    ? `${(record as ZiyadahRecord).surah} (Ayat ${(record as ZiyadahRecord).ayatAwal} - ${(record as ZiyadahRecord).ayatAkhir})`
    : (record as MurojaahRecord).surahAtauJuz;

  return {
    id: record.id,
    type,
    namaSantri: record.namaSantri || record.idSantri,
    materi,
    nilai: record.nilai,
    catatan: record.catatan,
    timestamp: record.timestamp,
    inputBy: record.inputBy,
  };
}

function buildNotificationText(data: SetoranNotificationData): { title: string; body: string } {
  const tanggal = formatTanggalLengkap(data.timestamp);
  const jenisLabel = data.type === 'Ziyadah' ? 'Hafalan Baru (Ziyadah)' : "Muroja'ah";
  const title = `Setoran ${jenisLabel} Baru - ${data.namaSantri}`;
  const body =
    `Materi: ${data.materi}\n` +
    `Nilai: ${data.nilai}\n` +
    `Tanggal: ${tanggal}\n` +
    `Dicatat oleh: ${data.inputBy}\n` +
    `Catatan: ${data.catatan || '-'}`;
  return { title, body };
}

export function useSetoranNotifications(
  currentUser: User | null,
  ziyadahRecords: ZiyadahRecord[],
  murojaahRecords: MurojaahRecord[],
  santriList: Santri[]
) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const knownRecordIds = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const initializedRef = useRef(false);

  const targetSantriId = currentUser?.idSantri || '';

  // Request notification permission for Wali users
  const requestPermission = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'Wali') return;
    if (typeof Notification === 'undefined') return;

    if (Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        await storageService.updateUser(currentUser.id, { notificationPermission: result });
      } catch (err) {
        console.warn('Notification permission request failed:', err);
      }
    } else {
      setPermission(Notification.permission);
    }
  }, [currentUser]);

  // Fire a notification - browser push if granted, in-app toast as fallback
  const fireNotification = useCallback((data: SetoranNotificationData) => {
    const { title, body } = buildNotificationText(data);

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/vite.svg',
          tag: data.id,
          requireInteraction: false,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return;
      } catch (err) {
        console.warn('Browser notification failed, falling back to toast:', err);
      }
    }

    // Fallback: in-app toast
    const toast: ToastNotification = {
      id: `toast-${data.id}-${Date.now()}`,
      title,
      body,
      data,
      timestamp: Date.now(),
    };
    setToasts(prev => [...prev, toast]);
  }, []);

  // Schedule a delayed notification
  const scheduleNotification = useCallback((data: SetoranNotificationData) => {
    const fireAt = Date.now() + NOTIFICATION_DELAY_MS;
    const pending: PendingNotification = { recordId: data.id, fireAt, data };

    const existing = loadPending().filter(p => p.recordId !== data.id);
    existing.push(pending);
    savePending(existing);

    const delay = Math.max(0, fireAt - Date.now());
    const timer = setTimeout(() => {
      fireNotification(data);
      const cleaned = loadPending().filter(p => p.recordId !== data.id);
      savePending(cleaned);
      timersRef.current.delete(data.id);
    }, delay);

    timersRef.current.set(data.id, timer);
  }, [fireNotification]);

  // Initialize: request permission, load pending notifications, seed known IDs
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Wali') return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    requestPermission();

    // Seed known record IDs to avoid notifying for old records
    const allRecords = [...ziyadahRecords, ...murojaahRecords];
    allRecords.forEach(r => knownRecordIds.current.add(r.id));

    // Restore any pending notifications from localStorage (survives page reload)
    const pending = loadPending();
    const now = Date.now();
    pending.forEach(p => {
      if (p.fireAt <= now) {
        // Already past fire time - fire immediately
        fireNotification(p.data);
      } else {
        const delay = p.fireAt - now;
        const timer = setTimeout(() => {
          fireNotification(p.data);
          const cleaned = loadPending().filter(x => x.recordId !== p.recordId);
          savePending(cleaned);
          timersRef.current.delete(p.recordId);
        }, delay);
        timersRef.current.set(p.recordId, timer);
      }
    });
    const stillPending = pending.filter(p => p.fireAt > now);
    savePending(stillPending);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Watch for new setoran records matching this Wali's santri
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Wali' || !targetSantriId) return;
    if (!initializedRef.current) return;

    const newZiyadah = ziyadahRecords.filter(
      r => r.idSantri === targetSantriId && !knownRecordIds.current.has(r.id)
    );
    const newMurojaah = murojaahRecords.filter(
      r => r.idSantri === targetSantriId && !knownRecordIds.current.has(r.id)
    );

    if (newZiyadah.length === 0 && newMurojaah.length === 0) return;

    newZiyadah.forEach(r => {
      knownRecordIds.current.add(r.id);
      scheduleNotification(buildNotificationData(r, 'Ziyadah'));
    });
    newMurojaah.forEach(r => {
      knownRecordIds.current.add(r.id);
      scheduleNotification(buildNotificationData(r, 'Murojaah'));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ziyadahRecords, murojaahRecords, currentUser, targetSantriId, scheduleNotification]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  return {
    toasts,
    dismissToast,
    permission,
    requestPermission,
  };
}
