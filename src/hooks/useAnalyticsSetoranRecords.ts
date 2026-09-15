import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { EMPTY_SETORAN_DATASET, type SetoranDataset } from '../services/setoranQuery.types';
import {
  setoranQueryService,
  type SetoranQueryService,
} from '../services/setoranQueryService';
import { initialChannel, reduceChannel } from '../state/setoranChannelReducer';
import { createMonthRange, createRecentRange } from '../utils/setoranDataset';

interface UseAnalyticsSetoranRecordsOptions {
  enabled: boolean;
  months: 6 | 12;
  refreshToken: number;
  deletedIds?: ReadonlySet<string>;
  now?: Date;
  service?: SetoranQueryService;
}

const EMPTY_DELETED_IDS: ReadonlySet<string> = new Set();

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createAnalyticsRange(now: Date, months: 6 | 12) {
  const jakartaToday = createRecentRange(now, 1).startInclusive;
  const currentYear = Number(jakartaToday.slice(0, 4));
  const currentMonthIndex = Number(jakartaToday.slice(5, 7)) - 1;
  const currentMonth = createMonthRange(currentYear, currentMonthIndex);
  const firstMonth = new Date(Date.UTC(
    currentYear,
    currentMonthIndex - (months - 1),
    1,
  ));
  return {
    startInclusive: createMonthRange(
      firstMonth.getUTCFullYear(),
      firstMonth.getUTCMonth(),
    ).startInclusive,
    endExclusive: currentMonth.endExclusive,
  };
}

export function useAnalyticsSetoranRecords({
  enabled,
  months,
  refreshToken,
  deletedIds = EMPTY_DELETED_IDS,
  now,
  service = setoranQueryService,
}: UseAnalyticsSetoranRecordsOptions) {
  const [state, dispatch] = useReducer(
    reduceChannel<SetoranDataset>,
    initialChannel(EMPTY_SETORAN_DATASET),
  );
  const [retryToken, setRetryToken] = useState(0);
  const requestIdRef = useRef(0);
  const referenceDate = now ?? new Date();
  const range = createAnalyticsRange(referenceDate, months);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      dispatch({ type: 'reset', data: EMPTY_SETORAN_DATASET });
      return;
    }

    const requestId = ++requestIdRef.current;
    dispatch({ type: 'start', requestId });
    let active = true;

    void service.fetchRecordsByRange(range, deletedIds).then(
      data => {
        if (active) dispatch({ type: 'success', requestId, data });
      },
      error => {
        if (active) {
          dispatch({ type: 'error', requestId, error: errorMessage(error) });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [
    deletedIds,
    enabled,
    range.endExclusive,
    range.startInclusive,
    refreshToken,
    retryToken,
    service,
  ]);

  const retry = useCallback(() => {
    setRetryToken(token => token + 1);
  }, []);

  return { ...state, retry };
}
