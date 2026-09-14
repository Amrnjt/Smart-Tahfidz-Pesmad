import type { User, UserRole } from '../types';

export function normalizeUserRole(role: unknown): UserRole | null {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'superadmin') return 'Superadmin';
  if (value === 'ustadz') return 'Ustadz';
  if (value === 'wali' || value === 'wali santri') return 'Wali';
  if (value === 'santri') return 'Santri';
  return null;
}

export function isStaffRole(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Superadmin' || normalized === 'Ustadz';
}

export function isViewOnlyRole(role: unknown): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === 'Wali' || normalized === 'Santri';
}

export function getLinkedSantriId(user: User | null | undefined): string {
  if (!user) return '';
  const role = normalizeUserRole(user.role);
  if (role !== 'Wali' && role !== 'Santri') return '';
  return String(user.idSantri || (role === 'Santri' ? user.username : '') || '').trim();
}
