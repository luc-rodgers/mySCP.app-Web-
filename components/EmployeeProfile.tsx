"use client"
import { ArrowLeft, Mail, Phone, Clock, Settings, ChevronDown, ChevronUp, Car, Droplets, Wrench, UserPlus, CheckCircle2, CircleDashed, AlertTriangle, Share2 } from 'lucide-react';
import { inviteEmployee } from '@/app/actions/inviteEmployee';
import { generateInviteLink } from '@/app/actions/generateInviteLink';
import { TimeEntry } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';
import { TimeEntryEditorModal } from './TimeEntryEditorModal';
import { EditEmployeeModal } from './EditEmployeeModal';
import { WorkHeatmap } from './WorkHeatmap';

interface Employee {
  id: string;
  name: string;
  classification: string;
  employmentType: string;
  email: string;
  phone: string;
  hoursThisWeek: number;
  status?: string;
  accountStatus?: 'none' | 'pending' | 'confirmed';
}

interface EmployeeProfileProps {
  employee: Employee;
  onBack: () => void;
  isAdmin?: boolean;
  onUpdate?: (updated: Employee) => void;
}

export function EmployeeProfile({ employee, onBack, isAdmin = false, onUpdate }: EmployeeProfileProps) {

  const [localEmployee, setLocalEmployee] = useState(employee);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [selectedTimeCard, setSelectedTimeCard] = useState<TimeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch this employee's time entries + active projects
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: rows }, { data: projectRows }] = await Promise.all([
        supabase
          .from('time_entries')
          .select('id, date, status, reference_number, data')
          .eq('employee_id', localEmployee.id)
          .order('date', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name')
          .eq('status', 'active')
          .order('name'),
      ]);

      if (rows) {
        const seen = new Set<string>();
        const mapped: TimeEntry[] = [];
        for (const row of rows) {
          if (seen.has(row.date)) continue;
          seen.add(row.date);
          mapped.push({
            ...(row.data as Partial<TimeEntry>),
            id: row.id,
            date: row.date,
            status: row.status as TimeEntry['status'],
            employeeName: localEmployee.name,
            timeCardNumber: (row as any).reference_number ?? (row.data as any)?.timeCardNumber ?? undefined,
          } as TimeEntry);
        }
        setEntries(mapped);
      }

      if (projectRows) {
        setActiveProjects(projectRows.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localEmployee.id]);

  const firstName = localEmployee.name.split(' ')[0] ?? '';
  const lastName = localEmployee.name.split(' ').slice(1).join(' ') ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';

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

  const totalTimeCards = entries.length;
  const totalHours = entries.reduce((sum, e) => sum + calculateTotalHours(e), 0);
  const daysWithHours = entries.filter(e => calculateTotalHours(e) > 0).length;
  const avgHoursPerCard = daysWithHours > 0 ? (totalHours / daysWithHours).toFixed(1) : '0.0';

  // Group by week (Monday as week start)
  const getMondayKey = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const weekGroups: Record<string, TimeEntry[]> = {};
  sortedEntries.forEach(entry => {
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

      {/* Back button */}
      <div className="mx-4 mb-4 flex justify-center md:justify-start">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </button>
      </div>

      {/* Profile card */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Gear menu */}
          {isAdmin && (
            <div className="flex justify-end mb-2" ref={menuRef}>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <button
                      onClick={() => { setShowEdit(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Edit Employee
                    </button>
                    {localEmployee.email && (
                      <>
                        <button
                          onClick={async () => {
                            setShowMenu(false);
                            setInviting(true);
                            setInviteMessage(null);
                            const result = await inviteEmployee(localEmployee.id);
                            setInviting(false);
                            if (result.success) {
                              const newStatus = result.action === 'reset' ? 'confirmed' : 'pending';
                              setLocalEmployee(e => ({ ...e, accountStatus: newStatus }));
                              onUpdate?.({ ...localEmployee, accountStatus: newStatus });
                              setInviteMessage({ ok: true, text: result.action === 'reset' ? 'Password reset sent!' : 'Invite sent!' });
                            } else {
                              setInviteMessage({ ok: false, text: result.error });
                            }
                            setTimeout(() => setInviteMessage(null), 4000);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          {localEmployee.accountStatus === 'confirmed' ? 'Send Pswd Reset'
                            : localEmployee.accountStatus === 'pending' ? 'Resend Invite'
                            : 'Send Invite'}
                        </button>
                        <button
                          onClick={async () => {
                            setShowMenu(false);
                            setInviting(true);
                            setInviteMessage(null);
                            const result = await generateInviteLink(localEmployee.id);
                            setInviting(false);
                            if (!result.success) {
                              setInviteMessage({ ok: false, text: result.error });
                              setTimeout(() => setInviteMessage(null), 4000);
                              return;
                            }
                            const newStatus = result.action === 'reset' ? 'confirmed' : 'pending';
                            setLocalEmployee(e => ({ ...e, accountStatus: newStatus }));
                            onUpdate?.({ ...localEmployee, accountStatus: newStatus });
                            const shareText = result.action === 'reset'
                              ? "Reset your MySCP password:"
                              : "You've been added to MySCP. Activate your account:";
                            const nav = typeof navigator !== 'undefined' ? navigator : null;
                            try {
                              if (nav && typeof nav.share === 'function') {
                                await nav.share({
                                  title: result.action === 'reset' ? 'MySCP password reset' : 'MySCP invite',
                                  text: shareText,
                                  url: result.url,
                                });
                                setInviteMessage({ ok: true, text: 'Link shared. Old link no longer works.' });
                              } else if (nav?.clipboard) {
                                await nav.clipboard.writeText(result.url);
                                setInviteMessage({ ok: true, text: 'Link copied. Old link no longer works.' });
                              } else {
                                setInviteMessage({ ok: false, text: 'Sharing not supported in this browser.' });
                              }
                            } catch (err) {
                              if ((err as Error)?.name === 'AbortError') {
                                setInviteMessage(null);
                                return;
                              }
                              try {
                                if (nav?.clipboard) {
                                  await nav.clipboard.writeText(result.url);
                                  setInviteMessage({ ok: true, text: 'Link copied. Old link no longer works.' });
                                } else {
                                  setInviteMessage({ ok: false, text: 'Could not share or copy link.' });
                                }
                              } catch {
                                setInviteMessage({ ok: false, text: 'Could not share or copy link.' });
                              }
                            }
                            setTimeout(() => setInviteMessage(null), 4000);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share invite link
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2 mb-5">
            <div className="relative w-14 h-14 shrink-0">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50">
                <span className="text-lg font-bold text-gray-700">{initials}</span>
              </div>
              {isAdmin && (
                <div className="absolute bottom-0 right-0">
                  {localEmployee.accountStatus === 'confirmed'
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 bg-white rounded-full" />
                    : localEmployee.accountStatus === 'pending'
                    ? <div className="w-4 h-4 rounded-full border-2 border-blue-400 bg-white flex items-center justify-center"><Mail className="w-2 h-2 text-blue-400" /></div>
                    : <CircleDashed className="w-4 h-4 text-gray-300 bg-white rounded-full" />}
                </div>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-gray-900 font-bold text-xl leading-tight">{localEmployee.name}</h1>
              {localEmployee.classification && (
                <span className="text-sm text-gray-400 mt-0.5 block">
                  {localEmployee.classification}
                </span>
              )}
              {inviting && <p className="text-xs text-gray-400 mt-1">Sending invite…</p>}
              {inviteMessage && (
                <p className={`text-xs mt-1 ${inviteMessage.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {inviteMessage.text}
                </p>
              )}
            </div>
          </div>

          {/* Contact info */}
          {(localEmployee.email || localEmployee.phone) && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
              {localEmployee.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{localEmployee.email}</span>
                </div>
              )}
              {localEmployee.phone && (
                <a href={`tel:${localEmployee.phone}`} className="flex items-center gap-2 hover:text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{localEmployee.phone}</span>
                </a>
              )}
            </div>
          )}
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
            {loading ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">Loading…</p>
              </div>
            ) : sortedWeekKeys.length === 0 ? (
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
            entries.forEach(entry => {
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


          {/* Pouring Split */}
          {(() => {
            const subHours = (start: string, finish: string) => {
              if (!start || !finish) return 0;
              const [sh, sm] = start.split(':').map(Number);
              const [fh, fm] = finish.split(':').map(Number);
              return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
            };
            let mobile = 0, placingBoom = 0;
            entries.forEach(entry => {
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

          {/* Non-Allocated Hours */}
          {(() => {
            const subHrs = (s: string, f: string) => {
              if (!s || !f) return 0;
              const [sh, sm] = s.split(':').map(Number);
              const [fh, fm] = f.split(':').map(Number);
              return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
            };
            let totalNonAlloc = 0;
            const weekSet = new Set<string>();
            entries.forEach(entry => {
              const depotHrs = calculateTotalHours(entry);
              if (depotHrs <= 0) return;
              let allocated = 0;
              (entry.projects ?? []).forEach(p => {
                if (p.type === 'yardwork') { allocated += subHrs(p.siteStart, p.siteFinish); if (p.lunch) allocated -= 0.5; }
                else if (p.type === 'leave') { allocated += parseFloat(p.leaveTotalHours || '0'); }
                else { (p.subActivities ?? []).forEach(sa => { allocated += subHrs(sa.start, sa.finish); }); }
              });
              totalNonAlloc += Math.max(0, depotHrs - allocated);
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

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</p>
            <div className="md:hidden">
              <WorkHeatmap entries={entries} calculateHours={calculateTotalHours} weeksCount={13} />
            </div>
            <div className="hidden md:block">
              <WorkHeatmap entries={entries} calculateHours={calculateTotalHours} weeksCount={52} />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <EditEmployeeModal
          onDeleted={onBack}
          employee={{
            id: localEmployee.id,
            firstName,
            lastName,
            email: localEmployee.email,
            phone: localEmployee.phone,
            classification: localEmployee.classification,
            employmentType: localEmployee.employmentType,
            role: localEmployee.role ?? 'user',
            activeStatus: localEmployee.status ?? 'active',
          }}
          isAdmin={isAdmin}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            const merged: Employee = {
              ...localEmployee,
              name: `${updated.firstName ?? ''} ${updated.lastName ?? ''}`.trim() || localEmployee.name,
              email: updated.email ?? localEmployee.email,
              phone: updated.phone ?? localEmployee.phone,
              classification: updated.classification ?? localEmployee.classification,
              employmentType: updated.employmentType ?? localEmployee.employmentType,
              role: updated.role ?? localEmployee.role,
              status: updated.activeStatus === 'retired' ? 'retired' : 'active',
            };
            setLocalEmployee(merged);
            onUpdate?.(merged);
            setShowEdit(false);
          }}
        />
      )}

      {selectedTimeCard && (
        <TimeCardSummaryModal
          entry={selectedTimeCard}
          isOpen={true}
          onClose={() => setSelectedTimeCard(null)}
          viewOnly={true}
          onEdit={isAdmin ? () => {
            const tc = selectedTimeCard;
            setSelectedTimeCard(null);
            setEditingEntry(tc);
          } : undefined}
        />
      )}

      {editingEntry && isAdmin && (
        <TimeEntryEditorModal
          initialEntry={editingEntry}
          employeeDbId={localEmployee.id}
          activeProjects={activeProjects}
          onClose={() => setEditingEntry(null)}
          onDeleted={() => {
            setEntries(prev => prev.filter(e => e.id !== editingEntry?.id));
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
}
