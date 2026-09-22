// Ryda Party Live theme adapter.
// Party Live uses the same brand/accent palette as the main Home screen.
// The dark live-room canvas is retained for camera/video contrast.
import { colors as appColors, gradients as appGradients, spacing as appSpacing, radii as appRadii, type as appType } from '../theme';

export const colors = {
  bgDeepest: '#0B0814',
  background: '#120E22',
  bgElevated: '#171328',
  surface: '#1B1530',
  surfaceRaised: '#261D40',
  surfaceGlass: 'rgba(255,255,255,0.08)',

  primary: appColors.primary,
  primaryDeep: appColors.primaryDeep,
  primaryLight: appColors.primary,
  gold: appColors.gold,
  goldDeep: appColors.goldDeep,
  pink: appColors.pink,
  pinkDeep: appColors.pinkDeep,
  live: appColors.live,
  success: appColors.success,
  danger: appColors.danger,

  audioWave: appColors.success,
  audioWaveGlow: 'rgba(16,185,129,0.35)',
  hostGlow: 'rgba(255,184,0,0.40)',

  textPrimary: '#FFFFFF',
  textSecondary: '#D5D0E2',
  textMuted: '#9B94AD',
  textOnLight: appColors.textPrimary,

  border: '#3A3154',
  borderLight: 'rgba(255,255,255,0.12)',
};

export const gradients = {
  hero: appGradients.hero,
  heroDeep: appGradients.heroDeep,
  gold: appGradients.gold,
  screen: ['#0B0814', '#120E22', '#171328'] as const,
  hostCrown: ['#FFE270', appColors.gold, appColors.goldDeep] as const,
  pkRed: [appColors.primary, appColors.primaryDeep] as const,
  pkBlue: [appColors.secondary, appColors.violet] as const,
  cosmic: ['#24163D', '#120B25'] as const,
  neonClub: ['#1B0D2D', '#3A123F'] as const,
  goldenRoyale: ['#2B1E05', '#160E02'] as const,
};

export const spacing = appSpacing;
export const radii = appRadii;
export const type = appType;
export const glow = {
  primary: {
    shadowColor: appColors.primary,
    shadowOpacity: 0.40,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  gold: {
    shadowColor: appColors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pink: {
    shadowColor: appColors.pink,
    shadowOpacity: 0.40,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
};
