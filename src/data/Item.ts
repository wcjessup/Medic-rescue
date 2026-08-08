import type { Vitals } from "./Patient.js";

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  maxStack: number;
  apply: (vitals: Vitals) => void;
}
