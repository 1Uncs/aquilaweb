export const FONT_FAMILY = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  bold: 'Inter-Bold',
} as const;

export type FontFamily = typeof FONT_FAMILY[keyof typeof FONT_FAMILY];

import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';

export const fontMap = {
  [FONT_FAMILY.regular]: Inter_400Regular,
  [FONT_FAMILY.medium]: Inter_500Medium,
  [FONT_FAMILY.bold]: Inter_700Bold,
} as const;
