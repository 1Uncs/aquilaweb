import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Image, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { ScreenView } from '@/core/components/ScreenView';
import { ThemedText, Card, Button } from '@/core/components';
import { useAuthStore } from '@/features/auth/store';
import { useLogoutMutation } from '@/features/auth/hooks';
import { ROUTES } from '@/constants/routes';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import Colors from '@/constants/colors';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function ProfileTabScreen() {
  const { user, login } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: 'light' });

  const roleLabels: Record<UserRole, string> = {
    ELECTION_OFFICER: 'Election Officer',
    POLLING_AGENT: 'Polling Unit Agent',
    FIELD_AGENT: 'Field Agent',
  };

  const [screenCaptureBlocked, setScreenCaptureBlocked] = useState(false);

  useEffect(() => {
    ScreenCapture.allowScreenCaptureAsync().catch(() => {});
  }, []);

  const handleToggleScreenCapture = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreenCaptureBlocked(value);
    try {
      if (value) {
        await ScreenCapture.preventScreenCaptureAsync();
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    } catch (e) {
      console.warn('[profile] toggleScreenCapture failed', e);
    }
  };

  const handleRoleSwitch = (newRole: UserRole, email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!user) return;
    login({
      ...user,
      role: newRole,
      email,
      name: email.split('@')[0] ?? email,
    });
    Alert.alert('Role Switched', `Active session updated to ${roleLabels[newRole]}.`);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to disconnect from this station console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logoutMutation.mutateAsync();
        },
      },
    ]);
  };

  return (
    <ScreenView scrollable contentContainerStyle={styles.scrollContent}>
      {/* 1. Profile Hero Card with Eagle Brand Identity */}
      <LinearGradient
        colors={['#070C09', '#0A331D', '#0D6338']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.profileHero, shadows.md]}
      >
        <View style={styles.heroContent}>
          <View style={[styles.avatarBadge, { borderColor: colors.primaryLight + '55' }]}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              source={require('@/assets/eagle-head.png')}
              style={styles.avatarImg}
              resizeMode="contain"
            />
          </View>

          <ThemedText variant="title" color="#FFFFFF" fontFamily="bold" style={{ marginTop: spacing.xs }}>
            {user?.name ?? 'Field Agent'}
          </ThemedText>

          <View style={[styles.roleChip, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <ThemedText variant="label" color="#34D399" fontFamily="bold">
              {user?.role ? roleLabels[user.role] : 'Field Agent'}
            </ThemedText>
          </View>

          <ThemedText variant="caption" color="#A3B8AC" style={{ marginTop: 2 }}>
            {user?.email ?? 'agent@aquila.ng'}
          </ThemedText>
        </View>
      </LinearGradient>

      {/* 2. Organization Multi-Tenant Card (Audio Part 1) */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="label" color="textMuted" fontFamily="bold">
          ORGANIZATION & TENANT CONSOLE
        </ThemedText>

        <View style={styles.orgRow}>
          <View style={[styles.orgIconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="business" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <ThemedText variant="body" color="text" fontFamily="bold">
              {user?.organizationName ?? 'Aquila Situation Room HQ'}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Mission ID: {user?.organizationId ?? 'org-aquila'} · Accredited Observer Mission
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* 3. Field Agent Covert & Security Settings (Audio Part 5) */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="title" color="text" fontFamily="bold">
          Field Security & Covert Protocol
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
          Standardized precautions for agents reporting in sensitive polling environments
        </ThemedText>

        <View style={{ gap: spacing.xs }}>
          <View style={styles.prefRow}>
            <Ionicons name="flash-off-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <ThemedText variant="body" color="text" fontFamily="medium">
                Stealth Capture (Flash Muted)
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Camera flash disabled by default to prevent drawing crowd attention
              </ThemedText>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>

          <View style={styles.prefRow}>
            <Ionicons name="volume-mute-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <ThemedText variant="body" color="text" fontFamily="medium">
                Covert Shutter Sound Muted
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Audio shutter clicks eliminated for night-time incident recording
              </ThemedText>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>

          <View style={styles.prefRow}>
            <Ionicons name="timer-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <ThemedText variant="body" color="text" fontFamily="medium">
                2-Minute Evidence Auto-Save
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Audio/video auto-saves every 120s if phone is unattended in tense situations
              </ThemedText>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>

          {/* Interactive Screen Capture Prevention Toggle (Audio Part 5) */}
          <View style={styles.prefRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.xs, marginRight: spacing.xs }}>
              <ThemedText variant="body" color="text" fontFamily="bold">
                Block App Screenshots & Recording
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Prevents OS screenshots and screen recording of confidential polling data (Off by default)
              </ThemedText>
            </View>
            <Switch
              value={screenCaptureBlocked}
              onValueChange={handleToggleScreenCapture}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor={screenCaptureBlocked ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </View>
      </Card>

      {/* 4. Quick Navigation Modules */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="title" color="text" fontFamily="bold">
          Operational Modules
        </ThemedText>

        <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
          {[
            { label: 'Electoral Geography & Autocomplete', icon: 'map-outline', route: ROUTES.LOCATIONS },
            { label: 'Political Parties & Candidate Directory', icon: 'people-outline', route: ROUTES.PARTIES },
            { label: 'National Result Collation Room', icon: 'bar-chart-outline', route: ROUTES.RESULT_COLLATION },
            ...(user?.role === 'ELECTION_OFFICER'
              ? [{ label: 'Audit & Search Results', icon: 'search-outline', route: ROUTES.RESULT_SEARCH }]
              : [{ label: 'Draft Results Queue', icon: 'save-outline', route: ROUTES.RESULT_DRAFTS }]),
          ].map((item) => (
            <Card
              key={item.label}
              pressable
              onPress={() => {
                router.push(item.route as any);
              }}
              style={[styles.moduleLink, { borderColor: colors.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.moduleIconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <ThemedText variant="body" color="text" fontFamily="medium" style={{ flex: 1, marginLeft: spacing.xs }}>
                  {item.label}
                </ThemedText>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </Card>
          ))}
        </View>
      </Card>

      {/* 5. Role Switcher for Demo Evaluation */}
      <Card style={styles.sectionCard}>
        <ThemedText variant="title" color="text" fontFamily="bold">
          Demo Role Simulator
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
          Switch perspective to test Field Agent, Polling Unit Agent, or Election Officer flows
        </ThemedText>

        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Button
            label="Field Agent"
            variant={user?.role === 'FIELD_AGENT' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => handleRoleSwitch('FIELD_AGENT', 'agent@aquila.ng')}
            style={{ flex: 1 }}
          />
          <Button
            label="PU Agent"
            variant={user?.role === 'POLLING_AGENT' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => handleRoleSwitch('POLLING_AGENT', 'polling@aquila.ng')}
            style={{ flex: 1 }}
          />
          <Button
            label="Election Officer"
            variant={user?.role === 'ELECTION_OFFICER' ? 'primary' : 'outline'}
            size="sm"
            onPress={() => handleRoleSwitch('ELECTION_OFFICER', 'officer@aquila.ng')}
            style={{ flex: 1.2 }}
          />
        </View>
      </Card>

      {/* 6. Sign Out Button */}
      <Button
        label="Disconnect & Sign Out"
        variant="outline"
        size="lg"
        leftIcon="log-out-outline"
        onPress={handleLogout}
        loading={logoutMutation.isPending}
        style={{ borderColor: colors.critical }}
      />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 110,
    gap: spacing.md,
  },
  profileHero: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 99, 56, 0.4)',
  },
  avatarImg: {
    width: 52,
    height: 52,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginTop: 4,
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  orgIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  moduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  moduleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
