import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import TimesheetClient from "./TimesheetClient";

export default async function TimesheetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: employee }, { data: projects }] = await Promise.all([
    supabase.from("employees").select("*").eq("user_id", user?.id).single(),
    supabase.from("projects").select("name, state").eq("status", "active").order("name"),
  ]);

  const activeProjectNames = (projects ?? []).map((p: { name: string }) => p.name);
  const projectsByState = {
    QLD: (projects ?? []).filter((p: { name: string; state: string | null }) => !p.state || p.state === 'QLD').map((p: { name: string }) => p.name),
    NSW: (projects ?? []).filter((p: { name: string; state: string | null }) => !p.state || p.state === 'NSW').map((p: { name: string }) => p.name),
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
