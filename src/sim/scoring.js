const SECTION_WEIGHTS = {
  history: 15,
  exam: 15,
  vitals: 10,
  treatment: 30,
  diagnosis: 15,
  disposition: 15,
};

function gradeLetter(pct) {
  if (pct >= 93) return "A+";
  if (pct >= 87) return "A";
  if (pct >= 80) return "A-";
  if (pct >= 75) return "B+";
  if (pct >= 70) return "B";
  if (pct >= 65) return "B-";
  if (pct >= 60) return "C+";
  if (pct >= 55) return "C";
  if (pct >= 50) return "C-";
  if (pct >= 40) return "D";
  return "F";
}

export function scoreEncounter(encounter) {
  const caseDef = encounter.caseDef;
  const rubric = caseDef.rubric || {};
  const sections = [];
  const good = [];
  const bad = [];
  let penalties = 0;
  const penaltyNotes = [];

  // ---- history ----
  const reqHist = rubric.requiredHistory || [];
  if (reqHist.length) {
    let got = 0;
    reqHist.forEach((id) => {
      const q = caseDef.history.find((h) => h.id === id);
      if (encounter.historyAsked.has(id)) {
        got++;
        good.push(`Asked about: ${q ? q.text : id}`);
      } else {
        bad.push(`Never asked: ${q ? q.text : id}`);
      }
    });
    sections.push({ label: "History Taking", got, max: reqHist.length, points: (got / reqHist.length) * SECTION_WEIGHTS.history, maxPoints: SECTION_WEIGHTS.history });
  } else {
    sections.push({ label: "History Taking", got: 1, max: 1, points: SECTION_WEIGHTS.history, maxPoints: SECTION_WEIGHTS.history });
  }

  // ---- exam ----
  const reqExam = rubric.requiredExam || [];
  if (reqExam.length) {
    let got = 0;
    reqExam.forEach((key) => {
      const done = encounter.examDone.has(key);
      if (done) got++;
      const label = rubric.examLabels?.[key] || key;
      if (done) good.push(`Examined: ${label}`);
      else bad.push(`Never examined: ${label}`);
    });
    sections.push({ label: "Physical Exam", got, max: reqExam.length, points: (got / reqExam.length) * SECTION_WEIGHTS.exam, maxPoints: SECTION_WEIGHTS.exam });
  } else {
    sections.push({ label: "Physical Exam", got: 1, max: 1, points: SECTION_WEIGHTS.exam, maxPoints: SECTION_WEIGHTS.exam });
  }

  // ---- vitals monitoring ----
  const minChecks = rubric.minVitalsChecks ?? 2;
  const got = Math.min(encounter.vitalsHistory.length, minChecks);
  if (encounter.vitalsHistory.length >= minChecks) good.push(`Took ${encounter.vitalsHistory.length} full sets of vitals to trend the patient`);
  else bad.push(`Only took ${encounter.vitalsHistory.length} set(s) of vitals — not enough to see a trend`);
  sections.push({ label: "Vitals & Trending", got, max: minChecks, points: (got / minChecks) * SECTION_WEIGHTS.vitals, maxPoints: SECTION_WEIGHTS.vitals });

  // ---- treatment ----
  const ideal = rubric.idealTreatments || [];
  let tGot = 0;
  ideal.forEach((t) => {
    const ok = t.check(encounter);
    if (ok) {
      tGot += t.points;
      good.push(t.goodLabel || t.label);
    } else {
      bad.push(t.badLabel || `Missed / incorrect: ${t.label}`);
    }
  });
  const tMax = ideal.reduce((s, t) => s + t.points, 0) || 1;
  sections.push({ label: "Treatment", got: Math.round((tGot / tMax) * 100) / 100, max: 1, points: (tGot / tMax) * SECTION_WEIGHTS.treatment, maxPoints: SECTION_WEIGHTS.treatment });

  // ---- contraindicated / dangerous actions ----
  (rubric.contraindicated || []).forEach((c) => {
    if (c.check(encounter)) {
      penalties += c.penalty;
      penaltyNotes.push(c.label);
      bad.push(`⚠ ${c.label}`);
    }
  });

  // ---- diagnosis ----
  const dxIds = typeof rubric.correctDiagnosisIds === "function" ? rubric.correctDiagnosisIds(encounter) : rubric.correctDiagnosisIds || [];
  const dxCorrect = dxIds.includes(encounter.diagnosisId);
  const dxOption = caseDef.diagnosisOptions.find((d) => d.id === encounter.diagnosisId);
  sections.push({ label: "Provisional Diagnosis", got: dxCorrect ? 1 : 0, max: 1, points: dxCorrect ? SECTION_WEIGHTS.diagnosis : 0, maxPoints: SECTION_WEIGHTS.diagnosis });
  if (dxCorrect) good.push(`Correct provisional diagnosis: ${dxOption ? dxOption.text : "?"}`);
  else bad.push(`Provisional diagnosis "${dxOption ? dxOption.text : "none given"}" was not correct`);

  // ---- disposition ----
  const dispoIds = typeof rubric.correctDispositionIds === "function" ? rubric.correctDispositionIds(encounter) : rubric.correctDispositionIds || [];
  const dispoCorrect = dispoIds.includes(encounter.dispositionId);
  const dispoOption = caseDef.dispositionOptions.find((d) => d.id === encounter.dispositionId);
  sections.push({ label: "Disposition", got: dispoCorrect ? 1 : 0, max: 1, points: dispoCorrect ? SECTION_WEIGHTS.disposition : 0, maxPoints: SECTION_WEIGHTS.disposition });
  if (dispoCorrect) good.push(`Correct disposition: ${dispoOption ? dispoOption.text : "?"}`);
  else bad.push(`Disposition "${dispoOption ? dispoOption.text : "none given"}" was not appropriate`);

  // ---- time ----
  if (rubric.timeParMinutes) {
    if (encounter.minutes <= rubric.timeParMinutes) {
      good.push(`Scene time ${Math.round(encounter.minutes)} min — within the ${rubric.timeParMinutes} min target for this presentation`);
    } else {
      const over = Math.round(encounter.minutes - rubric.timeParMinutes);
      penalties += Math.min(10, over);
      penaltyNotes.push(`Scene time ran ${over} min over target`);
      bad.push(`Scene time ${Math.round(encounter.minutes)} min — over the ${rubric.timeParMinutes} min target for a time-critical case`);
    }
  }

  const rawTotal = sections.reduce((s, sec) => s + sec.points, 0);
  const maxTotal = sections.reduce((s, sec) => s + sec.maxPoints, 0);
  const finalPct = Math.max(0, Math.round(((rawTotal - penalties) / maxTotal) * 100));

  return {
    sections,
    good,
    bad,
    penalties,
    penaltyNotes,
    pct: finalPct,
    grade: gradeLetter(finalPct),
    survived: !caseDef.rubric?.deathIf || !caseDef.rubric.deathIf(encounter),
  };
}
