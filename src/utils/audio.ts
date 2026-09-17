// Synthesized Web Audio API sound effects for BC.Game Crash
class AudioManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Short crisp click
  public playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context might be restricted before gesture
    }
  }

  // Countdown second beep
  public playCountdownTick(isFinal: boolean = false) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const freq = isFinal ? 880 : 440;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(isFinal ? 0.12 : 0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isFinal ? 0.18 : 0.08));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + (isFinal ? 0.2 : 0.1));
    } catch {}
  }

  // Rocket engine pitch modulation
  public startFlightSound() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      this.stopFlightSound();

      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(80, this.ctx.currentTime);

      // Low pass filter to make the engine sound punchy and deep
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.engineGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.5);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch {}
  }

  public updateFlightPitch(multiplier: number) {
    if (this.isMuted || !this.engineOsc || !this.ctx) return;
    try {
      // Frequency ramps up smoothly with logarithm of multiplier
      const targetFreq = Math.min(600, 80 + Math.log2(multiplier) * 75);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch {}
  }

  public stopFlightSound() {
    try {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        if (this.engineOsc) {
          try {
            this.engineOsc.stop();
            this.engineOsc.disconnect();
          } catch {}
          this.engineOsc = null;
        }
      }, 80);
    } catch {}
  }

  // Cash out triumph chime with cheerful harmonic arpeggio
  public playCashOut() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0, this.ctx!.currentTime + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.09, this.ctx!.currentTime + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.06);
        osc.stop(this.ctx!.currentTime + idx * 0.06 + 0.38);
      });
    } catch {}
  }

  // Crash explosion thump with filtered noise and sub bass
  public playCrash() {
    this.stopFlightSound();
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Sub drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);

      // Noise burst for explosion texture
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      noiseFilter.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.3);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // Reel lock thud with high-friction spring sound
  public playReelLock() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  // Rapid mechanical tick for spinning reels
  public playReelTick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600 + Math.random() * 200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {}
  }

  // Chip placement sound
  public playChip() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {}
  }

  // Grand winning fanfare for Lucky Number sum match
  public playGrandWin() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const chords = [
        [523.25, 659.25, 783.99],       // C
        [587.33, 739.99, 880.00],       // D
        [659.25, 830.61, 987.77],       // E
        [783.99, 987.77, 1174.66, 1567.98] // G + high C
      ];
      chords.forEach((chord, step) => {
        const time = this.ctx!.currentTime + step * 0.12;
        chord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.04, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(time);
          osc.stop(time + 0.45);
        });
      });
    } catch {}
  }
}

export const audio = new AudioManager();
