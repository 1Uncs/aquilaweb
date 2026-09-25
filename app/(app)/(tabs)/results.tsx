import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, Button, SkeletonCard } from '@/core/components';
import { ROUTES } from '@/constants/routes';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useResultsQuery, useCandidatesQuery } from '@/features/elections/hooks';
import { useRefreshControl, useForegroundRefresh, useHaptics } from '@/core/hooks';
import Colors from '@/constants/colors';
import { useResultsStore, useAuthStore, ResultSubmission } from '@/features/auth/store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';

const LGA_MAP_POLYGONS: Record<string, { path: string; labelX: number; labelY: number; label: string }> = {
  'lga-alimosho': {
    path: 'M 25 50 L 115 35 L 125 105 L 65 125 L 20 95 Z',
    labelX: 72,
    labelY: 78,
    label: 'Alimosho',
  },
  'lga-ikeja': {
    path: 'M 115 35 L 205 30 L 210 95 L 125 105 Z',
    labelX: 162,
    labelY: 65,
    label: 'Ikeja',
  },
  'lga-kosofe': {
    path: 'M 205 30 L 305 25 L 315 100 L 210 95 Z',
    labelX: 258,
    labelY: 62,
    label: 'Kosofe',
  },
  'lga-mainland': {
    path: 'M 125 105 L 210 95 L 215 155 L 140 165 Z',
    labelX: 172,
    labelY: 130,
    label: 'Mainland',
  },
  'lga-surulere': {
    path: 'M 65 125 L 140 165 L 125 205 L 50 175 Z',
    labelX: 95,
    labelY: 168,
    label: 'Surulere',
  },
  'lga-etiosa': {
    path: 'M 140 165 L 215 155 L 360 140 L 355 185 L 235 195 L 125 205 Z',
    labelX: 245,
    labelY: 175,
    label: 'Eti-Osa',
  },
};

