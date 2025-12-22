import { DTMF_FREQUENCIES } from "@/config";

class SoundGenerator {
  private ctx: AudioContext | null = null;
  private ringbackInterval: number | null = null;

  private initCtx() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playDTMF(key: string, duration = 0.2) {
    this.initCtx();
    if (!this.ctx || !DTMF_FREQUENCIES[key]) return;

    const [f1, f2] = DTMF_FREQUENCIES[key];
    this.playTone(f1, f2, duration);
  }

  startRingback() {
    this.initCtx();
    if (!this.ctx) return;
    this.stopRingback();

    const playPulse = () => {
      this.playTone(425, 0, 1.0, 0.1);
    };

    playPulse();
    this.ringbackInterval = window.setInterval(playPulse, 4000);
  }

  stopRingback() {
    if (this.ringbackInterval) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
  }

  private playTone(
    freq1: number,
    freq2: number,
    duration: number,
    volume = 0.1,
  ) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.frequency.value = freq1;
    osc1.connect(gainNode);

    if (freq2 > 0) {
      const osc2 = this.ctx.createOscillator();
      osc2.frequency.value = freq2;
      osc2.connect(gainNode);
      osc2.start();
      osc2.stop(this.ctx.currentTime + duration);
    }

    gainNode.connect(this.ctx.destination);
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      this.ctx.currentTime + duration,
    );

    osc1.start();
    osc1.stop(this.ctx.currentTime + duration);
  }
}

const soundGenerator = new SoundGenerator();

export default soundGenerator;
