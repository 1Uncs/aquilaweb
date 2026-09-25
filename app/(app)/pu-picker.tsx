import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, Input, SkeletonCard } from '@/core/components';
import { router, useLocalSearchParams } from 'expo-router';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { usePollingUnitsQuery, useLgasQuery, useStatesQuery } from '@/features/elections/hooks';
import { useRefreshControl, useForegroundRefresh, useHaptics } from '@/core/hooks';
import { useAuthStore, PollingUnit } from '@/features/auth/store';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '@/constants/routes';
import * as Haptics from 'expo-haptics';

export default function PUPickerScreen() {
  const params = useLocalSearchParams<{ mode?: string; electionId?: string }>();
  const mode = params.mode === 'incident' ? 'incident' : 'result';
  const { data: pollingUnits = [], isLoading: pusLoading, refetch } = usePollingUnitsQuery();
  const { data: lgas = [], isLoading: lgasLoading } = useLgasQuery();
  const { data: states = [], isLoading: statesLoading } = useStatesQuery();
  const [search, setSearch] = useState('');
  const loading = pusLoading || lgasLoading || statesLoading;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshControl } = useRefreshControl(loading, refetch);
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });
  useForegroundRefresh([['polling-units', 'list']], 10 * 60 * 1000);
  const { impact } = useHaptics();

  const lgaMap = useMemo(() => new Map(lgas.map((l) => [l.id, l])), [lgas]);
  const stateMap = useMemo(() => new Map(states.map((s) => [s.id, s])), [states]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pollingUnits;
    return pollingUnits.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchLga = p.lgaName?.toLowerCase().includes(q);
      const matchState = p.stateName?.toLowerCase().includes(q);
      return matchName || matchCode || matchLga || matchState;
    });
  }, [pollingUnits, search]);

  const handleSelect = useCallback((pu: PollingUnit) => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    useAuthStore.getState().setSelectedPollingUnit(pu.id, pu.name);
    if (router.canGoBack()) {
      router.back();
    } else {
      const route = mode === 'incident' ? ROUTES.INCIDENT_REPORT : ROUTES.RESULT_SUBMIT;
      router.replace({
        pathname: route as any,
        params: {
          pollingUnitId: pu.id,
          pollingUnitName: pu.name,
          ...(params.electionId ? { electionId: params.electionId } : {}),
        },
      });
    }
  }, [impact, mode, params.electionId]);

  const renderPUItem = useCallback(({ item }: { item: PollingUnit }) => {
    const lga = lgaMap.get(item.lgaId);
    const state = item.stateId ? stateMap.get(item.stateId) : null;
    const parentState = item.stateName || state?.name || 'Lagos State';
    const parentLga = item.lgaName || lga?.name || 'Ikeja LGA';

    return (
      <Card
        pressable
        style={styles.puCard}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.puItemRow}>
          <View style={[styles.puIconBadge, { backgroundColor: colors.primary + '16' }]}>
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <ThemedText variant="body" color="text" fontFamily="bold">
              {item.name}
            </ThemedText>
            {/* Qualified with parent state (Audio Part 8) */}
            <ThemedText variant="caption" color="primary" fontFamily="medium">
              {item.code} · {parentLga}, {parentState}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>
    );
  }, [colors, handleSelect, lgaMap, stateMap]);

  return (
    <ScreenView scrollable={false} noScrollPadding>
      <View style={styles.container}>
        {/* Header Search Section */}
        <View style={styles.headerBlock}>
          <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
            {mode === 'incident' ? 'Link incident evidence to a specific polling unit' : 'Select polling unit to record EC8A ballots'}
          </ThemedText>

          <Input
            placeholder="Type name, code (e.g. PU/001), or LGA..."
            value={search}
            onChangeText={setSearch}
            leftIcon="search-outline"
            rightIcon={search ? 'close-circle' : undefined}
            onRightIconPress={() => setSearch('')}
          />
        </View>

        {/* Unnested Native FlatList */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPUItem}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: spacing.xs }}>
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title="No Polling Units Found"
                subtitle={`No stations matched "${search}". Try searching by LGA or station code.`}
              />
            )
          }
        />
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  puCard: {
    padding: spacing.sm,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  puItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  puIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
