import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Button, Input, Card } from '@/core/components';
import { useResultsStore, useAuthStore, ResultSubmission } from '@/features/auth/store';
import { router, useLocalSearchParams } from 'expo-router';
import { spacing, shadows, radius } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useDeviceLocation } from '@/core/hooks/useDeviceLocation';
import { useCandidatesQuery, usePollingUnitsQuery } from '@/features/elections/hooks';
import { ROUTES } from '@/constants/routes';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type VoteInput = {
  inec: string;
  observed: string;
};

export default function SubmitResultScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });

  const {
    electionId,
    pollingUnitId: preselectedPuId,
    pollingUnitName: preselectedPuName,
    draftId,
  } = useLocalSearchParams<{
    electionId?: string;
    pollingUnitId?: string;
    pollingUnitName?: string;
    draftId?: string;
  }>();

  const resolvedElectionId = electionId ?? 'e1';
  const { data: candidates = [] } = useCandidatesQuery(resolvedElectionId);
  const { data: allPollingUnits = [] } = usePollingUnitsQuery();
  const { user } = useAuthStore();
  const { submissions, addSubmission, updateSubmission } = useResultsStore();

  const existingDraft = draftId ? submissions.find((s) => s.id === draftId) : null;

  const [selectedPuId, setSelectedPuId] = useState(existingDraft?.pollingUnitId ?? preselectedPuId ?? '');
  const [selectedPuName, setSelectedPuName] = useState(existingDraft?.pollingUnitName ?? preselectedPuName ?? '');
  const [votes, setVotes] = useState<Record<string, VoteInput>>({});
  const [rejectedInec, setRejectedInec] = useState(existingDraft?.rejectedVotesInec ? String(existingDraft.rejectedVotesInec) : '');
  const [rejectedObs, setRejectedObs] = useState(existingDraft?.rejectedVotes ? String(existingDraft.rejectedVotes) : '');
  const [accredited, setAccredited] = useState(existingDraft?.totalAccreditedVoters ? String(existingDraft.totalAccreditedVoters) : '');
  const [submitting, setSubmitting] = useState(false);
  const { coordinates: deviceCoords } = useDeviceLocation({ latitude: 6.600, longitude: 3.350 });

  const handleAutoMatchInec = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVotes((prev) => {
      const updated: Record<string, VoteInput> = {};
      candidates.forEach((c) => {
        const obs = prev[c.id]?.observed ?? '';
        updated[c.id] = { observed: obs, inec: obs };
      });
      return updated;
    });
    if (rejectedObs) {
      setRejectedInec(rejectedObs);
    }
  };

  // Prepopulate draft votes if opening an existing draft
  useEffect(() => {
    if (existingDraft?.candidateVotes) {
      const initVotes: Record<string, VoteInput> = {};
      Object.entries(existingDraft.candidateVotes).forEach(([cId, v]) => {
        initVotes[cId] = {
          observed: String(v),
          inec: existingDraft.candidateVotesInec ? String(existingDraft.candidateVotesInec[cId] ?? '') : '',
        };
      });
      setVotes(initVotes);
    }
  }, [existingDraft]);

  useEffect(() => {
    if (preselectedPuId) {
      setSelectedPuId(preselectedPuId);
      if (preselectedPuName) setSelectedPuName(preselectedPuName);
    } else if (user?.role === 'POLLING_AGENT' && user.assignedLocations?.length && !selectedPuId) {
      setSelectedPuId(user.assignedLocations[0]!);
    }
  }, [preselectedPuId, preselectedPuName, user?.role, user?.assignedLocations, selectedPuId]);

  const resolvedPuName =
    selectedPuName ||
    allPollingUnits.find((p) => p.id === selectedPuId)?.name ||
    'PU 001 · Alausa Secretariat';

  const handleVoteChange = (candidateId: string, field: 'inec' | 'observed', value: string) => {
    setVotes((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] ?? { inec: '', observed: '' }),
        [field]: value.replace(/[^0-9]/g, ''),
      },
    }));
  };

  const computeTotal = () => {
    let total = 0;
    candidates.forEach((c) => {
      const observed = parseInt(votes[c.id]?.observed ?? '0', 10);
      if (!isNaN(observed)) total += observed;
    });
    total += parseInt(rejectedObs ?? '0', 10) || 0;
    return total;
  };

  const handleSaveDraft = async () => {
    if (!selectedPuId) {
      Alert.alert('Polling Unit Required', 'Please select a polling unit first.');
      return;
    }
    setSubmitting(true);
    const candidateVotes: Record<string, number> = {};
    const candidateVotesInec: Record<string, number> = {};

    candidates.forEach((c) => {
      const vObs = parseInt(votes[c.id]?.observed ?? '0', 10);
      const vInec = parseInt(votes[c.id]?.inec ?? '0', 10);
      candidateVotes[c.id] = isNaN(vObs) ? 0 : vObs;
      candidateVotesInec[c.id] = isNaN(vInec) ? 0 : vInec;
    });

    const payload: ResultSubmission = {
      id: draftId ?? `draft-${Date.now()}`,
      electionId: resolvedElectionId,
      pollingUnitId: selectedPuId,
      pollingUnitName: resolvedPuName,
      candidateVotes,
      candidateVotesInec,
      rejectedVotes: parseInt(rejectedObs ?? '0', 10) || 0,
      rejectedVotesInec: parseInt(rejectedInec ?? '0', 10) || 0,
      totalAccreditedVoters: parseInt(accredited ?? '0', 10) || 0,
      totalVotesCast: computeTotal(),
      status: 'DRAFT',
      latitude: deviceCoords?.latitude ?? 6.600,
      longitude: deviceCoords?.longitude ?? 3.350,
      submittedAt: new Date().toISOString(),
      submittedBy: user?.name ?? user?.email ?? 'Field Agent',
    };

    if (draftId) {
      updateSubmission(draftId, payload);
    } else {
      addSubmission(payload);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(false);
    router.replace(ROUTES.RESULT_DRAFTS as any);
  };

  const handlePublish = async () => {
    if (!selectedPuId) {
      Alert.alert('Polling Unit Required', 'Please select a polling unit before publishing.');
      return;
    }

    const totalCast = computeTotal();
    const accCount = parseInt(accredited ?? '0', 10) || 0;

    if (accCount === 0) {
      Alert.alert('Accredited Voters Required', 'Please enter the total accredited voter count from BVAS.');
      return;
    }

    if (totalCast > accCount) {
      Alert.alert(
        'Over-Voting Warning',
        `Total ballots (${totalCast}) exceeds accredited voters (${accCount}). Do you still wish to submit for collation audit?`,
        [
          { text: 'Review Counts', style: 'cancel' },
          { text: 'Proceed', onPress: () => commitPublish() },
        ]
      );
      return;
    }

    commitPublish();
  };

  const commitPublish = () => {
    setSubmitting(true);
    const candidateVotes: Record<string, number> = {};
    const candidateVotesInec: Record<string, number> = {};

    candidates.forEach((c) => {
      const vObs = parseInt(votes[c.id]?.observed ?? '0', 10);
      const vInec = parseInt(votes[c.id]?.inec ?? '0', 10);
      candidateVotes[c.id] = isNaN(vObs) ? 0 : vObs;
      candidateVotesInec[c.id] = isNaN(vInec) ? 0 : vInec;
    });

    const payload: ResultSubmission = {
      id: draftId ?? `r-${Date.now()}`,
      electionId: resolvedElectionId,
      pollingUnitId: selectedPuId,
      pollingUnitName: resolvedPuName,
      candidateVotes,
      candidateVotesInec,
      rejectedVotes: parseInt(rejectedObs ?? '0', 10) || 0,
      rejectedVotesInec: parseInt(rejectedInec ?? '0', 10) || 0,
      totalAccreditedVoters: parseInt(accredited ?? '0', 10) || 0,
      totalVotesCast: computeTotal(),
      status: 'PUBLISHED',
      latitude: deviceCoords?.latitude ?? 6.600,
      longitude: deviceCoords?.longitude ?? 3.350,
      submittedAt: new Date().toISOString(),
      submittedBy: user?.name ?? user?.email ?? 'Field Agent',
    };

    if (draftId) {
      updateSubmission(draftId, payload);
    } else {
      addSubmission(payload);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(false);
    router.replace(ROUTES.RESULTS_TAB as any);
  };

  // Restrict Election Officer from entering field returns (Audio Part 6)
  if (user?.role === 'ELECTION_OFFICER') {
    return (
      <ScreenView scrollable={false}>
        <View style={styles.restrictedContainer}>
          <Card style={styles.restrictedCard}>
            <View style={[styles.restrictedIcon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="shield-outline" size={32} color={colors.primary} />
            </View>
            <ThemedText variant="h3" color="primary" fontFamily="bold" style={{ textAlign: 'center', marginTop: spacing.sm }}>
              Election Officer Supervisory Mandate
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center', marginVertical: spacing.sm }}>
              As an Election Officer, your console is dedicated to monitoring, verification, and collation audit. Field ballot return entry is strictly reserved for Polling Unit Agents and Field Agents.
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

  return (
    <ScreenView scrollable contentContainerStyle={styles.scrollContent}>
      {/* Polling Unit Selector / Display */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="label" color="textMuted" fontFamily="bold">
          POLLING UNIT ASSIGNMENT
        </ThemedText>
        <View style={styles.puDisplayRow}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="title" color="text" fontFamily="bold">
              {resolvedPuName}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              PU Code: {selectedPuId || 'PU/24/08/01/001'} {user?.role === 'POLLING_AGENT' ? '· Sole Assigned Station' : ''}
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="navigate-circle" size={13} color={colors.primary} />
              <ThemedText variant="label" color="primary" fontFamily="medium">
                GPS Lock: {deviceCoords ? `${deviceCoords.latitude.toFixed(4)}, ${deviceCoords.longitude.toFixed(4)}` : '6.6001, 3.3502 (Verified)'}
              </ThemedText>
            </View>
          </View>
          {user?.role !== 'POLLING_AGENT' && (
            <Button
              label="Change"
              variant="outline"
              size="sm"
              onPress={() => router.push({ pathname: ROUTES.PU_PICKER, params: { mode: 'result' } })}
            />
          )}
        </View>
      </Card>

      {/* Accreditation Counts */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="label" color="textMuted" fontFamily="bold" style={{ marginBottom: spacing.xs }}>
          BVAS ACCREDITATION & REJECTED BALLOTS
        </ThemedText>
        <Input
          label="BVAS Accredited Voters Count"
          placeholder="e.g. 600"
          value={accredited}
          onChangeText={setAccredited}
          keyboardType="number-pad"
          leftIcon="people-outline"
          containerStyle={{ marginBottom: spacing.sm }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Rejected (Observed)"
              placeholder="0"
              value={rejectedObs}
              onChangeText={setRejectedObs}
              keyboardType="number-pad"
              leftIcon="close-circle-outline"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Rejected (INEC EC8A)"
              placeholder="0"
              value={rejectedInec}
              onChangeText={setRejectedInec}
              keyboardType="number-pad"
              leftIcon="document-text-outline"
            />
          </View>
        </View>
      </Card>

      {/* Candidate Votes Breakdown */}
      <Card style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="title" color="text" fontFamily="bold">
              Candidate Ballots Tally
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Enter count for each candidate per announced polling unit EC8A form
            </ThemedText>
          </View>
          <Button
            label="Match INEC"
            variant="outline"
            size="sm"
            leftIcon="copy-outline"
            onPress={handleAutoMatchInec}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          {candidates.map((cand) => {
            const obsVal = votes[cand.id]?.observed ?? '';
            const inecVal = votes[cand.id]?.inec ?? '';

            return (
              <View key={cand.id} style={[styles.candVoteBox, { borderColor: colors.border }]}>
                <View style={styles.candVoteHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" color="text" fontFamily="bold">
                      {cand.fullName}
                    </ThemedText>
                    <ThemedText variant="label" color="primary" fontFamily="bold">
                      {cand.partyAcronym} · {cand.partyName}
                    </ThemedText>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Observed Count"
                      placeholder="0"
                      value={obsVal}
                      onChangeText={(val) => handleVoteChange(cand.id, 'observed', val)}
                      keyboardType="number-pad"
                      leftIcon="eye-outline"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="INEC EC8A Count"
                      placeholder="0"
                      value={inecVal}
                      onChangeText={(val) => handleVoteChange(cand.id, 'inec', val)}
                      keyboardType="number-pad"
                      leftIcon="checkmark-done-outline"
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Live Total Tally Strip */}
        <View style={[styles.totalStrip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ThemedText variant="body" color="text" fontFamily="bold">
            Total Ballots Counted:
          </ThemedText>
          <ThemedText variant="title" color="primary" fontFamily="bold">
            {computeTotal().toLocaleString()} votes
          </ThemedText>
        </View>

        {/* Real-time Over-Voting Integrity Banner */}
        {parseInt(accredited || '0', 10) > 0 && (
          <View
            style={[
              styles.validationBanner,
              {
                backgroundColor:
                  computeTotal() > parseInt(accredited || '0', 10)
                    ? colors.criticalSubtle
                    : colors.successSubtle,
                borderColor:
                  computeTotal() > parseInt(accredited || '0', 10)
                    ? colors.critical
                    : colors.success,
              },
            ]}
          >
            <Ionicons
              name={
                computeTotal() > parseInt(accredited || '0', 10)
                  ? 'alert-circle'
                  : 'checkmark-circle'
              }
              size={18}
              color={
                computeTotal() > parseInt(accredited || '0', 10)
                  ? colors.critical
                  : colors.success
              }
            />
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <ThemedText
                variant="label"
                fontFamily="bold"
                style={{
                  color:
                    computeTotal() > parseInt(accredited || '0', 10)
                      ? colors.critical
                      : colors.success,
                }}
              >
                {computeTotal() > parseInt(accredited || '0', 10)
                  ? `OVER-VOTING DETECTED: Total ballots (${computeTotal()}) exceeds accredited voters (${parseInt(accredited || '0', 10)})`
                  : `BALLOT COUNT VERIFIED: ${computeTotal()} / ${parseInt(accredited || '0', 10)} accredited (${((computeTotal() / parseInt(accredited || '0', 10)) * 100).toFixed(1)}% Turnout)`}
              </ThemedText>
            </View>
          </View>
        )}
      </Card>

      {/* Actions: Save Draft vs Publish */}
      <View style={styles.bottomActions}>
        <Button
          label="Save as Draft"
          variant="outline"
          size="lg"
          leftIcon="save-outline"
          onPress={handleSaveDraft}
          loading={submitting}
          style={{ flex: 1 }}
        />
        <Button
          label="Publish Official Return"
          variant="primary"
          size="lg"
          leftIcon="cloud-upload-outline"
          onPress={handlePublish}
          loading={submitting}
          style={{ flex: 1.5 }}
        />
      </View>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  restrictedCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    width: '100%',
    ...shadows.md,
  },
  restrictedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  puDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  candVoteBox: {
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  candVoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
});
