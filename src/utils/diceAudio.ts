import type { SoundSettings } from '../components/dice/luckyNumberTypes';
import { playSound } from './gameAudio';

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  master: true,
  betting: true,
  win: true,
  lose: true,
};

// The dice game's sound effects. These used to synthesize tones with the browser's
// Web Audio, which does not exist in a phone app, so nothing was ever heard. They now
// play real sound files (see gameAudio.ts); the game's own sound settings still decide
// which of them play, and the speaker button in the games can silence everything.

export function playBetSound(settings: SoundSettings = DEFAULT_SOUND_SETTINGS): void {
  if (!settings.master || !settings.betting) return;
  playSound('bet');
}

export function playWinSound(settings: SoundSettings = DEFAULT_SOUND_SETTINGS): void {
  if (!settings.master || !settings.win) return;
  playSound('win');
}

// The screen shake on a loss is wired through here: it happens even when the sound
// itself is switched off.
type LoseSoundListener = () => void;
const loseSoundListeners = new Set<LoseSoundListener>();

export function onLoseSound(listener: LoseSoundListener): () => void {
  loseSoundListeners.add(listener);
  return () => {
    loseSoundListeners.delete(listener);
  };
}

export function playLoseSound(settings: SoundSettings = DEFAULT_SOUND_SETTINGS, onShakeCallback?: () => void): void {
  onShakeCallback?.();
  loseSoundListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* a listener must never stop the sound */
    }
  });
  if (!settings.master || !settings.lose) return;
  playSound('lose');
}
