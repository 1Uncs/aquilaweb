import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { ThemedText } from '@/core/components/ThemedText';
import { spacing, radius } from '@/constants/tokens';
import Colors from '@/constants/colors';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import type { IncidentReport } from '@/features/auth/store';

import { router } from 'expo-router';
import { ROUTES } from '@/constants/routes';
import * as Haptics from 'expo-haptics';
import { useHaptics } from '@/core/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type Props = {
  incidents: IncidentReport[];
  style?: import('react-native').ViewStyle;
};

export function IncidentMarquee({ incidents, style }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const { impact } = useHaptics();
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [contentWidth, setContentWidth] = React.useState(0);

  const activeIncidents = incidents.slice(0, 8);

  useEffect(() => {
    if (activeIncidents.length === 0 || contentWidth === 0 || containerWidth === 0) return;
    const distance = contentWidth + containerWidth;
    const duration = Math.max(14_000, (distance / 45) * 1000);
    translateX.setValue(containerWidth);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -contentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [activeIncidents.length, contentWidth, containerWidth, translateX]);

  if (activeIncidents.length === 0) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.critical + '14', borderColor: colors.critical + '30' }, style]}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && Math.abs(w - containerWidth) > 2) setContainerWidth(w);
      }}
      accessibilityRole="text"
    >
      <View style={[styles.label, { backgroundColor: colors.critical }]}>
        <ThemedText variant="caption" numberOfLines={1} style={{ color: '#fff', fontWeight: '700' }}>
          LIVE
        </ThemedText>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.tickerRow, { transform: [{ translateX }] }]}
          onLayout={(e) => {
            const w = Math.round(e.nativeEvent.layout.width);
            if (w > 0 && Math.abs(w - contentWidth) > 2) setContentWidth(w);
          }}
        >
          {activeIncidents.map((i) => (
            <Pressable
              key={i.id}
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: ROUTES.INCIDENT_DETAIL, params: { id: i.id } });
              }}
              style={styles.incidentPill}
            >
              <ThemedText variant="caption" numberOfLines={1}>
                <ThemedText variant="caption" numberOfLines={1} style={{ color: colors.critical, fontWeight: '700' }}>
                  {i.category.replace(/_/g, ' ')}
                </ThemedText>
                <ThemedText variant="caption" numberOfLines={1} color="textSecondary">
                  {' '}@{i.electoralArea}: {i.description.slice(0, 48)}{' '}
                </ThemedText>
              </ThemedText>
              <Ionicons name="chevron-forward" size={11} color={colors.critical} style={{ opacity: 0.8 }} />
              <ThemedText variant="caption" numberOfLines={1} color="textMuted" style={{ marginHorizontal: spacing.sm }}>
                •
              </ThemedText>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

// Fallback scrollable marquee for web / when native driver unavailable
export function IncidentMarqueeScrollable({ incidents, style }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  if (incidents.length === 0) return null;
  return (
    <View style={[styles.container, { backgroundColor: colors.critical + '14', borderColor: colors.critical + '30' }, style]}>
      <View style={[styles.label, { backgroundColor: colors.critical }]}>
        <ThemedText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
          LIVE
        </ThemedText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.track} contentContainerStyle={{ gap: spacing.md }}>
        {incidents.slice(0, 8).map((i) => (
          <ThemedText key={i.id} variant="caption" style={{ color: colors.textSecondary, fontWeight: '500' }} numberOfLines={1}>
            {i.category.replace(/_/g, ' ')} @ {i.electoralArea} {'\u2022'}
          </ThemedText>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
    height: 32,
  },
  label: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  track: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexWrap: 'nowrap',
  },
  incidentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
});
