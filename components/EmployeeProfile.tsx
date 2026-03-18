"use client"
import { ArrowLeft, Mail, Phone, Clock, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
import { EditEmployeeModal } from './EditEmployeeModal';

interface Employee {
  id: string;
  name: string;
  classification: string;
  employmentType: string;
  email: string;
  phone: string;
  hoursThisWeek: number;
  status?: string;
}

interface TimeEntry {
  id: string;
  date: string;
  project: string;
  workType: string;
  equipment: string;
  hours: number;
}

interface EmployeeProfileProps {
  employee: Employee;
  onBack: () => void;
}

export function EmployeeProfile({ employee, onBack }: EmployeeProfileProps) {
  const [showEdit, setShowEdit] = useState(false);

  // Split name into first/last for the edit modal
  const nameParts = employee.name.split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") ?? "";

  // Sample time entries for the employee
  const timeEntries: TimeEntry[] = [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const totalEntries = timeEntries.length;
  const uniqueProjects = new Set(timeEntries.map(e => e.project)).size;
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

  return (
    <div className="p-4 pb-24">
      {showEdit && (
        <EditEmployeeModal
          employee={{
            id: employee.id,
            firstName,
            lastName,
            phone: employee.phone,
            classification: employee.classification,
            employmentType: employee.employmentType,
            role: "user",
            activeStatus: employee.status ?? "active",
          }}
          isAdmin={true}
          onClose={() => setShowEdit(false)}
        />
      )}

      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Button>

      {/* Employee Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-gray-900">{employee.name}</h1>
            </div>
            <p className="text-sm text-gray-500 mb-1">{employee.classification}</p>
            <p className="text-sm text-gray-500 mb-4">{employee.employmentType}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{employee.phone}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Entries</div>
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
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Avg Hrs/Wk</div>
            <div className="text-blue-600 text-lg">{employee.hoursThisWeek.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Work History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Work History</h2>
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
          <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div>Date</div>
            <div>Employee</div>
            <div>Sign On</div>
            <div>Sign Off</div>
            <div className="text-right">Time</div>
            <div className="text-center">Status</div>
            <div className="text-right">TC Number</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="text-gray-500">{formatDate(entry.date)}</div>
                <div className="text-gray-900">{entry.project}</div>
                <div className="text-gray-500">{entry.workType}</div>
                <div className="text-gray-500">{entry.equipment}</div>
                <div className="text-right text-blue-600">
                  {entry.hours.toFixed(1)}
                </div>
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Approved
                  </span>
                </div>
                <div className="text-right text-gray-500 text-xs">
                  N/A
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}