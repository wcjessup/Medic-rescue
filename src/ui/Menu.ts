import type { Input } from "../engine/Input.js";
import { COLORS } from "../utils/constants.js";

export interface MenuItem<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

/** A reusable vertical selectable menu (Pokemon move-select style). */
export class Menu<T> {
  selected = 0;

  constructor(public items: MenuItem<T>[]) {}

  private moveBy(delta: number): void {
    const n = this.items.length;
    this.selected = (this.selected + delta + n) % n;
  }

  /** Returns the chosen value on confirm, or undefined otherwise. */
  handleInput(input: Input): T | undefined {
    if (input.justPressed("down")) this.moveBy(1);
    if (input.justPressed("up")) this.moveBy(-1);
    if (input.justPressed("confirm")) {
      const item = this.items[this.selected];
      if (item && !item.disabled) return item.value;
    }
    return undefined;
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number, _width: number, lineHeight: number): void {
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    this.items.forEach((item, i) => {
      const isSelected = i === this.selected;
      ctx.fillStyle = item.disabled ? "#5a6a7a" : isSelected ? COLORS.warn : COLORS.text;
      const prefix = isSelected ? "▶ " : "  ";
      ctx.fillText(prefix + item.label, x, y + i * lineHeight);
    });
  }
}
