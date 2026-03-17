import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/components/Profile";
import { Employee } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: emp } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  const employee: Employee = {
    id: emp?.id ?? user?.id ?? "",
    name: emp ? `${emp.first_name} ${emp.last_name}` : (user?.email ?? ""),
    email: emp?.email ?? user?.email ?? "",
    department: "Operations",
    classification: emp?.title ?? emp?.role ?? "Employee",
    phone: emp?.phone ?? "",
    startDate: emp?.created_at ?? "",
    workStatus: "Permanent",
  };

  return <Profile employee={employee} entries={[]} />;
}
