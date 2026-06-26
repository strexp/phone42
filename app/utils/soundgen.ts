import { DTMF_FREQUENCIES } from "@/config";

interface Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

class SoundGenerator {
  private ctx: AudioContext | null = null;
  private ringbackInterval: number | null = null;
  private activeOscillators: {
    oscillators: OscillatorNode[];
    gainNode: GainNode;
  } | null = null;

  private initCtx() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      this.ctx = new (
        window.AudioContext || (window as unknown as Window).webkitAudioContext
      )();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  private createTones(frequencies: number[]) {
    this.initCtx();
    if (!this.ctx) return null;

    const gainNode = this.ctx.createGain();
    gainNode.connect(this.ctx.destination);

    const oscillators = frequencies
      .filter((f) => f > 0)
      .map((freq) => {
        const osc = this.ctx!.createOscillator();
        osc.frequency.value = freq;
        osc.connect(gainNode);
        return osc;
      });

    return { ctx: this.ctx, oscillators, gainNode };
  }

  playDTMF(key: string, duration = 0.2) {
    const freqs = DTMF_FREQUENCIES[key];
    if (!freqs) return;

    const nodes = this.createTones(freqs);
    if (!nodes) return;
    const { ctx, oscillators, gainNode } = nodes;

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration,
    );

    oscillators.forEach((osc) => {
      osc.start();
      osc.stop(ctx.currentTime + duration);
    });
  }

  startDTMF(key: string) {
    const freqs = DTMF_FREQUENCIES[key];
    if (!freqs) return;

    this.stopDTMF();

    const nodes = this.createTones(freqs);
    if (!nodes) return;
    const { ctx, oscillators, gainNode } = nodes;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);

    oscillators.forEach((osc) => osc.start());
    this.activeOscillators = { oscillators, gainNode };
  }

  stopDTMF() {
    if (!this.activeOscillators || !this.ctx) return;
    const { oscillators, gainNode } = this.activeOscillators;

    gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.02);
    oscillators.forEach((osc) => osc.stop(this.ctx!.currentTime + 0.03));

    this.activeOscillators = null;
  }

  startRingback() {
    this.stopRingback();

    const playPulse = () => {
      const nodes = this.createTones([425]);
      if (!nodes) return;
      const { ctx, oscillators, gainNode } = nodes;

      const duration = 1.0;
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + duration,
      );

      oscillators.forEach((osc) => {
        osc.start();
        osc.stop(ctx.currentTime + duration);
      });
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
}

const soundGenerator = new SoundGenerator();
export default soundGenerator;
