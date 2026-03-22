"use client";
import { useState } from "react";
import { TimeEntry } from "@/lib/types";

interface WorkHeatmapProps {
  entries?: TimeEntry[];
  calculateHours?: (entry: TimeEntry) => number;
  hoursData?: Record<string, number>;
  weeksCount?: number;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCellColor(hours: number): string {
  if (hours <= 0)  return "bg-gray-100";
  if (hours < 4)   return "bg-blue-200";
  if (hours < 7)   return "bg-blue-400";
  if (hours < 9)   return "bg-blue-600";
  return "bg-blue-900";
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function WorkHeatmap({ entries, calculateHours, hoursData, weeksCount = 52 }: WorkHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    hours: number;
    x: number;
    y: number;
  } | null>(null);

  // Build date → hours map: use pre-built hoursData if provided, otherwise compute from entries
  const hoursMap: Record<string, number> = hoursData ?? (() => {
    const map: Record<string, number> = {};
    (entries ?? []).forEach((entry) => {
      if (entry.status === "submitted" || entry.status === "approved") {
        map[entry.date] = (calculateHours ? calculateHours(entry) : 0);
      }
    });
    return map;
  })();

  // Build a 52-week grid ending on the most recent Saturday
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  // Advance to Saturday (day 6)
  endDate.setDate(today.getDate() + (6 - today.getDay()));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - weeksCount * 7 + 1);
  // Snap back to the nearest preceding Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Build week columns: each is an array of 7 day cells
  type Cell = { dateStr: string; hours: number; future: boolean };
  const weeks: Cell[][] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(cursor);
      const future = cursor > today;
      week.push({
        dateStr,
        hours: future ? 0 : (hoursMap[dateStr] ?? 0),
        future,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Month label — show at first week of each new month
  const monthLabels: Array<{ weekIndex: number; label: string }> = [];
  weeks.forEach((week, i) => {
    const d = parseLocalDate(week[0].dateStr);
    const prev = i > 0 ? parseLocalDate(weeks[i - 1][0].dateStr) : null;
    if (!prev || d.getMonth() !== prev.getMonth()) {
      monthLabels.push({
        weekIndex: i,
        label: d.toLocaleDateString("en-AU", { month: "short" }),
      });
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-hidden">
      <div className="overflow-x-auto w-full">
        <div className="inline-flex flex-col gap-[3px] min-w-max">

          {/* Month labels row */}
          <div className="flex gap-[3px] ml-7 mb-0.5">
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.weekIndex === i);
              return (
                <div key={i} className="w-3 text-[9px] text-gray-400 leading-none">
                  {label?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Day rows */}
          {DAY_LABELS.map((dayLabel, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-[3px]">
              {/* Day label — only show M, W, F */}
              <span className="w-6 text-[9px] text-gray-400 text-right pr-1 leading-none select-none">
                {dayIndex === 1 || dayIndex === 3 || dayIndex === 5 ? dayLabel : ""}
              </span>

              {weeks.map((week, wi) => {
                const cell = week[dayIndex];
                return (
                  <div
                    key={wi}
                    className={`w-3 h-3 rounded-[2px] cursor-default transition-colors
                      ${cell.future ? "bg-gray-50" : getCellColor(cell.hours)}`}
                    onMouseEnter={(e) => {
                      if (cell.future) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        date: cell.dateStr,
                        hours: cell.hours,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-gray-400 mr-0.5">Less</span>
        {[0, 2, 5, 8, 11].map((h) => (
          <div key={h} className={`w-3 h-3 rounded-[2px] ${getCellColor(h)}`} />
        ))}
        <span className="text-[10px] text-gray-400 ml-0.5">More</span>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg -translate-x-1/2 -translate-y-full whitespace-nowrap">
            {tooltip.hours > 0
              ? `${tooltip.hours.toFixed(1)}h — ${parseLocalDate(tooltip.date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}`
              : `No work — ${parseLocalDate(tooltip.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`}
          </div>
        </div>
      )}
    </div>
  );
}
