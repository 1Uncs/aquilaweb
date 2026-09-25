import React, { useRef, useState, forwardRef } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  Pressable,
  ViewStyle,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import Colors from '@/constants/colors';
import { ThemedText } from './ThemedText';
import { radius, spacing, border, animation } from '@/constants/tokens';
import { Ionicons } from '@expo/vector-icons';

type InputProps = {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  secureToggle?: boolean;
  visible?: boolean;
  onToggleSecure?: () => void;
  containerStyle?: ViewStyle;
  testID?: string;
  description?: string;
} & RNTextInputProps;

export const Input = forwardRef<RNTextInput, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureToggle,
  visible,
  onToggleSecure,
  containerStyle,
  testID,
  description,
  ...rest
}: InputProps, ref) => {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [focused, setFocused] = useState(false);
  const internalRef = useRef<RNTextInput>(null);

  const inputRef = (ref as React.Ref<RNTextInput>) ?? internalRef;
  const rightIconName = secureToggle
    ? (visible ? 'eye-off' : 'eye')
    : rightIcon;

  const handleRightPress = secureToggle
    ? onToggleSecure
    : onRightIconPress;

  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!(rightIconName || secureToggle);

  const animatedValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const toValue = focused && !error ? 1 : 0;
    Animated.timing(animatedValue, {
      toValue,
      duration: animation.normal,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [focused, error, animatedValue]);

  const animatedBorderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, error ? colors.error : colors.primary],
  });

  const animatedShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, focused && !error ? 0.18 : 0],
  });

  const animatedShadowRadius = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, focused && !error ? 12 : 0],
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <ThemedText variant="label" style={{ marginBottom: spacing.sm, letterSpacing: 0.4 }}>
          {label}
        </ThemedText>
      )}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: animatedBorderColor as unknown as string,
            borderRadius: radius.md,
            shadowColor: colors.primary,
            shadowOpacity: animatedShadowOpacity as unknown as number,
            shadowRadius: animatedShadowRadius as unknown as number,
            elevation: focused && !error ? 4 : 0,
          },
        ]}
      >
        {hasLeftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <RNTextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: colors.text },
            hasLeftIcon && styles.inputWithLeftIcon,
            hasRightIcon && styles.inputWithRightIcon,
            Platform.OS === 'android' && { textAlignVertical: rest.multiline ? 'top' : 'center', paddingVertical: spacing.md },
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          testID={testID}
          maxFontSizeMultiplier={1.3}
          {...rest}
        />
        {hasRightIcon && (
          <Pressable
            onPress={handleRightPress}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.rightIcon}
          >
            {rightIconName && (
              <Ionicons name={rightIconName} size={20} color={colors.textMuted} />
            )}
          </Pressable>
        )}
      </Animated.View>
      {error && (
        <ThemedText variant="caption" color="error" style={{ marginTop: spacing.xs }}>
          {error}
        </ThemedText>
      )}
      {description && !error && (
        <ThemedText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>
          {description}
        </ThemedText>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: border.thick,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    paddingVertical: spacing.sm,
  },
  leftIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
});
