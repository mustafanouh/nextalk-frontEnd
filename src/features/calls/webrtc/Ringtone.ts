/**
 * Generates ringtone/ringback tones with the Web Audio API instead of
 * shipping an mp3 — avoids bundling a licensed sound file and works
 * completely offline. Two presets modeled loosely on real telephony tones:
 *
 * - 'ringing'  (incoming call): a brighter two-tone pulse, closer to a
 *    classic phone ring, played on a 1s-on / 3s-off cycle.
 * - 'ringback' (outgoing call, while it rings on the other end): a single
 *    softer tone on a 1s-on / 3s-off cycle, quieter than 'ringing' so it
 *    doesn't compete with the "جاري الاتصال..." status the caller is
 *    already reading.
 */
type RingtoneKind = 'ringing' | 'ringback';

const PRESETS: Record<RingtoneKind, { freqs: number[]; gain: number; toneMs: number; cycleMs: number }> = {
  ringing: { freqs: [480, 620], gain: 0.15, toneMs: 1000, cycleMs: 4000 },
  ringback: { freqs: [425], gain: 0.08, toneMs: 1000, cycleMs: 4000 },
};

export class Ringtone {
  private ctx: AudioContext | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private activeNodes: OscillatorNode[] = [];

  play(kind: RingtoneKind): void {
    this.stop(); // never overlap two ring cycles

    // AudioContext must be created (or resumed) from a real user gesture in
    // most browsers — this is always called from a click handler (accept/
    // reject button) or immediately after one (starting a call), so it's safe.
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const preset = PRESETS[kind];
    const tick = () => this.playTone(preset.freqs, preset.gain, preset.toneMs);

    tick();
    this.intervalId = setInterval(tick, preset.cycleMs);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeNodes.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // already stopped — fine
      }
    });
    this.activeNodes = [];
    this.ctx?.close();
    this.ctx = null;
  }

  private playTone(freqs: number[], gain: number, durationMs: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const stopAt = now + durationMs / 1000;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Short fade in/out avoids an audible "click" at the start/end of each pulse.
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + 0.02);
      gainNode.gain.setValueAtTime(gain, stopAt - 0.03);
      gainNode.gain.linearRampToValueAtTime(0, stopAt);

      osc.connect(gainNode);
      gainNode.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(stopAt);
      this.activeNodes.push(osc);
    });
  }
}
