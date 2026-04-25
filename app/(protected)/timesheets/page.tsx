import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PendingTimesheets } from "@/components/PendingTimesheets";
import { TimeEntry } from "@/lib/types";

function getMondayStr(refStr?: string): string {
  let y: number, m: number, d: number;
  if (refStr && /^\d{4}-\d{2}-\d{2}$/.test(refStr)) {
    [y, m, d] = refStr.split("-").map(Number);
  } else {
    const now = new Date();
    [y, m, d] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  }
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateStr(date);
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return toDateStr(new Date(y, m - 1, d + days));
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayStr(): string {
  return toDateStr(new Date());
}

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams?: { week?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (caller?.role !== "admin") redirect("/timesheet");

  const weekStart = getMondayStr(searchParams?.week);
  const weekEnd = addDaysStr(weekStart, 6);
  const today = todayStr();

  const [{ data: rows }, { data: projectRows }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, date, status, reference_number, data, employee_id, employees(first_name, last_name)")
      .in("status", ["submitted", "approved"])
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, state")
      .eq("status", "active")
      .order("name"),
  ]);

  const entries: (TimeEntry & { employeeId: string })[] = (rows ?? []).map((row: any) => ({
    ...(row.data as Partial<TimeEntry>),
    id: row.id,
    date: row.date,
    status: row.status as TimeEntry["status"],
    timeCardNumber: row.reference_number ?? (row.data as any)?.timeCardNumber,
    employeeName: row.employees
      ? `${row.employees.first_name} ${row.employees.last_name}`
      : "Unknown",
    employeeId: row.employee_id,
  }));

  const activeProjects = (projectRows ?? []).map((p: any) => ({ id: p.id, name: p.name }));
  const projectsByState = {
    QLD: (projectRows ?? []).filter((p: any) => !p.state || p.state === "QLD").map((p: any) => ({ id: p.id, name: p.name })),
    NSW: (projectRows ?? []).filter((p: any) => p.state === "NSW").map((p: any) => ({ id: p.id, name: p.name })),
  };

  return (
    <PendingTimesheets
      entries={entries}
      activeProjects={activeProjects}
      projectsByState={projectsByState}
      weekStart={weekStart}
      today={today}
    />
  );
}
