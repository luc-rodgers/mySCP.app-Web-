"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ApproveResult = { success: true } | { success: false; error: string };

export async function approveTimeEntry(entryId: string): Promise<ApproveResult> {
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

  const { error } = await supabase
    .from("time_entries")
    .update({ status: "approved" })
    .eq("id", entryId)
    .eq("status", "submitted");

  if (error) return { success: false, error: error.message };

  revalidatePath("/timesheets");
  return { success: true };
}
