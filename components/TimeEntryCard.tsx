"use client"
import { Clock, MoreVertical, Plus, Trash2, X, Utensils, CloudRain, Check, Briefcase, Truck, Plane, Car, Droplet, Hammer, AlertTriangle, ChevronRight } from 'lucide-react';
import { TimeEntry, Project, SubActivity } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { FileCheck } from 'lucide-react';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';
import { SubActivitySection } from './SubActivitySection';
import { TimePicker } from './ui/TimePicker';

interface TimeEntryCardProps {
  entry: TimeEntry;
  activeProjects: string[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TimeEntry['status']) => void;
  onAddProject: (entryId: string, type?: 'project' | 'yardwork' | 'leave') => void;
  onDeleteProject: (entryId: string, projectId: string) => void;
  onUpdateProject: (entryId: string, projectId: string, updatedProject: Partial<Project>) => void;
  onUpdateEntry: (entryId: string, updatedEntry: Partial<TimeEntry>) => void;
  onAddSubActivity: (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel') => void;
  onUpdateSubActivity: (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: Partial<SubActivity>) => void;
  onDeleteSubActivity: (entryId: string, projectId: string, subActivityId: string) => void;
  /** Open the edit modal immediately on mount (e.g. when launched from another page) */
  defaultOpen?: boolean;
  /** Start in view mode even when defaultOpen is true */
  defaultEditMode?: boolean;
  /** Open the summary ticket immediately on mount instead of the edit modal */
  defaultSummaryOpen?: boolean;
  /** Hide the collapsed day-header tile — useful when the card is embedded in a standalone modal */
  hideHeader?: boolean;
  /** Called when the modal is closed — lets parent wrappers know to unmount */
  onModalClose?: () => void;
  /** Projects grouped by state for the QLD/NSW toggle filter */
  projectsByState?: { QLD: string[]; NSW: string[] };
}

export function TimeEntryCard({ entry, activeProjects, projectsByState, onDelete, onStatusChange, onAddProject, onDeleteProject, onUpdateProject, onUpdateEntry, onAddSubActivity, onUpdateSubActivity, onDeleteSubActivity, defaultOpen = false, defaultEditMode, defaultSummaryOpen = false, hideHeader = false, onModalClose }: TimeEntryCardProps) {
  const [showModal, setShowModal] = useState(defaultOpen);
  const [showSummaryModal, setShowSummaryModal] = useState(defaultSummaryOpen);
  const [isEditMode, setIsEditMode] = useState(defaultEditMode ?? defaultOpen);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [wasSubmittedWhenEditStarted, setWasSubmittedWhenEditStarted] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<'QLD' | 'NSW'>('QLD');
  const prevProjectsLengthRef = useRef(entry.projects.length);

  // Auto-open detail modal when a new project is added
  useEffect(() => {
    if (entry.projects.length > prevProjectsLengthRef.current) {
      const lastProject = entry.projects[entry.projects.length - 1];
      if (lastProject) setSelectedProjectId(lastProject.id);
    }
    prevProjectsLengthRef.current = entry.projects.length;
  }, [entry.projects.length]);

  const handleToggleExpanded = () => {
    if (entry.status === 'submitted' && !isEditMode) {
      setShowSummaryModal(true);
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowDeleteConfirm(false);
    onModalClose?.();
  };

  // Mark that edits have been made (used to determine if signature is needed for re-opened cards)
  const markAsEdited = () => {
    if (wasSubmittedWhenEditStarted && !hasBeenEdited) {
      setHasBeenEdited(true);
    }
  };

  // Wrapper functions that mark edits
  const handleUpdateEntry = (entryId: string, updates: Partial<TimeEntry>) => {
    markAsEdited();
    onUpdateEntry(entryId, updates);
  };

  const handleUpdateProject = (entryId: string, projectId: string, updatedProject: Partial<Project>) => {
    markAsEdited();
    onUpdateProject(entryId, projectId, updatedProject);
  };

  const handleAddProject = (entryId: string, type?: 'project' | 'yardwork' | 'leave') => {
    markAsEdited();
    onAddProject(entryId, type);
  };

  const handleDeleteProject = (entryId: string, projectId: string) => {
    markAsEdited();
    onDeleteProject(entryId, projectId);
  };

  const handleAddSubActivity = (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel') => {
    markAsEdited();
    onAddSubActivity(entryId, projectId, type);
  };

  const handleUpdateSubActivity = (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: Partial<SubActivity>) => {
    markAsEdited();
    onUpdateSubActivity(entryId, projectId, subActivityId, updatedSubActivity);
  };

  const handleDeleteSubActivity = (entryId: string, projectId: string, subActivityId: string) => {
    markAsEdited();
    onDeleteSubActivity(entryId, projectId, subActivityId);
  };

  const handleUpdateLunchTime = (entryId: string, projectId: string, lunchTime: string) => {
    markAsEdited();
    onUpdateProject(entryId, projectId, { lunchTime });
  };

  const handleDeleteLunch = (entryId: string, projectId: string) => {
    markAsEdited();
    onUpdateProject(entryId, projectId, { 
      lunch: false,
      lunchTime: undefined
    });
  };

  const calculateLeaveHours = (start: string | undefined, finish: string | undefined) => {
    if (!start || !finish) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [finishHour, finishMin] = finish.split(':').map(Number);
    const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
    const roundToQuarterHour = (hours: number) => Math.floor(hours * 4) / 4;
    return roundToQuarterHour(Math.max(0, hours));
  };
  
  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dayName}, ${formattedDate}`;
  };

  const getStatusColor = (status: TimeEntry['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-500 text-white';
      case 'submitted':
        return 'bg-[#030213] text-white';
      case 'approved':
        return 'bg-green-500 text-white';
    }
  };

  const hasDraftData = entry.status === 'draft' && (!!entry.depotStart || entry.projects.length > 0);

  const getStatusLabel = (status: TimeEntry['status']) => {
    if (status === 'submitted') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const projectOptions = ['***Unknown Project***', ...activeProjects];

  const hourOptions = Array.from({ length: 25 }, (_, i) => i * 0.5);

  // Helper function to round down to nearest 0.25 increment
  const roundToQuarterHour = (hours: number) => {
    return Math.floor(hours * 4) / 4;
  };

  const totalHours = (() => {
    // Determine effective start time
    let effectiveStart = entry.depotStart;
    if (!effectiveStart) {
      // Find earliest site start or weather start
      const allStartTimes: string[] = [];
      entry.projects.forEach(project => {
        if (project.siteStart) allStartTimes.push(project.siteStart);
        if (project.weather && project.weatherStart) allStartTimes.push(project.weatherStart);
      });
      if (allStartTimes.length > 0) {
        effectiveStart = allStartTimes.sort()[0]; // Sort to get earliest time
      }
    }

    // Determine effective finish time
    let effectiveFinish = entry.depotFinish;
    if (!effectiveFinish) {
      // Find latest site finish or weather end
      const allFinishTimes: string[] = [];
      entry.projects.forEach(project => {
        if (project.siteFinish) allFinishTimes.push(project.siteFinish);
        if (project.weather && project.weatherEnd) allFinishTimes.push(project.weatherEnd);
      });
      if (allFinishTimes.length > 0) {
        effectiveFinish = allFinishTimes.sort().reverse()[0]; // Sort reverse to get latest time
      }
    }

    // If we still don't have both times, return 0
    if (!effectiveStart || !effectiveFinish) return 0;
    
    const [startHour, startMin] = effectiveStart.split(':').map(Number);
    const [finishHour, finishMin] = effectiveFinish.split(':').map(Number);
    const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
    
    // Check if any project has lunch selected
    const hasLunch = entry.projects.some(project => project.lunch);
    
    // Subtract 30 minutes (0.5 hours) if lunch is selected
    const totalHours = Math.max(0, hours - (hasLunch ? 0.5 : 0));
    
    // Round down to nearest 0.25 increment
    return roundToQuarterHour(totalHours);
  })();

  const calculateWeatherHours = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startTotal = startHour + startMin / 60;
    const endTotal = endHour + endMin / 60;
    const hours = Math.max(0, endTotal - startTotal);
    // Round down to nearest 0.25 increment
    return roundToQuarterHour(hours);
  };

  // Check if the entry is locked (submitted but not in edit mode)
  const isLocked = entry.status === 'submitted' && !isEditMode;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200 md:rounded-xl md:flex md:flex-col">
      {/* Day Header - Clickable to open modal */}
      <div
        onClick={handleToggleExpanded}
        className="transition-colors cursor-pointer bg-gray-200 hover:bg-gray-300
          /* Mobile: horizontal row */
          px-4 py-3 flex justify-between items-center
          /* Desktop: vertical column tile */
          md:flex-col md:items-center md:justify-between md:px-3 md:py-4 md:min-h-[140px] md:text-center md:flex-1"
      >
        {/* Day name + date */}
        <div className="flex items-center gap-3 md:flex-col md:gap-1 md:items-center">
          <Clock className="w-5 h-5 text-gray-700 md:hidden" />
          <div className="md:text-center">
            <div className="text-gray-900 font-medium md:text-sm">
              {/* Mobile: full day name. Desktop: 3-letter abbrev */}
              <span className="md:hidden">{formatDate(entry.date).split(',')[0]}</span>
              <span className="hidden md:inline">{formatDate(entry.date).split(',')[0].slice(0, 3)}</span>
            </div>
            <div className="text-xs text-gray-600">
              {/* Mobile: "Mar 3, 2026". Desktop: just "3 Mar" */}
              <span className="md:hidden">{formatDate(entry.date).split(',')[1]}</span>
              <span className="hidden md:inline">
                {(() => {
                  const [y, m, d] = entry.date.split('-').map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="text-sm text-gray-900 md:text-base md:font-semibold">
          {totalHours > 0 ? `${totalHours} hrs` : <span className="text-gray-400 text-xs">—</span>}
        </div>

        {/* Reference number (submitted cards only) */}
        {entry.timeCardNumber && (
          <div className="text-[10px] text-gray-400 font-mono hidden md:block">{entry.timeCardNumber}</div>
        )}

        {/* Status badge */}
        {(hasDraftData || entry.status === 'submitted' || entry.status === 'approved') && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
            {getStatusLabel(entry.status)}
          </span>
        )}
      </div>


      {/* Summary Modal */}
      <TimeCardSummaryModal
        entry={entry}
        isOpen={showSummaryModal}
        onClose={() => { setShowSummaryModal(false); onModalClose?.(); }}
        onSubmit={(signature) => {
          onStatusChange(entry.id, 'submitted');
          setShowSummaryModal(false);
          setIsEditMode(false);
          setWasSubmittedWhenEditStarted(false);
          setHasBeenEdited(false);
        }}
        onEdit={entry.status === 'submitted' ? () => {
          setIsEditMode(true);
          setWasSubmittedWhenEditStarted(true);
          setHasBeenEdited(false);
          setShowSummaryModal(false);
          setShowModal(true);
        } : undefined}
        onDelete={entry.status === 'submitted' ? () => {
          setShowSummaryModal(false);
          onDelete(entry.id);
        } : undefined}
        viewOnly={entry.status === 'submitted' && !isEditMode}
        shouldShowSignature={!wasSubmittedWhenEditStarted || hasBeenEdited}
      />

      {/* Time Card Modal - Full screen mobile, centered overlay desktop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center">
          {/* Desktop backdrop */}
          <div className="absolute inset-0 bg-black/50 hidden md:block" onClick={handleCloseModal} />
          {/* Panel */}
          <div className="relative bg-white w-full md:max-w-4xl md:rounded-2xl md:shadow-2xl flex flex-col z-10 h-full md:h-auto md:max-h-[95vh]">
          {/* Modal Header */}
          <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-100 md:rounded-t-2xl shrink-0">
            <div>
              <div className="text-gray-900">{formatDate(entry.date).split(',')[0]}</div>
              <div className="text-xs text-gray-600">{formatDate(entry.date).split(',')[1]}</div>
              {entry.timeCardNumber && (
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{entry.timeCardNumber}</div>
              )}
            </div>
            {entry.projects.length > 0 && entry.status !== 'draft' && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                {getStatusLabel(entry.status)}
              </span>
            )}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-900">{totalHours} hrs</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCloseModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-4" onClick={markAsEdited}>
            {/* Depot Section - Always visible by default */}
            <div className="mb-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 text-center">Sign On</label>
                    <TimePicker
                      value={entry.depotStart ?? ''}
                      onChange={(v) => handleUpdateEntry(entry.id, { depotStart: v })}
                      disabled={isLocked}
                      className="justify-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 text-center">Sign Off</label>
                    <TimePicker
                      value={entry.depotFinish ?? ''}
                      onChange={(v) => handleUpdateEntry(entry.id, { depotFinish: v })}
                      disabled={isLocked}
                      className="justify-center"
                    />
                  </div>
                  <div className="hidden">
                    <Input
                      id={`depotHours-mobile-${entry.id}`}
                      type="text"
                      value={(() => {
                        if (!entry.depotStart || !entry.depotFinish) return '0.00';
                        const [startHour, startMin] = entry.depotStart.split(':').map(Number);
                        const [finishHour, finishMin] = entry.depotFinish.split(':').map(Number);
                        const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
                        return Math.max(0, hours).toFixed(2);
                      })()}
                      className="h-14 bg-white text-center"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Projects List - Compact summary cards */}
            {entry.projects.length > 0 && (
              <div className="space-y-2 mb-3">
                {entry.projects.map((project) => {
                  // Calculate hours for display
                  let hours = 0;
                  if (project.type === 'leave') {
                    hours = parseFloat(project.leaveTotalHours || '0');
                  } else if ((project.subActivities || []).length > 0) {
                    // Sum sub-activity durations (project type)
                    hours = (project.subActivities || []).reduce((sum, sa) => {
                      if (!sa.start || !sa.finish) return sum;
                      const [sh, sm] = sa.start.split(':').map(Number);
                      const [fh, fm] = sa.finish.split(':').map(Number);
                      return sum + Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
                    }, 0);
                    if (project.lunch) hours = Math.max(0, hours - 0.5);
                  } else if (project.siteStart && project.siteFinish) {
                    // Yard work or legacy entries using site times
                    const [sh, sm] = project.siteStart.split(':').map(Number);
                    const [fh, fm] = project.siteFinish.split(':').map(Number);
                    hours = Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
                    if (project.lunch) hours = Math.max(0, hours - 0.5);
                  }

                  const label = project.type === 'leave'
                    ? (project.leaveType || 'Leave')
                    : project.type === 'yardwork'
                    ? (project.project || 'Yard Work')
                    : (project.project || 'Project');

                  const typeLabel = project.type === 'leave' ? '🏖️ Leave'
                    : project.type === 'yardwork' ? '🚛 Yard Work'
                    : '📋 Project';

                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{typeLabel}</div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{hours > 0 ? `${hours.toFixed(2)} hrs` : '--'}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add Project Buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleAddProject(entry.id)}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Project</span>
              </button>
              <button
                onClick={() => handleAddProject(entry.id, 'yardwork')}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Yard Work</span>
              </button>
              <button
                onClick={() => handleAddProject(entry.id, 'leave')}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plane className="w-4 h-4 shrink-0" />
                <span>Leave</span>
              </button>
            </div>

            {/* Submit Button */}
            {/* Remarks */}
            {!isLocked && (
              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Any extra info about today's work..."
                  value={entry.remarks ?? ''}
                  disabled={isLocked}
                  onChange={(e) => onUpdateEntry(entry.id, { remarks: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white text-gray-800 placeholder-gray-400"
                />
              </div>
            )}

            {entry.status !== 'submitted' && entry.status !== 'approved' && (
              <Button
                variant="outline"
                className="w-full mt-4 !bg-white hover:!bg-gray-50 !text-gray-900 !border-2 !border-gray-400 cursor-pointer font-semibold"
                onClick={() => {
                  handleCloseModal();
                  setShowSummaryModal(true);
                }}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Submit
              </Button>
            )}
            
            {/* Done Editing Button - Visible when in edit mode */}
            {isEditMode && (
              <Button
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                onClick={() => {
                  setIsEditMode(false);
                  setShowModal(false);
                  setShowSummaryModal(true);
                }}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Done Editing
              </Button>
            )}

            {/* Delete time card */}
            {!isLocked && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 cursor-pointer w-full justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete time card
                  </button>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-red-700 font-medium">Delete this time card?</p>
                    <p className="text-xs text-gray-500">This cannot be undone.</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 cursor-pointer"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        onClick={() => {
                          handleCloseModal();
                          onDelete(entry.id);
                        }}
                      >
                        Yes, delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Layer 2 - Project Detail Modal */}
          {selectedProjectId && (() => {
            const project = entry.projects.find(p => p.id === selectedProjectId);
            if (!project) return null;

            const projectOptions = ['***Unknown Project***', ...activeProjects];
            const getProjectOptions = () => project.type === 'yardwork'
              ? ['Clean Pump', 'Inspections', 'Maintenance', 'Organize Yard', 'Equipment Prep for Site', 'Deliveries', 'Other']
              : projectOptions;


            const typeTitle = project.type === 'leave' ? 'Leave'
              : project.type === 'yardwork' ? 'Yard Work'
              : 'Project';

            return (
              <div className="absolute inset-0 z-10 flex flex-col bg-white md:rounded-2xl">
                {/* Layer 2 Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-gray-50 shrink-0 md:rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProjectId(null)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <span className="text-sm font-medium text-gray-700">|</span>
                    <span className="text-sm font-medium text-gray-900">{typeTitle}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!isLocked) onDeleteProject(entry.id, project.id);
                      setSelectedProjectId(null);
                    }}
                    className="text-red-400 hover:text-red-600 text-xs cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                {/* Depot time reference bar */}
                {(entry.depotStart || entry.depotFinish) && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-center gap-3 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span className="text-xs text-gray-400">
                      Sign On: <span className="font-medium text-gray-400">{entry.depotStart || '--'}</span>
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">
                      Sign Off: <span className="font-medium text-gray-400">{entry.depotFinish || '--'}</span>
                    </span>
                  </div>
                )}

                {/* Layer 2 Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                  {/* Leave form */}
                  {project.type === 'leave' && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Leave Type</label>
                        <Select
                          value={project.leaveType || ''}
                          className="h-12 text-base w-full font-bold"
                          onChange={(e) => onUpdateProject(entry.id, project.id, { leaveType: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">Select Leave Type</option>
                          <option value="Unpaid Leave">Unpaid Leave</option>
                          <option value="Annual Leave">Annual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="RDO">RDO</option>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 text-center">Start</label>
                          <TimePicker
                            value={project.leaveStart || ''}
                            onChange={(v) => {
                              const calc = calculateLeaveHours(v, project.leaveFinish);
                              onUpdateProject(entry.id, project.id, { leaveStart: v, leaveTotalHours: calc > 0 ? calc.toString() : project.leaveTotalHours });
                            }}
                            disabled={isLocked}
                            className="justify-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1 text-center">Finish</label>
                          <TimePicker
                            value={project.leaveFinish || ''}
                            onChange={(v) => {
                              const calc = calculateLeaveHours(project.leaveStart, v);
                              onUpdateProject(entry.id, project.id, { leaveFinish: v, leaveTotalHours: calc > 0 ? calc.toString() : project.leaveTotalHours });
                            }}
                            disabled={isLocked}
                            className="justify-center"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1 text-center">Total Hours</label>
                        <Select
                          value={project.leaveTotalHours || ''}
                          className="h-12 text-base w-full text-center"
                          onChange={(e) => onUpdateProject(entry.id, project.id, { leaveTotalHours: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">Select...</option>
                          {[0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25,3.5,3.75,4,4.25,4.5,4.75,5,5.25,5.5,5.75,6,6.25,6.5,6.75,7,7.25,7.5,7.75,8,8.25,8.5,8.75,9,9.25,9.5,9.75,10,10.25,10.5,10.75,11,11.25,11.5,11.75,12].map(h => (
                            <option key={h} value={h.toString()}>{h} {h === 1 ? 'hr' : 'hrs'}</option>
                          ))}
                        </Select>
                      </div>
                    </>
                  )}

                  {/* Project / Yard Work form */}
                  {(project.type === 'project' || project.type === 'yardwork') && (
                    <>
                      {project.type === 'project' ? (
                        <div className="space-y-3">
                          {/* Project dropdown + QLD/NSW toggle */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Project Name</label>
                            <div className="flex gap-2 items-center">
                              <Select
                                value={project.project || ''}
                                className="flex-1 h-11 text-sm font-semibold cursor-pointer !border !border-gray-300 !bg-white"
                                onChange={(e) => onUpdateProject(entry.id, project.id, { project: e.target.value })}
                                disabled={isLocked}
                              >
                                <option value="">Select Project</option>
                                {(projectsByState
                                  ? (stateFilter === 'QLD' ? projectsByState.QLD : projectsByState.NSW)
                                  : activeProjects
                                ).map(p => <option key={p} value={p}>{p}</option>)}
                              </Select>
                              {projectsByState && (
                                <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                                  {(['QLD', 'NSW'] as const).map(s => (
                                    <button
                                      key={s}
                                      onClick={() => setStateFilter(s)}
                                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${stateFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sub-activity cards */}
                          {(project.subActivities || []).length > 0 && (
                            <div className="space-y-3">
                              {(project.subActivities || []).map((sa) => {
                                const isTravel = sa.type === 'travel';
                                const isPouring = sa.type === 'pouring';
                                const pouringOptions = ['Mobile', 'Placing Boom / Skid Pump'];
                                const nonPouringOptions = ['Clean Pump', 'Installation Boom', 'Installation Pump', 'Installation Other', 'Dismantle Boom', 'Dismantle Pump', 'Dismantle Other', 'Climb Boom', 'Preparation to Climb Boom', 'Pipeline Installation', 'Pipeline Relocation', 'Transfer Line Relocation', 'Install HD Bolts', 'Install Crucifix/Base', 'Maintenance', 'Inspections'];
                                const ActivityIcon = isTravel ? Car : isPouring ? Droplet : Hammer;
                                const activityLabel = isTravel ? 'Travel' : isPouring ? 'Pouring' : 'Non-Pouring';
                                return (
                                  <div key={sa.id} className="border border-gray-200 rounded-xl bg-gray-50 p-3 space-y-2 md:rounded-lg md:p-2 md:space-y-0 md:flex md:items-center md:gap-4">

                                    {/* ── Mobile header: centered label + absolute delete ── */}
                                    <div className="relative flex items-center justify-center md:hidden">
                                      <div className="flex items-center gap-1.5 text-gray-700">
                                        <ActivityIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{activityLabel}</span>
                                      </div>
                                      {!isLocked && (
                                        <button onClick={() => handleDeleteSubActivity(entry.id, project.id, sa.id)} className="absolute right-0 text-red-400 hover:text-red-600 cursor-pointer">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>

                                    {/* ── Desktop label (fixed width) ── */}
                                    <div className="hidden md:flex items-center gap-1 text-gray-600 w-28 shrink-0">
                                      <ActivityIcon className="w-3 h-3 shrink-0" />
                                      <span className="text-xs font-medium">{activityLabel}</span>
                                    </div>

                                    {/* ── Type dropdown ── */}
                                    {!isTravel ? (
                                      <Select
                                        value={sa.activityType || ''}
                                        className="h-10 text-sm w-full md:h-8 md:text-xs md:flex-1 md:min-w-0"
                                        onChange={(e) => handleUpdateSubActivity(entry.id, project.id, sa.id, { activityType: e.target.value })}
                                        disabled={isLocked}
                                      >
                                        <option value="">Select type...</option>
                                        {(isPouring ? pouringOptions : nonPouringOptions).map(o => <option key={o} value={o}>{o}</option>)}
                                      </Select>
                                    ) : (
                                      <div className="hidden md:block md:flex-1" />
                                    )}

                                    {/* ── Start / Finish — mobile: 2-col grid with labels; desktop: compact inline ── */}
                                    <div className="grid grid-cols-2 gap-2 md:hidden">
                                      <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 text-center">Start</label>
                                        <TimePicker value={sa.start || ''} onChange={(v) => handleUpdateSubActivity(entry.id, project.id, sa.id, { start: v })} disabled={isLocked} className="justify-center" />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-gray-400 mb-1 text-center">Finish</label>
                                        <TimePicker value={sa.finish || ''} onChange={(v) => handleUpdateSubActivity(entry.id, project.id, sa.id, { finish: v })} disabled={isLocked} className="justify-center" />
                                      </div>
                                    </div>
                                    <div className="hidden md:flex md:items-center md:gap-4 md:shrink-0">
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-[10px] text-gray-400">Start</span>
                                        <TimePicker value={sa.start || ''} onChange={(v) => handleUpdateSubActivity(entry.id, project.id, sa.id, { start: v })} disabled={isLocked} compact />
                                      </div>
                                      <span className="text-gray-300 text-sm mt-3">→</span>
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-[10px] text-gray-400">Finish</span>
                                        <TimePicker value={sa.finish || ''} onChange={(v) => handleUpdateSubActivity(entry.id, project.id, sa.id, { finish: v })} disabled={isLocked} compact />
                                      </div>
                                    </div>

                                    {/* ── Desktop delete ── */}
                                    {!isLocked && (
                                      <button onClick={() => handleDeleteSubActivity(entry.id, project.id, sa.id)} className="hidden md:block text-red-400 hover:text-red-600 cursor-pointer shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Activity buttons — always visible below any cards */}
                          {!isLocked && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Add Activity</p>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => handleAddSubActivity(entry.id, project.id, 'travel')}
                                  className="flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                                >
                                  <Car className="w-4 h-4 shrink-0" />
                                  <span>Travel</span>
                                </button>
                                <button
                                  onClick={() => handleAddSubActivity(entry.id, project.id, 'pouring')}
                                  className="flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                                >
                                  <Droplet className="w-4 h-4 shrink-0" />
                                  <span>Pouring</span>
                                </button>
                                <button
                                  onClick={() => handleAddSubActivity(entry.id, project.id, 'non-pouring')}
                                  className="flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                                >
                                  <Hammer className="w-4 h-4 shrink-0" />
                                  <span>Non-Pouring</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Yard work type dropdown */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Yard Work Type</label>
                            <Select
                              value={project.project || ''}
                              className="h-11 text-sm w-full font-semibold cursor-pointer !border !border-gray-300 !bg-white"
                              onChange={(e) => onUpdateProject(entry.id, project.id, { project: e.target.value })}
                              disabled={isLocked}
                            >
                              <option value="">Select Yard Work Type</option>
                              {getProjectOptions().map(p => <option key={p} value={p}>{p}</option>)}
                            </Select>
                          </div>

                          {/* Start / Finish times */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1 text-center">Start</label>
                              <TimePicker
                                value={project.siteStart || ''}
                                onChange={(v) => onUpdateProject(entry.id, project.id, { siteStart: v })}
                                disabled={isLocked}
                                className="justify-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1 text-center">Finish</label>
                              <TimePicker
                                value={project.siteFinish || ''}
                                onChange={(v) => onUpdateProject(entry.id, project.id, { siteFinish: v })}
                                disabled={isLocked}
                                className="justify-center"
                              />
                            </div>
                          </div>

                          {/* Lunch toggle */}
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Options</p>
                            <button
                              onClick={() => onUpdateProject(entry.id, project.id, { lunch: !project.lunch })}
                              disabled={isLocked}
                              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${project.lunch ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                            >
                              <Utensils className="w-4 h-4 shrink-0" />
                              <span>Lunch</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Options — Lunch / Lunch Penalty / Inclement Weather */}
                      {project.type === 'project' && (
                        <div className="space-y-2">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Options</p>

                          {/* Toggle buttons row */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => onUpdateProject(entry.id, project.id, { lunch: !project.lunch })}
                              disabled={isLocked}
                              className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${project.lunch ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                            >
                              <Utensils className="w-4 h-4 shrink-0" />
                              <span>Lunch</span>
                            </button>
                            <button
                              onClick={() => onUpdateProject(entry.id, project.id, { lunchPenalty: !project.lunchPenalty })}
                              disabled={isLocked}
                              className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${project.lunchPenalty ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              <span>Lunch Penalty</span>
                            </button>
                            <button
                              onClick={() => onUpdateProject(entry.id, project.id, { weather: !project.weather })}
                              disabled={isLocked}
                              className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${project.weather ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                            >
                              <CloudRain className="w-4 h-4 shrink-0" />
                              <span>Weather</span>
                            </button>
                          </div>

                          {/* Lunch Penalty detail box */}
                          {project.lunchPenalty && (
                            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2">
                              <div className="flex items-center justify-center gap-1.5 text-gray-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">Lunch Penalty</span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1 text-center">Time</label>
                                <TimePicker
                                  value={project.lunchPenaltyTime || ''}
                                  onChange={(v) => onUpdateProject(entry.id, project.id, { lunchPenaltyTime: v })}
                                  disabled={isLocked}
                                  className="justify-center"
                                />
                              </div>
                            </div>
                          )}

                          {/* Inclement Weather detail box */}
                          {project.weather && (
                            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-3">
                              <div className="flex items-center justify-center gap-1.5 text-gray-700">
                                <CloudRain className="w-4 h-4" />
                                <span className="text-sm font-medium">Inclement Weather</span>
                              </div>
                              <Select
                                value={project.weatherType || ''}
                                className="h-10 text-sm w-full"
                                onChange={(e) => onUpdateProject(entry.id, project.id, { weatherType: e.target.value })}
                                disabled={isLocked}
                              >
                                <option value="">Select type...</option>
                                <option value="Rain">Rain</option>
                                <option value="Heat">Heat</option>
                                <option value="Air Quality">Air Quality</option>
                                <option value="Other">Other</option>
                              </Select>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-400 mb-1 text-center">Start</label>
                                  <TimePicker
                                    value={project.weatherStart || ''}
                                    onChange={(v) => onUpdateProject(entry.id, project.id, { weatherStart: v })}
                                    disabled={isLocked}
                                    className="justify-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-400 mb-1 text-center">End</label>
                                  <TimePicker
                                    value={project.weatherEnd || ''}
                                    onChange={(v) => onUpdateProject(entry.id, project.id, { weatherEnd: v })}
                                    disabled={isLocked}
                                    className="justify-center"
                                  />
                                </div>
                              </div>
                              <Input
                                placeholder="Appv By — Enter Name"
                                value={project.approvedBy || ''}
                                onChange={(e) => onUpdateProject(entry.id, project.id, { approvedBy: e.target.value })}
                                disabled={isLocked}
                                className="h-10 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      )}

                    </>
                  )}
                </div>

                {/* Layer 2 Footer - total hours + done */}
                <div className="p-4 border-t border-gray-100 shrink-0 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Total</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(() => {
                        let total = 0;
                        if (project.type === 'yardwork') {
                          if (project.siteStart && project.siteFinish) {
                            const [sh, sm] = project.siteStart.split(':').map(Number);
                            const [fh, fm] = project.siteFinish.split(':').map(Number);
                            total = Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
                          }
                        } else {
                          (project.subActivities || []).forEach(sa => {
                            if (sa.start && sa.finish) {
                              const [sh, sm] = sa.start.split(':').map(Number);
                              const [fh, fm] = sa.finish.split(':').map(Number);
                              total += Math.max(0, (fh * 60 + fm - sh * 60 - sm) / 60);
                            }
                          });
                        }
                        if (project.lunch) total -= 0.5;
                        return `${Math.max(0, total).toFixed(2)} hrs`;
                      })()}
                    </div>
                  </div>
                  <Button
                    className="flex-1 bg-gray-900 hover:bg-gray-700 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => setSelectedProjectId(null)}
                    disabled={project.type === 'yardwork' && !project.project}
                  >
                    Done
                  </Button>
                </div>
              </div>
            );
          })()}

          </div>
        </div>
      )}
    </div>
  );
}