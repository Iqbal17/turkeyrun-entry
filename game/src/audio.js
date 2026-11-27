// audio.js — tiny synthesized WebAudio bleeps. No audio files, no network.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  // One short oscillator blip: freq slides from `from` to `to` over `dur` seconds.
  function blip(from, to, dur, type, gain) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    gobble() { // the turkey's happy two-note gobble
      blip(320, 180, 0.09, 'square', 0.08);
      setTimeout(() => blip(420, 240, 0.12, 'square', 0.08), 90);
    },
    peck() { blip(880, 660, 0.06, 'sine', 0.12); },
    dash() { blip(300, 900, 0.14, 'sawtooth', 0.06); },
    hurt() { blip(220, 70, 0.25, 'sawtooth', 0.14); },
    spotted() { // farmer spots the turkey: rising alarm
      blip(180, 520, 0.22, 'triangle', 0.14);
      setTimeout(() => blip(180, 520, 0.22, 'triangle', 0.12), 180);
    },
    knife() { blip(1200, 300, 0.12, 'sawtooth', 0.05); },
    caught() { // descending "dinner is served" sting
      blip(392, 392, 0.16, 'triangle', 0.14);
      setTimeout(() => blip(330, 330, 0.16, 'triangle', 0.14), 160);
      setTimeout(() => blip(262, 130, 0.4, 'triangle', 0.16), 320);
    },
    escaped() { // little victory arpeggio
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f, 0.18, 'triangle', 0.12), i * 130));
    },
    stageClear() { [440, 554, 659].forEach((f, i) => setTimeout(() => blip(f, f, 0.14, 'sine', 0.1), i * 110)); },
  };
}
