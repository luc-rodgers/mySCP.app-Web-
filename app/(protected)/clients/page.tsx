import { createClient } from "@/lib/supabase/server";
import { Clients } from "@/components/Clients";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel: role check + clients with project counts
  const [{ data: currentEmployee }, { data: rows }] = await Promise.all([
    supabase.from("employees").select("role").eq("user_id", user?.id ?? "").single(),
    supabase.from("clients")
      .select("id, name, contact_name, email, phone, address, projects(id, status)")
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

  return <Clients initialClients={initialClients} isAdmin={isAdmin} />;
}
