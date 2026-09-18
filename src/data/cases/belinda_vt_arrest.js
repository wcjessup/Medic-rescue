import { clamp, moveToward } from "../../sim/physioHelpers.js";

export const belindaVtArrest = {
  id: "belinda-vt-arrest",
  name: "Belinda",
  age: 70,
  sex: "F",
  weightKg: 68,
  difficulty: 4,
  blurb: "70yo female, generally unwell for 3 days, lethargic. Ominous ECG trend if you don't dig deeper.",
  dispatchMinuteOfDay: 10 * 60 + 5,
  dispatchText:
    "PRIORITY 2 — UNWELL PERSON\n70 year old female, feeling generally weak and lethargic for a few\ndays. Daughter called because she seemed 'not herself'. Patient\nconscious, sitting in an armchair. Address: 8 Banksia Rise.\n\nNearest ED: 9 minutes.",
  chiefComplaint: "Generalised weakness/lethargy",
  historyRespondent: "Belinda",

  scene: {
    danger: {
      label: "Scene Safety",
      keywords: ["danger", "dangerous", "hazard", "safe", "safety", "smell", "smoke", "gas"],
      text: () => "Nothing hazardous — a tidy lounge room. Her daughter is nearby and looks worried but is out of your way.",
    },
    impression: {
      label: "General Impression",
      keywords: ["general impression", "look at me", "walk in", "enter the room", "first look", "approach"],
      text: () => "Belinda is slumped a little in her armchair, pale, and gives you only a slow, tired glance as you enter — she doesn't get up.",
    },
  },

  baselineVitals: { hr: 104, sbp: 118, dbp: 72, rr: 18, spo2: 97, temp: 36.5, gcs: 15, etco2: 35, bgl: 6.1 },
  initialRhythm: "sinus-tach",
  startsConscious: true,
  startsArrested: false,
  initialFlags: { kLevel: 2.6 },

  history: [
    { id: "chief-complaint", category: "History", text: "Hi, I'm your paramedic — what's going on today?", minutes: 0.5,
      keywords: ["what's going on", "whats going on", "why did you call", "what happened", "what's wrong", "whats wrong", "what's the matter", "tell me what", "my name is", "im the paramedic", "i'm the paramedic"],
      answer: () => "I just haven't been myself for days... I feel so weak, I could barely stand up when you arrived." },
    { id: "onset", category: "History", text: "When did you start feeling unwell?", minutes: 0.5,
      answer: () => "About three days ago now — I've just felt weaker and weaker." },
    { id: "dv", category: "History", text: "Any vomiting or diarrhoea?", minutes: 0.5,
      answer: () => "Yes, quite a lot of both since we got back from holiday — I thought it was food poisoning." },
    { id: "travel", category: "History", text: "Have you travelled recently?", minutes: 0.5,
      answer: () => "We just got back from ten days in Bali." },
    { id: "ventolin-use", category: "History", text: "Do you use a puffer or inhaler?", minutes: 0.5,
      answer: () => "Yes, I've been using my Ventolin a lot more than usual because I've felt so breathless and shaky." },
    { id: "past-meds", category: "History", text: "What regular medications do you take?", minutes: 0.5,
      answer: () => "A water tablet — hydrochlorothiazide — for my blood pressure, and my Ventolin puffer." },
    { id: "past-hx", category: "History", text: "Any past medical history I should know about?", minutes: 0.5,
      answer: () => "High blood pressure, and mild asthma. Nothing else." },
    { id: "allergies", category: "History", text: "Any allergies?", minutes: 0.5,
      answer: () => "None that I know of." },
    { id: "last-intake", category: "History", text: "When did you last manage to eat or drink anything?", minutes: 0.5,
      answer: () => "I've barely kept anything down for two days, maybe a few sips of water." },
  ],

  exam: {
    head: { label: "Head / Face", findings: [
      { type: "inspect", label: "Inspect", minutes: 1, text: (s) => (s.arrested ? "Unresponsive, eyes closed, no response to voice." : "Pale, dry lips, sunken eyes — looks dehydrated and tired.") },
    ]},
    neck: { label: "Neck", findings: [
      { type: "inspect", label: "Inspect JVP", minutes: 1, text: () => "JVP not visible/flat — consistent with volume depletion." },
    ]},
    chest: { label: "Chest", findings: [
      { type: "auscultate", label: "Auscultate", minutes: 1, text: (s) => (s.arrested ? "No air entry — apnoeic." : "Air entry clear and equal bilaterally, mild expiratory wheeze, heart sounds fast but regular (unless ectopy noted on monitor).") },
      { type: "palpate", label: "Palpate", minutes: 1, text: () => "No chest wall tenderness." },
    ]},
    abdomen: { label: "Abdomen", findings: [
      { type: "palpate", label: "Palpate", minutes: 1, text: () => "Soft, mildly generally tender, active bowel sounds. No guarding or rigidity." },
      { type: "inspect", label: "Inspect", minutes: 1, text: () => "No distension, no visible masses." },
    ]},
    leftArm: { label: "Left Arm", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => (s.arrested ? "No palpable pulse." : "Pulse rapid, thready.") },
    ]},
    rightArm: { label: "Right Arm", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => (s.arrested ? "No palpable pulse." : "Pulse rapid, thready, equal to the left.") },
    ]},
    leftHand: { label: "Left Hand", findings: [
      { type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Skin turgor reduced — tenting noted. Cool peripheries." },
    ]},
    rightHand: { label: "Right Hand", findings: [
      { type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Fine tremor — likely from excess salbutamol use." },
    ]},
    leftLeg: { label: "Left Leg", findings: [{ type: "palpate", label: "Palpate", minutes: 0.5, text: () => "No swelling or tenderness. Mild generalised muscle cramping reported." }] },
    rightLeg: { label: "Right Leg", findings: [{ type: "palpate", label: "Palpate", minutes: 0.5, text: () => "No swelling or tenderness." }] },
    pelvis: { label: "Pelvis", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Unremarkable." }] },
    leftFoot: { label: "Left Foot", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Cool, cap refill 3 seconds." }] },
    rightFoot: { label: "Right Foot", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Cool, cap refill 3 seconds." }] },
  },

  specialAssessments: [
    {
      id: "muscle-strength", label: "Assess Limb Muscle Strength", minutes: 1,
      text: () => "Generalised proximal muscle weakness — patient struggles to lift her arms against gravity. Classic for a significant electrolyte disturbance.",
    },
    {
      id: "skin-turgor", label: "Formal Skin Turgor / Hydration Check", minutes: 0.5,
      text: () => "Marked tenting of skin on the back of the hand — significant dehydration.",
    },
  ],

  onExam(state) {
    // once the patient has clearly been examined thoroughly, nudge them to look at the monitor
    if (state.examDone.size >= 4 && !state.flags.hintedEcg) {
      state.flags.hintedEcg = true;
      state.addNote("event", "You notice occasional irregular beats on the monitor as you work.");
    }
  },

  tick(state, dt) {
    const f = state.flags;

    if (!state.arrested && !f.rosc) {
      if (f.kclGiven) f.kLevel = clamp(f.kLevel + 0.06 * dt, 1.8, 4.2);
      else if (f.mgGivenPre) f.kLevel = clamp(f.kLevel - 0.006 * dt, 1.6, 4.2);
      else f.kLevel = clamp(f.kLevel - 0.015 * dt, 1.6, 4.2);

      if (f.kLevel < 2.3 && state.rhythm !== "vt") {
        state.rhythm = "vt";
        state.addNote("event", "⚠ The rhythm on the monitor deteriorates into a wide-complex tachycardia — Ventricular Tachycardia.");
      } else if (f.kLevel < 2.45 && !["vt", "bigeminy"].includes(state.rhythm)) {
        state.rhythm = "bigeminy";
        state.addNote("event", "The monitor shows frequent ventricular ectopics in a bigeminy pattern.");
      }

      const mgProtected = f.mgProtectUntil && state.minutes < f.mgProtectUntil;
      if (state.rhythm === "vt" && !mgProtected) {
        f.vtMinutes = (f.vtMinutes || 0) + dt;
        if (f.vtMinutes > 1.5) {
          state.arrested = true;
          state.conscious = false;
          f.everArrested = true;
          f.arrestStartMinute = state.minutes;
          state.vitals.gcs = 3;
          state.addNote("event", "⚠⚠ Belinda suddenly slumps in the chair — pulseless, apnoeic. WITNESSED VT ARREST. Begin CPR and prepare to defibrillate.");
        }
      } else if (state.rhythm === "vt") {
        f.vtMinutes = 0;
      }

      if (!state.arrested) {
        const kDeficit = Math.max(0, 2.8 - f.kLevel);
        const targetHr = clamp(104 + kDeficit * 18, 96, 160);
        const targetSbp = clamp(118 - kDeficit * 14, 78, 118);
        state.vitals.hr = moveToward(state.vitals.hr, targetHr, 4 * dt);
        state.vitals.sbp = moveToward(state.vitals.sbp, targetSbp, 3 * dt);
        state.vitals.dbp = moveToward(state.vitals.dbp, clamp(72 - kDeficit * 6, 45, 72), 2 * dt);
        state.vitals.rr = moveToward(state.vitals.rr, clamp(18 + kDeficit * 3, 18, 28), 1.5 * dt);
        state.vitals.gcs = kDeficit > 1.6 ? 14 : 15;
      }
    } else if (state.arrested && !f.rosc) {
      if (!state.cprActive) {
        f.noCprMinutes = (f.noCprMinutes || 0) + dt;
        if (f.noCprMinutes > 3 && state.rhythm === "vt") state.rhythm = "vf";
        if (f.noCprMinutes > 6 && state.rhythm === "vf") state.rhythm = "asystole";
      } else {
        f.noCprMinutes = 0;
      }

      const shocks = state.shocksGiven.length;
      const amio = state.medsGiven.some((m) => m.medId === "amiodarone");
      const mgIV = state.medsGiven.some((m) => m.medId === "magnesium" && ["IV", "IO"].includes(m.route));
      const kclIV = state.medsGiven.some((m) => m.medId === "kcl");

      if (shocks >= 2 && (amio || mgIV || kclIV) && state.cprActive && !f.roscEligibleAt && ["vt", "vf"].includes(state.rhythm)) {
        f.roscEligibleAt = state.minutes + 1.5;
      }
      if (f.roscEligibleAt && state.minutes >= f.roscEligibleAt) {
        f.rosc = true;
        state.arrested = false;
        state.cprActive = false;
        state.conscious = true;
        state.rhythm = "afib";
        state.vitals.hr = 118;
        state.vitals.sbp = 96;
        state.vitals.dbp = 58;
        state.vitals.rr = 22;
        state.vitals.spo2 = 93;
        state.vitals.gcs = 11;
        state.addNote("event", "✔ ROSC achieved — a pulse returns. The monitor now shows Atrial Fibrillation. Belinda is rousable to painful stimuli.");
      }
    } else {
      const o2 = !!state.proceduresDone.o2;
      state.vitals.spo2 = moveToward(state.vitals.spo2, o2 ? 97 : 92, 1.4 * dt);
      state.vitals.sbp = moveToward(state.vitals.sbp, 104, 2 * dt);
      state.vitals.gcs = Math.min(15, state.vitals.gcs + 0.3 * dt);
      state.vitals.hr = moveToward(state.vitals.hr, 100, 1.5 * dt);
    }
  },

  onMed(state, entry) {
    const f = state.flags;
    if (entry.medId === "kcl" && entry.route === "IV") f.kclGiven = true;
    if (entry.medId === "magnesium" && ["IV", "IO"].includes(entry.route)) {
      f.mgGivenPre = true;
      f.mgProtectUntil = state.minutes + 6;
    }
  },

  diagnosisOptions: [
    { id: "hypokalaemia-vt", text: "Severe hypokalaemia causing ventricular arrhythmia / VT arrest" },
    { id: "ami", text: "Acute myocardial infarction causing VT arrest" },
    { id: "pe", text: "Pulmonary embolism" },
    { id: "sepsis", text: "Sepsis with septic cardiomyopathy" },
    { id: "simple-gastro", text: "Simple gastroenteritis with dehydration" },
  ],

  dispositionOptions: [
    { id: "home", text: "Treat and discharge at home, GP follow-up" },
    { id: "transport-nonemergent", text: "Non-emergent transport to hospital" },
    { id: "transport-emergent", text: "Emergent (lights & sirens) transport to hospital with ICU/cardiology" },
    { id: "refuse", text: "Patient declines transport" },
    { id: "cease-resus", text: "Cease resuscitation on scene" },
  ],

  rubric: {
    requiredHistory: ["chief-complaint", "dv", "travel", "ventolin-use", "past-meds"],
    requiredExam: ["abdomen:palpate", "leftHand:inspect", "special:skin-turgor", "special:muscle-strength", "scene:danger", "primary:circulation"],
    examLabels: {
      "abdomen:palpate": "Palpate abdomen",
      "leftHand:inspect": "Inspect hand (skin turgor/tremor)",
      "special:skin-turgor": "Formal skin turgor check",
      "special:muscle-strength": "Assess limb muscle strength",
      "scene:danger": "Check the scene for danger",
      "primary:circulation": "Primary survey — circulation",
    },
    minVitalsChecks: 3,
    timeParMinutes: 18,
    idealTreatments: [
      { label: "Attached cardiac monitor early — caught the rhythm deteriorating", points: 5, check: (e) => e.monitorAttached },
      { label: "Established IV access", points: 3, check: (e) => !!e.proceduresDone.iv },
      { label: "Gave IV magnesium sulfate (stabilises the myocardium in hypokalaemia)", points: 6, check: (e) => e.medsGiven.some((m) => m.medId === "magnesium" && ["IV", "IO"].includes(m.route)) },
      { label: "Gave IV potassium chloride replacement", points: 6, check: (e) => e.medsGiven.some((m) => m.medId === "kcl") },
      { label: "Started CPR promptly after the witnessed arrest", points: 4, check: (e) => !e.flags.everArrested || (e.proceduresDone.cpr && e.proceduresDone.cpr.t - e.flags.arrestStartMinute <= 2) },
      { label: "Defibrillated the shockable rhythm (VT/VF)", points: 5, check: (e) => e.shocksGiven.length > 0 },
      { label: "Gave amiodarone during the arrest", points: 4, check: (e) => e.medsGiven.some((m) => m.medId === "amiodarone") },
      { label: "Achieved ROSC", points: 4, check: (e) => !!e.flags.rosc, goodLabel: "Achieved ROSC — rhythm converted to AF", badLabel: "Never achieved ROSC" },
    ],
    contraindicated: [
      { label: "Gave rapid empirical salbutamol/adrenaline without checking for the electrolyte cause", penalty: 5, check: (e) => e.medsGiven.some((m) => m.medId === "salbutamol") && !e.medsGiven.some((m) => ["magnesium", "kcl"].includes(m.medId)) },
      { label: "Attempted synchronised cardioversion on a stable post-ROSC AF", penalty: 8, check: (e) => e.flags.rosc && e.proceduresDone.cardioversion },
    ],
    correctDiagnosisIds: ["hypokalaemia-vt"],
    correctDispositionIds: ["transport-emergent"],
    deathIf: (e) => e.flags.everArrested && !e.flags.rosc,
  },
};
