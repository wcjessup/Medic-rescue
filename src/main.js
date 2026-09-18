import { CASES } from "./data/cases/index.js";
import { audio } from "./audio/audio.js";
import { scoreEncounter } from "./sim/scoring.js";
import { initEncounterScreen, startEncounter, stopEncounterScreen, goToDiagnosisTab } from "./ui/encounterScreen.js";

const screens = {};
document.querySelectorAll(".screen").forEach((el) => (screens[el.id] = el));

function showScreen(id) {
  Object.values(screens).forEach((el) => el.classList.add("hidden"));
  screens[id].classList.remove("hidden");
}

let pendingCase = null;

function renderCaseList() {
  const list = document.getElementById("case-list");
  list.innerHTML = CASES.map(
    (c) => `
    <div class="case-card" data-case="${c.id}">
      <h3>${c.name.toUpperCase()}, ${c.age}${c.sex}</h3>
      <div class="meta">${c.chiefComplaint}</div>
      <div class="stars">${"★".repeat(c.difficulty)}${"☆".repeat(5 - c.difficulty)}</div>
      <p class="blurb">${c.blurb}</p>
    </div>`
  ).join("");
  list.querySelectorAll(".case-card").forEach((card) => {
    card.addEventListener("click", () => {
      audio.click();
      pendingCase = CASES.find((c) => c.id === card.dataset.case);
      showBriefing(pendingCase);
    });
  });
}

function showBriefing(caseDef) {
  document.getElementById("briefing-title").textContent = `DISPATCH — ${caseDef.name.toUpperCase()}`;
  document.getElementById("briefing-text").textContent = caseDef.dispatchText;
  showScreen("screen-briefing");
  audio.radioStatic(0.4);
}

function renderDebrief(encounter, result) {
  const body = document.getElementById("debrief-body");
  const outcomeLine = result.survived
    ? `<p style="color:var(--accent)">Patient handed over alive.</p>`
    : `<p style="color:var(--danger)">Patient did not survive this encounter.</p>`;

  body.innerHTML = `
    <div class="grade-hero">
      <div class="grade-letter">${result.grade}</div>
      <div class="grade-score">${result.pct}% overall</div>
      ${outcomeLine}
    </div>
    <div class="score-rows">
      ${result.sections
        .map((s) => `<div class="score-row"><span>${s.label}</span><span class="pts">${s.points.toFixed(1)} / ${s.maxPoints}</span></div>`)
        .join("")}
      ${result.penalties ? `<div class="score-row"><span style="color:var(--danger)">Penalties</span><span class="pts" style="color:var(--danger)">-${result.penalties}</span></div>` : ""}
    </div>
    <div class="feedback-block">
      <h4>What you did well</h4>
      <ul>${result.good.length ? result.good.map((g) => `<li class="good">${g}</li>`).join("") : "<li>—</li>"}</ul>
      <h4>What to improve</h4>
      <ul>${result.bad.length ? result.bad.map((b) => `<li class="bad">${b}</li>`).join("") : "<li>Nothing — clean run.</li>"}</ul>
    </div>
  `;
  showScreen("screen-debrief");
}

function bootButtons() {
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case "start":
        audio.click();
        renderCaseList();
        showScreen("screen-caseselect");
        break;
      case "how-to-play":
        audio.click();
        showScreen("screen-howto");
        break;
      case "back-to-title":
        audio.click();
        stopEncounterScreen();
        showScreen("screen-title");
        break;
      case "back-to-caseselect":
        audio.click();
        stopEncounterScreen();
        renderCaseList();
        showScreen("screen-caseselect");
        break;
      case "respond":
        audio.confirm();
        showScreen("screen-encounter");
        startEncounter(pendingCase, (encounter) => {
          const result = scoreEncounter(encounter);
          stopEncounterScreen();
          renderDebrief(encounter, result);
        });
        break;
      case "open-diagnosis":
        audio.click();
        goToDiagnosisTab();
        break;
      case "mute":
        // handled inside encounterScreen for the in-encounter button
        break;
    }
  });

  document.getElementById("audio-toggle").addEventListener("change", (e) => {
    audio.setEnabled(e.target.checked);
  });
}

initEncounterScreen();
bootButtons();
showScreen("screen-title");
