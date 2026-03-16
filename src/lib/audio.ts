class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = false;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.enabled = true;
  }

  private play(type: OscillatorType, freq: number, duration: number, vol: number, slideFreq?: number) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
      }
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio play error", e);
    }
  }

  deal() {
    this.play('sine', 800, 0.1, 0.05, 200);
  }

  bet() {
    this.play('triangle', 1200, 0.1, 0.03);
    setTimeout(() => this.play('triangle', 1600, 0.15, 0.03), 40);
  }

  fold() {
    this.play('sine', 300, 0.2, 0.05, 100);
  }

  win() {
    this.play('sine', 440, 0.15, 0.05); // A4
    setTimeout(() => this.play('sine', 554.37, 0.15, 0.05), 100); // C#5
    setTimeout(() => this.play('sine', 659.25, 0.4, 0.05), 200); // E5
  }
}

export const sounds = new SoundEngine();
