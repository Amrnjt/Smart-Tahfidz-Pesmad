import type { ActiveTab, UserRole } from '../types';

const ROLE_ALIASES: Record<string, UserRole> = {
  superadmin: 'Superadmin',
  pimpinan: 'Pimpinan',
  ustadz: 'Ustadz',
  wali: 'Wali',
  santri: 'Santri',
};

const READ_ONLY_TABS = new Set<ActiveTab>(['dashboard', 'riwayat', 'mushaf']);

export function normalizeUserRole(role: unknown): UserRole | null {
  const normalized = String(role ?? '').trim().toLowerCase();
  return ROLE_ALIASES[normalized] ?? null;
}

export function isPersonalViewOnlyRole(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Wali' || normalized === 'Santri';
}

export function isGlobalReadOnlyRole(role: unknown): boolean {
  return normalizeUserRole(role) === 'Pimpinan';
}

export function usesGlobalDashboard(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Superadmin' || normalized === 'Pimpinan' || normalized === 'Ustadz';
}

export function canAccessTab(role: unknown, tab: ActiveTab): boolean {
  const normalized = normalizeUserRole(role);
  if (!normalized) return false;

  if (normalized === 'Pimpinan' || normalized === 'Wali' || normalized === 'Santri') {
    return READ_ONLY_TABS.has(tab);
  }

  return normalized === 'Superadmin' || normalized === 'Ustadz';
}

export function canViewAllHistory(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Superadmin' || normalized === 'Pimpinan' || normalized === 'Ustadz';
}

export function canWriteSetoran(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Superadmin' || normalized === 'Ustadz';
}

export function canEditHistory(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Superadmin' || normalized === 'Ustadz';
}

export function canDeleteHistory(role: unknown): boolean {
  return normalizeUserRole(role) === 'Superadmin';
}

export function canManageSantri(role: unknown): boolean {
  return normalizeUserRole(role) === 'Superadmin';
}

export function canManageKelas(role: unknown): boolean {
  return normalizeUserRole(role) === 'Superadmin';
}

export function canManageUsers(role: unknown): boolean {
  return normalizeUserRole(role) === 'Superadmin';
}

export function isPimpinanRole(role: unknown): boolean {
  return normalizeUserRole(role) === 'Pimpinan';
}
