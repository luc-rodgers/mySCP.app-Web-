import type { Project, SubActivity, TimeEntry } from './types';

export function diffHours(start: string, finish: string, allowNextDay = false): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [fh, fm] = finish.split(':').map(Number);
  let diff = (fh * 60 + fm) - (sh * 60 + sm);
  if (diff < 0 && allowNextDay) diff += 24 * 60;
  return Math.max(0, diff / 60);
}

// Add `minutes` to an "HH:MM" time, returning "HH:MM" (clamped within a day).
export function addMinutesToTime(time: string, minutes: number): string {
  const t = toMin(time);
  if (t === null) return '';
  const total = Math.min(24 * 60, Math.max(0, t + minutes));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

// ── Paid-hours model ──────────────────────────────────────────────────────────
// Paid hours are activity-derived: the sum of the worked activity time, with any
// gap between activities (and any lunch) unpaid. This keeps the per-project total
// and the day total in agreement, and a break shown as a gap vs as a lunch node
// both deduct exactly once.

const LEGACY_LUNCH_HOURS = 0.5;

export function isLunchActivity(sa: Pick<SubActivity, 'type'>): boolean {
  return sa.type === 'lunch';
}

// Convert activities to [startMin, endMin] intervals (night-shift aware).
function toIntervals(items: { start: string; finish: string }[], allowNextDay: boolean): [number, number][] {
  const out: [number, number][] = [];
  for (const it of items) {
    const s = toMin(it.start);
    const f = toMin(it.finish);
    if (s === null || f === null) continue;
    let end = f;
    if (end < s) {
      if (allowNextDay) end += 24 * 60;
      else continue;
    }
    if (end > s) out.push([s, end]);
  }
  return out;
}

function mergeIntervals(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]);
    else merged.push([sorted[i][0], sorted[i][1]]);
  }
  return merged;
}

function unionMinutes(intervals: [number, number][]): number {
  return mergeIntervals(intervals).reduce((sum, [s, e]) => sum + (e - s), 0);
}

// Covered minutes of `base` that are NOT covered by `subtract`.
function subtractMinutes(base: [number, number][], subtract: [number, number][]): number {
  if (base.length === 0) return 0;
  if (subtract.length === 0) return unionMinutes(base);
  const sub = mergeIntervals(subtract);
  let total = 0;
  for (const [bS, bE] of mergeIntervals(base)) {
    let cursor = bS;
    for (const [sS, sE] of sub) {
      if (sE <= cursor || sS >= bE) continue;
      if (sS > cursor) total += Math.min(sS, bE) - cursor;
      cursor = Math.max(cursor, Math.min(sE, bE));
      if (cursor >= bE) break;
    }
    if (cursor < bE) total += bE - cursor;
  }
  return total;
}

// Paid hours for a single project/row.
export function projectPaidHours(project: Project, allowNextDay: boolean): number {
  if (project.type === 'leave') {
    return Math.max(0, parseFloat(project.leaveTotalHours || '0'));
  }
  if (project.type === 'yardwork') {
    const subs = project.subActivities || [];
    const work = subs.filter((sa) => sa.type === 'yardwork' && sa.start && sa.finish);
    const lunches = subs.filter((sa) => isLunchActivity(sa) && sa.start && sa.finish);
    if (work.length > 0) {
      // New model: yard-work activities, lunch carved out (same as the project branch).
      return Math.max(0, subtractMinutes(toIntervals(work, allowNextDay), toIntervals(lunches, allowNextDay)) / 60);
    }
    // Legacy single block (siteStart/siteFinish), with optional lunch node or boolean flag.
    const site = toIntervals([{ start: project.siteStart, finish: project.siteFinish }], allowNextDay);
    if (lunches.length > 0) {
      return Math.max(0, subtractMinutes(site, toIntervals(lunches, allowNextDay)) / 60);
    }
    const h = diffHours(project.siteStart, project.siteFinish, allowNextDay);
    return Math.max(0, h - (project.lunch ? LEGACY_LUNCH_HOURS : 0));
  }

  // Project type — activity based.
  const subs = project.subActivities || [];
  const work = subs.filter((sa) => !isLunchActivity(sa) && sa.start && sa.finish);
  const lunches = subs.filter((sa) => isLunchActivity(sa) && sa.start && sa.finish);

  if (lunches.length > 0) {
    // New model: explicit lunch nodes carve their time out of the worked time.
    return Math.max(0, subtractMinutes(toIntervals(work, allowNextDay), toIntervals(lunches, allowNextDay)) / 60);
  }

  const workSum = work.reduce((sum, sa) => sum + diffHours(sa.start, sa.finish, allowNextDay), 0);
  if (project.lunch) {
    // Legacy fallback (boolean flag, no lunch node): gap-aware so we never
    // double-deduct when the activities already contain a break.
    const ivs = toIntervals(work, allowNextDay);
    const span = ivs.length > 0
      ? (Math.max(...ivs.map((i) => i[1])) - Math.min(...ivs.map((i) => i[0]))) / 60
      : 0;
    const internalGap = Math.max(0, span - workSum);
    const deduct = Math.max(0, LEGACY_LUNCH_HOURS - internalGap);
    return Math.max(0, workSum - deduct);
  }
  return Math.max(0, workSum);
}

