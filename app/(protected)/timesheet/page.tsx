import { createClient } from "@/lib/supabase/server";
import TimesheetClient from "./TimesheetClient";

export default async function TimesheetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  return (
    <TimesheetClient
      supabaseEmployee={employee}
      userEmail={user?.email ?? ""}
    />
  );
}
