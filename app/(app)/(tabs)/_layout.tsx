import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from '@/core/hooks/useColorScheme';
import Colors from '@/constants/colors';
import { ScreenViewContext } from '@/core/components/ScreenView';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScreenViewContext.Provider value={{ isTab: true }}>
      <NativeTabs
      iconColor={{ default: colors.textMuted, selected: colors.primary }}
      labelStyle={{ fontSize: 10 }}
      backgroundColor={colors.surface}
      disableTransparentOnScrollEdge
      blurEffect="systemChromeMaterial"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="elections">
        <NativeTabs.Trigger.Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} md="description" />
        <NativeTabs.Trigger.Label>Elections</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="results">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="bar_chart" />
        <NativeTabs.Trigger.Label>Results</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="incidents">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'exclamationmark.triangle', selected: 'exclamationmark.triangle.fill' }}
          md="warning"
        />
        <NativeTabs.Trigger.Label>Incidents</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      </NativeTabs>
    </ScreenViewContext.Provider>
  );
}
