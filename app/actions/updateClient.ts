"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateClientResult =
  | { success: true }
  | { success: false; error: string };

export async function updateClient(
  clientId: string,
  formData: FormData
): Promise<UpdateClientResult> {
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

  if (!name) return { success: false, error: "Client name is required." };

  const { error } = await supabase
    .from("clients")
    .update({ name, contact_name: contactName, email, phone, address })
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/clients");
  revalidatePath("/projects");
  return { success: true };
}
