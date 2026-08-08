import type { Scene, SceneContext } from "../engine/Scene.js";
import { TextBox } from "../ui/TextBox.js";
import type { DialogueScript } from "../data/Dialogue.js";

export class DialogueOverlay implements Scene {
  readonly blocksInputBelow = true;
  private textBox: TextBox;

  constructor(script: DialogueScript, private onComplete: () => void) {
    this.textBox = new TextBox(script.lines, script.speaker);
  }

  update(sc: SceneContext): void {
    this.textBox.update(sc.dt);
    if (sc.input.justPressed("confirm") || sc.input.justPressed("cancel")) {
      const done = this.textBox.advance();
      if (done) this.onComplete();
    }
  }

  render(sc: SceneContext): void {
    this.textBox.render(sc.ctx);
  }
}
