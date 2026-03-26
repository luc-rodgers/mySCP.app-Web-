"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateProjectResult =
  | { success: true }
  | { success: false; error: string };

export async function createProject(
  formData: FormData
): Promise<CreateProjectResult> {
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

  const name = (formData.get("name") as string)?.trim();
  const clientId = (formData.get("clientId") as string)?.trim() || null;
  const streetAddress = (formData.get("streetAddress") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const state = (formData.get("state") as string) || null;
  const projectValue = (formData.get("projectValue") as string) || null;
  const status = (formData.get("status") as string) || "active";

  if (!name) {
    return { success: false, error: "Project name is required." };
  }

  const { error } = await supabase.from("projects").insert({
    name,
    client_id: clientId,
    street_address: streetAddress,
    address,
    state,
    project_value: projectValue,
    status,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/projects");
  revalidatePath("/clients");
  return { success: true };
}
