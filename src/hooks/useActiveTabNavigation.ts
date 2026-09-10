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
  'kelas'
];

const VIEW_ONLY_TABS = new Set<ActiveTab>(['dashboard', 'riwayat', 'mushaf']);

function readUrlTab(): ActiveTab {
  if (typeof window === 'undefined') return 'dashboard';
  const raw = new URLSearchParams(window.location.search).get('tab')?.trim().toLowerCase() || '';
  return VALID_TABS.includes(raw as ActiveTab) ? raw as ActiveTab : 'dashboard';
}

function isViewOnlyUser(user: User | null): boolean {
  if (!user) return false;
  const role = String(user.role || '').trim().toLowerCase();
  return role === 'wali' || role.includes('wali') || role === 'santri';
}

function sanitizeTab(user: User | null, tab: ActiveTab): ActiveTab {
  if (!user) return 'dashboard';
  return isViewOnlyUser(user) && !VIEW_ONLY_TABS.has(tab) ? 'dashboard' : tab;
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
    }, 360);
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
