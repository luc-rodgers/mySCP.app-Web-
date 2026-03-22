"use client"
import { ArrowLeft, MapPin, DollarSign, Edit2, X, Check, Trash2, Car, Droplets, Wrench, Loader2, Settings } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updateProject } from '@/app/actions/updateProject';
import { deleteProject } from '@/app/actions/deleteProject';
import { WorkHeatmap } from './WorkHeatmap';
import { TimeEntryEditorModal } from './TimeEntryEditorModal';
import { TimeEntry } from '@/lib/types';

interface WorkHistoryRow {
  id: string;
  date: string;
  status: string;
  pump: string;
  employeeName: string;
  employeeDbId: string;
  hours: number;
  activities: { travel: number; pouring: number; nonPouring: number };
  entryData: TimeEntry;
}

interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  state?: string;
  status: string;
  startDate: string;
  endDate: string;
  hoursLogged: number;
  projectValue?: string;
}

interface ProjectProfileProps {
  project: Project;
  onBack: () => void;
  isAdmin?: boolean;
  onUpdate?: (updated: Project) => void;
  onDeleted?: () => void;
}

const PROJECT_VALUE_OPTIONS = [
  '>$50m-$80m',
  '>$80m-$100m',
  '>$100m-$200m',
  '>$200m-$500m',
  '>$500m-$1b',
  '>$1b+',
];

function HistoryStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft:     'bg-amber-500 text-white border-amber-500',
    submitted: 'bg-[#030213] text-white border-[#030213]',
    approved:  'bg-green-100 text-green-700 border-green-200',
  };
  const labels: Record<string, string> = {
    draft:     'Draft',
    submitted: 'Pending',
    approved:  'Approved',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? styles.draft}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function ProjectProfile({ project, onBack, isAdmin = false, onUpdate, onDeleted }: ProjectProfileProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedProject, setEditedProject] = useState<Project>(project);

  const [workHistory, setWorkHistory] = useState<WorkHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [openEntry, setOpenEntry] = useState<WorkHistoryRow | null>(null);

  const calculateHours = useCallback((entry: any): number => {
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const [sh, sm] = (entry.depotStart as string).split(':').map(Number);
    const [fh, fm] = (entry.depotFinish as string).split(':').map(Number);
    const hours = (fh * 60 + fm - sh * 60 - sm) / 60;
    const hasLunch = (entry.projects ?? []).some((p: any) => p.lunch);
    return Math.max(0, hours - (hasLunch ? 0.5 : 0));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      setLoadingHistory(true);
      const supabase = createClient();
      // Fetch all entries and filter client-side by project name for reliability
      const { data, error } = await supabase
        .from('time_entries')
        .select('id, date, status, reference_number, employee_id, data, employees(first_name, last_name)')
        .order('date', { ascending: false });

      console.log('[ProjectProfile] project name:', editedProject.name);
      console.log('[ProjectProfile] total rows fetched:', data?.length);
      console.log('[ProjectProfile] error:', error);
      if (error || !data) { setLoadingHistory(false); return; }

      const filtered = data.filter((row: any) =>
        (row.data?.projects ?? []).some((p: any) => p.project === editedProject.name)
      );
      console.log('[ProjectProfile] matched rows:', filtered.length);

      function subHours(siteStart: string, siteFinish: string): number {
        if (!siteStart || !siteFinish) return 0;
        const [sh, sm] = siteStart.split(':').map(Number);
        const [fh, fm] = siteFinish.split(':').map(Number);
        return Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
      }

      const rows: WorkHistoryRow[] = filtered.map((row: any) => {
        const entry = row.data as any;
        const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
        const projectActivities = (entry.projects ?? [])
          .filter((p: any) => p.project === editedProject.name)
          .flatMap((p: any) => p.subActivities ?? []);

        const travelHrs = projectActivities
          .filter((a: any) => a.type === 'travel')
          .reduce((s: number, a: any) => s + subHours(a.siteStart, a.siteFinish), 0);
        const pouringHrs = projectActivities
          .filter((a: any) => a.type === 'pouring')
          .reduce((s: number, a: any) => s + subHours(a.siteStart, a.siteFinish), 0);
        const nonPouringHrs = projectActivities
          .filter((a: any) => a.type === 'non-pouring')
          .reduce((s: number, a: any) => s + subHours(a.siteStart, a.siteFinish), 0);

        return {
          id: row.id,
          date: row.date,
          status: row.status,
          pump: '-',
          employeeName: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
          employeeDbId: row.employee_id,
          hours: calculateHours(entry),
          activities: { travel: travelHrs, pouring: pouringHrs, nonPouring: nonPouringHrs },
          entryData: { ...entry, id: row.id, date: row.date, status: row.status,
            referenceNumber: row.reference_number ?? undefined,
            employeeName: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown' } as TimeEntry,
        };
      });

      setWorkHistory(rows);
      setLoadingHistory(false);
    }

    fetchHistory();
  }, [editedProject.name, calculateHours]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value?: string) => value || 'Not set';

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProject(project.id, formData);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    // Update local state immediately so the view reflects the saved values
    const merged = {
      ...editedProject,
      name: (formData.get('name') as string)?.trim() || editedProject.name,
      client: (formData.get('clientName') as string)?.trim() || editedProject.client,
      address: (formData.get('address') as string)?.trim() || editedProject.address,
      state: (formData.get('state') as string) || editedProject.state,
      projectValue: (formData.get('projectValue') as string) || editedProject.projectValue,
      status: (formData.get('status') as string) || editedProject.status,
    };
    setEditedProject(merged);
    onUpdate?.(merged);
    router.refresh();
    setIsEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteProject(project.id);
    setDeleting(false);
    if (!result.success) { setError(result.error); return; }
    onDeleted?.();
    router.refresh();
    onBack();
  }

  return (
    <div className="p-4 pb-24">
      {openEntry && (
        <TimeEntryEditorModal
          initialEntry={openEntry.entryData}
          employeeDbId={openEntry.employeeDbId}
          activeProjects={[]}
          viewOnly={true}
          onClose={() => setOpenEntry(null)}
          onDeleted={() => {
            setWorkHistory(prev => prev.filter(r => r.id !== openEntry.id));
            setOpenEntry(null);
          }}
        />
      )}
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 gap-2 cursor-pointer">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {!isEditing ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-gray-900">{editedProject.name}</h1>
                  <Badge variant="outline" className={`${getStatusColor(editedProject.status)} text-xs capitalize`}>
                    {editedProject.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">{editedProject.client || 'No client'}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {(editedProject.address || editedProject.state) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {[editedProject.address, editedProject.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Project Value: <span className="text-gray-900">{formatCurrency(editedProject.projectValue)}</span></span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      <button
                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-900">Edit Project</h2>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditedProject(project); setIsEditing(false); setError(null); }} className="gap-2 cursor-pointer">
                  <X className="w-4 h-4" />Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Project Name *</label>
              <input name="name" required defaultValue={editedProject.name}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Client</label>
              <input name="clientName" defaultValue={editedProject.client === 'TBD' ? '' : editedProject.client}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Client name" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Location</label>
                <input name="address" defaultValue={editedProject.address}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Suburb" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">State</label>
                <select name="state" defaultValue={editedProject.state || ''}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer">
                  <option value="">Select state</option>
                  <option value="QLD">QLD</option>
                  <option value="NSW">NSW</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Project Value</label>
                <select name="projectValue" defaultValue={editedProject.projectValue || ''}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer">
                  <option value="">Select value</option>
                  {PROJECT_VALUE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select name="status" defaultValue={editedProject.status}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <div className="pt-2 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete project
                </button>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-red-700 font-medium">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      Cancel
                    </button>
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Tab toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-4">
        <div className="bg-gray-100 rounded-xl p-1 flex">
          {(['history', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'history' ? 'Work History' : 'Statistics'}
            </button>
          ))}
        </div>
      </div>

      {/* Work History tab */}
      {activeTab === 'history' && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

        {loadingHistory ? (
          <div className="flex items-center justify-center py-10 gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : workHistory.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">No work history yet</div>
        ) : (
          <>
            {/* Mobile layout */}
            <div className="md:hidden divide-y divide-gray-100">
              {workHistory.map((row) => (
                <button key={row.id} onClick={() => setOpenEntry(row)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{row.employeeName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-AU', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-gray-700">{row.hours.toFixed(1)}h</span>
                      <HistoryStatusBadge status={row.status} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                    {row.activities.travel > 0 && (
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3" />Travel {row.activities.travel.toFixed(1)}h
                      </span>
                    )}
                    {row.activities.pouring > 0 && (
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" />Pouring {row.activities.pouring.toFixed(1)}h
                      </span>
                    )}
                    {row.activities.nonPouring > 0 && (
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3 h-3" />Non-Pouring {row.activities.nonPouring.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop layout */}
            <div className="hidden md:block">
              <div className="grid grid-cols-12 gap-3 bg-gray-50 px-4 py-2.5 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Employee</div>
                <div className="col-span-1">Pump</div>
                <div className="col-span-4">Activities</div>
                <div className="col-span-1 text-right">Hours</div>
                <div className="col-span-2 text-right">Status</div>
              </div>
              <div className="divide-y divide-gray-100">
                {workHistory.map((row) => (
                  <button key={row.id} onClick={() => setOpenEntry(row)}
                    className="w-full grid grid-cols-12 gap-3 items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left cursor-pointer">
                    <div className="col-span-2 text-gray-600">
                      {new Date(row.date + 'T00:00:00').toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </div>
                    <div className="col-span-2 text-gray-900">{row.employeeName}</div>
                    <div className="col-span-1 text-gray-400 text-xs">{row.pump}</div>
                    <div className="col-span-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      {row.activities.travel > 0 && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-gray-400" />Travel {row.activities.travel.toFixed(1)}h
                        </span>
                      )}
                      {row.activities.pouring > 0 && (
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-gray-400" />Pouring {row.activities.pouring.toFixed(1)}h
                        </span>
                      )}
                      {row.activities.nonPouring > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-gray-400" />Non-Pouring {row.activities.nonPouring.toFixed(1)}h
                        </span>
                      )}
                      {row.activities.travel === 0 && row.activities.pouring === 0 && row.activities.nonPouring === 0 && (
                        <span className="text-gray-300">—</span>
                      )}
                    </div>
                    <div className="col-span-1 text-right text-gray-700">{row.hours.toFixed(1)}</div>
                    <div className="col-span-2 flex justify-end">
                      <HistoryStatusBadge status={row.status} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* Statistics tab */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <div className="text-[#374151] text-xl font-bold">{workHistory.length}</div>
                <div className="text-gray-500 text-xs mt-0.5">Total Entries</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <div className="text-[#374151] text-xl font-bold">
                  {new Set(workHistory.map(r => r.employeeName)).size}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">Employees</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                <div className="text-[#374151] text-xl font-bold">
                  {workHistory.reduce((s, r) => s + r.hours, 0).toFixed(1)}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">Total Hours</div>
              </div>
            </div>
          </div>

          {(() => {
            const map: Record<string, number> = {};
            workHistory.forEach(r => {
              if (r.status === 'submitted' || r.status === 'approved') {
                map[r.date] = (map[r.date] ?? 0) + r.hours;
              }
            });
            return (
              <>
                <div className="md:hidden">
                  <WorkHeatmap hoursData={map} weeksCount={13} />
                </div>
                <div className="hidden md:block">
                  <WorkHeatmap hoursData={map} weeksCount={52} />
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
