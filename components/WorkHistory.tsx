"use client"
import { useState } from 'react';
import { TimeEntry, Employee } from '@/lib/types';
import { Badge } from './ui/badge';
import { Calendar, User, Mail, Briefcase, Phone, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';

interface WorkHistoryProps {
  entries: TimeEntry[];
  employee: Employee;
}

interface ProjectRow {
  date: string;
  depotStart: string;
  depotFinish: string;
  project: string;
  siteStart: string;
  siteFinish: string;
  hours: number;
  weather: boolean;
  weatherType?: string;
  lunch: boolean;
  lunchPenalty: boolean;
}

interface WeekGroup {
  weekLabel: string;
  weekStart: Date;
  weekEnd: Date;
  totalHours: number;
  projectCount: number;
  rows: ProjectRow[];
}

export function WorkHistory({ entries, employee }: WorkHistoryProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const toggleWeek = (weekLabel: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekLabel)) {
        newSet.delete(weekLabel);
      } else {
        newSet.add(weekLabel);
      }
      return newSet;
    });
  };

  // Filter only approved entries and flatten to project rows
  const projectRows: ProjectRow[] = entries
    .filter(entry => entry.status === 'approved' && entry.projects.length > 0)
    .flatMap(entry => 
      entry.projects.map(project => {
        const [startHour, startMin] = project.siteStart.split(':').map(Number);
        const [finishHour, finishMin] = project.siteFinish.split(':').map(Number);
        const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
        return {
          date: entry.date,
          depotStart: entry.depotStart,
          depotFinish: entry.depotFinish,
          project: project.project,
          siteStart: project.siteStart,
          siteFinish: project.siteFinish,
          hours: hours - (project.lunchPenalty ? 0.5 : 0),
          weather: project.weather,
          weatherType: project.weatherType,
          lunch: project.lunch,
          lunchPenalty: project.lunchPenalty,
        };
      })
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatWeekLabel = (weekStart: Date, weekEnd: Date) => {
    return `${formatDate(weekStart.toISOString().split('T')[0])} - ${formatDate(weekEnd.toISOString().split('T')[0])}`;
  };

  // Calculate summary stats
  const totalHoursWorked = projectRows.reduce((sum, row) => sum + row.hours, 0);
  const totalProjects = projectRows.length;
  const uniqueProjectNames = new Set(projectRows.map(row => row.project)).size;

  // Calculate tenure
  const startDate = new Date(employee.startDate);
  const today = new Date();
  const tenureMonths = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const tenureYears = Math.floor(tenureMonths / 12);
  const remainingMonths = tenureMonths % 12;
  const tenureText = tenureYears > 0 
    ? `${tenureYears}y ${remainingMonths}m` 
    : `${remainingMonths}m`;

  // Group project rows by week
  const weekGroups: WeekGroup[] = projectRows.reduce((groups, row) => {
    const date = new Date(row.date);
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    const weekEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - date.getDay()));
    const weekLabel = formatWeekLabel(weekStart, weekEnd);

    const existingGroup = groups.find(group => group.weekLabel === weekLabel);
    if (existingGroup) {
      existingGroup.rows.push(row);
      existingGroup.totalHours += row.hours;
      existingGroup.projectCount += 1;
    } else {
      groups.push({
        weekLabel,
        weekStart,
        weekEnd,
        totalHours: row.hours,
        projectCount: 1,
        rows: [row],
      });
    }
    return groups;
  }, [] as WeekGroup[]);

  return (
    <div className="pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-xs mb-1">Total Hours</div>
          <div className="text-blue-600 text-sm">{totalHoursWorked.toFixed(1)}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-xs mb-1">Entries</div>
          <div className="text-blue-600 text-sm">{totalProjects}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-xs mb-1">Projects</div>
          <div className="text-blue-600 text-sm">{uniqueProjectNames}</div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-gray-900">Approved Work History</h2>
        </div>
      </div>

      {projectRows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No approved work history yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekly Groups */}
          <div>
            {weekGroups.map((group, weekIndex) => {
              const isExpanded = expandedWeeks.has(group.weekLabel);
              return (
                <div key={weekIndex} className="border-b border-gray-200 last:border-b-0">
                  {/* Week Header - Collapsible */}
                  <button
                    onClick={() => toggleWeek(group.weekLabel)}
                    className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 text-left">
                      <div className="text-gray-900 mb-1">{group.weekLabel}</div>
                      <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600">
                        <span>{group.projectCount} {group.projectCount === 1 ? 'entry' : 'entries'}</span>
                        <span className="text-blue-600">{group.totalHours.toFixed(1)} hrs total</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Week Details - Collapsible */}
                  {isExpanded && (
                    <div className="bg-gray-50">
                      {/* Mobile Layout */}
                      <div className="md:hidden divide-y divide-gray-200">
                        {group.rows.map((row, rowIndex) => (
                          <div key={rowIndex} className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-gray-900">{row.project}</div>
                                <div className="text-xs text-gray-600">{formatDate(row.date)}</div>
                              </div>
                              <div className="text-blue-600">{row.hours.toFixed(1)} hrs</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-gray-600">
                                Time: <span className="text-gray-900">{row.depotStart} - {row.depotFinish}</span>
                              </div>
                              <div className="text-gray-600">
                                On-Site: <span className="text-gray-900">{row.siteStart} - {row.siteFinish}</span>
                              </div>
                            </div>

                            {/* Details badges */}
                            {(row.weather || row.lunch || row.lunchPenalty) && (
                              <div className="flex flex-wrap gap-1.5">
                                {row.weather && (
                                  <Badge variant="outline" className="text-xs">
                                    {row.weatherType || 'Weather'}
                                  </Badge>
                                )}
                                {row.lunch && (
                                  <Badge variant="outline" className="text-xs">
                                    Lunch
                                  </Badge>
                                )}
                                {row.lunchPenalty && (
                                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                    Penalty -0.5h
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Desktop Layout - Table */}
                      <div className="hidden md:block">
                        {/* Table Header */}
                        <div className="grid grid-cols-11 gap-3 bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
                          <div className="col-span-2">Date</div>
                          <div className="col-span-1">Sign On</div>
                          <div className="col-span-1">Sign Off</div>
                          <div className="col-span-3">Project</div>
                          <div className="col-span-1 text-center">Site Times</div>
                          <div className="col-span-1 text-center">Total</div>
                          <div className="col-span-2">Details</div>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-gray-200">
                          {group.rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-11 gap-3 items-center text-sm px-4 py-3 hover:bg-gray-100 transition-colors">
                              <div className="col-span-2 text-gray-900">{formatDate(row.date)}</div>
                              <div className="col-span-1 text-gray-700">{row.depotStart}</div>
                              <div className="col-span-1 text-gray-700">{row.depotFinish}</div>
                              <div className="col-span-3 text-gray-900">{row.project}</div>
                              <div className="col-span-1 text-center text-gray-700 text-xs">{row.siteStart} - {row.siteFinish}</div>
                              <div className="col-span-1 text-center text-blue-600">{row.hours.toFixed(1)}</div>
                              <div className="col-span-2">
                                <div className="flex flex-wrap gap-1">
                                  {row.weather && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      W
                                    </Badge>
                                  )}
                                  {row.lunch && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      L
                                    </Badge>
                                  )}
                                  {row.lunchPenalty && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0 text-orange-600 border-orange-600">
                                      LP
                                    </Badge>
                                  )}
                                </div>
                                {row.weather && row.weatherType && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {row.weatherType}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}