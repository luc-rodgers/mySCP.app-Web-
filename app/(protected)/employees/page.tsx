import { createClient } from "@/lib/supabase/server";
import { Employees } from "@/components/Employees";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel: role check + full employee list
  const [{ data: currentEmployee }, { data: rows }] = await Promise.all([
    supabase.from("employees").select("role").eq("user_id", user?.id ?? "").single(),
    supabase.from("employees")
      .select("id, first_name, last_name, title, role, email, phone, employment_type, active_status, user_id")
      .order("first_name"),
  ]);

  const isAdmin = currentEmployee?.role?.toLowerCase() === "admin";

  const initialEmployees = (rows ?? []).map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`,
    classification: r.title ?? r.role ?? "Employee",
    role: r.role ?? "user",
    employmentType: r.employment_type ?? "Casual",
    email: r.email ?? "",
    phone: r.phone ?? "",
    hoursThisWeek: 0,
    status: (r.active_status ?? "active") as "active" | "retired",
    hasAccount: !!r.user_id,
  }));

  return <Employees initialEmployees={initialEmployees.length > 0 ? initialEmployees : undefined} isAdmin={isAdmin} />;
}
