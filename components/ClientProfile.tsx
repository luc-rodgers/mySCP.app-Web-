"use client"
import { ArrowLeft, MapPin, Mail, Phone, Edit2, X, Check, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
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

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
  isAdmin?: boolean;
}

export function ClientProfile({ client, onBack, isAdmin = false }: ClientProfileProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateClient(client.id, formData);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    router.refresh();
    setIsEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClient(client.id);
    setDeleting(false);
    if (!result.success) { setError(result.error); return; }
    router.refresh();
    onBack();
  }

  return (
    <div className="p-4 pb-24">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-2 cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {!isEditing ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-gray-900 mb-1">{client.name}</h1>
                {client.contact && <p className="text-sm text-gray-500 mb-4">Contact: {client.contact}</p>}

                <div className="space-y-2 text-sm">
                  {client.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span>{client.address}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Active Projects</div>
                <div className="text-green-600 text-lg">{client.activeProjects}</div>
              </div>
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
              <input name="name" required defaultValue={client.name}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Contact Name</label>
              <input name="contactName" defaultValue={client.contact}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Primary contact" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input name="email" type="email" defaultValue={client.email}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Phone</label>
                <input name="phone" type="tel" defaultValue={client.phone}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="04XX XXX XXX" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Address</label>
              <input name="address" defaultValue={client.address}
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Projects</h2>
        </div>
        <div className="px-4 py-8 text-center text-sm text-gray-500">No projects linked yet</div>
      </div>
    </div>
  );
}
