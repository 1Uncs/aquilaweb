import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, EmptyState, Button, Card, SkeletonCard } from '@/core/components';
import { useIncidentsStore, useAuthStore, IncidentReport } from '@/features/auth/store';
import { ROUTES } from '@/constants/routes';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useIncidentsQuery } from '@/features/elections/hooks';
import { useRefreshControl, useForegroundRefresh, useHaptics } from '@/core/hooks';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const CATEGORY_FILTERS = [
  'ALL',
  'VIOLENCE',
  'BALLOT_SNATCHING',
  'VOTE_BUYING',
  'BVAS_FAILURE',
  'SECURITY_INCIDENT',
] as const;

export default function IncidentsScreen() {
  const { data: apiIncidents = [], isLoading: loading, refetch: refetchIncidents } = useIncidentsQuery();
  const { incidents: storeIncidents, updateIncident } = useIncidentsStore();
  const { user } = useAuthStore();
  const isElectionOfficer = user?.role === 'ELECTION_OFFICER';
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('ALL');

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });
  const { refreshControl } = useRefreshControl(loading, refetchIncidents);
  useForegroundRefresh([['incidents', 'list']], 5 * 60 * 1000);
  const { impact } = useHaptics();

  // Combine store incidents with API incidents
  const allIncidents = useMemo(() => {
    const ids = new Set(storeIncidents.map((i) => i.id));
    const remoteUnique = apiIncidents.filter((i) => !ids.has(i.id));
    return [...storeIncidents, ...remoteUnique];
  }, [storeIncidents, apiIncidents]);

  // Filter by category and resolution status (Audio Part 4 & 7)
  const filtered = useMemo(() => {
    return allIncidents.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'RESOLVED'
            ? item.status === 'RESOLVED'
            : item.status !== 'RESOLVED';
      return matchCat && matchStatus;
    });
  }, [allIncidents, selectedCategory, statusFilter]);

  const handleUpdateStatus = useCallback((id: string, newStatus: 'UNDER_REVIEW' | 'RESOLVED') => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    updateIncident(id, { status: newStatus as any });
  }, [impact, updateIncident]);

  const renderIncidentCard = useCallback(({ item }: { item: IncidentReport }) => {
    const isCritical = item.severity === 'CRITICAL';
    const isHigh = item.severity === 'HIGH';
    const isResolved = item.status === 'RESOLVED';
    const isReviewing = item.status === 'UNDER_REVIEW' || item.status === 'SUBMITTED';

    const sevColors: Record<string, string> = {
      CRITICAL: colors.critical,
      HIGH: colors.error,
      MEDIUM: colors.warning,
      LOW: colors.success,
    };
    const sevColor = sevColors[item.severity] ?? colors.warning;

    return (
      <Card
        pressable
        style={styles.incidentCard}
        onPress={() => {
          impact(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: ROUTES.INCIDENT_DETAIL, params: { id: item.id } });
        }}
      >
        {/* Severity & Status Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.sevBadge, { backgroundColor: sevColor + '18', borderColor: sevColor }]}>
            <Ionicons
              name={isCritical || isHigh ? 'warning' : 'alert-circle-outline'}
              size={14}
              color={sevColor}
            />
            <ThemedText variant="label" style={{ color: sevColor, marginLeft: 4 }} fontFamily="bold">
              {item.severity} SEVERITY
            </ThemedText>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: isResolved ? colors.successSubtle : colors.warningSubtle }]}>
            <ThemedText
              variant="label"
              color={isResolved ? 'success' : 'warning'}
              fontFamily="bold"
            >
              {isResolved ? 'RESOLVED' : isReviewing ? 'REVIEWING' : item.status}
            </ThemedText>
          </View>
        </View>

        {/* Category & Description */}
        <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginTop: spacing.xs }}>
          {item.category.replace(/_/g, ' ')}
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          {item.description}
        </ThemedText>

        {/* Location & Metadata Tag */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <ThemedText variant="label" color="primary" fontFamily="medium" style={{ marginLeft: 4 }}>
              {item.electoralArea}
            </ThemedText>
          </View>

          {item.latitude && item.longitude ? (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
              <ThemedText variant="label" color="textMuted" style={{ marginLeft: 4 }}>
                {item.latitude.toFixed(3)}, {item.longitude.toFixed(3)}
              </ThemedText>
            </View>
          ) : null}

          {item.mediaUrls?.length ? (
            <View style={styles.metaItem}>
              <Ionicons name="camera-outline" size={12} color={colors.accentDark} />
              <ThemedText variant="label" color="accent" style={{ marginLeft: 4 }}>
                {item.mediaUrls.length} live evidence
              </ThemedText>
            </View>
          ) : null}
        </View>

        {/* Triage Actions: Officer Only (Audio Part 4 & 7) */}
        <View style={styles.cardActionsRow}>
          <ThemedText variant="label" color="textMuted">
            {new Date(item.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>

          {isElectionOfficer ? (
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {!isResolved && (
                <Button
                  label="Reviewing"
                  variant={isReviewing ? 'primary' : 'outline'}
                  size="sm"
                  onPress={() => handleUpdateStatus(item.id, 'UNDER_REVIEW')}
                />
              )}
              <Button
                label={isResolved ? 'Mark Reopened' : 'Resolve'}
                variant={isResolved ? 'outline' : 'primary'}
                size="sm"
                leftIcon={isResolved ? 'refresh-outline' : 'checkmark-circle-outline'}
                onPress={() => handleUpdateStatus(item.id, isResolved ? 'UNDER_REVIEW' : 'RESOLVED')}
              />
            </View>
          ) : (
            <View style={[styles.fieldAgentPill, { backgroundColor: isResolved ? colors.successSubtle : colors.warningSubtle }]}>
              <ThemedText
                variant="label"
                color={isResolved ? 'success' : 'warning'}
                fontFamily="bold"
              >
                {isResolved ? 'RESOLVED' : isReviewing ? 'UNDER REVIEW' : 'LOGGED'}
              </ThemedText>
            </View>
          )}
        </View>
      </Card>
    );
  }, [colors, handleUpdateStatus, impact, isElectionOfficer]);

  return (
    <ScreenView scrollable={false} noScrollPadding>
      <View style={styles.container}>
        {/* Top Control Bar with File Incident CTA */}
        <View style={styles.topControlBar}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="title" color="text" fontFamily="bold">
              Incident Control Room
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {allIncidents.length} total logged incidents across operational sectors
            </ThemedText>
          </View>

          <Button
            label="+ File Incident"
            variant="primary"
            size="sm"
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Medium);
              router.push(ROUTES.INCIDENT_REPORT);
            }}
          />
        </View>

        {/* Status Filter Toggle: All vs Unresolved vs Resolved (Audio Part 4) */}
        <View style={[styles.statusToggleBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          {(['ALL', 'UNRESOLVED', 'RESOLVED'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                setStatusFilter(s);
              }}
              style={[
                styles.statusToggleBtn,
                statusFilter === s && [styles.activeStatusToggle, { backgroundColor: colors.primary }],
              ]}
            >
              <ThemedText
                variant="caption"
                color={statusFilter === s ? '#FFFFFF' : 'textSecondary'}
                fontFamily={statusFilter === s ? 'bold' : 'medium'}
              >
                {s}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Category Filter Chips Horizontal Scroll (Audio Part 4) */}
        <View style={styles.catChipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScrollContent}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    impact(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(cat);
                  }}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    color={active ? '#FFFFFF' : 'textSecondary'}
                    fontFamily={active ? 'bold' : 'regular'}
                  >
                    {cat.replace(/_/g, ' ')}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Native FlatList */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderIncidentCard}
          refreshControl={refreshControl}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: spacing.sm }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              <EmptyState
                icon="shield-checkmark-outline"
                title="No Incidents Reported"
                subtitle="All polling units in this category are operating normally without security disruption."
                actionLabel="+ Report Incident"
                onAction={() => router.push(ROUTES.INCIDENT_REPORT)}
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
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  statusToggleBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: 3,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  activeStatusToggle: {
    ...shadows.sm,
  },
  catChipsWrapper: {
    paddingVertical: spacing.xs,
  },
  catScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  incidentCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sevBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  fieldAgentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
});
