import type { Scene, SceneContext } from "../engine/Scene.js";
import { Player } from "../entities/Player.js";
import { TileMap } from "../world/TileMap.js";
import { Camera } from "../world/Camera.js";
import { renderTileMap } from "../world/TileRenderer.js";
import { drawPersonSprite } from "../world/SpriteRenderer.js";

export class OverworldScene implements Scene {
  readonly blocksInputBelow = true;
  readonly player: Player;
  readonly camera = new Camera();
  private elapsed = 0;

  constructor(readonly map: TileMap) {
    this.player = new Player(map.playerSpawn.tileX, map.playerSpawn.tileY);
    this.camera.follow(this.player.pixelX, this.player.pixelY, map.width, map.height);
  }

  update(sc: SceneContext): void {
    this.elapsed += sc.dt;
    this.player.update(sc.dt, sc.input, this.map);
    this.camera.follow(this.player.pixelX, this.player.pixelY, this.map.width, this.map.height);
  }

  render(sc: SceneContext): void {
    renderTileMap(sc.ctx, this.map, this.camera, this.elapsed);
    drawPersonSprite(sc.ctx, this.camera, this.player);
  }
}
