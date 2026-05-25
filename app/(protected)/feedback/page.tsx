import { createClient } from "@/lib/supabase/server";
import { Feedback } from "@/components/Feedback";
import DesktopTabToggle from "@/components/DesktopTabToggle";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const isAdmin = caller?.role?.toLowerCase() === "admin";

  // Admins see the full feedback database; operators only ever see the form.
  // RLS already restricts non-admin selects, so this query simply returns [] for them.
  const { data: rows } = isAdmin
    ? await supabase
        .from("feedback")
        .select("id, section, platform, message, created_at, employee_id, employees(first_name, last_name)")
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  const submissions = (rows ?? []).map((r: any) => ({
    id: r.id,
    section: r.section,
    platform: r.platform,
    message: r.message,
    createdAt: r.created_at,
    employeeName: r.employees
      ? `${r.employees.first_name ?? ""} ${r.employees.last_name ?? ""}`.trim() || "Unknown"
      : "Unknown",
  }));

  return (
    <>
      {!isAdmin && <DesktopTabToggle />}
      <Feedback isAdmin={isAdmin} submissions={submissions} />
    </>
  );
}
