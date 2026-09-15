import type {
  BinnadzorRecord,
  MurojaahRecord,
  PembelajaranRecord,
  ZiyadahRecord,
} from '../types';

export interface SetoranDataset {
  ziyadah: ZiyadahRecord[];
  murojaah: MurojaahRecord[];
  binnadzor: BinnadzorRecord[];
  pembelajaran: PembelajaranRecord[];
}

export interface SetoranDateRange {
  startInclusive: string;
  endExclusive: string;
}

export type QueryChannelStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryChannelState<T> {
  data: T;
  status: QueryChannelStatus;
  error: string | null;
  isStale: boolean;
  requestId: number;
}

export const EMPTY_SETORAN_DATASET: SetoranDataset = {
  ziyadah: [],
  murojaah: [],
  binnadzor: [],
  pembelajaran: [],
};
