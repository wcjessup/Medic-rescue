/** A simple countdown timer, updated with per-frame delta time in seconds. */
export class Timer {
  private remaining: number;
  private readonly duration: number;
  done = false;

  constructor(durationSeconds: number) {
    this.duration = durationSeconds;
    this.remaining = durationSeconds;
  }

  update(dtSeconds: number): void {
    if (this.done) return;
    this.remaining -= dtSeconds;
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.done = true;
    }
  }

  reset(): void {
    this.remaining = this.duration;
    this.done = false;
  }

  get progress(): number {
    return 1 - this.remaining / this.duration;
  }

  get secondsLeft(): number {
    return this.remaining;
  }
}

/** Fires a callback repeatedly every `intervalSeconds`. */
export class Interval {
  private accum = 0;

  constructor(private intervalSeconds: number, private onFire: () => void) {}

  update(dtSeconds: number): void {
    this.accum += dtSeconds;
    while (this.accum >= this.intervalSeconds) {
      this.accum -= this.intervalSeconds;
      this.onFire();
    }
  }
}
