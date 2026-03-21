"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bootstrapAdmin } from "@/app/actions/bootstrapAdmin";
import { ShieldCheck } from "lucide-react";

export function ClaimAdminButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);
    const result = await bootstrapAdmin();
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4" />
        {loading ? "Claiming…" : "Claim Admin"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
