"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InviteEmployeeResult =
  | { success: true }
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

  // If the employee already has a linked auth account, send a magic link email via OTP
  if (employee.user_id) {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: employee.email,
      options: { emailRedirectTo: `${siteUrl}/timesheet`, shouldCreateUser: false },
    });
    if (otpError) return { success: false, error: otpError.message };
    revalidatePath("/employees");
    return { success: true };
  }

  // No account yet — send a fresh invite
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
  return { success: true };
}
