import type { ItemDef } from "./Item.js";

export const itemDefs: Record<string, ItemDef> = {
  bandage: {
    id: "bandage",
    name: "Bandage",
    description: "Slows external bleeding.",
    requiredLevel: 1,
    maxStack: 5,
    apply: (v) => {
      v.bleeding = Math.max(0, v.bleeding - 1);
    },
  },
  oxygen: {
    id: "oxygen",
    name: "Oxygen Tank",
    description: "Boosts blood oxygen saturation.",
    requiredLevel: 1,
    maxStack: 3,
    apply: (v) => {
      v.spo2 = Math.min(100, v.spo2 + 10);
    },
  },
  splint: {
    id: "splint",
    name: "Splint",
    description: "Immobilizes a fracture, easing pain and bleeding.",
    requiredLevel: 1,
    maxStack: 3,
    apply: (v) => {
      v.pain = Math.max(0, v.pain - 4);
      v.bleeding = Math.max(0, v.bleeding - 1);
    },
  },
  aed: {
    id: "aed",
    name: "AED",
    description: "Delivers a defibrillating shock.",
    requiredLevel: 2,
    maxStack: 2,
    apply: (v) => {
      v.heartRate = 85;
      if (v.consciousness === "unresponsive") v.consciousness = "pain";
    },
  },
  meds: {
    id: "meds",
    name: "Naloxone",
    description: "Reverses respiratory depression.",
    requiredLevel: 2,
    maxStack: 3,
    apply: (v) => {
      v.spo2 = Math.min(100, v.spo2 + 8);
      v.heartRate = Math.min(120, v.heartRate + 10);
      if (v.consciousness === "unresponsive") v.consciousness = "pain";
    },
  },
};

export const defaultLoadout: Record<string, number> = {
  bandage: 3,
  oxygen: 2,
  splint: 2,
  aed: 1,
  meds: 2,
};

export const itemOrder = ["bandage", "oxygen", "splint", "aed", "meds"];
