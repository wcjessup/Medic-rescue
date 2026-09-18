export function formatClock(baseMinutesOfDay, elapsedMinutes) {
  const total = Math.round(baseMinutesOfDay + elapsedMinutes);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
