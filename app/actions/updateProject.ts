"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateProjectResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProject(
  projectId: string,
  formData: FormData
): Promise<UpdateProjectResult> {
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
  const clientName = (formData.get("clientName") as string)?.trim() || null;
  const streetAddress = (formData.get("streetAddress") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const state = (formData.get("state") as string) || null;
  const projectValue = (formData.get("projectValue") as string) || null;
  const status = (formData.get("status") as string) || "active";

  if (!name) return { success: false, error: "Project name is required." };

  // Resolve client
  let clientId: string | null = null;
  if (clientName) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", clientName)
      .maybeSingle();

    if (existing) {
      clientId = existing.id;
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({ name: clientName })
        .select("id")
        .single();
      if (clientError) return { success: false, error: `Could not create client: ${clientError.message}` };
      clientId = newClient.id;
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({ name, client_id: clientId, street_address: streetAddress, address, state, project_value: projectValue, status })
    .eq("id", projectId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/projects", "page");
  revalidatePath("/clients");
  return { success: true };
}
