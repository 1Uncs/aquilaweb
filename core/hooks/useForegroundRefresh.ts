import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

const REFRESH_DEBOUNCE_MS = 1000;

export function useForegroundRefresh(queryKeys: string[][], staleTimeMs: number = 5 * 60 * 1000) {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>('active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && appStateRef.current !== 'active') {
        const now = Date.now();
        if (now - lastRefreshRef.current < REFRESH_DEBOUNCE_MS) {
          return;
        }

        let needsRefresh = false;
        for (const key of queryKeys) {
          const query = queryClient.getQueryCache().find({ queryKey: key });
          if (query) {
            const state = query.state;
            if (state.dataUpdatedAt && now - state.dataUpdatedAt > staleTimeMs) {
              needsRefresh = true;
              break;
            }
          }
        }

        if (needsRefresh) {
          lastRefreshRef.current = now;
          queryClient.refetchQueries({ queryKey: queryKeys, type: 'all' }).catch(() => {});
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [queryClient, queryKeys, staleTimeMs]);
}
