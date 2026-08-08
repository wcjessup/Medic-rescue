import { VIEW_WIDTH, VIEW_HEIGHT } from "../utils/constants.js";

type Phase = "idle" | "out" | "hold" | "in";

/**
 * A full-screen fade-to-black transition, driven by the game loop rather
 * than setTimeout so it stays in lockstep with dt-based updates. Typical
 * use: fadeOut(() => { swap scene here }) — the callback fires once the
 * screen is fully black, then it automatically fades back in.
 */
export class Transition {
  private phase: Phase = "idle";
  private t = 0;
  private durationSec = 0.25;
  private onMidpoint: (() => void) | null = null;

  get active(): boolean {
    return this.phase !== "idle";
  }

  fadeOut(onMidpoint: () => void, durationSec = 0.25): void {
    this.phase = "out";
    this.t = 0;
    this.durationSec = durationSec;
    this.onMidpoint = onMidpoint;
  }

  update(dtSeconds: number): void {
    if (this.phase === "idle") return;
    this.t += dtSeconds;
    if (this.phase === "out" && this.t >= this.durationSec) {
      this.onMidpoint?.();
      this.onMidpoint = null;
      this.phase = "in";
      this.t = 0;
    } else if (this.phase === "in" && this.t >= this.durationSec) {
      this.phase = "idle";
      this.t = 0;
    }
  }

  private alpha(): number {
    if (this.phase === "out") return Math.min(1, this.t / this.durationSec);
    if (this.phase === "in") return 1 - Math.min(1, this.t / this.durationSec);
    return 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const a = this.alpha();
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.restore();
  }
}
