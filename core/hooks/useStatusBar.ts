import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useColorScheme as _useRNColorScheme } from 'react-native';
import { setStatusBarStyle, setStatusBarHidden } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';

type StatusBarConfig = {
  barStyle?: 'light' | 'dark' | 'auto';
  hidden?: boolean;
};

export function useStatusBar(config: StatusBarConfig) {
  const { barStyle = 'auto', hidden = false } = config;
  const scheme = _useRNColorScheme() ?? 'light';

  useFocusEffect(
    useCallback(() => {
      const resolvedStyle = barStyle === 'auto' ? (scheme === 'dark' ? 'light' : 'dark') : barStyle;
      setStatusBarStyle(resolvedStyle, true);
      setStatusBarHidden(hidden, 'fade');

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          setStatusBarStyle(resolvedStyle, true);
          setStatusBarHidden(hidden, 'fade');
        }
      });

      return () => {
        subscription.remove();
      };
    }, [barStyle, hidden, scheme])
  );
}
