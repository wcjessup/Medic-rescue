const MAX_DT_SECONDS = 0.05; // clamp to avoid a spiral of death after backgrounding/throttling

export function startLoop(tick: (dtSeconds: number) => void): void {
  let last = performance.now();

  function frame(now: number): void {
    const rawDt = (now - last) / 1000;
    last = now;
    const dt = Math.min(rawDt, MAX_DT_SECONDS);
    tick(dt);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
