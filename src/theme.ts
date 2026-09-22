// Rryda global design system — Poppo/Bigo-inspired porcelain light theme
// with a coordinated midnight mode. All shared surfaces, gradients, type,
// spacing and radii are defined here so the visual language stays consistent.
// Gradient colour lists. `as const` would give each theme its own exact literal
// tuple type ('#FFFFFF' vs '#0B0814'), making `colors` and `midnightColors`
// different types so neither could be used where the other is expected (the
// theme context switches between them). A plain string tuple keeps one shared
// type and is still what LinearGradient's `colors` prop accepts.
const grad = (...c: [string, string, ...string[]]): readonly [string, string, ...string[]] => c;

export const colors = {
  background: '#F6F8FC',
  bgDeepest: '#F6F8FC',
  bgElevated: '#EFF3FA',
  surface: '#FFFFFF',
  surfaceRaised: '#F0F3FA',
  surfaceGlass: 'rgba(255,255,255,0.88)',
  primary: '#FF2E7E',
  primaryDeep: '#E61565',
  primaryLight: '#FFE8F1',
  secondary: '#00C4FF',
  secondaryDeep: '#0097DB',
  secondaryLight: '#E5F8FF',
  violet: '#7B42F6',
  violetLight: '#F1ECFD',
  gold: '#FFB800',
  goldDeep: '#F59E0B',
  goldLight: '#FFF7DB',
  pink: '#FF2E7E',
  pinkDeep: '#E61565',
  coral: '#FF6B4A',
  live: '#FF2D55',
  pk: '#FF1361',
  party: '#8A2BE2',
  game: '#10B981',
  success: '#10B981',
  danger: '#EF4444',
  textPrimary: '#14121E',
  textSecondary: '#5E5A73',
  textMuted: '#9692A8',
  textWhite: '#FFFFFF',
  textOnLight: '#14121E',
  border: '#E8EAF2',
  borderLight: '#F0F2F8',
  borderGlass: 'rgba(255,255,255,0.45)',
  cardBackground: '#FFFFFF',
  bgGradient: grad('#FFFFFF', '#F6F8FC', '#EFF3FA'),
  card: '#FFFFFF',
  completionBg: '#FFE8F1', completionText: '#FF2E7E',
  coinsGradient: grad('#FFF1B8', '#FFCE6B'),
  earningsGradient: grad('#FFD9E6', '#FFB6D0'),
  vipGradient: grad('#FFE3A3', '#F7C567'), vipText: '#8A5A00',
  noticeGradient: grad('#7B42F6', '#5B3DF5'),
  chipRed: '#FF6B6B', chipOrange: '#FFA53D', chipTeal: '#2AD2B0', chipPink: '#FF4D8D',
  chipGreen: '#31C48D', chipPurple: '#8B5CF6', chipBlue: '#4D8DFF', chipYellow: '#F5B93D',
};

export const midnightColors = {
  ...colors,
  background: '#0B0814',
  bgDeepest: '#0B0814',
  bgElevated: '#171328',
  surface: '#171328',
  surfaceRaised: '#211A39',
  surfaceGlass: 'rgba(23,19,40,0.90)',
  primaryLight: '#3B1829',
  secondaryLight: '#102D39',
  violetLight: '#281B4B',
  goldLight: '#3A2B09',
  textPrimary: '#F7F4FF',
  textSecondary: '#B9B1CC',
  textMuted: '#817A97',
  textOnLight: '#F7F4FF',
  border: '#2B2342',
  borderLight: 'rgba(255,255,255,0.10)',
  borderGlass: 'rgba(255,255,255,0.12)',
  cardBackground: '#171328',
  bgGradient: grad('#0B0814', '#120E22', '#171328'),
  card: '#171328',
  completionBg: '#3B1829', completionText: '#FF5A98',
  coinsGradient: grad('#4A3A12', '#6B5318'),
  earningsGradient: grad('#4A1E32', '#6B2848'),
  vipGradient: grad('#4A3817', '#6B511F'), vipText: '#FFD98A',
  noticeGradient: grad('#3B1A58', '#281B4B'),
  chipRed: '#B83E5D', chipOrange: '#B66A28', chipTeal: '#238C79', chipPink: '#B63B72',
  chipGreen: '#248D69', chipPurple: '#6845B6', chipBlue: '#3C69B6', chipYellow: '#A77D24',
};

export const gradients = {
  hero: ['#FF2E7E', '#FF6B4A'] as const,
  heroDeep: ['#E61565', '#E8532F'] as const,
  bigoCyan: ['#00C4FF', '#7B42F6'] as const,
  gold: ['#FFD200', '#FF9500'] as const,
  goldCrown: ['#FFD200', '#FF9500'] as const,
  pkBattle: ['#FF1361', '#FF6B00'] as const,
  partyRoom: ['#9D4EDD', '#5B3DF5'] as const,
  gameCenter: ['#00E676', '#00B0FF'] as const,
  screen: ['#FFFFFF', '#F6F8FC', '#EFF3FA'] as const,
  screenMidnight: ['#0B0814', '#120E22', '#171328'] as const,
  card: ['rgba(255,46,126,0.08)', 'rgba(0,196,255,0.06)'] as const,
  glow: ['rgba(0,196,255,0.28)', 'rgba(0,196,255,0)'] as const,
  glowPink: ['rgba(255,46,126,0.28)', 'rgba(255,46,126,0)'] as const,
  cardScrim: ['transparent', 'rgba(12,8,28,0.40)', 'rgba(10,6,24,0.88)'] as const,
  shimmer: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.40)', 'rgba(255,255,255,0)'] as const,
};

export const spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, xxl: 40 };
export const radii = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const type = {
  display: { fontSize: 30, fontWeight: '900' as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodyStrong: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  captionSmall: { fontSize: 10, fontWeight: '700' as const },
  stat: { fontSize: 22, fontWeight: '900' as const },
};
export const glow = {
  primary: { shadowColor: '#FF2E7E', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  pink: { shadowColor: '#FF2E7E', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  gold: { shadowColor: '#FF9500', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  card: { shadowColor: '#1A1538', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
};
export const motion = { fast: 140, base: 240, slow: 380, stagger: 50 };

export const meColors = {
  bg: '#F6F8FC',
  bgGradient: ['#FFFFFF', '#F6F8FC', '#EFF3FA'] as const,
  card: '#FFFFFF', border: '#E8EAF2',
  textPrimary: '#14121E', textSecondary: '#5E5A73', textMuted: '#9692A8',
  completionBg: '#FFE8F1', completionText: '#FF2E7E',
  coinsGradient: ['#FFF1B8', '#FFCE6B'] as const,
  earningsGradient: ['#FFD9E6', '#FFB6D0'] as const,
  vipGradient: ['#FFE3A3', '#F7C567'] as const, vipText: '#8A5A00',
  noticeGradient: ['#7B42F6', '#5B3DF5'] as const,
  chipRed: '#FF6B6B', chipOrange: '#FFA53D', chipTeal: '#2AD2B0', chipPink: '#FF4D8D',
  chipGreen: '#31C48D', chipPurple: '#8B5CF6', chipBlue: '#4D8DFF', chipYellow: '#F5B93D',
  danger: '#FF4D67',
};
export type MeGridColor = 'chipRed'|'chipOrange'|'chipTeal'|'chipPink'|'chipGreen'|'chipPurple'|'chipBlue'|'chipYellow';
