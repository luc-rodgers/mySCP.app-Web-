import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PendingTimesheets } from "@/components/PendingTimesheets";
import { TimeEntry } from "@/lib/types";

export default async function TimesheetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (caller?.role !== "admin") redirect("/timesheet");

  const [{ data: rows }, { data: projectRows }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, date, status, reference_number, data, employee_id, employees(first_name, last_name)")
      .in("status", ["submitted", "approved"])
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

  return <PendingTimesheets entries={entries} activeProjects={activeProjects} projectsByState={projectsByState} />;
}
