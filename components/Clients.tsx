"use client"
import { Building2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { ClientProfile } from './ClientProfile';

interface Client {
  id: string;
  name: string;
  contact: string;
  address: string;
  projectValue: string;
  activeProjects: number;
}

interface ClientsProps {
  initialClients?: Client[];
}

export function Clients({ initialClients }: ClientsProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const defaultClients: Client[] = [
    {
      id: '1',
      name: 'ABC Construction Corp',
      contact: 'Michael Roberts',
      address: '123 Industrial Way, City, State 12345',
      projectValue: '$2,500,000',
      activeProjects: 3,
    },
    {
      id: '2',
      name: 'Metro Development Group',
      contact: 'Jennifer Lee',
      address: '456 Commerce Blvd, City, State 12346',
      projectValue: '$1,800,000',
      activeProjects: 2,
    },
    {
      id: '3',
      name: 'Greenfield Properties',
      contact: 'Robert Chang',
      address: '789 Business Park Dr, City, State 12347',
      projectValue: '$3,200,000',
      activeProjects: 4,
    },
    {
      id: '4',
      name: 'Summit Builders LLC',
      contact: 'Lisa Anderson',
      address: '321 Enterprise Ave, City, State 12348',
      projectValue: '$950,000',
      activeProjects: 0,
    },
    {
      id: '5',
      name: 'Urban Renewal Inc',
      contact: 'David Martinez',
      address: '654 Development St, City, State 12349',
      projectValue: '$4,100,000',
      activeProjects: 5,
    },
  ];

  const clients = initialClients ?? defaultClients;

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.activeProjects > 0).length;
  const totalProjects = clients.reduce((sum, client) => sum + client.activeProjects, 0);

  // If a client is selected, show the client profile
  if (selectedClient) {
    return <ClientProfile client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Clients</h1>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Client
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Clients</div>
            <div className="text-gray-900 text-lg">{totalClients}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Active</div>
            <div className="text-green-600 text-lg">{activeClients}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Projects</div>
            <div className="text-gray-900 text-lg">{totalProjects}</div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{client.name}</h3>
                  <p className="text-sm text-gray-600">{client.contact}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div className="col-span-3">Client Name</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-5">Address</div>
            <div className="col-span-1 text-right">Projects</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="w-full grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-3 text-gray-900">{client.name}</div>
                <div className="col-span-3 text-gray-500">{client.contact}</div>
                <div className="col-span-5 text-gray-500">{client.address}</div>
                <div className="col-span-1 text-right text-gray-900">
                  {client.activeProjects}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}