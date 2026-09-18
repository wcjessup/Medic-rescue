import { moveToward } from "../../sim/physioHelpers.js";

const ANALGESIC_IDS = ["fentanyl", "morphine", "methoxyflurane"];

export const billDissection = {
  id: "bill-dissection",
  name: "Bill",
  age: 55,
  sex: "M",
  weightKg: 90,
  difficulty: 5,
  blurb: "55yo male, chest/back pain in a confined workspace. Something about this doesn't add up.",
  dispatchMinuteOfDay: 13 * 60 + 40,
  dispatchText:
    "PRIORITY 1 — CHEST PAIN\n55 year old male, chest pain, at a factory workshop. Colleagues\nstate he was working in a confined space when the pain started.\nPatient conscious, sitting against a wall. Address: 2 Industrial\nWay, Unit 6.\n\nNearest ED (cardiothoracic/vascular surgery): 14 minutes.",
  chiefComplaint: "Chest / back pain",

  baselineVitals: { hr: 108, sbp: 158, dbp: 96, rr: 22, spo2: 96, temp: 36.8, gcs: 15, etco2: 34, bgl: 6.4 },
  initialRhythm: "sinus-tach",
  startsConscious: true,
  startsArrested: false,
  initialFlags: { sbpRight: 158, sbpLeft: 104, dissectionMin: 0 },

  history: [
    { id: "onset", category: "History", text: "When exactly did the pain start, and how suddenly?", minutes: 0.5,
      answer: () => "Very sudden, maybe 20 minutes ago — like nothing I've felt before, hit me all at once." },
    { id: "quality", category: "History", text: "Can you describe the pain?", minutes: 0.5,
      answer: () => "Tearing... ripping, right through to my back." },
    { id: "radiation", category: "History", text: "Does the pain move anywhere?", minutes: 0.5,
      answer: () => "Through to my back between the shoulder blades, and oddly, down into my left leg and groin." },
    { id: "severity", category: "History", text: "On a scale of 0 to 10, how severe is the pain?", minutes: 0.5,
      answer: () => "Eleven. Worst pain of my life." },
    { id: "cardiac-hx", category: "History", text: "Any history of heart problems or high blood pressure?", minutes: 0.5,
      answer: () => "High blood pressure — I don't always take my tablets like I should." },
    { id: "exertion", category: "History", text: "Were you doing anything strenuous when it started?", minutes: 0.5,
      answer: () => "Just lifting a panel into place, nothing unusual." },
    { id: "allergies", category: "History", text: "Any allergies?", minutes: 0.5,
      answer: () => "None." },
    { id: "meds", category: "History", text: "What medications do you take?", minutes: 0.5,
      answer: () => "A blood pressure tablet — I think it's called ramipril — when I remember to." },
  ],

  exam: {
    head: { label: "Head / Face", findings: [
      { type: "inspect", label: "Inspect", minutes: 1, text: (s) => (s.arrested ? "Unresponsive." : "Grey, sweaty, clearly in severe distress and pain.") },
    ]},
    neck: { label: "Neck", findings: [
      { type: "inspect", label: "Inspect JVP", minutes: 1, text: () => "JVP mildly raised. No obvious tracheal deviation." },
    ]},
    chest: { label: "Chest", findings: [
      { type: "inspect", label: "Inspect", minutes: 1, text: () => "No visible trauma, no bruising. Symmetrical chest wall." },
      { type: "palpate", label: "Palpate", minutes: 1, text: () => "No chest wall tenderness reproducing the pain — this doesn't feel musculoskeletal." },
      { type: "auscultate", label: "Auscultate", minutes: 1, text: (s) => (s.arrested ? "No air entry, no heart sounds audible." : "Air entry equal both sides. A soft early diastolic murmur is audible at the left sternal edge.") },
    ]},
    abdomen: { label: "Abdomen", findings: [
      { type: "palpate", label: "Palpate", minutes: 1, text: () => "Soft, mild generalised tenderness, no rigidity, no obvious pulsatile mass." },
    ]},
    leftArm: { label: "Left Arm", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => (s.arrested ? "No palpable pulse." : "Radial pulse present but notably weaker than the right side.") },
    ]},
    rightArm: { label: "Right Arm", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => (s.arrested ? "No palpable pulse." : "Radial pulse strong and bounding.") },
    ]},
    leftHand: { label: "Left Hand", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Slightly cooler than the right hand." }] },
    rightHand: { label: "Right Hand", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "Warm, well perfused." }] },
    leftLeg: { label: "Left Leg", findings: [{ type: "palpate", label: "Palpate", minutes: 1, text: () => "Mild diffuse tenderness, no swelling. Patient reports this is where the pain radiates to." }] },
    rightLeg: { label: "Right Leg", findings: [{ type: "palpate", label: "Palpate", minutes: 1, text: () => "Unremarkable." }] },
    pelvis: { label: "Pelvis", findings: [{ type: "inspect", label: "Inspect", minutes: 0.5, text: () => "No deformity, stable on gentle compression." }] },
    leftFoot: { label: "Left Foot", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: (s) => (s.arrested ? "No palpable pulse." : "Dorsalis pedis weak/thready compared to the right foot — a pulse deficit.") },
    ]},
    rightFoot: { label: "Right Foot", findings: [
      { type: "palpate", label: "Palpate pulse", minutes: 1, text: () => "Dorsalis pedis strong and easily palpable." },
    ]},
  },

  specialAssessments: [
    {
      id: "compare-bp-both-arms",
      label: "Compare Blood Pressure — Both Arms",
      minutes: 2,
      text: (s) => `Right arm BP ${Math.round(s.flags.sbpRight)}/96. Left arm BP ${Math.round(s.flags.sbpLeft)}/64. A significant asymmetry of ${Math.round(s.flags.sbpRight - s.flags.sbpLeft)} mmHg systolic between limbs.`,
      flagsSet: { armAsymmetryFound: true },
    },
    {
      id: "pulse-deficit-check",
      label: "Formal Four-Limb Pulse Check",
      minutes: 1,
      text: () => "Clear pulse deficit — left arm and left leg pulses both weaker than the right side.",
      flagsSet: { pulseDeficitFound: true },
    },
  ],

  onMed(state, entry) {
    const f = state.flags;
    if (ANALGESIC_IDS.includes(entry.medId) && !f.armAsymmetryFound) f.analgesiaBeforeArmCheck = true;
    if ((ANALGESIC_IDS.includes(entry.medId) || entry.medId === "gtn") && !state.arrested && !f.triggerArrestAt) {
      f.triggerArrestAt = state.minutes + (entry.medId === "gtn" ? 1 : 1.5);
      state.addNote("event", "Shortly after the dose, Bill grimaces and says the pain has suddenly gotten much worse...");
    }
  },

  tick(state, dt) {
    const f = state.flags;
    if (!state.arrested && !f.rosc) {
      f.dissectionMin = (f.dissectionMin || 0) + dt;
      f.sbpRight = moveToward(f.sbpRight, 158, 4 * dt);
      f.sbpLeft = moveToward(f.sbpLeft, 104, 4 * dt);
      state.vitals.sbp = Math.round(f.sbpRight);
      state.vitals.dbp = moveToward(state.vitals.dbp, 96, 3 * dt);
      state.vitals.hr = moveToward(state.vitals.hr, 108, 3 * dt);
      state.vitals.rr = moveToward(state.vitals.rr, 22, 2 * dt);
      state.vitals.spo2 = moveToward(state.vitals.spo2, 96, 1.5 * dt);

      if (!f.triggerArrestAt && f.dissectionMin > 28) {
        f.triggerArrestAt = state.minutes + 0.1;
        state.addNote("event", "Bill has been in severe pain a long time now and looks worse — grey, diaphoretic, drowsy...");
      }

      if (f.triggerArrestAt && state.minutes >= f.triggerArrestAt) {
        state.arrested = true;
        state.conscious = false;
        f.everArrested = true;
        f.arrestStartMinute = state.minutes;
        state.rhythm = "pea";
        state.vitals.gcs = 3;
        state.vitals.sbp = 0;
        state.vitals.dbp = 0;
        state.vitals.hr = 40;
        state.addNote("event", "⚠⚠ Bill suddenly grips his chest, groans, and goes unresponsive — no palpable pulse. PEA ARREST, almost certainly aortic rupture/tamponade.");
      }
    } else if (state.arrested && !f.rosc) {
      // catastrophic mechanical cause (rupture/tamponade) — CPR keeps some circulation but
      // this arrest is not expected to be reversible with standard ALS.
      if (!state.cprActive) {
        f.noCprMinutes = (f.noCprMinutes || 0) + dt;
      } else {
        f.noCprMinutes = 0;
      }
      state.vitals.hr = state.cprActive ? 40 : 0;
    } else {
      state.vitals.sbp = moveToward(state.vitals.sbp, 90, 2 * dt);
      state.vitals.gcs = Math.min(14, state.vitals.gcs + 0.2 * dt);
    }
  },

  diagnosisOptions: [
    { id: "aortic-dissection", text: "Acute aortic dissection" },
    { id: "acs", text: "Acute coronary syndrome / STEMI" },
    { id: "msk", text: "Musculoskeletal chest/back strain (workplace injury)" },
    { id: "renal-colic", text: "Renal colic" },
    { id: "pe", text: "Pulmonary embolism" },
  ],

  dispositionOptions: [
    { id: "home", text: "Treat and discharge at home, GP follow-up" },
    { id: "transport-nonemergent", text: "Non-emergent transport to hospital" },
    { id: "transport-emergent", text: "Emergent (lights & sirens) transport to a hospital with cardiothoracic/vascular surgery" },
    { id: "refuse", text: "Patient declines transport" },
    { id: "cease-resus", text: "Cease resuscitation on scene (medical futility, per protocol)" },
  ],

  rubric: {
    requiredHistory: ["onset", "quality", "radiation", "cardiac-hx"],
    requiredExam: ["leftArm:palpate", "rightArm:palpate", "special:compare-bp-both-arms", "special:pulse-deficit-check"],
    examLabels: {
      "leftArm:palpate": "Palpate left arm pulse",
      "rightArm:palpate": "Palpate right arm pulse",
      "special:compare-bp-both-arms": "Compare BP both arms",
      "special:pulse-deficit-check": "Formal four-limb pulse check",
    },
    minVitalsChecks: 2,
    timeParMinutes: 15,
    idealTreatments: [
      { label: "Checked blood pressure in both arms before treating pain", points: 6, check: (e) => !!e.flags.armAsymmetryFound && !e.flags.analgesiaBeforeArmCheck },
      { label: "Attached cardiac monitor & acquired a 12-lead ECG to rule out STEMI mimics", points: 4, check: (e) => e.monitorAttached && !!e.proceduresDone["12lead"] },
      { label: "Established IV access", points: 3, check: (e) => !!e.proceduresDone.iv },
      { label: "Avoided giving a vasodilating/analgesic drug that dropped perfusion pressure", points: 6, check: (e) => !e.medsGiven.some((m) => ANALGESIC_IDS.includes(m.medId) || m.medId === "gtn") },
      { label: "Started CPR promptly after the arrest", points: 4, check: (e) => !e.flags.everArrested || (e.proceduresDone.cpr && e.proceduresDone.cpr.t - e.flags.arrestStartMinute <= 2) },
      {
        label: "Prioritised rapid emergent transport (or recognised futility if arrest occurred) rather than lingering on scene",
        points: 6,
        check: (e) => (!e.flags.everArrested && e.dispositionId === "transport-emergent") || (e.flags.everArrested && e.dispositionId === "cease-resus"),
      },
    ],
    contraindicated: [
      { label: "Gave GTN despite an asymmetric/unequal blood pressure between limbs — catastrophically dropped perfusion pressure", penalty: 20, check: (e) => e.medsGiven.some((m) => m.medId === "gtn") },
      { label: "Gave opioid/inhaled analgesia before completing a red-flag limb-BP assessment", penalty: 12, check: (e) => !!e.flags.analgesiaBeforeArmCheck },
      { label: "Gave aspirin to a suspected aortic dissection (antiplatelet worsens bleeding risk)", penalty: 8, check: (e) => e.medsGiven.some((m) => m.medId === "aspirin") },
    ],
    correctDiagnosisIds: ["aortic-dissection"],
    correctDispositionIds: (e) => (e.flags.everArrested ? ["cease-resus"] : ["transport-emergent"]),
    deathIf: (e) => e.flags.everArrested && !e.flags.rosc,
  },
};
