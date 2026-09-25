import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, Button, Shimmer, SkeletonCard } from '@/core/components';
import { ROUTES } from '@/constants/routes';
import { spacing, shadows, radius } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useElectionDetailQuery, useCandidatesQuery } from '@/features/elections/hooks';
import Colors from '@/constants/colors';
import { useForegroundRefresh, useRefreshControl } from '@/core/hooks';

const PARTY_COLORS: Record<string, { bg: string; text: string }> = {
  APC: { bg: '#0D9488', text: '#FFFFFF' },
  PDP: { bg: '#DC2626', text: '#FFFFFF' },
  LP: { bg: '#16A34A', text: '#FFFFFF' },
  NNPP: { bg: '#2563EB', text: '#FFFFFF' },
  APGA: { bg: '#D97706', text: '#FFFFFF' },
};

export default function ElectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: election, isLoading: electionLoading, refetch: refetchElection } = useElectionDetailQuery(id);
  const { data: candidates = [], isLoading: candidatesLoading, refetch: refetchCandidates } = useCandidatesQuery(id);
  const loading = electionLoading || candidatesLoading;
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { refreshControl } = useRefreshControl(loading, () => {
    refetchElection();
    refetchCandidates();
  });
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });
  useForegroundRefresh([['elections', 'detail', id], ['elections', 'candidates', id]], 5 * 60 * 1000);

  if (loading && !election) {
    return (
      <ScreenView scrollable={false} contentContainerStyle={styles.listContent}>
        {/* Electoral Contest Hero Skeleton */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <Shimmer width={120} height={12} borderRadius={radius.sm} />
          <Shimmer width="75%" height={24} borderRadius={radius.sm} style={{ marginTop: 6 }} />
          <Shimmer width="45%" height={14} borderRadius={radius.sm} style={{ marginTop: 6 }} />
          <View style={[styles.dateTag, { borderColor: colors.border, marginTop: spacing.md }]}>
            <Shimmer width="60%" height={12} borderRadius={radius.sm} />
          </View>
        </View>

        {/* Contesting Candidates Header Skeleton */}
        <View style={[styles.candidatesHeaderRow, { marginTop: spacing.md }]}>
          <Shimmer width={160} height={18} borderRadius={radius.sm} />
        </View>

        {/* Contesting Candidate Cards Skeleton */}
        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </ScreenView>
    );
  }

  if (!election) {
    return (
      <ScreenView scrollable={false}>
        <EmptyState
          icon="alert-circle-outline"
          title="Election Not Found"
          subtitle="The requested election contest could not be found."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </ScreenView>
    );
  }

  return (
    <ScreenView scrollable refreshControl={refreshControl} contentContainerStyle={styles.listContent}>
      {/* 1. Electoral Contest Hero */}
      <LinearGradient
        colors={['#0D6338', '#0A4A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerCard, shadows.md]}
      >
        <ThemedText variant="label" color="#A3E6C2" fontFamily="bold">
          ELECTORAL CONTEST
        </ThemedText>
        <ThemedText variant="h2" color="#FFFFFF" fontFamily="bold" style={{ marginTop: 2 }}>
          {election.position}
        </ThemedText>
        <ThemedText variant="caption" color="#D1FAE5" style={{ marginTop: 2 }}>
          {election.electoralArea} · {election.electoralAreaType}
        </ThemedText>
        <View style={styles.dateTag}>
          <ThemedText variant="label" color="#FFFFFF" fontFamily="bold">
            Election Date: {election.electionDate} · Status: {election.status}
          </ThemedText>
        </View>
      </LinearGradient>

      {/* 2. Contesting Candidates Header */}
      <View style={styles.candidatesHeaderRow}>
        <ThemedText variant="title" color="text" fontFamily="bold">
          Contesting Candidates ({candidates.length})
        </ThemedText>
      </View>

      {/* 3. Candidates List */}
      <View style={{ gap: spacing.xs }}>
        {candidates.map((c, index) => {
          const partyColor = PARTY_COLORS[c.partyAcronym]?.bg ?? colors.primary;
          return (
            <Card key={c.id} style={styles.candCard}>
              <View style={styles.candRow}>
                <View style={[styles.avatarBox, { backgroundColor: partyColor + '18' }]}>
                  <ThemedText variant="title" style={{ color: partyColor, fontWeight: '800' }}>
                    #{c.candidateNumber ?? index + 1}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <ThemedText variant="body" color="text" fontFamily="bold">
                      {c.fullName}
                    </ThemedText>
                    <View style={[styles.partyPill, { backgroundColor: partyColor + '20', borderColor: partyColor }]}>
                      <ThemedText variant="caption" style={{ color: partyColor, fontWeight: '700', fontSize: 10 }}>
                        {c.partyAcronym}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                    {c.partyName}
                  </ThemedText>
                  {c.runningMate ? (
                    <ThemedText variant="caption" color="textMuted" style={{ marginTop: 2, fontSize: 11 }}>
                      Running Mate: <ThemedText variant="caption" color="text" fontFamily="medium" style={{ fontSize: 11 }}>{c.runningMate}</ThemedText>
                    </ThemedText>
                  ) : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.successSubtle }]}>
                  <ThemedText variant="label" color="success" fontFamily="bold">
                    {c.status}
                  </ThemedText>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* 4. Footer CTA Actions */}
      <View style={styles.footerActions}>
        <Button
          label="Submit Result for Contest"
          variant="primary"
          leftIcon="add-circle-outline"
          onPress={() => router.push({ pathname: ROUTES.RESULT_SUBMIT, params: { electionId: id } })}
        />
        <Button
          label="Report Incident in Jurisdiction"
          variant="outline"
          leftIcon="warning-outline"
          onPress={() => router.push({ pathname: ROUTES.INCIDENT_REPORT, params: { electionId: id } })}
        />
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  dateTag: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  candidatesHeaderRow: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  candCard: {
    padding: spacing.sm,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  candRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  partyPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  footerActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
