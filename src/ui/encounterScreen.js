import { Encounter } from "../sim/encounter.js";
import { MEDS, getMed } from "../data/meds.js";
import { EQUIPMENT, getEquipment } from "../data/equipment.js";
import { drawPatient, hitTestPatient } from "../render/patientSprite.js";
import { drawMonitor } from "../render/monitor.js";
import { audio } from "../audio/audio.js";
import { openModal, closeModal, toast } from "./modal.js";
import { buildTopics, matchInput } from "../sim/nlu.js";

const TABS = [
  { id: "talk", label: "Talk" },
  { id: "vitals", label: "Vitals" },
  { id: "kit", label: "Kit Bag" },
  { id: "procedures", label: "Procedures" },
  { id: "diagnosis", label: "Diagnosis" },
];

const EXAM_VERBS = { inspect: "look at", palpate: "feel", auscultate: "listen to" };

let els = null;
let encounter = null;
let activeTab = "history";
let selectedRegion = null;
let rafId = null;
let onFinishCb = null;

function q(id) {
  return document.getElementById(id);
}

function cacheEls() {
  els = {
    hudCaseName: q("hud-case-name"),
    hudClock: q("hud-clock"),
    notepadEntries: q("notepad-entries"),
    monitorCanvas: q("monitor-canvas"),
    monitorDigits: q("monitor-digits"),
    patientCanvas: q("patient-canvas"),
    patientStatusLine: q("patient-status-line"),
    trendHead: q("trend-head"),
    trendBody: q("trend-body"),
    actionTabs: q("action-tabs"),
    tabContent: q("tab-content"),
    muteBtn: document.querySelector('#hud [data-action="mute"]'),
  };
}

export function initEncounterScreen() {
  cacheEls();
  els.patientCanvas.addEventListener("click", handlePatientClick);
  els.actionTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    activeTab = btn.dataset.tab;
    audio.click();
    renderTabBar();
    renderTabContent();
  });
  els.tabContent.addEventListener("click", handleTabContentClick);
  els.muteBtn.addEventListener("click", () => {
    audio.setEnabled(!audio.enabled);
    els.muteBtn.textContent = audio.enabled ? "🔊" : "🔇";
  });
}

export function startEncounter(caseDef, onFinish) {
  encounter = new Encounter(caseDef);
  encounter.chatLog = [{ speaker: "system", text: "You arrive on scene." }];
  onFinishCb = onFinish;
  activeTab = "talk";
  selectedRegion = null;
  els.hudCaseName.textContent = `${caseDef.name}, ${caseDef.age}${caseDef.sex} — ${caseDef.chiefComplaint}`;
  audio.startMusic();
  audio.stopCardiacBeeper();
  audio.startCardiacBeeper(
    () => (encounter.monitorAttached ? encounter.vitals.hr : 0),
    () => encounter.rhythm === "asystole" || encounter.rhythm === "vf"
  );
  renderAll();
  startLoop();
}

export function stopEncounterScreen() {
  cancelAnimationFrame(rafId);
  audio.stopCardiacBeeper();
  audio.stopMusic();
  closeModal();
}

