import { TILE_SIZE } from "../utils/constants.js";

export type Facing = "up" | "down" | "left" | "right";

export class Entity {
  tileX: number;
  tileY: number;
  pixelX: number;
  pixelY: number;
  facing: Facing;

  constructor(tileX: number, tileY: number, facing: Facing = "down") {
    this.tileX = tileX;
    this.tileY = tileY;
    this.pixelX = tileX * TILE_SIZE;
    this.pixelY = tileY * TILE_SIZE;
    this.facing = facing;
  }
}
