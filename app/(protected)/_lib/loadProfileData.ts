import { createClient } from "@/lib/supabase/server";
import { Employee, TimeEntry } from "@/lib/types";
import { diffHours } from "@/lib/timeMath";

export function summariseHours(entries: TimeEntry[]) {
  const today = new Date();
  const tz = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - tz * 60000).toISOString().split("T")[0];

  const weekStart = new Date(today);
  const dow = weekStart.getDay();
  const offset = dow === 0 ? -6 : 1 - dow; // Monday-anchored
  weekStart.setDate(weekStart.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);

  let todayHours = 0, weekHours = 0;
  for (const e of entries) {
    // Drafts aren't counted toward paid hours until they're submitted.
    if (e.status !== "submitted" && e.status !== "approved") continue;
    const depot = diffHours(e.depotStart, e.depotFinish, e.isNightShift);
    const hasLunch = (e.projects ?? []).some(p => p.lunch);
    const leave = (e.projects ?? []).filter(p => p.type === "leave")
      .reduce((sum, p) => sum + parseFloat((p as any).leaveTotalHours || "0"), 0);
    const hrs = Math.max(0, depot - (hasLunch ? 0.5 : 0)) + leave;

    if (e.date === localToday) todayHours += hrs;
    const [y, m, d] = e.date.split("-").map(Number);
    if (new Date(y, m - 1, d) >= weekStart) weekHours += hrs;
  }
  return { todayHours, weekHours };
}

export async function loadProfileData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: emp }, { count: adminCount }, { data: projectRows }] = await Promise.all([
    supabase.from("employees").select("*").eq("user_id", user?.id ?? "").single(),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("projects").select("id, name, state").eq("status", "active").order("name"),
  ]);

  const isUserAdmin = emp?.role?.toLowerCase() === "admin";
  const showClaimAdmin = !isUserAdmin && (!adminCount || adminCount === 0);

  const employee: Employee = {
    id: emp?.id ?? user?.id ?? "",
    name: emp ? `${emp.first_name} ${emp.last_name}` : (user?.email ?? ""),
    email: emp?.email ?? user?.email ?? "",
    department: "Operations",
    classification: emp?.title ?? emp?.role ?? "Employee",
    phone: emp?.phone ?? "",
    startDate: emp?.created_at ?? "",
    workStatus: emp?.employment_type ?? "Casual",
  };

  const entries: TimeEntry[] = [];
  if (emp?.id) {
    const { data: rows } = await supabase
      .from("time_entries")
      .select("id, date, status, reference_number, data")
      .eq("employee_id", emp.id)
      .order("date", { ascending: false });

    if (rows) {
      const seen = new Set<string>();
      for (const row of rows) {
        if (seen.has(row.date)) continue;
        seen.add(row.date);
        entries.push({
          ...(row.data as Partial<TimeEntry>),
          id: row.id,
          date: row.date,
          status: row.status as TimeEntry["status"],
          employeeName: employee.name,
          timeCardNumber: (row as any).reference_number ?? (row.data as any)?.timeCardNumber ?? undefined,
        } as TimeEntry);
      }
    }
  }

  const projectsByState = {
    QLD: (projectRows ?? []).filter((p: any) => !p.state || p.state === 'QLD').map((p: any) => ({ id: p.id, name: p.name })),
    NSW: (projectRows ?? []).filter((p: any) => !p.state || p.state === 'NSW').map((p: any) => ({ id: p.id, name: p.name })),
  };

  const employeeForEdit = emp ? {
    id: emp.id,
    firstName: emp.first_name ?? "",
    lastName: emp.last_name ?? "",
    email: emp.email ?? "",
    phone: emp.phone ?? "",
    classification: emp.title ?? "",
    employmentType: emp.employment_type ?? "Casual",
    role: emp.role ?? "user",
    activeStatus: emp.active_status ?? "active",
  } : undefined;

  return {
    employee,
    emp,
    entries,
    showClaimAdmin,
    isAdmin: isUserAdmin,
    employeeForEdit,
    activeProjects: (projectRows ?? []).map((p: any) => ({ id: p.id, name: p.name })),
    projectsByState,
  };
}
