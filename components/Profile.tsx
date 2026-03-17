"use client"
import { Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { Employee, TimeEntry } from '@/lib/types';
import { useState } from 'react';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';

interface ProfileProps {
  employee: Employee;
  entries?: TimeEntry[];
}

export function Profile({ employee, entries = [] }: ProfileProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedTimeCard, setSelectedTimeCard] = useState<TimeEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  // Filter submitted and approved time cards
  const submittedTimeCards = entries
    .filter(entry => entry.status === 'submitted' || entry.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate total hours for a time card
  const calculateTotalHours = (entry: TimeEntry) => {
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const [startHour, startMin] = entry.depotStart.split(':').map(Number);
    const [finishHour, finishMin] = entry.depotFinish.split(':').map(Number);
    const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
    const hasLunch = entry.projects.some(project => project.lunch);
    return Math.max(0, hours - (hasLunch ? 0.5 : 0));
  };

  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const totalTimeCards = submittedTimeCards.length;
  const totalHours = submittedTimeCards.reduce((sum, entry) => sum + calculateTotalHours(entry), 0);
  const avgHoursPerCard = totalTimeCards > 0 ? (totalHours / totalTimeCards).toFixed(1) : '0.0';

  return (
    <div className="p-4 pb-24">
      {/* Employee Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-gray-900">{employee.name}</h1>
            </div>
            <p className="text-sm text-gray-500 mb-1">{employee.classification}</p>
            <p className="text-sm text-gray-500 mb-4">Permanent</p>

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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Submitted Time Cards</div>
            <div className="text-blue-600 text-lg">{totalTimeCards}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Avg Hrs/Day</div>
            <div className="text-blue-600 text-lg">{avgHoursPerCard}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Hours</div>
            <div className="text-blue-600 text-lg">{totalHours.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Work History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Work History</h2>
        </div>

        {submittedTimeCards.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No work history yet</p>
          </div>
        ) : (
          <>
            {/* Mobile Layout */}
            <div className="md:hidden divide-y divide-gray-200">
              {submittedTimeCards.map((entry) => {
                const totalHours = calculateTotalHours(entry);
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedTimeCard(entry)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Simplified View */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">{formatDate(entry.date)}</div>
                        <h3 className="text-gray-900 text-xs">{entry.timeCardNumber || 'N/A'}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">{totalHours.toFixed(2)} hrs</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entry.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Desktop Layout - Table */}
            <div className="hidden md:block overflow-x-auto">
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
                {submittedTimeCards.map((entry) => {
                  const totalHours = calculateTotalHours(entry);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedTimeCard(entry)}
                      className="w-full grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="text-gray-500">{formatDate(entry.date)}</div>
                      <div className="text-gray-900">{entry.employeeName || employee.name}</div>
                      <div className="text-gray-500">{entry.depotStart || '--:--'}</div>
                      <div className="text-gray-500">{entry.depotFinish || '--:--'}</div>
                      <div className="text-right text-blue-600">
                        {totalHours.toFixed(2)}
                      </div>
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {entry.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-right text-gray-500 text-xs">
                        {entry.timeCardNumber || 'N/A'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Time Card Summary Modal */}
      {selectedTimeCard && (
        <TimeCardSummaryModal
          entry={selectedTimeCard}
          isOpen={true}
          onClose={() => {
            setSelectedTimeCard(null);
            setIsEditMode(false);
          }}
          viewOnly={!isEditMode}
          onEdit={() => setIsEditMode(true)}
        />
      )}
    </div>
  );
}