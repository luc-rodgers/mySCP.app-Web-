"use client"
import { Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ClientProfile } from './ClientProfile';
import { AddClientModal } from './AddClientModal';

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  activeProjects: number;
}

interface ClientsProps {
  initialClients: Client[];
  isAdmin?: boolean;
}

export function Clients({ initialClients = [], isAdmin = false }: ClientsProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const clients = initialClients;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.activeProjects > 0).length;
  const totalProjects = clients.reduce((sum, c) => sum + c.activeProjects, 0);

  if (selectedClient) {
    return <ClientProfile client={selectedClient} onBack={() => setSelectedClient(null)} isAdmin={isAdmin} />;
  }

  return (
    <div className="p-4 pb-24">
      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} />}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-900 font-bold">Clients</h1>

          {isAdmin && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => { setShowAddModal(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Add Client
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{totalClients}</div>
            <div className="text-gray-500 text-xs mt-0.5">Total</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{activeClients}</div>
            <div className="text-gray-500 text-xs mt-0.5">With Projects</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{totalProjects}</div>
            <div className="text-gray-500 text-xs mt-0.5">Projects</div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {clients.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No clients yet
          </div>
        )}

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <h3 className="text-gray-900 mb-0.5">{client.name}</h3>
                <p className="text-sm text-gray-500">{client.contact}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">Client Name</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-3">Address</div>
            <div className="col-span-1 text-right">Projects</div>
          </div>
          <div className="divide-y divide-gray-100">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="w-full grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-3 text-gray-900">{client.name}</div>
                <div className="col-span-2 text-gray-500">{client.contact || '—'}</div>
                <div className="col-span-3 text-gray-500">{client.email || '—'}</div>
                <div className="col-span-3 text-gray-500">{client.address || '—'}</div>
                <div className="col-span-1 text-right text-gray-900">{client.activeProjects}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
