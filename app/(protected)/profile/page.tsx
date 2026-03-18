import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/components/Profile";
import { ProfileEditButton } from "@/components/ProfileEditButton";
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
    workStatus: emp?.employment_type ?? "Casual",
  };

  const isAdmin = emp?.role === "admin";

  return (
    <div>
      {/* Edit button — floats above the Profile component */}
      <div className="flex justify-end px-4 pt-4">
        <ProfileEditButton
          employeeId={emp?.id ?? ""}
          firstName={emp?.first_name ?? ""}
          lastName={emp?.last_name ?? ""}
          phone={emp?.phone ?? ""}
          classification={emp?.title ?? ""}
          employmentType={emp?.employment_type ?? "Casual"}
          role={emp?.role ?? "user"}
          isAdmin={isAdmin}
        />
      </div>
      <Profile employee={employee} entries={[]} />
    </div>
  );
}
