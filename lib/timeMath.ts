export function diffHours(start: string, finish: string, allowNextDay = false): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [fh, fm] = finish.split(':').map(Number);
  let diff = (fh * 60 + fm) - (sh * 60 + sm);
  if (diff < 0 && allowNextDay) diff += 24 * 60;
  return Math.max(0, diff / 60);
}

function toMin(t: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// Returns true when `time` falls outside the shift window defined by signOn → signOff.
// For a normal shift (signOn < signOff): outside = time < signOn || time > signOff.
// For a night shift (signOn > signOff, e.g. 22:00 → 06:00): outside = signOff < time < signOn.
export function isTimeOutsideShift(time: string, signOn: string, signOff: string, isNightShift: boolean): boolean {
  const t = toMin(time), on = toMin(signOn), off = toMin(signOff);
  if (t === null || on === null || off === null) return false;
  if (isNightShift) return t > off && t < on;
  return t < on || t > off;
}

// Returns a sortable minute-offset that respects night-shift wrap-around.
// For a night shift, times earlier in the clock than `signOn` are treated as the next
// calendar day (+24h), so 22:00 sorts before 01:00. Falls back to clock minutes when
// signOn is missing or it's a regular shift.
export function shiftMinutes(time: string, signOn: string, isNightShift: boolean): number {
  const t = toMin(time);
  if (t === null) return Number.MAX_SAFE_INTEGER;
  if (!isNightShift) return t;
  const on = toMin(signOn);
  if (on === null) return t;
  return t < on ? t + 24 * 60 : t;
}
