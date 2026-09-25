import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import Colors from '@/constants/colors';
import { animation } from '@/constants/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ShimmerProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  speed?: number;
};

export function Shimmer({
  width = SCREEN_WIDTH,
  height = 12,
  borderRadius = 4,
  style,
  speed = animation.slow,
}: ShimmerProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const animatedValue = useRef(new Animated.Value(0)).current;
  const numericWidth = typeof width === 'number' ? width : SCREEN_WIDTH;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: speed,
        easing: (t) => t,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue, speed]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-numericWidth, numericWidth],
  });

  const isDark = scheme === 'dark';
  const baseColor = isDark ? '#0D1A12' : '#EBF7F0';
  const highlightColor = isDark ? colors.primaryLight + '38' : colors.primaryLight + '55';

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: baseColor, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[
          styles.shimmerGradient,
          {
            width: numericWidth * 0.5,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    flex: 1,
  },
});
