import type { PlayerState } from "./PlayerState.js";

export function expToNextLevel(level: number): number {
  return 50 + level * 25;
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
}

export function awardExp(state: PlayerState, amount: number): LevelUpResult {
  state.exp += amount;
  let leveledUp = false;
  while (state.exp >= expToNextLevel(state.level)) {
    state.exp -= expToNextLevel(state.level);
    state.level += 1;
    leveledUp = true;
  }
  return { leveledUp, newLevel: state.level };
}
