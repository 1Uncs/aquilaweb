import { useColorScheme } from '@/core/hooks/useColorScheme';
import Colors, { ColorScheme } from '@/constants/colors';
import { Platform, PixelRatio, Text as RNText, StyleSheet, TextStyle, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ms } from '@/core/utils/ms';
import { FONT_FAMILY } from '@/constants/fonts';
import { typography as typographyTokens } from '@/constants/tokens';

const useScheme = (): ColorScheme => {
  return useColorScheme() ?? 'light';
};

type ThemedTextProps = {
  children: React.ReactNode;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'caption' | 'label' | 'gradient' | 'xl' | 'xxl' | 'lg';
  color?: keyof typeof Colors.light | string;
  style?: object;
  allowFontScaling?: boolean;
  testID?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'tail' | 'head' | 'middle' | 'clip';
  onPress?: () => void;
  uppercase?: boolean;
  tracking?: number;
  gradientColors?: readonly [string, string, ...string[]];
  fontFamily?: 'regular' | 'medium' | 'bold';
  minFontSize?: number;
  maxFontSize?: number;
};

const SIZE_MAP: Record<string, number> = {
  display: typographyTokens.display,
  h1: typographyTokens.h1,
  h2: typographyTokens.h2,
  h3: typographyTokens.h3,
  title: typographyTokens.title,
  body: typographyTokens.body,
  caption: typographyTokens.caption,
  label: typographyTokens.label,
  xxl: typographyTokens.xxl,
  xl: typographyTokens.xl,
  lg: typographyTokens.lg,
};

const LINE_HEIGHT_MAP: Record<string, number> = {
  display: typographyTokens.lineHeights.display,
  h1: typographyTokens.lineHeights.h1,
  h2: typographyTokens.lineHeights.h2,
  h3: typographyTokens.lineHeights.h3,
  title: typographyTokens.lineHeights.title,
  body: typographyTokens.lineHeights.body,
  caption: typographyTokens.lineHeights.caption,
  label: typographyTokens.lineHeights.label,
  xxl: 38,
  xl: 30,
  lg: 26,
};

export function ThemedText({
  children,
  variant = 'body',
  color,
  style,
  allowFontScaling = true,
  testID,
  numberOfLines,
  ellipsizeMode,
  onPress,
  uppercase,
  tracking,
  gradientColors,
  fontFamily = 'regular',
  minFontSize,
  maxFontSize,
}: ThemedTextProps) {
  const scheme = useScheme();
  const colors = Colors[scheme];
  const { width } = useWindowDimensions();

  const textColor = color
    ? typeof color === 'string' && color in colors
      ? (colors as Record<string, string>)[color]
      : color
    : colors.text;

  const isGradient = variant === 'gradient';

  const isHeading = ['h1', 'h2', 'h3', 'display'].includes(variant);
  const isSubheading = variant === 'h2' || variant === 'h3';
  const isTitle = variant === 'title';

  const baseFontSize: number = (SIZE_MAP[variant] ?? SIZE_MAP.body)!;
  const responsiveSize = ms(baseFontSize, width);
  const fontSize = Math.max(minFontSize ?? 0, Math.min(maxFontSize ?? Infinity, responsiveSize));
  const rawLineHeight = (LINE_HEIGHT_MAP[variant] ?? LINE_HEIGHT_MAP.body)!;
  const scaledLineHeight = PixelRatio.roundToNearestPixel(
    Platform.OS === 'android' ? rawLineHeight * PixelRatio.getFontScale() : rawLineHeight
  );

  const maxFontSizeMultiplier =
    variant === 'display' || variant === 'h1'
      ? 1.25
      : isSubheading
        ? 1.3
        : isTitle
          ? 1.35
          : variant === 'body'
            ? 1.4
            : 1.5;

  const fontFamilyValue =
    fontFamily === 'bold'
      ? FONT_FAMILY.bold
      : fontFamily === 'medium'
        ? FONT_FAMILY.medium
        : FONT_FAMILY.regular;

  const baseStyle: TextStyle = {
    color: textColor,
    fontSize,
    lineHeight: scaledLineHeight,
    fontFamily: fontFamilyValue,
    includeFontPadding: Platform.select({ android: false }),
  };

  if (uppercase || variant === 'label') {
    baseStyle.textTransform = 'uppercase';
  }
  if (tracking !== undefined) {
    baseStyle.letterSpacing = tracking;
  } else if (variant === 'label') {
    baseStyle.letterSpacing = 0.5;
  } else if (isHeading) {
    baseStyle.letterSpacing = -0.2;
  }

  if (isGradient && gradientColors) {
    return (
      <RNText
        style={[styles.base, baseStyle, style]}
        allowFontScaling={allowFontScaling}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        testID={testID}
        onPress={onPress}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientFill}
        >
          <RNText
            style={[
              styles.base,
              baseStyle,
              { color: Platform.select({ ios: 'transparent', android: '#fff' }) },
            ]}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            numberOfLines={numberOfLines}
            ellipsizeMode={ellipsizeMode}
            testID={testID}
            onPress={onPress}
          >
            {children}
          </RNText>
        </LinearGradient>
      </RNText>
    );
  }

  return (
    <RNText
      style={[styles.base, baseStyle, style]}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      testID={testID}
      onPress={onPress}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlignVertical: Platform.select({ android: 'center' }),
  },
  gradientFill: {
    alignSelf: 'flex-start',
  },
});
