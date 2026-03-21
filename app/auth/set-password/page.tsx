"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/timesheet");
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
          <h2 className="text-lg font-semibold text-[#030213] mb-1">Set your password</h2>
          <p className="text-sm text-[#717182] mb-6">
            Choose a password to secure your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#030213] mb-1.5">
                New password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 rounded-[0.625rem] text-sm border outline-none transition-colors focus:ring-2 focus:ring-[#030213]/10 focus:border-[#030213]"
                style={{
                  backgroundColor: "var(--input-background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#030213] mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Saving…" : "Set password"}
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
