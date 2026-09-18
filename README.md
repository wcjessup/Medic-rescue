# Paramedic — a patient assessment simulator

A black-and-white, 8-bit-styled browser game where you play a paramedic
running a full patient encounter: take a history, examine the patient
region by region, attach a monitor and take your own vital signs, treat
from a kit bag that won't let you cheat (exact drug, exact dose, exact
route, IV drugs locked out until you've actually got IV access), then
commit to a provisional diagnosis and a disposition. You're graded on all
of it afterwards.

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
- **Click the patient** to examine a body region — choose to inspect,
  palpate or auscultate depending on what's available there.
- **HISTORY** — ask SAMPLE/OPQRST-style questions one at a time.
- **VITALS** — perform a full obs check; each one is timestamped into the
  **Vitals Trend** table at the bottom so you can watch the patient trend
  over the course of the job.
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
