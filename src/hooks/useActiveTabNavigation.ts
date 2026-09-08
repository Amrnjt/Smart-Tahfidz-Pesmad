import { useCallback, useEffect, useState } from 'react';
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

export function useActiveTabNavigation(user: User | null): [ActiveTab, (tab: ActiveTab) => void] {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => sanitizeTab(user, readUrlTab()));

  const setActiveTab = useCallback((requestedTab: ActiveTab) => {
    const nextTab = sanitizeTab(user, requestedTab);
    setActiveTabState(nextTab);

    if (typeof window === 'undefined') return;
    const currentTab = new URLSearchParams(window.location.search).get('tab');
    if (currentTab === nextTab) return;
    window.history.pushState(null, '', urlForTab(nextTab));
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = () => {
      const requestedTab = readUrlTab();
      const nextTab = sanitizeTab(user, requestedTab);
      setActiveTabState(nextTab);

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
