import React from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useEntrance } from '@/core/hooks/useEntrance';

type EntranceViewProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  delay?: number;
  translateY?: number;
};

/** Staggered fade+rise wrapper. All animation on native driver. */
export function EntranceView({ children, style, delay = 0, translateY = 16 }: EntranceViewProps) {
  const animatedStyle = useEntrance({ delay, translateY });
  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
