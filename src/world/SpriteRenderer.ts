import type { Camera } from "./Camera.js";
import type { Facing } from "../entities/Entity.js";
import { TILE_SIZE } from "../utils/constants.js";

export interface DrawableEntity {
  pixelX: number;
  pixelY: number;
  facing: Facing;
}

function facingOffset(facing: Facing): { dx: number; dy: number } {
  switch (facing) {
    case "up":
      return { dx: 0, dy: -1 };
    case "down":
      return { dx: 0, dy: 1 };
    case "left":
      return { dx: -1, dy: 0 };
    case "right":
      return { dx: 1, dy: 0 };
  }
}

/** Draws a simple layered-shape humanoid (EMT palette) facing a direction. */
export function drawPersonSprite(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  entity: DrawableEntity,
  palette: { body: string; head: string; accent: string } = {
    body: "#2b6cb0",
    head: "#f0c090",
    accent: "#e94560",
  }
): void {
  const px = entity.pixelX - camera.x;
  const py = entity.pixelY - camera.y;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 4, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = palette.body;
  ctx.fillRect(px + 8, py + 14, TILE_SIZE - 16, TILE_SIZE - 18);

  // Accent cross (paramedic marking)
  ctx.fillStyle = palette.accent;
  ctx.fillRect(px + TILE_SIZE / 2 - 1, py + 18, 2, 8);
  ctx.fillRect(px + TILE_SIZE / 2 - 4, py + 21, 8, 2);

  // Head
  ctx.fillStyle = palette.head;
  ctx.beginPath();
  ctx.arc(px + TILE_SIZE / 2, py + 10, 7, 0, Math.PI * 2);
  ctx.fill();

  // Facing indicator (small dot offset in the direction faced)
  const { dx, dy } = facingOffset(entity.facing);
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(px + TILE_SIZE / 2 + dx * 4, py + 10 + dy * 4, 1.5, 0, Math.PI * 2);
  ctx.fill();
}
