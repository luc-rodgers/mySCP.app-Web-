"use client";

import { useState, useRef } from "react";
import { X } from "lucide-react";
import { createEmployee } from "@/app/actions/createEmployee";
import { useRouter } from "next/navigation";

const CLASSIFICATIONS = [
  "CW4 Pump Operator",
  "CW3 Pump Operator",
  "CW2 Line Hand",
  "CW1 Line Hand",
  "Site Manager",
  "Trainee",
  "Administration",
  "Other",
];

interface Props {
  onClose: () => void;
}

export function AddEmployeeModal({ onClose }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEmployee(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-medium">Add Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">First Name *</label>
              <input
                name="firstName"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Aaron"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Last Name *</label>
              <input
                name="lastName"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="aaron.smith@scpumping.com.au"
            />
          </div>

          {/* Temporary password */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Temporary Password *</label>
            <input
              name="password"
              type="text"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
              placeholder="Min. 6 characters"
            />
            <p className="text-xs text-gray-400 mt-1">Share this with the employee so they can log in for the first time.</p>
          </div>

          {/* Classification */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Classification</label>
            <select
              name="title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Employment type + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Employment Type</label>
              <select
                name="employmentType"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="Casual">Casual</option>
                <option value="Permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">App Role</label>
              <select
                name="role"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="04XX XXX XXX"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2 text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
