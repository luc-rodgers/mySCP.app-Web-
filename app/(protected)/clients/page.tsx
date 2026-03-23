import { createClient } from "@/lib/supabase/server";
import { Clients } from "@/components/Clients";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: currentEmployee }, { data: rows }, { data: projectRows }] = await Promise.all([
    supabase.from("employees").select("role").eq("user_id", user?.id ?? "").single(),
    supabase.from("clients")
      .select("id, name, contact_name, email, phone, address, projects(id, status)")
      .order("name"),
    supabase.from("projects")
      .select("id, name, status, street_address, address, state, project_value, hours_logged, start_date, end_date, client_id, clients(id, name)")
      .order("name"),
  ]);

  const isAdmin = currentEmployee?.role?.toLowerCase() === "admin";

  const initialClients = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    contact: r.contact_name ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    address: r.address ?? "",
    activeProjects: (r.projects as any[])?.filter((p) => p.status === "active").length ?? 0,
  }));

  const allProjects = (projectRows ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    clientId: (p.clients as any)?.id ?? p.client_id ?? "",
    client: (p.clients as any)?.name ?? "",
    status: p.status ?? "active",
    streetAddress: p.street_address ?? "",
    address: p.address ?? "",
    state: p.state ?? "",
    projectValue: p.project_value ?? "",
    hoursLogged: p.hours_logged ?? 0,
    startDate: p.start_date ?? "",
    endDate: p.end_date ?? "",
  }));

  return <Clients initialClients={initialClients} allProjects={allProjects} isAdmin={isAdmin} />;
}
