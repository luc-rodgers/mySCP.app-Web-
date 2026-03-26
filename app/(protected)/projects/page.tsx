import { createClient } from "@/lib/supabase/server";
import { Projects } from "@/components/Projects";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel: role check + projects + clients + time entries for hours calculation
  const [{ data: currentEmployee }, { data: rows }, { data: clientRows }, { data: timeEntries }] = await Promise.all([
    supabase.from("employees").select("role").eq("user_id", user?.id ?? "").single(),
    supabase.from("projects")
      .select("id, name, status, start_date, end_date, street_address, address, state, project_value, clients(name)")
      .order("name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("time_entries").select("data"),
  ]);

  const isAdmin = currentEmployee?.role?.toLowerCase() === "admin";

  // Calculate hours per project name from time entries
  const hoursPerProject: Record<string, number> = {};
  (timeEntries ?? []).forEach((entry: any) => {
    const projects = entry.data?.projects ?? [];
    projects.forEach((p: any) => {
      if (!p.project) return;
      const subs = p.subActivities ?? [];
      let hrs = 0;
      subs.forEach((sa: any) => {
        if (!sa.start || !sa.finish) return;
        const [sh, sm] = sa.start.split(':').map(Number);
        const [fh, fm] = sa.finish.split(':').map(Number);
        hrs += Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
      });
      hoursPerProject[p.project] = (hoursPerProject[p.project] ?? 0) + hrs;
    });
  });

  const initialProjects = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    client: (r.clients as any)?.name ?? "TBD",
    streetAddress: (r as any).street_address ?? "",
    address: r.address ?? "",
    state: (r as any).state ?? "",
    status: (r.status === "completed" ? "completed" : "active") as "active" | "completed",
    startDate: r.start_date ?? "",
    endDate: r.end_date ?? "",
    hoursLogged: hoursPerProject[r.name] ?? 0,
    projectValue: r.project_value ?? undefined,
  }));

  const clients = (clientRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return <Projects initialProjects={initialProjects} isAdmin={isAdmin} clients={clients} />;
}
