import { VIEW_WIDTH, VIEW_HEIGHT, TILE_SIZE } from "../utils/constants.js";
import { clamp } from "../utils/math.js";

function axis(desiredTopLeft: number, mapSizePx: number, viewSizePx: number): number {
  if (mapSizePx <= viewSizePx) return (mapSizePx - viewSizePx) / 2;
  return clamp(desiredTopLeft, 0, mapSizePx - viewSizePx);
}

/** Follows a target's pixel center, clamped (or centered) to map bounds. */
export class Camera {
  x = 0;
  y = 0;

  follow(targetPixelX: number, targetPixelY: number, mapWidthTiles: number, mapHeightTiles: number): void {
    const mapWidthPx = mapWidthTiles * TILE_SIZE;
    const mapHeightPx = mapHeightTiles * TILE_SIZE;
    const centerX = targetPixelX + TILE_SIZE / 2 - VIEW_WIDTH / 2;
    const centerY = targetPixelY + TILE_SIZE / 2 - VIEW_HEIGHT / 2;
    this.x = axis(centerX, mapWidthPx, VIEW_WIDTH);
    this.y = axis(centerY, mapHeightPx, VIEW_HEIGHT);
  }
}
