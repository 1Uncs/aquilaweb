import { useColorScheme as _useRNColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export function useColorScheme(): ColorScheme {
  const scheme = _useRNColorScheme() ?? 'light';
  return scheme as ColorScheme;
}
