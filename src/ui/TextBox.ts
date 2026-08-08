import { VIEW_WIDTH, VIEW_HEIGHT, COLORS } from "../utils/constants.js";

const CHARS_PER_SECOND = 40;
const BOX_MARGIN = 8;
const BOX_HEIGHT = 64;
const FONT = "11px sans-serif";
const LINE_HEIGHT = 14;
const PADDING = 10;

/** A Pokemon-style dialogue textbox: typewriter reveal, tap/confirm to advance or skip. */
export class TextBox {
  private lineIndex = 0;
  private charProgress = 0;
  private wrapped: string[][] = [];
  readonly speaker?: string;

  constructor(private lines: string[], speaker?: string) {
    this.speaker = speaker;
  }

  private wrapLine(ctx: CanvasRenderingContext2D, line: string): string[] {
    const maxWidth = VIEW_WIDTH - BOX_MARGIN * 2 - PADDING * 2;
    const words = line.split(" ");
    const out: string[] = [];
    let current = "";
    for (const word of words) {
      const attempt = current ? `${current} ${word}` : word;
      if (ctx.measureText(attempt).width > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = attempt;
      }
    }
    if (current) out.push(current);
    return out;
  }

  private ensureWrapped(ctx: CanvasRenderingContext2D): void {
    if (this.wrapped.length === this.lines.length) return;
    ctx.font = FONT;
    this.wrapped = this.lines.map((l) => this.wrapLine(ctx, l));
  }

  update(dtSeconds: number): void {
    const current = this.wrapped[this.lineIndex];
    if (!current) return;
    const totalChars = current.join(" ").length;
    this.charProgress = Math.min(totalChars, this.charProgress + dtSeconds * CHARS_PER_SECOND);
  }

  private currentTotalChars(): number {
    return (this.wrapped[this.lineIndex] ?? []).join(" ").length;
  }

  get fullyRevealed(): boolean {
    return this.charProgress >= this.currentTotalChars();
  }

  /** Advances the textbox. Returns true once there is nothing left to show (should close). */
  advance(): boolean {
    if (!this.fullyRevealed) {
      this.charProgress = this.currentTotalChars();
      return false;
    }
    if (this.lineIndex < this.lines.length - 1) {
      this.lineIndex++;
      this.charProgress = 0;
      return false;
    }
    return true;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.ensureWrapped(ctx);

    const boxY = VIEW_HEIGHT - BOX_HEIGHT - BOX_MARGIN;
    const boxW = VIEW_WIDTH - BOX_MARGIN * 2;

    ctx.fillStyle = COLORS.textBoxBg;
    ctx.fillRect(BOX_MARGIN, boxY, boxW, BOX_HEIGHT);
    ctx.strokeStyle = COLORS.textBoxBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(BOX_MARGIN + 1, boxY + 1, boxW - 2, BOX_HEIGHT - 2);

    ctx.font = FONT;
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "left";

    let textY = boxY + PADDING + 4;
    if (this.speaker) {
      ctx.fillStyle = COLORS.warn;
      ctx.fillText(this.speaker, BOX_MARGIN + PADDING, textY);
      textY += LINE_HEIGHT;
      ctx.fillStyle = COLORS.text;
    }

    const wrappedLines = this.wrapped[this.lineIndex] ?? [];
    let remaining = Math.floor(this.charProgress);
    for (const line of wrappedLines) {
      const visible = line.slice(0, Math.max(0, remaining));
      ctx.fillText(visible, BOX_MARGIN + PADDING, textY);
      remaining -= line.length + 1;
      textY += LINE_HEIGHT;
    }

    if (this.fullyRevealed) {
      const blink = Math.sin(performance.now() / 200) > 0;
      if (blink) {
        ctx.fillText("▼", BOX_MARGIN + boxW - PADDING - 8, boxY + BOX_HEIGHT - 8);
      }
    }
  }
}