function startLoop() {
  cancelAnimationFrame(rafId);
  const step = (t) => {
    if (encounter && !encounter.ended) {
      drawMonitor(els.monitorCanvas, encounter, { t });
      drawPatient(els.patientCanvas, encounter, { t, highlightRegion: selectedRegion });
    }
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
}

// ---------------------------------------------------------------- rendering

function renderAll() {
  if (!encounter) return;
  els.hudClock.textContent = encounter.clockLabel();
  renderNotepad();
  renderDigits();
  renderTrend();
  renderTabBar();
  renderTabContent();
  renderPatientStatus();
  if (encounter.ended) return;
}

function renderNotepad() {
  const CAT_LABEL = { dispatch: "DISPATCH", history: "HX", exam: "EXAM", vitals: "OBS", procedure: "PROC", treatment: "RX", event: "!", scene: "SCENE", primary: "SURVEY" };
  if (!encounter.notepad.length) {
    els.notepadEntries.innerHTML = `<p class="empty">Nothing charted yet.</p>`;
    return;
  }
  els.notepadEntries.innerHTML = encounter.notepad
    .map(
      (e) => `<div class="entry"><span class="t">${e.label}</span> <span class="cat">${CAT_LABEL[e.cat] || e.cat}</span><br>${escapeHtml(e.text)}</div>`
    )
    .join("");
  els.notepadEntries.scrollTop = els.notepadEntries.scrollHeight;
}

function renderDigits() {
  const last = encounter.vitalsHistory[encounter.vitalsHistory.length - 1];
  const items = [
    { label: "HR", value: encounter.monitorAttached ? Math.round(encounter.vitals.hr) : null, alarm: encounter.monitorAttached && (encounter.vitals.hr > 160 || encounter.vitals.hr < 40) },
    { label: "SPO2", value: encounter.spo2Attached ? `${Math.round(encounter.vitals.spo2)}%` : null, alarm: encounter.spo2Attached && encounter.vitals.spo2 < 90 },
    { label: "RR", value: last ? last.rr : null },
    { label: "NIBP", value: last ? `${last.sbp}/${last.dbp}` : null },
    { label: "TEMP", value: last ? `${last.temp}°C` : null },
    { label: "GCS", value: last ? last.gcs : null },
    { label: "ETCO2", value: encounter.hasCapnography() ? Math.round(encounter.vitals.etco2) : null },
    { label: "RHYTHM", value: encounter.monitorAttached ? encounter.rhythm.toUpperCase() : null },
  ];
  els.monitorDigits.innerHTML = items
    .map(
      (it) =>
        `<div class="digit${it.alarm ? " alarm" : ""}"><span class="label">${it.label}</span><span class="value${it.value === null || it.value === undefined ? " dash" : ""}">${it.value ?? "--"}</span></div>`
    )
    .join("");
}

function renderTrend() {
  const rows = [
    { key: "hr", label: "HR" },
    { key: "bp", label: "BP" },
    { key: "rr", label: "RR" },
    { key: "spo2", label: "SpO2" },
    { key: "temp", label: "Temp" },
    { key: "gcs", label: "GCS" },
  ];
  els.trendHead.innerHTML = `<th>time</th>` + encounter.vitalsHistory.map((v) => `<th>${v.label}</th>`).join("");
  if (!encounter.vitalsHistory.length) {
    els.trendBody.innerHTML = `<tr><td class="row-label">—</td><td>no obs taken yet</td></tr>`;
    return;
  }
  els.trendBody.innerHTML = rows
    .map((r) => {
      const cells = encounter.vitalsHistory
        .map((v) => {
          let val;
          if (r.key === "bp") val = `${v.sbp}/${v.dbp}`;
          else if (r.key === "hr") val = v.hr ?? "—";
          else if (r.key === "spo2") val = v.spo2 !== null ? `${v.spo2}%` : "—";
          else val = v[r.key];
          return `<td>${val}</td>`;
        })
        .join("");
      return `<tr><td class="row-label">${r.label}</td>${cells}</tr>`;
    })
    .join("");
}

function renderPatientStatus() {
  const c = encounter;
  let s = `${c.caseDef.name}, ${c.caseDef.age}${c.caseDef.sex}, ${c.caseDef.weightKg}kg — `;
  if (c.arrested) s += "IN CARDIAC ARREST";
  else if (!c.conscious) s += "UNCONSCIOUS";
  else s += "conscious";
  els.patientStatusLine.textContent = s;
}

function renderTabBar() {
  els.actionTabs.innerHTML = TABS.map((t) => `<button class="tab-btn${t.id === activeTab ? " active" : ""}" data-tab="${t.id}">${t.label}</button>`).join("");
}

function renderTabContent() {
  if (encounter.ended) return;
  switch (activeTab) {
    case "talk":
      return renderTalkTab();
    case "vitals":
      return renderVitalsTab();
    case "kit":
      return renderKitTab();
    case "procedures":
      return renderProceduresTab();
    case "diagnosis":
      return renderDiagnosisTab();
  }
}

function speakerMeta(speaker) {
  switch (speaker) {
    case "you":
      return { label: "YOU", cls: "me" };
    case "patient":
      return { label: (encounter.caseDef.historyRespondent || "Patient").toUpperCase(), cls: "them" };
    case "partner":
      return { label: "PARTNER", cls: "them" };
    case "exam":
      return { label: "YOU OBSERVE", cls: "narrator" };
    default:
      return { label: "", cls: "system" };
  }
}

function renderChatBubble(entry) {
  const meta = speakerMeta(entry.speaker);
  return `<div class="chat-msg ${meta.cls}">${meta.label ? `<div class="chat-speaker">${meta.label}</div>` : ""}<div class="chat-bubble">${escapeHtml(entry.text)}</div></div>`;
}

function buildChipsHtml() {
  const chips = [];
  const cd = encounter.caseDef;
  if (cd.history.some((h) => h.id === "chief-complaint") && !encounter.historyAsked.has("chief-complaint")) {
    chips.push({ label: "Introduce yourself", text: "Hi, I'm your paramedic — what's going on today?" });
  }
  if (cd.scene?.danger && !encounter.examDone.has("scene:danger")) {
    chips.push({ label: "Check for danger", text: "Do I see, hear or smell anything dangerous?" });
  }
  if (cd.scene?.impression && !encounter.examDone.has("scene:impression")) {
    chips.push({ label: "General impression", text: "As I walk in, what's my general impression? Does the patient look at me?" });
  }
  if (selectedRegion && cd.exam[selectedRegion]) {
    const region = cd.exam[selectedRegion];
    for (const f of region.findings) {
      const key = `${selectedRegion}:${f.type}`;
      if (encounter.examDone.has(key)) continue;
      chips.push({ label: `${f.label} — ${region.label}`, text: `I ${EXAM_VERBS[f.type] || f.type} the ${region.label.toLowerCase()}.` });
    }
  }
  chips.push({ label: "Get vitals", text: "Can you get a full set of vitals, please — priority on SpO2." });
  return chips.map((c) => `<button class="chip" data-role="chip" data-text="${escapeHtml(c.text)}">${escapeHtml(c.label)}</button>`).join("");
}

function renderTalkTab() {
  const messagesHtml = encounter.chatLog.map(renderChatBubble).join("");
  els.tabContent.innerHTML = `
    <div class="chat-root">
      <div class="chat-messages" id="chat-messages">${messagesHtml}</div>
      <div class="chat-chips" id="chat-chips">${buildChipsHtml()}</div>
      <form class="chat-input-row" id="chat-form">
        <input type="text" id="chat-input" class="chat-input" placeholder="Ask a question, or say what you're doing…" autocomplete="off" />
        <button type="submit" class="btn btn-small">SEND</button>
      </form>
    </div>
  `;
  const msgsEl = document.getElementById("chat-messages");
  msgsEl.scrollTop = msgsEl.scrollHeight;
  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value;
    input.value = "";
    sendChat(text);
  });
}

