import type { ActiveTab, ShalatJamaahStatus } from '../src/types';

const pantauanPageTab: ActiveTab = 'pantauan';
void pantauanPageTab;

const supportedPantauanStatuses = [
  "Jama'ah",
  'Sakit',
  'Berhalangan',
  'Tanpa Alasan',
] as const satisfies readonly ShalatJamaahStatus[];

void supportedPantauanStatuses;
