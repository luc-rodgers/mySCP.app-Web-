import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ConfirmType = "invite" | "recovery" | "signup" | "email" | "magiclink" | "email_change";

const ALLOWED_TYPES: ConfirmType[] = [
  "invite",
  "recovery",
  "signup",
  "email",
  "magiclink",
  "email_change",
];

const SAFE_NEXT = /^\/[A-Za-z0-9_\-/]*$/;

const INVALID_REDIRECT = (request: NextRequest) =>
  NextResponse.redirect(
    new URL(
      "/login?error=" + encodeURIComponent("The link is invalid or has expired."),
      request.url
    ),
    { status: 303 }
  );

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return INVALID_REDIRECT(request);
  }

  const tokenHash = formData.get("token_hash");
  const rawType = formData.get("type");
  const rawNext = formData.get("next");

  if (
    typeof tokenHash !== "string" ||
    typeof rawType !== "string" ||
    !ALLOWED_TYPES.includes(rawType as ConfirmType)
  ) {
    return INVALID_REDIRECT(request);
  }

  const type = rawType as ConfirmType;
  const next =
    typeof rawNext === "string" && SAFE_NEXT.test(rawNext) ? rawNext : "/auth/set-password";

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return INVALID_REDIRECT(request);
  }

  // 303 forces the browser to GET the next URL after a POST.
  // Cookies set by verifyOtp via the SSR client are attached to this redirect
  // response automatically by Next.js, so the next request carries the session.
  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
