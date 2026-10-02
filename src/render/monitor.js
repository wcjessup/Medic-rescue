// Procedural ECG waveform renderer. Pure function of (rhythm, time, hr) —
// no external images, no pre-baked animation frames.

function sinusBeat(phase) {
  if (phase >= 0.05 && phase < 0.15) {
    const p = (phase - 0.05) / 0.1;
    return Math.sin(p * Math.PI) * 0.15;
  }
  if (phase >= 0.18 && phase < 0.205) {
    const p = (phase - 0.18) / 0.025;
    return -0.15 * p;
  }
  if (phase >= 0.205 && phase < 0.235) {
    const p = (phase - 0.205) / 0.03;
    return -0.15 + 1.15 * p;
  }
  if (phase >= 0.235 && phase < 0.27) {
    const p = (phase - 0.235) / 0.035;
    return 1.0 - 1.3 * p;
  }
  if (phase >= 0.27 && phase < 0.3) {
    const p = (phase - 0.27) / 0.03;
    return -0.3 + 0.3 * p;
  }
  if (phase >= 0.38 && phase < 0.6) {
    const p = (phase - 0.38) / 0.22;
    return Math.sin(p * Math.PI) * 0.28;
  }
  return 0;
}

function wideBeat(phase) {
  // wide bizarre QRS for VT / PVC, no discrete P/T
  const p = phase;
  if (p < 0.5) return Math.sin(p * Math.PI) * 0.95;
  if (p < 0.62) return -0.25 * Math.sin((p - 0.5) * Math.PI * 8);
  return 0;
}

function noise(t, amp) {
  return (Math.sin(t * 12.9898) * 43758.5453 % 1) * amp;
}

export function waveformValue(rhythm, tMs, hr) {
  const bpm = Math.max(15, hr || 0);
  const cycleMs = 60000 / bpm;

  switch (rhythm) {
    case "asystole":
      return noise(tMs * 0.001, 0.015);
    case "vf": {
      return (
        0.3 * Math.sin(tMs * 0.028) +
        0.22 * Math.sin(tMs * 0.067 + 1.3) +
        0.18 * Math.sin(tMs * 0.11 + 2.1) +
        0.1 * Math.sin(tMs * 0.211 + 0.4)
      );
    }
    case "afib": {
      const wobble = 60 * Math.sin(tMs * 0.0021) + 40 * Math.sin(tMs * 0.0037 + 1);
      const tWarp = tMs + wobble;
      const phase = (((tWarp % cycleMs) + cycleMs) % cycleMs) / cycleMs;
      const p = sinusBeat(phase);
      return p === 0 ? 0.04 * Math.sin(tMs * 0.05) : p * 0.9;
    }
    case "vt": {
      const phase = (((tMs % cycleMs) + cycleMs) % cycleMs) / cycleMs;
      return wideBeat(phase);
    }
    case "torsades": {
      const envelope = Math.sin(tMs * 0.0012) ;
      const phase = (((tMs % cycleMs) + cycleMs) % cycleMs) / cycleMs;
      return wideBeat(phase) * envelope;
    }
    case "bigeminy": {
      const beatIndex = Math.floor(tMs / cycleMs);
      const phase = (((tMs % cycleMs) + cycleMs) % cycleMs) / cycleMs;
      return beatIndex % 2 === 1 ? wideBeat(phase) * 1.1 : sinusBeat(phase);
    }
    case "svt": {
      const phase = (((tMs % cycleMs) + cycleMs) % cycleMs) / cycleMs;
      // suppress the P-wave window, keep everything else compressed/tall
      if (phase >= 0.05 && phase < 0.15) return 0;
      return sinusBeat(phase) * 1.05;
    }
    case "pea":
    case "sinus-normal":
    case "sinus-tach":
    case "sinus-brady":
    default: {
      const phase = (((tMs % cycleMs) + cycleMs) % cycleMs) / cycleMs;
      return sinusBeat(phase);
    }
  }
}

export function drawMonitor(canvas, encounter, opts = {}) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = "#241f16";
  ctx.lineWidth = 1;
  for (let gx = 0; gx < w; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }

  if (!encounter.monitorAttached) {
    ctx.fillStyle = "#3a4a3f";
    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("NO SIGNAL — ATTACH MONITOR", w / 2, h / 2);
    return;
  }

  const midY = h / 2;
  const ampScale = h * 0.42;
  const msPerPixel = 4;
  const cursor = opts.t || 0;

  ctx.strokeStyle = "#4ade80";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const tMs = cursor - (w - x) * msPerPixel;
    const v = waveformValue(encounter.rhythm, tMs, encounter.vitals.hr);
    const y = midY - v * ampScale;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // sweep cursor glow
  ctx.fillStyle = "rgba(74,222,128,0.5)";
  ctx.fillRect(w - 3, 0, 3, h);
}
