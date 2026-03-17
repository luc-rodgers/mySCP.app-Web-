"use client"
import { ArrowLeft, MapPin, Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
  lastMaintenance: string;
  nextMaintenance: string;
  hoursUsed: number;
}

interface UsageEntry {
  id: string;
  date: string;
  project: string;
  employee: string;
  hours: number;
}

interface EquipmentProfileProps {
  equipment: EquipmentItem;
  onBack: () => void;
}

export function EquipmentProfile({ equipment, onBack }: EquipmentProfileProps) {
  // Sample usage entries for the equipment
  const usageEntries: UsageEntry[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-use':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
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

  const isMaintenanceDue = (nextMaintenance: string) => {
    const daysUntil = Math.ceil((new Date(nextMaintenance).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
  };

  const totalEntries = usageEntries.length;
  const uniqueProjects = new Set(usageEntries.map(e => e.project)).size;
  const totalHours = usageEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  return (
    <div className="p-4 pb-24">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Equipment
      </Button>

      {/* Equipment Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-gray-900">{equipment.name}</h1>
              <Badge variant="outline" className={`${getStatusColor(equipment.status)} text-xs capitalize`}>
                {equipment.status.replace('-', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-4">{equipment.type}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{equipment.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Next Service: {formatDate(equipment.nextMaintenance)}</span>
              </div>
            </div>

            {isMaintenanceDue(equipment.nextMaintenance) && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                <AlertCircle className="w-4 h-4" />
                <span>Maintenance due soon</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Uses</div>
            <div className="text-blue-600 text-lg">{totalEntries}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Projects</div>
            <div className="text-green-600 text-lg">{uniqueProjects}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Hours</div>
            <div className="text-blue-600 text-lg">{totalHours.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Usage History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Usage History</h2>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {usageEntries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);
            return (
              <button
                key={entry.id}
                onClick={() => toggleEntry(entry.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Simplified View */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">{formatDate(entry.date)}</div>
                    <h3 className="text-gray-900">{entry.project}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">{entry.hours.toFixed(1)} hrs</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Operator:</span>
                      <span className="text-gray-900">{entry.employee}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Project</div>
            <div className="col-span-5">Operator</div>
            <div className="col-span-1 text-right">Hours</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {usageEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-2 text-gray-500">{formatDate(entry.date)}</div>
                <div className="col-span-4 text-gray-900">{entry.project}</div>
                <div className="col-span-5 text-gray-500">{entry.employee}</div>
                <div className="col-span-1 text-right text-blue-600">
                  {entry.hours.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}