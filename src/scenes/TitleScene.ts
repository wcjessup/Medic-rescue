import type { Scene, SceneContext } from "../engine/Scene.js";
import { VIEW_WIDTH, VIEW_HEIGHT, COLORS } from "../utils/constants.js";

export class TitleScene implements Scene {
  readonly blocksInputBelow = true;
  private pulse = 0;

  constructor(private onStart: (continueGame: boolean) => void, private hasSave: boolean) {}

  update(sc: SceneContext): void {
    this.pulse += sc.dt;
    if (sc.input.justPressed("confirm")) {
      this.onStart(false);
    } else if (this.hasSave && sc.input.justPressed("menu")) {
      this.onStart(true);
    }
  }

  render(sc: SceneContext): void {
    const { ctx } = sc;
    ctx.fillStyle = "#16213e";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.fillStyle = COLORS.danger;
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PARAMEDIC", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 40);
    ctx.fillText("RESCUE", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 14);

    const blink = Math.sin(this.pulse * 4) > 0;
    if (blink) {
      ctx.fillStyle = COLORS.text;
      ctx.font = "14px sans-serif";
      ctx.fillText("Press A to Start", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 30);
    }

    if (this.hasSave) {
      ctx.fillStyle = COLORS.text;
      ctx.font = "11px sans-serif";
      ctx.fillText("Menu: Continue", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 50);
    }

    ctx.textAlign = "left";
  }
}
