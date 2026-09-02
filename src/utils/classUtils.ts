export type ClassGroup = 'Tahfidz' | 'Jilid' | string;

export function getClassGroup(className: string | null | undefined): ClassGroup {
  const value = (className || '').trim();
  const normalized = value.toLowerCase();

  if (normalized.includes('tahfidz') || normalized.includes('tahfiz')) return 'Tahfidz';
  if (normalized.includes('jilid')) return 'Jilid';

  return value || '-';
}

export function getClassDetail(className: string | null | undefined): string {
  const value = (className || '').trim();
  const group = getClassGroup(value);
  return group === value ? '' : value;
}

export function matchesClassGroup(className: string | null | undefined, selectedGroup: string): boolean {
  if (!selectedGroup || selectedGroup === 'Semua Kelas') return true;
  return getClassGroup(className) === selectedGroup;
}

export const CLASS_GROUP_OPTIONS = ['Semua Kelas', 'Tahfidz', 'Jilid', 'Binnadzor A', 'Binnadzor B', 'Kelas Istimewa'] as const;
