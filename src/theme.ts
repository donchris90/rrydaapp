// Design system for the app's "live entertainment" surfaces (Party, Game
// Center, Sum Dice, Profile) and now everything else too. Palette is
// still grounded in the reference-app screenshots analyzed earlier in
// this project (deep purple rooms, gold coin/gift accents, hot-pink
// highlights) — this pass extends it into a full token set (gradients,
// type scale, shadows, motion durations) so every screen pulls from one
// source instead of re-deriving its own purple.
export const colors = {
  // Backgrounds — three depths so panels can sit "in front of" the room
  // behind them instead of everything being one flat purple.
  bgDeepest: '#120B26', // screen edges / gradient far end
  background: '#1A1332', // base screen fill, matches the original
  bgElevated: '#241A3D', // gradient near end / glow blob base

  surface: '#241C43', // cards, list rows
  surfaceRaised: '#2E2453', // modals, the "on top of a card" layer
  surfaceGlass: 'rgba(255,255,255,0.06)', // glassy overlays on top of imagery

  primary: '#7B4DFF', // brighter electric violet — buttons, active states
  primaryDeep: '#5B3DF5', // gradient end / pressed state
  gold: '#FFC24B', // coins, gifts, wallet — warmer & brighter than before
  goldDeep: '#F5A62E',
  pink: '#FF3D8A', // hot pink — wins, hearts, special moments
  pinkDeep: '#C91861',
  live: '#FF3B5C', // reserved specifically for the LIVE badge / red dot

  success: '#3DF5A0',
  danger: '#F5495B',

  textPrimary: '#FFFFFF',
  textSecondary: '#B0A6D6', // muted lavender-grey
  textMuted: '#7A6FA0',
  textOnLight: '#1A1332',
  cardBackground: '#FFFFFF',
  border: '#3A3268',
  borderLight: 'rgba(255,255,255,0.10)',
};

// Named gradient stops — pass straight into <LinearGradient colors={...}>.
export const gradients = {
  hero: [colors.primary, colors.pink] as const, // primary CTAs, active tab pill
  heroDeep: [colors.primaryDeep, colors.pinkDeep] as const, // pressed state
  gold: ['#FFDD8A', colors.gold, colors.goldDeep] as const, // coins, wallet
  screen: [colors.bgDeepest, colors.background, colors.bgElevated] as const, // full-bleed screen backdrop
  card: ['rgba(123,77,255,0.18)', 'rgba(255,61,138,0.10)'] as const, // subtle wash on top of a card
  glow: ['rgba(123,77,255,0.55)', 'rgba(123,77,255,0)'] as const, // decorative corner glow blob
  glowPink: ['rgba(255,61,138,0.45)', 'rgba(255,61,138,0)'] as const,
  shimmer: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0)'] as const, // skeleton sweep
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
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
};

// Type scale — one system family, leaning on weight/size/spacing contrast
// rather than a second typeface (keeps this dependency-free for Expo Go).
export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: 0.2 },
  h1: { fontSize: 26, fontWeight: '800' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  stat: { fontSize: 24, fontWeight: '900' as const }, // coin counts, big numbers
};

// Colored "glow" shadows instead of default grey — reads as nightlife/neon
// rather than generic Material elevation. iOS reads shadow*; Android
// mostly just uses elevation, so both are set together.
export const glow = {
  primary: {
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pink: {
    shadowColor: colors.pink,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  gold: {
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

// Shared motion timings so every screen's entrance/press animation feels
// like the same app rather than each screen picking its own speed.
export const motion = {
  fast: 150,
  base: 260,
  slow: 420,
  stagger: 55, // delay added per item in a staggered list entrance
};

// Second palette, used only by the "Me" (Profile) screen. The rest of the
// app is the dark-purple system above; Profile instead matches the actual
// reference-app screenshots directly (Poppo Live's "Me" tab is a light,
// white-card UI with colorful icon chips), rather than reinterpreting it
// in dark purple like the earlier pass did. Kept as its own export instead
// of touching `colors` above so every other screen is unaffected — if the
// rest of the app ever moves to a light theme, this is the seed for it.
export const meColors = {
  bg: '#F3F1FA', // page background — very pale lavender, not flat white
  bgGradient: ['#F6EFF7', '#F1EEFA', '#ECF1FB'] as const, // subtle top-to-bottom wash
  card: '#FFFFFF',
  border: '#EFEDF6',

  textPrimary: '#221F33',
  textSecondary: '#9490A6',
  textMuted: '#B4B0C4',

  completionBg: '#FFE9EA',
  completionText: '#FF4D67',

  coinsGradient: ['#FFE9B0', '#FFCE6B'] as const,
  earningsGradient: ['#FFD9E6', '#FFB6D0'] as const,

  vipGradient: ['#FFE3A3', '#F7C567'] as const,
  vipText: '#8A5A00',

  noticeGradient: ['#7C6CF0', '#5B3DEB'] as const,

  chipRed: '#FF6B6B',
  chipOrange: '#FFA53D',
  chipTeal: '#2AD2B0',
  chipPink: '#FF4D8D',
  chipGreen: '#31C48D',
  chipPurple: '#8B5CF6',
  chipBlue: '#4D8DFF',
  chipYellow: '#F5B93D',

  danger: '#FF4D67',
};

export type MeGridColor =
  | 'chipRed'
  | 'chipOrange'
  | 'chipTeal'
  | 'chipPink'
  | 'chipGreen'
  | 'chipPurple'
  | 'chipBlue'
  | 'chipYellow';
