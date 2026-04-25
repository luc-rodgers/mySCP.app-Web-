"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateEmployee } from "@/app/actions/updateEmployee";
import { deleteEmployee } from "@/app/actions/deleteEmployee";
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

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classification: string;
  employmentType: string;
  role: string;
  activeStatus: string;
}

interface Props {
  employee: EmployeeData;
  isAdmin: boolean;
  onClose: () => void;
  onSaved?: (updated: Partial<EmployeeData>) => void;
  onDeleted?: () => void;
}

export function EditEmployeeModal({ employee, isAdmin, onClose, onSaved, onDeleted }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateEmployee(employee.id, formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSaved?.({
      firstName:      (formData.get('firstName')      as string)?.trim() || employee.firstName,
      lastName:       (formData.get('lastName')       as string)?.trim() || employee.lastName,
      email:          (formData.get('email')          as string)?.trim() || employee.email,
      phone:          (formData.get('phone')          as string)?.trim() || employee.phone,
      classification: (formData.get('title')          as string) || employee.classification,
      employmentType: (formData.get('employmentType') as string) || employee.employmentType,
      role:           (formData.get('role')           as string) || employee.role,
      activeStatus:   (formData.get('activeStatus')   as string) || employee.activeStatus,
    });
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-medium">Edit Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Admin-only fields */}
          {isAdmin && (
            <>
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">First Name *</label>
                  <input
                    name="firstName"
                    required
                    defaultValue={employee.firstName}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Last Name *</label>
                  <input
                    name="lastName"
                    required
                    defaultValue={employee.lastName}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={employee.email}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="name@example.com.au"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={employee.phone}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="04XX XXX XXX"
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Position</label>
            <select
              name="title"
              defaultValue={employee.classification}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
            >
              <option value="">Select position</option>
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Employment Type</label>
            <select
              name="employmentType"
              defaultValue={employee.employmentType}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
            >
              <option value="Casual">Casual</option>
              <option value="Permanent">Permanent</option>
            </select>
          </div>

          {/* Admin-only: App Access + Status */}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">App Access</label>
                <select
                  name="role"
                  defaultValue={employee.role}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select
                  name="activeStatus"
                  defaultValue={employee.activeStatus}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          )}

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
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Delete — admin only */}
          {isAdmin && (
            <div className="pt-2 border-t border-gray-100 mt-2">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-sm text-red-500 hover:text-red-700 py-1.5 transition-colors cursor-pointer"
                >
                  Delete Employee
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700 mb-1">Delete {employee.firstName} {employee.lastName}?</p>
                  <p className="text-xs text-red-500 mb-3">This will permanently remove their profile and account. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true);
                        const result = await deleteEmployee(employee.id);
                        setDeleting(false);
                        if (result.success) {
                          onDeleted?.();
                        } else {
                          setError(result.error);
                          setConfirmDelete(false);
                        }
                      }}
                      className="flex-1 text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
