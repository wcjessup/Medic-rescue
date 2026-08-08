import { Canvas } from "./Canvas.js";
import { Input } from "./Input.js";
import { TouchControls } from "./TouchControls.js";
import { SceneManager } from "./SceneManager.js";
import { Transition } from "./Transition.js";
import { startLoop } from "./loop.js";
import type { Scene } from "./Scene.js";
import { COLORS, VIEW_WIDTH, VIEW_HEIGHT } from "../utils/constants.js";

export class Game {
  readonly canvas: Canvas;
  readonly input: Input;
  readonly scenes: SceneManager;
  readonly transition: Transition;

  constructor(container: HTMLElement) {
    this.canvas = new Canvas(container);
    this.input = new Input();
    new TouchControls(this.input, container);
    this.scenes = new SceneManager();
    this.transition = new Transition();
  }

  start(firstScene: Scene): void {
    this.scenes.replace(firstScene);
    startLoop((dt) => this.tick(dt));
  }

  private tick(dt: number): void {
    const { ctx } = this.canvas;

    if (!this.transition.active) {
      this.scenes.update(ctx, this.input, dt);
    }
    this.transition.update(dt);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.scenes.render(ctx, this.input, dt);
    this.transition.render(ctx);

    this.input.endFrame();
  }
}
