import { createClient } from "@/lib/supabase/server";
import { Employee, TimeEntry } from "@/lib/types";

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

  return {
    employee,
    emp,
    entries,
    showClaimAdmin,
    activeProjects: (projectRows ?? []).map((p: any) => ({ id: p.id, name: p.name })),
    projectsByState,
  };
}
