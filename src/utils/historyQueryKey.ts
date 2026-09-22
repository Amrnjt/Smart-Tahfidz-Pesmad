import type { HistoryRangeRequest, HistoryQueryScope } from '../services/historyQueryTypes';

export function createHistoryScopeKey(scope: HistoryQueryScope): string {
  return scope.kind === 'student' ? `student:${scope.idSantri}` : 'staff';
}

export function createHistoryQueryKey(request: HistoryRangeRequest): string {
  return `${createHistoryScopeKey(request.scope)}|${request.startDate}|${request.endDate}`;
}
