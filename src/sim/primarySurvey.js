// Generic DRABCD-style primary survey steps. These are deliberately NOT
// per-case content — the text is derived live from the patient's current
// physiology, the same way a real primary survey reads off the patient in
// front of you rather than a script.

export const PRIMARY_SURVEY_STEPS = [
  {
    id: "response",
    label: "Response",
    keywords: ["responsive", "respond", "conscious", "alert", "awake", "avpu", "wake up", "voice", "aware"],
    text: (s) => {
      if (s.arrested) return "No response at all — unresponsive, not breathing normally, no purposeful movement.";
      if (!s.conscious) return "No response to voice. Responds only to a painful stimulus.";
      if (s.vitals.gcs >= 15) return "Alert and orientated — opens eyes spontaneously, responds appropriately to your voice.";
      return "Responds to voice but seems drowsy/confused — not fully alert.";
    },
  },
  {
    id: "airway",
    label: "Airway",
    keywords: ["airway", "patent airway", "talking", "speak", "speaking", "words", "sentences", "gurgling", "stridor", "obstruct"],
    text: (s) => {
      if (s.arrested) return "No spontaneous airway effort — needs immediate airway management.";
      if (!s.conscious) return "Not talking. Airway needs active positioning/management (head-tilt/chin-lift or jaw thrust) — don't assume it's clear.";
      if (s.vitals.rr >= 34) return "Talking to you, but only in short bursts of a few words at a time between breaths — airway is patent but they're working hard.";
      return "Talking to you in full sentences without difficulty — airway is clear and self-maintained.";
    },
  },
  {
    id: "breathing",
    label: "Breathing",
    keywords: ["breathing", "breath", "resp rate", "respiratory rate", "chest rise", "work of breathing", "wheeze", "accessory muscle", "tripod", "laboured", "distress"],
    text: (s) => {
      if (s.arrested) return "No breathing effort seen or felt.";
      const rr = s.vitals.rr;
      if (rr >= 30) return `Breathing fast and hard — visible accessory muscle use, roughly ${Math.round(rr)}/min by eye. This needs a formal count and a listen to the chest.`;
      if (rr <= 10) return `Breathing looks slow and shallow — roughly ${Math.round(rr)}/min by eye. Concerning.`;
      return `Breathing looks comfortable, roughly ${Math.round(rr)}/min by eye, no obvious accessory muscle use.`;
    },
  },
  {
    id: "circulation",
    label: "Circulation",
    keywords: ["circulation", "pulse", "skin colour", "skin color", "capillary refill", "cap refill", "pale", "sweaty", "diaphoretic", "clammy", "radial pulse"],
    text: (s) => {
      if (s.arrested) return "No palpable central pulse.";
      const hr = s.vitals.hr;
      const rateDesc = hr >= 120 ? "fast" : hr <= 50 ? "slow" : "a normal rate";
      return `Radial pulse present, ${rateDesc}. Skin ${s.vitals.spo2 < 90 ? "looks dusky/cool" : "is a normal colour and warmth"}.`;
    },
  },
  {
    id: "disability",
    label: "Disability",
    keywords: ["disability", "gcs", "glasgow", "pupils", "neuro", "blood sugar", "bgl", "moving all limbs", "weakness"],
    text: (s) => `GCS ${Math.round(s.vitals.gcs)}/15. ${s.vitals.gcs >= 15 ? "Moving all four limbs, no focal weakness noted on a quick look." : "Reduced conscious state — needs a full GCS breakdown and a blood glucose check."}`,
  },
];
