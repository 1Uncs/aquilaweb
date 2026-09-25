import React, { createContext, useContext } from 'react';
import { View, ViewStyle, Platform, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import Colors from '@/constants/colors';
import { spacing } from '@/constants/tokens';

export const ScreenViewContext = createContext<{
  isTab?: boolean;
  isAuth?: boolean;
}>({});

type ScreenViewProps = {
  children: React.ReactNode;
  isTab?: boolean;
  isAuth?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  testID?: string;
  noScrollPadding?: boolean;
  refreshControl?: React.ReactElement;
  skipAndroidTopPadding?: boolean;
  skipTopSafeArea?: boolean;
  sectionGap?: number;
};

export function ScreenView({
  children,
  isTab: isTabProp,
  isAuth: isAuthProp,
  style,
  contentContainerStyle,
  scrollable = false,
  keyboardShouldPersistTaps,
  testID,
  noScrollPadding = false,
  refreshControl,
  skipAndroidTopPadding = false,
  skipTopSafeArea = false,
  sectionGap,
}: ScreenViewProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const context = useContext(ScreenViewContext);

  const isTab = isTabProp ?? context.isTab ?? false;
  const isAuth = isAuthProp ?? context.isAuth ?? false;
  const hasNoNativeHeader = isTab || isAuth;

  let resolvedTopPadding = 0;
  if (!skipTopSafeArea) {
    if (hasNoNativeHeader) {
      // Headerless screens (auth, tabs): if non-scrollable, apply insets.top on both iOS & Android so header is never covered
      if (!scrollable) {
        resolvedTopPadding = insets.top;
      } else if (Platform.OS === 'android' && !skipAndroidTopPadding) {
        resolvedTopPadding = insets.top;
      }
    } else {
      // Push screens on iOS with headerTransparent: true
      if (Platform.OS === 'ios') {
        if (!scrollable) {
          // Non-scrollable push screens need padding so content starts below transparent header
          resolvedTopPadding = insets.top + 44;
        }
        // Scrollable push screens use contentInsetAdjustmentBehavior="automatic" so content scrolls natively under header!
      }
    }
  }

  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: resolvedTopPadding,
  };

  const resolvedSectionGap = sectionGap ?? spacing.screen.sectionGap;

  if (scrollable) {
    const scrollContentStyle = [
      styles.scrollContent,
      noScrollPadding
        ? {}
        : {
            paddingHorizontal: spacing.screen.paddingHorizontal,
            paddingTop: isTab ? (Platform.OS === 'ios' ? insets.top + spacing.xs : spacing.xs) : spacing.screen.padding,
          },
      isTab ? { paddingBottom: Math.max(spacing.screen.padding, insets.bottom + 84) } : {},
      contentContainerStyle,
    ];

    const scrollViewProps: ScrollViewProps = {
      contentContainerStyle: scrollContentStyle,
      contentInsetAdjustmentBehavior: Platform.OS === 'ios' && !hasNoNativeHeader ? 'automatic' : 'never',
      keyboardShouldPersistTaps: keyboardShouldPersistTaps,
      bounces: true,
      overScrollMode: 'always',
    };

    if (refreshControl) {
      scrollViewProps.refreshControl = refreshControl as ScrollViewProps['refreshControl'];
    }

    return (
      <View style={[baseStyle, style]} testID={testID} collapsable={false}>
        <ScrollView style={styles.scrollView} {...scrollViewProps}>
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[baseStyle, style]} testID={testID}>
      <View
        style={[
          styles.nonScrollContainer,
          noScrollPadding
            ? {}
            : {
                paddingHorizontal: spacing.screen.paddingHorizontal,
                paddingTop: spacing.xs,
                gap: resolvedSectionGap,
              },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.screen.padding,
    gap: spacing.screen.sectionGap,
  },
  nonScrollContainer: {
    flex: 1,
  },
});
