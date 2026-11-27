// Zero-dependency Web Audio API synthesizer for win chimes, losing tones, and step feedback

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore resume errors if called outside gesture
      });
    }
    return this.ctx;
  }

  public unlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // Safe fallback
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Celebratory winning casino bell chime: "Ding! Ding! Ding!"
   * Harmonics: B5 (987.77 Hz) -> E6 (1318.51 Hz) -> G#6 (1661.22 Hz) -> B6 sparkle
   */
  public playBellChime(force = false): void {
    if (this.muted && !force) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const playNow = () => {
      const now = ctx.currentTime + 0.02;
      const notes = [
        { freq: 987.77, delay: 0.0, duration: 0.65, gain: 0.22 },
        { freq: 1318.51, delay: 0.14, duration: 0.65, gain: 0.24 },
        { freq: 1661.22, delay: 0.28, duration: 1.1, gain: 0.28 },
        { freq: 1975.53, delay: 0.41, duration: 0.9, gain: 0.14 },
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, now);
      masterGain.connect(ctx.destination);

      for (const note of notes) {
        const startTime = now + note.delay;
        const partials = [
          { ratio: 1.0, amp: 1.0, decay: note.duration },
          { ratio: 2.0, amp: 0.42, decay: note.duration * 0.72 },
          { ratio: 2.756, amp: 0.24, decay: note.duration * 0.48 },
          { ratio: 4.07, amp: 0.12, decay: note.duration * 0.28 },
        ];

        for (const p of partials) {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(note.freq * p.ratio, startTime);

          const peakGain = note.gain * p.amp;
          gainNode.gain.setValueAtTime(0.0001, startTime);
          gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.004);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + p.decay);

          osc.connect(gainNode);
          gainNode.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + p.decay + 0.05);
        }
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playNow).catch(() => {});
    } else {
      playNow();
    }
  }

  /**
   * Warm descending losing motif ("wah-wah-wah-waaaah") when the run finishes in a loss or bust.
   */
  public playLoseSound(force = false): void {
    if (this.muted && !force) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const playNow = () => {
      const now = ctx.currentTime + 0.02;
      const notes = [
        { freq: 311.13, endFreq: 305.0, delay: 0.0, duration: 0.24, gain: 0.2 }, // D#4
        { freq: 293.66, endFreq: 288.0, delay: 0.26, duration: 0.24, gain: 0.2 }, // D4
        { freq: 277.18, endFreq: 271.0, delay: 0.52, duration: 0.24, gain: 0.2 }, // C#4
        { freq: 261.63, endFreq: 224.0, delay: 0.78, duration: 0.72, gain: 0.24 }, // C4 sliding down
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.85, now);
      masterGain.connect(ctx.destination);

      for (const note of notes) {
        const startTime = now + note.delay;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(920, startTime);
        filter.frequency.exponentialRampToValueAtTime(340, startTime + note.duration);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sawtooth';

        osc1.frequency.setValueAtTime(note.freq, startTime);
        osc1.frequency.exponentialRampToValueAtTime(note.endFreq, startTime + note.duration);

        osc2.frequency.setValueAtTime(note.freq * 0.997, startTime);
        osc2.frequency.exponentialRampToValueAtTime(note.endFreq * 0.997, startTime + note.duration);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.32, startTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.exponentialRampToValueAtTime(note.gain, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

        osc1.connect(filter);
        osc2.connect(osc2Gain);
        osc2Gain.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + note.duration + 0.04);
        osc2.stop(startTime + note.duration + 0.04);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playNow).catch(() => {});
    } else {
      playNow();
    }
  }

  /**
   * Short crisp feedback for single-step spins where money was won or lost.
   */
  public playStepOutcome(won: boolean): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const playNow = () => {
      const now = ctx.currentTime + 0.01;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (won) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.09);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(185, now + 0.16);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playNow).catch(() => {});
    } else {
      playNow();
    }
  }

  /**
   * Plays win chime if netProfit >= 0, or losing sound if netProfit < 0.
   */
  public playOutcomeSound(netProfit: number): void {
    if (netProfit < 0) {
      this.playLoseSound();
    } else {
      this.playBellChime();
    }
  }
}

export const soundEngine = new SoundEngine();
