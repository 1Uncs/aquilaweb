import React, { useState, useMemo, useCallback, memo } from 'react';
import { StyleSheet, View, Pressable, FlatList, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, EmptyState, Button, SkeletonCard } from '@/core/components';
import { ROUTES } from '@/constants/routes';
import { spacing, radius, shadows } from '@/constants/tokens';
import { listPerf } from '@/constants/lists';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import { useResultsQuery, useCandidatesQuery } from '@/features/elections/hooks';
import { useRefreshControl, useForegroundRefresh, useHaptics } from '@/core/hooks';
import Colors from '@/constants/colors';
import { useResultsStore, useAuthStore, ResultSubmission, Candidate } from '@/features/auth/store';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path, G, Circle, Rect, Text as SvgText } from 'react-native-svg';

const LGA_MAP_POLYGONS: Record<string, { path: string; labelX: number; labelY: number; label: string }> = {
  // Lagos LGAs (Scoped to 380x250 viewport)
  'lga-alimosho': {
    path: 'M 30 45 L 125 35 L 135 110 L 70 130 L 25 95 Z',
    labelX: 75,
    labelY: 80,
    label: 'Alimosho',
  },
  'lga-ikeja': {
    path: 'M 125 35 L 220 30 L 225 100 L 135 110 Z',
    labelX: 172,
    labelY: 65,
    label: 'Ikeja',
  },
  'lga-kosofe': {
    path: 'M 220 30 L 345 25 L 355 105 L 225 100 Z',
    labelX: 285,
    labelY: 62,
    label: 'Kosofe',
  },
  'lga-mainland': {
    path: 'M 135 110 L 225 100 L 230 160 L 150 170 Z',
    labelX: 180,
    labelY: 132,
    label: 'Mainland',
  },
  'lga-surulere': {
    path: 'M 70 130 L 150 170 L 135 210 L 55 180 Z',
    labelX: 102,
    labelY: 170,
    label: 'Surulere',
  },
  'lga-etiosa': {
    path: 'M 150 170 L 230 160 L 360 145 L 355 195 L 240 205 L 135 210 Z',
    labelX: 250,
    labelY: 178,
    label: 'Eti-Osa',
  },
  // Kano LGAs (Scoped to 380x250 viewport)
  'lga-fagge': {
    path: 'M 40 40 L 195 40 L 180 128 L 40 128 Z',
    labelX: 115,
    labelY: 82,
    label: 'Fagge',
  },
  'lga-tarauni': {
    path: 'M 195 40 L 340 40 L 340 128 L 180 128 Z',
    labelX: 260,
    labelY: 82,
    label: 'Tarauni',
  },
  'lga-nassarawa-kn': {
    path: 'M 40 128 L 340 128 L 320 215 L 60 215 Z',
    labelX: 190,
    labelY: 170,
    label: 'Nassarawa',
  },
  // Rivers LGAs (Scoped to 380x250 viewport)
  'lga-obio-akpor': {
    path: 'M 45 45 L 335 45 L 335 125 L 45 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Obio-Akpor',
  },
  'lga-phalga': {
    path: 'M 45 125 L 335 125 L 310 210 L 70 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Port Harcourt',
  },
  // FCT Councils (Scoped to 380x250 viewport)
  'lga-bwari': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Bwari',
  },
  'lga-amac': {
    path: 'M 70 125 L 310 125 L 285 210 L 95 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'AMAC',
  },
  // Kaduna LGAs (Scoped to 380x250 viewport)
  'lga-kaduna-north': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Kaduna North',
  },
  'lga-kaduna-south': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Kaduna South',
  },
  // Oyo LGAs (Scoped to 380x250 viewport)
  'lga-ibadan-north': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Ibadan North',
  },
  'lga-ibadan-sw': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Ibadan South-West',
  },
  // Enugu LGAs (Scoped to 380x250 viewport)
  'lga-nsukka': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Nsukka',
  },
  'lga-enugu-north': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Enugu North',
  },
  // Borno LGAs (Scoped to 380x250 viewport)
  'lga-maiduguri': {
    path: 'M 50 45 L 330 45 L 310 125 L 70 125 Z',
    labelX: 190,
    labelY: 82,
    label: 'Maiduguri',
  },
  'lga-jere': {
    path: 'M 70 125 L 310 125 L 290 210 L 90 210 Z',
    labelX: 190,
    labelY: 168,
    label: 'Jere',
  },
};

const STATE_MAP_POLYGONS: Record<string, {
  path: string;
  labelX: number;
  labelY: number;
  name: string;
  code: string;
  zone: string;
}> = {
  'state-kano': {
    path: 'M 180 38 L 240 32 L 252 74 L 202 82 L 180 62 Z',
    labelX: 212,
    labelY: 56,
    name: 'Kano',
    code: 'KAN',
    zone: 'North West',
  },
  'state-kaduna': {
    path: 'M 148 76 L 202 82 L 210 122 L 154 118 Z',
    labelX: 178,
    labelY: 98,
    name: 'Kaduna',
    code: 'KAD',
    zone: 'North West',
  },
  'state-fct': {
    path: 'M 168 122 L 204 122 L 208 148 L 170 150 Z',
    labelX: 187,
    labelY: 135,
    name: 'FCT',
    code: 'FCT',
    zone: 'North Central',
  },
  'state-oyo': {
    path: 'M 54 142 L 102 138 L 108 178 L 62 182 Z',
    labelX: 80,
    labelY: 158,
    name: 'Oyo',
    code: 'OYO',
    zone: 'South West',
  },
  'state-lagos': {
    path: 'M 58 184 L 120 180 L 122 206 L 54 206 Z',
    labelX: 86,
    labelY: 195,
    name: 'Lagos',
    code: 'LOS',
    zone: 'South West',
  },
  'state-rivers': {
    path: 'M 184 192 L 230 190 L 236 222 L 182 221 Z',
    labelX: 208,
    labelY: 206,
    name: 'Rivers',
    code: 'RIV',
    zone: 'South South',
  },
  'state-enugu': {
    path: 'M 208 152 L 248 150 L 252 186 L 210 188 Z',
    labelX: 228,
    labelY: 168,
    name: 'Enugu',
    code: 'ENU',
    zone: 'South East',
  },
  'state-borno': {
    path: 'M 268 42 L 334 52 L 322 105 L 264 92 Z',
    labelX: 296,
    labelY: 72,
    name: 'Borno',
    code: 'BOR',
    zone: 'North East',
  },
};

