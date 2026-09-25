import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { spacing, radius } from '@/constants/tokens';
import Colors from '@/constants/colors';
import { useColorScheme } from '@/core/hooks/useColorScheme';

type SectionHeaderProps = {
  title: string;
  color?: string;
  action?: React.ReactNode;
};

/** SSOT section header: 4px indicator + h3, single marginBottom. */
export function SectionHeader({ title, color, action }: SectionHeaderProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  return (
    <View style={styles.row}>
      <View style={[styles.indicator, { backgroundColor: color ?? colors.primary }]} />
      <ThemedText variant="h3" style={styles.title} minFontSize={16} maxFontSize={22}>
        {title}
      </ThemedText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  indicator: { width: 4, height: 16, borderRadius: radius.full },
  title: { flex: 1 },
});
