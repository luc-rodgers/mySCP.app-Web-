"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DeleteFeedbackResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteFeedback(id: string): Promise<DeleteFeedbackResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  // Belt-and-braces — RLS already restricts delete to admins, but check explicitly so we
  // can return a useful error rather than a silent no-op when a non-admin posts.
  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (caller?.role?.toLowerCase() !== "admin") {
    return { success: false, error: "Only admins can delete feedback." };
  }

  const { error } = await supabase.from("feedback").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/feedback");
  return { success: true };
}
