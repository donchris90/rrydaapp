// The maths behind drawing the Crash flight smoothly. Kept free of React so it can
// be tested on its own.
//
// The server tells us, every third of a second or so, how long the round has been
// flying (`elapsedMs`) and its growth rate. The multiplier is a known curve of that
// time — floor(e^(rate x seconds) x 100) / 100 — so between checks the phone works
// out the multiplier itself, many times a second, instead of jumping each time an
// answer arrives. Each answer only nudges the phone's clock back into line.

export interface FlightClock {
  growthRate: number;
  // How long the round had been flying at `at` (a time on THIS phone's clock).
  elapsedMs: number;
  at: number;
}

// The picture runs a little behind real time. The moment of the crash is only known
// when the server says so, which takes a moment to arrive; showing the flight this
// far behind means the rocket never visibly flies past the crash point.
export const DISPLAY_LAG_MS = 150;

export function flightElapsedMs(clock: FlightClock, now: number, lagMs = DISPLAY_LAG_MS): number {
  return Math.max(0, clock.elapsedMs + (now - clock.at) - lagMs);
}

export function multiplierAtMs(growthRate: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 1;
  return Math.floor(Math.exp(growthRate * (elapsedMs / 1000)) * 100) / 100;
}

export function flightMultiplier(clock: FlightClock, now: number): number {
  return multiplierAtMs(clock.growthRate, flightElapsedMs(clock, now));
}

// Folds a fresh answer from the server into the clock. `sentAt` and `receivedAt` are
// this phone's times around the request; the server measured its `elapsedMs` roughly
// half-way between them. A small difference from what the clock predicted is only
// partly applied (so the flight never twitches); a large one — a stall, a long
// pause — resets the clock.
export function syncClock(prev: FlightClock | null, sample: { growthRate: number; elapsedMs: number; sentAt: number; receivedAt: number }): FlightClock {
  const at = (sample.sentAt + sample.receivedAt) / 2;
  const fresh: FlightClock = { growthRate: sample.growthRate, elapsedMs: sample.elapsedMs, at };
  if (!prev || prev.growthRate !== sample.growthRate) return fresh;
  const predicted = prev.elapsedMs + (at - prev.at);
  const error = sample.elapsedMs - predicted;
  if (Math.abs(error) > 400) return fresh;
  return { growthRate: prev.growthRate, elapsedMs: predicted + error * 0.25, at };
}

// ── the picture ──────────────────────────────────────────────────

// The view follows the flight: a window on time and on the multiplier that grows as
// the rocket climbs, so the rocket stays in view and moves at a steady pace at any speed.
export function flightWindow(elapsedMs: number, growthRate: number): { maxT: number; maxM: number } {
  const t = elapsedMs / 1000;
  return { maxT: Math.max(6, t * 1.1 + 0.5), maxM: Math.max(2, Math.exp(growthRate * t) * 1.12) };
}

export interface Pad {
  l: number;
  r: number;
  t: number;
  b: number;
}

export function trajectory(growthRate: number, elapsedMs: number, w: number, h: number, pad: Pad, count = 32) {
  const { maxT, maxM } = flightWindow(elapsedMs, growthRate);
  const tEnd = elapsedMs / 1000;
  const spanX = w - pad.l - pad.r;
  const spanY = h - pad.t - pad.b;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = (tEnd * i) / (count - 1);
    const m = Math.exp(growthRate * t);
    points.push({ x: pad.l + (t / maxT) * spanX, y: h - pad.b - ((m - 1) / (maxM - 1)) * spanY });
  }
  // How steeply the curve is climbing right now, so the rocket can point along it.
  const mEnd = Math.exp(growthRate * tEnd);
  const slopeUp = ((growthRate * mEnd) / (maxM - 1)) * spanY; // screen pixels up, per second
  const slopeRight = spanX / maxT; // screen pixels right, per second
  const angleDeg = Math.min(80, Math.max(8, (Math.atan2(slopeUp, slopeRight) * 180) / Math.PI));
  return { points, head: points[points.length - 1], angleDeg };
}

export function pathOf(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

// The 🚀 emoji points up and to the right (45 degrees); turn it to follow the curve.
export const rocketRotationDeg = (angleDeg: number) => 45 - angleDeg;

// ── what the screen should be showing ──────────────────────────────

export type Phase = 'COUNTDOWN' | 'STARTING' | 'FLYING' | 'CRASHED';

// `round` is the newest round that is open or in flight (or null); `status` is the
// last answer from the multiplier check for it; `holdUntil` keeps the crash result on
// screen for a few seconds after the round ends, before the next countdown takes over.
export function derivePhase(input: { round: { status: string; lockAt: string } | null; live: boolean; crashed: boolean; now: number; holdUntil: number }): Phase {
  const { round, live, crashed, now, holdUntil } = input;
  if (!round) return now < holdUntil ? 'CRASHED' : 'COUNTDOWN';
  if (round.status === 'OPEN') return now >= new Date(round.lockAt).getTime() ? 'STARTING' : 'COUNTDOWN';
  // LOCKED: in flight
  if (crashed) return 'CRASHED';
  return live ? 'FLYING' : 'STARTING';
}
