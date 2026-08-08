import { Patient, type Vitals, stepConsciousness } from "./Patient.js";
import { clamp } from "../utils/math.js";

export interface PatientTemplate {
  id: string;
  callTypeLabel: string;
  names: string[];
  initialVitals: Vitals;
  maxRounds: number;
  requiredTreatments: string[];
  /** Mutates vitals by one round. `requiredMet` = every required treatment has been applied at least once. */
  tick: (vitals: Vitals, requiredMet: boolean) => void;
}

function moveToward(current: number, target: number, maxStep: number): number {
  if (Math.abs(target - current) <= maxStep) return target;
  return current + Math.sign(target - current) * maxStep;
}

export const patientTemplates: Record<string, PatientTemplate> = {
  cardiac: {
    id: "cardiac",
    callTypeLabel: "Cardiac Emergency",
    names: ["Robert Chen", "Maria Alvarez", "Tom Whitfield"],
    initialVitals: {
      heartRate: 145,
      bpSystolic: 90,
      bpDiastolic: 60,
      spo2: 88,
      consciousness: "pain",
      bleeding: 0,
      pain: 7,
    },
    maxRounds: 8,
    requiredTreatments: ["aed"],
    tick: (v, requiredMet) => {
      if (requiredMet) {
        v.heartRate = moveToward(v.heartRate, 80, 6);
        v.spo2 = clamp(moveToward(v.spo2, 98, 3), 0, 100);
        v.bpSystolic = moveToward(v.bpSystolic, 120, 5);
        if (v.spo2 > 90 && v.heartRate >= 60 && v.heartRate <= 100) {
          v.consciousness = stepConsciousness(v.consciousness, 1);
        }
      } else {
        v.heartRate = clamp(v.heartRate - 10, 0, 220);
        v.spo2 = clamp(v.spo2 - 4, 0, 100);
        if (v.heartRate <= 40) v.consciousness = "unresponsive";
      }
    },
  },
  mva: {
    id: "mva",
    callTypeLabel: "Vehicle Collision",
    names: ["Jordan Blake", "Priya Nair", "Sam Ortiz"],
    initialVitals: {
      heartRate: 110,
      bpSystolic: 100,
      bpDiastolic: 65,
      spo2: 95,
      consciousness: "verbal",
      bleeding: 2,
      pain: 8,
    },
    maxRounds: 9,
    requiredTreatments: ["bandage", "splint"],
    tick: (v, requiredMet) => {
      if (requiredMet) {
        v.bpSystolic = moveToward(v.bpSystolic, 120, 5);
        v.spo2 = clamp(moveToward(v.spo2, 97, 2), 0, 100);
        v.heartRate = moveToward(v.heartRate, 80, 4);
        if (v.bpSystolic > 100) v.consciousness = stepConsciousness(v.consciousness, 1);
      } else if (v.bleeding > 0) {
        v.bpSystolic = clamp(v.bpSystolic - 8, 0, 200);
        v.heartRate = clamp(v.heartRate + 6, 0, 220);
        if (v.bpSystolic <= 75) v.consciousness = stepConsciousness(v.consciousness, -1);
      }
    },
  },
  overdose: {
    id: "overdose",
    callTypeLabel: "Suspected Overdose",
    names: ["Casey Morgan", "Alex Rivera", "Devon Lee"],
    initialVitals: {
      heartRate: 58,
      bpSystolic: 95,
      bpDiastolic: 60,
      spo2: 82,
      consciousness: "unresponsive",
      bleeding: 0,
      pain: 1,
    },
    maxRounds: 7,
    requiredTreatments: ["meds"],
    tick: (v, requiredMet) => {
      if (requiredMet) {
        v.spo2 = clamp(moveToward(v.spo2, 97, 5), 0, 100);
        v.heartRate = moveToward(v.heartRate, 78, 4);
        if (v.spo2 > 90) v.consciousness = stepConsciousness(v.consciousness, 1);
      } else {
        v.spo2 = clamp(v.spo2 - 6, 0, 100);
        v.heartRate = clamp(v.heartRate - 3, 0, 220);
        if (v.spo2 < 75) v.consciousness = "unresponsive";
      }
    },
  },
};

let callCounter = 0;

export function createPatientFromTemplate(templateId: string): Patient {
  const t = patientTemplates[templateId];
  const name = t.names[Math.floor(Math.random() * t.names.length)];
  callCounter += 1;
  return new Patient(
    `call-${callCounter}`,
    name,
    t.id,
    t.callTypeLabel,
    t.initialVitals,
    t.maxRounds,
    t.requiredTreatments
  );
}
