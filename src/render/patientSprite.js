// Procedurally-drawn 1-bit paper-doll patient sprite with clickable body
// regions. Everything is rectangles on a low-res logical grid, scaled up
// for a crunchy 8-bit look. No image assets.

export const LOGICAL_W = 52;
export const LOGICAL_H = 64;

// [x, y, w, h] in logical grid units
export const REGIONS = {
  head: { label: "Head / Face", rect: [18, 3, 16, 13] },
  neck: { label: "Neck", rect: [21, 16, 10, 4] },
  chest: { label: "Chest", rect: [14, 20, 24, 14] },
  abdomen: { label: "Abdomen", rect: [16, 34, 20, 10] },
  pelvis: { label: "Pelvis", rect: [16, 44, 20, 6] },
  leftArm: { label: "Left Arm", rect: [4, 21, 10, 22] },
  rightArm: { label: "Right Arm", rect: [38, 21, 10, 22] },
  leftHand: { label: "Left Hand", rect: [3, 43, 9, 8] },
  rightHand: { label: "Right Hand", rect: [40, 43, 9, 8] },
  leftLeg: { label: "Left Leg", rect: [17, 50, 8, 13] },
  rightLeg: { label: "Right Leg", rect: [27, 50, 8, 13] },
  leftFoot: { label: "Left Foot", rect: [14, 61, 10, 3] },
  rightFoot: { label: "Right Foot", rect: [28, 61, 10, 3] },
};

export function regionAt(logicalX, logicalY) {
  for (const [id, r] of Object.entries(REGIONS)) {
    const [x, y, w, h] = r.rect;
    if (logicalX >= x && logicalX <= x + w && logicalY >= y && logicalY <= y + h) return id;
  }
  return null;
}

const INK = "#2a2722";
const ACCENT = "#d97757";
const DANGER = "#c0392b";

function rect(ctx, scale, [x, y, w, h], fill, stroke = INK, lw = 1.5) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
  ctx.strokeRect(x * scale, y * scale, w * scale, h * scale);
}

export function drawPatient(canvas, encounter, opts = {}) {
  const ctx = canvas.getContext("2d");
  const scale = canvas.width / LOGICAL_W;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const skin = "#e7e0d2";
  const conscious = encounter.conscious && !encounter.arrested;
  const cyanotic = (encounter.vitals.spo2 ?? 100) < 88;
  const bodyFill = cyanotic ? "#aebdba" : skin;

  // limbs first (behind torso)
  rect(ctx, scale, REGIONS.leftArm.rect, bodyFill);
  rect(ctx, scale, REGIONS.rightArm.rect, bodyFill);
  rect(ctx, scale, REGIONS.leftHand.rect, bodyFill);
  rect(ctx, scale, REGIONS.rightHand.rect, bodyFill);
  rect(ctx, scale, REGIONS.leftLeg.rect, bodyFill);
  rect(ctx, scale, REGIONS.rightLeg.rect, bodyFill);
  rect(ctx, scale, REGIONS.leftFoot.rect, "#8a8172");
  rect(ctx, scale, REGIONS.rightFoot.rect, "#8a8172");

  // torso
  rect(ctx, scale, REGIONS.pelvis.rect, "#cdc3af");
  rect(ctx, scale, REGIONS.abdomen.rect, bodyFill);
  rect(ctx, scale, REGIONS.chest.rect, bodyFill);
  rect(ctx, scale, REGIONS.neck.rect, bodyFill);

  // IV line visual if cannulated
  if (encounter.proceduresDone.iv) {
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(9 * scale, 30 * scale);
    ctx.lineTo(4 * scale, 44 * scale);
    ctx.stroke();
  }

  // O2 mask visual
  if (encounter.proceduresDone.o2) {
    rect(ctx, scale, [21, 10, 10, 6], "#f3ede2", "#b6ac98", 1);
  }

  // monitor leads
  if (encounter.monitorAttached) {
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.3;
    [[18, 22], [38, 22], [26, 32]].forEach(([lx, ly]) => {
      ctx.beginPath();
      ctx.arc(lx * scale, ly * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // head
  rect(ctx, scale, REGIONS.head.rect, bodyFill);
  ctx.fillStyle = INK;
  const [hx, hy] = REGIONS.head.rect;
  if (conscious) {
    ctx.fillRect((hx + 3) * scale, (hy + 5) * scale, 2 * scale, 2 * scale);
    ctx.fillRect((hx + 11) * scale, (hy + 5) * scale, 2 * scale, 2 * scale);
    ctx.fillRect((hx + 4) * scale, (hy + 9) * scale, 8 * scale, 1.5 * scale);
  } else {
    ctx.fillRect((hx + 2) * scale, (hy + 6) * scale, 3 * scale, 1 * scale);
    ctx.fillRect((hx + 11) * scale, (hy + 6) * scale, 3 * scale, 1 * scale);
    ctx.fillRect((hx + 5) * scale, (hy + 10) * scale, 6 * scale, 1 * scale);
  }

  // arrest overlay
  if (encounter.arrested) {
    ctx.fillStyle = "rgba(192,57,43,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `600 ${Math.round(scale * 3.2)}px -apple-system, sans-serif`;
    ctx.fillStyle = DANGER;
    ctx.textAlign = "center";
    const blink = Math.floor((opts.t || 0) / 400) % 2 === 0;
    if (blink) ctx.fillText("NO PULSE", canvas.width / 2, canvas.height - 10);
    if (encounter.cprActive) {
      const bounce = Math.abs(Math.sin((opts.t || 0) / 150)) * 4;
      rect(ctx, scale, [22, 24 - bounce / scale, 8, 4], ACCENT, INK, 1);
    }
  }

  // highlight last clicked region
  if (opts.highlightRegion && REGIONS[opts.highlightRegion]) {
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2.5;
    const [x, y, w, h] = REGIONS[opts.highlightRegion].rect;
    ctx.strokeRect(x * scale - 1, y * scale - 1, w * scale + 2, h * scale + 2);
  }
}

export function hitTestPatient(canvas, clientEvent) {
  const bounds = canvas.getBoundingClientRect();
  const px = ((clientEvent.clientX - bounds.left) / bounds.width) * canvas.width;
  const py = ((clientEvent.clientY - bounds.top) / bounds.height) * canvas.height;
  const scale = canvas.width / LOGICAL_W;
  return regionAt(px / scale, py / scale);
}
