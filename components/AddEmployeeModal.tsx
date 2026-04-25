"use client";

import { useState, useRef } from "react";
import { X, UserPlus, User, KeyRound } from "lucide-react";
import { createEmployee } from "@/app/actions/createEmployee";
import { useRouter } from "next/navigation";

const CLASSIFICATIONS = [
  "CW1 - Line Hand",
  "CW2 - Line Hand",
  "CW3 - Pump Operator",
  "CW3 - Rigger",
  "CW4 - Pump Operator",
  "CW4 - Rigger",
  "Administration",
  "Management",
  "Site Manager",
  "Trainee",
];

interface Props {
  onClose: () => void;
}

export function AddEmployeeModal({ onClose }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState<false | 'profile' | 'invite' | 'password'>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(sendInvite: boolean, setPassword: boolean = false) {
    if (!formRef.current) return;
    setLoading(setPassword ? 'password' : sendInvite ? 'invite' : 'profile');
    setError(null);

    const formData = new FormData(formRef.current);
    const result = await createEmployee(formData, sendInvite, setPassword);

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
      <div className="absolute inset-0 bg-black/40" />

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
        <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="px-6 py-5 space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">First Name *</label>
              <input
                name="firstName"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Last Name *</label>
              <input
                name="lastName"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Email <span className="text-gray-400">(required to send invite)</span>
            </label>
            <input
              name="email"
              type="email"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="email@example.com"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Position</label>
            <select
              name="title"
              defaultValue=""
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
            >
              <option value="">Select classification</option>
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
                defaultValue=""
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="">Select type</option>
                <option value="Casual">Casual</option>
                <option value="Permanent">Permanent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">App Access</label>
              <select
                name="role"
                defaultValue="operator"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
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

          {/* Password (optional — set manually instead of invite) */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Password <span className="text-gray-400">(optional — use instead of invite)</span>
            </label>
            <input
              name="password"
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Min. 6 characters"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => handleSubmit(false)}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-900 text-gray-900 rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <User className="w-4 h-4" />
                {loading === 'profile' ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!loading}
                onClick={() => handleSubmit(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {loading === 'invite' ? 'Sending…' : 'Send Invite'}
              </button>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => handleSubmit(false, true)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                {loading === 'password' ? 'Saving…' : 'Set Password'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
