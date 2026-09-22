import { useSyncExternalStore } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';

// Sound for the games. (The old dice code used the browser's Web Audio, which does
// not exist on a phone, and Crash had none at all — so both were silent.)
//
// Short effects are loaded the first time they are needed and kept, so a sound
// plays instantly the next time. The rocket engine is one seamless loop whose pitch
// and speed rise with the multiplier.

export type SoundName = 'bet' | 'tick' | 'cashout' | 'crash' | 'win' | 'lose' | 'click' | 'lock';

const SOURCES: Record<SoundName | 'engine', number> = {
  bet: require('../../assets/sounds/bet.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  cashout: require('../../assets/sounds/cashout.wav'),
  crash: require('../../assets/sounds/crash.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
  click: require('../../assets/sounds/click.wav'),
  lock: require('../../assets/sounds/lock.wav'),
  engine: require('../../assets/sounds/engine.wav'),
};

const PREF_KEY = 'rryda.gameSounds';
let enabled = true;
let modeSet = false;
const players = new Map<string, AudioPlayer>();
const listeners = new Set<() => void>();

// The person's choice (the speaker button in the games) is remembered.
SecureStore.getItemAsync(PREF_KEY)
  .then((v) => {
    if (v === '0') {
      enabled = false;
      listeners.forEach((l) => l());
    }
  })
  .catch(() => {});

async function ensureMode() {
  if (modeSet) return;
  modeSet = true;
  try {
    // Games are played on purpose: sound plays even with the silent switch on (iPhone),
    // and it mixes with music instead of stopping it.
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
  } catch {
    /* sound is a nicety: never let it break a game */
  }
}

function player(name: SoundName | 'engine'): AudioPlayer {
  let p = players.get(name);
  if (!p) {
    p = createAudioPlayer(SOURCES[name]);
    players.set(name, p);
  }
  return p;
}

export function playSound(name: SoundName, volume = 1): void {
  if (!enabled) return;
  void (async () => {
    try {
      await ensureMode();
      const p = player(name);
      p.volume = volume;
      await p.seekTo(0);
      p.play();
    } catch {
      /* ignore */
    }
  })();
}

// ── the rocket engine ──────────────────────────────────────────────
let engineOn = false;
let lastRateAt = 0;

export function startEngine(): void {
  if (!enabled || engineOn) return;
  engineOn = true;
  void (async () => {
    try {
      await ensureMode();
      const p = player('engine');
      p.loop = true;
      p.volume = 0.5;
      // Let the pitch rise with the speed (by default the pitch is held constant).
      p.shouldCorrectPitch = false;
      p.playbackRate = 0.9;
      await p.seekTo(0);
      if (engineOn) p.play();
    } catch {
      engineOn = false;
    }
  })();
}

// 1.00x -> a low rumble; it climbs as the multiplier does, up to a whine.
export function engineRateFor(multiplier: number): number {
  const m = Math.max(1, multiplier);
  return Math.min(2, 0.9 + 0.34 * Math.log2(m));
}

export function setEngineMultiplier(multiplier: number): void {
  if (!engineOn) return;
  const now = Date.now();
  if (now - lastRateAt < 120) return; // no need to change it more often than that
  lastRateAt = now;
  try {
    const p = player('engine');
    p.playbackRate = engineRateFor(multiplier);
    p.volume = Math.min(0.9, 0.5 + 0.1 * Math.log2(Math.max(1, multiplier)));
  } catch {
    /* ignore */
  }
}

export function stopEngine(): void {
  if (!engineOn) return;
  engineOn = false;
  try {
    const p = players.get('engine');
    p?.pause();
  } catch {
    /* ignore */
  }
}

// ── on / off ───────────────────────────────────────────────────────
export function areSoundsEnabled(): boolean {
  return enabled;
}

export function setSoundsEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopEngine();
  listeners.forEach((l) => l());
  SecureStore.setItemAsync(PREF_KEY, on ? '1' : '0').catch(() => {});
}

export function useSoundsEnabled(): [boolean, () => void] {
  const value = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled,
    () => enabled,
  );
  return [value, () => setSoundsEnabled(!enabled)];
}
