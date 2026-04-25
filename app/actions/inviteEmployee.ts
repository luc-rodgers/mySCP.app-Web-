"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InviteEmployeeResult =
  | { success: true; action: 'invite' | 'reset' }
  | { success: false; error: string };

export async function inviteEmployee(employeeId: string): Promise<InviteEmployeeResult> {
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

  const admin = createAdminClient();

  // Fetch the employee record
  const { data: employee, error: fetchError } = await admin
    .from("employees")
    .select("id, email, user_id")
    .eq("id", employeeId)
    .single();

  if (fetchError || !employee) {
    return { success: false, error: "Employee not found." };
  }

  if (!employee.email) {
    return { success: false, error: "Employee has no email address." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.myscp.app";

  // If the employee has a linked auth account, check if it's confirmed
  if (employee.user_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(employee.user_id);
    const isConfirmed = !!authUser?.user?.email_confirmed_at;

    if (isConfirmed) {
      // Account already active — send a password reset instead of a new invite
      const regularClient = await createClient();
      const { error: resetError } = await regularClient.auth.resetPasswordForEmail(
        employee.email,
        { redirectTo: `${siteUrl}/auth/callback` }
      );
      if (resetError) {
        return { success: false, error: resetError.message };
      }
      revalidatePath("/employees");
      return { success: true, action: 'reset' };
    }

    // Not yet confirmed — clear and re-invite
    // Clear user_id FIRST before deleting auth user, otherwise the ON DELETE CASCADE
    // on the employees table will wipe the entire employee record.
    await admin.from("employees").update({ user_id: null }).eq("id", employeeId);
    await admin.auth.admin.deleteUser(employee.user_id);
  }

  // Send a fresh invite email
  const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
    employee.email,
    { redirectTo: `${siteUrl}/auth/callback` }
  );

  if (authError) {
    return { success: false, error: authError.message };
  }

  // Link the auth user to the employee record
  const { error: updateError } = await admin
    .from("employees")
    .update({ user_id: authData.user.id })
    .eq("id", employeeId);

  if (updateError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: updateError.message };
  }

  revalidatePath("/employees");
  return { success: true, action: 'invite' };
}
