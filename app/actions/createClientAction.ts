"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CreateClientResult =
  | { success: true; client: { id: string; name: string } }
  | { success: false; error: string };

export async function createClientAction(
  formData: FormData
): Promise<CreateClientResult> {
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
  const contactName = (formData.get("contactName") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim().toLowerCase() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) {
    return { success: false, error: "Client name is required." };
  }

  // Check for duplicate name
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "A client with this name already exists." };
  }

  const { data: newClient, error } = await supabase.from("clients").insert({
    name,
    contact_name: contactName,
    email,
    phone,
    address,
  }).select("id, name").single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/clients");
  return { success: true, client: { id: newClient.id, name: newClient.name } };
}
