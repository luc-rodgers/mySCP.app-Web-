"use client"
import { Settings, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ClientProfile } from './ClientProfile';
import { ProjectProfile } from './ProjectProfile';
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

interface Project {
  id: string;
  name: string;
  clientId: string;
  client: string;
  status: string;
  streetAddress: string;
  address: string;
  state: string;
  projectValue: string;
  hoursLogged: number;
  startDate: string;
  endDate: string;
}

interface ClientsProps {
  initialClients: Client[];
  allProjects?: Project[];
  isAdmin?: boolean;
}

export function Clients({ initialClients = [], allProjects = [], isAdmin = false }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);

  useEffect(() => { setClients(initialClients); }, [initialClients]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Project profile view (drilled into from client profile)
  if (selectedProject && selectedClient) {
    return (
      <ProjectProfile
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        isAdmin={isAdmin}
        onUpdate={(updated) => setSelectedProject(updated)}
        onDeleted={() => setSelectedProject(null)}
      />
    );
  }

  if (selectedClient) {
    return (
      <ClientProfile
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        isAdmin={isAdmin}
        allProjects={allProjects.filter(p => p.clientId === selectedClient.id)}
        onSelectProject={(project) => setSelectedProject(project)}
        onUpdate={(updated) => {
          setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
          setSelectedClient(updated);
        }}
        onDeleted={() => {
          setClients(prev => prev.filter(c => c.id !== selectedClient.id));
          setSelectedClient(null);
        }}
      />
    );
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredClients.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            {search ? 'No clients match your search' : 'No clients yet'}
          </div>
        )}

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredClients.map((client) => (
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
            {filteredClients.map((client) => (
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
