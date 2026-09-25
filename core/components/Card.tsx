import React from 'react';
import { StyleSheet, ViewStyle, View, Animated } from 'react-native';
import { DebouncedPressable } from './DebouncedPressable';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { usePressScale } from '@/core/hooks/usePressScale';
import Colors from '@/constants/colors';
import { radius, shadows, border, spacing } from '@/constants/tokens';

type CardVariant = 'default' | 'highlighted' | 'elevated' | 'flat' | 'glass';

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  pressable?: boolean;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
  accessibilityLabel?: string;
  key?: string | number;
};

export function Card({
  children,
  variant = 'default',
  pressable = false,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const isHighlighted = variant === 'highlighted';
  const isElevated = variant === 'elevated';
  const isFlat = variant === 'flat';
  const isGlass = variant === 'glass';

  const borderColor = isHighlighted ? colors.primary : isGlass ? 'transparent' : colors.border;
  const borderWidth = isHighlighted ? border.thick : isGlass ? border.thin : border.thin;
  const shadow = isElevated
    ? shadows.lg
    : isHighlighted
      ? shadows.md
      : isFlat || isGlass
        ? {}
        : shadows.sm;

  const mergedStyle = Array.isArray(style)
    ? Object.assign({}, ...style)
    : (style ?? {});

  const layoutStyle: ViewStyle = {};
  const innerCustomStyle: ViewStyle = {};

  const LAYOUT_PROPS = new Set([
    'flex',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'width',
    'height',
    'minWidth',
    'maxWidth',
    'minHeight',
    'maxHeight',
    'margin',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'marginHorizontal',
    'marginVertical',
    'alignSelf',
    'position',
    'top',
    'bottom',
    'left',
    'right',
    'zIndex',
  ]);

  for (const [key, value] of Object.entries(mergedStyle)) {
    if (LAYOUT_PROPS.has(key)) {
      (layoutStyle as any)[key] = value;
    } else {
      (innerCustomStyle as any)[key] = value;
    }
  }

  const hasFlex = layoutStyle.flex !== undefined || layoutStyle.flexGrow !== undefined;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: isGlass ? colors.surfaceGlass : colors.surface,
      borderColor,
      borderWidth,
      padding: spacing.screen.cardPadding,
    },
    shadow,
    innerCustomStyle,
    hasFlex ? { flex: 1 } : null,
  ];

  const content = (
    <View style={[layoutStyle, cardStyle]} testID={testID}>
      {children}
    </View>
  );

  if (pressable && onPress) {
    return (
      <AnimatedCard
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        containerStyle={layoutStyle}
        hasFlex={hasFlex}
      >
        <View style={cardStyle} accessible accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          {children}
        </View>
      </AnimatedCard>
    );
  }

  return content;
}

function AnimatedCard({
  onPress,
  accessibilityLabel,
  testID,
  containerStyle,
  hasFlex,
  children,
}: {
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  containerStyle?: ViewStyle;
  hasFlex?: boolean;
  children: React.ReactNode;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale({ toValue: 0.97 });

  return (
    <DebouncedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={[{ borderRadius: radius.md }, containerStyle]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[{ transform: [{ scale }] }, hasFlex ? { flex: 1 } : null]}>
        {children}
      </Animated.View>
    </DebouncedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.screen.cardPadding,
  },
});