export type LgaCollation = {
  id: string;
  name: string;
  state: string;
  totalPus: number;
  baseCollated: number;
  totalVotes: number;
  reportingPct: number;
  leadingParty: 'APC' | 'PDP' | 'LP' | 'NNPP';
  leadingCandidate: string;
  leadingPct: string;
  margin: string;
  shares: Array<{ party: 'APC' | 'PDP' | 'LP' | 'NNPP'; votes: number; pct: number }>;
};

export type StateCollation = {
  id: string;
  name: string;
  zone: string;
  code: string;
  lgaCount: number;
  totalPus: number;
  baseCollated: number;
  totalVotes: number;
  reportingPct: number;
  leadingParty: 'APC' | 'PDP' | 'LP' | 'NNPP';
  leadingCandidate: string;
  leadingPct: string;
  margin: string;
  shares: Array<{ party: 'APC' | 'PDP' | 'LP' | 'NNPP'; votes: number; pct: number }>;
};

type ReturnCardProps = {
  item: ResultSubmission;
  candMap: Map<string, Candidate>;
  colors: (typeof Colors)['light'];
  impact: ReturnType<typeof useHaptics>['impact'];
};

// Memoized row: FlatList re-renders every row on each parent render unless
// rows are memo/Pure (VirtualizedList slow-update warning).
const ReturnCard = memo(function ReturnCard({ item, candMap, colors, impact }: ReturnCardProps) {
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
        <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
          <ThemedText variant="body" color="text" fontFamily="bold" numberOfLines={2}>
            {item.pollingUnitName}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" numberOfLines={2}>
            {isPublished ? 'Official Return' : 'Draft Return'} · {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>

        <View
          style={[
            styles.statusChip,
            {
              backgroundColor: isPublished ? colors.successSubtle : colors.warningSubtle,
              borderColor: isPublished ? colors.success : colors.warning,
              flexShrink: 0,
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
            numberOfLines={1}
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
        <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
          <ThemedText variant="label" color="textMuted">LEADING CANDIDATE</ThemedText>
          <ThemedText variant="body" color="text" fontFamily="bold" numberOfLines={2}>
            {leadCand?.fullName ?? (topCandId ? `Candidate ${topCandId}` : 'Awaiting breakdown')}
          </ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <ThemedText variant="title" color="primary" fontFamily="bold" numberOfLines={1}>
            {topCandVotes.toLocaleString()}
          </ThemedText>
          <ThemedText variant="label" color="textSecondary" numberOfLines={1}>
            {leadPct}% of cast ballots
          </ThemedText>
        </View>
      </View>

      {/* Bottom Accreditation & Ballot summary bar */}
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
});

const PARTY_COLORS: Record<string, string> = {
  APC: '#0D6338',
  PDP: '#DC2626',
  LP: '#16A34A',
  NNPP: '#2563EB',
};

type CollationLeaderboardRowProps = {
  rank: number;
  name: string;
  subTitle: string;
  zoneOrState?: string;
  reportingPct: number;
  leadingParty: 'APC' | 'PDP' | 'LP' | 'NNPP';
  leadingCandidate: string;
  margin: string;
  shares: Array<{ party: 'APC' | 'PDP' | 'LP' | 'NNPP'; votes: number; pct: number }>;
  isSelected: boolean;
  colors: (typeof Colors)['light'];
  onPress: () => void;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
};

const CollationLeaderboardRow = memo(function CollationLeaderboardRow({
  rank,
  name,
  subTitle,
  zoneOrState,
  reportingPct,
  leadingParty,
  leadingCandidate,
  margin,
  shares,
  isSelected,
  colors,
  onPress,
  onAction,
  actionIcon = 'chevron-forward',
}: CollationLeaderboardRowProps) {
  const leadColor = PARTY_COLORS[leadingParty] ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.leaderboardRow,
        {
          backgroundColor: isSelected ? colors.surfaceElevated : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
    >
      {/* Rank Indicator */}
      <View style={[styles.rowRankBox, { backgroundColor: isSelected ? colors.primary : colors.borderSubtle }]}>
        <ThemedText variant="label" color={isSelected ? '#FFFFFF' : 'textSecondary'} fontFamily="bold">
          #{rank}
        </ThemedText>
      </View>

      {/* Main Info */}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        {/* Row 1: Name + Zone/State tag + Margin */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <ThemedText variant="body" color="text" fontFamily="bold" numberOfLines={1}>
            {name}
          </ThemedText>
          {zoneOrState && (
            <View style={[styles.zoneBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
              <ThemedText variant="label" color="textSecondary" fontFamily="bold">
                {zoneOrState}
              </ThemedText>
            </View>
          )}
          <View style={[styles.marginBadge, { backgroundColor: leadColor + '18', paddingVertical: 1, paddingHorizontal: 6 }]}>
            <ThemedText variant="label" style={{ color: leadColor }} fontFamily="bold">
              +{margin}%
            </ThemedText>
          </View>
        </View>

        {/* Row 2: Candidate + Party pill + Subtitle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.partyPill, { backgroundColor: leadColor, paddingVertical: 1, paddingHorizontal: 6 }]}>
            <ThemedText variant="label" color="#FFFFFF" fontFamily="bold">
              {leadingParty}
            </ThemedText>
          </View>
          <ThemedText variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
            {leadingCandidate} · {subTitle}
          </ThemedText>
        </View>

        {/* Row 3: Mini proportional share bar */}
        <View style={[styles.miniStackedBar, { backgroundColor: colors.borderSubtle }]}>
          {shares.map((s) => (
            <View
              key={s.party}
              style={{
                width: `${Math.min(100, Math.max(0, s.pct))}%` as `${number}%`,
                height: '100%',
                backgroundColor: PARTY_COLORS[s.party] ?? colors.border,
              }}
            />
          ))}
        </View>
      </View>

      {/* Right: Reporting Badge & Action */}
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 6, flexShrink: 0 }}>
        <View style={[styles.rowReportingBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ThemedText variant="label" color="primary" fontFamily="bold">
            {reportingPct}% PUs
          </ThemedText>
        </View>
        {onAction && (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            style={styles.rowActionBtn}
          >
            <Ionicons name={actionIcon} size={15} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

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

  const renderResultItem = useCallback(({ item }: { item: ResultSubmission }) => (
    <ReturnCard item={item} candMap={candMap} colors={colors} impact={impact} />
  ), [candMap, colors, impact]);

  // View Mode: 'returns' vs 'heatmap'
  const [viewMode, setViewMode] = useState<'returns' | 'heatmap'>('returns');
  // Geography Level: 'state' aggregates LGAs by state, 'lga' shows LGA detail.
  // LGA rows are the source of truth (inline collation bases + live submissions);
  // state rows are derived by summing their LGAs, so the two levels always agree.
  const [geoLevel, setGeoLevel] = useState<'state' | 'lga'>('lga');
  const [filterLga, setFilterLga] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string | null>(null);
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
      // ---- Mock expansion states: illustrative demo figures only, not real results ----
      {
        id: 'lga-fagge',
        name: 'Fagge LGA',
        state: 'Kano',
        totalPus: 320,
        baseCollated: 292,
        baseVotes: { APC: 18400, PDP: 9600, LP: 3100, NNPP: 58700 },
      },
      {
        id: 'lga-tarauni',
        name: 'Tarauni LGA',
        state: 'Kano',
        totalPus: 280,
        baseCollated: 241,
        baseVotes: { APC: 15200, PDP: 8100, LP: 2600, NNPP: 46300 },
      },
      {
        id: 'lga-nassarawa-kn',
        name: 'Nassarawa LGA',
        state: 'Kano',
        totalPus: 350,
        baseCollated: 305,
        baseVotes: { APC: 22100, PDP: 11400, LP: 3900, NNPP: 54200 },
      },
      {
        id: 'lga-obio-akpor',
        name: 'Obio-Akpor LGA',
        state: 'Rivers',
        totalPus: 420,
        baseCollated: 381,
        baseVotes: { APC: 19800, PDP: 47200, LP: 24600, NNPP: 1800 },
      },
      {
        id: 'lga-phalga',
        name: 'Port Harcourt LGA',
        state: 'Rivers',
        totalPus: 300,
        baseCollated: 256,
        baseVotes: { APC: 16400, PDP: 28900, LP: 24700, NNPP: 1400 },
      },
      {
        id: 'lga-amac',
        name: 'AMAC Area Council',
        state: 'FCT',
        totalPus: 380,
        baseCollated: 342,
        baseVotes: { APC: 18900, PDP: 21700, LP: 51400, NNPP: 2300 },
      },
      {
        id: 'lga-bwari',
        name: 'Bwari Area Council',
        state: 'FCT',
        totalPus: 220,
        baseCollated: 186,
        baseVotes: { APC: 9800, PDP: 11200, LP: 28600, NNPP: 1100 },
      },
      {
        id: 'lga-kaduna-north',
        name: 'Kaduna North LGA',
        state: 'Kaduna',
        totalPus: 340,
        baseCollated: 295,
        baseVotes: { APC: 38200, PDP: 29400, LP: 12100, NNPP: 11200 },
      },
      {
        id: 'lga-kaduna-south',
        name: 'Kaduna South LGA',
        state: 'Kaduna',
        totalPus: 310,
        baseCollated: 260,
        baseVotes: { APC: 31500, PDP: 33800, LP: 15400, NNPP: 8900 },
      },
      {
        id: 'lga-ibadan-north',
        name: 'Ibadan North LGA',
        state: 'Oyo',
        totalPus: 410,
        baseCollated: 375,
        baseVotes: { APC: 39100, PDP: 36200, LP: 18700, NNPP: 2400 },
      },
      {
        id: 'lga-ibadan-sw',
        name: 'Ibadan South-West LGA',
        state: 'Oyo',
        totalPus: 360,
        baseCollated: 318,
        baseVotes: { APC: 34800, PDP: 31200, LP: 16900, NNPP: 1900 },
      },
      {
        id: 'lga-enugu-north',
        name: 'Enugu North LGA',
        state: 'Enugu',
        totalPus: 290,
        baseCollated: 270,
        baseVotes: { APC: 4200, PDP: 12800, LP: 58400, NNPP: 800 },
      },
      {
        id: 'lga-nsukka',
        name: 'Nsukka LGA',
        state: 'Enugu',
        totalPus: 320,
        baseCollated: 285,
        baseVotes: { APC: 5100, PDP: 14200, LP: 61200, NNPP: 950 },
      },
      {
        id: 'lga-maiduguri',
        name: 'Maiduguri LGA',
        state: 'Borno',
        totalPus: 380,
        baseCollated: 340,
        baseVotes: { APC: 54200, PDP: 19800, LP: 4100, NNPP: 8300 },
      },
      {
        id: 'lga-jere',
        name: 'Jere LGA',
        state: 'Borno',
        totalPus: 290,
        baseCollated: 245,
        baseVotes: { APC: 41800, PDP: 16200, LP: 3200, NNPP: 6400 },
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
    let list = lgaHeatmapData;
    if (filterState) {
      list = list.filter((l) => l.state.toLowerCase() === filterState.toLowerCase());
    }
    if (partyFilter !== 'ALL') {
      list = list.filter((l) => l.leadingParty === partyFilter);
    }
    return list;
  }, [lgaHeatmapData, filterState, partyFilter]);

  // State aggregation: derived from LGA rows (source of truth), grouped by state.
  const stateHeatmapData: StateCollation[] = useMemo(() => {
    const STATE_ZONES: Record<string, { zone: string; code: string }> = {
      Lagos: { zone: 'South West', code: 'LOS' },
      Kano: { zone: 'North West', code: 'KAN' },
      Rivers: { zone: 'South South', code: 'RIV' },
      FCT: { zone: 'North Central', code: 'FCT' },
      Kaduna: { zone: 'North West', code: 'KAD' },
      Oyo: { zone: 'South West', code: 'OYO' },
      Enugu: { zone: 'South East', code: 'ENU' },
      Borno: { zone: 'North East', code: 'BOR' },
    };

    const candidateNames: Record<string, string> = {
      APC: 'Bola Ahmed Tinubu',
      PDP: 'Atiku Abubakar',
      LP: 'Peter Obi',
      NNPP: 'Rabiu Kwankwaso',
    };

    const byState = new Map<string, { totalPus: number; baseCollated: number; votes: Record<'APC' | 'PDP' | 'LP' | 'NNPP', number>; lgaCount: number }>();
    lgaHeatmapData.forEach((lga) => {
      const entry = byState.get(lga.state) ?? { totalPus: 0, baseCollated: 0, votes: { APC: 0, PDP: 0, LP: 0, NNPP: 0 }, lgaCount: 0 };
      entry.totalPus += lga.totalPus;
      entry.baseCollated += lga.baseCollated;
      (Object.keys(entry.votes) as Array<'APC' | 'PDP' | 'LP' | 'NNPP'>).forEach((p) => {
        const share = lga.shares.find((s) => s.party === p);
        entry.votes[p] += share?.votes ?? 0;
      });
      entry.lgaCount += 1;
      byState.set(lga.state, entry);
    });

    return [...byState.entries()].map(([state, entry]) => {
      const totalVotes = entry.votes.APC + entry.votes.PDP + entry.votes.LP + entry.votes.NNPP;
      const shares = (Object.entries(entry.votes) as Array<[StateCollation['leadingParty'], number]>)
        .map(([party, votes]) => ({ party, votes, pct: totalVotes > 0 ? (votes / totalVotes) * 100 : 0 }))
        .sort((a, b) => b.votes - a.votes);
      const leader = shares[0]!;
      const runnerUp = shares[1]!;
      const meta = STATE_ZONES[state] ?? { zone: 'Federation Zone', code: state.substring(0, 3).toUpperCase() };
      return {
        id: `state-${state.toLowerCase().replace(/\s+/g, '-')}`,
        name: state,
        zone: meta.zone,
        code: meta.code,
        lgaCount: entry.lgaCount,
        totalPus: entry.totalPus,
        baseCollated: entry.baseCollated,
        totalVotes,
        reportingPct: entry.totalPus > 0 ? Number(Math.min(100, (entry.baseCollated / entry.totalPus) * 100).toFixed(0)) : 0,
        leadingParty: leader.party,
        leadingCandidate: candidateNames[leader.party] ?? leader.party,
        leadingPct: leader.pct.toFixed(1),
        margin: (leader.pct - runnerUp.pct).toFixed(1),
        shares,
      };
    });
  }, [lgaHeatmapData]);

  const filteredStates = useMemo(() => {
    if (partyFilter === 'ALL') return stateHeatmapData;
    return stateHeatmapData.filter((s) => s.leadingParty === partyFilter);
  }, [stateHeatmapData, partyFilter]);

  const totalCollatedAcrossLgas = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.baseCollated, 0);
  }, [lgaHeatmapData]);

  const totalPusAcrossLgas = useMemo(() => {
    return lgaHeatmapData.reduce((acc, l) => acc + l.totalPus, 0);
  }, [lgaHeatmapData]);

  const overallReportingPct = ((totalCollatedAcrossLgas / totalPusAcrossLgas) * 100).toFixed(1);

  // Distinct states present in the current LGA base set (drives map header scope).
  const statesInView = useMemo(() => {
    return [...new Set(lgaHeatmapData.map((l) => l.state))];
  }, [lgaHeatmapData]);

  // Geographic SVG Map State
  const [selectedMapLgaId, setSelectedMapLgaId] = useState<string>('lga-ikeja');
  const [selectedMapStateId, setSelectedMapStateId] = useState<string>('state-lagos');
  const [mapHeatMode, setMapHeatMode] = useState<'party' | 'density'>('party');
  const [activeLgaState, setActiveLgaState] = useState<string>('Lagos');

  const effectiveLgaState = filterState ?? activeLgaState;

  const mapLgas = useMemo(() => {
    return lgaHeatmapData.filter((l) => l.state.toLowerCase() === effectiveLgaState.toLowerCase());
  }, [lgaHeatmapData, effectiveLgaState]);

  const selectedMapLga = useMemo(() => {
    return lgaHeatmapData.find((l) => l.id === selectedMapLgaId) ?? mapLgas[0] ?? lgaHeatmapData[0]!;
  }, [lgaHeatmapData, selectedMapLgaId, mapLgas]);

  const selectedMapState = useMemo(() => {
    return stateHeatmapData.find((s) => s.id === selectedMapStateId) ?? stateHeatmapData[0]!;
  }, [stateHeatmapData, selectedMapStateId]);

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

  const getLgaFillColor = useCallback((lga: { reportingPct: number; leadingParty: string }) => {
    if (mapHeatMode === 'density') {
      if (lga.reportingPct >= 90) return '#DC2626'; // High reporting heat
      if (lga.reportingPct >= 80) return '#EA580C'; // Medium-high
      if (lga.reportingPct >= 65) return '#D97706'; // Medium
      return '#16A34A'; // Initial
    }
    return PARTY_COLORS[lga.leadingParty] ?? '#0D6338';
  }, [mapHeatMode]);

  const handleInspectLga = useCallback((lgaName: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setFilterLga(lgaName.replace(' LGA', ''));
    setViewMode('returns');
  }, [impact]);

  const handleDrillToState = useCallback((stateName: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setActiveLgaState(stateName);
    setFilterState(stateName);
    const firstLga = lgaHeatmapData.find((l) => l.state.toLowerCase() === stateName.toLowerCase());
    if (firstLga) setSelectedMapLgaId(firstLga.id);
    setGeoLevel('lga');
  }, [impact, lgaHeatmapData]);

  const handleFocusMapState = useCallback((stateId: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMapStateId(stateId);
  }, [impact]);

  const renderGeoItem = useCallback(
    ({ item, index }: { item: LgaCollation | StateCollation; index: number }) => {
      if (geoLevel === 'state') {
        const st = item as StateCollation;
        const isSelected = selectedMapStateId === st.id;
        return (
          <CollationLeaderboardRow
            rank={index + 1}
            name={`${st.name} State`}
            subTitle={`${st.totalVotes.toLocaleString()} votes`}
            zoneOrState={st.zone}
            reportingPct={st.reportingPct}
            leadingParty={st.leadingParty}
            leadingCandidate={st.leadingCandidate}
            margin={st.margin}
            shares={st.shares}
            isSelected={isSelected}
            colors={colors}
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Light);
              handleFocusMapState(st.id);
            }}
            onAction={() => handleDrillToState(st.name)}
            actionIcon="chevron-forward"
          />
        );
      }
      const lga = item as LgaCollation;
      const isSelected = selectedMapLgaId === lga.id;
      return (
        <CollationLeaderboardRow
          rank={index + 1}
          name={lga.name}
          subTitle={`${lga.baseCollated} of ${lga.totalPus} PUs`}
          zoneOrState={lga.state}
          reportingPct={lga.reportingPct}
          leadingParty={lga.leadingParty}
          leadingCandidate={lga.leadingCandidate}
          margin={lga.margin}
          shares={lga.shares}
          isSelected={isSelected}
          colors={colors}
          onPress={() => {
            impact(Haptics.ImpactFeedbackStyle.Light);
            setSelectedMapLgaId(lga.id);
          }}
          onAction={() => handleInspectLga(lga.name)}
          actionIcon="arrow-forward"
        />
      );
    },
    [geoLevel, selectedMapStateId, selectedMapLgaId, colors, impact, handleFocusMapState, handleDrillToState, handleInspectLga]
  );

  return (
    <ScreenView scrollable={false} noScrollPadding>
      <View style={styles.container}>
        {/* Top Control Bar */}
        <View style={styles.topControlBar}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
            <ThemedText variant="title" color="text" fontFamily="bold" numberOfLines={1}>
              Election Results
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
              {viewMode === 'returns'
                ? `Total ${totalVotes.toLocaleString()} votes across ${publishedResults.length} PUs`
                : `${overallReportingPct}% of collation centers reporting`}
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
            <View style={styles.tabBtnContent}>
              <Ionicons
                name="list-outline"
                size={14}
                color={viewMode === 'returns' ? '#FFFFFF' : colors.textSecondary}
              />
              <ThemedText
                variant="caption"
                color={viewMode === 'returns' ? '#FFFFFF' : 'textSecondary'}
                fontFamily={viewMode === 'returns' ? 'bold' : 'medium'}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                PU Returns ({publishedResults.length})
              </ThemedText>
            </View>
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
            <View style={styles.tabBtnContent}>
              <Ionicons
                name="map-outline"
                size={14}
                color={viewMode === 'heatmap' ? '#FFFFFF' : colors.textSecondary}
              />
              <ThemedText
                variant="caption"
                color={viewMode === 'heatmap' ? '#FFFFFF' : 'textSecondary'}
                fontFamily={viewMode === 'heatmap' ? 'bold' : 'medium'}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Heat Map ({geoLevel === 'state' ? `${stateHeatmapData.length} States` : `${lgaHeatmapData.length} LGAs`})
              </ThemedText>
            </View>
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
              {...listPerf}
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
            {...listPerf}
            data={geoLevel === 'state' ? filteredStates : filteredLgas}
            keyExtractor={(item) => item.id}
            refreshControl={refreshControl}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListHeaderComponent={
              <View style={{ marginBottom: spacing.sm, gap: spacing.sm }}>
                {/* Unified Tactical Control Bar */}
                <View style={[styles.unifiedHeaderBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  {/* Segmented Geo Level Pills */}
                  <View style={[styles.pillTrack, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setGeoLevel('state');
                      }}
                      style={[
                        styles.pillBtn,
                        geoLevel === 'state' && [styles.activePillBtn, { backgroundColor: colors.primary }],
                      ]}
                      accessibilityLabel="Show state-level collation"
                    >
                      <Ionicons
                        name="globe-outline"
                        size={13}
                        color={geoLevel === 'state' ? '#FFFFFF' : colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <ThemedText
                        variant="caption"
                        color={geoLevel === 'state' ? '#FFFFFF' : 'textSecondary'}
                        fontFamily="bold"
                      >
                        States ({stateHeatmapData.length})
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setGeoLevel('lga');
                      }}
                      style={[
                        styles.pillBtn,
                        geoLevel === 'lga' && [styles.activePillBtn, { backgroundColor: colors.primary }],
                      ]}
                      accessibilityLabel="Show LGA-level collation"
                    >
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={geoLevel === 'lga' ? '#FFFFFF' : colors.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                      <ThemedText
                        variant="caption"
                        color={geoLevel === 'lga' ? '#FFFFFF' : 'textSecondary'}
                        fontFamily="bold"
                      >
                        LGAs ({filteredLgas.length})
                      </ThemedText>
                    </Pressable>
                  </View>

                  {/* Segmented Map Heat Mode Pills */}
                  <View style={[styles.pillTrack, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setMapHeatMode('party');
                      }}
                      style={[
                        styles.pillBtn,
                        mapHeatMode === 'party' && [styles.activePillBtn, { backgroundColor: colors.primary }],
                      ]}
                      accessibilityLabel="Party lead mode"
                    >
                      <ThemedText
                        variant="caption"
                        color={mapHeatMode === 'party' ? '#FFFFFF' : 'textSecondary'}
                        fontFamily={mapHeatMode === 'party' ? 'bold' : 'medium'}
                      >
                        🎨 Lead
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setMapHeatMode('density');
                      }}
                      style={[
                        styles.pillBtn,
                        mapHeatMode === 'density' && [styles.activePillBtn, { backgroundColor: colors.primary }],
                      ]}
                      accessibilityLabel="Collation heat mode"
                    >
                      <ThemedText
                        variant="caption"
                        color={mapHeatMode === 'density' ? '#FFFFFF' : 'textSecondary'}
                        fontFamily={mapHeatMode === 'density' ? 'bold' : 'medium'}
                      >
                        🔥 Heat
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* State Scoping Selector for LGA View */}
                {geoLevel === 'lga' && (
                  <View style={styles.stateSelectorContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.stateSelectorScroll}
                    >
                      {statesInView.map((st) => {
                        const isSelected = effectiveLgaState.toLowerCase() === st.toLowerCase();
                        return (
                          <Pressable
                            key={st}
                            onPress={() => {
                              impact(Haptics.ImpactFeedbackStyle.Light);
                              setActiveLgaState(st);
                              setFilterState(st);
                              const firstLga = lgaHeatmapData.find((l) => l.state.toLowerCase() === st.toLowerCase());
                              if (firstLga) setSelectedMapLgaId(firstLga.id);
                            }}
                            style={[
                              styles.stateSelectorChip,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <ThemedText
                              variant="caption"
                              color={isSelected ? '#FFFFFF' : 'text'}
                              fontFamily={isSelected ? 'bold' : 'medium'}
                            >
                              {st}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                      {filterState && (
                        <Pressable
                          onPress={() => {
                            impact(Haptics.ImpactFeedbackStyle.Light);
                            setFilterState(null);
                          }}
                          style={[styles.stateSelectorChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        >
                          <Ionicons name="close-circle" size={13} color={colors.textSecondary} style={{ marginRight: 3 }} />
                          <ThemedText variant="caption" color="textSecondary" fontFamily="medium">
                            Clear Filter
                          </ThemedText>
                        </Pressable>
                      )}
                    </ScrollView>
                  </View>
                )}

                {/* Integrated Geographic Tactical Map Card */}
                <Card style={[styles.mapContainerCard, { backgroundColor: '#07120B', borderColor: colors.border }]}>
                  {/* Map Header with Integrated Collation Telemetry */}
                  <View style={styles.mapCardHeader}>
                    <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.liveDot} />
                        <ThemedText variant="caption" color="#A3E6C2" fontFamily="bold">
                          {geoLevel === 'state' ? 'FEDERAL PRESIDENTIAL COLLATION' : `${effectiveLgaState.toUpperCase()} DISTRICT COLLATION`}
                        </ThemedText>
                      </View>
                      <ThemedText variant="body" color="#FFFFFF" fontFamily="bold" numberOfLines={1}>
                        {geoLevel === 'state'
                          ? 'National Federation Tactical Map'
                          : `${effectiveLgaState} State LGA Collation Map`}
                      </ThemedText>
                      <ThemedText variant="label" color="#FFFFFF99" numberOfLines={1}>
                        {geoLevel === 'state'
                          ? `${stateHeatmapData.length} of 37 States · ${totalCollatedAcrossLgas.toLocaleString()} / ${totalPusAcrossLgas.toLocaleString()} PUs`
                          : `${mapLgas.length} Monitored LGAs · ${mapLgas.reduce((a, b) => a + b.baseCollated, 0)} of ${mapLgas.reduce((a, b) => a + b.totalPus, 0)} PUs collated`}
                      </ThemedText>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <View style={[styles.reportingPill, { backgroundColor: colors.primaryLight + '26', borderColor: colors.primaryLight + '44' }]}>
                        <ThemedText variant="caption" color="#34D399" fontFamily="bold">
                          {overallReportingPct}%
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={handleOpenSatelliteMap}
                        style={[styles.satelliteBtn, { backgroundColor: colors.surfaceElevated + '99', borderColor: '#FFFFFF22' }]}
                        accessibilityLabel="Open satellite map"
                      >
                        <Ionicons name="globe-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <ThemedText variant="label" color="#FFFFFF" fontFamily="bold">
                          Satellite
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  {/* Slim Collation Progress Track */}
                  <View style={[styles.statusBarTrack, { backgroundColor: '#FFFFFF12', marginVertical: 4 }]}>
                    <View
                      style={[
                        styles.statusBarFill,
                        { width: `${Math.min(100, Math.max(0, Number(overallReportingPct)))}%` as `${number}%`, backgroundColor: colors.primary },
                      ]}
                    />
                  </View>

                  {/* SVG Canvas */}
                  <View style={styles.svgWrapper}>
                    <Svg width="100%" height={240} viewBox="0 0 380 250">
                      {/* Background Water / Atlantic Ocean */}
                      <Path
                        d="M 0 215 Q 180 200 380 218 L 380 250 L 0 250 Z"
                        fill="#0284C722"
                      />
                      <SvgText x={190} y={242} fill="#38BDF866" fontSize="9" fontWeight="bold" textAnchor="middle">
                        GULF OF GUINEA · ATLANTIC OCEAN
                      </SvgText>

                      {/* Tactical Grid Crosshairs */}
                      <Path d="M 0 60 L 380 60" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 0 120 L 380 120" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 0 180 L 380 180" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 120 0 L 120 250" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />
                      <Path d="M 240 0 L 240 250" stroke="#FFFFFF08" strokeWidth="1" strokeDasharray="4,4" />

                      {geoLevel === 'lga' ? (
                        <G key="lga-layer">
                          {/* LGA Polygons for Current Active State */}
                          {mapLgas.map((lga) => {
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
                                {isSelected && (
                                  <Path
                                    d={poly.path}
                                    fill="none"
                                    stroke={colors.primaryLight}
                                    strokeWidth={5}
                                    strokeOpacity={0.6}
                                  />
                                )}
                                <Path
                                  d={poly.path}
                                  fill={fillColor}
                                  fillOpacity={isSelected ? 0.95 : 0.78}
                                  stroke={isSelected ? '#FFFFFF' : '#070C09'}
                                  strokeWidth={isSelected ? 2.5 : 1.5}
                                />
                                {/* Contrast Badge Plate behind text for crisp readability */}
                                <Rect
                                  x={poly.labelX - 44}
                                  y={poly.labelY - 14}
                                  width={88}
                                  height={28}
                                  rx={5}
                                  fill="#040B06DD"
                                  stroke={isSelected ? '#FDE047' : '#FFFFFF25'}
                                  strokeWidth={isSelected ? 1.5 : 0.8}
                                />
                                <SvgText
                                  x={poly.labelX}
                                  y={poly.labelY - 2}
                                  fill="#FFFFFF"
                                  fontSize="10"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {poly.label}
                                </SvgText>
                                <SvgText
                                  x={poly.labelX}
                                  y={poly.labelY + 9}
                                  fill={isSelected ? '#FDE047' : '#FFFFFFCC'}
                                  fontSize="8"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {mapHeatMode === 'party' ? `${lga.leadingParty} (${lga.leadingPct}%)` : `${lga.reportingPct}% PUs`}
                                </SvgText>
                                {isSelected && (
                                  <>
                                    <Circle cx={poly.labelX} cy={poly.labelY - 19} r={4.5} fill="#FFFFFF" />
                                    <Circle cx={poly.labelX} cy={poly.labelY - 19} r={8.5} stroke="#FFFFFF88" strokeWidth={1.5} fill="none" />
                                  </>
                                )}
                              </G>
                            );
                          })}
                        </G>
                      ) : (
                        <G key="state-layer">
                          {/* Nigeria Land Boundary Contour Silhouette */}
                          <Path
                            d="M 52 206 L 40 165 L 38 120 L 50 82 L 85 52 L 138 35 L 180 38 L 240 32 L 270 26 L 336 48 L 348 85 L 324 135 L 310 170 L 265 202 L 236 222 L 182 221 L 140 216 L 80 208 Z"
                            fill="#0B1A12"
                            stroke="#19482D"
                            strokeWidth={1.5}
                            strokeDasharray="4,2"
                          />

                          {/* Ambient Geopolitical Background Zones */}
                          {/* North West Ambient */}
                          <Path
                            d="M 85 52 L 180 38 L 180 62 L 148 76 L 95 95 Z"
                            fill="#0E281B"
                            stroke="#1B422D"
                            strokeWidth={1}
                            opacity={0.65}
                          />
                          <SvgText x={126} y={64} fill="#34D39944" fontSize="8" fontWeight="bold" textAnchor="middle">
                            NW ZONE
                          </SvgText>

                          {/* North East Ambient */}
                          <Path
                            d="M 240 32 L 270 26 L 268 42 L 264 92 L 210 122 Z"
                            fill="#0E281B"
                            stroke="#1B422D"
                            strokeWidth={1}
                            opacity={0.65}
                          />
                          <SvgText x={242} y={72} fill="#34D39944" fontSize="8" fontWeight="bold" textAnchor="middle">
                            NE ZONE
                          </SvgText>

                          {/* North Central / Middle Belt Ambient */}
                          <Path
                            d="M 95 95 L 148 76 L 168 122 L 102 138 Z"
                            fill="#0E281B"
                            stroke="#1B422D"
                            strokeWidth={1}
                            opacity={0.65}
                          />
                          <SvgText x={128} y={114} fill="#34D39944" fontSize="8" fontWeight="bold" textAnchor="middle">
                            NC ZONE
                          </SvgText>

                          {/* Benue / Plateau Ambient */}
                          <Path
                            d="M 206 150 L 264 92 L 310 135 L 252 152 Z"
                            fill="#0E281B"
                            stroke="#1B422D"
                            strokeWidth={1}
                            opacity={0.65}
                          />

                          {/* South South Ambient */}
                          <Path
                            d="M 115 180 L 184 192 L 182 221 L 122 206 Z"
                            fill="#0E281B"
                            stroke="#1B422D"
                            strokeWidth={1}
                            opacity={0.65}
                          />
                          <SvgText x={148} y={204} fill="#34D39944" fontSize="8" fontWeight="bold" textAnchor="middle">
                            SS ZONE
                          </SvgText>

                          {/* Iconic River Niger & River Benue Confluence */}
                          <Path
                            d="M 68 85 Q 115 110 172 144"
                            stroke="#38BDF866"
                            strokeWidth={2}
                            fill="none"
                          />
                          <Path
                            d="M 312 125 Q 245 138 172 144"
                            stroke="#38BDF866"
                            strokeWidth={2}
                            fill="none"
                          />
                          <Path
                            d="M 172 144 Q 182 178 190 220"
                            stroke="#38BDF888"
                            strokeWidth={2.5}
                            fill="none"
                          />
                          <SvgText x={112} y={112} fill="#38BDF855" fontSize="7" fontWeight="bold">
                            R. Niger
                          </SvgText>
                          <SvgText x={245} y={135} fill="#38BDF855" fontSize="7" fontWeight="bold">
                            R. Benue
                          </SvgText>
                          <Circle cx={172} cy={144} r={2.5} fill="#38BDF8" />

                          {/* Tactical Compass Telemetry */}
                          <SvgText x={358} y={18} fill="#34D399" fontSize="9" fontWeight="bold" textAnchor="middle">
                            ▲ N
                          </SvgText>
                          <SvgText x={358} y={28} fill="#34D39966" fontSize="7" textAnchor="middle">
                            09°04'N
                          </SvgText>

                          {/* Border Labels */}
                          <SvgText x={210} y={14} fill="#34D39944" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="2">
                            NIGER REPUBLIC
                          </SvgText>
                          <SvgText x={16} y={115} fill="#34D39944" fontSize="7" fontWeight="bold" textAnchor="middle">
                            BENIN
                          </SvgText>
                          <SvgText x={358} y={115} fill="#34D39944" fontSize="7" fontWeight="bold" textAnchor="middle">
                            CAMEROON
                          </SvgText>

                          {/* Reporting State Polygons */}
                          {stateHeatmapData.map((st) => {
                            const poly = STATE_MAP_POLYGONS[st.id];
                            if (!poly) return null;
                            const isSelected = selectedMapStateId === st.id;
                            const fill = getLgaFillColor(st);

                            return (
                              <G
                                key={st.id}
                                onPress={() => {
                                  impact(Haptics.ImpactFeedbackStyle.Light);
                                  setSelectedMapStateId(st.id);
                                }}
                              >
                                {isSelected && (
                                  <Path
                                    d={poly.path}
                                    fill="none"
                                    stroke={colors.primaryLight}
                                    strokeWidth={5}
                                    strokeOpacity={0.6}
                                  />
                                )}
                                <Path
                                  d={poly.path}
                                  fill={fill}
                                  fillOpacity={isSelected ? 0.95 : 0.78}
                                  stroke={isSelected ? '#FFFFFF' : '#070C09'}
                                  strokeWidth={isSelected ? 2.5 : 1.2}
                                />
                                <SvgText
                                  x={poly.labelX}
                                  y={poly.labelY - 4}
                                  fill="#FFFFFF"
                                  fontSize="10"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {poly.code} · {poly.name}
                                </SvgText>
                                <SvgText
                                  x={poly.labelX}
                                  y={poly.labelY + 9}
                                  fill={isSelected ? '#FDE047' : '#FFFFFFCC'}
                                  fontSize="8"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {mapHeatMode === 'party'
                                    ? `${st.leadingParty} (${st.leadingPct}%)`
                                    : `${st.reportingPct}%`}
                                </SvgText>
                                {isSelected && (
                                  <>
                                    <Circle cx={poly.labelX} cy={poly.labelY - 14} r={4.5} fill="#FFFFFF" />
                                    <Circle
                                      cx={poly.labelX}
                                      cy={poly.labelY - 14}
                                      r={8.5}
                                      stroke="#FFFFFF99"
                                      strokeWidth={1.5}
                                      fill="none"
                                    />
                                  </>
                                )}
                              </G>
                            );
                          })}
                        </G>
                      )}
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
                  {/* Integrated Inspection HUD directly in Map Footer */}
                  {geoLevel === 'state' && selectedMapState && (
                    <View style={[styles.integratedHud, { backgroundColor: '#0D2619', borderColor: '#1B4D33' }]}>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <View style={styles.liveDot} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                            {selectedMapState.name} State ({selectedMapState.code})
                          </ThemedText>
                          <View
                            style={[
                              styles.partyPill,
                              {
                                backgroundColor: PARTY_COLORS[selectedMapState.leadingParty] ?? colors.primary,
                                paddingVertical: 1,
                                paddingHorizontal: 6,
                              },
                            ]}
                          >
                            <ThemedText variant="label" color="#FFFFFF" fontFamily="bold">
                              {selectedMapState.leadingParty}
                            </ThemedText>
                          </View>
                          <ThemedText variant="label" style={{ color: '#FDE047' }} fontFamily="bold">
                            +{selectedMapState.margin}%
                          </ThemedText>
                        </View>
                        <ThemedText variant="label" color="#A3E6C2" numberOfLines={1}>
                          {selectedMapState.leadingCandidate} · {selectedMapState.baseCollated.toLocaleString()} of {selectedMapState.totalPus.toLocaleString()} PUs ({selectedMapState.reportingPct}%)
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => {
                          impact(Haptics.ImpactFeedbackStyle.Medium);
                          handleDrillToState(selectedMapState.name);
                        }}
                        style={[styles.hudActionBtn, { backgroundColor: colors.primary }]}
                        accessibilityLabel={`Drill down to LGAs for ${selectedMapState.name}`}
                      >
                        <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                          Drill LGAs
                        </ThemedText>
                        <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  )}

                  {geoLevel === 'lga' && selectedMapLga && (
                    <View style={[styles.integratedHud, { backgroundColor: '#0D2619', borderColor: '#1B4D33' }]}>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <View style={styles.liveDot} />
                          <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                            {selectedMapLga.name} ({selectedMapLga.state})
                          </ThemedText>
                          <View
                            style={[
                              styles.partyPill,
                              {
                                backgroundColor: PARTY_COLORS[selectedMapLga.leadingParty] ?? colors.primary,
                                paddingVertical: 1,
                                paddingHorizontal: 6,
                              },
                            ]}
                          >
                            <ThemedText variant="label" color="#FFFFFF" fontFamily="bold">
                              {selectedMapLga.leadingParty}
                            </ThemedText>
                          </View>
                          <ThemedText variant="label" style={{ color: '#FDE047' }} fontFamily="bold">
                            +{selectedMapLga.margin}%
                          </ThemedText>
                        </View>
                        <ThemedText variant="label" color="#A3E6C2" numberOfLines={1}>
                          {selectedMapLga.leadingCandidate} · {selectedMapLga.baseCollated} of {selectedMapLga.totalPus} PUs ({selectedMapLga.reportingPct}%)
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => {
                          impact(Haptics.ImpactFeedbackStyle.Medium);
                          handleInspectLga(selectedMapLga.name);
                        }}
                        style={[styles.hudActionBtn, { backgroundColor: colors.primary }]}
                        accessibilityLabel={`Inspect PUs for ${selectedMapLga.name}`}
                      >
                        <ThemedText variant="caption" color="#FFFFFF" fontFamily="bold">
                          Inspect PUs
                        </ThemedText>
                        <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  )}
                </Card>

                {/* Collation Leaderboard Header & Inline Party Filters */}
                <View style={styles.leaderboardHeaderRow}>
                  <View>
                    <ThemedText variant="title" color="text" fontFamily="bold">
                      {geoLevel === 'state' ? 'State Returns' : 'LGA Returns'}
                    </ThemedText>
                    <ThemedText variant="label" color="textSecondary">
                      {geoLevel === 'state' ? 'Ranked by reporting completion' : 'Ranked returns across monitored districts'}
                    </ThemedText>
                  </View>

                  {/* Compact Party Filter Chips */}
                  <View style={styles.compactPartyFilterRow}>
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
                            styles.compactFilterChip,
                            {
                              backgroundColor: isSelected ? color : colors.surfaceElevated,
                              borderColor: isSelected ? color : colors.border,
                            },
                          ]}
                        >
                          <ThemedText
                            variant="label"
                            color={isSelected ? '#FFFFFF' : 'textSecondary'}
                            fontFamily={isSelected ? 'bold' : 'medium'}
                          >
                            {party}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            }
            renderItem={renderGeoItem}
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
    gap: 8,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  tabBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minWidth: 0,
    flexShrink: 1,
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
  statusBarTrack: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  reportingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    overflow: 'hidden',
    gap: 8,
  },
  partyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  marginBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
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
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  zoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  clearFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  stateSelectorContainer: {
    paddingVertical: 2,
  },
  stateSelectorScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stateSelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  unifiedHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  pillTrack: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  activePillBtn: {
    ...shadows.sm,
  },
  integratedHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    gap: 8,
  },
  hudActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  compactPartyFilterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  compactFilterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  rowRankBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  miniStackedBar: {
    height: 5,
    borderRadius: radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    width: '100%',
    marginTop: 2,
  },
  rowReportingBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  rowActionBtn: {
    padding: 3,
  },
});
