// Design system for Rryda / Poppo Live entertainment games and Lucky Number (Sum Dice)
export const colors = {
  bgDeepest: '#0A0E2A',
  background: '#0D1440',
  bgElevated: '#151E5A',
  surface: '#1E2B7A',
  surfaceRaised: '#243497',
  surfaceGlass: 'rgba(255, 255, 255, 0.08)',
  
  // Game primary branding (Poppo Lucky Number Palette)
  vortexDeep: '#060B28',
  vortexMid: '#0F2B88',
  vortexCyan: '#00D2FF',
  
  // Accent & Card colors
  primary: '#3B82F6',
  primaryDeep: '#1D4ED8',
  boardCardSelected: '#2563EB',
  boardCardUnselected: '#EDF2F7',
  boardCardUnderline: '#CBD5E1',
  
  gold: '#FFC226',
  goldDeep: '#F59E0B',
  goldLight: '#FEF08A',
  goldPill: '#FDE047',
  goldPillInactive: '#FEF3C7',
  
  coralBet: '#FF4E6E',
  coralBetDark: '#E11D48',
  timerRed: '#EF4444',
  timerSalmon: '#F87171',
  
  cyanGlow: '#38BDF8',
  purpleAccent: '#8B5CF6',
  success: '#10B981',
  
  textWhite: '#FFFFFF',
  textDark: '#0F172A',
  textMuted: '#94A3B8',
  textGold: '#854D0E',
  
  border: 'rgba(255, 255, 255, 0.15)',
  borderCyan: 'rgba(56, 189, 248, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

export const type = {
  display: { fontSize: 28, fontWeight: '800' as const },
  h1: { fontSize: 22, fontWeight: '800' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodyStrong: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
  stat: { fontSize: 20, fontWeight: '900' as const },
};
