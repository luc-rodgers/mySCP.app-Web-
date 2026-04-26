"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateEmployeeResult =
  | { success: true }
  | { success: false; error: string };

export async function updateEmployee(
  employeeId: string,
  formData: FormData
): Promise<UpdateEmployeeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current user's employee record to check permissions
  const { data: caller } = await supabase
    .from("employees")
    .select("id, role")
    .eq("user_id", user?.id)
    .single();

  const isAdmin = caller?.role === "admin";
  const isOwnProfile = caller?.id === employeeId;

  if (!isAdmin && !isOwnProfile) {
    return { success: false, error: "Unauthorised" };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const title = (formData.get("title") as string)?.trim() || null;
  const employmentType = formData.get("employmentType") as string;

  // Fields editable by own profile or admin
  const updates: Record<string, unknown> = {
    email,
    phone,
    title,
    employment_type: employmentType || "Casual",
  };

  // Admin-only fields
  if (isAdmin) {
    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    if (!firstName || !lastName) {
      return { success: false, error: "First name and last name are required." };
    }
    updates.first_name = firstName;
    updates.last_name = lastName;
    updates.role = (formData.get("role") as string) || "user";
    updates.active_status = (formData.get("activeStatus") as string) || "active";
  }

  const { error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", employeeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/employees");
  revalidatePath("/profile");
  return { success: true };
}
