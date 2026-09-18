import { formatClock } from "../core/clock.js";
import { getMed } from "../data/meds.js";
import { getEquipment } from "../data/equipment.js";
import { PRIMARY_SURVEY_STEPS } from "./primarySurvey.js";

let noteId = 0;

export class Encounter {
  constructor(caseDef) {
    this.caseDef = caseDef;
    this.minutes = 0;
    this.vitals = { ...caseDef.baselineVitals };
    this.rhythm = caseDef.initialRhythm || "sinus-normal";
    this.arrested = !!caseDef.startsArrested;
    this.cprActive = false;
    this.conscious = caseDef.startsConscious !== false;
    this.monitorAttached = false;
    this.spo2Attached = false;
    this.proceduresDone = {};
    this.medsGiven = [];
    this.shocksGiven = [];
    this.vitalsHistory = [];
    this.notepad = [];
    this.historyAsked = new Set();
    this.examDone = new Set();
    this.flags = { ...(caseDef.initialFlags || {}) };
    this.ended = false;
    this.diagnosisId = null;
    this.dispositionId = null;
    this.log = [];
    this.listeners = [];

    this.addNote("dispatch", `Dispatched: ${caseDef.dispatchText.split("\n")[0]}`);
    if (typeof caseDef.tick === "function") caseDef.tick(this, 0);
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  _emit(kind, payload) {
    this.log.push({ t: this.minutes, kind, payload });
    for (const fn of this.listeners) fn(kind, payload);
  }

  clockLabel() {
    return formatClock(this.caseDef.dispatchMinuteOfDay, this.minutes);
  }

  addNote(cat, text) {
    const entry = { id: ++noteId, t: this.minutes, label: this.clockLabel(), cat, text };
    this.notepad.push(entry);
    this._emit("note", entry);
    return entry;
  }

  _tick(dtMinutes) {
    if (dtMinutes > 0) this.minutes += dtMinutes;
    if (typeof this.caseDef.tick === "function") {
      this.caseDef.tick(this, dtMinutes);
    }
    this._emit("tick", { dt: dtMinutes });
  }

  // ---------------- info gathering ----------------

  askHistory(qid) {
    const q = this.caseDef.history.find((h) => h.id === qid);
    if (!q || this.historyAsked.has(qid)) return null;
    this.historyAsked.add(qid);
    const answer = typeof q.answer === "function" ? q.answer(this) : q.answer;
    this.addNote("history", `${q.text} — ${answer}`);
    this._tick(q.minutes ?? 0.5);
    this._emit("history", { qid });
    return answer;
  }

  examine(regionId, examType) {
    const region = this.caseDef.exam[regionId];
    if (!region) return null;
    const finding = region.findings.find((f) => f.type === examType);
    if (!finding) return null;
    const key = `${regionId}:${examType}`;
    if (this.examDone.has(key)) return null;
    this.examDone.add(key);
    const text = typeof finding.text === "function" ? finding.text(this) : finding.text;
    this.addNote("exam", `[${region.label || regionId}/${finding.label || examType}] ${text}`);
    this._tick(finding.minutes ?? 1);
    if (this.caseDef.onExam) this.caseDef.onExam(this, { regionId, examType });
    this._emit("exam", { regionId, examType });
    return text;
  }

  // ---------------- vitals ----------------

  takeVitals() {
    this._tick(3);
    const v = this.vitals;
    const snap = {
      tMin: this.minutes,
      label: this.clockLabel(),
      hr: this.monitorAttached ? Math.round(v.hr) : null,
      rhythm: this.monitorAttached ? this.rhythm : null,
      sbp: Math.round(v.sbp),
      dbp: Math.round(v.dbp),
      rr: Math.round(v.rr),
      spo2: this.spo2Attached ? Math.round(v.spo2) : null,
      temp: Math.round(v.temp * 10) / 10,
      gcs: Math.round(v.gcs),
      etco2: this.hasCapnography() ? Math.round(v.etco2 ?? 35) : null,
      bgl: this.flags.bglChecked ? v.bgl : null,
      armAsymmetry: this.flags.armAsymmetryFound || false,
    };
    this.vitalsHistory.push(snap);
    const parts = [
      `HR ${snap.hr ?? "—"}`,
      `BP ${snap.sbp}/${snap.dbp}`,
      `RR ${snap.rr}`,
      `SpO2 ${snap.spo2 ?? "—"}%`,
      `Temp ${snap.temp}°C`,
      `GCS ${snap.gcs}`,
    ];
    this.addNote("vitals", `Obs @ ${snap.label}: ${parts.join(", ")}`);
    this._emit("vitals", snap);
    return snap;
  }

  hasCapnography() {
    return this.monitorAttached && ["ett", "sga"].includes(this.proceduresDone.airway?.type);
  }

  performSpecial(id) {
    const def = (this.caseDef.specialAssessments || []).find((s) => s.id === id);
    if (!def || this.examDone.has(`special:${id}`)) return null;
    this.examDone.add(`special:${id}`);
    const text = typeof def.text === "function" ? def.text(this) : def.text;
    this.addNote("exam", `[${def.label}] ${text}`);
    if (def.flagsSet) Object.assign(this.flags, def.flagsSet);
    this._tick(def.minutes ?? 1);
    if (def.onPerform) def.onPerform(this);
    if (this.caseDef.onExam) this.caseDef.onExam(this, { regionId: null, examType: "special", specialId: id });
    this._emit("special", { id });
    return text;
  }

  sceneAssessment(id) {
    const def = this.caseDef.scene?.[id];
    if (!def) return null;
    const key = `scene:${id}`;
    if (this.examDone.has(key)) return null;
    this.examDone.add(key);
    const text = typeof def.text === "function" ? def.text(this) : def.text;
    this.addNote("scene", `[${def.label}] ${text}`);
    this._tick(def.minutes ?? 0.5);
    this._emit("scene", { id });
    return text;
  }

  primarySurvey(id) {
    const step = PRIMARY_SURVEY_STEPS.find((s) => s.id === id);
    if (!step) return null;
    const key = `primary:${id}`;
    if (this.examDone.has(key)) return null;
    this.examDone.add(key);
    const text = typeof step.text === "function" ? step.text(this) : step.text;
    this.addNote("primary", `[${step.label}] ${text}`);
    this._tick(0.5);
    this._emit("primary", { id });
    return text;
  }

  checkBGL() {
    if (this.flags.bglChecked) return null;
    this._tick(getEquipment("bgl").minutes);
    this.flags.bglChecked = true;
    this.proceduresDone.bgl = { t: this.minutes };
    this.addNote("vitals", `BGL: ${this.vitals.bgl} mmol/L`);
    this._emit("bgl", { value: this.vitals.bgl });
    return this.vitals.bgl;
  }

  // ---------------- procedures ----------------

  doProcedure(id, opts) {
    const def = getEquipment(id);
    if (!def) return;
    this.proceduresDone[id] = { ...opts, t: this.minutes };
    if (id === "monitor") this.monitorAttached = true;
    if (id === "spo2") this.spo2Attached = true;
    let label = def.name;
    if (opts?.site) label += ` — site: ${opts.site}`;
    if (opts?.gauge) label += `, ${opts.gauge}`;
    if (opts?.device) label += ` — ${opts.device} @ ${opts.flow || ""}`;
    this.addNote("procedure", label);
    this._tick(def.minutes);
    if (this.caseDef.onProcedure) this.caseDef.onProcedure(this, { id, opts });
    this._emit("procedure", { id, opts });
  }

  performCPR() {
    this.cprActive = true;
    this.proceduresDone.cpr = { t: this.minutes, cycles: (this.proceduresDone.cpr?.cycles || 0) + 1 };
    this.addNote("procedure", "CPR — 2 minute cycle of compressions");
    this._tick(2);
    if (this.caseDef.onProcedure) this.caseDef.onProcedure(this, { id: "cpr" });
    this._emit("cpr", {});
  }

  stopCPR() {
    this.cprActive = false;
    this.addNote("procedure", "CPR paused — rhythm/pulse check");
    this._emit("cprStop", {});
  }

  shock(energy) {
    this.shocksGiven.push({ t: this.minutes, energy });
    this.addNote("procedure", `DEFIBRILLATION delivered at ${energy}`);
    this._tick(0.5);
    if (this.caseDef.onShock) this.caseDef.onShock(this, { energy });
    this._emit("shock", { energy });
  }

  // ---------------- treatment ----------------

  giveMed(medId, { concentrationId, dose, unit, route } = {}) {
    const med = getMed(medId);
    if (!med) return;
    const entry = {
      id: `${medId}-${this.medsGiven.length}`,
      medId,
      name: med.name,
      concentrationId,
      dose,
      unit,
      route,
      t: this.minutes,
      label: this.clockLabel(),
    };
    this.medsGiven.push(entry);
    const concLabel = concentrationId ? ` (${concentrationId})` : "";
    this.addNote("treatment", `${med.name}${concLabel} — ${dose}${unit} ${route}`);
    const minutes = route === "NEB" ? 5 : route === "IM" ? 1 : 1;
    this._tick(minutes);
    if (this.caseDef.onMed) this.caseDef.onMed(this, entry);
    this._emit("med", entry);
    return entry;
  }

  // ---------------- end of encounter ----------------

  setDiagnosis(id) {
    this.diagnosisId = id;
  }

  setDisposition(id) {
    this.dispositionId = id;
  }

  finish() {
    this.ended = true;
    this._emit("finish", {});
  }
}