export default function ResultsScreen() {
  const { user } = useAuthStore();
  const { data: apiResults = [], isLoading: loading, refetch: refetchResults } = useResultsQuery();
  const { submissions } = useResultsStore();
  const { data: candidates = [] } = useCandidatesQuery('e1');
  const { refreshControl } = useRefreshControl(loading, refetchResults);
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });
  useForegroundRefresh([['results', 'list']], 5 * 60 * 1000);
  const { impact } = useHaptics();

  // Active tab: 'published' vs 'drafts' (Audio Part 3)
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');

  // Combined published results (API + local published)
  const publishedResults = useMemo(() => {
    const localPublished = submissions.filter((s) => s.status === 'PUBLISHED');
    const ids = new Set(localPublished.map((s) => s.id));
    const remoteUnique = apiResults.filter((r) => !ids.has(r.id));
    return [...localPublished, ...remoteUnique];
  }, [submissions, apiResults]);

  // Local draft submissions awaiting publication
  const draftResults = useMemo(() => {
    return submissions.filter((s) => s.status === 'DRAFT');
  }, [submissions]);

  const isOfficer = user?.role === 'ELECTION_OFFICER';
  const activeList = isOfficer || activeTab === 'published' ? publishedResults : draftResults;

  const totalVotes = publishedResults.reduce((sum, r) => sum + (r.totalVotesCast || 0), 0);

  const candMap = useMemo(() => {
    const m = new Map<string, (typeof candidates)[0]>();
    candidates.forEach((c) => m.set(c.id, c));
    return m;
  }, [candidates]);

  const renderResultItem = useCallback(({ item }: { item: ResultSubmission }) => {
    const isPublished = item.status === 'PUBLISHED';
    const totalCast = item.totalVotesCast || 1;

    // Find leading candidate in this PU
    let topCandId = '';
    let topCandVotes = 0;
    Object.entries(item.candidateVotes || {}).forEach(([cId, v]) => {
      const val = typeof v === 'number' ? v : 0;
      if (val > topCandVotes) {
        topCandVotes = val;
        topCandId = cId;
      }
    });

    const leadCand = candMap.get(topCandId);
    const leadPct = ((topCandVotes / totalCast) * 100).toFixed(1);

    return (
      <Card
        pressable
        style={styles.itemCard}
        onPress={() => {
          impact(Haptics.ImpactFeedbackStyle.Light);
          if (isPublished) {
            router.push({ pathname: ROUTES.RESULT_DETAIL, params: { id: item.id } });
          } else {
            router.push(ROUTES.RESULT_DRAFTS);
          }
        }}
      >
        <View style={styles.itemHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="body" color="text" fontFamily="bold">
              {item.pollingUnitName}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {isPublished ? 'Official Return' : 'Draft Return'} · {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
          </View>

          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: isPublished ? colors.successSubtle : colors.warningSubtle,
                borderColor: isPublished ? colors.success : colors.warning,
              },
            ]}
          >
            <Ionicons
              name={isPublished ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={isPublished ? colors.success : colors.warning}
            />
            <ThemedText
              variant="label"
              fontFamily="bold"
              style={{
                marginLeft: 4,
                color: isPublished ? colors.success : colors.warning,
              }}
            >
              {item.status}
            </ThemedText>
          </View>
        </View>

        {/* Leading Candidate Strip */}
        <View style={[styles.leadStrip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="label" color="textMuted">LEADING CANDIDATE</ThemedText>
            <ThemedText variant="body" color="text" fontFamily="bold">
              {leadCand?.fullName ?? (topCandId ? `Candidate ${topCandId}` : 'Awaiting breakdown')}
            </ThemedText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <ThemedText variant="title" color="primary" fontFamily="bold">
              {topCandVotes.toLocaleString()}
            </ThemedText>
            <ThemedText variant="label" color="textSecondary">
              {leadPct}% of cast ballots
            </ThemedText>
          </View>
        </View>

        {/* Bottom Turnout bar */}
        <View style={styles.itemFooter}>
          <ThemedText variant="caption" color="textSecondary">
            Accredited: {item.totalAccreditedVoters.toLocaleString()} · Ballots: {item.totalVotesCast.toLocaleString()}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText variant="caption" color="primary" fontFamily="bold">
              {isPublished ? 'View Details' : 'Continue Draft'}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </Card>
    );
  }, [candMap, colors, impact]);

  // View Mode: 'returns' vs 'heatmap'
  const [viewMode, setViewMode] = useState<'returns' | 'heatmap'>('returns');
  const [filterLga, setFilterLga] = useState<string | null>(null);
  const [partyFilter, setPartyFilter] = useState<'ALL' | 'APC' | 'PDP' | 'LP' | 'NNPP'>('ALL');

  // Filtered active list for PU returns
  const displayedReturns = useMemo(() => {
    let list = activeList;
    if (filterLga) {
      list = list.filter((r) =>
        r.pollingUnitName?.toLowerCase().includes(filterLga.toLowerCase()) ||
        (r as unknown as { lgaName?: string }).lgaName?.toLowerCase().includes(filterLga.toLowerCase())
      );
    }
    return list;
  }, [activeList, filterLga]);

  // Aggregate LGA Collation Heatmap data
  const lgaHeatmapData = useMemo(() => {
    const lgaBases: Array<{
      id: string;
      name: string;
      state: string;
      totalPus: number;
      baseCollated: number;
      baseVotes: { APC: number; PDP: number; LP: number; NNPP: number };
    }> = [
      {
        id: 'lga-ikeja',
        name: 'Ikeja LGA',
        state: 'Lagos',
        totalPus: 450,
        baseCollated: 412,
        baseVotes: { APC: 42350, PDP: 28140, LP: 21980, NNPP: 3200 },
      },
      {
        id: 'lga-mainland',
        name: 'Lagos Mainland',
        state: 'Lagos',
        totalPus: 380,
        baseCollated: 345,
        baseVotes: { APC: 27800, PDP: 35900, LP: 18450, NNPP: 2800 },
      },
      {
        id: 'lga-alimosho',
        name: 'Alimosho LGA',
        state: 'Lagos',
        totalPus: 620,
        baseCollated: 540,
        baseVotes: { APC: 41200, PDP: 22400, LP: 53100, NNPP: 4600 },
      },
      {
        id: 'lga-etiosa',
        name: 'Eti-Osa LGA',
        state: 'Lagos',
        totalPus: 340,
        baseCollated: 298,
        baseVotes: { APC: 24600, PDP: 14200, LP: 39800, NNPP: 2100 },
      },
      {
        id: 'lga-surulere',
        name: 'Surulere LGA',
        state: 'Lagos',
        totalPus: 395,
        baseCollated: 360,
        baseVotes: { APC: 36400, PDP: 19800, LP: 31200, NNPP: 3100 },
      },
      {
        id: 'lga-kosofe',
        name: 'Kosofe LGA',
        state: 'Lagos',
        totalPus: 310,
        baseCollated: 275,
        baseVotes: { APC: 30100, PDP: 24500, LP: 19400, NNPP: 2950 },
      },
    ];

    // Fold in dynamic live submissions
    publishedResults.forEach((sub) => {
      const match = lgaBases.find((l) =>
        sub.pollingUnitName?.toLowerCase().includes(l.name.toLowerCase().split(' ')[0]!)
      );
      if (match && sub.candidateVotes) {
        match.baseCollated += 1;
        match.baseVotes.APC += sub.candidateVotes['cand1'] || 0;
        match.baseVotes.PDP += sub.candidateVotes['cand2'] || 0;
        match.baseVotes.LP += sub.candidateVotes['cand3'] || 0;
        match.baseVotes.NNPP += sub.candidateVotes['cand4'] || 0;
      }
    });

    return lgaBases.map((lga) => {
      const totalVotes = lga.baseVotes.APC + lga.baseVotes.PDP + lga.baseVotes.LP + lga.baseVotes.NNPP;
      const shares: Array<{ party: 'APC' | 'PDP' | 'LP' | 'NNPP'; votes: number; pct: number }> = [
        { party: 'APC' as const, votes: lga.baseVotes.APC, pct: (lga.baseVotes.APC / totalVotes) * 100 },
        { party: 'PDP' as const, votes: lga.baseVotes.PDP, pct: (lga.baseVotes.PDP / totalVotes) * 100 },
        { party: 'LP' as const, votes: lga.baseVotes.LP, pct: (lga.baseVotes.LP / totalVotes) * 100 },
        { party: 'NNPP' as const, votes: lga.baseVotes.NNPP, pct: (lga.baseVotes.NNPP / totalVotes) * 100 },
      ].sort((a, b) => b.votes - a.votes);

      const leader = shares[0]!;
      const runnerUp = shares[1]!;
      const margin = (leader.pct - runnerUp.pct).toFixed(1);
      const reportingPct = Math.min(100, (lga.baseCollated / lga.totalPus) * 100).toFixed(0);

      const candidateNames: Record<string, string> = {
        APC: 'Bola Ahmed Tinubu',
        PDP: 'Atiku Abubakar',
        LP: 'Peter Obi',
        NNPP: 'Rabiu Kwankwaso',
      };

      return {
        ...lga,
        totalVotes,
        reportingPct: Number(reportingPct),
        leadingParty: leader.party,
        leadingCandidate: candidateNames[leader.party] ?? leader.party,
        leadingPct: leader.pct.toFixed(1),
        margin,
        shares,
      };
    });
  }, [publishedResults]);

  const filteredLgas = useMemo(() => {
    if (partyFilter === 'ALL') return lgaHeatmapData;
    return lgaHeatmapData.filter((l) => l.leadingParty === partyFilter);
  }, [lgaHeatmapData, partyFilter]);

  const totalCollatedAcrossLgas = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.baseCollated, 0);
  }, [lgaHeatmapData]);

  const totalPusAcrossLgas = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.totalPus, 0);
  }, [lgaHeatmapData]);

  const overallReportingPct = ((totalCollatedAcrossLgas / totalPusAcrossLgas) * 100).toFixed(1);

  // Geographic SVG Map State
  const [selectedMapLgaId, setSelectedMapLgaId] = useState<string>('lga-ikeja');
  const [mapHeatMode, setMapHeatMode] = useState<'party' | 'density'>('party');

  const selectedMapLga = useMemo(() => {
    return lgaHeatmapData.find((l) => l.id === selectedMapLgaId) ?? lgaHeatmapData[0]!;
  }, [lgaHeatmapData, selectedMapLgaId]);

  const handleOpenSatelliteMap = async () => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await WebBrowser.openBrowserAsync('https://www.openstreetmap.org/#map=11/6.5244/3.3792', {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (e) {
      console.warn('[results] open satellite map failed', e);
    }
  };

  const getLgaFillColor = useCallback((lga: typeof lgaHeatmapData[0]) => {
    if (mapHeatMode === 'density') {
      if (lga.reportingPct >= 90) return '#DC2626'; // High reporting heat
      if (lga.reportingPct >= 80) return '#EA580C'; // Medium-high
      if (lga.reportingPct >= 65) return '#D97706'; // Medium
      return '#16A34A'; // Initial
    }
    const partyColors: Record<string, string> = {
      APC: '#0D6338',
      PDP: '#DC2626',
      LP: '#16A34A',
      NNPP: '#2563EB',
    };
    return partyColors[lga.leadingParty] ?? '#0D6338';
  }, [mapHeatMode]);

  return (
    <ScreenView scrollable={false} noScrollPadding>
      <View style={styles.container}>
        {/* Top Control Bar */}
        <View style={styles.topControlBar}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="title" color="text" fontFamily="bold">
              Election Results
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {viewMode === 'returns'
                ? `Total ${totalVotes.toLocaleString()} votes across ${publishedResults.length} PUs`
                : `${overallReportingPct}% of collation centers reporting across Lagos State`}
            </ThemedText>
          </View>

          {user?.role === 'ELECTION_OFFICER' ? (
            <Button
              label="Collation"
              variant="outline"
              size="sm"
              leftIcon="bar-chart-outline"
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Medium);
                router.push(ROUTES.RESULT_COLLATION);
              }}
            />
          ) : (
            <Button
              label="+ Record Result"
              variant="primary"
              size="sm"
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Medium);
                router.push(ROUTES.RESULT_SUBMIT);
              }}
            />
          )}
        </View>

        {/* Primary View Switcher: [ 📋 PU Returns | 🗺️ Collation Heat Map ] */}
        <View style={[styles.mainViewSwitcher, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Pressable
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('returns');
            }}
            style={[
              styles.mainViewBtn,
              viewMode === 'returns' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
            ]}
          >
            <Ionicons
              name="list-outline"
              size={14}
              color={viewMode === 'returns' ? '#FFFFFF' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              variant="caption"
              color={viewMode === 'returns' ? '#FFFFFF' : 'textSecondary'}
              fontFamily={viewMode === 'returns' ? 'bold' : 'medium'}
            >
              PU Returns ({publishedResults.length})
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('heatmap');
            }}
            style={[
              styles.mainViewBtn,
              viewMode === 'heatmap' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
            ]}
          >
            <Ionicons
              name="map-outline"
              size={14}
              color={viewMode === 'heatmap' ? '#FFFFFF' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              variant="caption"
              color={viewMode === 'heatmap' ? '#FFFFFF' : 'textSecondary'}
              fontFamily={viewMode === 'heatmap' ? 'bold' : 'medium'}
            >
              Collation Heat Map ({lgaHeatmapData.length} LGAs)
            </ThemedText>
          </Pressable>
        </View>

        {/* Active Filter Pill if filtered by LGA */}
        {filterLga && (
          <View style={styles.filterChipRow}>
            <View style={[styles.filterChip, { backgroundColor: colors.primaryLight + '22', borderColor: colors.primary }]}>
              <ThemedText variant="caption" color="primary" fontFamily="bold">
                Filtered: {filterLga}
              </ThemedText>
              <Pressable
                onPress={() => {
                  impact(Haptics.ImpactFeedbackStyle.Light);
                  setFilterLga(null);
                }}
                style={{ marginLeft: 6 }}
              >
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* --- VIEW MODE 1: PU RETURNS --- */}
        {viewMode === 'returns' ? (
          <>
            {/* Tab Switcher: Published Results vs Drafts (Polling Agents only) */}
            {!isOfficer && (
              <View style={[styles.tabBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Pressable
                  onPress={() => {
                    impact(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('published');
                  }}
                  style={[
                    styles.tabBtn,
                    activeTab === 'published' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    color={activeTab === 'published' ? '#FFFFFF' : 'textSecondary'}
                    fontFamily={activeTab === 'published' ? 'bold' : 'medium'}
                  >
                    Published ({publishedResults.length})
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    impact(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('drafts');
                  }}
                  style={[
                    styles.tabBtn,
                    activeTab === 'drafts' && [styles.activeTabBtn, { backgroundColor: colors.primary }],
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ThemedText
                      variant="caption"
                      color={activeTab === 'drafts' ? '#FFFFFF' : 'textSecondary'}
                      fontFamily={activeTab === 'drafts' ? 'bold' : 'medium'}
                    >
                      Drafts ({draftResults.length})
                    </ThemedText>
                    {draftResults.length > 0 && (
                      <View style={[styles.tabBadge, { backgroundColor: colors.warning }]}>
                        <ThemedText variant="label" color="#FFFFFF" fontFamily="bold" style={{ fontSize: 9 }}>
                          {draftResults.length}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </Pressable>
              </View>
            )}

            {/* Native FlatList */}
            <FlatList
              data={displayedReturns}
              keyExtractor={(item) => item.id}
              renderItem={renderResultItem}
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
                    icon={activeTab === 'published' ? 'document-text-outline' : 'save-outline'}
                    title={activeTab === 'published' ? 'No Results Published Yet' : 'No Drafts Saved'}
                    subtitle={
                      activeTab === 'published'
                        ? 'Polling unit ballot returns will appear here once submitted and verified.'
                        : 'You have no incomplete drafts. Tap "+ Record Result" to begin a new submission.'
                    }
                    actionLabel="+ Record Result"
                    onAction={() => router.push(ROUTES.RESULT_SUBMIT)}
                  />
                )
              }
            />
          </>
        ) : (
          /* --- VIEW MODE 2: COLLATION HEAT MAP --- */
          <FlatList
            data={filteredLgas}
            keyExtractor={(item) => item.id}
            refreshControl={refreshControl}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListHeaderComponent={
              <View style={{ marginBottom: spacing.sm, gap: spacing.sm }}>
                {/* Collation Progress Banner */}
                <Card style={[styles.progressCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={styles.progressHeader}>
                    <View>
                      <ThemedText variant="caption" color="textSecondary" fontFamily="bold">
                        STATEWIDE COLLATION STATUS
                      </ThemedText>
                      <ThemedText variant="h3" color="text" fontFamily="bold">
                        {totalCollatedAcrossLgas.toLocaleString()} / {totalPusAcrossLgas.toLocaleString()} PUs
                      </ThemedText>
                    </View>
                    <View style={[styles.pctPill, { backgroundColor: colors.primaryLight + '22' }]}>
                      <ThemedText variant="title" color="primary" fontFamily="bold">
                        {overallReportingPct}%
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.statusBarTrack, { backgroundColor: colors.borderSubtle }]}>
                    <View
                      style={[
                        styles.statusBarFill,
                        { width: `${Math.min(100, Math.max(0, Number(overallReportingPct)))}%` as `${number}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>
                </Card>

                {/* Interactive Geographic SVG Collation Heat Map */}
                <Card style={[styles.mapContainerCard, { backgroundColor: '#07120B', borderColor: colors.border }]}>
                  <View style={styles.mapCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="map" size={16} color={colors.primary} />
                        <ThemedText variant="body" color="#FFFFFF" fontFamily="bold">
                          Lagos State Collation Map
                        </ThemedText>
                      </View>
                      <ThemedText variant="caption" color="#A3E6C2" style={{ marginTop: 2 }}>
                        Tap any district to inspect live collation metrics
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={handleOpenSatelliteMap}
                      style={[styles.satelliteBtn, { backgroundColor: colors.surfaceElevated + '99', borderColor: colors.border }]}
                    >
                      <Ionicons name="globe-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                        Satellite ↗
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Mode Switcher on Map: [ 🎨 Party Lead | 🔥 Turnout Heat ] */}
                  <View style={[styles.mapModeSwitcher, { backgroundColor: '#0D2619', borderColor: '#1B4D33' }]}>
                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setMapHeatMode('party');
                      }}
                      style={[
                        styles.mapModeBtn,
                        mapHeatMode === 'party' && [styles.activeMapModeBtn, { backgroundColor: colors.primary }],
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        color={mapHeatMode === 'party' ? '#FFFFFF' : '#A3E6C2'}
                        fontFamily={mapHeatMode === 'party' ? 'bold' : 'medium'}
                      >
                        🎨 Party Lead Map
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setMapHeatMode('density');
                      }}
                      style={[
                        styles.mapModeBtn,
                        mapHeatMode === 'density' && [styles.activeMapModeBtn, { backgroundColor: colors.primary }],
                      ]}
                    >
                      <ThemedText
                        variant="caption"
                        color={mapHeatMode === 'density' ? '#FFFFFF' : '#A3E6C2'}
                        fontFamily={mapHeatMode === 'density' ? 'bold' : 'medium'}
                      >
                        🔥 Collation Heat Map
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* SVG Canvas */}
                  <View style={styles.svgWrapper}>
                    <Svg width="100%" height={230} viewBox="0 0 380 240">
                      {/* Background Water / Atlantic Ocean */}
                      <Path
                        d="M 0 205 Q 190 190 380 205 L 380 240 L 0 240 Z"
                        fill="#0284C722"
                      />
                      <SvgText x={190} y={228} fill="#38BDF866" fontSize="10" fontWeight="bold" textAnchor="middle">
                        ATLANTIC OCEAN / BIGHT OF BENIN
                      </SvgText>

                      {/* Grid crosshairs for tactical aesthetic */}
                      <Path d="M 0 60 L 380 60" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 0 120 L 380 120" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 0 180 L 380 180" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 120 0 L 120 240" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 240 0 L 240 240" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />

                      {/* LGA Polygons */}
                      {lgaHeatmapData.map((lga) => {
                        const poly = LGA_MAP_POLYGONS[lga.id];
                        if (!poly) return null;
                        const isSelected = selectedMapLgaId === lga.id;
                        const fillColor = getLgaFillColor(lga);

                        return (
                          <G
                            key={lga.id}
                            onPress={() => {
                              impact(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedMapLgaId(lga.id);
                            }}
                          >
                            <Path
                              d={poly.path}
                              fill={fillColor}
                              fillOpacity={isSelected ? 0.95 : 0.75}
                              stroke={isSelected ? '#FFFFFF' : '#070C09'}
                              strokeWidth={isSelected ? 3 : 1.5}
                            />
                            {/* Center label */}
                            <SvgText
                              x={poly.labelX}
                              y={poly.labelY - 4}
                              fill="#FFFFFF"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {poly.label}
                            </SvgText>
                            {/* Sub-label: Party or % */}
                            <SvgText
                              x={poly.labelX}
                              y={poly.labelY + 9}
                              fill={isSelected ? '#FDE047' : '#FFFFFFCC'}
                              fontSize="9"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {mapHeatMode === 'party' ? `${lga.leadingParty} (${lga.leadingPct}%)` : `${lga.reportingPct}% collated`}
                            </SvgText>

                            {/* Selection marker on center */}
                            {isSelected && (
                              <>
                                <Circle cx={poly.labelX} cy={poly.labelY - 14} r={5} fill="#FFFFFF" />
                                <Circle cx={poly.labelX} cy={poly.labelY - 14} r={9} stroke="#FFFFFF88" strokeWidth={1.5} fill="none" />
                              </>
                            )}
                          </G>
                        );
                      })}
                    </Svg>
                  </View>

                  {/* Legend Bar */}
                  <View style={styles.mapLegendRow}>
                    {mapHeatMode === 'party' ? (
                      <>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#0D6338' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">APC</ThemedText>
                        </View>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">PDP</ThemedText>
                        </View>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">LP</ThemedText>
                        </View>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">NNPP</ThemedText>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">90%+ (Hot)</ThemedText>
                        </View>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#EA580C' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">80-90%</ThemedText>
                        </View>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">65-80%</ThemedText>
                        </View>
                        <View style={styles.legendPill}>
                          <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">&lt;65%</ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                </Card>

                {/* Interactive Selected LGA Tactical Focus Card */}
                {selectedMapLga && (
                  <Card style={[styles.selectedLgaCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                    <View style={styles.selectedLgaHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={styles.liveDot} />
                          <ThemedText variant="label" color="primary" fontFamily="bold">
                            MAP SELECTION · {selectedMapLga.name.toUpperCase()}
                          </ThemedText>
                        </View>
                        <ThemedText variant="body" color="text" fontFamily="bold" style={{ marginTop: 2 }}>
                          {selectedMapLga.name} ({selectedMapLga.state} State)
                        </ThemedText>
                        <ThemedText variant="caption" color="textSecondary">
                          {selectedMapLga.baseCollated} of {selectedMapLga.totalPus} PUs collated ({selectedMapLga.reportingPct}%)
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.partyPill,
                          {
                            backgroundColor:
                              selectedMapLga.leadingParty === 'APC'
                                ? '#0D6338'
                                : selectedMapLga.leadingParty === 'PDP'
                                ? '#DC2626'
                                : selectedMapLga.leadingParty === 'LP'
                                ? '#16A34A'
                                : '#2563EB',
                          },
                        ]}
                      >
                        <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                          {selectedMapLga.leadingParty} LEAD
                        </ThemedText>
                      </View>
                    </View>

                    <View style={[styles.leadBanner, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginTop: spacing.xs }]}>
                      <View style={{ flex: 1 }}>
                        <ThemedText variant="caption" color="text" fontFamily="bold">
                          {selectedMapLga.leadingCandidate}
                        </ThemedText>
                        <ThemedText variant="label" color="textSecondary">
                          {selectedMapLga.totalVotes.toLocaleString()} ballots cast · +{selectedMapLga.margin}% margin
                        </ThemedText>
                      </View>
                      <Button
                        label="Inspect PUs"
                        size="sm"
                        variant="primary"
                        rightIcon="chevron-forward"
                        onPress={() => {
                          impact(Haptics.ImpactFeedbackStyle.Medium);
                          setFilterLga(selectedMapLga.name.replace(' LGA', ''));
                          setViewMode('returns');
                        }}
                      />
                    </View>
                  </Card>
                )}

                {/* Section Title for LGA Breakdown */}
                <View style={{ marginTop: spacing.xs }}>
                  <ThemedText variant="title" color="text" fontFamily="bold">
                    LGA Collation Breakdown
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Filter by party lead or tap any return to audit certified returns
                  </ThemedText>
                </View>

                {/* Party Filter Chips */}
                <View style={styles.partyFilterRow}>
                  {(['ALL', 'APC', 'PDP', 'LP', 'NNPP'] as const).map((party) => {
                    const isSelected = partyFilter === party;
                    const pColors: Record<string, string> = {
                      APC: '#0D6338',
                      PDP: '#DC2626',
                      LP: '#16A34A',
                      NNPP: '#2563EB',
                      ALL: colors.text,
                    };
                    const color = pColors[party] ?? colors.text;

                    return (
                      <Pressable
                        key={party}
                        onPress={() => {
                          impact(Haptics.ImpactFeedbackStyle.Light);
                          setPartyFilter(party);
                        }}
                        style={[
                          styles.partyFilterChip,
                          {
                            backgroundColor: isSelected ? color : colors.surfaceElevated,
                            borderColor: isSelected ? color : colors.border,
                          },
                        ]}
                      >
                        <ThemedText
                          variant="caption"
                          color={isSelected ? '#FFFFFF' : 'textSecondary'}
                          fontFamily={isSelected ? 'bold' : 'medium'}
                        >
                          {party === 'ALL' ? 'All Leads' : party}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const partyColors: Record<string, string> = {
                APC: '#0D6338',
                PDP: '#DC2626',
                LP: '#16A34A',
                NNPP: '#2563EB',
              };
              const leadColor = partyColors[item.leadingParty] ?? colors.primary;

              return (
                <Card style={[styles.lgaCard, { borderColor: colors.border }]}>
                  {/* Top: LGA Name & Reporting Badge */}
                  <View style={styles.lgaHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText variant="body" color="text" fontFamily="bold">
                        {item.name}
                      </ThemedText>
                      <ThemedText variant="caption" color="textSecondary">
                        {item.state} State · {item.baseCollated} of {item.totalPus} PUs collated
                      </ThemedText>
                    </View>

                    <View style={[styles.reportingBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <Ionicons name="pie-chart-outline" size={12} color={colors.primary} />
                      <ThemedText variant="label" color="primary" fontFamily="bold" style={{ marginLeft: 4 }}>
                        {item.reportingPct}%
                      </ThemedText>
                    </View>
                  </View>

                  {/* Leading Party Banner Strip */}
                  <View
                    style={[
                      styles.leadBanner,
                      {
                        backgroundColor: leadColor + '14',
                        borderColor: leadColor + '44',
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.partyPill, { backgroundColor: leadColor }]}>
                        <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                          {item.leadingParty}
                        </ThemedText>
                      </View>
                      <View>
                        <ThemedText variant="caption" color="text" fontFamily="bold">
                          {item.leadingCandidate}
                        </ThemedText>
                        <ThemedText variant="label" color="textSecondary">
                          Leading with {item.leadingPct}%
                        </ThemedText>
                      </View>
                    </View>

                    <View style={[styles.marginBadge, { backgroundColor: leadColor + '22' }]}>
                      <ThemedText variant="caption" style={{ color: leadColor }} fontFamily="bold">
                        +{item.margin}% margin
                      </ThemedText>
                    </View>
                  </View>

                  {/* Stacked Collation Progress Bar */}
                  <View style={styles.stackedBarContainer}>
                    <View style={styles.stackedBar}>
                      {item.shares.map((share) => (
                        <View
                          key={share.party}
                          style={{
                            width: `${Math.min(100, Math.max(0, share.pct))}%` as `${number}%`,
                            height: '100%',
                            backgroundColor: partyColors[share.party] ?? colors.border,
                          }}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Share breakdown legends */}
                  <View style={styles.shareLegendsRow}>
                    {item.shares.map((share) => (
                      <View key={share.party} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: partyColors[share.party] }]} />
                        <ThemedText variant="label" color="textSecondary" fontFamily="bold">
                          {share.party}: {share.pct.toFixed(0)}%
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Inspect LGA PU returns button */}
                  <Pressable
                    onPress={() => {
                      impact(Haptics.ImpactFeedbackStyle.Light);
                      setFilterLga(item.name.replace(' LGA', ''));
                      setViewMode('returns');
                    }}
                    style={[styles.inspectButton, { borderColor: colors.borderSubtle }]}
                  >
                    <ThemedText variant="caption" color="primary" fontFamily="bold">
                      View PU Returns in {item.name}
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </Pressable>
                </Card>
              );
            }}
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
  topControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
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
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 110,
  },
  itemCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  leadStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  mainViewSwitcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    padding: 3,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  mainViewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  progressCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pctPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusBarTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  partyFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  partyFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  lgaCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  lgaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  leadBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  partyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  marginBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  stackedBarContainer: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  stackedBar: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  shareLegendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inspectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    marginTop: 2,
  },
  mapContainerCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  satelliteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  mapModeSwitcher: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  mapModeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  activeMapModeBtn: {
    ...shadows.sm,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#040B07',
  },
  mapLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF12',
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedLgaCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  selectedLgaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
});
