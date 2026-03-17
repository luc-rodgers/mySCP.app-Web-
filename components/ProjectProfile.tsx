"use client"
import { ArrowLeft, MapPin, Calendar, Clock, User, DollarSign, ChevronDown, ChevronUp, Edit2, X, Check } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { useState } from 'react';

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

interface TimeEntry {
  id: string;
  date: string;
  employee: string;
  workType: string;
  equipment: string;
  hours: number;
}

interface ProjectProfileProps {
  project: Project;
  onBack: () => void;
}

export function ProjectProfile({ project, onBack }: ProjectProfileProps) {
  // Sample time entries for the project
  const timeEntries: TimeEntry[] = [];
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>(project);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
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

  const totalEntries = timeEntries.length;
  const uniqueEmployees = new Set(timeEntries.map(e => e.employee)).size;
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

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

  const handleSave = () => {
    // In a real application, this would save to a backend
    // For now, we just update the local state and exit edit mode
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const formatCurrency = (value?: string) => {
    if (!value) return 'Not set';
    return value;
  };

  const projectValueOptions = [
    '>$50m-$80m',
    '>$80m-$100m',
    '>$100m-$200m',
    '>$200m-$300m',
    '>$300m-$400m',
    '>$400m-$500m',
    '>$500m-$600m',
    '>$600m-$700m',
    '>$700m-$800m',
    '>$800m-$900m',
    '>$900m-$1b',
    '>$1b+',
  ];

  return (
    <div className="p-4 pb-24">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Button>

      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {!isEditing ? (
          // View Mode
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-gray-900">{editedProject.name}</h1>
                  <Badge variant="outline" className={`${getStatusColor(editedProject.status)} text-xs capitalize`}>
                    {editedProject.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">{editedProject.client}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{editedProject.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(editedProject.startDate)} - {formatDate(editedProject.endDate)}</span>
                  </div>
                </div>
                
                {/* Project Value Display */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Project Value: <span className="text-gray-900">{formatCurrency(editedProject.projectValue)}</span></span>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Total Entries</div>
                <div className="text-blue-600 text-lg">{totalEntries}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Unique Employees</div>
                <div className="text-green-600 text-lg">{uniqueEmployees}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-gray-600 text-xs mb-1">Total Hours</div>
                <div className="text-blue-600 text-lg">{totalHours.toFixed(0)}</div>
              </div>
            </div>
          </>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">Edit Project Details</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className="gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={editedProject.name}
                  onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={editedProject.client}
                  onChange={(e) => setEditedProject({ ...editedProject, client: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="address">Location</Label>
                <Input
                  id="address"
                  value={editedProject.address}
                  onChange={(e) => setEditedProject({ ...editedProject, address: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="projectValue">Project Value</Label>
                <Select
                  id="projectValue"
                  value={editedProject.projectValue || ''}
                  onChange={(e) => setEditedProject({ 
                    ...editedProject, 
                    projectValue: e.target.value ? e.target.value : undefined 
                  })}
                  className="mt-2"
                >
                  <option value="">Select a value</option>
                  {projectValueOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Entries Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Time Entries</h2>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {timeEntries.map((entry) => {
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
                    <h3 className="text-gray-900">{entry.employee}</h3>
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
                      <span className="text-gray-600">Work Type:</span>
                      <span className="text-gray-900">{entry.workType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Equipment:</span>
                      <span className="text-gray-900">{entry.equipment}</span>
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
            <div className="col-span-3">Employee</div>
            <div className="col-span-3">Work Type</div>
            <div className="col-span-3">Equipment</div>
            <div className="col-span-1 text-right">Hours</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-2 text-gray-500">{formatDate(entry.date)}</div>
                <div className="col-span-3 text-gray-900">{entry.employee}</div>
                <div className="col-span-3 text-gray-500">{entry.workType}</div>
                <div className="col-span-3 text-gray-500">{entry.equipment}</div>
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