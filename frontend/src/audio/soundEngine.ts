export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface SoundProfile {
  id?: number;
  asset_symbol?: string | null;
  state_name: string;
  waveform: WaveformType;
  frequency: number; // Hz
  beep_duration_ms: number; // ms
  repetition_count: number;
  interval_ms: number; // ms
  volume: number; // 0.0 - 1.0
  enabled: boolean;
  custom_audio_url?: string | null;
}

class SoundAlertEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private unlocked: boolean = false;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  public isAudioUnlocked(): boolean {
    return this.unlocked && this.audioCtx !== null && this.audioCtx.state === 'running';
  }

  public async unlockAudio(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.01);

      this.unlocked = true;
      return true;
    } catch (e) {
      console.warn('Failed to unlock Web Audio context:', e);
      return false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public async playProfile(profile: SoundProfile): Promise<void> {
    if (this.isMuted || !profile.enabled) {
      return;
    }

    if (!this.isAudioUnlocked()) {
      const ok = await this.unlockAudio();
      if (!ok) {
        console.warn('Audio playback skipped: AudioContext requires user interaction.');
        return;
      }
    }

    if (profile.custom_audio_url) {
      try {
        let audio = this.audioCache.get(profile.custom_audio_url);
        if (!audio) {
          audio = new Audio(profile.custom_audio_url);
          this.audioCache.set(profile.custom_audio_url, audio);
        }
        audio.volume = Math.max(0, Math.min(1, profile.volume));
        audio.currentTime = 0;
        await audio.play();
        return;
      } catch (err) {
        console.warn('Custom audio playback failed, falling back to Web Audio synth:', err);
      }
    }

    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const baseFreq = profile.frequency || 440;
    const durationSec = (profile.beep_duration_ms || 150) / 1000;
    const intervalSec = (profile.interval_ms || 80) / 1000;
    const repetitions = Math.max(1, profile.repetition_count || 1);
    const volume = Math.max(0.01, Math.min(1.0, profile.volume || 0.5));

    const startTime = ctx.currentTime + 0.02;

    for (let i = 0; i < repetitions; i++) {
      const pulseStart = startTime + i * (durationSec + intervalSec);
      const pulseEnd = pulseStart + durationSec;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = profile.waveform || 'sine';

      // Indian market momentum acoustic contours:
      // Upward: ascending sequence
      // Downward: descending sequence
      // Breakout / Breakdown: rapid escalating pulses
      // Reversal / Profit-booking: two-tone warning
      let freq = baseFreq;
      const s = profile.state_name.toLowerCase();
      if (s.includes('down') || s.includes('breakdown')) {
        freq = baseFreq * (1.0 - i * 0.09);
      } else if (s.includes('up') || s.includes('breakout')) {
        freq = baseFreq * (1.0 + i * 0.08);
      } else if (s.includes('reversal') || s.includes('profit')) {
        freq = i % 2 === 0 ? baseFreq : baseFreq * 1.35;
      }

      osc.frequency.setValueAtTime(freq, pulseStart);

      gainNode.gain.setValueAtTime(0.0001, pulseStart);
      gainNode.gain.exponentialRampToValueAtTime(volume, pulseStart + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(pulseStart);
      osc.stop(pulseEnd + 0.02);
    }
  }

  public preview(profile: SoundProfile): Promise<void> {
    return this.playProfile({ ...profile, enabled: true });
  }
}

export const soundEngine = new SoundAlertEngine();
