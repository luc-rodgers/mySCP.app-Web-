import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  console.log("[auth/callback] params:", { code: !!code, token_hash: !!token_hash, type });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // PKCE flow — Supabase redirects here with a code after verifying on their end
  if (code) {
    await supabase.auth.signOut();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] exchangeCodeForSession error:", error?.message);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }
  }

  // Token hash flow — used for password recovery
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "invite" | "recovery",
      token_hash,
    });
    console.log("[auth/callback] verifyOtp error:", error?.message);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=The+link+is+invalid+or+has+expired.`);
}
