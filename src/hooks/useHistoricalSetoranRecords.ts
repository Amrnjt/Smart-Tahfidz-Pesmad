import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  EMPTY_SETORAN_DATASET,
  type SetoranDataset,
  type SetoranDateRange,
} from '../services/setoranQuery.types';
import {
  setoranQueryService,
  type SetoranQueryService,
} from '../services/setoranQueryService';
import { initialChannel, reduceChannel } from '../state/setoranChannelReducer';

interface UseHistoricalSetoranRecordsOptions {
  enabled: boolean;
  deletedIds?: ReadonlySet<string>;
  service?: SetoranQueryService;
}

const EMPTY_DELETED_IDS: ReadonlySet<string> = new Set();

type HistoricalRequest =
  | { type: 'range'; range: SetoranDateRange }
  | { type: 'all' };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useHistoricalSetoranRecords({
  enabled,
  deletedIds = EMPTY_DELETED_IDS,
  service = setoranQueryService,
}: UseHistoricalSetoranRecordsOptions) {
  const [state, dispatch] = useReducer(
    reduceChannel<SetoranDataset>,
    initialChannel(EMPTY_SETORAN_DATASET),
  );
  const requestIdRef = useRef(0);
  const lastRequestRef = useRef<HistoricalRequest | null>(null);

  useEffect(() => {
    if (enabled) return;
    requestIdRef.current += 1;
    lastRequestRef.current = null;
    dispatch({ type: 'reset', data: EMPTY_SETORAN_DATASET });
  }, [enabled]);

  const execute = useCallback(async (request: HistoricalRequest) => {
    if (!enabled) return;

    lastRequestRef.current = request;
    const requestId = ++requestIdRef.current;
    dispatch({ type: 'start', requestId });

    try {
      const data = request.type === 'range'
        ? await service.fetchRecordsByRange(request.range, deletedIds)
        : await service.fetchAllRecords(deletedIds);
      dispatch({ type: 'success', requestId, data });
    } catch (error) {
      dispatch({ type: 'error', requestId, error: errorMessage(error) });
    }
  }, [deletedIds, enabled, service]);

  const loadRange = useCallback(
    (range: SetoranDateRange) => execute({ type: 'range', range }),
    [execute],
  );

  const loadAll = useCallback(
    () => execute({ type: 'all' }),
    [execute],
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    lastRequestRef.current = null;
    dispatch({ type: 'reset', data: EMPTY_SETORAN_DATASET });
  }, []);

  const retry = useCallback(() => {
    if (lastRequestRef.current) void execute(lastRequestRef.current);
  }, [execute]);

  return {
    ...state,
    loadRange,
    loadAll,
    reset,
    retry,
  };
}
