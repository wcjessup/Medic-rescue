import { VIEW_WIDTH, VIEW_HEIGHT } from "../utils/constants.js";

/**
 * Owns the canvas element and keeps its backing store scaled to
 * devicePixelRatio while the CSS size fills the viewport, letterboxed to
 * preserve the game's fixed logical aspect ratio.
 */
export class Canvas {
  readonly el: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(container: HTMLElement) {
    this.el = document.createElement("canvas");
    this.el.style.cssText = `
      display: block; position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%); background: #0a0a0a;
      image-rendering: pixelated;
    `;
    const ctx = this.el.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    container.style.position = "relative";
    container.style.overflow = "hidden";
    container.appendChild(this.el);

    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("orientationchange", () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;

    // Fit the fixed logical resolution into the viewport, integer-scaled
    // when possible for crisp pixels, letterboxed otherwise.
    const parent = this.el.parentElement!;
    const availW = parent.clientWidth;
    const availH = parent.clientHeight;
    const scale = Math.max(1, Math.floor(Math.min(availW / VIEW_WIDTH, availH / VIEW_HEIGHT)));
    const cssW = VIEW_WIDTH * scale;
    const cssH = VIEW_HEIGHT * scale;

    this.el.style.width = `${cssW}px`;
    this.el.style.height = `${cssH}px`;
    this.el.width = Math.round(VIEW_WIDTH * dpr);
    this.el.height = Math.round(VIEW_HEIGHT * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }
}
