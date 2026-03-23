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
    supabase.from("projects").select("id, name, client, status, address, state").order("name"),
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
    client: p.client ?? "",
    status: p.status ?? "active",
    address: p.address ?? "",
    state: p.state ?? "",
  }));

  return <Clients initialClients={initialClients} allProjects={allProjects} isAdmin={isAdmin} />;
}
