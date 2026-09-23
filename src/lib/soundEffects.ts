/**
 * VERILANCE High-Tech Cyberpunk & Modern UI Sound Effects System
 * Uses native Web Audio API synthesis for zero-latency, zero-asset, crisp holographic audio feedback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.25; // Balanced subtle volume to avoid startling users

  constructor() {
    // Check saved user sound preference from localStorage
    try {
      const saved = localStorage.getItem('verilance_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggleSound(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('verilance_sound_enabled', String(this.enabled));
    } catch {}
    if (this.enabled) {
      this.playTabClick();
    }
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    try {
      localStorage.setItem('verilance_sound_enabled', String(this.enabled));
    } catch {}
  }

  /**
   * Primary Tab Switch Sound
   * High-tech holographic blip with a rapid dual-harmonic frequency sweep.
   */
  public playTabClick(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency glide: 820Hz up to 1350Hz, then quick settle
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(1420, now + 0.025);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.07);

    // Fast exponential decay
    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Main Navigation Tab Sound (Marketplace / Escrow / Profile)
   * Slightly deeper, resonant multi-layer cyber acoustic chime.
   */
  public playNavTabClick(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic layer 1: Core bell pulse
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5 note
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.035); // A5 note

    gain1.gain.setValueAtTime(this.volume * 0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Harmonic layer 2: Glass overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now); // D6 harmonic
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.03);

    gain2.gain.setValueAtTime(this.volume * 0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.09);
  }

  /**
   * Sub-tab / Filter Chip Micro-Tick
   * Snappy, tactile, ultra-short micro click for category chips & sub-filters.
   */
  public playSubTabClick(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.035);

    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Role Switcher / Mode Toggle Sound
   * Upward frequency glide with tech buzz.
   */
  public playToggleSound(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.06);

    gain.gain.setValueAtTime(this.volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * View Once Media Activation Sound
   * Mysterious cyberpunk lock/unlock chirp.
   */
  public playViewOnceSound(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Premium Holographic Cyber Notification Sound
   * Crystal triple-harmonic ascending chime for alerts, new messages, and status updates.
   */
  public playNotificationSound(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell sequence: D5 (587.33) -> G5 (783.99) -> D6 (1174.66)
    const notes = [
      { freq: 587.33, start: 0, dur: 0.18, vol: 0.55 },
      { freq: 783.99, start: 0.045, dur: 0.22, vol: 0.65 },
      { freq: 1174.66, start: 0.09, dur: 0.35, vol: 0.75 },
    ];

    notes.forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      // Subtle pitch bend upwards for that crisp cyber feel
      osc.frequency.exponentialRampToValueAtTime(freq * 1.015, now + start + 0.03);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(this.volume * vol, now + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    // Glass shimmer overtone
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(1760, now + 0.09); // D7 overtone
    shimmer.frequency.exponentialRampToValueAtTime(2349.32, now + 0.2);

    shimmerGain.gain.setValueAtTime(0.001, now + 0.09);
    shimmerGain.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.11);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);

    shimmer.start(now + 0.09);
    shimmer.stop(now + 0.35);
  }

  /**
   * VAKRA AI Neural Sparkle Sound
   * Futuristic cybernetic chime for AI responses and auto-draft activations.
   */
  public playAISparkleSound(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [700, 950, 1250, 1600];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.001, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(this.volume * 0.45, now + idx * 0.03 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.12);
    });
  }

  /**
   * Security & Scam Alert Warning Sound
   * Urgent high-tech pulse alert.
   */
  public playAlertWarningSound(): void {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    [0, 0.11].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now + delay);
      osc.frequency.exponentialRampToValueAtTime(380, now + delay + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.4, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    });
  }
}

export const soundEffects = new SoundEngine();
