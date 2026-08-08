import { TileMap, TileType } from "../TileMap.js";

const LEGEND: Record<string, TileType> = {
  ".": TileType.Grass,
  "#": TileType.Path,
  B: TileType.Building,
  "~": TileType.Water,
  D: TileType.Door,
};

// A small test town: station in the top-left, a pond, open grass to
// explore. Rows must all be the same length.
const LAYOUT = [
  "BBBB..............",
  "BBBB..............",
  "BBBD..............",
  "####..........~~~.",
  "#..............~~~",
  "#..................",
  "#..........~~~.....",
  "#..........~~~.....",
  "#...................",
  "#...................",
  "#####################",
  ".....................",
  ".....................",
];

function parseLayout(rows: string[]): TileType[][] {
  const width = Math.max(...rows.map((r) => r.length));
  return rows.map((row) => {
    const padded = row.padEnd(width, ".");
    return Array.from(padded, (ch) => LEGEND[ch] ?? TileType.Grass);
  });
}

export function createTownMap(): TileMap {
  return new TileMap({
    tiles: parseLayout(LAYOUT),
    playerSpawn: { tileX: 4, tileY: 4 },
    npcs: [
      { id: "chief", tileX: 3, tileY: 3, facing: "down", dialogueId: "npc.chief" },
      { id: "bystander", tileX: 10, tileY: 8, facing: "down", dialogueId: "npc.bystander" },
    ],
    callSites: [],
  });
}
