import type { Input } from "./Input.js";

export interface SceneContext {
  ctx: CanvasRenderingContext2D;
  input: Input;
  dt: number;
}

/**
 * A layer in the SceneManager's stack. Base scenes (Overworld, Title, ...)
 * fill the whole screen; overlay scenes (Dialogue, Bag menu) sit on top of
 * a paused base scene and report `blocksInputBelow` to stop input from
 * reaching it.
 */
export interface Scene {
  readonly blocksInputBelow: boolean;
  onEnter?(): void;
  onExit?(): void;
  update(sc: SceneContext): void;
  render(sc: SceneContext): void;
}
