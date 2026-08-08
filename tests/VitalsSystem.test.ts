import { test } from "node:test";
import assert from "node:assert/strict";
import { createPatientFromTemplate } from "../src/data/patientDefs.js";
import { advanceRound, isStable, isLethal } from "../src/systems/VitalsSystem.js";

test("cardiac patient without AED deteriorates toward lethal", () => {
  const patient = createPatientFromTemplate("cardiac");
  for (let i = 0; i < 10 && patient.status === "active"; i++) {
    advanceRound(patient);
  }
  assert.equal(patient.status, "lost");
  assert.ok(isLethal(patient));
});

test("cardiac patient treated with AED recovers to stable", () => {
  const patient = createPatientFromTemplate("cardiac");
  patient.appliedTreatments.add("aed");
  patient.vitals.heartRate = 85;
  for (let i = 0; i < 10 && patient.status === "active"; i++) {
    advanceRound(patient);
  }
  assert.equal(patient.status, "stabilized");
  assert.ok(isStable(patient));
});

test("patient not lethal or stable stays active mid-round", () => {
  const patient = createPatientFromTemplate("mva");
  advanceRound(patient);
  assert.equal(patient.status, "active");
});
