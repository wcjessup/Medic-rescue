import type { Scene, SceneContext } from "../engine/Scene.js";
import type { PlayerState } from "../data/PlayerState.js";
import type { TileMap } from "../world/TileMap.js";
import { restock } from "../systems/InventorySystem.js";
import { saveGame } from "../systems/SaveSystem.js";
import { Menu } from "../ui/Menu.js";
import { COLORS, VIEW_WIDTH, VIEW_HEIGHT } from "../utils/constants.js";

export class StationScene implements Scene {
  readonly blocksInputBelow = true;
  private menu: Menu<string>;
  private message = "";

  constructor(private playerState: PlayerState, private map: TileMap, private onClose: () => void) {
    this.menu = new Menu([
      { label: "Restock Supplies", value: "restock" },
      { label: "Save Game", value: "save" },
      { label: "Advance to Next Shift", value: "shift" },
      { label: "Back", value: "back" },
    ]);
  }

  update(sc: SceneContext): void {
    if (sc.input.justPressed("cancel")) {
      this.onClose();
      return;
    }

    const choice = this.menu.handleInput(sc.input);
    if (choice === undefined) return;

    if (choice === "restock") {
      restock(this.playerState);
      this.message = "Supplies restocked.";
    } else if (choice === "save") {
      saveGame(this.playerState);
      this.message = "Game saved.";
    } else if (choice === "shift") {
      for (const site of this.map.callSites) site.resolvedThisShift = false;
      restock(this.playerState);
      this.playerState.day += 1;
      this.message = `Shift ${this.playerState.day} begun — new calls are coming in.`;
    } else if (choice === "back") {
      this.onClose();
    }
  }

  render(sc: SceneContext): void {
    const { ctx } = sc;
    ctx.fillStyle = "#122436";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Fire Station 7", VIEW_WIDTH / 2, 28);
    ctx.font = "10px sans-serif";
    ctx.fillText(`Day ${this.playerState.day} — Level ${this.playerState.level}`, VIEW_WIDTH / 2, 44);
    ctx.textAlign = "left";

    this.menu.render(ctx, 24, 90, VIEW_WIDTH - 48, 16);

    if (this.message) {
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.warn;
      ctx.font = "10px sans-serif";
      ctx.fillText(this.message, VIEW_WIDTH / 2, VIEW_HEIGHT - 20);
      ctx.textAlign = "left";
    }
  }
}
