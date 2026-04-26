"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ApproveResult = { success: true } | { success: false; error: string };

export async function approveTimeEntry(entryId: string): Promise<ApproveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: caller } = await supabase
    .from("employees")
    .select("role, first_name, last_name")
    .eq("user_id", user?.id)
    .single();

  if (caller?.role !== "admin") {
    return { success: false, error: "Unauthorised" };
  }

  const approverName = caller ? `${caller.first_name} ${caller.last_name}`.trim() : "Admin";

  const { data: existing } = await supabase
    .from("time_entries")
    .select("data")
    .eq("id", entryId)
    .single();

  const updatedData = { ...(existing?.data as object ?? {}), approvedBy: approverName };

  const { error } = await supabase
    .from("time_entries")
    .update({ status: "approved", data: updatedData })
    .eq("id", entryId)
    .eq("status", "submitted");

  if (error) return { success: false, error: error.message };

  revalidatePath("/timesheets");
  return { success: true };
}
