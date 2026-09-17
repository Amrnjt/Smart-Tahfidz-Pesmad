import type { UserRole } from '../types';

const ROLE_ALIASES: Record<string, UserRole> = {
  superadmin: 'Superadmin',
  pimpinan: 'Pimpinan',
  ustadz: 'Ustadz',
  wali: 'Wali',
  santri: 'Santri',
};

export function normalizeUserRole(role: unknown): UserRole {
  const normalized = String(role ?? '').trim().toLowerCase();
  return ROLE_ALIASES[normalized] ?? 'Ustadz';
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
