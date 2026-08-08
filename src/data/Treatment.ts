import type { Vitals } from "./Patient.js";

export interface TreatmentDef {
  id: string;
  label: string;
  requiredLevel: number;
  costsRound: boolean;
  apply: (vitals: Vitals) => void;
}

export const treatmentDefs: Record<string, TreatmentDef> = {
  assess: {
    id: "assess",
    label: "Assess Patient",
    requiredLevel: 1,
    costsRound: false,
    apply: () => {},
  },
  cpr: {
    id: "cpr",
    label: "Perform CPR",
    requiredLevel: 1,
    costsRound: true,
    apply: (v) => {
      v.heartRate = Math.min(220, v.heartRate + 15);
    },
  },
  airway: {
    id: "airway",
    label: "Open Airway",
    requiredLevel: 1,
    costsRound: true,
    apply: (v) => {
      v.spo2 = Math.min(100, v.spo2 + 6);
    },
  },
  reassure: {
    id: "reassure",
    label: "Reassure Patient",
    requiredLevel: 2,
    costsRound: true,
    apply: (v) => {
      v.pain = Math.max(0, v.pain - 3);
    },
  },
};

export const treatmentOrder = ["assess", "cpr", "airway", "reassure"];
