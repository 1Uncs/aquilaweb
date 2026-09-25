import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useColorScheme } from '@/core/hooks/useColorScheme';

import Colors from '@/constants/colors';

function pushOptions(title: string, scheme: 'light' | 'dark') {
  const colors = Colors[scheme];
  return {
    headerShown: true,
    title,
    headerBackTitle: 'Back',
    headerTintColor: colors.text,
    headerTitleStyle: {
      fontWeight: '600' as const,
      fontSize: 17,
      color: colors.text,
    },
    ...(Platform.OS === 'ios'
      ? {
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal' as const,
        }
      : {
          headerTransparent: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
        }),
  };
}

export default function AppLayout() {
  const scheme = useColorScheme() ?? 'light';
  const rootBg = scheme === 'dark' ? '#070C09' : '#F8FAF9';

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: rootBg },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="election-detail" options={pushOptions('Election Details', scheme)} />
      <Stack.Screen name="result-submit" options={pushOptions('Submit Result', scheme)} />
      <Stack.Screen name="result-detail" options={pushOptions('Result Details', scheme)} />
      <Stack.Screen name="result-collation" options={pushOptions('Result Collation', scheme)} />
      <Stack.Screen name="result-search" options={pushOptions('Search Results', scheme)} />
      <Stack.Screen name="incident-report" options={pushOptions('Report Incident', scheme)} />
      <Stack.Screen name="incident-search" options={pushOptions('Search Incidents', scheme)} />
      <Stack.Screen name="incident-detail" options={pushOptions('Incident Details', scheme)} />
      <Stack.Screen name="result-drafts" options={pushOptions('Drafts Queue', scheme)} />
      <Stack.Screen name="pu-picker" options={pushOptions('Select Polling Unit', scheme)} />
      <Stack.Screen name="locations" options={pushOptions('Locations', scheme)} />
      <Stack.Screen name="parties" options={pushOptions('Political Parties', scheme)} />
    </Stack>
  );
}
