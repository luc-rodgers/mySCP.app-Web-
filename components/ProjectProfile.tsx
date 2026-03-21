"use client"
import { ArrowLeft, MapPin, DollarSign, Edit2, X, Check, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProject } from '@/app/actions/updateProject';
import { deleteProject } from '@/app/actions/deleteProject';

interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
  hoursLogged: number;
  projectValue?: string;
}

interface ProjectProfileProps {
  project: Project;
  onBack: () => void;
  isAdmin?: boolean;
}

const PROJECT_VALUE_OPTIONS = [
  '>$50m-$80m',
  '>$80m-$100m',
  '>$100m-$200m',
  '>$200m-$500m',
  '>$500m-$1b',
  '>$1b+',
];

export function ProjectProfile({ project, onBack, isAdmin = false }: ProjectProfileProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedProject, setEditedProject] = useState<Project>(project);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value?: string) => value || 'Not set';

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProject(project.id, formData);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    router.refresh();
    setIsEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteProject(project.id);
    setDeleting(false);
    if (!result.success) { setError(result.error); return; }
    router.refresh();
    onBack();
  }

  return (
    <div className="p-4 pb-24">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-2 cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {!isEditing ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-gray-900">{editedProject.name}</h1>
                  <Badge variant="outline" className={`${getStatusColor(editedProject.status)} text-xs capitalize`}>
                    {editedProject.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">{editedProject.client || 'No client'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {editedProject.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{editedProject.address}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Project Value: <span className="text-gray-900">{formatCurrency(editedProject.projectValue)}</span></span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Total Entries</div>
                <div className="text-blue-600 text-lg">0</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Unique Employees</div>
                <div className="text-green-600 text-lg">0</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Total Hours</div>
                <div className="text-blue-600 text-lg">0</div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900">Edit Project</h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditedProject(project); setIsEditing(false); setError(null); }} className="gap-2 cursor-pointer">
                  <X className="w-4 h-4" />Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Project Name *</label>
              <input name="name" required defaultValue={editedProject.name}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Client</label>
              <input name="clientName" defaultValue={editedProject.client === 'TBD' ? '' : editedProject.client}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Client name" />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Location</label>
              <input name="address" defaultValue={editedProject.address}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Suburb, QLD" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Project Value</label>
                <select name="projectValue" defaultValue={editedProject.projectValue || ''}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer">
                  <option value="">Select value</option>
                  {PROJECT_VALUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select name="status" defaultValue={editedProject.status}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <div className="pt-2 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete project
                </button>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-red-700 font-medium">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      Cancel
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Time Entries */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Time Entries</h2>
        </div>
        <div className="px-4 py-8 text-center text-sm text-gray-500">No time entries yet</div>
      </div>
    </div>
  );
}
