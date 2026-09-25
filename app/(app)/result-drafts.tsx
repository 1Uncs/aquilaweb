import React from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, EmptyState, Button, Card } from '@/core/components';
import { ROUTES } from '@/constants/routes';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import Colors from '@/constants/colors';
import { useResultsStore, useAuthStore } from '@/features/auth/store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ResultDraftsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { user } = useAuthStore();
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });

  const { submissions, updateSubmission, removeSubmission } = useResultsStore();
  const isElectionOfficer = user?.role === 'ELECTION_OFFICER';

  if (isElectionOfficer) {
    return (
      <ScreenView>
        <View style={{ padding: spacing.lg, alignItems: 'center', marginTop: spacing.xxl }}>
          <Card style={{ padding: spacing.xl, width: '100%', alignItems: 'center' }}>
            <View style={[styles.restrictedIcon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="shield-outline" size={32} color={colors.primary} />
            </View>
            <ThemedText variant="h3" color="primary" fontFamily="bold" style={{ textAlign: 'center', marginTop: spacing.sm }}>
              Supervisory Access Restricted
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center', marginVertical: spacing.sm }}>
              As an Election Officer, your console is dedicated to monitoring, verification, and collation audit. Draft ballot return queues are strictly managed by Polling Unit Agents.
            </ThemedText>
            <Button
              label="Go to Collation Room"
              variant="primary"
              onPress={() => router.replace(ROUTES.RESULT_COLLATION as any)}
            />
          </Card>
        </View>
      </ScreenView>
    );
  }

  // Active drafts from persistent store (Audio Part 3)
  const drafts = submissions.filter((s) => s.status === 'DRAFT');

  const handleContinue = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: ROUTES.RESULT_SUBMIT, params: { draftId: id } });
  };

  const handlePublishNow = (id: string, puName: string) => {
    Alert.alert(
      'Publish Result',
      `Confirm publishing verified return for ${puName}? This will commit to the live collation stream.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateSubmission(id, { status: 'PUBLISHED', submittedAt: new Date().toISOString() });
            Alert.alert('Published', 'Result successfully published to live collation stream.');
          },
        },
      ]
    );
  };

  const handleDiscard = (id: string, puName: string) => {
    Alert.alert('Discard Draft', `Are you sure you want to discard the draft for ${puName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          removeSubmission(id);
        },
      },
    ]);
  };

  return (
    <ScreenView scrollable contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.warningSubtle }]}>
            <Ionicons name="document-text" size={24} color={colors.warning} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <ThemedText variant="title" color="text" fontFamily="bold">
              Draft Results Queue
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {drafts.length} incomplete or unpublished ballot return{drafts.length === 1 ? '' : 's'}
            </ThemedText>
          </View>
        </View>
      </Card>

      {drafts.length === 0 ? (
        <EmptyState
          icon="document-outline"
          title="No Drafts in Queue"
          subtitle="All entered results have either been published or none have been saved yet."
          actionLabel="+ Record New Result"
          onAction={() => router.push(ROUTES.RESULT_SUBMIT)}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {drafts.map((draft) => {
            const totalCast = draft.totalVotesCast || 0;
            const candCount = Object.keys(draft.candidateVotes || {}).length;

            return (
              <Card key={draft.id} style={styles.draftCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text" fontFamily="bold">
                      {draft.pollingUnitName}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      Draft Return · Saved {new Date(draft.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </View>
                  <View style={[styles.draftBadge, { backgroundColor: colors.warningSubtle }]}>
                    <ThemedText variant="label" color="warning" fontFamily="bold">
                      DRAFT
                    </ThemedText>
                  </View>
                </View>

                {/* Progress metadata */}
                <View style={[styles.statsStrip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={styles.statCol}>
                    <ThemedText variant="label" color="textMuted">RECORDED BALLOTS</ThemedText>
                    <ThemedText variant="body" color="text" fontFamily="bold">
                      {totalCast.toLocaleString()} votes
                    </ThemedText>
                  </View>
                  <View style={styles.statCol}>
                    <ThemedText variant="label" color="textMuted">CANDIDATES ENTERED</ThemedText>
                    <ThemedText variant="body" color="text" fontFamily="bold">
                      {candCount} recorded
                    </ThemedText>
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                  <Button
                    label="Discard"
                    variant="outline"
                    size="sm"
                    leftIcon="trash-outline"
                    onPress={() => handleDiscard(draft.id, draft.pollingUnitName)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Resume"
                    variant="outline"
                    size="sm"
                    leftIcon="create-outline"
                    onPress={() => handleContinue(draft.id)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label="Publish"
                    variant="primary"
                    size="sm"
                    leftIcon="cloud-upload-outline"
                    onPress={() => handlePublishNow(draft.id, draft.pollingUnitName)}
                    style={{ flex: 1.2 }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  draftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  draftMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  restrictedIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  statCol: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