function formatVitalsSnapshot(snap) {
  return `Righto, checking now... Obs are: HR ${snap.hr ?? "not on the monitor yet"}, BP ${snap.sbp}/${snap.dbp}, resp rate ${snap.rr}, sats ${snap.spo2 ?? "no probe on yet"}${snap.spo2 !== null ? "%" : ""}, temp ${snap.temp}°C, GCS ${snap.gcs}.`;
}

function sendChat(rawText) {
  const text = (rawText || "").trim();
  if (!text || !encounter || encounter.ended) return;
  encounter.chatLog.push({ speaker: "you", text });
  audio.click();

  const topics = buildTopics(encounter.caseDef, encounter, selectedRegion);
  const match = matchInput(text, topics);

  if (!match) {
    encounter.chatLog.push({ speaker: "system", text: "Not sure what you mean — try asking about the scene, their history, or describing what you're examining." });
    audio.error();
    renderAll();
    return;
  }

  const result = match.run();
  if (result === null || result === undefined) {
    encounter.chatLog.push({ speaker: "system", text: "(You already covered that.)" });
    renderAll();
    return;
  }

  let speaker = "exam";
  let bubbleText = result;
  if (match.kind === "history") speaker = "patient";
  else if (match.kind === "vitals" && match.id === "take") {
    speaker = "partner";
    bubbleText = formatVitalsSnapshot(result);
  } else if (match.kind === "vitals" && match.id === "bgl") {
    bubbleText = `Blood glucose: ${result} mmol/L.`;
  }
  encounter.chatLog.push({ speaker, text: bubbleText });
  audio.confirm();
  renderAll();
}

