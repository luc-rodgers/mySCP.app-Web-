import { createClient } from "@/lib/supabase/server";
import { Projects } from "@/components/Projects";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("projects")
    .select("id, name, status, start_date, end_date, address, project_value, hours_logged, clients(name)")
    .order("name");

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

  return <Projects initialProjects={initialProjects.length > 0 ? initialProjects : undefined} />;
}
