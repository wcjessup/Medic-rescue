import { TileMap, TileType } from "./TileMap.js";
import { Camera } from "./Camera.js";
import { TILE_SIZE, VIEW_WIDTH, VIEW_HEIGHT } from "../utils/constants.js";

function drawGrass(ctx: CanvasRenderingContext2D, px: number, py: number, seed: number): void {
  ctx.fillStyle = "#3a9d3a";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#2f8a2f";
  const dots = [
    [6, 8],
    [20, 14],
    [12, 24],
  ];
  for (let i = 0; i < dots.length; i++) {
    const [dx, dy] = dots[(i + seed) % dots.length];
    ctx.fillRect(px + dx, py + dy, 2, 2);
  }
}

function drawPath(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = "#c9a86a";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#b8945a";
  ctx.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);
}

function drawBuilding(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#6b3f1a";
  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
}

function drawDoor(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = "#c9a86a";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "#4a2e14";
  ctx.fillRect(px + 8, py + 6, TILE_SIZE - 16, TILE_SIZE - 6);
}

function drawWater(ctx: CanvasRenderingContext2D, px: number, py: number, t: number): void {
  ctx.fillStyle = "#2f6fb3";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#5b9bd6";
  ctx.lineWidth = 1;
  const wave = Math.sin(t * 2 + px * 0.1) * 2;
  ctx.beginPath();
  ctx.moveTo(px + 2, py + 16 + wave);
  ctx.lineTo(px + 30, py + 16 + wave);
  ctx.stroke();
}

function drawFloor(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = "#d8d0c0";
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "#c0b8a8";
  ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
}

export function renderTileMap(
  ctx: CanvasRenderingContext2D,
  map: TileMap,
  camera: Camera,
  elapsedSeconds: number
): void {
  const startTx = Math.floor(camera.x / TILE_SIZE);
  const startTy = Math.floor(camera.y / TILE_SIZE);
  const endTx = Math.ceil((camera.x + VIEW_WIDTH) / TILE_SIZE);
  const endTy = Math.ceil((camera.y + VIEW_HEIGHT) / TILE_SIZE);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (let ty = startTy; ty < endTy; ty++) {
    for (let tx = startTx; tx < endTx; tx++) {
      const tile = map.getTile(tx, ty);
      if (tile === undefined) continue;
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;
      switch (tile) {
        case TileType.Grass:
          drawGrass(ctx, px, py, tx + ty);
          break;
        case TileType.Path:
          drawPath(ctx, px, py);
          break;
        case TileType.Building:
          drawBuilding(ctx, px, py);
          break;
        case TileType.Door:
          drawDoor(ctx, px, py);
          break;
        case TileType.Water:
          drawWater(ctx, px, py, elapsedSeconds);
          break;
        case TileType.Floor:
          drawFloor(ctx, px, py);
          break;
      }
    }
  }

  ctx.restore();
}