function renderVitalsTab() {
  let html = `<div class="section-label">Vital Signs</div>`;
  html += `<button class="list-btn" data-role="take-vitals">
    <div class="lb-title">Perform Full Vital Signs Check</div>
    <div class="lb-sub">BP cuff, RR count, temp, GCS (+ live HR/SpO2 if monitor/probe attached) — takes 3 min</div>
  </button>`;
  html += `<div class="section-label">Blood Glucose</div>`;
  const bglDone = encounter.flags.bglChecked;
  html += `<button class="list-btn${bglDone ? " done" : ""}" data-role="bgl" ${bglDone ? "disabled" : ""}>
    <div class="lb-title">Blood Glucose Test (BGL)</div>
    ${bglDone ? `<div class="lb-sub">BGL ${encounter.vitals.bgl} mmol/L</div>` : ""}
  </button>`;
  html += `<div class="section-label">History (${encounter.vitalsHistory.length} taken)</div>`;
  if (encounter.vitalsHistory.length) {
    html += encounter.vitalsHistory
      .slice()
      .reverse()
      .map((v) => `<div class="list-btn" style="cursor:default"><div class="lb-title">${v.label}</div><div class="lb-sub">HR ${v.hr ?? "—"} · BP ${v.sbp}/${v.dbp} · RR ${v.rr} · SpO2 ${v.spo2 ?? "—"} · T ${v.temp} · GCS ${v.gcs}</div></div>`)
      .join("");
  }
  els.tabContent.innerHTML = html;
}

function medUnavailableReason(med) {
  const availableRoutes = med.routes.filter((r) => !med.requiresProcedure[r] || encounter.proceduresDone[med.requiresProcedure[r]]);
  if (!availableRoutes.length) return `Locked — needs: ${[...new Set(Object.values(med.requiresProcedure))].map((id) => getEquipment(id)?.name).join(" or ")}`;
  return null;
}

function renderKitTab() {
  let html = `<div class="section-label">Kit Bag</div>`;
  html += MEDS.map((med) => {
    const locked = medUnavailableReason(med);
    const given = encounter.medsGiven.filter((m) => m.medId === med.id).length;
    return `<button class="list-btn" data-role="give-med" data-med="${med.id}">
      <div class="lb-title">${med.name}${given ? ` <span style="color:var(--accent-dim)">(given x${given})</span>` : ""}</div>
      <div class="lb-sub">${med.class}${locked ? ` · <span style="color:var(--danger)">${locked}</span>` : ""}</div>
    </button>`;
  }).join("");
  els.tabContent.innerHTML = html;
}

function renderProceduresTab() {
  let html = "";
  const groups = {};
  for (const eq of EQUIPMENT) {
    if (eq.id === "defib" || eq.id === "cardioversion" || eq.id === "cpr") continue;
    (groups[eq.category] ||= []).push(eq);
  }
  for (const [cat, items] of Object.entries(groups)) {
    html += `<div class="section-label">${cat}</div>`;
    html += items
      .map((eq) => {
        const done = eq.options ? encounter.proceduresDone[eq.id] : !!encounter.proceduresDone[eq.id];
        const blocked = (eq.requires || []).some((r) => !encounter.proceduresDone[r]);
        return `<button class="list-btn${done ? " done" : ""}" data-role="do-proc" data-proc="${eq.id}" ${blocked ? "disabled" : ""}>
          <div class="lb-title">${eq.name}</div>
          <div class="lb-sub">${done ? "Done" : blocked ? `Requires ${eq.requires.map((r) => getEquipment(r).name).join(", ")}` : `${eq.minutes} min`}</div>
        </button>`;
      })
      .join("");
  }

  html += `<div class="section-label">Resuscitation</div>`;
  const monitorReady = encounter.monitorAttached;
  html += `<button class="list-btn" data-role="do-proc" data-proc="defib" ${monitorReady ? "" : "disabled"}>
    <div class="lb-title">Defibrillation</div><div class="lb-sub">${monitorReady ? "Choose energy & shock" : "Requires monitor"}</div></button>`;
  html += `<button class="list-btn" data-role="do-proc" data-proc="cardioversion" ${monitorReady ? "" : "disabled"}>
    <div class="lb-title">Synchronised Cardioversion</div><div class="lb-sub">${monitorReady ? "Choose energy & shock" : "Requires monitor"}</div></button>`;
  if (encounter.cprActive) {
    html += `<button class="list-btn" data-role="cpr-continue"><div class="lb-title">Continue CPR (2 min cycle)</div></button>`;
    html += `<button class="list-btn" data-role="cpr-stop"><div class="lb-title">Stop CPR / Pulse &amp; Rhythm Check</div></button>`;
  } else {
    html += `<button class="list-btn" data-role="cpr-start"><div class="lb-title">Start CPR</div></button>`;
  }

  els.tabContent.innerHTML = html;
}

