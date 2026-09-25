export const spacing = {
  '2xs': 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  xxl: 48,
  screen: { padding: 20, paddingHorizontal: 20, headerHeight: 72, sectionGap: 28, cardPadding: 20 },
};

export const radius = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const border = {
  thin: 1,
  thick: 2,
} as const;

export const sizes = {
  icon: 48,
  avatar: 88,
  statCard: 160,
  rankBadge: 32,
} as const;

export const typography = {
  display: 36,
  h1: 32,
  h2: 28,
  h3: 24,
  title: 20,
  body: 16,
  caption: 14,
  label: 12,
  xxl: 34,
  xl: 26,
  lg: 20,
  lineHeights: {
    display: 44,
    h1: 40,
    h2: 34,
    h3: 30,
    title: 28,
    body: 24,
    caption: 20,
    label: 18,
  },
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 20, elevation: 2 } as const,
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 28, elevation: 4 } as const,
  lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 40, elevation: 8 } as const,
};

export const opacities = {
  micro: 0.06,
  subtle: 0.1,
  dim: 0.3,
  overlay: 0.4,
  disabled: 0.5,
  press: 0.6,
  muted: 0.7,
};

export const gradientPresets = {
  primary: ['#0D6338', '#16804B'] as const,
  accent: ['#f59e0b', '#d97706'] as const,
  success: ['#10b981', '#059669'] as const,
  election: ['#0D6338', '#10B981'] as const,
};

export const statusPalette = {
  verified: 'verified',
  pending: 'pending',
  disputed: 'disputed',
  rejected: 'rejected',
} as const;

export type ResultStatus = keyof typeof statusPalette;

export const animation = {
  fast: 150,
  xfast: 200,
  normal: 300,
  slow: 500,
  xslow: 800,
};

export const spring = {
  snappy: { tension: 220, friction: 22 },
  bouncy: { tension: 180, friction: 14 },
  gentle: { tension: 120, friction: 18 },
} as const;
