"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type GenerateInviteLinkResult =
  | { success: true; action: "invite" | "reset"; url: string }
  | { success: false; error: string };

export async function generateInviteLink(
  employeeId: string
): Promise<GenerateInviteLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: caller } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  if (caller?.role !== "admin") {
    return { success: false, error: "Unauthorised" };
  }

  const admin = createAdminClient();

  const { data: employee, error: fetchError } = await admin
    .from("employees")
    .select("id, email, user_id")
    .eq("id", employeeId)
    .single();

  if (fetchError || !employee) {
    return { success: false, error: "Employee not found." };
  }

  if (!employee.email) {
    return { success: false, error: "Employee has no email address." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.myscp.app";

  let linkType: "invite" | "recovery" = "invite";
  let action: "invite" | "reset" = "invite";

  if (employee.user_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(employee.user_id);
    const isConfirmed = !!authUser?.user?.email_confirmed_at;

    if (isConfirmed) {
      linkType = "recovery";
      action = "reset";
    } else {
      // Pending invite — clear and re-invite so a fresh token is issued.
      // Clear user_id FIRST before deleting auth user, otherwise the ON DELETE
      // CASCADE on the employees table will wipe the entire employee record.
      await admin.from("employees").update({ user_id: null }).eq("id", employeeId);
      await admin.auth.admin.deleteUser(employee.user_id);
    }
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: linkType,
    email: employee.email,
    options: { redirectTo: `${siteUrl}/auth/set-password` },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return {
      success: false,
      error: linkError?.message ?? "Failed to generate link.",
    };
  }

  if (linkType === "invite" && linkData.user?.id) {
    const { error: updateError } = await admin
      .from("employees")
      .update({ user_id: linkData.user.id })
      .eq("id", employeeId);
    if (updateError) {
      await admin.auth.admin.deleteUser(linkData.user.id);
      return { success: false, error: updateError.message };
    }
  }

  const params = new URLSearchParams({
    token_hash: linkData.properties.hashed_token,
    type: linkType,
    next: "/auth/set-password",
  });
  const url = `${siteUrl}/auth/confirm?${params.toString()}`;

  revalidatePath("/employees");
  return { success: true, action, url };
}
