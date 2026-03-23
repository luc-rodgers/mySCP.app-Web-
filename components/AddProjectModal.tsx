"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createProject } from "@/app/actions/createProject";
import { useRouter } from "next/navigation";

const PROJECT_VALUE_OPTIONS = [
  ">$50m-$80m",
  ">$80m-$100m",
  ">$100m-$200m",
  ">$200m-$500m",
  ">$500m-$1b",
  ">$1b+",
];

interface Client {
  id: string;
  name: string;
}

interface Props {
  clients?: Client[];
  onClose: () => void;
}

export function AddProjectModal({ clients = [], onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createProject(formData);

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-medium">Add Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Project Name *</label>
            <input
              name="name"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Project name"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Client</label>
            <input
              name="clientName"
              list="project-clients-list"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Type to search or add new client"
            />
            <datalist id="project-clients-list">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {/* Street Address + State */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Street Address</label>
            <input
              name="streetAddress"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="123 Example St"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Suburb</label>
              <input
                name="address"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Suburb"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">State</label>
              <select
                name="state"
                defaultValue=""
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="">Select state</option>
                <option value="QLD">QLD</option>
                <option value="NSW">NSW</option>
              </select>
            </div>
          </div>

          {/* Project Value + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Project Value</label>
              <select
                name="projectValue"
                defaultValue=""
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="">Select value</option>
                {PROJECT_VALUE_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                name="status"
                defaultValue="active"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

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
              {loading ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
