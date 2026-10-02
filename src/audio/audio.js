// Fully procedural WebAudio sound engine. No audio files anywhere.
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicNodes = null;
    this.beeperTimer = null;
  }

  _ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.stopMusic();
  }

  _osc({ type = "square", freq = 440, dur = 0.12, gain = 0.5, freqEnd = null, delay = 0 }) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) osc.frequency.linearRampToValueAtTime(freqEnd, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  click() {
    this._osc({ type: "square", freq: 900, dur: 0.045, gain: 0.25 });
  }

  confirm() {
    this._osc({ type: "square", freq: 520, dur: 0.08, gain: 0.3 });
    this._osc({ type: "square", freq: 780, dur: 0.1, gain: 0.25, delay: 0.07 });
  }

  error() {
    this._osc({ type: "sawtooth", freq: 220, dur: 0.18, gain: 0.3, freqEnd: 120 });
  }

  pageTurn() {
    this._osc({ type: "triangle", freq: 300, dur: 0.06, gain: 0.2 });
    this._osc({ type: "triangle", freq: 240, dur: 0.06, gain: 0.15, delay: 0.05 });
  }

  monitorBeep(low = false) {
    this._osc({ type: "sine", freq: low ? 480 : 880, dur: 0.09, gain: 0.18 });
  }

  alarmTone() {
    this._osc({ type: "square", freq: 1046, dur: 0.15, gain: 0.35 });
    this._osc({ type: "square", freq: 784, dur: 0.15, gain: 0.35, delay: 0.16 });
  }

  radioStatic(dur = 0.5) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(g).connect(this.master);
    src.start();
  }

  defibCharge() {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + 1.2);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(0.25, t0 + 1.2);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + 1.25);
  }

  defibShock() {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const t0 = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.6, t0);
    src.connect(g).connect(this.master);
    src.start(t0);
    this._osc({ type: "square", freq: 60, dur: 0.25, gain: 0.5 });
  }

  startCardiacBeeper(getHr, getFlatline) {
    this.stopCardiacBeeper();
    let last = 0;
    const step = () => {
      const hr = getHr();
      const flat = getFlatline && getFlatline();
      if (hr && !flat) {
        const now = performance.now();
        const interval = 60000 / Math.max(20, hr);
        if (now - last >= interval) {
          last = now;
          this.monitorBeep(hr < 50);
        }
      }
      this.beeperTimer = requestAnimationFrame(step);
    };
    this.beeperTimer = requestAnimationFrame(step);
  }

  stopCardiacBeeper() {
    if (this.beeperTimer) cancelAnimationFrame(this.beeperTimer);
    this.beeperTimer = null;
  }

  startMusic() {
    if (!this.enabled || this.musicNodes) return;
    const ctx = this._ensure();
    const notes = [220, 196, 174.6, 196, 220, 261.6, 220, 196];
    let i = 0;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    gain.connect(this.master);
    const iv = setInterval(() => {
      if (!this.enabled) return;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      const t0 = ctx.currentTime;
      osc.frequency.setValueAtTime(notes[i % notes.length], t0);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.35, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(g).connect(gain);
      osc.start(t0);
      osc.stop(t0 + 0.55);
      i++;
    }, 550);
    this.musicNodes = { gain, iv };
  }

  stopMusic() {
    if (this.musicNodes) {
      clearInterval(this.musicNodes.iv);
      this.musicNodes = null;
    }
  }
}

export const audio = new AudioEngine();
