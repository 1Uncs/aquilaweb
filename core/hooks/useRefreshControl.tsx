import { useCallback, useRef } from 'react';
import { RefreshControl } from 'react-native';
import { useColorScheme } from './useColorScheme';
import { useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';

export function useRefreshControl( refreshing: boolean, onRefresh: () => void) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const queryClient = useQueryClient();
  const refreshingRef = useRef(refreshing);

  refreshingRef.current = refreshing;

  const handleRefresh = useCallback(
    () => {
      const allQueryKeys: unknown[][] = [];
      queryClient.getQueryCache().getAll().forEach((entry) => {
        allQueryKeys.push(entry.queryKey as unknown[]);
      });
      const uniqueKeys = Array.from(new Set(allQueryKeys.map((k) => JSON.stringify(k)))).map(
        (k) => JSON.parse(k) as unknown[]
      );
      uniqueKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as never });
      });
      Promise.resolve(onRefresh()).catch((e) => {
        if (__DEV__) console.warn('[refreshControl] onRefresh failed', e);
      });
    },
    [queryClient, onRefresh]
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => handleRefresh()}
      tintColor={colors.primary}
      title="Refreshing..."
      colors={[colors.primary, colors.accent]}
      progressBackgroundColor={colors.surface}
    />
  );

  return { refreshControl, refreshing };
}
