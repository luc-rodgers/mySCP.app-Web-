"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f3f3f5" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#030213] mb-4 shadow-md">
            <span className="text-white font-bold text-xl leading-none">
              <span className="text-red-500">S</span>CP
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[#030213]">MySCP</h1>
          <p className="text-sm text-[#717182] mt-1">Specialised Concrete Pumping</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-[0.625rem] shadow-sm border p-8"
          style={{ borderColor: "var(--border)" }}
        >
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#030213] mb-2">Check your email</h2>
              <p className="text-sm text-[#717182] mb-6">
                We sent a password reset link to <strong>{email}</strong>.
              </p>
              <Link
                href="/login"
                className="text-sm text-[#030213] font-medium hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[#030213] mb-1">Forgot password?</h2>
              <p className="text-sm text-[#717182] mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#030213] mb-1.5">
                    Email address
                  </label>
                  <input
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
                  {loading ? "Sending…" : "Send reset link"}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-[#717182] hover:text-[#030213] transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#717182] mt-6">
          © {new Date().getFullYear()} Specialised Concrete Pumping
        </p>
      </div>
    </div>
  );
}
