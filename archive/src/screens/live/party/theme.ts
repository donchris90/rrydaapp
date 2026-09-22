// Design tokens for Ryda Party & Audio Live in React Native (Expo)
// Matches and extends /tmp/rrydaapp/src/theme.ts with audio live specific colors & glows

export const colors = {
  // Deep Nightlife / Audio Party Canvas
  bgDeepest: '#0E081F',
  background: '#160E2E',
  bgElevated: '#20163F',
  surface: '#261B48',
  surfaceRaised: '#32235E',
  surfaceGlass: 'rgba(255,255,255,0.08)',
  
  // Accents & Signals
  primary: '#8A4FFF',
  primaryDeep: '#6A2DF5',
  primaryLight: '#A879FF',
  gold: '#FFC837',
  goldDeep: '#F59E0B',
  pink: '#FF3388',
  pinkDeep: '#D91B6B',
  live: '#FF2E55',
  success: '#10B981',
  danger: '#EF4444',
  
  // Speaking wave audio pulses
  audioWave: '#34D399',
  audioWaveGlow: 'rgba(52, 211, 153, 0.35)',
  hostGlow: 'rgba(255, 200, 55, 0.45)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B7AFD6',
  textMuted: '#7D74A3',
  textOnLight: '#160E2E',
  
  // Borders
  border: '#3D2F6B',
  borderLight: 'rgba(255,255,255,0.12)',
};

export const gradients = {
  hero: [colors.primary, colors.pink] as const,
  heroDeep: [colors.primaryDeep, colors.pinkDeep] as const,
  gold: ['#FFE270', colors.gold, colors.goldDeep] as const,
  screen: [colors.bgDeepest, colors.background, colors.bgElevated] as const,
  hostCrown: ['#FFF085', '#FFC837', '#FF8C00'] as const,
  pkRed: ['#FF416C', '#FF4B2B'] as const,
  pkBlue: ['#2193B0', '#6DD5ED'] as const,
  cosmic: ['#2D1B69', '#150A30'] as const,
  neonClub: ['#1A0B2E', '#3F125F'] as const,
  goldenRoyale: ['#2B1E05', '#160E02'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const type = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: 0.2 },
  h1: { fontSize: 24, fontWeight: '800' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  h3: { fontSize: 15, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodyStrong: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
  stat: { fontSize: 22, fontWeight: '900' as const },
};

export const glow = {
  primary: {
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pink: {
    shadowColor: colors.pink,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};
