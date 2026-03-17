import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Employees } from "@/components/Employees";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  if (currentEmployee?.role !== "admin") {
    redirect("/timesheet");
  }

  const { data: rows } = await supabase
    .from("employees")
    .select("id, first_name, last_name, title, role, email, phone, employment_type, active_status")
    .order("first_name");

  const initialEmployees = (rows ?? []).map((r) => ({
    id: r.id,
    name: `${r.first_name} ${r.last_name}`,
    classification: r.title ?? r.role ?? "Employee",
    employmentType: r.employment_type ?? "Casual",
    email: r.email ?? "",
    phone: r.phone ?? "",
    hoursThisWeek: 0,
    status: (r.active_status ?? "active") as "active" | "retired",
  }));

  return <Employees initialEmployees={initialEmployees.length > 0 ? initialEmployees : undefined} />;
}
