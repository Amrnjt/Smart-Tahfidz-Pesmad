import type { CombinedHistoryItem } from '../types';

export type HistoryQueryScope =
  | { kind: 'staff' }
  | { kind: 'student'; idSantri: string };

export interface HistoryRangeRequest {
  startDate: string;
  endDate: string;
  scope: HistoryQueryScope;
}

export interface HistoryQueryResult {
  records: CombinedHistoryItem[];
  source: 'server' | 'scoped-cache';
}

export type HistoryQueryErrorCode = 'INDEX_REQUIRED' | 'OFFLINE' | 'INVALID_SCOPE' | 'UNKNOWN';

export class HistoryQueryError extends Error {
  constructor(
    public readonly code: HistoryQueryErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'HistoryQueryError';
  }
}
