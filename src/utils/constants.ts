export const TILE_SIZE = 32;

// Logical (CSS pixel) resolution the game renders at; canvas is scaled up
// to fill the viewport and devicePixelRatio-scaled internally for crispness.
export const VIEW_WIDTH_TILES = 10;
export const VIEW_HEIGHT_TILES = 8;
export const VIEW_WIDTH = VIEW_WIDTH_TILES * TILE_SIZE;
export const VIEW_HEIGHT = VIEW_HEIGHT_TILES * TILE_SIZE;

export const MOVE_DURATION_MS = 160;

export const COLORS = {
  bg: "#0a0a0a",
  textBoxBg: "#1a1a2e",
  textBoxBorder: "#eaeaea",
  text: "#ffffff",
  hudBg: "#16213e",
  danger: "#e94560",
  ok: "#2ecc71",
  warn: "#f1c40f",
};
