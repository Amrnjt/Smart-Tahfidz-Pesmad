import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ActiveTab, User } from '../types';

const VALID_TABS: ActiveTab[] = [
  'dashboard',
  'ziyadah',
  'murojaah',
  'binnadzor',
  'pembelajaran',
  'riwayat',
  'mushaf',
  'santri',
  'kelas',
  'pantauan'
];

const STAFF_TABS = new Set<ActiveTab>(VALID_TABS);
const PIMPINAN_TABS = new Set<ActiveTab>(['dashboard', 'riwayat', 'mushaf']);
const WALI_TABS = new Set<ActiveTab>(['dashboard', 'riwayat', 'mushaf', 'pantauan']);
const SANTRI_TABS = new Set<ActiveTab>(['dashboard', 'riwayat', 'mushaf']);
const SAFE_FALLBACK_TABS = new Set<ActiveTab>(['dashboard']);

function readUrlTab(): ActiveTab {
  if (typeof window === 'undefined') return 'dashboard';
  const raw = new URLSearchParams(window.location.search).get('tab')?.trim().toLowerCase() || '';
  return VALID_TABS.includes(raw as ActiveTab) ? raw as ActiveTab : 'dashboard';
}

function allowedTabsForRole(user: User | null): Set<ActiveTab> {
  if (!user) return SAFE_FALLBACK_TABS;

  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'ustadz' || role === 'superadmin') return STAFF_TABS;
  if (role === 'pimpinan') return PIMPINAN_TABS;
  if (role === 'wali' || role.includes('wali')) return WALI_TABS;
  if (role === 'santri') return SANTRI_TABS;
  return SAFE_FALLBACK_TABS;
}

function sanitizeTab(user: User | null, tab: ActiveTab): ActiveTab {
  const allowedTabs = allowedTabsForRole(user);
  return allowedTabs.has(tab) ? tab : 'dashboard';
}

function urlForTab(tab: ActiveTab): string {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', tab);
  return `${url.pathname}${url.search}${url.hash}`;
}

const resetNavigationScroll = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

let localPageEntranceTimer: number | null = null;

const startLocalPageEntrance = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const page = document.querySelector<HTMLElement>('.p3-page-content');
  if (!page) return;

  page.classList.remove('is-navigation-entering');
  window.requestAnimationFrame(() => {
    page.classList.add('is-navigation-entering');
    if (localPageEntranceTimer !== null) {
      window.clearTimeout(localPageEntranceTimer);
    }
    localPageEntranceTimer = window.setTimeout(() => {
      page.classList.remove('is-navigation-entering');
      localPageEntranceTimer = null;
    }, 300);
  });
};

function commitLocalNavigation(update: () => void): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    update();
    return;
  }

  flushSync(update);
  resetNavigationScroll();
  startLocalPageEntrance();
}

export function useActiveTabNavigation(user: User | null): [ActiveTab, (tab: ActiveTab) => void] {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => sanitizeTab(user, readUrlTab()));

  const setActiveTab = useCallback((requestedTab: ActiveTab) => {
    const nextTab = sanitizeTab(user, requestedTab);

    if (typeof window !== 'undefined') {
      const currentTab = new URLSearchParams(window.location.search).get('tab');
      if (currentTab !== nextTab) {
        window.history.pushState(null, '', urlForTab(nextTab));
      }
    }

    if (nextTab === activeTab) return;
    commitLocalNavigation(() => setActiveTabState(nextTab));
  }, [activeTab, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isInitialSync = true;
    const syncFromLocation = () => {
      const requestedTab = readUrlTab();
      const nextTab = sanitizeTab(user, requestedTab);

      if (isInitialSync) {
        setActiveTabState(nextTab);
        isInitialSync = false;
      } else {
        commitLocalNavigation(() => setActiveTabState(nextTab));
      }

      const currentTab = new URLSearchParams(window.location.search).get('tab');
      if (currentTab !== nextTab) {
        window.history.replaceState(null, '', urlForTab(nextTab));
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [user]);

  return [activeTab, setActiveTab];
}
