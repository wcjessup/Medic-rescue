export enum TileType {
  Grass = 0,
  Path = 1,
  Building = 2,
  Water = 3,
  Floor = 4,
  Door = 5,
}

const SOLID_TILES = new Set<TileType>([TileType.Building, TileType.Water]);

export interface CallSite {
  id: string;
  tileX: number;
  tileY: number;
  patientDefId: string;
  resolvedThisShift: boolean;
}

export interface NpcSpawn {
  id: string;
  tileX: number;
  tileY: number;
  dialogueId: string;
  facing: "up" | "down" | "left" | "right";
}

export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: TileType[][];
  readonly playerSpawn: { tileX: number; tileY: number };
  readonly npcs: NpcSpawn[];
  readonly callSites: CallSite[];

  constructor(opts: {
    tiles: TileType[][];
    playerSpawn: { tileX: number; tileY: number };
    npcs?: NpcSpawn[];
    callSites?: CallSite[];
  }) {
    this.tiles = opts.tiles;
    this.height = opts.tiles.length;
    this.width = opts.tiles[0]?.length ?? 0;
    this.playerSpawn = opts.playerSpawn;
    this.npcs = opts.npcs ?? [];
    this.callSites = opts.callSites ?? [];
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  getTile(tx: number, ty: number): TileType | undefined {
    return this.tiles[ty]?.[tx];
  }

  isWalkable(tx: number, ty: number): boolean {
    if (!this.inBounds(tx, ty)) return false;
    const tile = this.tiles[ty][tx];
    if (SOLID_TILES.has(tile)) return false;
    if (this.npcs.some((n) => n.tileX === tx && n.tileY === ty)) return false;
    return true;
  }

  npcAt(tx: number, ty: number): NpcSpawn | undefined {
    return this.npcs.find((n) => n.tileX === tx && n.tileY === ty);
  }

  callSiteAt(tx: number, ty: number): CallSite | undefined {
    return this.callSites.find((c) => c.tileX === tx && c.tileY === ty);
  }
}