function renderDiagnosisTab() {
  const cd = encounter.caseDef;
  let html = `<div class="section-label">Provisional Diagnosis</div>`;
  html += cd.diagnosisOptions
    .map((d) => `<button class="list-btn${encounter.diagnosisId === d.id ? " done" : ""}" data-role="select-dx" data-id="${d.id}"><div class="lb-title">${d.text}</div></button>`)
    .join("");
  html += `<div class="section-label">Disposition</div>`;
  html += cd.dispositionOptions
    .map((d) => `<button class="list-btn${encounter.dispositionId === d.id ? " done" : ""}" data-role="select-dispo" data-id="${d.id}"><div class="lb-title">${d.text}</div></button>`)
    .join("");
  const ready = encounter.diagnosisId && encounter.dispositionId;
  html += `<button class="btn btn-big" style="width:100%;margin-top:10px" data-role="confirm-end" ${ready ? "" : "disabled"}>CONFIRM &amp; END CALL</button>`;
  els.tabContent.innerHTML = html;
}

// ---------------------------------------------------------------- events

function handlePatientClick(e) {
  const region = hitTestPatient(els.patientCanvas, e);
  if (!region) return;
  selectedRegion = region;
  activeTab = "talk";
  audio.click();
  renderTabBar();
  renderTabContent();
}

function handleTabContentClick(e) {
  const btn = e.target.closest("[data-role]");
  if (!btn || btn.disabled) return;
  const role = btn.dataset.role;

  if (role === "chip") {
    sendChat(btn.dataset.text);
  } else if (role === "take-vitals") {
    encounter.takeVitals();
    audio.confirm();
    renderAll();
  } else if (role === "bgl") {
    encounter.checkBGL();
    audio.confirm();
    renderAll();
  } else if (role === "give-med") {
    openMedModal(btn.dataset.med);
  } else if (role === "do-proc") {
    openProcModal(btn.dataset.proc);
  } else if (role === "cpr-start" || role === "cpr-continue") {
    encounter.performCPR();
    audio.confirm();
    renderAll();
  } else if (role === "cpr-stop") {
    encounter.stopCPR();
    audio.click();
    renderAll();
  } else if (role === "select-dx") {
    encounter.setDiagnosis(btn.dataset.id);
    audio.click();
    renderDiagnosisTab();
  } else if (role === "select-dispo") {
    encounter.setDisposition(btn.dataset.id);
    audio.click();
    renderDiagnosisTab();
  } else if (role === "confirm-end") {
    finishEncounter();
  }
}

function finishEncounter() {
  encounter.finish();
  audio.confirm();
  if (onFinishCb) onFinishCb(encounter);
}

// ---------------------------------------------------------------- modals

