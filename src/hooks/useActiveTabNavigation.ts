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

function readHashTab(): ActiveTab {
  if (typeof window === 'undefined') return 'dashboard';
  const raw = window.location.hash.replace(/^#/, '').trim().toLowerCase();
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
  return `${window.location.pathname}${window.location.search}#${tab}`;
}

export function useActiveTabNavigation(user: User | null): [ActiveTab, (tab: ActiveTab) => void] {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => sanitizeTab(user, readHashTab()));

  const setActiveTab = useCallback((requestedTab: ActiveTab) => {
    const nextTab = sanitizeTab(user, requestedTab);
    setActiveTabState(nextTab);

    if (typeof window === 'undefined') return;
    if (window.location.hash === `#${nextTab}`) return;
    window.history.pushState(null, '', urlForTab(nextTab));
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = () => {
      const requestedTab = readHashTab();
      const nextTab = sanitizeTab(user, requestedTab);
      setActiveTabState(nextTab);

      if (requestedTab !== nextTab || window.location.hash !== `#${nextTab}`) {
        window.history.replaceState(null, '', urlForTab(nextTab));
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);

    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, [user]);

  return [activeTab, setActiveTab];
}
