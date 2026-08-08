import type { PlayerState } from "../data/PlayerState.js";

const SAVE_KEY = "paramedic-rescue-save-v1";
const SAVE_VERSION = 1;

interface SaveData {
  version: number;
  playerState: PlayerState;
}

// In-memory fallback for when localStorage is unavailable or blocked (a real
// possibility inside the Artifact tool's sandboxed iframe) — the game still
// works fully within the session, it just won't persist across reloads.
let memoryFallback: SaveData | null = null;

function getStorage(): Storage | null {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (!storage) return null;
    const probeKey = "__pr_probe__";
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return null;
  }
}

export function saveGame(playerState: PlayerState): void {
  const data: SaveData = { version: SAVE_VERSION, playerState };
  const storage = getStorage();
  if (storage) {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
  } else {
    memoryFallback = data;
  }
}

export function loadGame(): PlayerState | null {
  const storage = getStorage();
  if (storage) {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SaveData;
      return data.playerState;
    } catch {
      return null;
    }
  }
  return memoryFallback?.playerState ?? null;
}

export function hasSaveGame(): boolean {
  const storage = getStorage();
  if (storage) return storage.getItem(SAVE_KEY) !== null;
  return memoryFallback !== null;
}
