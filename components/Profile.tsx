"use client"
import { Mail, Phone, Clock, Settings, ChevronDown, ChevronUp, Car, Droplets, Wrench, AlertTriangle } from 'lucide-react';
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
  projectsByState?: { QLD: string[]; NSW: string[] };
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
  projectsByState,
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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateTotalHours = (entry: TimeEntry) => {
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const [sh, sm] = entry.depotStart.split(':').map(Number);
    const [fh, fm] = entry.depotFinish.split(':').map(Number);
    const hours = (fh * 60 + fm - sh * 60 - sm) / 60;
    const hasLunch = (entry.projects ?? []).some(p => p.lunch);
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
  const daysWithHours = submittedTimeCards.filter(e => calculateTotalHours(e) > 0).length;
  const avgHoursPerCard = daysWithHours > 0 ? (totalHours / daysWithHours).toFixed(1) : '0.0';

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
    const pad = (n: number) => String(n).padStart(2, '0');
    const monthStr = (dt: Date) => dt.toLocaleDateString('en-AU', { month: 'short' });
    const fmtDay = (dt: Date) => `${pad(dt.getDate())} ${monthStr(dt)}`;
    const fmtDayYear = (dt: Date) => `${pad(dt.getDate())} ${monthStr(dt)} ${dt.getFullYear()}`;
    if (mon.getFullYear() !== sun.getFullYear()) return `${fmtDayYear(mon)} – ${fmtDayYear(sun)}`;
    if (mon.getMonth() === sun.getMonth()) return `${pad(mon.getDate())} – ${fmtDayYear(sun)}`;
    return `${fmtDay(mon)} – ${fmtDayYear(sun)}`;
  };

  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(() => new Set());

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
          <div className="flex flex-col items-center gap-2 mb-5">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50 shrink-0">
              <span className="text-lg font-bold text-gray-700">{initials}</span>
            </div>
            <div className="text-center">
              <h1 className="text-gray-900 font-bold text-xl leading-tight">{employee.name}</h1>
              {classification && (
                <span className="text-sm text-gray-400 mt-0.5 block">
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
            Analytics
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
              <div>
                {/* Column headers */}
                <div className="flex items-center justify-between px-5 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Week</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider pr-6">Hrs</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {sortedWeekKeys.map((weekKey) => {
                    const weekEntries = weekGroups[weekKey];
                    const weekTotal = weekEntries.reduce((sum, e) => sum + calculateTotalHours(e), 0);
                    const isOpen = expandedWeeks.has(weekKey);

                    return (
                      <div key={weekKey}>
                        {/* Week header row */}
                        <button
                          onClick={() => toggleWeek(weekKey)}
                          className="w-full flex items-center justify-between px-5 py-2.5 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-gray-900">{formatWeekRange(weekKey)}</p>
                            <span className="text-xs text-gray-400">{weekEntries.length}d</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900">{weekTotal.toFixed(1)}</span>
                            {isOpen
                              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                              : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            }
                          </div>
                        </button>

                        {/* Expanded daily rows */}
                        {isOpen && (
                          <div className="divide-y divide-gray-100 border-l-4 border-l-blue-300">
                            {weekEntries.map((entry) => {
                              const hrs = calculateTotalHours(entry);
                              return (
                                <button
                                  key={entry.id}
                                  onClick={() => setSelectedTimeCard(entry)}
                                  className="w-full flex items-center justify-between pl-6 pr-5 py-1.5 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <p className="text-sm text-gray-700">{formatDate(entry.date)}</p>
                                    <p className="text-xs text-gray-400">
                                      {entry.timeCardNumber ?? (entry.status === 'draft' ? 'Draft' : '—')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">{hrs.toFixed(1)}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      entry.status === 'approved'
                                        ? 'bg-green-100 text-green-700'
                                        : entry.status === 'submitted'
                                        ? 'bg-[#030213] text-white'
                                        : 'bg-amber-500 text-white'
                                    }`}>
                                      {entry.status === 'approved' ? 'Approved' : entry.status === 'submitted' ? 'Pending' : 'Draft'}
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics tab */}
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

          {/* Activity Breakdown */}
          {(() => {
            const subHours = (start: string, finish: string) => {
              if (!start || !finish) return 0;
              const [sh, sm] = start.split(':').map(Number);
              const [fh, fm] = finish.split(':').map(Number);
              return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
            };
            let totalTravel = 0, totalPouring = 0, totalNonPouring = 0;
            localEntries.forEach(entry => {
              (entry.projects ?? []).forEach(project => {
                (project.subActivities ?? []).forEach(sa => {
                  const h = subHours(sa.start, sa.finish);
                  if (sa.type === 'travel') totalTravel += h;
                  else if (sa.type === 'pouring') totalPouring += h;
                  else if (sa.type === 'non-pouring') totalNonPouring += h;
                });
              });
            });
            const grandTotal = totalTravel + totalPouring + totalNonPouring;
            const pct = (val: number) => grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0;
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity Breakdown</p>
                <div className="space-y-3">
                  {[
                    { label: 'Travel', hrs: totalTravel, icon: <Car className="w-4 h-4" />, color: 'bg-blue-400' },
                    { label: 'Pouring', hrs: totalPouring, icon: <Droplets className="w-4 h-4" />, color: 'bg-cyan-400' },
                    { label: 'Non-Pouring', hrs: totalNonPouring, icon: <Wrench className="w-4 h-4" />, color: 'bg-orange-400' },
                  ].map(({ label, hrs, icon, color }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">{icon}{label}</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {hrs.toFixed(1)}h <span className="text-xs font-normal text-gray-400">({pct(hrs)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct(hrs)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {grandTotal > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                    <span>Total activity hours</span>
                    <span className="font-semibold text-gray-700">{grandTotal.toFixed(1)}h</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Non-Allocated Hours */}
          {(() => {
            const subHours = (s: string, f: string) => {
              if (!s || !f) return 0;
              const [sh, sm] = s.split(':').map(Number);
              const [fh, fm] = f.split(':').map(Number);
              return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
            };
            let totalNonAlloc = 0;
            const weekSet = new Set<string>();
            localEntries.forEach(entry => {
              const depotHrs = calculateTotalHours(entry);
              if (depotHrs <= 0) return;
              let allocated = 0;
              (entry.projects ?? []).forEach(p => {
                if (p.type === 'yardwork') {
                  allocated += subHours(p.siteStart, p.siteFinish);
                  if (p.lunch) allocated -= 0.5;
                } else if (p.type === 'leave') {
                  allocated += parseFloat(p.leaveTotalHours || '0');
                } else {
                  (p.subActivities ?? []).forEach(sa => { allocated += subHours(sa.start, sa.finish); });
                }
              });
              totalNonAlloc += Math.max(0, depotHrs - allocated);
              // Track unique weeks
              const d = new Date(entry.date);
              d.setHours(0, 0, 0, 0);
              const dow = d.getDay();
              const mon = new Date(d);
              mon.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
              weekSet.add(mon.toISOString().split('T')[0]);
            });
            const avgPerWeek = weekSet.size > 0 ? totalNonAlloc / weekSet.size : 0;
            if (totalNonAlloc === 0) return null;
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Non-Allocated Hours</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center bg-red-50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-2xl font-bold text-gray-900">{totalNonAlloc.toFixed(1)}</p>
                    </div>
                    <p className="text-xs text-gray-400">Total hrs</p>
                  </div>
                  <div className="text-center bg-red-50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-2xl font-bold text-gray-900">{avgPerWeek.toFixed(1)}</p>
                    </div>
                    <p className="text-xs text-gray-400">Avg hrs / week</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Pouring Split */}
          {(() => {
            const subHours = (start: string, finish: string) => {
              if (!start || !finish) return 0;
              const [sh, sm] = start.split(':').map(Number);
              const [fh, fm] = finish.split(':').map(Number);
              return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
            };
            let mobile = 0, placingBoom = 0;
            localEntries.forEach(entry => {
              (entry.projects ?? []).forEach(project => {
                (project.subActivities ?? []).forEach(sa => {
                  if (sa.type !== 'pouring') return;
                  const h = subHours(sa.start, sa.finish);
                  if (sa.activityType === 'Mobile') mobile += h;
                  else if (sa.activityType === 'Placing Boom / Skid Pump') placingBoom += h;
                });
              });
            });
            const total = mobile + placingBoom;
            const mobilePct = total > 0 ? (mobile / total) * 100 : 50;
            const boomPct = total > 0 ? (placingBoom / total) * 100 : 50;
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Pouring Breakdown</p>
                {total === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No pouring data yet</p>
                ) : (
                  <>
                    {/* Split bar */}
                    <div className="flex h-8 rounded-xl overflow-hidden mb-4 gap-0.5">
                      {mobile > 0 && (
                        <div className="bg-cyan-400 flex items-center justify-center text-white text-xs font-semibold transition-all" style={{ width: `${mobilePct}%` }}>
                          {mobilePct >= 15 && `${Math.round(mobilePct)}%`}
                        </div>
                      )}
                      {placingBoom > 0 && (
                        <div className="bg-blue-500 flex items-center justify-center text-white text-xs font-semibold transition-all" style={{ width: `${boomPct}%` }}>
                          {boomPct >= 15 && `${Math.round(boomPct)}%`}
                        </div>
                      )}
                    </div>
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Mobile</p>
                          <p className="text-sm font-bold text-gray-900">{mobile.toFixed(1)}h</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Placing Boom</p>
                          <p className="text-sm font-bold text-gray-900">{placingBoom.toFixed(1)}h</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                      <span>Total pouring hours</span>
                      <span className="font-semibold text-gray-700">{total.toFixed(1)}h</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Heatmap */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
            <div className="md:hidden">
              <WorkHeatmap entries={localEntries} calculateHours={calculateTotalHours} weeksCount={13} />
            </div>
            <div className="hidden md:block">
              <WorkHeatmap entries={localEntries} calculateHours={calculateTotalHours} weeksCount={52} />
            </div>
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
          projectsByState={projectsByState}
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
