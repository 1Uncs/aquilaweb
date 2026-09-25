import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, Input, SkeletonCard } from '@/core/components';
import { ROUTES } from '@/constants/routes';
import { useIncidentsStore } from '@/features/auth/store';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useIncidentsQuery } from '@/features/elections/hooks';
import { useRefreshControl, useForegroundRefresh } from '@/core/hooks';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function IncidentSearchScreen() {
  const { data: incidents = [], isLoading: loading, refetch } = useIncidentsQuery();
  const [search, setSearch] = useState('');
  const { incidents: storeIncidents } = useIncidentsStore();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshControl } = useRefreshControl(loading, refetch);
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });
  useForegroundRefresh([['incidents', 'list']], 5 * 60 * 1000);

  const pool = useMemo(() => {
    const ids = new Set(storeIncidents.map((i) => i.id));
    const remoteUnique = incidents.filter((i) => !ids.has(i.id));
    return [...storeIncidents, ...remoteUnique];
  }, [storeIncidents, incidents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter(
      (i) =>
        i.category.replace(/_/g, ' ').toLowerCase().includes(q) ||
        i.electoralArea.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.pollingUnitId && i.pollingUnitId.toLowerCase().includes(q))
    );
  }, [pool, search]);

  const sevColors: Record<string, string> = {
    CRITICAL: colors.critical,
    HIGH: colors.error,
    MEDIUM: colors.warning,
    LOW: colors.success,
  };

  return (
    <ScreenView scrollable={false} noScrollPadding>
      <View style={styles.container}>
        <View style={styles.headerBlock}>
          <ThemedText variant="title" color="text" fontFamily="bold">
            Search Field Incidents
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
            Filter by category, description, electoral area, or station code
          </ThemedText>

          <Input
            placeholder="Type e.g. 'Violence', 'BVAS', 'Ikeja'..."
            value={search}
            onChangeText={setSearch}
            leftIcon="search-outline"
            rightIcon={search ? 'close-circle' : undefined}
            onRightIconPress={() => setSearch('')}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          renderItem={({ item }) => {
            const sevCol = sevColors[item.severity] ?? colors.warning;

            return (
              <Card
                pressable
                style={styles.itemCard}
                onPress={() => router.push({ pathname: ROUTES.INCIDENT_DETAIL, params: { id: item.id } })}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.sevTag, { backgroundColor: sevCol + '16', borderColor: sevCol }]}>
                    <Ionicons name="warning" size={12} color={sevCol} />
                    <ThemedText variant="label" style={{ color: sevCol, marginLeft: 4 }} fontFamily="bold">
                      {item.severity}
                    </ThemedText>
                  </View>
                  <ThemedText variant="label" color="textMuted">
                    {item.status.replace(/_/g, ' ')}
                  </ThemedText>
                </View>

                <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginTop: 4 }}>
                  {item.category.replace(/_/g, ' ')}
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary" numberOfLines={2} style={{ marginTop: 2 }}>
                  {item.description}
                </ThemedText>

                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.primary} />
                  <ThemedText variant="label" color="primary" style={{ marginLeft: 4 }}>
                    {item.electoralArea}
                  </ThemedText>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: spacing.sm }}>
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
                <SkeletonCard lines={2} />
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title="No Incidents Found"
                subtitle={`No logged incidents matched "${search}".`}
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
  itemCard: {
    padding: spacing.sm,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sevTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
});
