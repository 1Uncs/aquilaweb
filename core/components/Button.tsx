import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  PressableProps,
  Platform,
  FlexAlignType,
  Animated,
} from 'react-native';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { usePressScale } from '@/core/hooks/usePressScale';
import { DebouncedPressable } from './DebouncedPressable';
import Colors from '@/constants/colors';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { radius, opacities, border, shadows } from '@/constants/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
} & Omit<PressableProps, 'children'>;

export function Button({
  label,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  testID,
  accessibilityLabel,
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  ...rest
}: ButtonProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { scale, onPressIn: onScaleIn, onPressOut: onScaleOut } = usePressScale({ toValue: 0.97 });

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 36 },
    md: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 46 },
    lg: { paddingVertical: 13, paddingHorizontal: 20, minHeight: 52 },
  };

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
      ...Platform.select({
        ios: shadows.md,
        android: { ...shadows.md, elevation: 4 },
      }),
    },
    secondary: { backgroundColor: colors.primaryLight },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: border.thick,
      borderColor: colors.primary,
    },
    ghost: { backgroundColor: 'transparent' },
  };

  const textColor =
    variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF';

  const renderIcon = (iconName: keyof typeof Ionicons.glyphMap | undefined, iconColor: string) => {
    if (!iconName) return null;
    return <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />;
  };

  return (
    <DebouncedPressable
      onPress={onPress}
      onPressIn={onScaleIn}
      onPressOut={onScaleOut}
      disabled={disabled || loading}
      style={fullWidth ? { alignSelf: 'stretch' as FlexAlignType } : undefined}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      {...rest}
    >
      <Animated.View
        style={[
          styles.button,
          { borderRadius: radius.full },
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && { alignSelf: 'stretch' as FlexAlignType },
          disabled && { opacity: opacities.disabled },
          style,
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.row}>
          {renderIcon(leftIcon, textColor)}
          <ThemedText
            variant="label"
            style={[
              styles.label,
              {
                color: textColor,
                fontSize: size === 'sm' ? 12.5 : size === 'lg' ? 15 : 13.5,
                lineHeight: size === 'sm' ? 16 : size === 'lg' ? 20 : 18,
              },
            ]}
          >
            {loading ? 'Loading...' : label}
          </ThemedText>
          {renderIcon(rightIcon, textColor)}
        </View>
      </Animated.View>
    </DebouncedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: { fontWeight: '600', letterSpacing: 0.3 },
  icon: { lineHeight: 20 },
});
