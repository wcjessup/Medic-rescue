import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialPlayerState } from "../src/data/PlayerState.js";
import { saveGame, loadGame, hasSaveGame } from "../src/systems/SaveSystem.js";

// The Node test environment has no `localStorage` global, so these
// exercises run against SaveSystem's in-memory fallback path — the same
// path used when the Artifact tool's sandboxed iframe blocks storage.

test("no save exists before saveGame is called", () => {
  assert.equal(hasSaveGame(), false);
  assert.equal(loadGame(), null);
});

test("save/load round-trips player state", () => {
  const state = createInitialPlayerState();
  state.level = 3;
  state.exp = 12;
  state.inventory.bandage = 1;
  state.day = 2;

  saveGame(state);

  assert.equal(hasSaveGame(), true);
  const loaded = loadGame();
  assert.deepEqual(loaded, state);
});
