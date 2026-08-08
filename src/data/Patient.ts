export type Consciousness = "alert" | "verbal" | "pain" | "unresponsive";

const AVPU_ORDER: Consciousness[] = ["unresponsive", "pain", "verbal", "alert"];

/** Moves consciousness up (delta>0) or down (delta<0) the AVPU scale, clamped. */
export function stepConsciousness(level: Consciousness, delta: number): Consciousness {
  const idx = Math.max(0, Math.min(AVPU_ORDER.length - 1, AVPU_ORDER.indexOf(level) + delta));
  return AVPU_ORDER[idx];
}

export interface Vitals {
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  spo2: number;
  consciousness: Consciousness;
  bleeding: number; // 0-3 severity
  pain: number; // 0-10
}

export type PatientStatus = "active" | "stabilized" | "critical" | "lost";

export class Patient {
  vitals: Vitals;
  status: PatientStatus = "active";
  roundsElapsed = 0;
  maxRounds: number;
  assessed = false;
  backupCalled = false;
  readonly appliedTreatments = new Set<string>();

  constructor(
    readonly callId: string,
    readonly name: string,
    readonly callTypeId: string,
    readonly callTypeLabel: string,
    initialVitals: Vitals,
    maxRounds: number,
    readonly requiredTreatments: string[]
  ) {
    this.vitals = { ...initialVitals };
    this.maxRounds = maxRounds;
  }

  get requiredMet(): boolean {
    return this.requiredTreatments.every((id) => this.appliedTreatments.has(id));
  }
}
