import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from './ThemedText';
import { Card } from './Card';
import { spacing, radius, shadows, gradientPresets } from '@/constants/tokens';
import Colors from '@/constants/colors';
import { useColorScheme } from '@/core/hooks/useColorScheme';

type CoverageHeroProps = {
  reporting: number;
  total: number;
};

/** Situation-room hero: coverage % + segmented progress. Replaces plain progress card. */
export function CoverageHero({ reporting, total }: CoverageHeroProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const pct = total > 0 ? Math.min(Math.round((reporting / total) * 100), 100) : 0;

  return (
    <Card style={[shadows.md, styles.card]}>
      <LinearGradient
        colors={[...gradientPresets.election]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topGlow}
      />
      <View style={styles.row}>
        <View style={styles.left}>
          <ThemedText variant="caption" color="textSecondary">
            REPORTING COVERAGE
          </ThemedText>
          <ThemedText variant="display" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {pct}%
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">
            {reporting.toLocaleString()} / {total.toLocaleString()} PUs
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.verifiedSubtle }]}>
          <View style={[styles.dot, { backgroundColor: colors.verified }]} />
          <ThemedText variant="caption" style={{ color: colors.verified, fontWeight: '700' }}>
            LIVE
          </ThemedText>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', paddingTop: spacing.md },
  topGlow: { height: 4, borderRadius: radius.full, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  left: { gap: spacing['2xs'] },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: radius.full,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  track: { height: spacing.sm, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
});
