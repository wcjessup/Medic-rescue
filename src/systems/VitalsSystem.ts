import type { Patient } from "../data/Patient.js";
import { patientTemplates } from "../data/patientDefs.js";

const SAFE = { hrMin: 60, hrMax: 100, spo2Min: 94, bpMin: 100, bpMax: 140 };

export function isStable(patient: Patient): boolean {
  const v = patient.vitals;
  return (
    v.bleeding === 0 &&
    v.spo2 >= SAFE.spo2Min &&
    v.heartRate >= SAFE.hrMin &&
    v.heartRate <= SAFE.hrMax &&
    v.bpSystolic >= SAFE.bpMin &&
    v.bpSystolic <= SAFE.bpMax &&
    v.consciousness === "alert"
  );
}

export function isLethal(patient: Patient): boolean {
  const v = patient.vitals;
  return (
    v.spo2 <= 70 ||
    v.heartRate <= 25 ||
    v.heartRate >= 190 ||
    v.bpSystolic <= 60 ||
    (v.consciousness === "unresponsive" && v.bleeding >= 3)
  );
}

/** Advances the patient by one round: applies passive tick, then re-evaluates status. */
export function advanceRound(patient: Patient): void {
  const template = patientTemplates[patient.callTypeId];
  template.tick(patient.vitals, patient.requiredMet);
  patient.roundsElapsed += 1;

  if (isLethal(patient)) {
    patient.status = "lost";
  } else if (patient.requiredMet && isStable(patient)) {
    patient.status = "stabilized";
  } else if (patient.roundsElapsed >= patient.maxRounds) {
    patient.status = "critical";
  }
}
