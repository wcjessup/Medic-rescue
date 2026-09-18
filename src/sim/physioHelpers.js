export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function moveToward(current, target, maxDelta) {
  if (current === undefined || current === null) return target;
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}

// deterministic small "alive" jitter, no Math.random() so runs are reproducible
export function jitter(seedMinutes, amplitude, freq = 1.3) {
  return Math.sin(seedMinutes * freq) * amplitude + Math.sin(seedMinutes * freq * 2.7 + 1) * amplitude * 0.35;
}

export function round(v, dp = 0) {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}
