import type { Kelas } from '../types';

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
  return getClassGroup(className) === selectedGroup;
}

export const CLASS_GROUP_OPTIONS = ['Semua Kelas', 'Tahfidz', 'Binnadzor', 'Jilid', 'Kelas Istimewa'] as const;


export function getKelasPengampuIds(kelas: Pick<Kelas, 'musyrifId' | 'musyrifIds'>): string[] {
  const ids = [
    ...(kelas.musyrifIds || []),
    ...(kelas.musyrifId ? [kelas.musyrifId] : []),
  ].map(id => String(id || '').trim()).filter(Boolean);

  return Array.from(new Set(ids));
}

export function isKelasDiampuOleh(
  kelas: Pick<Kelas, 'musyrifId' | 'musyrifIds'>,
  userId: string | null | undefined,
): boolean {
  const cleanUserId = String(userId || '').trim();
  return cleanUserId ? getKelasPengampuIds(kelas).includes(cleanUserId) : false;
}


export function isBinnadzorClass(
  kelas: Pick<Kelas, 'namaKelas' | 'tipeKelas'>
): boolean {
  return getClassGroup(kelas.namaKelas) === 'Binnadzor'
    || getClassGroup(kelas.tipeKelas) === 'Binnadzor';
}

export function consolidateBinnadzorClasses(kelasList: Kelas[]): Kelas[] {
  const binnadzorClasses = kelasList.filter(isBinnadzorClass);
  if (binnadzorClasses.length === 0) return kelasList;

  const canonical =
    binnadzorClasses.find(kelas => kelas.namaKelas.trim().toLowerCase() === 'binnadzor')
    || binnadzorClasses[0];

  const santriIds = Array.from(new Set(
    binnadzorClasses.flatMap(kelas => kelas.santriIds || []).filter(Boolean)
  ));
  const musyrifIds = Array.from(new Set(
    binnadzorClasses.flatMap(kelas => getKelasPengampuIds(kelas)).filter(Boolean)
  ));
  const musyrifNames = Array.from(new Set(
    binnadzorClasses
      .flatMap(kelas => String(kelas.musyrif || '').split(','))
      .map(name => name.trim())
      .filter(Boolean)
  ));

  const silabusById = new Map<string, NonNullable<Kelas['silabusMateri']>[number]>();
  binnadzorClasses.forEach(kelas => {
    (kelas.silabusMateri || []).forEach(materi => {
      if (!silabusById.has(materi.id)) silabusById.set(materi.id, materi);
    });
  });

  const merged: Kelas = {
    ...canonical,
    namaKelas: 'Binnadzor',
    tipeKelas: 'Binnadzor',
    musyrif: musyrifNames.join(', '),
    musyrifId: musyrifIds[0],
    musyrifIds,
    santriIds,
    silabusMateri: Array.from(silabusById.values()),
  };

  const firstBinnadzorIndex = kelasList.findIndex(isBinnadzorClass);
  const withoutVariants = kelasList.filter(kelas => !isBinnadzorClass(kelas));
  withoutVariants.splice(Math.max(0, firstBinnadzorIndex), 0, merged);
  return withoutVariants;
}
