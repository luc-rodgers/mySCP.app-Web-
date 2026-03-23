"use client"
import { ArrowLeft, MapPin, Mail, Phone, X, Check, Trash2, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateClient } from '@/app/actions/updateClient';
import { deleteClient } from '@/app/actions/deleteClient';

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  activeProjects: number;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
  client: string;
  status: string;
  address: string;
  state: string;
}

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
  isAdmin?: boolean;
  onUpdate?: (updated: Client) => void;
  onDeleted?: () => void;
  allProjects?: Project[];
}

export function ClientProfile({ client, onBack, isAdmin = false, onUpdate, onDeleted, allProjects = [] }: ClientProfileProps) {
  const router = useRouter();
  const [localClient, setLocalClient] = useState(client);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateClient(client.id, formData);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    const merged: Client = {
      ...localClient,
      name:    (formData.get('name')        as string)?.trim() || localClient.name,
      contact: (formData.get('contactName') as string)?.trim() || localClient.contact,
      email:   (formData.get('email')       as string)?.trim() || localClient.email,
      phone:   (formData.get('phone')       as string)?.trim() || localClient.phone,
      address: (formData.get('address')     as string)?.trim() || localClient.address,
    };
    setLocalClient(merged);
    onUpdate?.(merged);
    router.refresh();
    setIsEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClient(client.id);
    setDeleting(false);
    if (!result.success) { setError(result.error); return; }
    onDeleted?.();
    router.refresh();
    onBack();
  }

  const activeProjects = allProjects.filter(p => p.status === 'active');
  const completedProjects = allProjects.filter(p => p.status === 'completed');

  const statusBadge = (status: string) => {
    if (status === 'active') return 'bg-green-50 text-green-700 border border-green-200';
    return 'bg-gray-100 text-gray-500 border border-gray-200';
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-center md:justify-start mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {!isEditing ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-gray-900 mb-1">{localClient.name}</h1>
                {localClient.contact && <p className="text-sm text-gray-500 mb-4">Contact: {localClient.contact}</p>}

                <div className="space-y-2 text-sm">
                  {localClient.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{localClient.address}</span>
                    </div>
                  )}
                  {localClient.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>{localClient.email}</span>
                    </div>
                  )}
                  {localClient.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{localClient.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900">Edit Client</h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setIsEditing(false); setError(null); }} className="gap-2 cursor-pointer">
                  <X className="w-4 h-4" />Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Client Name *</label>
              <input name="name" required defaultValue={localClient.name}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Contact Name</label>
              <input name="contactName" defaultValue={localClient.contact}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Primary contact" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input name="email" type="email" defaultValue={localClient.email}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone</label>
                <input name="phone" type="tel" defaultValue={localClient.phone}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="04XX XXX XXX" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Address</label>
              <input name="address" defaultValue={localClient.address}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Street, Suburb, State" />
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
                  Delete client
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

      {/* Projects linked to this client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Projects</p>
          <span className="text-xs text-gray-400">{allProjects.length} total</span>
        </div>

        {allProjects.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">No projects linked yet</div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {allProjects.map((project) => (
                <div key={project.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                    {project.address && <p className="text-xs text-gray-500 mt-0.5">{project.address}{project.state ? `, ${project.state}` : ''}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${statusBadge(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-2.5 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <div className="col-span-5">Project Name</div>
                <div className="col-span-4">Location</div>
                <div className="col-span-2">State</div>
                <div className="col-span-1 text-right">Status</div>
              </div>
              <div className="divide-y divide-gray-100">
                {allProjects.map((project) => (
                  <div key={project.id} className="grid grid-cols-12 gap-4 items-center text-sm px-4 py-3">
                    <div className="col-span-5 text-gray-900 font-medium">{project.name}</div>
                    <div className="col-span-4 text-gray-500">{project.address || '—'}</div>
                    <div className="col-span-2 text-gray-500">{project.state || '—'}</div>
                    <div className="col-span-1 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
