"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TimeEntry, Employee, Project, SubActivity } from "@/lib/types";
import { TimeSheetHeader } from "@/components/TimeSheetHeader";
import { TimeEntryList } from "@/components/TimeEntryList";
import { WeeklySummary } from "@/components/WeeklySummary";
import { createClient } from "@/lib/supabase/client";

type SupabaseEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  role: string;
  email?: string;
  phone?: string;
} | null;

type Props = {
  supabaseEmployee: SupabaseEmployee;
  userEmail: string;
  activeProjects: string[];
  projectsByState?: { QLD: string[]; NSW: string[] };
};

export default function TimesheetClient({ supabaseEmployee, userEmail, activeProjects, projectsByState }: Props) {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") ?? undefined;

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentPage, setCurrentPage] = useState<"timesheet" | "weeklysummary">("timesheet");
  const [loaded, setLoaded] = useState(false);

  const employeeDbId = supabaseEmployee?.id ?? null;

  const mockEmployee: Employee = {
    id: employeeDbId ?? "local",
    name: supabaseEmployee
      ? `${supabaseEmployee.first_name} ${supabaseEmployee.last_name}`
      : userEmail.split("@")[0],
    email: supabaseEmployee?.email ?? userEmail,
    department: "Operations",
    classification: supabaseEmployee?.title ?? supabaseEmployee?.role ?? "Employee",
    phone: supabaseEmployee?.phone ?? "",
    startDate: "",
    workStatus: "Permanent",
  };

  // ── Load entries from Supabase on mount ──────────────────────
  useEffect(() => {
    if (!employeeDbId) { setLoaded(true); return; }

    const supabase = createClient();
    supabase
      .from("time_entries")
      .select("id, date, status, data")
      .eq("employee_id", employeeDbId)
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: TimeEntry[] = data.map((row) => ({
            ...(row.data as Partial<TimeEntry>),
            id: row.id,
            date: row.date,
            status: row.status as TimeEntry["status"],
            employeeName: mockEmployee.name,
          }));
          // Deduplicate by date — keep first occurrence (rows ordered by date desc,
          // so first = most recently updated for any duplicate dates)
          const seen = new Set<string>();
          const deduped = mapped.filter((e) => {
            if (seen.has(e.date)) return false;
            seen.add(e.date);
            return true;
          });
          setEntries(deduped);
        }
        setLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeDbId]);

  // ── Supabase helpers ─────────────────────────────────────────
  const upsertEntry = useCallback(async (entry: TimeEntry) => {
    if (!employeeDbId) return null;
    if (entry.id.startsWith("placeholder-")) return null;

    const supabase = createClient();
    const isNew = entry.id.startsWith("entry");

    if (isNew) {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          employee_id: employeeDbId,
          date: entry.date,
          status: entry.status,
          data: entry,
        })
        .select("id")
        .single();
      if (!error && data) return { id: data.id as string, referenceNumber: null };
    } else {
      const { data } = await supabase
        .from("time_entries")
        .upsert({
          id: entry.id,
          employee_id: employeeDbId,
          date: entry.date,
          status: entry.status,
          data: entry,
        })
        .select("id, reference_number")
        .single();
      if (data) return { id: data.id as string, referenceNumber: (data as any).reference_number as string | null };
    }
    return null;
  }, [employeeDbId]);

  const deleteEntryFromDB = useCallback(async (id: string) => {
    if (!employeeDbId || id.startsWith("entry") || id.startsWith("placeholder-")) return;
    const supabase = createClient();
    await supabase.from("time_entries").delete().eq("id", id);
  }, [employeeDbId]);

  // ── Calculations ─────────────────────────────────────────────
  const roundToQuarterHour = (hours: number) => Math.floor(hours * 4) / 4;

  const calculateTotalHours = (entry: TimeEntry) => {
    let effectiveStart = entry.depotStart;
    if (!effectiveStart) {
      const allStartTimes: string[] = [];
      entry.projects.forEach((p) => {
        if (p.siteStart) allStartTimes.push(p.siteStart);
        if (p.weather && p.weatherStart) allStartTimes.push(p.weatherStart);
      });
      if (allStartTimes.length > 0) effectiveStart = allStartTimes.sort()[0];
    }
    let effectiveFinish = entry.depotFinish;
    if (!effectiveFinish) {
      const allFinishTimes: string[] = [];
      entry.projects.forEach((p) => {
        if (p.siteFinish) allFinishTimes.push(p.siteFinish);
        if (p.weather && p.weatherEnd) allFinishTimes.push(p.weatherEnd);
      });
      if (allFinishTimes.length > 0)
        effectiveFinish = allFinishTimes.sort().reverse()[0];
    }
    if (!effectiveStart || !effectiveFinish) return 0;
    const [sh, sm] = effectiveStart.split(":").map(Number);
    const [fh, fm] = effectiveFinish.split(":").map(Number);
    const hours = (fh * 60 + fm - sh * 60 - sm) / 60;
    const hasLunch = entry.projects.some((p) => p.lunch);
    return roundToQuarterHour(Math.max(0, hours - (hasLunch ? 0.5 : 0)));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD as local date (avoids UTC timezone shift)
  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const todayHours = entries
    .filter((e) => parseLocalDate(e.date).getTime() === today.getTime())
    .reduce((sum, e) => sum + calculateTotalHours(e), 0);

  const weekHours = entries
    .filter((e) => {
      const d = parseLocalDate(e.date);
      const cur = today.getDay();
      const toMon = cur === 0 ? 6 : cur - 1;
      const ws = new Date(today);
      ws.setDate(today.getDate() - toMon);
      return d >= ws;
    })
    .reduce((sum, e) => sum + calculateTotalHours(e), 0);

  // ── Handlers ─────────────────────────────────────────────────
  const handleAddEntry = (entry: Omit<TimeEntry, "id">) => {
    const newEntry = { ...entry, id: Date.now().toString(), employeeName: mockEmployee.name };
    setEntries([newEntry, ...entries]);
    upsertEntry(newEntry).then((result) => {
      if (result?.id) setEntries((prev) => prev.map((e) => e.id === newEntry.id ? { ...e, id: result.id } : e));
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
    deleteEntryFromDB(id);
  };

  const handleStatusChange = async (id: string, status: TimeEntry["status"]) => {
    // Optimistic update — set status immediately
    let entrySnapshot: TimeEntry | undefined;
    setEntries((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      entrySnapshot = { ...e, status };
      return entrySnapshot;
    }));

    if (!entrySnapshot) return;

    // Persist to DB; trigger will assign reference_number when status = 'submitted'
    const result = await upsertEntry(entrySnapshot);

    // Read back the DB-assigned reference number and store it on the entry
    if (status === "submitted" && result?.referenceNumber) {
      setEntries((prev) => prev.map((e) =>
        e.id === id ? { ...e, timeCardNumber: result.referenceNumber! } : e
      ));
    }
  };

  const handleAddProject = (entryId: string, type: "project" | "yardwork" | "leave" = "project") => {
    const newProject: Project = {
      id: `p${Date.now()}`, type, project: "", siteStart: "", siteFinish: "",
      subActivities: [], weather: false, lunch: false, lunchPenalty: false, pumpClean: false,
    };
    if (entryId.startsWith("placeholder-")) {
      const date = entryId.replace("placeholder-", "");
      const existingForDate = entries.find((e) => e.date === date);
      if (existingForDate) {
        const upd = { ...existingForDate, projects: [...existingForDate.projects, newProject] };
        setEntries((prev) => prev.map((e) => e.id === existingForDate.id ? upd : e));
        upsertEntry(upd);
        return;
      }
      const newEntry: TimeEntry = {
        id: `entry${Date.now()}`, date, status: "draft",
        depotStart: "", depotFinish: "", projects: [newProject],
        employeeName: mockEmployee.name,
      };
      setEntries((prev) => prev.some((e) => e.date === date) ? prev : [...prev, newEntry]);
      upsertEntry(newEntry).then((result) => {
        if (result?.id) setEntries((prev) => prev.map((e) => e.id === newEntry.id ? { ...e, id: result.id } : e));
      });
    } else {
      setEntries((prev) => {
        const updated = prev.map((e) => {
          if (e.id !== entryId) return e;
          const upd = { ...e, projects: [...e.projects, newProject] };
          upsertEntry(upd);
          return upd;
        });
        return updated;
      });
    }
  };

  const handleDeleteProject = (entryId: string, projectId: string) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      const upd = { ...e, projects: e.projects.filter((p) => p.id !== projectId) };
      upsertEntry(upd);
      return upd;
    }));
  };

  const handleUpdateProject = (entryId: string, projectId: string, updated: Partial<Project>) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      const upd = { ...e, projects: e.projects.map((p) => p.id === projectId ? { ...p, ...updated } : p) };
      upsertEntry(upd);
      return upd;
    }));
  };

  const handleUpdateEntry = (entryId: string, updated: Partial<TimeEntry>) => {
    if (entryId.startsWith("placeholder-")) {
      const date = entryId.replace("placeholder-", "");
      const existingForDate = entries.find((e) => e.date === date);
      if (existingForDate) {
        const upd = { ...existingForDate, ...updated };
        setEntries((prev) => prev.map((e) => e.id === existingForDate.id ? upd : e));
        upsertEntry(upd);
        return;
      }
      const newEntry: TimeEntry = {
        id: `entry${Date.now()}`, date, status: "draft",
        depotStart: updated.depotStart ?? "", depotFinish: updated.depotFinish ?? "",
        projects: [], employeeName: mockEmployee.name,
      };
      setEntries((prev) => prev.some((e) => e.date === date) ? prev : [...prev, newEntry]);
      upsertEntry(newEntry).then((result) => {
        if (result?.id) setEntries((prev) => prev.map((e) => e.id === newEntry.id ? { ...e, id: result.id } : e));
      });
    } else {
      setEntries((prev) => prev.map((e) => {
        if (e.id !== entryId) return e;
        const upd = { ...e, ...updated };
        upsertEntry(upd);
        return upd;
      }));
    }
  };

  const handleAddSubActivity = (entryId: string, projectId: string, type: string) => {
    const sa: SubActivity = { id: `sa${Date.now()}`, type, activityType: "", start: "", finish: "" };
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      const upd = { ...e, projects: e.projects.map((p) => p.id === projectId ? { ...p, subActivities: [...p.subActivities, sa] } : p) };
      upsertEntry(upd);
      return upd;
    }));
  };

  const handleUpdateSubActivity = (entryId: string, projectId: string, saId: string, updated: Partial<SubActivity>) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      const upd = { ...e, projects: e.projects.map((p) => p.id === projectId ? { ...p, subActivities: p.subActivities.map((sa) => sa.id === saId ? { ...sa, ...updated } : sa) } : p) };
      upsertEntry(upd);
      return upd;
    }));
  };

  const handleDeleteSubActivity = (entryId: string, projectId: string, saId: string) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      const upd = { ...e, projects: e.projects.map((p) => p.id === projectId ? { ...p, subActivities: p.subActivities.filter((sa) => sa.id !== saId) } : p) };
      upsertEntry(upd);
      return upd;
    }));
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading timesheet...
      </div>
    );
  }

  if (currentPage === "weeklysummary") {
    return (
      <WeeklySummary
        entries={entries}
        employee={mockEmployee}
        onBack={() => setCurrentPage("timesheet")}
      />
    );
  }

  return (
    <>
      <TimeSheetHeader
        todayHours={todayHours}
        weekHours={weekHours}
        employeeName={mockEmployee.name}
        employeeTitle={mockEmployee.classification}
      />
      <TimeEntryList
        entries={entries}
        activeProjects={activeProjects}
        projectsByState={projectsByState}
        onDelete={handleDeleteEntry}
        onStatusChange={handleStatusChange}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
        onUpdateEntry={handleUpdateEntry}
        onViewWeeklySummary={() => setCurrentPage("weeklysummary")}
        onAddSubActivity={handleAddSubActivity}
        onUpdateSubActivity={handleUpdateSubActivity}
        onDeleteSubActivity={handleDeleteSubActivity}
        initialDate={initialDate}
      />
    </>
  );
}
