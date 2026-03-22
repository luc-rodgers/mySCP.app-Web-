"use client"
import { Mail, Phone, Clock, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Employee, TimeEntry } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';
import { TimeEntryEditorModal } from './TimeEntryEditorModal';
import { EditEmployeeModal } from './EditEmployeeModal';
import { WorkHeatmap } from './WorkHeatmap';

interface ProfileProps {
  employee: Employee;
  entries?: TimeEntry[];
  employeeId: string;
  employeeDbId?: string;
  activeProjects?: string[];
  firstName: string;
  lastName: string;
  classification: string;
  employmentType: string;
  role: string;
  showClaimAdmin?: boolean;
}

export function Profile({
  employee,
  entries = [],
  employeeId,
  employeeDbId,
  activeProjects = [],
  firstName,
  lastName,
  classification,
  employmentType,
  role,
}: ProfileProps) {
  const [localEntries, setLocalEntries] = useState<TimeEntry[]>(entries);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTimeCard, setSelectedTimeCard] = useState<TimeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
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

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

  const submittedTimeCards = localEntries
    .filter(e => e.status === 'submitted' || e.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateTotalHours = (entry: TimeEntry) => {
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const [sh, sm] = entry.depotStart.split(':').map(Number);
    const [fh, fm] = entry.depotFinish.split(':').map(Number);
    const hours = (fh * 60 + fm - sh * 60 - sm) / 60;
    const hasLunch = entry.projects.some(p => p.lunch);
    return Math.max(0, hours - (hasLunch ? 0.5 : 0));
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const totalTimeCards = submittedTimeCards.length;
  const totalHours = submittedTimeCards.reduce((sum, e) => sum + calculateTotalHours(e), 0);
  const avgHoursPerCard = totalTimeCards > 0 ? (totalHours / totalTimeCards).toFixed(1) : '0.0';

  // Group time cards by week (Monday as week start)
  const getMondayKey = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const weekGroups: Record<string, typeof submittedTimeCards> = {};
  submittedTimeCards.forEach(entry => {
    const key = getMondayKey(entry.date);
    if (!weekGroups[key]) weekGroups[key] = [];
    weekGroups[key].push(entry);
  });

  const sortedWeekKeys = Object.keys(weekGroups).sort((a, b) => b.localeCompare(a));

  const formatWeekRange = (mondayKey: string): string => {
    const [y, m, d] = mondayKey.split('-').map(Number);
    const mon = new Date(y, m - 1, d);
    const sun = new Date(y, m - 1, d + 6);
    const fmtDay = (dt: Date) => dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const fmtDayYear = (dt: Date) => dt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    // Week spans two years  e.g. "29 Dec 2025 – 4 Jan 2026"
    if (mon.getFullYear() !== sun.getFullYear()) {
      return `${fmtDayYear(mon)} – ${fmtDayYear(sun)}`;
    }
    // Same month  e.g. "3 – 9 Mar 2026"
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()} – ${fmtDayYear(sun)}`;
    }
    // Different months, same year  e.g. "28 Mar – 3 Apr 2026"
    return `${fmtDay(mon)} – ${fmtDayYear(sun)}`;
  };

  // Default: most recent week open
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    () => new Set(sortedWeekKeys.length > 0 ? [sortedWeekKeys[0]] : [])
  );

  const toggleWeek = (key: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f3f5] pb-24 pt-4">

      {/* Profile card */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Gear menu */}
          <div className="flex justify-end mb-2" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => { setShowEdit(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50 shrink-0">
              <span className="text-lg font-bold text-gray-700">{initials}</span>
            </div>
            <div>
              <h1 className="text-gray-900 font-bold text-xl leading-tight">{employee.name}</h1>
              {classification && (
                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full mt-1 inline-block">
                  {classification}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Tab toggle */}
      <div className="mx-4 mb-4">
        <div className="flex bg-gray-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Work History
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Work History tab */}
      {activeTab === 'history' && (
        <div className="mx-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {sortedWeekKeys.length === 0 ? (
              <div className="py-10 text-center">
                <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No work history yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedWeekKeys.map((weekKey) => {
                  const weekEntries = weekGroups[weekKey];
                  const weekTotal = weekEntries.reduce((sum, e) => sum + calculateTotalHours(e), 0);
                  const isOpen = expandedWeeks.has(weekKey);

                  return (
                    <div key={weekKey}>
                      <button
                        onClick={() => toggleWeek(weekKey)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatWeekRange(weekKey)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {weekEntries.length} {weekEntries.length === 1 ? 'day' : 'days'} worked
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-800">{weekTotal.toFixed(2)} hrs</span>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 divide-y divide-gray-100">
                          {weekEntries.map((entry) => {
                            const hrs = calculateTotalHours(entry);
                            return (
                              <button
                                key={entry.id}
                                onClick={() => setSelectedTimeCard(entry)}
                                className="w-full flex items-center justify-between pl-8 pr-5 py-3 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{entry.timeCardNumber || 'No TC #'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-700">{hrs.toFixed(2)} hrs</span>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    entry.status === 'approved'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}>
                                    {entry.status === 'approved' ? 'Approved' : 'Pending'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics tab */}
      {activeTab === 'stats' && (
        <div className="mx-4 space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">{totalTimeCards}</p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">Days Worked</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">{avgHoursPerCard}</p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">Avg Hrs/Day</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">{totalHours.toFixed(0)}</p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">Total Hours</p>
            </div>
          </div>

          {/* Heatmap */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
            <WorkHeatmap entries={localEntries} calculateHours={calculateTotalHours} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <EditEmployeeModal
          employee={{
            id: employeeId,
            firstName,
            lastName,
            email: employee.email,
            phone: employee.phone,
            classification,
            employmentType,
            role,
            activeStatus: 'active',
          }}
          isAdmin={true}
          onClose={() => setShowEdit(false)}
        />
      )}

      {selectedTimeCard && (
        <TimeCardSummaryModal
          entry={selectedTimeCard}
          isOpen={true}
          onClose={() => setSelectedTimeCard(null)}
          viewOnly={true}
          onEdit={employeeDbId ? () => {
            const tc = selectedTimeCard;
            setSelectedTimeCard(null);
            setEditingEntry(tc);
          } : undefined}
        />
      )}

      {editingEntry && employeeDbId && (
        <TimeEntryEditorModal
          initialEntry={editingEntry}
          employeeDbId={employeeDbId}
          activeProjects={activeProjects}
          onClose={() => setEditingEntry(null)}
          onDeleted={() => {
            setLocalEntries(prev => prev.filter(e => e.id !== editingEntry?.id));
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
