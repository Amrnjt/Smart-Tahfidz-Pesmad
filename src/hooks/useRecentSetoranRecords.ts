import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  EMPTY_SETORAN_DATASET,
  type SetoranDataset,
} from '../services/setoranQuery.types';
import {
  setoranQueryService,
  type SetoranQueryService,
} from '../services/setoranQueryService';
import { initialChannel, reduceChannel } from '../state/setoranChannelReducer';
import { createRecentRange } from '../utils/setoranDataset';

interface UseRecentSetoranRecordsOptions {
  enabled: boolean;
  now?: Date;
  deletedIds?: ReadonlySet<string>;
  initialData?: SetoranDataset;
  service?: SetoranQueryService;
}

const EMPTY_DELETED_IDS: ReadonlySet<string> = new Set();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useRecentSetoranRecords({
  enabled,
  now,
  deletedIds = EMPTY_DELETED_IDS,
  initialData,
  service = setoranQueryService,
}: UseRecentSetoranRecordsOptions) {
  const [initialDataset] = useState(() => initialData ?? EMPTY_SETORAN_DATASET);
  const [state, dispatch] = useReducer(
    reduceChannel<SetoranDataset>,
    initialChannel(initialDataset, Boolean(initialData)),
  );
  const [retryToken, setRetryToken] = useState(0);
  const requestIdRef = useRef(0);
  const range = createRecentRange(now ?? new Date(), 30);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      dispatch({ type: 'reset', data: EMPTY_SETORAN_DATASET });
      return;
    }

    const requestId = ++requestIdRef.current;
    dispatch({ type: 'start', requestId });

    const unsubscribe = service.subscribeRecentRecords(
      range,
      data => dispatch({ type: 'success', requestId, data }),
      error => dispatch({ type: 'error', requestId, error: errorMessage(error) }),
      deletedIds,
    );

    return unsubscribe;
  }, [
    deletedIds,
    enabled,
    range.endExclusive,
    range.startInclusive,
    retryToken,
    service,
  ]);

  const retry = useCallback(() => {
    setRetryToken(token => token + 1);
  }, []);

  return { ...state, retry };
}
