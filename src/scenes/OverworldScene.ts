import type { Scene, SceneContext } from "../engine/Scene.js";
import type { Game } from "../engine/Game.js";
import { Player } from "../entities/Player.js";
import { NPC } from "../entities/NPC.js";
import { TileMap } from "../world/TileMap.js";
import { Camera } from "../world/Camera.js";
import { renderTileMap } from "../world/TileRenderer.js";
import { drawPersonSprite } from "../world/SpriteRenderer.js";
import { DialogueOverlay } from "./DialogueOverlay.js";
import { dialogueScripts } from "../data/Dialogue.js";

const NPC_PALETTE = { body: "#4a7a4a", head: "#e0a878", accent: "#f1c40f" };

export class OverworldScene implements Scene {
  readonly blocksInputBelow = true;
  readonly player: Player;
  readonly camera = new Camera();
  readonly npcs: NPC[];
  private elapsed = 0;

  constructor(readonly map: TileMap, private game: Game) {
    this.player = new Player(map.playerSpawn.tileX, map.playerSpawn.tileY);
    this.npcs = map.npcs.map((n) => new NPC(n.id, n.tileX, n.tileY, n.facing, n.dialogueId));
    this.camera.follow(this.player.pixelX, this.player.pixelY, map.width, map.height);
  }

  private tryInteract(): void {
    const { tileX, tileY } = this.player.facingTile();
    const npc = this.npcs.find((n) => n.tileX === tileX && n.tileY === tileY);
    if (!npc) return;

    npc.facing = oppositeFacing(this.player.facing);

    const script = dialogueScripts[npc.dialogueId];
    if (!script) return;
    this.game.scenes.push(
      new DialogueOverlay(script, () => this.game.scenes.pop())
    );
  }

  update(sc: SceneContext): void {
    this.elapsed += sc.dt;

    if (!this.player.moving && sc.input.justPressed("confirm")) {
      this.tryInteract();
      return;
    }

    this.player.update(sc.dt, sc.input, this.map);
    this.camera.follow(this.player.pixelX, this.player.pixelY, this.map.width, this.map.height);
  }

  render(sc: SceneContext): void {
    renderTileMap(sc.ctx, this.map, this.camera, this.elapsed);

    const drawables: { pixelY: number; draw: () => void }[] = [
      { pixelY: this.player.pixelY, draw: () => drawPersonSprite(sc.ctx, this.camera, this.player) },
      ...this.npcs.map((npc) => ({
        pixelY: npc.pixelY,
        draw: () => drawPersonSprite(sc.ctx, this.camera, npc, NPC_PALETTE),
      })),
    ];
    drawables.sort((a, b) => a.pixelY - b.pixelY);
    for (const d of drawables) d.draw();
  }
}

function oppositeFacing(facing: "up" | "down" | "left" | "right"): "up" | "down" | "left" | "right" {
  switch (facing) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}
