import type { Kelas, Santri, TipeKelas } from '../types';

interface DevelopmentScopeInput {
  selectedKelas: Kelas | null;
  kelasList: Kelas[];
  santriList: Santri[];
  activeTipeKelas: TipeKelas;
}

export function getDevelopmentAllowedSantriIds({
  selectedKelas,
  kelasList,
  santriList,
  activeTipeKelas,
}: DevelopmentScopeInput): Set<string> | null {
  if (selectedKelas) {
    if (selectedKelas.santriIds?.length) {
      return new Set(selectedKelas.santriIds);
    }

    const fallbackIds = santriList
      .filter(s => s.kelas === selectedKelas.namaKelas || s.kelas === selectedKelas.tipeKelas)
      .map(s => s.idSantri);

    return fallbackIds.length ? new Set(fallbackIds) : null;
  }

  // Aggregate Binnadzor views must not depend on class membership arrays.
  // Binnadzor records are already scoped by activity type, and historical
  // class membership can be incomplete or temporarily empty.
  if (activeTipeKelas.startsWith('Binnadzor')) {
    return null;
  }

  const matchingClasses = kelasList.filter(k => k.tipeKelas === activeTipeKelas);
  const ids = matchingClasses.flatMap(k => k.santriIds || []);
  return ids.length ? new Set(ids) : null;
}
