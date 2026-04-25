import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Employees } from "@/components/Employees";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: currentEmployee }, { data: rows }] = await Promise.all([
    supabase.from("employees").select("role").eq("user_id", user?.id ?? "").single(),
    supabase.from("employees")
      .select("id, first_name, last_name, title, role, email, phone, employment_type, active_status, user_id")
      .order("first_name"),
  ]);

  const isAdmin = currentEmployee?.role?.toLowerCase() === "admin";

  // Check which linked auth users have confirmed their email
  const userIds = (rows ?? []).map(r => r.user_id).filter(Boolean) as string[];
  const confirmedUserIds = new Set<string>();
  if (userIds.length > 0) {
    const admin = createAdminClient();
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    users.forEach(u => { if (u.email_confirmed_at) confirmedUserIds.add(u.id); });
  }

  const initialEmployees = (rows ?? []).map((r) => {
    const accountStatus = !r.user_id ? 'none'
      : confirmedUserIds.has(r.user_id) ? 'confirmed'
      : 'pending';
    return {
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      classification: r.title ?? r.role ?? "Employee",
      role: r.role ?? "user",
      employmentType: r.employment_type ?? "Casual",
      email: r.email ?? "",
      phone: r.phone ?? "",
      hoursThisWeek: 0,
      status: (r.active_status ?? "active") as "active" | "retired",
      accountStatus: accountStatus as 'none' | 'pending' | 'confirmed',
    };
  });

  return <Employees initialEmployees={initialEmployees.length > 0 ? initialEmployees : undefined} isAdmin={isAdmin} />;
}
