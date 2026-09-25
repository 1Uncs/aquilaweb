import React, { useState } from 'react';
import { Platform, KeyboardAvoidingView, ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText, Input, Button, Card } from '@/core/components';
import { spacing, radius, shadows } from '@/constants/tokens';
import { useLoginMutation } from '@/features/auth/hooks';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import { useStatusBar } from '@/core/hooks/useStatusBar';
import Colors from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const ORG_PRESETS = [
  { id: 'org-aquila', name: 'Aquila Situation Room', tag: 'HQ' },
  { id: 'org-cdd', name: 'CDD West Africa', tag: 'CSO' },
  { id: 'org-yiaga', name: 'YIAGA Africa Watching The Vote', tag: 'CSO' },
  { id: 'org-inec', name: 'INEC Observer Mission', tag: 'OBSERVER' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  useStatusBar({ barStyle: 'light', hidden: false });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(ORG_PRESETS[0]!);
  const [customOrg, setCustomOrg] = useState('');
  const [isCustomOrg, setIsCustomOrg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const loginMutation = useLoginMutation();

  const handleLogin = async () => {
    const orgId = isCustomOrg ? `org-${customOrg.toLowerCase().replace(/\s+/g, '-')}` : selectedOrg.id;
    const orgName = isCustomOrg ? customOrg.trim() : selectedOrg.name;

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    if (isCustomOrg && !customOrg.trim()) {
      setError('Please specify your organization name');
      return;
    }
    setError('');
    try {
      await loginMutation.mutateAsync({
        email: email.trim(),
        password,
        organizationId: orgId,
        organizationName: orgName,
      });
      if (__DEV__) console.log('[login] success', email.trim(), orgName);
    } catch (e) {
      console.warn('[login] failed', e);
      setError('Authentication failed. Please verify credentials.');
    }
  };

  const launchDemo = async (role: 'agent' | 'polling' | 'officer') => {
    setError('');
    try {
      let demoEmail = 'agent@aquila.ng';
      let org = ORG_PRESETS[0]!;
      if (role === 'polling') {
        demoEmail = 'polling@aquila.ng';
        org = ORG_PRESETS[2]!;
      } else if (role === 'officer') {
        demoEmail = 'officer@aquila.ng';
        org = ORG_PRESETS[0]!;
      }

      await loginMutation.mutateAsync({
        email: demoEmail,
        password: 'demo',
        organizationId: org.id,
        organizationName: org.name,
      });
    } catch (e) {
      console.warn('[login] demo failed', role, e);
      setError('Demo login failed. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#070C09' }}>
      <LinearGradient
        colors={['#070C09', '#0D2619', '#0D6338']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          enabled={Platform.OS === 'ios'}
          behavior="padding"
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl,
              paddingHorizontal: spacing.md,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Brand Identity */}
            <View style={styles.headerBlock}>
              <View style={[styles.logoBadge, { borderColor: colors.primaryLight + '44' }]}>
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  source={require('@/assets/eagle-head.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                  priority="high"
                  cachePolicy="memory-disk"
                />
              </View>
              <ThemedText variant="display" color="#FFFFFF" fontFamily="bold" style={styles.brandTitle}>
                AQUILA
              </ThemedText>
              <ThemedText variant="label" color="#10B981" fontFamily="medium" style={styles.brandSub}>
                REAL-TIME ELECTION INTELLIGENCE · MULTI-TENANT CONSOLE
              </ThemedText>
            </View>

            {/* Auth Form Card */}
            <Card style={[styles.formCard, { backgroundColor: colors.surface }]}>
              <ThemedText variant="title" color="text" fontFamily="bold" style={{ marginBottom: spacing.xs }}>
                Sign In to Station
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: spacing.md }}>
                Enter credentials to connect to your assigned situation room.
              </ThemedText>

              {/* Organization Tenant Selector (Audio Part 1) */}
              <View style={{ marginBottom: spacing.md }}>
                <View style={styles.labelRow}>
                  <Ionicons name="business-outline" size={14} color={colors.primary} />
                  <ThemedText variant="label" color="textSecondary" fontFamily="medium" style={{ marginLeft: 4 }}>
                    ORGANIZATION / TENANT
                  </ThemedText>
                </View>
                <View style={styles.orgChipsRow}>
                  {ORG_PRESETS.map((org) => {
                    const active = !isCustomOrg && selectedOrg.id === org.id;
                    return (
                      <Pressable
                        key={org.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setIsCustomOrg(false);
                          setSelectedOrg(org);
                        }}
                        style={[
                          styles.orgChip,
                          {
                            backgroundColor: active ? colors.primary + '16' : colors.borderSubtle,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <ThemedText
                          variant="caption"
                          fontFamily={active ? 'bold' : 'regular'}
                          style={{ color: active ? colors.primary : colors.textSecondary }}
                          numberOfLines={1}
                        >
                          {org.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsCustomOrg(true);
                    }}
                    style={[
                      styles.orgChip,
                      {
                        backgroundColor: isCustomOrg ? colors.primary + '16' : colors.borderSubtle,
                        borderColor: isCustomOrg ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      variant="caption"
                      fontFamily={isCustomOrg ? 'bold' : 'regular'}
                      style={{ color: isCustomOrg ? colors.primary : colors.textSecondary }}
                    >
                      + Custom Org
                    </ThemedText>
                  </Pressable>
                </View>

                {isCustomOrg && (
                  <Input
                    placeholder="Enter custom organization name"
                    value={customOrg}
                    onChangeText={setCustomOrg}
                    autoCapitalize="words"
                    leftIcon="business-outline"
                    containerStyle={{ marginTop: spacing.xs }}
                  />
                )}
              </View>

              <Input
                label="Email"
                placeholder="agent@aquila.ng"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon="mail-outline"
                containerStyle={{ marginBottom: spacing.sm }}
              />

              <Input
                label="Password"
                placeholder="Enter your security passkey"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                secureToggle
                visible={showPassword}
                onToggleSecure={() => setShowPassword((prev) => !prev)}
                leftIcon="lock-closed-outline"
                containerStyle={{ marginBottom: spacing.md }}
              />

              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.errorSubtle, borderColor: colors.error }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <ThemedText variant="caption" color="error" style={{ marginLeft: 6, flex: 1 }}>
                    {error}
                  </ThemedText>
                </View>
              ) : null}

              <Button
                label="Connect & Access Console"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                fullWidth
                leftIcon="shield-checkmark-outline"
                style={{ marginTop: spacing.xs }}
                size="lg"
              />

              {/* Quick Demo Access Buttons */}
              <View style={styles.demoSection}>
                <ThemedText variant="label" color="textMuted" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                  ONE-TAP DEMO ROLES
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <Button
                    label="Field Agent"
                    variant="outline"
                    onPress={() => launchDemo('agent')}
                    loading={loginMutation.isPending}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <Button
                    label="PU Agent"
                    variant="outline"
                    onPress={() => launchDemo('polling')}
                    loading={loginMutation.isPending}
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <Button
                    label="Election Officer"
                    variant="outline"
                    onPress={() => launchDemo('officer')}
                    loading={loginMutation.isPending}
                    style={{ flex: 1.3 }}
                    size="sm"
                  />
                </View>
              </View>
            </Card>

            <ThemedText
              variant="caption"
              color="#A3B8AC"
              style={{ textAlign: 'center', marginTop: spacing.lg }}
            >
              Independent Observer Intelligence System · End-to-End Encrypted
            </ThemedText>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 99, 56, 0.35)',
    marginBottom: spacing.sm,
    ...shadows.lg,
  },
  logoImage: {
    width: 58,
    height: 58,
  },
  brandTitle: {
    letterSpacing: 3,
    fontSize: 28,
  },
  brandSub: {
    letterSpacing: 1.2,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  formCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orgChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  orgChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  demoSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
