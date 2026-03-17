"use client";

import { useState } from "react";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 bg-white rounded-[0.625rem] shadow-lg border p-4 w-64"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold text-[#030213] mb-2">Help & Support</h3>
          <p className="text-xs text-[#717182] mb-3">
            Need help with MySCP? Contact your administrator or visit our support resources.
          </p>
          <div className="space-y-1">
            <a
              href="mailto:support@specialisedconcretepumping.com.au"
              className="block text-xs text-[#030213] hover:underline"
            >
              support@specialisedconcretepumping.com.au
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#030213] text-white flex items-center justify-center shadow-lg hover:bg-[#1a1a2e] transition-colors"
        aria-label="Help"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </>
  );
}
