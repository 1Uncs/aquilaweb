import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Shimmer } from './Shimmer';
import { spacing, radius, sizes } from '@/constants/tokens';

type SkeletonCircleProps = {
  size?: number;
  style?: ViewStyle;
};

type SkeletonLineProps = {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
};

type SkeletonCardProps = {
  style?: ViewStyle;
  lines?: number;
};

export function SkeletonCircle({ size = sizes.icon, style }: SkeletonCircleProps) {
  return <Shimmer width={size} height={size} borderRadius={radius.full} style={[{ width: size, height: size }, style]} />;
}

export function SkeletonLine({ width = '100%', height = 12, style, borderRadius = radius.sm }: SkeletonLineProps) {
  return <Shimmer width={typeof width === 'number' ? width : undefined} height={height} borderRadius={borderRadius} style={[{ width }, style]} />;
}

export function SkeletonCard({ style, lines = 3 }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Shimmer width={48} height={48} borderRadius={radius.full} />
        <View style={styles.cardHeaderText}>
          <Shimmer width="70%" height={14} borderRadius={radius.sm} />
          <Shimmer width="50%" height={12} borderRadius={radius.sm} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={12}
          borderRadius={radius.sm}
          style={{ marginTop: spacing.sm }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.screen.cardPadding,
    borderRadius: radius.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
});
