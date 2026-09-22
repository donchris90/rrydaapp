// The choices the video editor offers. The names are the ones the server renders
// (see the backend's edit-spec.ts): keep the two in step.

export type FilterName = 'none' | 'vivid' | 'warm' | 'cool' | 'mono' | 'vintage' | 'fade' | 'dramatic';
export type EffectName = 'none' | 'vignette' | 'grain' | 'pulse' | 'sharpen' | 'glow';
export type Speed = 0.5 | 1 | 1.5 | 2;

// `tint` is only a rough hint drawn over the preview; the finished video has the exact look.
export const FILTERS: { key: FilterName; label: string; tint: string | null }[] = [
  { key: 'none', label: 'None', tint: null },
  { key: 'vivid', label: 'Vivid', tint: 'rgba(255,60,120,0.08)' },
  { key: 'warm', label: 'Warm', tint: 'rgba(255,140,0,0.16)' },
  { key: 'cool', label: 'Cool', tint: 'rgba(0,120,255,0.16)' },
  { key: 'mono', label: 'Mono', tint: 'rgba(120,120,120,0.40)' },
  { key: 'vintage', label: 'Vintage', tint: 'rgba(180,120,60,0.22)' },
  { key: 'fade', label: 'Fade', tint: 'rgba(255,255,255,0.14)' },
  { key: 'dramatic', label: 'Drama', tint: 'rgba(0,0,0,0.20)' },
];

export const EFFECTS: { key: EffectName; label: string; icon: string }[] = [
  { key: 'none', label: 'None', icon: '🚫' },
  { key: 'vignette', label: 'Vignette', icon: '🌑' },
  { key: 'grain', label: 'Grain', icon: '📽️' },
  { key: 'pulse', label: 'Pulse', icon: '💓' },
  { key: 'sharpen', label: 'Sharpen', icon: '🔍' },
  { key: 'glow', label: 'Glow', icon: '✨' },
];

export const SPEEDS: Speed[] = [0.5, 1, 1.5, 2];

export const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF2E7E', '#FFC24B', '#3DF5A0', '#2E90FF', '#B36BFF'];

export const STICKERS = ['😂', '😍', '🔥', '❤️', '👏', '🎉', '😎', '🥳', '😭', '🙌', '💯', '✨', '🌹', '👑', '💎', '🎵', '⭐', '🍀', '💋', '🤩', '😘', '🙏', '💃', '🕺', '🎶', '💥', '🌈', '🦋'];

// Every edited video is a 9:16 canvas. A video whose shape is close to a phone
// screen fills it; any other shape is shown whole with bars (the same rule as the server).
export function canvasFit(aspect: number): 'cover' | 'contain' {
  return aspect >= 0.5 && aspect <= 0.66 ? 'cover' : 'contain';
}

export interface OverlayItem {
  id: string;
  kind: 'text' | 'sticker';
  text: string; // the words, or the emoji
  color: string;
  size: number; // font size in points on a 360-wide canvas (scaled to the real canvas width)
  x: number; // centre, 0..1 across the canvas
  y: number; // centre, 0..1 down the canvas
}

export interface MusicChoice {
  uri: string;
  name: string;
  mimeType: string;
  volumeOriginal: number; // 0..1
  volumeMusic: number; // 0..1
}

export interface EditChoices {
  trimStartMs: number;
  trimEndMs: number;
  speed: Speed;
  filter: FilterName;
  effect: EffectName;
}

// True when nothing would change the video, so it can be posted as it is (no server work).
export function isPlainPost(c: EditChoices, durationMs: number, hasOverlay: boolean, hasMusic: boolean): boolean {
  return c.trimStartMs <= 0 && c.trimEndMs >= durationMs - 50 && c.speed === 1 && c.filter === 'none' && c.effect === 'none' && !hasOverlay && !hasMusic;
}
