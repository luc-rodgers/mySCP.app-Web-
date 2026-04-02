import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import TimesheetClient from "./TimesheetClient";

export default async function TimesheetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: employee }, { data: projects }] = await Promise.all([
    supabase.from("employees").select("*").eq("user_id", user?.id).single(),
    supabase.from("projects").select("id, name, state").eq("status", "active").order("name"),
  ]);

  const activeProjectNames = (projects ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
  const projectsByState = {
    QLD: (projects ?? []).filter((p: { id: string; name: string; state: string | null }) => !p.state || p.state === 'QLD').map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })),
    NSW: (projects ?? []).filter((p: { id: string; name: string; state: string | null }) => !p.state || p.state === 'NSW').map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })),
  };

  return (
    <Suspense>
      <TimesheetClient
        supabaseEmployee={employee}
        userEmail={user?.email ?? ""}
        activeProjects={activeProjectNames}
        projectsByState={projectsByState}
      />
    </Suspense>
  );
}
