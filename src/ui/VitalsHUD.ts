import type { Patient } from "../data/Patient.js";
import { COLORS, VIEW_WIDTH } from "../utils/constants.js";

export function renderVitalsHUD(ctx: CanvasRenderingContext2D, patient: Patient): void {
  const x = 8;
  const w = VIEW_WIDTH - 16;

  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(x, 8, w, 92);
  ctx.strokeStyle = COLORS.textBoxBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, 8.5, w - 1, 91);

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(patient.name, x + 8, 24);
  ctx.font = "10px sans-serif";
  ctx.fillText(patient.callTypeLabel, x + 8, 36);

  ctx.font = "10px monospace";
  const v = patient.vitals;
  const rows = patient.assessed
    ? [
        `HR: ${Math.round(v.heartRate)} bpm`,
        `BP: ${Math.round(v.bpSystolic)}/${Math.round(v.bpDiastolic)}`,
        `SpO2: ${Math.round(v.spo2)}%`,
        `Consciousness: ${v.consciousness.toUpperCase()}`,
        `Bleeding: ${"*".repeat(v.bleeding)}${".".repeat(3 - v.bleeding)}`,
        `Pain: ${v.pain}/10`,
      ]
    : ["Vitals unknown.", "Assess the patient first."];

  rows.forEach((row, i) => {
    ctx.fillText(row, x + 8, 50 + i * 12);
  });

  ctx.textAlign = "right";
  ctx.font = "10px sans-serif";
  ctx.fillText(`Round ${patient.roundsElapsed}/${patient.maxRounds}`, x + w - 8, 24);
  ctx.textAlign = "left";
}
