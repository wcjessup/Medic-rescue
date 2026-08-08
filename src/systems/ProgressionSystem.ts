import type { PlayerState } from "../data/PlayerState.js";
import { awardExp, type LevelUpResult } from "../data/progression.js";
import type { PatientStatus } from "../data/Patient.js";

const EXP_BY_OUTCOME: Record<Exclude<PatientStatus, "active">, number> = {
  stabilized: 40,
  critical: 15,
  lost: 0,
};

export function expForOutcome(outcome: Exclude<PatientStatus, "active">): number {
  return EXP_BY_OUTCOME[outcome];
}

export function resolveEncounterExp(
  state: PlayerState,
  outcome: Exclude<PatientStatus, "active">
): LevelUpResult & { exp: number } {
  const exp = expForOutcome(outcome);
  const result = awardExp(state, exp);
  return { ...result, exp };
}
