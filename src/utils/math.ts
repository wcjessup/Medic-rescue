export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function tileToPixel(tile: number, tileSize: number): number {
  return tile * tileSize;
}

export function pixelToTile(pixel: number, tileSize: number): number {
  return Math.floor(pixel / tileSize);
}
