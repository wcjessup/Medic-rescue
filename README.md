# Paramedic — a patient assessment simulator

A black-and-white, 8-bit-styled browser game where you play a paramedic
running a full patient encounter OSCE-exam style: nothing is handed to
you, you get it by typing free-text questions into a live chat with the
scene — the patient, a bystander, your partner or your own eyes reply in
character. You attach a monitor and take your own vital signs, treat from
a kit bag that won't let you cheat (exact drug, exact dose, exact route,
IV drugs locked out until you've actually got IV access), then commit to
a provisional diagnosis and a disposition. You're graded on all of it
afterwards.

Everything is generated in code — there are **no image, audio, video or
font files anywhere in this repo**. The patient sprite and ECG waveform are
drawn on `<canvas>` at runtime; every sound effect and the background music
loop are synthesised with the Web Audio API.

## Running it

No build step, no npm install required (zero dependencies).

```sh
npm run dev
```

Then open **http://localhost:8000** in a browser. That's it — the dev
server is a ~50-line zero-dependency Node static file server
(`scripts/dev-server.mjs`) serving plain ES modules straight to the
browser.

## How to play

- **Chart (left panel)** is your running notes. Nothing appears there
  unless you go and get it — no free information.
- **Monitor (top centre)** shows a live ECG rhythm once you attach the
  leads, but every number (BP, RR, temp, GCS, SpO2 before the probe is on)
  stays blank until you actually perform that check.
- **TALK** is the primary way you gather everything — a chat box, not a
  menu. Type free text the way you'd actually speak on scene: "do I see,
  hear or smell any danger?", "hi, I'm your paramedic, what's going on
  today?", "are they using accessory muscles?", "can you get a set of
  vitals, priority on SpO2?" — and get an in-character reply. There's no
  fixed script; a lightweight keyword matcher (no external AI call, works
  fully offline) maps what you type onto the closest thing it could mean
  for this patient. If it can't tell, it says so — try rephrasing, or tap
  one of the suggestion chips, which just send a canonical phrasing
  through the same chat pipeline (not a hidden answer key).
- **Click the patient** to focus a body region — chips appear offering to
  inspect/palpate/auscultate it, or type what you're doing to it directly
  ("I feel his pulse", "I listen to his chest").
- **VITALS** tab shows the same trend table plus reliable one-tap buttons
  for a full obs check and a BGL, if you'd rather not type it.
- **KIT BAG** — pick a drug, its concentration (where relevant), a dose,
  and a route. Routes that need IV/IO access are greyed out and locked
  until you've actually cannulated the patient. Nothing stops you from
  picking the wrong drug, dose or route — the patient (and your score)
  will suffer the consequences.
- **PROCEDURES** — IV/IO access, oxygen, airway adjuncts, the cardiac
  monitor, defibrillation/cardioversion, and CPR.
- **DIAGNOSIS** (or the "END CALL / DIAGNOSIS" button in the header) —
  commit to a provisional diagnosis and a disposition (stay home, GP
  referral, non-emergent or emergent transport, or ceasing resuscitation).
  This ends the job and takes you to your shift debrief.

Time only moves when you act — every question, exam, procedure and
treatment costs simulated minutes, and each case's physiology evolves
against that clock, so dawdling has consequences.

## Debrief / scoring

After you end the call you get a letter grade with a full breakdown:
history taking, physical exam, vitals trending, treatment accuracy,
diagnosis, and disposition, plus penalties for dangerous or contraindicated
actions (wrong drug concentration, defibrillating a non-shockable rhythm,
giving a vasodilator to a patient with unequal limb blood pressures, etc.),
and a line-by-line "what you did well" / "what to improve" list.

## Cases

Three fully-simulated cases are included, each exercising a different
paramedic teaching point:

| Case | Patient | Teaches |
|---|---|---|
| **Status asthmaticus** | Leo, 5M | Paediatric weight-based dosing, route-gating, managing a scripted respiratory-then-cardiac arrest |
| **Hypokalaemic VT arrest** | Belinda, 70F | Reversible-cause recognition, ECG rhythm progression (sinus tach → bigeminy → VT), witnessed arrest → ROSC → AF |
| **Aortic dissection** | Bill, 55M | The "trap" case — reflexively treating pain (or giving GTN) before completing a red-flag assessment (bilateral limb BPs) triggers a catastrophic, largely non-survivable PEA arrest. Recognise it first and you can avoid the trap entirely. |

The engine (`src/sim/encounter.js`, `src/sim/scoring.js`) is fully
data-driven — a case is just an object describing history questions, exam
findings per body region, a physiology `tick()` function, and a scoring
rubric (see `src/data/cases/*.js`). Adding more cases from the same
template doesn't require touching the engine.

## Project structure

```
index.html / styles.css      shell + monochrome 8-bit theme
src/main.js                  screen routing (title → case select → briefing → encounter → debrief)
src/audio/audio.js           procedural WebAudio SFX + music engine
src/render/patientSprite.js  canvas-drawn paper-doll patient + clickable body regions
src/render/monitor.js        canvas-drawn scrolling ECG waveform per rhythm
src/sim/encounter.js         the encounter state machine (chart, exam, vitals, meds, procedures, time)
src/sim/nlu.js                offline keyword/phrase matcher behind the TALK chat
src/sim/primarySurvey.js     generic DRABCD primary-survey text, derived from live physiology
src/sim/scoring.js           rubric-driven grading engine
src/data/meds.js             the shared paramedic kit bag (drugs, concentrations, doses, routes)
src/data/equipment.js        procedures (IV/IO, monitor, airway, defib, CPR...)
src/data/cases/*.js          the three case definitions
src/ui/*.js                  DOM rendering + event wiring for each screen
```

## Known simplifications

This is a game, not a clinical calculator — a few deliberate simplifications:
- A single "perform full vital signs check" action stands in for
  separately cycling an NIBP cuff, counting respirations, etc.
- IV/IO cannulation always succeeds (no attempt-failure mechanic).
- Drug administration doesn't model infusion *rate* (e.g. KCl must be a
  slow infusion in reality; the game only checks that it was given IV,
  not how fast).
- Only the three cases above are implemented; the case-select screen and
  scoring engine are built to take more without engine changes.
- The chat's "understanding" (`src/sim/nlu.js`) is a deterministic,
  offline keyword/phrase matcher, not a language model — it was chosen
  deliberately so the game behaves identically whether it's opened locally
  or as a hosted artifact, with no network call and no API key. It's
  generous by design (a broad match beats a dead end), so it can
  occasionally answer a different, related question than the one you
  meant to ask — rephrase, mention the body part by name, or use a chip if
  that happens.
