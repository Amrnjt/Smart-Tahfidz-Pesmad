export type ClassGroup = 'Tahfidz' | 'Binnadzor' | 'Jilid' | 'Kelas Istimewa' | string;

export function getClassGroup(className: string | null | undefined): ClassGroup {
  const value = (className || '').trim();
  const normalized = value.toLowerCase();

  if (normalized.includes('tahfidz') || normalized.includes('tahfiz')) return 'Tahfidz';
  if (normalized.includes('binnadzor')) return 'Binnadzor';
  if (normalized.includes('jilid') || normalized.includes('ummi')) return 'Jilid';
  if (normalized.includes('istimewa')) return 'Kelas Istimewa';

  return value || '-';
}

export function isNonTahfidzClass(className: string | null | undefined): boolean {
  const group = getClassGroup(className);
  return group === 'Jilid' || group === 'Kelas Istimewa' || group === 'Binnadzor';
}

export function getClassDetail(className: string | null | undefined): string {
  const value = (className || '').trim();
  const group = getClassGroup(value);
  return group === value ? '' : value;
}

export function matchesClassGroup(className: string | null | undefined, selectedGroup: string): boolean {
  if (!selectedGroup || selectedGroup === 'Semua Kelas') return true;
  const currentGroup = getClassGroup(className);
  if (selectedGroup === 'Binnadzor') {
    return currentGroup === 'Binnadzor' || currentGroup === 'Binnadzor A' || currentGroup === 'Binnadzor B';
  }
  return currentGroup === selectedGroup;
}

export const CLASS_GROUP_OPTIONS = ['Semua Kelas', 'Tahfidz', 'Binnadzor', 'Jilid', 'Kelas Istimewa'] as const;
