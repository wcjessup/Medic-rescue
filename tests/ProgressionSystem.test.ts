import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialPlayerState } from "../src/data/PlayerState.js";
import { resolveEncounterExp } from "../src/systems/ProgressionSystem.js";

test("stabilizing a patient awards full EXP", () => {
  const state = createInitialPlayerState();
  const result = resolveEncounterExp(state, "stabilized");
  assert.equal(result.exp, 40);
  assert.equal(state.exp, 40);
});

test("losing a patient awards no EXP", () => {
  const state = createInitialPlayerState();
  resolveEncounterExp(state, "lost");
  assert.equal(state.exp, 0);
});

test("enough EXP levels the player up and carries over remainder", () => {
  const state = createInitialPlayerState();
  assert.equal(state.level, 1);
  // expToNextLevel(1) = 75; two stabilized calls (80 exp) should push past it.
  resolveEncounterExp(state, "stabilized");
  const result = resolveEncounterExp(state, "stabilized");
  assert.equal(state.level, 2);
  assert.equal(result.leveledUp, true);
  assert.equal(state.exp, 5);
});
