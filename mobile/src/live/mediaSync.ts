import type { LiveMediaState } from '../api/liveMedia';

// Pure timing rules for keeping a shared video in step, kept apart from the player
// so they can be tested on their own.

// The moment a message arrived, on OUR clock, lets us turn the server's clock into
// ours: offset = how far ahead the server is. Then "where should the video be now?"
// is the position at `updatedAt` plus the time since then (if it is playing).
export function expectedPositionMs(state: LiveMediaState, receivedAt: number, now: number): number {
  if (state.status !== 'PLAYING') return state.positionMs;
  const offset = state.serverNow - receivedAt;
  return state.positionMs + Math.max(0, now + offset - state.updatedAt);
}

// Below this, a small difference is left alone (seeking every time would stutter);
// above it the viewer jumps to where the host is.
export const DRIFT_TOLERANCE_MS = 1500;

export function needsSeek(currentMs: number, expectedMs: number, tolerance = DRIFT_TOLERANCE_MS): boolean {
  return Math.abs(currentMs - expectedMs) > tolerance;
}
