import type { PlayerState } from "../data/PlayerState.js";
import { defaultLoadout, itemDefs } from "../data/itemDefs.js";

export function hasItem(state: PlayerState, itemId: string): boolean {
  return (state.inventory[itemId] ?? 0) > 0;
}

export function useItem(state: PlayerState, itemId: string): boolean {
  if (!hasItem(state, itemId)) return false;
  state.inventory[itemId] -= 1;
  return true;
}

export function addItem(state: PlayerState, itemId: string, qty: number): void {
  const max = itemDefs[itemId]?.maxStack ?? qty;
  state.inventory[itemId] = Math.min(max, (state.inventory[itemId] ?? 0) + qty);
}

/** Tops supplies back up to the standard loadout (never reduces what's carried). */
export function restock(state: PlayerState): void {
  for (const [id, qty] of Object.entries(defaultLoadout)) {
    const max = itemDefs[id]?.maxStack ?? qty;
    state.inventory[id] = Math.max(state.inventory[id] ?? 0, Math.min(max, qty));
  }
}
