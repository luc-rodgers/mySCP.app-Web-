"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateEmployeeResult =
  | { success: true }
  | { success: false; error: string };

export async function createEmployee(
  formData: FormData
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
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "operator";
  const title = (formData.get("title") as string)?.trim() || null;
  const employmentType = (formData.get("employmentType") as string) || "Casual";
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!firstName || !lastName || !email || !password) {
    return { success: false, error: "First name, last name, email, and password are required." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  const admin = createAdminClient();

  // Create the Supabase Auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  // Create the employee record
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
    // Roll back: delete the auth user so we don't leave an orphan
    await admin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: empError.message };
  }

  revalidatePath("/employees");
  return { success: true };
}
