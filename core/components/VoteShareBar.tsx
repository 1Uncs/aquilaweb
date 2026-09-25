import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { spacing, radius } from '@/constants/tokens';
import Colors from '@/constants/colors';
import { useColorScheme } from '@/core/hooks/useColorScheme';

export type VoteShareEntry = {
  id: string;
  name: string;
  partyAcronym: string;
  votes: number;
  pct: number;
};

const BAR_COLORS = ['#0D47A1', '#f59e0b', '#059669', '#64748b', '#7c3aed'];

/** Horizontal vote-share bars. Widths are data-driven, no measurement. */
export function VoteShareBar({ entries }: { entries: VoteShareEntry[] }) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map((e) => e.votes), 1);

  return (
    <View style={styles.wrap}>
      {entries.slice(0, 5).map((e, i) => (
        <View key={e.id} style={styles.row}>
          <View style={styles.labelWrap}>
            <ThemedText variant="body" style={styles.name} numberOfLines={1}>
              {e.name}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {e.partyAcronym} · {e.votes.toLocaleString()}
            </ThemedText>
          </View>
          <ThemedText variant="body" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {e.pct.toFixed(1)}%
          </ThemedText>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max((e.votes / max) * 100, 4)}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { gap: spacing.xs },
  labelWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontWeight: '600', flex: 1 },
  track: { height: spacing.sm, borderRadius: radius.sm, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.sm },
});
