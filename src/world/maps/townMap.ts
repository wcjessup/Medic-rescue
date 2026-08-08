import { TileMap, TileType } from "../TileMap.js";

const WIDTH = 20;
const HEIGHT = 14;

function buildTiles(): TileType[][] {
  const tiles: TileType[][] = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(TileType.Grass));

  // Station building, top-left, with a door on its south wall.
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 4; x++) tiles[y][x] = TileType.Building;
  }
  tiles[2][3] = TileType.Door;

  // Path from the station door, then down the west edge of town.
  for (let x = 0; x < 4; x++) tiles[3][x] = TileType.Path;
  for (let y = 3; y < HEIGHT; y++) tiles[y][0] = TileType.Path;

  // Pond.
  for (let y = 4; y < 7; y++) {
    for (let x = 12; x < 16; x++) tiles[y][x] = TileType.Water;
  }

  return tiles;
}

export function createTownMap(): TileMap {
  return new TileMap({
    tiles: buildTiles(),
    playerSpawn: { tileX: 4, tileY: 4 },
    npcs: [
      { id: "chief", tileX: 3, tileY: 4, facing: "up", dialogueId: "npc.chief" },
      { id: "bystander", tileX: 10, tileY: 9, facing: "down", dialogueId: "npc.bystander" },
    ],
    callSites: [
      { id: "call-cardiac-1", tileX: 8, tileY: 3, patientDefId: "cardiac", resolvedThisShift: false },
      { id: "call-mva-1", tileX: 16, tileY: 9, patientDefId: "mva", resolvedThisShift: false },
      { id: "call-overdose-1", tileX: 3, tileY: 11, patientDefId: "overdose", resolvedThisShift: false },
    ],
  });
}
