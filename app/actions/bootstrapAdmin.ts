"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BootstrapResult =
  | { success: true }
  | { success: false; error: string };

export async function bootstrapAdmin(): Promise<BootstrapResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated." };

  // Only allow this if there are currently no admins in the system
  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (count && count > 0) {
    return { success: false, error: "An admin already exists. Contact them to change your role." };
  }

  // RLS allows users to update their own record — use that to self-promote
  const { error } = await supabase
    .from("employees")
    .update({ role: "admin" })
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/employees");
  return { success: true };
}
