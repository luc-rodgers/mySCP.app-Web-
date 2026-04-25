"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { TimeEntry } from "@/lib/types";
import { TimeEntryEditorModal } from "./TimeEntryEditorModal";
import { approveTimeEntry } from "@/app/actions/approveTimeEntry";
import {
  ClipboardList, Clock, Users, Printer, Download,
  CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp,
  Pencil, ChevronLeft, ChevronRight, CalendarDays, MoreHorizontal,
} from "lucide-react";

interface ProjectOption { id: string; name: string; }

interface Props {
  entries: (TimeEntry & { employeeId: string })[];
  activeProjects: ProjectOption[];
  projectsByState: { QLD: ProjectOption[]; NSW: ProjectOption[] };
  weekStart: string;
  today: string;
}

// ── Date helpers ────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateStr(new Date(y, m - 1, d + days));
}

function getMondayStr(refStr: string): string {
  const [y, m, d] = refStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateStr(date);
}

function formatWeekRange(mondayStr: string): string {
  const [y, m, d] = mondayStr.split("-").map(Number);
  const mon = new Date(y, m - 1, d);
  const sun = new Date(y, m - 1, d + 6);
  const monFmt = mon.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const sunFmt = sun.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  return `${monFmt} – ${sunFmt}`;
}

function formatDayHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long",
  });
}

// ── Hour / flag helpers ──────────────────────────────────────────────────────

function subHrs(start: string, finish: string): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [fh, fm] = finish.split(":").map(Number);
  return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
}

function calcHours(entry: TimeEntry): number {
  if (!entry.depotStart || !entry.depotFinish) return 0;
  const total = subHrs(entry.depotStart, entry.depotFinish);
  const hasLunch = (entry.projects ?? []).some((p) => p.lunch);
  return Math.max(0, total - (hasLunch ? 0.5 : 0));
}

interface Flags { weather: boolean; lunchPenalty: boolean; unallocatedHours: number; }

function getFlags(entry: TimeEntry): Flags {
  const depotHrs = calcHours(entry);
  let hasWeather = false, hasLunchPenalty = false, allocated = 0;
  (entry.projects ?? []).forEach((p) => {
    if (p.weather) hasWeather = true;
    if (p.lunchPenalty) hasLunchPenalty = true;
    if (p.type === "yardwork") { allocated += subHrs(p.siteStart, p.siteFinish); if (p.lunch) allocated -= 0.5; }
    else if (p.type === "leave") { allocated += parseFloat(p.leaveTotalHours || "0"); }
    else { (p.subActivities ?? []).forEach((sa) => { allocated += subHrs(sa.start, sa.finish); }); }
  });
  return { weather: hasWeather, lunchPenalty: hasLunchPenalty, unallocatedHours: depotHrs > 0 ? Math.max(0, depotHrs - allocated) : 0 };
}

// ── Format helpers ───────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Export / print ───────────────────────────────────────────────────────────

