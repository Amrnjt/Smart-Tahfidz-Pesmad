import type { User } from '../types';

export const loadPantauanLiburanPage = () =>
  import('../components/PantauanLiburanPage').then((module) => ({ default: module.PantauanLiburanPage }));

export const loadUstadzDashboard = () =>
  import('../components/UstadzDashboard').then((module) => ({ default: module.UstadzDashboard }));

export const loadWaliDashboard = () =>
  import('../components/WaliDashboard').then((module) => ({ default: module.WaliDashboard }));

export const loadSantriDashboard = () =>
  import('../components/SantriDashboard').then((module) => ({ default: module.SantriDashboard }));

export const loadZiyadahForm = () =>
  import('../components/ZiyadahForm').then((module) => ({ default: module.ZiyadahForm }));

export const loadMurojaahForm = () =>
  import('../components/MurojaahForm').then((module) => ({ default: module.MurojaahForm }));

export const loadBinnadzorForm = () =>
  import('../components/BinnadzorForm').then((module) => ({ default: module.BinnadzorForm }));

export const loadPembelajaranForm = () =>
  import('../components/PembelajaranForm').then((module) => ({ default: module.PembelajaranForm }));

export const loadHistoryTable = () =>
  import('../components/HistoryTable').then((module) => ({ default: module.HistoryTable }));

export const loadMushafQuran = () =>
  import('../components/MushafQuran').then((module) => ({ default: module.MushafQuran }));

export const loadSantriManagement = () =>
  import('../components/SantriManagement').then((module) => ({ default: module.SantriManagement }));

export const loadKelasManagement = () =>
  import('../components/KelasManagement').then((module) => ({ default: module.KelasManagement }));

type RouteLoader = () => Promise<unknown>;
type IdleCallbackHandle = number;

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
    options?: { timeout?: number }
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

function normalizeRole(user: Pick<User, 'role'>): 'ustadz' | 'pimpinan' | 'wali' | 'santri' {
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'pimpinan') return 'pimpinan';
  if (role === 'wali' || role.includes('wali')) return 'wali';
  if (role === 'santri') return 'santri';
  return 'ustadz';
}

export function preloadDashboardForUser(user: Pick<User, 'role'>): Promise<unknown> {
  const role = normalizeRole(user);
  if (role === 'wali') return loadWaliDashboard();
  if (role === 'santri') return loadSantriDashboard();
  return loadUstadzDashboard();
}

function getIdleQueue(user: Pick<User, 'role'>): RouteLoader[] {
  const role = normalizeRole(user);

  if (role === 'wali') {
    return [
      loadHistoryTable,
      loadPantauanLiburanPage,
      loadMushafQuran,
    ];
  }

  if (role === 'santri') {
    return [
      loadHistoryTable,
      loadMushafQuran,
    ];
  }

  if (role === 'pimpinan') {
    return [
      loadHistoryTable,
      loadMushafQuran,
      loadPantauanLiburanPage,
    ];
  }

  return [
    loadHistoryTable,
    loadZiyadahForm,
    loadMurojaahForm,
    loadBinnadzorForm,
    loadPembelajaranForm,
    loadMushafQuran,
    loadPantauanLiburanPage,
    loadSantriManagement,
    loadKelasManagement,
  ];
}

export function schedulePostLoginPrefetch(user: Pick<User, 'role'>): () => void {
  if (typeof window === 'undefined') return () => undefined;

  void preloadDashboardForUser(user).catch(() => undefined);

  const idleWindow = window as IdleWindow;
  const queue = getIdleQueue(user);
  let cancelled = false;
  let idleHandle: IdleCallbackHandle | null = null;
  let timeoutHandle: number | null = null;

  const scheduleNext = () => {
    if (cancelled || queue.length === 0) return;

    const run = () => {
      if (cancelled) return;
      const loader = queue.shift();
      if (!loader) return;
      void loader()
        .catch(() => undefined)
        .finally(scheduleNext);
    };

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(run, { timeout: 1500 });
    } else {
      timeoutHandle = window.setTimeout(run, 250);
    }
  };

  scheduleNext();

  return () => {
    cancelled = true;
    if (idleHandle !== null && idleWindow.cancelIdleCallback) {
      idleWindow.cancelIdleCallback(idleHandle);
    }
    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle);
    }
  };
}
