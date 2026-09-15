import type { QueryChannelState } from '../services/setoranQuery.types';

export type ChannelAction<T> =
  | { type: 'start'; requestId: number }
  | { type: 'success'; requestId: number; data: T }
  | { type: 'error'; requestId: number; error: string }
  | { type: 'reset'; data: T };

export function initialChannel<T>(
  data: T,
  isStale = false,
): QueryChannelState<T> {
  return {
    data,
    status: 'idle',
    error: null,
    isStale,
    requestId: 0,
  };
}

export function reduceChannel<T>(
  state: QueryChannelState<T>,
  action: ChannelAction<T>,
): QueryChannelState<T> {
  if (
    (action.type === 'success' || action.type === 'error') &&
    action.requestId !== state.requestId
  ) {
    return state;
  }

  if (action.type === 'start') {
    return {
      ...state,
      status: 'loading',
      error: null,
      requestId: action.requestId,
    };
  }

  if (action.type === 'success') {
    return {
      ...state,
      data: action.data,
      status: 'success',
      error: null,
      isStale: false,
    };
  }

  if (action.type === 'error') {
    return {
      ...state,
      status: 'error',
      error: action.error,
      isStale: true,
    };
  }

  return initialChannel(action.data);
}
