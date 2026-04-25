"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeleteEmployeeResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteEmployee(employeeId: string): Promise<DeleteEmployeeResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  if (caller?.role !== "admin") {
    return { success: false, error: "Unauthorised" };
  }

  // Prevent admins from deleting their own account
  const { data: callerEmployee } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user?.id)
    .single();

  if (callerEmployee?.id === employeeId) {
    return { success: false, error: "You cannot delete your own account." };
  }

  const admin = createAdminClient();

  const { data: employee, error: fetchError } = await admin
    .from("employees")
    .select("id, user_id")
    .eq("id", employeeId)
    .single();

  if (fetchError || !employee) {
    return { success: false, error: "Employee not found." };
  }

  if (employee.user_id) {
    // Clear user_id first to prevent ON DELETE CASCADE wiping the row before we do
    await admin.from("employees").update({ user_id: null }).eq("id", employeeId);
    await admin.auth.admin.deleteUser(employee.user_id);
  }

  const { error: deleteError } = await admin
    .from("employees")
    .delete()
    .eq("id", employeeId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/employees");
  return { success: true };
}
