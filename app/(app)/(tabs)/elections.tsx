import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, LayoutAnimation, Pressable, TextInput, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, EmptyState, SkeletonCard, Card } from '@/core/components';
import { ROUTES } from '@/constants/routes';
import { spacing, radius, shadows, border } from '@/constants/tokens';
import { useRefreshControl, useForegroundRefresh, useHaptics } from '@/core/hooks';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useElectionsQuery, useElectionCyclesQuery } from '@/features/elections/hooks';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'textMuted',
  SCHEDULED: 'pending',
  ACTIVE: 'verified',
  COMPLETED: 'primary',
  ARCHIVED: 'textSecondary',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const POSITION_FILTERS = [
  { id: 'ALL', label: 'All Contests' },
  { id: 'PRESIDENT', label: 'Presidential' },
  { id: 'GOVERNOR', label: 'Governorship' },
  { id: 'SENATOR', label: 'Senatorial' },
  { id: 'REPRESENTATIVES', label: 'House of Reps' },
  { id: 'LOCAL', label: 'LGA / Local' },
] as const;

// Key parties participating across Nigerian elections
const MAJOR_PARTIES = [
  { acronym: 'APC', bg: '#0D9488', text: '#FFFFFF' },
  { acronym: 'PDP', bg: '#DC2626', text: '#FFFFFF' },
  { acronym: 'LP', bg: '#16A34A', text: '#FFFFFF' },
  { acronym: 'NNPP', bg: '#2563EB', text: '#FFFFFF' },
];

