import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, FlatList } from 'react-native';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, SkeletonCard } from '@/core/components';
import { Ionicons } from '@expo/vector-icons';
import { usePartiesQuery, useCandidatesQuery } from '@/features/elections/hooks';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useRefreshControl, useForegroundRefresh, useHaptics } from '@/core/hooks';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function PartiesScreen() {
  const { data: parties = [], isLoading: partiesLoading, refetch } = usePartiesQuery();
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidatesQuery('e1');
  const [activeTab, setActiveTab] = useState<'parties' | 'candidates'>('candidates');

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshControl } = useRefreshControl(partiesLoading, refetch);
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });
  useForegroundRefresh([['parties', 'list'], ['elections', 'candidates', 'e1']], 10 * 60 * 1000);
  const { impact } = useHaptics();

  const partyColors: Record<string, string> = {
    APC: '#0D6338',
    PDP: '#DC2626',
    LP: '#16A34A',
    NNPP: '#2563EB',
    APGA: '#CA8A04',
  };

  return (
    <ScreenView scrollable={false} noScrollPadding>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.headerBlock}>
          <ThemedText variant="title" color="text" fontFamily="bold">
            Parties & Candidate Directory
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.xs }}>
            INEC registered political entities and candidate party affiliations
          </ThemedText>

          {/* Tab Switcher: Candidates vs Parties (Audio Part 2) */}
          <View style={[styles.tabBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('candidates');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'candidates' && [styles.activeTab, { backgroundColor: colors.primary }],
              ]}
            >
              <ThemedText
                variant="caption"
                color={activeTab === 'candidates' ? '#FFFFFF' : 'textSecondary'}
                fontFamily={activeTab === 'candidates' ? 'bold' : 'medium'}
              >
                Candidates & History ({candidates.length})
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('parties');
              }}
              style={[
                styles.tabBtn,
                activeTab === 'parties' && [styles.activeTab, { backgroundColor: colors.primary }],
              ]}
            >
              <ThemedText
                variant="caption"
                color={activeTab === 'parties' ? '#FFFFFF' : 'textSecondary'}
                fontFamily={activeTab === 'parties' ? 'bold' : 'medium'}
              >
                Registered Parties ({parties.length})
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {activeTab === 'candidates' ? (
          candidatesLoading && candidates.length === 0 ? (
            <View style={styles.scrollList}>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollList}>
              {candidates.map((cand) => {
              const pColor = partyColors[cand.partyAcronym] ?? colors.primary;

              return (
                <Card key={cand.id} style={styles.itemCard}>
                  <View style={styles.candTopRow}>
                    <View style={[styles.avatarWrap, { backgroundColor: pColor + '18' }]}>
                      <ThemedText variant="title" style={{ color: pColor }} fontFamily="bold">
                        {cand.partyAcronym.slice(0, 2)}
                      </ThemedText>
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <ThemedText variant="body" color="text" fontFamily="bold">
                        {cand.fullName}
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        Running Mate: {cand.runningMate ?? 'N/A'}
                      </ThemedText>
                    </View>

                    <View style={[styles.partyTag, { backgroundColor: pColor + '20' }]}>
                      <ThemedText variant="label" style={{ color: pColor }} fontFamily="bold">
                        {cand.partyAcronym}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Historical Party Transition Timeline (Audio Part 2) */}
                  {cand.partyHistory?.length ? (
                    <View style={[styles.historyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <ThemedText variant="label" color="textMuted" fontFamily="bold" style={{ marginBottom: 4 }}>
                        HISTORICAL PARTY TRACKER
                      </ThemedText>
                      {cand.partyHistory.map((h, i) => (
                        <View key={i} style={styles.historyRow}>
                          <Ionicons name="git-commit-outline" size={14} color={colors.primary} />
                          <ThemedText variant="caption" color="text" fontFamily="medium" style={{ marginLeft: 6, flex: 1 }}>
                            {h.electionYear} ({h.partyAcronym}): {h.votes.toLocaleString()} votes ({h.percentage}%)
                          </ThemedText>
                          <ThemedText variant="label" color="textSecondary">
                            {h.electionName}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              );
            })}
            </ScrollView>
          )
        ) : (
          <FlatList
            data={parties}
            keyExtractor={(p) => p.id}
            refreshControl={refreshControl}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
            renderItem={({ item: party }) => {
              const pColor = partyColors[party.acronym] ?? colors.primary;

              return (
                <Card style={styles.itemCard}>
                  <View style={styles.partyItemRow}>
                    <View style={[styles.partyIconWrap, { backgroundColor: pColor + '18' }]}>
                      <ThemedText variant="title" style={{ color: pColor }} fontFamily="bold">
                        {party.acronym.slice(0, 3)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <ThemedText variant="body" color="text" fontFamily="bold">
                        {party.name}
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        INEC Code: {party.code} · Operational
                      </ThemedText>
                    </View>
                    <View style={[styles.activePill, { backgroundColor: colors.successSubtle }]}>
                      <ThemedText variant="label" color="success" fontFamily="bold">
                        ACTIVE
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              partiesLoading ? (
                <View style={{ gap: spacing.xs }}>
                  <SkeletonCard lines={2} />
                  <SkeletonCard lines={2} />
                  <SkeletonCard lines={2} />
                </View>
              ) : (
                <EmptyState
                  icon="shield-outline"
                  title="No Registered Parties"
                  subtitle="No active political parties found in the national registry."
                />
              )
            }
          />
        )}
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
  tabBar: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    padding: 3,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  activeTab: {
    ...shadows.sm,
  },
  scrollList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  candTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  historyBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
});
