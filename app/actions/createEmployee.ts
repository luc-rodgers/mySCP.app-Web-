"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateEmployeeResult =
  | { success: true }
  | { success: false; error: string };

export async function createEmployee(
  formData: FormData,
  sendInvite: boolean = true
): Promise<CreateEmployeeResult> {
  // Verify caller is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  if (caller?.role !== "admin") {
    return { success: false, error: "Unauthorised" };
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string) || "operator";
  const title = (formData.get("title") as string)?.trim() || null;
  const employmentType = (formData.get("employmentType") as string) || "Casual";
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!firstName || !lastName) {
    return { success: false, error: "First name and last name are required." };
  }

  if (sendInvite && !email) {
    return { success: false, error: "Email is required to send an invite." };
  }

  const admin = createAdminClient();

  if (sendInvite && email) {
    // Check for duplicate email before touching Auth
    const { data: existing } = await supabase
      .from("employees")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "An employee with this email already exists." };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    const { error: empError } = await admin.from("employees").insert({
      user_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      role,
      title,
      employment_type: employmentType,
      active_status: "active",
    });

    if (empError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: empError.message };
    }
  } else {
    // Profile only — no auth user yet
    const { error: empError } = await admin.from("employees").insert({
      user_id: null,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone,
      role,
      title,
      employment_type: employmentType,
      active_status: "active",
    });

    if (empError) {
      return { success: false, error: empError.message };
    }
  }

  revalidatePath("/employees");
  return { success: true };
}