function openMedModal(medId) {
  const med = getMed(medId);
  const availableRoutes = med.routes.map((r) => ({
    route: r,
    locked: !!(med.requiresProcedure[r] && !encounter.proceduresDone[med.requiresProcedure[r]]),
    needs: med.requiresProcedure[r] ? getEquipment(med.requiresProcedure[r])?.name : null,
  }));

  let doseFieldHtml;
  if (med.doseType === "select") {
    doseFieldHtml = `<div class="field"><label>Dose</label><select id="m-dose">${med.doses
      .map((d) => `<option value="${d.id}">${d.label}</option>`)
      .join("")}</select></div>`;
  } else {
    doseFieldHtml = `<div class="field"><label>Dose (${med.unit})</label>
      <input type="number" id="m-dose" min="${med.min}" max="${med.max}" step="${med.step}" value="${med.min}">
      <div class="hint">Range shown is the kit's available range — it does not mean any value is clinically correct.</div>
    </div>`;
  }

  const concHtml = med.concentrations
    ? `<div class="field"><label>Concentration</label><select id="m-conc">${med.concentrations.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select></div>`
    : "";

  const overlay = openModal(`
    <h3>${med.name}</h3>
    <p class="hint">${med.notes || med.class}</p>
    ${concHtml}
    ${doseFieldHtml}
    <div class="field">
      <label>Route</label>
      <div class="route-chip-row" id="m-routes">
        ${availableRoutes
          .map((r) => `<div class="route-chip${r.locked ? " locked" : ""}" data-route="${r.route}" title="${r.locked ? "Requires " + r.needs : ""}">${r.route}${r.locked ? " 🔒" : ""}</div>`)
          .join("")}
      </div>
      <div class="hint" id="m-route-hint"></div>
    </div>
    <div class="modal-actions">
      <button class="btn" data-modal-cancel>CANCEL</button>
      <button class="btn btn-big" id="m-confirm" disabled>GIVE</button>
    </div>
  `);

  let chosenRoute = null;
  overlay.querySelectorAll(".route-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chip.classList.contains("locked")) {
        overlay.querySelector("#m-route-hint").textContent = `Cannot use this route: ${chip.title}`;
        audio.error();
        return;
      }
      overlay.querySelectorAll(".route-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      chosenRoute = chip.dataset.route;
      overlay.querySelector("#m-confirm").disabled = false;
      overlay.querySelector("#m-route-hint").textContent = "";
    });
  });

  overlay.querySelector("[data-modal-cancel]").addEventListener("click", closeModal);
  overlay.querySelector("#m-confirm").addEventListener("click", () => {
    let dose, unit;
    if (med.doseType === "select") {
      const opt = med.doses.find((d) => d.id === overlay.querySelector("#m-dose").value);
      dose = opt.value;
      unit = opt.unit;
    } else {
      dose = parseFloat(overlay.querySelector("#m-dose").value);
      unit = med.unit;
    }
    const concentrationId = med.concentrations ? overlay.querySelector("#m-conc").value : undefined;
    encounter.giveMed(med.id, { concentrationId, dose, unit, route: chosenRoute });
    closeModal();
    audio.confirm();
    toast(`Gave ${med.name} ${dose}${unit} ${chosenRoute}`);
    renderAll();
  });
}

function openProcModal(procId) {
  if (procId === "defib" || procId === "cardioversion") {
    const energies = getEquipment("defib").options.energy;
    const overlay = openModal(`
      <h3>${procId === "defib" ? "Defibrillation" : "Synchronised Cardioversion"}</h3>
      <div class="field"><label>Energy</label><select id="p-energy">${energies.map((e) => `<option>${e}</option>`).join("")}</select></div>
      <div class="modal-actions">
        <button class="btn" data-modal-cancel>CANCEL</button>
        <button class="btn btn-big" id="p-confirm">CHARGE &amp; SHOCK</button>
      </div>
    `);
    overlay.querySelector("[data-modal-cancel]").addEventListener("click", closeModal);
    overlay.querySelector("#p-confirm").addEventListener("click", () => {
      const energy = overlay.querySelector("#p-energy").value;
      closeModal();
      audio.defibCharge();
      toast("Charging...");
      setTimeout(() => {
        audio.defibShock();
        encounter.shock(`${energy}${procId === "cardioversion" ? " sync" : ""}`);
        renderAll();
      }, 900);
    });
    return;
  }

  const def = getEquipment(procId);
  if (!def.options) {
    encounter.doProcedure(procId, {});
    audio.confirm();
    if (procId === "monitor" || procId === "spo2") toast(`${def.name} attached.`);
    renderAll();
    return;
  }

  const fields = Object.entries(def.options)
    .map(([key, values]) => `<div class="field"><label>${key}</label><select id="p-${key}">${values.map((v) => `<option>${v}</option>`).join("")}</select></div>`)
    .join("");
  const overlay = openModal(`
    <h3>${def.name}</h3>
    ${fields}
    <div class="modal-actions">
      <button class="btn" data-modal-cancel>CANCEL</button>
      <button class="btn btn-big" id="p-confirm">CONFIRM</button>
    </div>
  `);
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", closeModal);
  overlay.querySelector("#p-confirm").addEventListener("click", () => {
    const opts = {};
    for (const key of Object.keys(def.options)) opts[key] = overlay.querySelector(`#p-${key}`).value;
    closeModal();
    encounter.doProcedure(procId, opts);
    audio.confirm();
    renderAll();
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function getActiveEncounter() {
  return encounter;
}

export function goToDiagnosisTab() {
  if (!encounter || encounter.ended) return;
  activeTab = "diagnosis";
  renderTabBar();
  renderTabContent();
}
