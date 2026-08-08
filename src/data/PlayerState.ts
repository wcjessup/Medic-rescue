import { defaultLoadout } from "./itemDefs.js";

export interface PlayerState {
  level: number;
  exp: number;
  inventory: Record<string, number>;
  day: number;
}

export function createInitialPlayerState(): PlayerState {
  return { level: 1, exp: 0, inventory: { ...defaultLoadout }, day: 1 };
}
