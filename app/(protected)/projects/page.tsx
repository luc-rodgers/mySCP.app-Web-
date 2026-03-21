import { createClient } from "@/lib/supabase/server";
import { Projects } from "@/components/Projects";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel: role check + projects + clients
  const [{ data: currentEmployee }, { data: rows }, { data: clientRows }] = await Promise.all([
    supabase.from("employees").select("role").eq("user_id", user?.id ?? "").single(),
    supabase.from("projects")
      .select("id, name, status, start_date, end_date, address, project_value, hours_logged, clients(name)")
      .order("name"),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  const isAdmin = currentEmployee?.role?.toLowerCase() === "admin";

  const initialProjects = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    client: (r.clients as any)?.name ?? "TBD",
    address: r.address ?? "",
    status: (r.status === "completed" ? "completed" : "active") as "active" | "completed",
    startDate: r.start_date ?? "",
    endDate: r.end_date ?? "",
    hoursLogged: r.hours_logged ?? 0,
    projectValue: r.project_value ?? undefined,
  }));

  const clients = (clientRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return <Projects initialProjects={initialProjects} isAdmin={isAdmin} clients={clients} />;
}
