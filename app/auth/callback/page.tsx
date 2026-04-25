"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient();

      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type");

      const flowType = hashType || queryType;

      if (flowType === "invite") {
        await supabase.auth.signOut();
      }

      let error = null;

      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        error = e;
      } else if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        error = e;
      } else if (tokenHash && queryType) {
        const { error: e } = await supabase.auth.verifyOtp({ type: queryType as "invite" | "recovery", token_hash: tokenHash });
        error = e;
      } else {
        router.push("/login?error=The+link+is+invalid+or+has+expired.");
        return;
      }

      if (error) {
        router.push("/login?error=The+link+is+invalid+or+has+expired.");
        return;
      }

      router.push("/auth/set-password");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f3f3f5" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#030213] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#717182]">Signing you in…</p>
      </div>
    </div>
  );
}
