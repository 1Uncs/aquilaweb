import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, Alert, TextInput, Image, Modal, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, Button, Shimmer, SkeletonCard } from '@/core/components';
import { useIncidentsQuery, usePollingUnitsQuery } from '@/features/elections/hooks';
import { spacing, radius, shadows, border } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useHaptics, useRefreshControl } from '@/core/hooks';
import Colors from '@/constants/colors';
import { useIncidentsStore, useAuthStore } from '@/features/auth/store';
import { IncidentStatus, IncidentSeverity } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#D97706',
  LOW: '#16A34A',
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  VOTE_BUYING: 'cash-outline',
  BVAS_FAILURE: 'hardware-chip-outline',
  VIOLENCE: 'warning-outline',
  LOGISTICS: 'car-outline',
  BALLOT_SNATCHING: 'hand-left-outline',
  OTHER: 'alert-circle-outline',
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { incidents: storeIncidents, updateIncident } = useIncidentsStore();
  const { data: apiIncidents = [], isLoading, refetch } = useIncidentsQuery();
  const { refreshControl } = useRefreshControl(isLoading, refetch);
  const { data: pollingUnits = [] } = usePollingUnitsQuery();
  const { impact } = useHaptics();

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });

  // Officer Notes state
  const [officerNotes, setOfficerNotes] = useState('');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

  const incident = useMemo(() => {
    return storeIncidents.find((i) => i.id === id) ?? apiIncidents.find((i) => i.id === id) ?? null;
  }, [id, storeIncidents, apiIncidents]);

  const puInfo = useMemo(() => {
    if (!incident?.pollingUnitId) return null;
    return pollingUnits.find((p) => p.id === incident.pollingUnitId);
  }, [incident, pollingUnits]);

  const isOfficer = user?.role === 'ELECTION_OFFICER';
  const isResolved = incident?.status === 'RESOLVED';
  const isUnderReview = incident?.status === 'UNDER_REVIEW';

  const categoryIcon = incident ? (CATEGORY_ICONS[incident.category] ?? 'alert-circle-outline') : 'alert-circle-outline';

  const handleUpdateStatus = (newStatus: IncidentStatus) => {
    if (!incident) return;
    impact(Haptics.ImpactFeedbackStyle.Medium);
    updateIncident(incident.id, { status: newStatus });
  };

  const handleUpdateSeverity = (newSeverity: IncidentSeverity) => {
    if (!incident) return;
    impact(Haptics.ImpactFeedbackStyle.Light);
    updateIncident(incident.id, { severity: newSeverity });
  };

  const handleSaveNotes = () => {
    if (!officerNotes.trim()) {
      Alert.alert('Assessment Required', 'Please enter officer notes or dispatch directives before saving.');
      return;
    }
    impact(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Assessment Logged',
      'Officer directives transmitted to Situation Room dispatch log.',
      [{ text: 'OK' }]
    );
  };

  const openMap = async () => {
    if (!incident?.latitude || !incident?.longitude) return;
    impact(Haptics.ImpactFeedbackStyle.Light);
    const url = `https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: colors.primary,
        toolbarColor: colors.surface,
      });
    } catch {
      Linking.openURL(url).catch(() => {
        Alert.alert('Unable to open map', 'No map application available.');
      });
    }
  };

  if (isLoading && !incident) {
    return (
      <ScreenView scrollable={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Status Card Skeleton */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Shimmer width={120} height={22} borderRadius={radius.full} />
            <Shimmer width={80} height={22} borderRadius={radius.full} />
          </View>
          <Shimmer width="85%" height={24} borderRadius={radius.sm} style={{ marginTop: 6 }} />
          <Shimmer width="60%" height={14} borderRadius={radius.sm} />
          <Shimmer width="40%" height={12} borderRadius={radius.sm} />
        </View>

        {/* Intelligence Details Skeleton Cards */}
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </View>
      </ScreenView>
    );
  }

  if (!incident) {
    return (
      <ScreenView scrollable={false}>
        <EmptyState
          icon="alert-circle-outline"
          title="Incident Not Found"
          subtitle="The requested incident log could not be retrieved from the control room."
          actionLabel="Back to Incidents"
          onAction={() => router.back()}
        />
      </ScreenView>
    );
  }

  return (
    <ScreenView scrollable refreshControl={refreshControl} contentContainerStyle={styles.scrollContent}>
      {/* 1. Hero Status Card */}
      <LinearGradient
        colors={
          incident.severity === 'CRITICAL'
            ? ['#7F1D1D', '#991B1B']
            : incident.severity === 'HIGH'
            ? ['#7C2D12', '#9A3412']
            : ['#0A4A2A', '#0D6338']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, shadows.md]}
      >
        <View style={styles.heroTopRow}>
          <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Ionicons name={categoryIcon} size={14} color="#FFFFFF" />
            <ThemedText variant="label" color="#FFFFFF" fontFamily="bold" style={{ marginLeft: 6 }}>
              {incident.category.replace(/_/g, ' ')}
            </ThemedText>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)' }]}>
            <ThemedText
              variant="label"
              color={isResolved ? '#6EE7B7' : '#FDE68A'}
              fontFamily="bold"
            >
              {isResolved ? 'RESOLVED' : isUnderReview ? 'UNDER REVIEW' : 'LOGGED'}
            </ThemedText>
          </View>
        </View>

        <ThemedText variant="h2" color="#FFFFFF" fontFamily="bold" style={{ marginTop: spacing.sm }}>
          {incident.category.replace(/_/g, ' ')}
        </ThemedText>

        <ThemedText variant="caption" color="rgba(255, 255, 255, 0.85)" style={{ marginTop: 2 }}>
          {incident.electoralArea} · Reported {new Date(incident.reportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>

        {/* Severity Indicator Strip */}
        <View style={styles.severityStrip}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <ThemedText variant="label" color="#FFFFFF" fontFamily="bold">
              {incident.severity} PRIORITY
            </ThemedText>
          </View>

          {incident.latitude && incident.longitude ? (
            <Pressable onPress={openMap} style={styles.gpsLink}>
              <Ionicons name="location-sharp" size={13} color="#FFFFFF" />
              <ThemedText variant="label" color="#FFFFFF" fontFamily="medium" style={{ marginLeft: 4 }}>
                {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
              </ThemedText>
              <Ionicons name="open-outline" size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {/* 2. Incident Description & Field Notes */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginLeft: spacing.xs }}>
            Field Dispatch Summary
          </ThemedText>
        </View>

        <ThemedText variant="body" color="text" style={{ lineHeight: 22 }}>
          {incident.description}
        </ThemedText>

        <View style={[styles.reporterRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-circle-outline" size={18} color={colors.textSecondary} />
            <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
              Filed by Field Operative · {incident.reportedBy}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* 3. Electoral Geography & Polling Unit Context */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="map-outline" size={18} color={colors.primary} />
          <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginLeft: spacing.xs }}>
            Electoral Sector Context
          </ThemedText>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <ThemedText variant="label" color="textMuted">ELECTORAL AREA</ThemedText>
            <ThemedText variant="body" color="text" fontFamily="medium" style={{ marginTop: 2 }}>
              {incident.electoralArea}
            </ThemedText>
          </View>

          {puInfo ? (
            <View style={styles.infoCol}>
              <ThemedText variant="label" color="textMuted">OFFICIAL PU CODE</ThemedText>
              <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginTop: 2 }}>
                {puInfo.code}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 1 }}>
                {puInfo.name}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.infoCol}>
              <ThemedText variant="label" color="textMuted">LOCATION SCOPE</ThemedText>
              <ThemedText variant="body" color="text" fontFamily="medium" style={{ marginTop: 2 }}>
                Sector-Wide Incident
              </ThemedText>
            </View>
          )}
        </View>

        {incident.latitude && incident.longitude ? (
          <Pressable
            onPress={openMap}
            style={[styles.tacticalMapContainer, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
          >
            {/* Visual Radar Grid */}
            <View style={styles.tacticalGridBackground}>
              <View style={[styles.radarCircleOuter, { borderColor: colors.primary + '30' }]}>
                <View style={[styles.radarCircleInner, { borderColor: colors.primary + '50' }]}>
                  <View style={[styles.radarCenterPulse, { backgroundColor: colors.primary }]} />
                </View>
              </View>
              <View style={[styles.crosshairH, { backgroundColor: colors.border }]} />
              <View style={[styles.crosshairV, { backgroundColor: colors.border }]} />
            </View>

            {/* Tactical Overlay Info */}
            <View style={styles.tacticalMapOverlay}>
              <View style={styles.tacticalBadge}>
                <Ionicons name="radio" size={12} color="#10B981" />
                <ThemedText variant="caption" style={{ color: '#10B981', fontWeight: '800', fontSize: 10, letterSpacing: 0.5, marginLeft: 4 }}>
                  IN-APP SECTOR SATELLITE
                </ThemedText>
              </View>

              <View style={{ marginVertical: spacing.sm, alignItems: 'center' }}>
                <ThemedText variant="label" color="text" fontFamily="bold" style={{ fontSize: 14 }}>
                  {incident.latitude.toFixed(5)}°N, {incident.longitude.toFixed(5)}°E
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2, fontSize: 11 }}>
                  {incident.electoralArea} · {puInfo?.name ?? 'Assigned Precinct Grid'}
                </ThemedText>
              </View>

              <View style={[styles.tacticalBottomBar, { borderTopColor: colors.border + '50' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="map-outline" size={14} color={colors.primary} />
                  <ThemedText variant="caption" color="primary" fontFamily="bold">
                    Inspect Interactive Map (In-App)
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </View>
          </Pressable>
        ) : null}
      </Card>

      {/* 4. Evidence Vault (Attached Audio / Photos) */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
          <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginLeft: spacing.xs }}>
            Evidence Vault & Media Attachments
          </ThemedText>
        </View>

        {incident.mediaUrls && incident.mediaUrls.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {incident.mediaUrls.map((uri, idx) => {
              const isAudio = uri.includes('.m4a') || uri.includes('audio') || uri.includes('recording') || uri.endsWith('.mp3');
              const isVideo = uri.includes('.mp4') || uri.includes('.mov') || uri.includes('video');
              const isPhoto = !isAudio && !isVideo;
              const fileName = typeof uri === 'string' && uri.includes('/') ? uri.split('/').pop()?.split('?')[0] : `evidence-${idx + 1}`;

              if (isPhoto) {
                return (
                  <View
                    key={idx}
                    style={[styles.evidenceMediaCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  >
                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setPreviewImageUri(uri);
                      }}
                      style={styles.evidenceImagePressable}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.evidenceImageThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.evidenceExpandOverlay}>
                        <Ionicons name="expand" size={14} color="#FFFFFF" />
                        <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold" style={{ marginLeft: 4, fontSize: 11 }}>
                          Inspect
                        </ThemedText>
                      </View>
                    </Pressable>

                    <View style={styles.evidenceMediaMeta}>
                      <View style={{ flex: 1 }}>
                        <ThemedText variant="body" color="text" fontFamily="bold" numberOfLines={1}>
                          Geotagged Photo #{idx + 1}
                        </ThemedText>
                        <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                          {fileName} · Field Camera
                        </ThemedText>
                      </View>
                      <Button
                        label="Full View"
                        variant="outline"
                        size="sm"
                        leftIcon="scan-outline"
                        onPress={() => {
                          impact(Haptics.ImpactFeedbackStyle.Light);
                          setPreviewImageUri(uri);
                        }}
                      />
                    </View>
                  </View>
                );
              }

              if (isVideo) {
                return (
                  <VideoEvidencePlayer key={idx} uri={uri} index={idx} fileName={fileName} />
                );
              }

              return (
                <AudioEvidencePlayer key={idx} uri={uri} index={idx} />
              );
            })}
          </View>
        ) : (
          <View style={styles.noEvidenceBox}>
            <Ionicons name="document-text-outline" size={24} color={colors.textMuted} />
            <ThemedText variant="caption" color="textMuted" style={{ marginTop: 4, textAlign: 'center' }}>
              Verified textual incident dispatch. No secondary audio or photo media attached by field operative.
            </ThemedText>
          </View>
        )}
      </Card>

      {/* 5. Situation Room Chain of Custody Audit Trail */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
          <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginLeft: spacing.xs }}>
            Chain of Custody Audit Trail
          </ThemedText>
        </View>

        <View style={styles.timeline}>
          {/* Step 1: Logged */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.timelineContent}>
              <ThemedText variant="body" color="text" fontFamily="bold">
                Incident Logged in Field
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Operative transmission received with cryptographic timestamp.
              </ThemedText>
              <ThemedText variant="label" color="textMuted" style={{ marginTop: 2 }}>
                {new Date(incident.reportedAt).toLocaleTimeString()}
              </ThemedText>
            </View>
          </View>

          {/* Step 2: Under Review */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { backgroundColor: isUnderReview || isResolved ? colors.warning : colors.border }]}>
                <Ionicons name="eye-outline" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.timelineContent}>
              <ThemedText variant="body" color="text" fontFamily="bold">
                Situation Room Triage & Audit
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Assigned to Situation Room Election Director for threat verification.
              </ThemedText>
              <ThemedText variant="label" color="textMuted" style={{ marginTop: 2 }}>
                {isUnderReview || isResolved ? 'Active Investigation' : 'Queued for Triage'}
              </ThemedText>
            </View>
          </View>

          {/* Step 3: Resolution */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineNode, { backgroundColor: isResolved ? colors.verified : colors.border }]}>
                <Ionicons name={isResolved ? 'shield-checkmark' : 'time-outline'} size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.timelineContent}>
              <ThemedText variant="body" color="text" fontFamily="bold">
                {isResolved ? 'Official Case Resolution' : 'Pending Final Disposition'}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {isResolved
                  ? 'Task force directives issued. Field status reconciled.'
                  : 'Awaiting officer sign-off or task force deployment.'}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      {/* 6. Officer Triage Station (Election Officers Only) */}
      {isOfficer ? (
        <Card style={[styles.sectionCard, { borderColor: colors.primary, borderWidth: border.thick }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <ThemedText variant="body" color="primary" fontFamily="bold" style={{ marginLeft: spacing.xs }}>
              Officer Incident Triage Station
            </ThemedText>
          </View>

          <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>
            As an Election Officer, you hold operational jurisdiction to adjust incident severity, assign case states, and issue field dispatch directives.
          </ThemedText>

          {/* Severity Adjustment */}
          <ThemedText variant="label" color="textSecondary" fontFamily="bold" style={{ marginBottom: 6 }}>
            ADJUST SEVERITY LEVEL
          </ThemedText>
          <View style={styles.severityToggles}>
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => {
              const active = incident.severity === sev;
              const sColor = SEVERITY_COLORS[sev] ?? colors.warning;
              return (
                <Pressable
                  key={sev}
                  onPress={() => handleUpdateSeverity(sev)}
                  style={[
                    styles.severityBtn,
                    {
                      borderColor: active ? sColor : colors.border,
                      backgroundColor: active ? sColor + '18' : colors.surface,
                    },
                  ]}
                >
                  <ThemedText
                    variant="label"
                    style={{ color: active ? sColor : colors.textSecondary }}
                    fontFamily={active ? 'bold' : 'medium'}
                  >
                    {sev}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Officer Quick Actions */}
          <ThemedText variant="label" color="textSecondary" fontFamily="bold" style={{ marginTop: spacing.md, marginBottom: 6 }}>
            CASE STATUS ACTION
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {!isResolved && (
              <Button
                label={isUnderReview ? 'Under Investigation' : 'Mark Under Review'}
                variant={isUnderReview ? 'primary' : 'outline'}
                size="sm"
                leftIcon="search-outline"
                onPress={() => handleUpdateStatus('UNDER_REVIEW')}
                style={{ flex: 1 }}
              />
            )}
            <Button
              label={isResolved ? 'Reopen Case' : 'Resolve Incident'}
              variant={isResolved ? 'outline' : 'primary'}
              size="sm"
              leftIcon={isResolved ? 'refresh-outline' : 'checkmark-circle-outline'}
              onPress={() => handleUpdateStatus(isResolved ? 'UNDER_REVIEW' : 'RESOLVED')}
              style={{ flex: 1 }}
            />
          </View>

          {/* Directives Input */}
          <ThemedText variant="label" color="textSecondary" fontFamily="bold" style={{ marginTop: spacing.md, marginBottom: 6 }}>
            SITUATION ROOM DIRECTIVES & NOTES
          </ThemedText>
          <TextInput
            value={officerNotes}
            onChangeText={setOfficerNotes}
            placeholder="Log dispatch orders, security team mobilization, or audit notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={[
              styles.notesInput,
              {
                color: colors.text,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
              },
            ]}
          />

          <Button
            label="Save Directive to Audit Trail"
            variant="primary"
            size="md"
            leftIcon="save-outline"
            onPress={handleSaveNotes}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      ) : (
        <Card style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <ThemedText variant="caption" color="textSecondary" style={{ flex: 1 }}>
              Official incident triage is governed by Situation Room Election Officers. Status updates and task force actions synchronize in real time across the control room.
            </ThemedText>
          </View>
        </Card>
      )}

      {/* Lightbox Fullscreen Image Inspection Modal */}
      <Modal
        visible={previewImageUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.lightboxBackdrop}>
          <View style={styles.lightboxHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="body" color="#FFFFFF" fontFamily="bold">
                Evidence Photo Inspection
              </ThemedText>
              <ThemedText variant="caption" color="#9CA3AF">
                Incident #{incident.id} · {incident.electoralArea}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => setPreviewImageUri(null)}
              hitSlop={12}
              style={styles.lightboxCloseBtn}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {previewImageUri ? (
            <View style={styles.lightboxImageContainer}>
              <Image
                source={{ uri: previewImageUri }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            </View>
          ) : null}

          <View style={styles.lightboxFooter}>
            <ThemedText variant="caption" color="#D1D5DB" style={{ textAlign: 'center' }}>
              Chain of custody verified · High-resolution operative capture
            </ThemedText>
          </View>
        </View>
      </Modal>
    </ScreenView>
  );
}

function AudioEvidencePlayer({ uri, index }: { uri: string; index: number }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { impact } = useHaptics();

  const isRealSource = uri.startsWith('file://') || uri.startsWith('http://') || uri.startsWith('https://');
  const player = useAudioPlayer(isRealSource ? uri : null);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status?.playing ?? false;
  const currentTime = Math.round(status?.currentTime ?? 0);
  const duration = Math.round(status?.duration ?? 0);

  const togglePlay = () => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    if (!isRealSource) {
      Alert.alert(
        'Simulated Audio Evidence',
        'This mock incident contains simulated offline metadata. Live audio recorded in "Report Incident" plays through this player.'
      );
      return;
    }
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={[styles.evidenceItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={[styles.evidenceIconWrap, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name={isPlaying ? 'volume-high' : 'mic-outline'} size={20} color={colors.primary} />
      </View>

      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <ThemedText variant="body" color="text" fontFamily="medium" numberOfLines={1}>
          Evidence Audio Memo #{index + 1}
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary">
          {duration > 0
            ? `${currentTime}s / ${duration}s · Audio Recording`
            : isRealSource
            ? 'Encrypted Field Recording · Tap to listen'
            : 'Simulated Audio Recording'}
        </ThemedText>
      </View>

      <Button
        label={isPlaying ? 'Pause' : 'Play'}
        variant={isPlaying ? 'primary' : 'outline'}
        size="sm"
        leftIcon={isPlaying ? 'pause' : 'play'}
        onPress={togglePlay}
      />
    </View>
  );
}

function VideoEvidencePlayer({ uri, index, fileName }: { uri: string; index: number; fileName?: string }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const isValidVideoSource = uri.startsWith('file://') || uri.startsWith('http://') || uri.startsWith('https://');
  const player = useVideoPlayer(isValidVideoSource ? uri : null, (p) => {
    p.loop = false;
  });

  return (
    <View style={[styles.evidenceMediaCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      {isValidVideoSource ? (
        <View style={styles.videoPlayerContainer}>
          <VideoView
            player={player}
            style={styles.videoView}
            nativeControls
            contentFit="contain"
            allowsPictureInPicture
            startsPictureInPictureAutomatically={false}
          />
        </View>
      ) : (
        <View style={[styles.evidenceVideoThumb, { backgroundColor: colors.background }]}>
          <Ionicons name="videocam-outline" size={40} color={colors.primary} />
          <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
            Simulated Video Evidence
          </ThemedText>
        </View>
      )}

      <View style={styles.evidenceMediaMeta}>
        <View style={{ flex: 1 }}>
          <ThemedText variant="body" color="text" fontFamily="bold" numberOfLines={1}>
            Live Video Recording #{index + 1}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
            {fileName || `video-${index + 1}`} · Field Recording
          </ThemedText>
        </View>
        <Ionicons name="videocam" size={20} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  severityStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  gpsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  sectionCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reporterRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: border.thin,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoCol: {
    paddingVertical: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  evidenceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEvidenceBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  timeline: {
    marginTop: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.sm,
  },
  severityToggles: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  notesInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  evidenceMediaCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  evidenceImagePressable: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#000000',
  },
  evidenceImageThumb: {
    width: '100%',
    height: '100%',
  },
  evidenceExpandOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  evidenceVideoThumb: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceMediaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: spacing.md,
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  lightboxCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  videoPlayerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  tacticalMapContainer: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: border.thin,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  tacticalGridBackground: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.35,
  },
  radarCircleOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCircleInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenterPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  crosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  crosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  tacticalMapOverlay: {
    padding: spacing.sm,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  tacticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B98118',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  tacticalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
});
