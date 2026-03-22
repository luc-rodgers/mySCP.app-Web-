"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f3f3f5" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/scplogo.png"
            alt="Specialised Concrete Pumping"
            width={160}
            height={64}
            className="object-contain mb-2"
            priority
          />
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[0.625rem] shadow-sm border p-8"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-lg font-semibold text-[#030213] mb-1">
            Sign in
          </h2>
          <p className="text-sm text-[#717182] mb-6">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#030213] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-sm border outline-none transition-colors focus:ring-2 focus:ring-[#030213]/10 focus:border-[#030213]"
                style={{
                  backgroundColor: "var(--input-background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#030213]"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#717182] hover:text-[#030213] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-sm border outline-none transition-colors focus:ring-2 focus:ring-[#030213]/10 focus:border-[#030213]"
                style={{
                  backgroundColor: "var(--input-background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            {error && (
              <div className="rounded-[0.625rem] bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-[0.625rem] bg-[#030213] text-white text-sm font-medium hover:bg-[#1a1a2e] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#717182] mt-6">
          © {new Date().getFullYear()} Specialised Concrete Pumping
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