// Gross "on the clock" span (sign-on → sign-off). Starting point for the day total.
export function entryGrossHours(entry: TimeEntry): number {
  if (!entry.depotStart || !entry.depotFinish) return 0;
  return diffHours(entry.depotStart, entry.depotFinish, !!entry.isNightShift);
}

// Total lunch deduction for a project (lunch sub-activities, else legacy flat 0.5).
export function lunchDeductionHours(project: Project, allowNextDay = false): number {
  const lunches = (project.subActivities || []).filter((sa) => isLunchActivity(sa) && sa.start && sa.finish);
  if (lunches.length > 0) {
    return lunches.reduce((sum, sa) => sum + diffHours(sa.start, sa.finish, allowNextDay), 0);
  }
  return project.lunch ? LEGACY_LUNCH_HOURS : 0;
}

// Total lunch deducted across the whole entry.
export function entryLunchHours(entry: TimeEntry): number {
  const ns = !!entry.isNightShift;
  return (entry.projects || []).reduce((sum, p) => sum + lunchDeductionHours(p, ns), 0);
}

// Leave hours for the entry.
export function entryLeaveHours(entry: TimeEntry): number {
  return (entry.projects || [])
    .filter((p) => p.type === 'leave')
    .reduce((sum, p) => sum + Math.max(0, parseFloat(p.leaveTotalHours || '0')), 0);
}

// Billable activity hours — project + yard work, lunch carved out. Excludes leave.
export function entryBillableHours(entry: TimeEntry): number {
  const ns = !!entry.isNightShift;
  return (entry.projects || [])
    .filter((p) => p.type !== 'leave')
    .reduce((sum, p) => sum + projectPaidHours(p, ns), 0);
}

// Paid on-clock worked hours: sign-on→sign-off minus lunch. Idle/gaps ARE paid.
// (Excludes leave — see entryTotalHours for the headline total.)
export function entryWorkedHours(entry: TimeEntry): number {
  return Math.max(0, entryGrossHours(entry) - entryLunchHours(entry));
}

// Headline paid total for the day: worked on-clock (span − lunch) plus leave.
export function entryTotalHours(entry: TimeEntry): number {
  return entryWorkedHours(entry) + entryLeaveHours(entry);
}

// Paid on-clock time not allocated to a project / yard work (idle, depot overhead).
export function entryNonAllocatedHours(entry: TimeEntry): number {
  return Math.max(0, entryWorkedHours(entry) - entryBillableHours(entry));
}

// Single span for a yard-work row: envelope of its activities (earliest start →
// latest finish), or the legacy siteStart/siteFinish when there are no activities.
export function yardWorkSpan(project: Project): { start: string; finish: string } {
  const work = (project.subActivities || []).filter((sa) => sa.type === 'yardwork' && sa.start && sa.finish);
  if (work.length === 0) return { start: project.siteStart || '', finish: project.siteFinish || '' };
  const starts = work.map((w) => w.start).sort();
  const finishes = work.map((w) => w.finish).sort();
  return { start: starts[0], finish: finishes[finishes.length - 1] };
}
