"use client";

import { useState, useTransition } from "react";
import { TimeEntry } from "@/lib/types";
import { TimeCardSummaryModal } from "./TimeCardSummaryModal";
import { approveTimeEntry } from "@/app/actions/approveTimeEntry";
import { ClipboardList, Clock, Users, Eye, Printer, Download, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  entries: (TimeEntry & { employeeId: string })[];
}

function calcHours(entry: TimeEntry): number {
  if (!entry.depotStart || !entry.depotFinish) return 0;
  const [sh, sm] = entry.depotStart.split(":").map(Number);
  const [fh, fm] = entry.depotFinish.split(":").map(Number);
  const total = (fh * 60 + fm - sh * 60 - sm) / 60;
  const hasLunch = (entry.projects ?? []).some((p) => p.lunch);
  return Math.max(0, total - (hasLunch ? 0.5 : 0));
}

function subHrs(start: string, finish: string): number {
  if (!start || !finish) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [fh, fm] = finish.split(":").map(Number);
  return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
}

interface Flags {
  weather: boolean;
  lunchPenalty: boolean;
  unallocatedHours: number;
}

function getFlags(entry: TimeEntry): Flags {
  const depotHrs = calcHours(entry);
  let hasWeather = false;
  let hasLunchPenalty = false;
  let allocated = 0;

  (entry.projects ?? []).forEach((p) => {
    if (p.weather) hasWeather = true;
    if (p.lunchPenalty) hasLunchPenalty = true;
    if (p.type === "yardwork") {
      allocated += subHrs(p.siteStart, p.siteFinish);
      if (p.lunch) allocated -= 0.5;
    } else if (p.type === "leave") {
      allocated += parseFloat(p.leaveTotalHours || "0");
    } else {
      (p.subActivities ?? []).forEach((sa) => {
        allocated += subHrs(sa.start, sa.finish);
      });
    }
  });

  return {
    weather: hasWeather,
    lunchPenalty: hasLunchPenalty,
    unallocatedHours: depotHrs > 0 ? Math.max(0, depotHrs - allocated) : 0,
  };
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-AU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function exportCSV(entry: TimeEntry) {
  const hours = calcHours(entry);
  const rows: string[][] = [
    ["Time Card Number", "Employee", "Date", "Depot Start", "Depot Finish", "Total Hours", "Project", "Activity", "Start", "Finish"],
  ];

  if ((entry.projects ?? []).length === 0) {
    rows.push([
      entry.timeCardNumber ?? "",
      entry.employeeName ?? "",
      formatDateShort(entry.date),
      entry.depotStart ?? "",
      entry.depotFinish ?? "",
      hours.toFixed(2),
      "", "", "", "",
    ]);
  } else {
    entry.projects.forEach((proj, pi) => {
      if (proj.type === "leave") {
        rows.push([
          pi === 0 ? (entry.timeCardNumber ?? "") : "",
          pi === 0 ? (entry.employeeName ?? "") : "",
          pi === 0 ? formatDateShort(entry.date) : "",
          pi === 0 ? (entry.depotStart ?? "") : "",
          pi === 0 ? (entry.depotFinish ?? "") : "",
          pi === 0 ? hours.toFixed(2) : "",
          `Leave - ${proj.leaveType ?? ""}`,
          "",
          proj.leaveStart ?? "",
          proj.leaveFinish ?? "",
        ]);
      } else if (proj.type === "yardwork") {
        rows.push([
          pi === 0 ? (entry.timeCardNumber ?? "") : "",
          pi === 0 ? (entry.employeeName ?? "") : "",
          pi === 0 ? formatDateShort(entry.date) : "",
          pi === 0 ? (entry.depotStart ?? "") : "",
          pi === 0 ? (entry.depotFinish ?? "") : "",
          pi === 0 ? hours.toFixed(2) : "",
          "Yard Work",
          "",
          proj.siteStart ?? "",
          proj.siteFinish ?? "",
        ]);
      } else {
        (proj.subActivities ?? []).forEach((sa, si) => {
          rows.push([
            pi === 0 && si === 0 ? (entry.timeCardNumber ?? "") : "",
            pi === 0 && si === 0 ? (entry.employeeName ?? "") : "",
            pi === 0 && si === 0 ? formatDateShort(entry.date) : "",
            pi === 0 && si === 0 ? (entry.depotStart ?? "") : "",
            pi === 0 && si === 0 ? (entry.depotFinish ?? "") : "",
            pi === 0 && si === 0 ? hours.toFixed(2) : "",
            proj.project ?? "",
            sa.type ?? "",
            sa.start ?? "",
            sa.finish ?? "",
          ]);
        });
        if ((proj.subActivities ?? []).length === 0) {
          rows.push([
            pi === 0 ? (entry.timeCardNumber ?? "") : "",
            pi === 0 ? (entry.employeeName ?? "") : "",
            pi === 0 ? formatDateShort(entry.date) : "",
            pi === 0 ? (entry.depotStart ?? "") : "",
            pi === 0 ? (entry.depotFinish ?? "") : "",
            pi === 0 ? hours.toFixed(2) : "",
            proj.project ?? "",
            "", "", "",
          ]);
        }
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
    if (proj.type === "leave") {
      return `<tr><td>${proj.leaveType ?? "Leave"}</td><td>Leave</td><td>${proj.leaveStart ?? ""}–${proj.leaveFinish ?? ""}</td><td>${proj.leaveTotalHours ?? ""} hrs</td></tr>`;
    }
    if (proj.type === "yardwork") {
      return `<tr><td>Yard Work</td><td>${proj.type}</td><td>${proj.siteStart ?? ""}–${proj.siteFinish ?? ""}</td><td>—</td></tr>`;
    }
    return (proj.subActivities ?? []).map((sa) =>
      `<tr><td>${proj.project ?? ""}</td><td>${sa.type ?? ""}</td><td>${sa.start ?? ""}–${sa.finish ?? ""}</td><td>—</td></tr>`
    ).join("") || `<tr><td>${proj.project ?? ""}</td><td>—</td><td>—</td><td>—</td></tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Time Card – ${entry.timeCardNumber ?? entry.date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .meta { color: #555; font-size: 11px; margin-bottom: 20px; }
    .section { margin-bottom: 16px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
    .box-value { font-size: 16px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f9fafb; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .sig-line { border-bottom: 1px solid #111; margin-top: 24px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>MySCP – Time Card</h1>
  <div class="meta">${entry.timeCardNumber ?? "No reference"} &nbsp;·&nbsp; ${formatDate(entry.date)}</div>

  <div class="grid">
    <div class="box"><div class="label">Employee</div><div class="box-value">${entry.employeeName ?? "—"}</div></div>
    <div class="box"><div class="label">Depot Sign On</div><div class="box-value">${entry.depotStart ?? "—"}</div></div>
    <div class="box"><div class="label">Depot Sign Off</div><div class="box-value">${entry.depotFinish ?? "—"}</div></div>
  </div>

  <div class="grid">
    <div class="box"><div class="label">Total Hours</div><div class="box-value">${hours.toFixed(2)}</div></div>
    <div class="box"><div class="label">Status</div><div class="box-value">Pending Approval</div></div>
  </div>

  <div class="section">
    <div class="label">Work Detail</div>
    <table>
      <thead><tr><th>Project / Activity</th><th>Type</th><th>Time</th><th>Notes</th></tr></thead>
      <tbody>${projectRows || '<tr><td colspan="4" style="color:#aaa">No work detail recorded</td></tr>'}</tbody>
    </table>
  </div>

  ${entry.remarks ? `<div class="section"><div class="label">Remarks</div><p>${entry.remarks}</p></div>` : ""}

  <div class="footer">
    <div><div class="label">Employee Signature</div><div class="sig-line"></div></div>
    <div><div class="label">Approved By</div><div class="sig-line"></div></div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function PendingTimesheets({ entries: initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [selected, setSelected] = useState<(TimeEntry & { employeeId: string }) | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = entries.reduce<Record<string, (TimeEntry & { employeeId: string })[]>>(
    (acc, entry) => { (acc[entry.date] ??= []).push(entry); return acc; },
    {}
  );
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function handleApprove(entry: TimeEntry & { employeeId: string }) {
    setApprovingId(entry.id);
    startTransition(async () => {
      const result = await approveTimeEntry(entry.id);
      setApprovingId(null);
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      }
    });
  }

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">No pending timesheets</p>
        <p className="text-xs text-gray-300 mt-1">Submitted time cards will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Pending Timesheets</h1>
        <span className="text-sm text-gray-400">{entries.length} card{entries.length !== 1 ? "s" : ""} awaiting approval</span>
      </div>

      {sortedDates.map((date) => {
        const dayEntries = grouped[date];
        const totalHours = dayEntries.reduce((sum, e) => sum + calcHours(e), 0);

        return (
          <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">{formatDate(date)}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {dayEntries.length} {dayEntries.length === 1 ? "card" : "cards"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {totalHours.toFixed(1)} hrs total
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="divide-y divide-gray-100">
              {dayEntries.map((entry) => {
                const hours = calcHours(entry);
                const flags = getFlags(entry);
                const isApproving = approvingId === entry.id;
                const hasOrangeFlag = flags.weather || flags.lunchPenalty;
                const hasRedFlag = flags.unallocatedHours > 0.05;

                return (
                  <div key={entry.id} className="flex items-center justify-between px-5 py-3.5">
                    {/* Employee info */}
                    <div className="min-w-0">
                      {/* Name · TS# · Hours */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">{entry.employeeName}</span>
                        {entry.timeCardNumber && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-sm text-gray-400 font-mono">{entry.timeCardNumber}</span>
                          </>
                        )}
                        <span className="text-gray-300">·</span>
                        <span className="text-sm text-gray-500">{hours.toFixed(1)} hrs</span>
                      </div>

                      {/* Warning tags */}
                      {(hasOrangeFlag || hasRedFlag) && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {flags.weather && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                              <AlertTriangle className="w-3 h-3" />
                              Inclement Weather
                            </span>
                          )}
                          {flags.lunchPenalty && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                              <AlertTriangle className="w-3 h-3" />
                              Lunch Penalty
                            </span>
                          )}
                          {hasRedFlag && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                              <AlertTriangle className="w-3 h-3" />
                              {flags.unallocatedHours.toFixed(1)}h Unallocated
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 ml-4 shrink-0">
                      {/* View */}
                      <button
                        onClick={() => setSelected(entry)}
                        title="View timecard"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Print */}
                      <button
                        onClick={() => printTimecard(entry)}
                        title="Print / Save as PDF"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* CSV */}
                      <button
                        onClick={() => exportCSV(entry)}
                        title="Export CSV"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Approve */}
                      <button
                        onClick={() => handleApprove(entry)}
                        disabled={isApproving}
                        title="Approve"
                        className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isApproving
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />
                        }
                        {isApproving ? "Approving…" : "Approve"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {selected && (
        <TimeCardSummaryModal
          entry={selected}
          isOpen={true}
          onClose={() => setSelected(null)}
          viewOnly={true}
        />
      )}
    </div>
  );
}
