"use client"
import { Wrench, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
import { EquipmentProfile } from './EquipmentProfile';

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  hoursUsed: number;
  activeStatus: 'active' | 'retired';
}

interface EquipmentProps {
  initialEquipment?: EquipmentItem[];
}

export function Equipment({ initialEquipment }: EquipmentProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [viewStatus, setViewStatus] = useState<'active' | 'retired'>('active');

  const defaultEquipment: EquipmentItem[] = [
    {
      id: '1',
      name: 'Schwing S36X',
      type: 'Line Pump',
      status: 'On-Site',
      location: 'Downtown Site A',
      lastMaintenance: '2025-11-15',
      nextMaintenance: '2025-12-15',
      hoursUsed: 234.5,
      activeStatus: 'active',
    },
    {
      id: '2',
      name: 'Putzmeister BSF42',
      type: 'Mobile Pump',
      status: 'On-Site',
      location: 'North Campus Expansion',
      lastMaintenance: '2025-11-10',
      nextMaintenance: '2025-12-10',
      hoursUsed: 189.0,
      activeStatus: 'active',
    },
    {
      id: '3',
      name: 'Sermac 5Z32',
      type: 'Placing Boom',
      status: 'Yard',
      location: 'Main Depot',
      lastMaintenance: '2025-11-20',
      nextMaintenance: '2025-12-20',
      hoursUsed: 156.5,
      activeStatus: 'active',
    },
    {
      id: '4',
      name: 'Isuzu NQR450',
      type: 'Truck',
      status: 'Maintenance',
      location: 'Service Center',
      lastMaintenance: '2025-11-22',
      nextMaintenance: '2025-11-29',
      hoursUsed: 312.0,
      activeStatus: 'active',
    },
    {
      id: '5',
      name: 'Ford Ranger XLT',
      type: 'UTE',
      status: 'Yard',
      location: 'Main Depot',
      lastMaintenance: '2025-11-05',
      nextMaintenance: '2025-12-05',
      hoursUsed: 267.5,
      activeStatus: 'active',
    },
    {
      id: '6',
      name: 'Schwing S28X',
      type: 'Line Pump',
      status: 'On-Site',
      location: 'Medical Center Upgrade',
      lastMaintenance: '2025-11-18',
      nextMaintenance: '2025-12-18',
      hoursUsed: 145.0,
      activeStatus: 'active',
    },
    {
      id: '7',
      name: 'Putzmeister M36',
      type: 'Mobile Pump',
      status: 'Yard',
      location: 'South Facility',
      lastMaintenance: '2025-11-12',
      nextMaintenance: '2025-12-12',
      hoursUsed: 203.5,
      activeStatus: 'active',
    },
    {
      id: '8',
      name: 'Sermac 4Z28',
      type: 'Placing Boom',
      status: 'Retired',
      location: 'Storage Yard',
      lastMaintenance: '2025-10-01',
      nextMaintenance: '2025-12-01',
      hoursUsed: 1245.0,
      activeStatus: 'retired',
    },
    {
      id: '9',
      name: 'Schwing S24X',
      type: 'Line Pump',
      status: 'Retired',
      location: 'Storage Yard',
      lastMaintenance: '2024-08-15',
      nextMaintenance: '2025-01-01',
      hoursUsed: 2341.0,
      activeStatus: 'retired',
    },
    {
      id: '10',
      name: 'Toyota Hilux SR',
      type: 'UTE',
      status: 'Retired',
      location: 'Storage Yard',
      lastMaintenance: '2024-06-20',
      nextMaintenance: '2025-01-01',
      hoursUsed: 1876.5,
      activeStatus: 'retired',
    },
  ];

  const equipment = initialEquipment ?? defaultEquipment;

  // Filter equipment based on selected status
  const filteredEquipment = equipment.filter(e => e.activeStatus === viewStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On-Site':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Yard':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Retired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const activeEquipment = equipment.filter(e => e.activeStatus === 'active');
  const totalEquipment = activeEquipment.length;
  const onSiteEquipment = activeEquipment.filter(e => e.status === 'On-Site').length;
  const yardEquipment = activeEquipment.filter(e => e.status === 'Yard').length;
  const maintenanceEquipment = activeEquipment.filter(e => e.status === 'Maintenance').length;
  const totalHours = activeEquipment.reduce((sum, e) => sum + e.hoursUsed, 0);
  const linePumpHours = activeEquipment.filter(e => e.type === 'Line Pump').reduce((sum, e) => sum + e.hoursUsed, 0);
  const mobilePumpHours = activeEquipment.filter(e => e.type === 'Mobile Pump').reduce((sum, e) => sum + e.hoursUsed, 0);
  const placingBoomHours = activeEquipment.filter(e => e.type === 'Placing Boom').reduce((sum, e) => sum + e.hoursUsed, 0);

  // If equipment is selected, show the equipment profile
  if (selectedEquipment) {
    return <EquipmentProfile equipment={selectedEquipment} onBack={() => setSelectedEquipment(null)} />;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Equipment</h1>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Equipment
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Equipment</div>
            <div className="text-gray-900 text-lg">{totalEquipment}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">On-Site</div>
            <div className="text-blue-600 text-lg">{onSiteEquipment}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Yard</div>
            <div className="text-green-600 text-lg">{yardEquipment}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Maintenance</div>
            <div className="text-amber-600 text-lg">{maintenanceEquipment}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Hours</div>
            <div className="text-gray-900 text-lg">{totalHours.toFixed(0)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Line Pump Hrs</div>
            <div className="text-gray-900 text-lg">{linePumpHours.toFixed(0)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Mobile Pump Hrs</div>
            <div className="text-gray-900 text-lg">{mobilePumpHours.toFixed(0)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Placing Boom Hrs</div>
            <div className="text-gray-900 text-lg">{placingBoomHours.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Status Toggle */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewStatus('active')}
            className={`flex-1 px-4 py-3 text-sm transition-colors cursor-pointer ${
              viewStatus === 'active'
                ? 'bg-white text-gray-900 border-b-2 border-red-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setViewStatus('retired')}
            className={`flex-1 px-4 py-3 text-sm transition-colors cursor-pointer ${
              viewStatus === 'retired'
                ? 'bg-white text-gray-900 border-b-2 border-red-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Retired
          </button>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredEquipment.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedEquipment(item)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.type}</p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(item.status)} text-xs`}>
                  {item.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div className="col-span-2">Status</div>
            <div className="col-span-1">#</div>
            <div className="col-span-3">Equipment Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-1 text-right">Hours</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {filteredEquipment.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedEquipment(item)}
                className="w-full grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-2">
                  <Badge variant="outline" className={`${getStatusColor(item.status)} text-xs`}>
                    {item.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-gray-500">{item.id}</div>
                <div className="col-span-3 text-gray-900">{item.name}</div>
                <div className="col-span-2 text-gray-500">{item.type}</div>
                <div className="col-span-3 text-gray-500">{item.location}</div>
                <div className="col-span-1 text-right text-gray-900">
                  {item.hoursUsed.toFixed(1)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}