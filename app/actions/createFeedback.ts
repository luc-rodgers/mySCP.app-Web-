"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateFeedbackResult =
  | { success: true }
  | { success: false; error: string };

const ALLOWED_PLATFORMS = ["mobile", "desktop"] as const;

export async function createFeedback(formData: FormData): Promise<CreateFeedbackResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const section = (formData.get("section") as string)?.trim();
  const platform = (formData.get("platform") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!section) return { success: false, error: "Pick a section first." };
  if (!ALLOWED_PLATFORMS.includes(platform as any)) {
    return { success: false, error: "Pick mobile or desktop." };
  }
  if (!message) return { success: false, error: "Feedback can't be blank." };

  // Look up the caller's employee row so the feedback links back to a person.
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("feedback").insert({
    employee_id: emp?.id ?? null,
    section,
    platform,
    message,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/feedback");
  return { success: true };
}
