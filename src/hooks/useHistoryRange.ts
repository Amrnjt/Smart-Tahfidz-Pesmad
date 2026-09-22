import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { CombinedHistoryItem } from '../types';
import { deduplicateHistoryItems } from '../utils/historyUtils';
import { createHistoryQueryKey, createHistoryScopeKey } from '../utils/historyQueryKey';
import {
  fetchHistoryPage,
  fetchHistoryRange,
  type HistoryPageCursor,
} from '../services/historyRepository';
import type {
  HistoryQueryScope,
  HistoryRangeRequest,
} from '../services/historyQueryTypes';

export type HistoryLoadStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

export interface HistoryRangeState {
  records: CombinedHistoryItem[];
  status: HistoryLoadStatus;
  error: string | null;
  activeRequestId: number;
  source: 'server' | 'scoped-cache' | null;
}

export type HistoryRangeAction =
  | { type: 'start'; requestId: number; preserveRecords: boolean }
  | { type: 'success'; requestId: number; records: CombinedHistoryItem[]; source: 'server' | 'scoped-cache' }
  | { type: 'error'; requestId: number; error: string };

export const initialHistoryRangeState: HistoryRangeState = {
  records: [],
  status: 'idle',
  error: null,
  activeRequestId: 0,
  source: null,
};

export function historyRangeReducer(state: HistoryRangeState, action: HistoryRangeAction): HistoryRangeState {
  if (action.type === 'start') {
    const records = action.preserveRecords ? state.records : [];
    return {
      ...state,
      records,
      activeRequestId: action.requestId,
      status: records.length > 0 ? 'refreshing' : 'loading',
      error: null,
      source: action.preserveRecords ? state.source : null,
    };
  }

  if (action.requestId !== state.activeRequestId) return state;

  if (action.type === 'success') {
    return {
      records: action.records,
      status: 'success',
      error: null,
      activeRequestId: state.activeRequestId,
      source: action.source,
    };
  }

  return {
    ...state,
    status: 'error',
    error: action.error,
  };
}

export function useHistoryRange(request: HistoryRangeRequest | null) {
  const [state, dispatch] = useReducer(historyRangeReducer, initialHistoryRangeState);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestIdRef = useRef(0);
  const previousKeyRef = useRef<string | null>(null);
  const requestKey = request ? createHistoryQueryKey(request) : 'disabled';

  useEffect(() => {
    if (!request) return;
    const requestId = ++requestIdRef.current;
    const preserveRecords = previousKeyRef.current === requestKey;
    previousKeyRef.current = requestKey;
    let cancelled = false;
    dispatch({ type: 'start', requestId, preserveRecords });

    fetchHistoryRange(request)
      .then(result => {
        if (!cancelled) {
          dispatch({ type: 'success', requestId, records: result.records, source: result.source });
        }
      })
      .catch(error => {
        if (!cancelled) {
          dispatch({
            type: 'error',
            requestId,
            error: error instanceof Error ? error.message : 'Riwayat belum dapat dimuat.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, refreshToken]);

  const refresh = useCallback(() => setRefreshToken(value => value + 1), []);

  return { ...state, refresh };
}

interface ArchiveState {
  records: CombinedHistoryItem[];
  status: HistoryLoadStatus;
  error: string | null;
  cursor: HistoryPageCursor;
  hasMore: boolean;
}

export function useHistoryArchive(scope: HistoryQueryScope, enabled: boolean) {
  const [state, setState] = useState<ArchiveState>({
    records: [],
    status: 'idle',
    error: null,
    cursor: {},
    hasMore: true,
  });
  const scopeKey = createHistoryScopeKey(scope);
  const requestIdRef = useRef(0);

  const loadFirstPage = useCallback(async () => {
    if (!enabled) return;
    const requestId = ++requestIdRef.current;
    setState(current => ({
      ...current,
      records: [],
      cursor: {},
      hasMore: true,
      status: 'loading',
      error: null,
    }));

    try {
      const result = await fetchHistoryPage(scope);
      if (requestId !== requestIdRef.current) return;
      setState({
        records: result.records,
        status: 'success',
        error: null,
        cursor: result.cursor,
        hasMore: result.hasMore,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState(current => ({
        ...current,
        status: 'error',
        error: error instanceof Error ? error.message : 'Arsip riwayat belum dapat dimuat.',
      }));
    }
  }, [enabled, scopeKey]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      setState({ records: [], status: 'idle', error: null, cursor: {}, hasMore: true });
      return;
    }
    void loadFirstPage();
  }, [enabled, scopeKey, loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || !state.hasMore || state.status === 'loading' || state.status === 'refreshing') return;
    const requestId = ++requestIdRef.current;
    setState(current => ({ ...current, status: 'refreshing', error: null }));
    try {
      const result = await fetchHistoryPage(scope, state.cursor);
      if (requestId !== requestIdRef.current) return;
      setState(current => ({
        records: deduplicateHistoryItems([...current.records, ...result.records]).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')),
        status: 'success',
        error: null,
        cursor: result.cursor,
        hasMore: result.hasMore,
      }));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setState(current => ({
        ...current,
        status: 'error',
        error: error instanceof Error ? error.message : 'Arsip berikutnya belum dapat dimuat.',
      }));
    }
  }, [enabled, scopeKey, state.cursor, state.hasMore, state.status]);

  return {
    ...state,
    refresh: loadFirstPage,
    loadMore,
  };
}
