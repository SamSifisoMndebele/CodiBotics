// ============================================================================
// Web Audio API Synthesizer for Buzzer Tones & Floor Bot Sound Effects
// 100% Client-Side, Zero External Audio Files Required
// ============================================================================

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
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

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play a pure tone at a specified frequency (Hz) and duration (ms)
   */
  public playTone(frequency: number = 440, durationMs: number = 250, type: OscillatorType = 'square') {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, Math.min(4000, frequency)), ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  }

  /**
   * Foundation Phase: UI Button Click Pop
   */
  public playClick() {
    this.playTone(620, 60, 'sine');
  }

  /**
   * Foundation Phase: Robot Step Move Sound
   */
  public playStepMove() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.playTone(320, 90, 'triangle');
    setTimeout(() => this.playTone(400, 90, 'triangle'), 70);
  }

  /**
   * Foundation Phase: Robot Turn Sound
   */
  public playTurn() {
    this.playTone(480, 110, 'sine');
  }

  /**
   * Foundation Phase: Robot Beep Horn
   */
  public playRobotBeep() {
    this.playTone(880, 150, 'square');
    setTimeout(() => this.playTone(1174, 200, 'square'), 160);
  }

  /**
   * Foundation Phase: Light Flash Sparkle
   */
  public playFlashSound() {
    this.playTone(987, 80, 'sine');
    setTimeout(() => this.playTone(1318, 120, 'sine'), 85);
    setTimeout(() => this.playTone(1567, 160, 'sine'), 170);
  }

  /**
   * Collision / Obstacle Hit Buzz
   */
  public playCollision() {
    this.playTone(130, 350, 'sawtooth');
  }

  /**
   * Goal Reached Celebration Fanfare
   */
  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, idx === notes.length - 1 ? 380 : 140, 'triangle');
      }, idx * 140);
    });
  }
}

export const audioEngine = new SoundSynthesizer();
