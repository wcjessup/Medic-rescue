import type { Input } from "./Input.js";
import type { Scene } from "./Scene.js";

/**
 * Maintains a stack of scenes: index 0 is the base scene (Title, Overworld,
 * PatientEncounter, Station); anything above it is an overlay (Dialogue,
 * Bag menu). Only the topmost scene whose lower neighbors aren't blocked
 * receives input; every scene in the stack still renders, bottom to top,
 * so overlays draw over a frozen base scene.
 */
export class SceneManager {
  private stack: Scene[] = [];

  replace(scene: Scene): void {
    while (this.stack.length > 0) this.pop();
    this.push(scene);
  }

  push(scene: Scene): void {
    this.stack.push(scene);
    scene.onEnter?.();
  }

  pop(): void {
    const scene = this.stack.pop();
    scene?.onExit?.();
  }

  get top(): Scene | undefined {
    return this.stack[this.stack.length - 1];
  }

  update(ctx: CanvasRenderingContext2D, input: Input, dt: number): void {
    const top = this.top;
    if (top) top.update({ ctx, input, dt });
  }

  render(ctx: CanvasRenderingContext2D, input: Input, dt: number): void {
    for (const scene of this.stack) {
      scene.render({ ctx, input, dt });
    }
  }
}
