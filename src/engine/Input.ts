export type InputAction = "up" | "down" | "left" | "right" | "confirm" | "cancel" | "menu";

const ACTIONS: InputAction[] = ["up", "down", "left", "right", "confirm", "cancel", "menu"];

const KEY_MAP: Record<string, InputAction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  Enter: "confirm",
  Space: "confirm",
  KeyZ: "confirm",
  Escape: "cancel",
  KeyX: "cancel",
  KeyI: "menu",
  Tab: "menu",
};

/**
 * Unifies keyboard and touch input into a single polled state, with
 * pressed / justPressed / justReleased tracking per logical action.
 */
export class Input {
  private down = new Set<InputAction>();
  private prevDown = new Set<InputAction>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      const action = KEY_MAP[e.code];
      if (action) {
        this.down.add(action);
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      const action = KEY_MAP[e.code];
      if (action) {
        this.down.delete(action);
        e.preventDefault();
      }
    });
    window.addEventListener("blur", () => this.down.clear());
  }

  /** Used by TouchControls to drive the same state as keyboard input. */
  setTouch(action: InputAction, isDown: boolean): void {
    if (isDown) this.down.add(action);
    else this.down.delete(action);
  }

  /** Call once per frame, after scenes have read this frame's input. */
  endFrame(): void {
    this.prevDown = new Set(this.down);
  }

  isDown(action: InputAction): boolean {
    return this.down.has(action);
  }

  justPressed(action: InputAction): boolean {
    return this.down.has(action) && !this.prevDown.has(action);
  }

  justReleased(action: InputAction): boolean {
    return !this.down.has(action) && this.prevDown.has(action);
  }

  get actions(): InputAction[] {
    return ACTIONS;
  }
}