function exportCSV(entry: TimeEntry) {
  const hours = calcHours(entry);
  const rows: string[][] = [
    ["Time Card Number", "Employee", "Date", "Depot Start", "Depot Finish", "Total Hours", "Project", "Activity", "Start", "Finish"],
  ];
  if ((entry.projects ?? []).length === 0) {
    rows.push([entry.timeCardNumber ?? "", entry.employeeName ?? "", formatDateShort(entry.date), entry.depotStart ?? "", entry.depotFinish ?? "", hours.toFixed(2), "", "", "", ""]);
  } else {
    entry.projects.forEach((proj, pi) => {
      const base = (si = 0) => [
        pi === 0 && si === 0 ? (entry.timeCardNumber ?? "") : "",
        pi === 0 && si === 0 ? (entry.employeeName ?? "") : "",
        pi === 0 && si === 0 ? formatDateShort(entry.date) : "",
        pi === 0 && si === 0 ? (entry.depotStart ?? "") : "",
        pi === 0 && si === 0 ? (entry.depotFinish ?? "") : "",
        pi === 0 && si === 0 ? hours.toFixed(2) : "",
      ];
      if (proj.type === "leave") {
        rows.push([...base(), `Leave - ${proj.leaveType ?? ""}`, "", proj.leaveStart ?? "", proj.leaveFinish ?? ""]);
      } else if (proj.type === "yardwork") {
        rows.push([...base(), "Yard Work", "", proj.siteStart ?? "", proj.siteFinish ?? ""]);
      } else {
        (proj.subActivities ?? []).forEach((sa, si) => {
          rows.push([...base(si), proj.project ?? "", sa.type ?? "", sa.start ?? "", sa.finish ?? ""]);
        });
        if ((proj.subActivities ?? []).length === 0) rows.push([...base(), proj.project ?? "", "", "", ""]);
      }
    });
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `timecard-${entry.timeCardNumber ?? entry.date}-${(entry.employeeName ?? "").replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printTimecard(entry: TimeEntry) {
  const hours = calcHours(entry);
  const projectRows = (entry.projects ?? []).map((proj) => {
    if (proj.type === "leave") return `<tr><td>${proj.leaveType ?? "Leave"}</td><td>Leave</td><td>${proj.leaveStart ?? ""}–${proj.leaveFinish ?? ""}</td><td>${proj.leaveTotalHours ?? ""} hrs</td></tr>`;
    if (proj.type === "yardwork") return `<tr><td>Yard Work</td><td>Yard Work</td><td>${proj.siteStart ?? ""}–${proj.siteFinish ?? ""}</td><td>—</td></tr>`;
    return (proj.subActivities ?? []).map((sa) => `<tr><td>${proj.project ?? ""}</td><td>${sa.type ?? ""}</td><td>${sa.start ?? ""}–${sa.finish ?? ""}</td><td>—</td></tr>`).join("") || `<tr><td>${proj.project ?? ""}</td><td>—</td><td>—</td><td>—</td></tr>`;
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Time Card – ${entry.timeCardNumber ?? entry.date}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:32px}h1{font-size:18px;font-weight:bold;margin-bottom:4px}.meta{color:#555;font-size:11px;margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.box{border:1px solid #e5e7eb;border-radius:6px;padding:10px}.label{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:4px}.box-value{font-size:16px;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f9fafb;text-align:left;font-size:10px;text-transform:uppercase;color:#888;padding:6px 10px;border-bottom:1px solid #e5e7eb}td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:12px}.footer{margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:24px}.sig-line{border-bottom:1px solid #111;margin-top:24px}</style></head><body><h1>MySCP – Time Card</h1><div class="meta">${entry.timeCardNumber ?? "No reference"} · ${formatDate(entry.date)}</div><div class="grid"><div class="box"><div class="label">Employee</div><div class="box-value">${entry.employeeName ?? "—"}</div></div><div class="box"><div class="label">Depot Sign On</div><div class="box-value">${entry.depotStart ?? "—"}</div></div><div class="box"><div class="label">Depot Sign Off</div><div class="box-value">${entry.depotFinish ?? "—"}</div></div></div><div class="grid"><div class="box"><div class="label">Total Hours</div><div class="box-value">${hours.toFixed(2)}</div></div><div class="box"><div class="label">Status</div><div class="box-value">Pending Approval</div></div></div><div><div class="label">Work Detail</div><table><thead><tr><th>Project / Activity</th><th>Type</th><th>Time</th><th>Notes</th></tr></thead><tbody>${projectRows || '<tr><td colspan="4" style="color:#aaa">No work detail recorded</td></tr>'}</tbody></table></div>${entry.remarks ? `<div style="margin-top:16px"><div class="label">Remarks</div><p>${entry.remarks}</p></div>` : ""}<div class="footer"><div><div class="label">Employee Signature</div><div class="sig-line"></div></div><div><div class="label">Approved By</div><div class="sig-line"></div></div></div></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

// ── TimecardDetail ───────────────────────────────────────────────────────────

function TimecardDetail({ entry }: { entry: TimeEntry }) {
  const hours = calcHours(entry);
  const { unallocatedHours } = getFlags(entry);
  return (
    <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Depot Sign On</p>
          <p className="text-base font-semibold text-gray-900">{entry.depotStart || "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Depot Sign Off</p>
          <p className="text-base font-semibold text-gray-900">{entry.depotFinish || "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Hours</p>
          <p className="text-base font-semibold text-gray-900">{hours.toFixed(2)}</p>
        </div>
      </div>

      {((entry.projects ?? []).length > 0 || unallocatedHours > 0.05) && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Work Detail</p>
          </div>
          <div className="divide-y divide-gray-100">
            {(entry.projects ?? []).map((proj, i) => {
              if (proj.type === "leave") {
                const leaveHrs = parseFloat(proj.leaveTotalHours || "0");
                return (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Leave — {proj.leaveType ?? ""}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{proj.leaveStart} – {proj.leaveFinish}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{leaveHrs.toFixed(2)} hrs</span>
                  </div>
                );
              }
              if (proj.type === "yardwork") {
                const yardHrs = subHrs(proj.siteStart, proj.siteFinish) - (proj.lunch ? 0.5 : 0);
                return (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Yard Work</p>
                      <p className="text-xs text-gray-400 mt-0.5">{proj.siteStart} – {proj.siteFinish}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {proj.lunch && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Lunch</span>}
                      {proj.lunchPenalty && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Lunch Penalty</span>}
                      <span className="text-sm font-semibold text-gray-700">{Math.max(0, yardHrs).toFixed(2)} hrs</span>
                    </div>
                  </div>
                );
              }
              const projHrs = (proj.subActivities ?? []).reduce((sum, sa) => sum + subHrs(sa.start, sa.finish), 0);
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{proj.project || "Unnamed Project"}</p>
                    <span className="text-sm font-semibold text-gray-700">{projHrs.toFixed(2)} hrs</span>
                  </div>
                  {(proj.subActivities ?? []).length > 0 ? (
                    <div className="space-y-1">
                      {proj.subActivities.map((sa, j) => {
                        const saHrs = subHrs(sa.start, sa.finish);
                        return (
                          <div key={j} className="flex items-center justify-between text-xs text-gray-500 pl-3 border-l-2 border-gray-200">
                            <span className="capitalize">{sa.type}{sa.activityType ? ` — ${sa.activityType}` : ""}</span>
                            <span className="flex items-center gap-3">
                              <span className="text-gray-400">{sa.start} – {sa.finish}</span>
                              <span className="font-medium text-gray-600 w-14 text-right">{saHrs.toFixed(2)} hrs</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pl-3">No sub-activities</p>
                  )}
                  {(proj.weather || proj.lunch || proj.lunchPenalty) && (
                    <div className="flex gap-2 mt-2">
                      {proj.weather && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Weather: {proj.weatherType ?? "Yes"}</span>}
                      {proj.lunch && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Lunch</span>}
                      {proj.lunchPenalty && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Lunch Penalty</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {unallocatedHours > 0.05 && (
              <div className="px-4 py-3 flex items-center justify-between bg-red-50">
                <p className="text-sm font-medium text-red-600">Unallocated Time</p>
                <span className="text-sm font-semibold text-red-600">{unallocatedHours.toFixed(2)} hrs</span>
              </div>
            )}
          </div>
        </div>
      )}

      {entry.remarks && (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remarks</p>
          <p className="text-sm text-gray-700">{entry.remarks}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function PendingTimesheets({ entries: initialEntries, activeProjects, projectsByState, weekStart, today }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const weekEnd = addDaysStr(weekStart, 6);
    return today >= weekStart && today <= weekEnd ? new Set([today]) : new Set();
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<(TimeEntry & { employeeId: string }) | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [, startTransition] = useTransition();

  // Sync entries when server props change (week navigation)
  useEffect(() => {
    setEntries(initialEntries);
    setExpandedId(null);
    const weekEnd = addDaysStr(weekStart, 6);
    setExpandedDays(today >= weekStart && today <= weekEnd ? new Set([today]) : new Set());
  }, [weekStart, initialEntries, today]);

  const currentWeekMonday = getMondayStr(today);
  const isCurrentWeek = weekStart === currentWeekMonday;
  const prevWeek = addDaysStr(weekStart, -7);
  const nextWeek = addDaysStr(weekStart, 7);

  // Group entries by date
  const grouped = entries.reduce<Record<string, (TimeEntry & { employeeId: string })[]>>(
    (acc, entry) => { (acc[entry.date] ??= []).push(entry); return acc; },
    {}
  );

  // Build all 7 days of the week in order
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

  // Only show days that have entries
  const activeDays = weekDays.filter((d) => grouped[d]?.length > 0);

  const totalEntries = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + calcHours(e), 0);

  function toggleDay(date: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
        setExpandedId(null);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  function handleApprove(entry: TimeEntry & { employeeId: string }) {
    setApprovingId(entry.id);
    startTransition(async () => {
      const result = await approveTimeEntry(entry.id);
      setApprovingId(null);
      if (result.success) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "approved" } : e));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between pl-10 md:pl-0">
        <h1 className="text-xl font-bold text-gray-900">Timesheets</h1>
        {totalEntries > 0 && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{totalEntries} cards</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{totalHours.toFixed(1)} hrs</span>
          </div>
        )}
      </div>

      {/* Week navigator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-2">
        <button
          onClick={() => router.push(`/timesheets?week=${prevWeek}`)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          title="Previous week"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          {formatWeekRange(weekStart)}
          {isCurrentWeek && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-white font-semibold">This week</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button
              onClick={() => router.push("/timesheets")}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
          <button
            onClick={() => router.push(`/timesheets?week=${nextWeek}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty week state */}
      {activeDays.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400">No timesheets this week</p>
          <p className="text-xs text-gray-300 mt-1">Submitted time cards will appear here</p>
        </div>
      )}

      {/* Day groups */}
      {activeDays.map((date) => {
        const dayEntries = grouped[date] ?? [];
        const dayHours = dayEntries.reduce((sum, e) => sum + calcHours(e), 0);
        const isExpanded = expandedDays.has(date);
        const isToday = date === today;
        const pendingCount = dayEntries.filter((e) => e.status !== "approved").length;

        return (
          <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Day header — click to toggle */}
            <button
              type="button"
              onClick={() => toggleDay(date)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isToday && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-white font-semibold shrink-0">Today</span>
                )}
                <span className="text-sm font-semibold text-gray-900 text-left">{formatDayHeader(date)}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {dayEntries.length} {dayEntries.length === 1 ? "card" : "cards"}
                    {pendingCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{pendingCount}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{dayHours.toFixed(1)} hrs</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {/* Day entries */}
            {isExpanded && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {dayEntries.map((entry) => {
                  const hours = calcHours(entry);
                  const flags = getFlags(entry);
                  const isEntryExpanded = expandedId === entry.id;
                  const isApproving = approvingId === entry.id;
                  const isApproved = entry.status === "approved";
                  const hasOrangeFlag = flags.weather || flags.lunchPenalty;
                  const hasRedFlag = flags.unallocatedHours > 0.05;

                  return (
                    <div key={entry.id}>
                      <div
                        className={`flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors ${isEntryExpanded ? "bg-gray-50" : ""}`}
                        onClick={() => setExpandedId(isEntryExpanded ? null : entry.id)}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{entry.employeeName}</span>
                            {entry.timeCardNumber && (
                              <><span className="text-gray-300">·</span>
                              <span className="text-sm text-gray-400 font-mono">{entry.timeCardNumber}</span></>
                            )}
                            <span className="text-gray-300">·</span>
                            <span className="text-sm text-gray-500">{hours.toFixed(1)} hrs</span>
                            {isApproved && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle className="w-3 h-3" />Approved
                              </span>
                            )}
                          </div>
                          {(hasOrangeFlag || hasRedFlag) && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {flags.weather && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                                  <AlertTriangle className="w-3 h-3" />Inclement Weather
                                </span>
                              )}
                              {flags.lunchPenalty && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                                  <AlertTriangle className="w-3 h-3" />Lunch Penalty
                                </span>
                              )}
                              {hasRedFlag && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                                  <AlertTriangle className="w-3 h-3" />{flags.unallocatedHours.toFixed(1)}h Unallocated
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          {/* Approve / Approved — always visible on the row */}
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle className="w-3 h-3" />Approved
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApprove(entry); }}
                              disabled={isApproving}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              {isApproving ? "…" : "Approve"}
                            </button>
                          )}

                          {/* Three-dot menu */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuId === entry.id) {
                                setOpenMenuId(null);
                                setMenuPos(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(entry.id);
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                            {isEntryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {isEntryExpanded && (
                        <>
                          <TimecardDetail entry={entry} />
                          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                              onClick={() => setEditingEntry(entry)}
                              disabled={isApproving}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Three-dot dropdown — rendered in a portal to escape overflow:hidden */}
      {openMenuId && menuPos && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setOpenMenuId(null); setMenuPos(null); }}
          />
          <div
            className="fixed z-50 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {(() => {
              const entry = entries.find((e) => e.id === openMenuId);
              if (!entry) return null;
              return (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); printTimecard(entry); setOpenMenuId(null); setMenuPos(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-gray-400" />
                    Print / Save PDF
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); exportCSV(entry); setOpenMenuId(null); setMenuPos(null); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                    Export CSV
                  </button>
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {editingEntry && (
        <TimeEntryEditorModal
          initialEntry={editingEntry}
          employeeDbId={editingEntry.employeeId}
          activeProjects={activeProjects}
          projectsByState={projectsByState}
          onClose={() => setEditingEntry(null)}
          onDeleted={() => {
            setEntries((prev) => prev.filter((e) => e.id !== editingEntry.id));
            setEditingEntry(null);
            setExpandedId(null);
          }}
        />
      )}
    </div>
  );
}
