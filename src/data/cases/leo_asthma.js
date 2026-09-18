import { clamp, moveToward } from "../../sim/physioHelpers.js";

const ARREST_T = 14;

export const leoAsthma = {
  id: "leo-asthma",
  name: "Leo",
  age: 5,
  sex: "M",
  weightKg: 18,
  difficulty: 2,
  blurb: "5yo male, known asthmatic, severe difficulty breathing despite his puffer.",
  dispatchMinuteOfDay: 16 * 60 + 12,
  dispatchText:
    "PRIORITY 1 — DIFFICULTY BREATHING\n5 year old male. Parents state known asthmatic, using blue puffer\nwithout relief for the last hour. Patient conscious, breathing\nfast. Address: 14 Wattle Court.\n\nNearest paediatric-capable ED: 11 minutes.",
  chiefComplaint: "Difficulty breathing",
  historyRespondent: "Leo's Mum",

  scene: {
    danger: {
      label: "Scene Safety",
      keywords: ["danger", "dangerous", "hazard", "safe", "safety", "smell", "smoke", "gas"],
      text: () => "Nothing hazardous — a normal lounge room. There's an empty Ventolin canister and a nebuliser mask on the coffee table. No smell of smoke or gas.",
    },
    impression: {
      label: "General Impression",
      keywords: ["general impression", "look at me", "walk in", "enter the room", "first look", "approach"],
      text: () => "As you walk in, Leo is sitting bolt upright on his mum's lap, shoulders hunched forward, working visibly hard to breathe. He glances at you but is too breathless to say much.",
    },
  },

  baselineVitals: { hr: 150, sbp: 108, dbp: 66, rr: 44, spo2: 89, temp: 37.0, gcs: 15, etco2: 48, bgl: 5.4 },
  initialRhythm: "sinus-tach",
  startsConscious: true,
  startsArrested: false,
  initialFlags: {},

  history: [
    { id: "chief-complaint", category: "History", text: "What's going on today? Why did you call the ambulance?", minutes: 0.5,
      keywords: ["what's going on", "whats going on", "why did you call", "what happened", "what's wrong", "whats wrong", "what's the matter", "tell me what", "my name is", "im the paramedic", "i'm the paramedic"],
      answer: () => "He's really struggling to breathe — his puffer isn't touching it. Please help him!" },
    { id: "onset", category: "History", text: "When did the breathing trouble start?", minutes: 0.5,
      answer: () => "Started coughing about 2 hours ago, got a lot worse in the last 30 minutes despite his puffer." },
    { id: "trigger", category: "History", text: "Any trigger — cold, exercise, new allergen?", minutes: 0.5,
      answer: () => "He's had a runny nose and cough for 2 days — we think it's a virus setting it off." },
    { id: "past-admissions", category: "History", text: "Any past hospital admissions for asthma?", minutes: 0.5,
      answer: () => "Yes — admitted to the children's ICU two years ago, he needed a ventilator that time." },
    { id: "meds", category: "History", text: "What medication does he take regularly?", minutes: 0.5,
      answer: () => "Fluticasone preventer twice a day, and Ventolin as needed." },
    { id: "ventolin-today", category: "History", text: "How much Ventolin has he had today?", minutes: 0.5,
      answer: () => "About 12 puffs through his spacer in the last hour, and we borrowed a neighbour's nebuliser mask once." },
    { id: "allergies", category: "History", text: "Any known allergies?", minutes: 0.5,
      answer: () => "No known allergies." },
    { id: "last-intake", category: "History", text: "When did he last eat or drink?", minutes: 0.5,
      answer: () => "Lunch, about three hours ago." },
    { id: "family-hx", category: "History", text: "Any family history of asthma or lung disease?", minutes: 0.5,
      answer: () => "His dad has asthma too." },
  ],

  exam: {
    head: { label: "Head / Face", findings: [
      { type: "inspect", label: "Inspect", minutes: 1,
        keywords: ["words or sentences", "talking in sentences", "speak in sentences", "how is he talking", "can he talk", "full sentences"],
        text: () => "Alert, anxious, mouth breathing. Can only manage 2-3 words per breath." },
    ]},
    neck: { label: "Neck", findings: [
      { type: "inspect", label: "Inspect", minutes: 1, text: () => "Visible tracheal tug with every breath. No stridor at rest." },
    ]},
    chest: { label: "Chest", findings: [
      { type: "inspect", label: "Inspect", minutes: 1,
        keywords: ["accessory muscle", "tripod", "tripoding", "recession", "retraction", "how do they appear", "how does he appear", "working hard to breathe", "posture"],
        text: () => "Marked subcostal and intercostal recession, tripod positioning, obvious accessory muscle use." },
      { type: "palpate", label: "Palpate", minutes: 1, text: () => "Symmetrical chest wall movement with significant work of breathing. No crepitus, no flail segment." },
      { type: "auscultate", label: "Auscultate", minutes: 1, text: (s) => s.arrested ? "No air entry audible — chest silent." : "Diffuse expiratory wheeze throughout all fields, prolonged expiratory phase, reduced air entry at both bases." },
    ]},
    abdomen: { label: "Abdomen", findings: [
      { type: "palpate", label: "Palpate", minutes: 1, text: () => "Soft, non-tender. Using abdominal muscles to assist breathing." },
    ]},
    leftArm: { label: "Left Arm", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => `Radial pulse ${s.arrested ? "absent" : "rapid, strong"}. Fine tremor noted (likely salbutamol).` },
    ]},
    rightArm: { label: "Right Arm", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => `Radial pulse ${s.arrested ? "absent" : "rapid, strong"}, equal to the left.` },
    ]},
    leftHand: { label: "Left Hand", findings: [
      { type: "inspect", label: "Inspect", minutes: 0.5, text: (s) => (s.vitals.spo2 < 88 ? "Peripheries look dusky, mild central cyanosis around the lips." : "No cyanosis currently. Warm peripheries.") },
    ]},
    rightHand: { label: "Right Hand", findings: [
      { type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Nail beds pink, no clubbing." },
    ]},
    leftLeg: { label: "Left Leg", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "No swelling, rash or injury." }] },
    rightLeg: { label: "Right Leg", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "No swelling, rash or injury." }] },
    pelvis: { label: "Pelvis", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Unremarkable." }] },
    leftFoot: { label: "Left Foot", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Warm, well perfused, cap refill <2s." }] },
    rightFoot: { label: "Right Foot", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Warm, well perfused, cap refill <2s." }] },
  },

  specialAssessments: [
    {
      id: "wob-score", label: "Formal Work-of-Breathing Assessment", minutes: 1,
      text: (s) => "Severe: tripod position, marked recession, audible wheeze without a stethoscope, speaking in single words only.",
      flagsSet: { wobAssessed: true },
    },
    {
      id: "cap-refill", label: "Capillary Refill Check", minutes: 0.5,
      text: (s) => (s.vitals.spo2 < 88 ? "Capillary refill 3 seconds — sluggish." : "Capillary refill <2 seconds centrally."),
    },
  ],

  tick(state, dt) {
    const f = state.flags;
    if (!state.arrested) {
      const nebCount = state.medsGiven.filter((m) => ["salbutamol", "ipratropium"].includes(m.medId)).length;
      const o2 = !!state.proceduresDone.o2;
      const mgGiven = state.medsGiven.some((m) => m.medId === "magnesium" && ["IV", "IO"].includes(m.route));

      let targetSpo2 = 89 + nebCount * 1.4 + (o2 ? 3 : 0) + (mgGiven ? 2 : 0);
      let targetHr = 150 - nebCount * 1.5 + (nebCount > 4 ? 4 : 0); // excess salbutamol nudges HR back up
      let targetRr = 44 - nebCount * 1.2 - (mgGiven ? 2 : 0);
      targetSpo2 = clamp(targetSpo2, 82, 97);
      targetHr = clamp(targetHr, 118, 168);
      targetRr = clamp(targetRr, 26, 50);

      state.vitals.spo2 = moveToward(state.vitals.spo2, targetSpo2, 1.6 * dt);
      state.vitals.hr = moveToward(state.vitals.hr, targetHr, 5 * dt);
      state.vitals.rr = moveToward(state.vitals.rr, targetRr, 2 * dt);
      state.vitals.sbp = moveToward(state.vitals.sbp, 108, 2 * dt);
      state.vitals.dbp = moveToward(state.vitals.dbp, 66, 2 * dt);
      state.vitals.gcs = 15;

      if (state.minutes >= ARREST_T && !f.arrestTriggered) {
        f.arrestTriggered = true;
        f.everArrested = true;
        f.arrestStartMinute = state.minutes;
        state.arrested = true;
        state.conscious = false;
        state.rhythm = "pea";
        state.vitals.hr = 34;
        state.vitals.spo2 = 0;
        state.vitals.rr = 0;
        state.vitals.gcs = 3;
        state.addNote("event", "⚠⚠ Leo suddenly goes quiet, lips blue, and slumps — no respiratory effort, no palpable pulse. CARDIAC ARREST.");
      }
    } else if (!f.rosc) {
      if (!state.cprActive) {
        f.noCprMinutes = (f.noCprMinutes || 0) + dt;
        if (f.noCprMinutes > 2 && state.rhythm === "pea") state.rhythm = "asystole";
      } else {
        f.noCprMinutes = 0;
      }

      const correctAdrenaline = state.medsGiven.some(
        (m) => m.medId === "adrenaline" && ["IV", "IO"].includes(m.route) && m.concentrationId === "1:10000" && m.dose >= 0.1 && m.dose <= 0.3
      );
      const ventilating = state.proceduresDone.o2?.device === "Bag-valve-mask" || !!state.proceduresDone.sga || !!state.proceduresDone.ett;

      if (correctAdrenaline && ventilating && state.cprActive && !f.roscEligibleAt) {
        f.roscEligibleAt = state.minutes + 2;
      }
      if (f.roscEligibleAt && state.minutes >= f.roscEligibleAt) {
        f.rosc = true;
        state.arrested = false;
        state.cprActive = false;
        state.conscious = true;
        state.rhythm = "sinus-tach";
        state.vitals.hr = 138;
        state.vitals.sbp = 96;
        state.vitals.dbp = 60;
        state.vitals.rr = 26;
        state.vitals.spo2 = 91;
        state.vitals.gcs = 12;
        state.addNote("event", "✔ ROSC achieved — a pulse returns, Leo starts to make respiratory effort and rouses slightly.");
      }
    } else {
      const o2 = !!state.proceduresDone.o2;
      state.vitals.spo2 = moveToward(state.vitals.spo2, o2 ? 96 : 90, 1.5 * dt);
      state.vitals.hr = moveToward(state.vitals.hr, 122, 3 * dt);
      state.vitals.gcs = Math.min(15, state.vitals.gcs + 0.4 * dt);
      state.vitals.rr = moveToward(state.vitals.rr, 24, 1.5 * dt);
    }
  },

  onShock(state) {
    state.addNote("event", "Shock delivered to a non-shockable rhythm — no change, and CPR interrupted unnecessarily.");
  },

  diagnosisOptions: [
    { id: "status-asthmaticus", text: "Acute severe/life-threatening asthma exacerbation (status asthmaticus)" },
    { id: "anaphylaxis", text: "Anaphylaxis" },
    { id: "fbao", text: "Foreign body airway obstruction" },
    { id: "pneumonia", text: "Pneumonia" },
    { id: "croup", text: "Croup (viral laryngotracheobronchitis)" },
  ],

  dispositionOptions: [
    { id: "home", text: "Treat and discharge at home, GP follow-up" },
    { id: "transport-nonemergent", text: "Non-emergent transport to hospital" },
    { id: "transport-emergent", text: "Emergent (lights & sirens) transport to nearest paediatric-capable ED" },
    { id: "refuse", text: "Parent declines transport, patient stays home" },
    { id: "cease-resus", text: "Cease resuscitation on scene" },
  ],

  rubric: {
    requiredHistory: ["chief-complaint", "onset", "past-admissions", "meds", "ventolin-today"],
    requiredExam: ["chest:auscultate", "chest:inspect", "neck:inspect", "special:wob-score", "scene:danger", "primary:airway", "primary:breathing"],
    examLabels: {
      "chest:auscultate": "Auscultate chest",
      "chest:inspect": "Inspect chest / work of breathing",
      "neck:inspect": "Inspect neck for tracheal tug/stridor",
      "special:wob-score": "Formal work-of-breathing assessment",
      "scene:danger": "Check the scene for danger",
      "primary:airway": "Primary survey — airway",
      "primary:breathing": "Primary survey — breathing",
    },
    minVitalsChecks: 2,
    timeParMinutes: 22,
    idealTreatments: [
      { label: "Applied oxygen for hypoxia", points: 3, check: (e) => !!e.proceduresDone.o2 },
      { label: "Gave nebulised salbutamol", points: 5, check: (e) => e.medsGiven.some((m) => m.medId === "salbutamol") },
      { label: "Gave nebulised ipratropium", points: 4, check: (e) => e.medsGiven.some((m) => m.medId === "ipratropium") },
      { label: "Established IV access", points: 3, check: (e) => !!e.proceduresDone.iv },
      { label: "Gave IV magnesium sulfate", points: 5, check: (e) => e.medsGiven.some((m) => m.medId === "magnesium" && ["IV", "IO"].includes(m.route)) },
      { label: "Gave a corticosteroid (hydrocortisone)", points: 4, check: (e) => e.medsGiven.some((m) => m.medId === "hydrocortisone") },
      {
        label: "Started CPR promptly after arrest",
        points: 4,
        check: (e) => !e.flags.everArrested || (e.proceduresDone.cpr && e.proceduresDone.cpr.t - e.flags.arrestStartMinute <= 2.5),
      },
      {
        label: "Gave correctly-diluted adrenaline (1:10,000) by IV/IO during arrest",
        points: 5,
        check: (e) => e.medsGiven.some((m) => m.medId === "adrenaline" && ["IV", "IO"].includes(m.route) && m.concentrationId === "1:10000"),
      },
      { label: "Achieved ROSC", points: 4, check: (e) => !!e.flags.rosc, goodLabel: "Achieved ROSC and Leo's pulse returned", badLabel: "Never achieved ROSC" },
    ],
    contraindicated: [
      { label: "Gave undiluted 1:1,000 adrenaline IV — extremely dangerous, risks fatal hypertension/arrhythmia", penalty: 20, check: (e) => e.medsGiven.some((m) => m.medId === "adrenaline" && m.route === "IV" && m.concentrationId === "1:1000") },
      { label: "Attempted defibrillation on a non-shockable rhythm (asystole/PEA)", penalty: 10, check: (e) => e.shocksGiven.length > 0 },
      { label: "Gave more than 6 salbutamol doses without escalating therapy", penalty: 5, check: (e) => e.medsGiven.filter((m) => m.medId === "salbutamol").length > 6 },
    ],
    correctDiagnosisIds: ["status-asthmaticus"],
    correctDispositionIds: ["transport-emergent"],
    deathIf: (e) => e.flags.everArrested && !e.flags.rosc,
  },
};
