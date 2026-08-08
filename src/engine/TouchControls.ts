import type { Input, InputAction } from "./Input.js";

/**
 * Builds an on-screen d-pad + action buttons at runtime and wires them into
 * the shared Input state via Pointer Events. Built entirely in JS (no HTML
 * markup dependency) so it works identically in the dev shell and the
 * single-file artifact build.
 */
export class TouchControls {
  readonly root: HTMLDivElement;

  constructor(private input: Input, container: HTMLElement) {
    this.root = document.createElement("div");
    this.root.style.cssText = `
      position: absolute; inset: 0; pointer-events: none;
      display: flex; align-items: flex-end; justify-content: space-between;
      padding: 16px; box-sizing: border-box; font-family: sans-serif;
      user-select: none; -webkit-user-select: none;
    `;

    this.root.appendChild(this.buildDPad());
    this.root.appendChild(this.buildActionButtons());
    container.appendChild(this.root);
  }

  private bindButton(el: HTMLElement, action: InputAction): void {
    el.style.touchAction = "none";
    el.style.pointerEvents = "auto";
    const start = (e: Event) => {
      e.preventDefault();
      this.input.setTouch(action, true);
      el.style.opacity = "1";
    };
    const end = (e: Event) => {
      e.preventDefault();
      this.input.setTouch(action, false);
      el.style.opacity = "0.55";
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointerleave", end);
  }

  private makeButton(label: string): HTMLDivElement {
    const btn = document.createElement("div");
    btn.textContent = label;
    btn.style.cssText = `
      display: flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 50%;
      background: #eaeaea; color: #16213e; font-weight: bold; font-size: 18px;
      opacity: 0.55; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    `;
    return btn;
  }

  private buildDPad(): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      display: grid; grid-template-columns: repeat(3, 48px);
      grid-template-rows: repeat(3, 48px); gap: 2px; pointer-events: none;
    `;

    const cell = (label: string, action: InputAction | null, col: number, row: number) => {
      const el = document.createElement("div");
      el.style.gridColumn = String(col);
      el.style.gridRow = String(row);
      if (action) {
        el.textContent = label;
        el.style.cssText += `
          display: flex; align-items: center; justify-content: center;
          background: #eaeaea; color: #16213e; font-weight: bold;
          border-radius: 6px; opacity: 0.55; box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        `;
        this.bindButton(el, action);
      }
      wrap.appendChild(el);
    };

    cell("▲", "up", 2, 1);
    cell("◀", "left", 1, 2);
    cell("", null, 2, 2);
    cell("▶", "right", 3, 2);
    cell("▼", "down", 2, 3);

    return wrap;
  }

  private buildActionButtons(): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.style.cssText = `display: flex; flex-direction: column; gap: 10px; align-items: flex-end;`;

    const confirm = this.makeButton("A");
    this.bindButton(confirm, "confirm");
    const cancel = this.makeButton("B");
    this.bindButton(cancel, "cancel");
    const menu = this.makeButton("≡");
    this.bindButton(menu, "menu");

    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap:10px;";
    row.appendChild(cancel);
    row.appendChild(confirm);

    wrap.appendChild(menu);
    wrap.appendChild(row);
    return wrap;
  }
}
