import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, Input, Shimmer } from '@/core/components';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import {
  useStatesQuery,
  useLgasQuery,
  usePollingUnitsQuery,
  useLocationSearchQuery,
} from '@/features/elections/hooks';
import Colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function LocationsScreen() {
  const { data: states = [] } = useStatesQuery();
  const { data: lgas = [] } = useLgasQuery();
  const { data: pollingUnits = [] } = usePollingUnitsQuery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateId, setSelectedStateId] = useState<string | null>('s25'); // default Lagos

  const { data: searchResults = [], isLoading: searchLoading } = useLocationSearchQuery(searchQuery);

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' });

  const selectedState = states.find((s) => s.id === selectedStateId);
  const stateLgas = selectedStateId ? lgas.filter((l) => l.stateId === selectedStateId) : [];

  return (
    <ScreenView scrollable contentContainerStyle={styles.scrollContent}>
      {/* 1. Header Overview Banner */}
      <LinearGradient
        colors={['#0D6338', '#0A4A2A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerHero, shadows.md]}
      >
        <ThemedText variant="label" color="#A3E6C2" fontFamily="bold">
          ELECTORAL GEOGRAPHY & HIERARCHY
        </ThemedText>
        <ThemedText variant="h2" color="#FFFFFF" fontFamily="bold" style={{ marginTop: 2 }}>
          Electoral Location Engine
        </ThemedText>
        <ThemedText variant="caption" color="#D1FAE5" style={{ marginTop: 2 }}>
          National directory of 36 States, FCT, 774 LGAs, and 176,846 Polling Units
        </ThemedText>

        <View style={styles.statsStrip}>
          <View style={styles.statCol}>
            <ThemedText variant="title" color="#FFFFFF" fontFamily="bold">{states.length}</ThemedText>
            <ThemedText variant="label" color="#A3E6C2">STATES + FCT</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <ThemedText variant="title" color="#FFFFFF" fontFamily="bold">774</ThemedText>
            <ThemedText variant="label" color="#A3E6C2">LGAS</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <ThemedText variant="title" color="#FFFFFF" fontFamily="bold">176,846</ThemedText>
            <ThemedText variant="label" color="#A3E6C2">POLLING UNITS</ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* 2. Typeahead Location Autocomplete Search (Audio Part 8) */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="title" color="text" fontFamily="bold">
          Location Autocomplete Search
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
          Type any polling unit, ward, or LGA. All results are qualified by parent state.
        </ThemedText>

        <Input
          placeholder="Search e.g. 'Ikoyi', 'Kaduna', 'Alausa'..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          rightIcon={searchQuery ? 'close-circle' : undefined}
          onRightIconPress={() => setSearchQuery('')}
        />

        {searchLoading && (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs }}>
              <Shimmer width={18} height={18} borderRadius={radius.full} />
              <Shimmer width="65%" height={14} borderRadius={radius.sm} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs }}>
              <Shimmer width={18} height={18} borderRadius={radius.full} />
              <Shimmer width="50%" height={14} borderRadius={radius.sm} />
            </View>
          </View>
        )}

        {/* Autocomplete Search Results */}
        {searchQuery.trim().length >= 2 && (
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            {searchResults.length === 0 && !searchLoading ? (
              <ThemedText variant="caption" color="textMuted" style={{ paddingVertical: spacing.xs }}>
                No matching locations found for "{searchQuery}".
              </ThemedText>
            ) : (
              searchResults.map((item) => {
                const typeColors: Record<string, string> = {
                  PU: colors.primary,
                  WARD: colors.accentDark,
                  LGA: '#2563EB',
                  SENATORIAL: '#7C3AED',
                  STATE: '#059669',
                };
                const tagColor = typeColors[item.type] ?? colors.primary;

                return (
                  <View
                    key={item.id}
                    style={[styles.searchResultItem, { borderColor: colors.border }]}
                  >
                    <View style={[styles.typeBadge, { backgroundColor: tagColor + '18' }]}>
                      <ThemedText variant="label" style={{ color: tagColor }} fontFamily="bold">
                        {item.type}
                      </ThemedText>
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.xs }}>
                      <ThemedText variant="body" color="text" fontFamily="bold">
                        {item.name}
                      </ThemedText>
                      {/* Parent State Qualification (Audio Part 8: 'Ikoyi, Lagos State' vs 'Ikoyi, Osun State') */}
                      <ThemedText variant="caption" color="primary" fontFamily="medium">
                        {item.qualification}
                      </ThemedText>
                    </View>

                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                  </View>
                );
              })
            )}
          </View>
        )}
      </Card>

      {/* 3. State Hierarchy Explorer */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="title" color="text" fontFamily="bold">
          Electoral State Explorer
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
          Select a state to inspect local government councils and jurisdiction wards
        </ThemedText>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stateChipsScroll}>
          {states.slice(0, 15).map((s) => {
            const active = selectedStateId === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedStateId(s.id);
                }}
                style={[
                  styles.stateChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceElevated,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <ThemedText
                  variant="caption"
                  color={active ? '#FFFFFF' : 'text'}
                  fontFamily={active ? 'bold' : 'regular'}
                >
                  {s.name} ({s.code})
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedState && (
          <View style={[styles.stateDetailBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <ThemedText variant="body" color="text" fontFamily="bold">
              {selectedState.name} State Administration
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              Zone: South-West · Preloaded with {stateLgas.length} sample LGAs & {pollingUnits.length} PUs
            </ThemedText>

            <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
              {stateLgas.slice(0, 4).map((lga) => (
                <View key={lga.id} style={[styles.lgaItem, { borderColor: colors.border }]}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <ThemedText variant="caption" color="text" fontFamily="medium" style={{ marginLeft: 6, flex: 1 }}>
                    {lga.name} Council Area · {selectedState.name} State
                  </ThemedText>
                  <ThemedText variant="label" color="primary">Active</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerHero: {
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  statsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  statCol: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: spacing.xs,
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  stateChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  stateDetailBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  lgaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
});
