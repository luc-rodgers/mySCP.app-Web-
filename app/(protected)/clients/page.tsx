import { createClient } from "@/lib/supabase/server";
import { Clients } from "@/components/Clients";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("clients")
    .select("id, name, contact_name, address, project_value, active_projects")
    .order("name");

  const initialClients = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    contact: r.contact_name ?? "",
    address: r.address ?? "",
    projectValue: r.project_value ?? "$0",
    activeProjects: r.active_projects ?? 0,
  }));

  return <Clients initialClients={initialClients.length > 0 ? initialClients : undefined} />;
}
