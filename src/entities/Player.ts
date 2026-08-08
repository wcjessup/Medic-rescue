import { Entity, type Facing } from "./Entity.js";
import type { Input, InputAction } from "../engine/Input.js";
import type { TileMap } from "../world/TileMap.js";
import { TILE_SIZE, MOVE_DURATION_MS } from "../utils/constants.js";
import { lerp } from "../utils/math.js";

const DIRECTIONS: { action: InputAction; facing: Facing; dx: number; dy: number }[] = [
  { action: "up", facing: "up", dx: 0, dy: -1 },
  { action: "down", facing: "down", dx: 0, dy: 1 },
  { action: "left", facing: "left", dx: -1, dy: 0 },
  { action: "right", facing: "right", dx: 1, dy: 0 },
];

/**
 * Classic grid-based movement: holding a direction the character isn't
 * already facing just turns them to face it (first press); the next tick
 * facing that direction (or a continued hold) steps them one tile, animated
 * over MOVE_DURATION_MS. Matches early Pokémon-style overworld feel.
 */
export class Player extends Entity {
  moving = false;
  private moveT = 0;
  private fromX = 0;
  private fromY = 0;
  private toX = 0;
  private toY = 0;

  constructor(tileX: number, tileY: number) {
    super(tileX, tileY, "down");
  }

  /** Returns the tile the player is facing (for interaction / encounter checks). */
  facingTile(): { tileX: number; tileY: number } {
    const dir = DIRECTIONS.find((d) => d.facing === this.facing)!;
    return { tileX: this.tileX + dir.dx, tileY: this.tileY + dir.dy };
  }

  update(dtSeconds: number, input: Input, map: TileMap): boolean {
    let justArrived = false;

    if (this.moving) {
      this.moveT += (dtSeconds * 1000) / MOVE_DURATION_MS;
      if (this.moveT >= 1) {
        this.moveT = 1;
        this.moving = false;
        this.tileX = this.toX;
        this.tileY = this.toY;
        justArrived = true;
      }
      this.pixelX = lerp(this.fromX * TILE_SIZE, this.toX * TILE_SIZE, this.moveT);
      this.pixelY = lerp(this.fromY * TILE_SIZE, this.toY * TILE_SIZE, this.moveT);
      return justArrived;
    }

    const dir = DIRECTIONS.find((d) => input.isDown(d.action));
    if (!dir) return false;

    if (this.facing !== dir.facing) {
      this.facing = dir.facing;
      return false;
    }

    const targetX = this.tileX + dir.dx;
    const targetY = this.tileY + dir.dy;
    if (!map.isWalkable(targetX, targetY)) return false;

    this.fromX = this.tileX;
    this.fromY = this.tileY;
    this.toX = targetX;
    this.toY = targetY;
    this.moveT = 0;
    this.moving = true;
    return false;
  }
}