export default function ElectionsScreen() {
  const { data: cycles = [], isLoading: cyclesLoading } = useElectionCyclesQuery();
  const { data: elections = [], isLoading: electionsLoading, refetch: refetchElections } = useElectionsQuery();
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { impact } = useHaptics();
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });

  const { refreshControl } = useRefreshControl(
    cyclesLoading || electionsLoading,
    refetchElections
  );
  useForegroundRefresh([['elections', 'list'], ['elections', 'cycles']], 5 * 60 * 1000);

  const loading = cyclesLoading || electionsLoading;

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle) {
      setSelectedCycle(cycles[0]!.id);
    }
  }, [cycles, selectedCycle]);

  const activeCycle = useMemo(() => {
    return cycles.find((c) => c.id === selectedCycle) ?? cycles[0] ?? null;
  }, [cycles, selectedCycle]);

  const filteredElections = useMemo(() => {
    return elections.filter((e) => {
      const matchCycle = !selectedCycle || e.cycleId === selectedCycle;
      if (!matchCycle) return false;

      // Filter by position chip
      if (selectedPosition !== 'ALL') {
        const posUpper = e.position.toUpperCase();
        if (selectedPosition === 'PRESIDENT' && !posUpper.includes('PRESIDENT')) return false;
        if (selectedPosition === 'GOVERNOR' && !posUpper.includes('GOVERNOR')) return false;
        if (selectedPosition === 'SENATOR' && !posUpper.includes('SENATOR')) return false;
        if (selectedPosition === 'REPRESENTATIVES' && !posUpper.includes('REPRESENTATIVE')) return false;
        if (selectedPosition === 'LOCAL' && !posUpper.includes('CHAIRMAN') && !posUpper.includes('COUNCILLOR') && !posUpper.includes('LOCAL')) return false;
      }

      // Filter by search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchPos = e.position.toLowerCase().includes(query);
        const matchArea = e.electoralArea.toLowerCase().includes(query);
        const matchType = e.electoralAreaType.toLowerCase().includes(query);
        if (!matchPos && !matchArea && !matchType) return false;
      }

      return true;
    });
  }, [elections, selectedCycle, selectedPosition, searchQuery]);

  const handleCycleSelect = useCallback((id: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCycle(id);
  }, [impact]);

  const handlePositionSelect = useCallback((id: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedPosition(id);
  }, [impact]);

  return (
    <ScreenView
      scrollable
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Title Header */}
      <View style={{ marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 }}>
          <View style={[styles.titleIndicator, { backgroundColor: colors.primary }]} />
          <ThemedText variant="title" color="text" fontFamily="bold">Elections & Mandates</ThemedText>
        </View>
        <ThemedText variant="caption" color="textSecondary">
          Browse election cycles, contest statuses, and candidate slates
        </ThemedText>
      </View>

      {/* Cycle Selector (Segmented Tabs) */}
      <View style={[styles.tabBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        {cycles.map((cycle) => {
          const isSelected = activeCycle?.id === cycle.id;
          const shortName = cycle.name
            .replace(' Election', '')
            .replace('Governorship - ', '')
            .trim();
          return (
            <Pressable
              key={cycle.id}
              onPress={() => handleCycleSelect(cycle.id)}
              style={[
                styles.tabBtn,
                isSelected && [styles.activeTabBtn, { backgroundColor: colors.primary }],
              ]}
            >
              <ThemedText
                variant="label"
                color={isSelected ? '#FFFFFF' : 'textSecondary'}
                fontFamily={isSelected ? 'bold' : 'medium'}
                numberOfLines={1}
                style={{ fontSize: 12, letterSpacing: 0.2 }}
              >
                {shortName}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Active Cycle Programme Overview Card (PRD Cycle Management) */}
      {activeCycle && (
        <Card style={[styles.cycleCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="calendar-outline" size={15} color={colors.primary} />
              <ThemedText variant="label" style={{ color: colors.primary, fontWeight: '700' }}>
                PROGRAMME SCHEDULE
              </ThemedText>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    (colors[STATUS_COLORS[activeCycle.status] as keyof typeof Colors.light] || colors.primary) + '18',
                },
              ]}
            >
              <ThemedText
                variant="caption"
                style={{
                  color:
                    colors[STATUS_COLORS[activeCycle.status] as keyof typeof Colors.light] || colors.primary,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                {STATUS_LABELS[activeCycle.status] || activeCycle.status}
              </ThemedText>
            </View>
          </View>

          <ThemedText variant="body" color="text" fontFamily="bold">
            {activeCycle.name}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
            {activeCycle.description}
          </ThemedText>

          <View style={[styles.cycleMetaRow, { borderTopColor: colors.border + '50' }]}>
            <View style={styles.cycleMetaItem}>
              <ThemedText variant="caption" color="textMuted">Operational Window</ThemedText>
              <ThemedText variant="label" color="text" fontFamily="medium" style={{ marginTop: 2 }}>
                {activeCycle.startDate} → {activeCycle.endDate}
              </ThemedText>
            </View>
            <View style={[styles.cycleMetaItem, { alignItems: 'flex-end' }]}>
              <ThemedText variant="caption" color="textMuted">Cycle Contests</ThemedText>
              <ThemedText variant="label" color="primary" fontFamily="bold" style={{ marginTop: 2 }}>
                {elections.filter((e) => e.cycleId === activeCycle.id).length} Contests
              </ThemedText>
            </View>
          </View>
        </Card>
      )}

      {/* Search Input Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search contest, state, or jurisdiction..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Position Filter Chips (Horizontal Scroll) */}
      <View style={styles.filterScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {POSITION_FILTERS.map((f) => {
            const active = selectedPosition === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => handlePositionSelect(f.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceElevated,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <ThemedText
                  variant="caption"
                  color={active ? '#FFFFFF' : 'textSecondary'}
                  fontFamily={active ? 'bold' : 'regular'}
                >
                  {f.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Quick Navigation Directory Row */}
      <View style={styles.quickLinksRow}>
        <Card
          pressable
          onPress={() => {
            impact(Haptics.ImpactFeedbackStyle.Light);
            router.push(ROUTES.PARTIES);
          }}
          style={[styles.quickLinkPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Ionicons name="people-circle-outline" size={15} color={colors.primary} />
            <ThemedText variant="caption" color="text" fontFamily="medium" style={{ flex: 1, marginLeft: 6 }}>
              Political Parties
            </ThemedText>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          </View>
        </Card>

        <Card
          pressable
          onPress={() => {
            impact(Haptics.ImpactFeedbackStyle.Light);
            router.push(ROUTES.LOCATIONS);
          }}
          style={[styles.quickLinkPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Ionicons name="map-outline" size={15} color={colors.primary} />
            <ThemedText variant="caption" color="text" fontFamily="medium" style={{ flex: 1, marginLeft: 6 }}>
              Electoral Hierarchy
            </ThemedText>
            <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
          </View>
        </Card>
      </View>

      {/* Loading Skeleton State */}
      {loading ? (
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : filteredElections.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No Contests Found"
          subtitle={
            searchQuery.length > 0 || selectedPosition !== 'ALL'
              ? 'No elections match your current search or position filter.'
              : 'No elections scheduled in this cycle yet.'
          }
          actionLabel={searchQuery.length > 0 || selectedPosition !== 'ALL' ? 'Reset Filters' : undefined}
          onAction={() => {
            setSearchQuery('');
            setSelectedPosition('ALL');
          }}
        />
      ) : null}

      {/* Contest Cards */}
      <View style={{ marginTop: spacing.sm }}>
        {filteredElections.map((election) => {
          const statusColorKey = STATUS_COLORS[election.status] || 'textSecondary';
          const statusColor = colors[statusColorKey as keyof typeof Colors.light] as string;
          const statusLabel = STATUS_LABELS[election.status] || election.status;

          return (
            <Card
              key={election.id}
              pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: ROUTES.ELECTION_DETAIL, params: { id: election.id } });
              }}
              style={[shadows.sm, styles.electionCard, { borderColor: colors.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm }}>
                <View style={[styles.electionIcon, { backgroundColor: colors.primary + '16' }]}>
                  <ThemedText variant="xl" style={{ color: colors.primary, fontWeight: '800' }}>
                    {election.position.charAt(0)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="body" style={{ fontWeight: '700', fontSize: 15 }}>
                    {election.position}
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary" style={{ marginTop: spacing['2xs'] }}>
                    {election.electoralArea} · {election.electoralAreaType}
                  </ThemedText>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                    <ThemedText variant="caption" color="textMuted">
                      {election.electionDate}
                    </ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                      <ThemedText
                        variant="caption"
                        style={{
                          color: statusColor,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 0.4,
                        }}
                      >
                        {statusLabel}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Major Competing Parties Badges */}
              <View style={[styles.cardFooter, { borderTopColor: colors.border + '50' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {MAJOR_PARTIES.slice(0, election.candidateCount >= 4 ? 4 : 3).map((p) => (
                    <View key={p.acronym} style={[styles.partyPill, { backgroundColor: p.bg + '20', borderColor: p.bg }]}>
                      <ThemedText variant="caption" style={{ color: p.bg, fontWeight: '700', fontSize: 10 }}>
                        {p.acronym}
                      </ThemedText>
                    </View>
                  ))}
                  <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4, fontSize: 11 }}>
                    {election.candidateCount} {election.candidateCount === 1 ? 'Candidate' : 'Candidates'}
                  </ThemedText>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <ThemedText variant="caption" color="primary" fontFamily="bold">
                    View Slate
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  activeTabBtn: {
    ...shadows.sm,
  },
  cycleCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: border.thin,
    borderRadius: radius.md,
  },
  cycleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: border.thin,
  },
  cycleMetaItem: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: border.thin,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  filterScrollContainer: {
    marginBottom: spacing.sm,
  },
  filterScroll: {
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: border.thin,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickLinkPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: border.thin,
  },
  electionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderWidth: border.thin,
    borderRadius: radius.md,
  },
  titleIndicator: {
    width: 4,
    height: 16,
    borderRadius: radius.full,
  },
  electionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.full,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: border.thin,
    marginTop: spacing.xs,
  },
  partyPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
});

